import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { LatticeGlobalConfig, LATTICE_CHANNELS, CHORD_VOICE_CHANNELS, safe, VisualizerTelemetry, VisualizerBus, DEFAULT_LATTICE_CONFIG, resolveModulation } from './visuals/shared';
import { SensorMode } from '../../types';
import { evaluateTimeCrystal } from '../../services/kinematics/timeCrystal';
import { SENTIC_STATES, getEssenticRadius, getEssenticEnvelope, SenticEmotion } from '../../services/kinematics/senticForms';
import { getCardiacInterval } from '../../services/audio/HeartSynth';
import { getActiveColorWheelId } from '../../services/kinematics/color';

import { RenderPipelineContext } from './visuals/layers/pipelineTypes';
import { BackgroundLayer } from './visuals/layers/BackgroundLayer';
import { PhysicsLayer } from './visuals/layers/PhysicsLayer';
import { BreathLayer } from './visuals/layers/BreathLayer';
import { PostProcessLayer } from './visuals/layers/PostProcessLayer';
import { VISUALIZER_PLUGINS } from './visuals/VisualizerRegistry';

export interface LayoutConfig {
    mandala: { y: number; x: number; scale: number; };
    pacer: { y: number; x: number; scale: number; };
}

interface Props {
    audioEnabled: boolean;
    isPowered: boolean;
    updateAudio: (params: Record<string, unknown>) => void;
    triggerHeartPulse?: (time: number, data: Record<string, unknown>) => void;
    toggleAudio?: (e: React.MouseEvent) => void;
    loopDataRef: React.MutableRefObject<Record<string, unknown>>;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onDoubleTap?: () => void;
    onDragLeft?: (deltaY: number) => void;
    onDragRight?: (deltaY: number) => void;
    onCenterTap?: () => void;
    layoutConfig?: LayoutConfig;
    sensorMode?: SensorMode | null;
    telemetry?: VisualizerTelemetry | null; 
    bus?: VisualizerBus;
}

const DEFAULT_LAYOUT: LayoutConfig = {
    mandala: { y: 0.09, x: 0.00, scale: 0.75 },
    pacer: { y: 0.09, x: 0.00, scale: 0.75 }
};

interface PhysicsState {
    breathRadius: number;
    breathPhase: string;
    smoothedCoherence: number;
    bpm: number;
    effectiveConfig: LatticeGlobalConfig;
    hits: string[]; 
    now: number; 
    dt: number;
    senticSignal: number;
}

export const VisualizerCanvas = React.memo<Props>(({
    audioEnabled, isPowered, updateAudio, loopDataRef,
    onSwipeLeft, onSwipeRight, onDoubleTap, onDragLeft, onDragRight, onCenterTap,
    layoutConfig = DEFAULT_LAYOUT, telemetry, bus
}) => {
    const [renderError, setRenderError] = useState<Error | null>(null);

    const canvasGLRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const vignetteRef = useRef<HTMLDivElement>(null);
    
    const animationFrameRef = useRef(0);
    const physicsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const runPhysicsRef = useRef<(() => void) | null>(null);
    const lastRenderTimeRef = useRef(0);
    const lastPhysicsTimeRef = useRef(0);
    
    const layoutRef = useRef(layoutConfig);
    useEffect(() => { layoutRef.current = layoutConfig; }, [layoutConfig]);

    const visualAmplitudesRef = useRef<Map<string, number>>(new Map());
    const lensMemoryRef = useRef<Record<string, unknown>>({ modState: {}, tcSmoothed: 1.0, vibratoPhase: 0, lastPhaseVal: 0 });
    const smoothedCoherenceRef = useRef(0);
    const prevBreathPhaseRef = useRef<string>('IDLE');

    const audioDataRef = useRef<Uint8Array>(new Uint8Array(32)); 

    const audioPayloadRef = useRef<Record<string, unknown>>({
        now: 0, bpm: 60, pitchMultiplier: 1, binauralFreqs: {}, volumes: {}, mutes: {}, stackMutes: {},
        hits: [], currentAttack: 0.1, currentRelease: 0.5, snakeConfig: {}, heartHarmonicVols: [],
        heartHarmonicMutes: [], breathConfig: {}, isBreathActive: false, breathPhase: 'IDLE', breathRadius: 0,
        prevBreathPhase: 'IDLE', isApertureActive: false, modMap: {},
        smoothedCoh: 0, feedbackConfig: {}, baseAperture: 100, modulations: {}, immersionConfig: {},
        aetherConfig: {}, sensorMode: null, entrainmentMode: 'SYNCED', activeHarmonicIndex: -1,
        harmonicMasterVolume: 1.0, latticeMode: 'OVERTONE', isFeedbackActive: false,
        reverbConfig: {}, delayConfig: {}, natureConfig: {},
        signals: { breath: 0, binaural: 0, hr: 0, coh: 0, audio: 0, senticSignal: 0, currentVibratoRate: 7.83, vibratoEnvelope: 0 }
    });

    // Cache to diff structural (non-continuous) audio parameters and avoid broadcasting identical payloads at 60Hz
    const lastStructuralStateRef = useRef<{
        bpm: number;
        pitchMultiplier: number;
        binauralFreqs: unknown;
        volumes: unknown;
        mutes: unknown;
        stackMutes: unknown;
        hitsStr: string;
        currentAttack: number;
        currentRelease: number;
        snakeConfig: unknown;
        heartHarmonicVols: unknown;
        heartHarmonicMutes: unknown;
        breathConfig: unknown;
        isBreathActive: unknown;
        breathStartTime: unknown;
        isApertureActive: unknown;
        feedbackConfig: unknown;
        baseAperture: number;
        modulations: unknown;
        immersionConfig: unknown;
        aetherConfig: unknown;
        sensorMode: unknown;
        entrainmentMode: unknown;
        activeHarmonicIndex: unknown;
        harmonicMasterVolume: number;
        latticeMode: unknown;
        isFeedbackActive: unknown;
        reverbConfig: unknown;
        delayConfig: unknown;
        natureConfig: unknown;
        kickConfig: unknown;
        customFrequencies: unknown;
        masterVolume: unknown;
        masterEq: unknown;
        isMasterEqBypassed: unknown;
        chordGlideConfig: unknown;
        polyvagalConfig: unknown;
        isMusicMode: boolean;
        currentChordRootNote: unknown;
        currentChordRootFreq: unknown;
        hasDispatchedInitial: boolean;
    }>({
        bpm: -1,
        pitchMultiplier: -1,
        binauralFreqs: null,
        volumes: null,
        mutes: null,
        stackMutes: null,
        hitsStr: '',
        currentAttack: -1,
        currentRelease: -1,
        snakeConfig: null,
        heartHarmonicVols: null,
        heartHarmonicMutes: null,
        breathConfig: null,
        isBreathActive: null,
        breathStartTime: null,
        isApertureActive: null,
        feedbackConfig: null,
        baseAperture: -1,
        modulations: null,
        immersionConfig: null,
        aetherConfig: null,
        sensorMode: null,
        entrainmentMode: null,
        activeHarmonicIndex: null,
        harmonicMasterVolume: -1,
        latticeMode: null,
        isFeedbackActive: null,
        reverbConfig: null,
        delayConfig: null,
        natureConfig: null,
        kickConfig: null,
        customFrequencies: null,
        masterVolume: null,
        masterEq: null,
        isMasterEqBypassed: null,
        chordGlideConfig: null,
        polyvagalConfig: null,
        isMusicMode: false,
        currentChordRootNote: null,
        currentChordRootFreq: null,
        hasDispatchedInitial: false
    });

    useEffect(() => {
        if (!audioEnabled) {
            lastStructuralStateRef.current.hasDispatchedInitial = false;
        }
    }, [audioEnabled]);

    const physicsStateRef = useRef<PhysicsState>({
        breathRadius: 0, breathPhase: 'IDLE', smoothedCoherence: 0, bpm: 60,
        effectiveConfig: DEFAULT_LATTICE_CONFIG, hits: [], now: 0, dt: 0.016, senticSignal: 0
    });

    const [zoomScale, setZoomScale] = useState(1.0);
    const zoomScaleRef = useRef(1.0);
    const [showZoomBadge, setShowZoomBadge] = useState(false);
    const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchStartDistRef = useRef(0);
    const pinchStartZoomRef = useRef(1.0);
    const isPinchingRef = useRef(false);

    const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
    const lastTapTimeRef = useRef(0);
    const isDraggingRef = useRef<'LEFT' | 'RIGHT' | null>(null);

    const updateAudioRef = useRef(updateAudio);
    useEffect(() => { updateAudioRef.current = updateAudio; }, [updateAudio]);

    const telemetryRef = useRef(telemetry);
    useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);

    const triggerZoomFeedback = useCallback((newZoom: number) => {
        zoomScaleRef.current = newZoom;
        setZoomScale(newZoom);
        setShowZoomBadge(true);
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = setTimeout(() => setShowZoomBadge(false), 2200);
    }, []);

    const resetZoom = useCallback(() => {
        triggerZoomFeedback(1.0);
    }, [triggerZoomFeedback]);

    const adjustZoomByStep = useCallback((delta: number) => {
        const nextZoom = Math.min(4.0, Math.max(0.35, parseFloat((zoomScaleRef.current + delta).toFixed(2))));
        triggerZoomFeedback(nextZoom);
    }, [triggerZoomFeedback]);

    if (renderError) {
        throw renderError;
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;

        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try {
            (e.target as Element).setPointerCapture(e.pointerId);
        } catch {
            // Ignore capture error
        }

        // Multi-touch Pinch Initialization
        if (activePointersRef.current.size >= 2) {
            const pts = Array.from(activePointersRef.current.values());
            pinchStartDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            pinchStartZoomRef.current = zoomScaleRef.current;
            isPinchingRef.current = true;
            isDraggingRef.current = null;
            touchStartRef.current = null;
            return;
        }

        if (activePointersRef.current.size === 1) {
            touchStartRef.current = { x, y, time: Date.now() };
            if (x < width * 0.15) isDraggingRef.current = 'LEFT';
            else if (x > width * 0.85) isDraggingRef.current = 'RIGHT';
            else isDraggingRef.current = null;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (activePointersRef.current.has(e.pointerId)) {
            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // Multi-touch Pinch Gestures (Pinch-to-zoom and expand)
        if (isPinchingRef.current && activePointersRef.current.size >= 2) {
            const pts = Array.from(activePointersRef.current.values());
            const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            if (pinchStartDistRef.current > 10) {
                const factor = currentDist / pinchStartDistRef.current;
                const newZoom = Math.min(4.0, Math.max(0.35, pinchStartZoomRef.current * factor));
                triggerZoomFeedback(newZoom);
            }
            return;
        }

        if (!touchStartRef.current) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = e.clientY - rect.top;
        const deltaY = touchStartRef.current.y - y; 
        if (isDraggingRef.current === 'LEFT' && onDragLeft) { onDragLeft(deltaY); touchStartRef.current.y = y; }
        else if (isDraggingRef.current === 'RIGHT' && onDragRight) { onDragRight(deltaY); touchStartRef.current.y = y; }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        activePointersRef.current.delete(e.pointerId);
        try {
            (e.target as Element).releasePointerCapture(e.pointerId);
        } catch {
            // Ignore capture error
        }

        if (isPinchingRef.current) {
            if (activePointersRef.current.size < 2) {
                isPinchingRef.current = false;
            }
            touchStartRef.current = null;
            isDraggingRef.current = null;
            return;
        }

        if (!touchStartRef.current) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const startX = touchStartRef.current.x;
        const y = e.clientY - rect.top;
        const deltaX = x - startX;
        const timeDiff = Date.now() - touchStartRef.current.time;
        const dist = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - touchStartRef.current.y, 2));

        if (!isDraggingRef.current && Math.abs(deltaX) > 50 && timeDiff < 400) {
            if (deltaX > 0 && onSwipeRight) onSwipeRight();
            else if (deltaX < 0 && onSwipeLeft) onSwipeLeft();
        }
        
        if (dist < 10 && timeDiff < 200) {
            const { mandala } = layoutRef.current;
            const w = rect.width;
            const h = rect.height;
            const mCx = (w / 2) + (w * mandala.x);
            const mCy = (h / 2) - (h * mandala.y);
            const tapDist = Math.sqrt(Math.pow(x - mCx, 2) + Math.pow(y - mCy, 2));
            const hitRadius = Math.min(w, h) * 0.25; 

            if (tapDist < hitRadius && onCenterTap) {
                onCenterTap();
                lastTapTimeRef.current = 0; 
                touchStartRef.current = null;
                isDraggingRef.current = null;
                return;
            }

            const now = Date.now();
            if (now - lastTapTimeRef.current < 300) { 
                if (onDoubleTap) onDoubleTap(); 
                lastTapTimeRef.current = 0; 
            } else { 
                lastTapTimeRef.current = now; 
            }
        }
        touchStartRef.current = null;
        isDraggingRef.current = null;
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = -e.deltaY * 0.002;
        const newZoom = Math.min(4.0, Math.max(0.35, zoomScaleRef.current * (1 + delta)));
        triggerZoomFeedback(newZoom);
    };

    useEffect(() => {
        lastPhysicsTimeRef.current = performance.now();

        const runPhysics = () => {
            const nowTime = performance.now();
            const dt = Math.min(0.1, (nowTime - lastPhysicsTimeRef.current) / 1000);
            lastPhysicsTimeRef.current = nowTime;
            const now = nowTime / 1000; 

            const data = loopDataRef.current || {};
            if (data.isMasterPaused) {
                lastPhysicsTimeRef.current = nowTime;
                return;
            }
            const { 
                isSimulating = false, localBpm = 60, externalBpm = 0, mutes = {}, stackMutes = {}, volumes = {}, 
                attackTime = 0.1, releaseTime = 0.5, coherence = 0, reverbConfig, 
                isApertureActive = false, latticeConfig = {}, heartHarmonicVols = [], 
                heartHarmonicMutes = [], isBreathActive = false, kickConfig,
                binauralFreqs = {}, globalTranspose = 0, snakeConfig, 
                modulations = {}, feedbackConfig = {}, baseAperture = 100, immersionConfig = {}, 
                breathStartTime = 0, aetherConfig, entrainmentMode = 'SYNCED', activeHarmonicIndex = -1,
                harmonicMasterVolume = 1.0, latticeMode = 'OVERTONE', isFeedbackActive = false, delayConfig, natureConfig,
                sensorMode, macroA = 0, macroB = 0, binauralBreathLinked = true, customFrequencies = {},
                masterVolume = 0.85, masterEq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isMasterEqBypassed = false,
                chordGlideConfig,
                polyvagalConfig,
                isMusicMode = false,
                currentChordRootNote,
                currentChordRootFreq
            } = data;

            const breathConfig = data.breathConfig || { inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, oceanVol: 0.5, noiseType: 'PINK', toneType: 'SINE_BELL', visualMode: 'RING', cueVolume: 0.5, entrainTide: false, tideEntrainMode: 'ISOCHRONIC', tideEntrainDepth: 0.4 };

            const bpm = isSimulating ? localBpm : (externalBpm || 0);
            const normalizedCoh = Math.max(0, Math.min(1, coherence / 100));
            const pitchMultiplier = Math.pow(2, globalTranspose);

            const smoothingFactor = feedbackConfig.sensitivity || 0.1; 
            smoothedCoherenceRef.current += (normalizedCoh - smoothedCoherenceRef.current) * (smoothingFactor * 10 * dt);
            if (smoothedCoherenceRef.current < 0) smoothedCoherenceRef.current = 0;
            if (smoothedCoherenceRef.current > 1) smoothedCoherenceRef.current = 1;
            const smoothedCoh = smoothedCoherenceRef.current;

            const currentBeat = binauralFreqs['UNIVERSAL'] || 7.83;
            let visualBeat = Math.max(0.1, currentBeat); 
            if (immersionConfig?.isFractalSync) {
                visualBeat = (136.1 * pitchMultiplier) / 32;
            }

            let breathRadius = 0;
            let breathPhase = 'IDLE';
            let senticSignal = 0;
            let currentVibratoRate = visualBeat; 
            let visualVibratoOffset = 0;
            let vibratoEnvelope = 0;

            if (isBreathActive && breathStartTime) {
                const bInhale = Math.max(0, Number(breathConfig?.inhale) || 0);
                const bHoldIn = Math.max(0, Number(breathConfig?.holdIn) || 0);
                const bExhale = Math.max(0, Number(breathConfig?.exhale) || 0);
                const bHoldOut = Math.max(0, Number(breathConfig?.holdOut) || 0);

                let totalBreathTime = safe(bInhale + bHoldIn + bExhale + bHoldOut);
                if (totalBreathTime < 0.5) totalBreathTime = 0.5; 
                
                const breathProgress = Math.max(0, now - breathStartTime) % totalBreathTime;
                
                const isSentic = breathConfig?.isSenticPacing && breathConfig.senticState && breathConfig.senticState !== 'NO_EMOTION';
                const stateKey = (breathConfig?.senticState as SenticEmotion) || 'NO_EMOTION';
                const senticData = SENTIC_STATES[stateKey];
                const tPeak = senticData?.tPeak || 0.5;

                const inhaleThreshold = bInhale;
                const holdInThreshold = bInhale + bHoldIn;
                const exhaleThreshold = bInhale + bHoldIn + bExhale;

                if (breathProgress < inhaleThreshold) {
                    breathPhase = 'INHALE';
                    const ratio = bInhale > 0 ? breathProgress / bInhale : 1.0; 
                    if (isSentic) {
                        const senticRatio = ratio * tPeak;
                        senticSignal = getEssenticRadius(stateKey, senticRatio);
                        vibratoEnvelope = getEssenticEnvelope(stateKey, senticRatio);
                        breathRadius = senticSignal;
                    } else {
                        breathRadius = ratio;
                    }
                } else if (bHoldIn > 0 && breathProgress < holdInThreshold) {
                    breathPhase = 'HOLD_IN';
                    if (isSentic) {
                        senticSignal = getEssenticRadius(stateKey, tPeak);
                        vibratoEnvelope = getEssenticEnvelope(stateKey, tPeak);
                        breathRadius = senticSignal;
                    } else {
                        breathRadius = 1.0;
                    }
                } else if (breathProgress < exhaleThreshold) {
                    breathPhase = 'EXHALE';
                    const ratio = bExhale > 0 ? (breathProgress - holdInThreshold) / bExhale : 1.0; 
                    if (isSentic) {
                        const senticRatio = tPeak + ratio * (1.0 - tPeak);
                        senticSignal = getEssenticRadius(stateKey, senticRatio);
                        vibratoEnvelope = getEssenticEnvelope(stateKey, senticRatio);
                        breathRadius = senticSignal;
                    } else {
                        breathRadius = 1.0 - ratio;
                    }
                } else {
                    breathPhase = 'HOLD_OUT';
                    senticSignal = 0.0;
                    vibratoEnvelope = 0.0;
                    breathRadius = 0.0;
                }

                if (isSentic && senticData) {
                    const targetRate = visualBeat + (senticSignal * senticData.vibModRate);
                    currentVibratoRate = targetRate * vibratoEnvelope;
                    
                    lensMemoryRef.current.vibratoPhase = (lensMemoryRef.current.vibratoPhase || 0) + (currentVibratoRate * Math.PI * 2 * dt);
                    const currentPhaseVal = Math.sin(lensMemoryRef.current.vibratoPhase);
                    
                    if (breathConfig.isSenticVisual !== false) {
                        const intensity = breathConfig.senticVibratoDepth ?? 0.5;
                        const visualDepth = 0.04 * intensity * vibratoEnvelope; 
                        visualVibratoOffset = currentPhaseVal * visualDepth;
                    }

                    const lastPhaseVal = lensMemoryRef.current.lastPhaseVal || 0;
                    if (lastPhaseVal < 0 && currentPhaseVal >= 0) {
                        if (breathConfig.isSenticHaptics !== false && vibratoEnvelope > 0.1) {
                             if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                 try { navigator.vibrate(Math.min(40, 10 + (vibratoEnvelope * 30))); } catch { /* ignore */ }
                             }
                        }
                    }
                    lensMemoryRef.current.lastPhaseVal = currentPhaseVal;

                } else {
                    lensMemoryRef.current.vibratoPhase = 0;
                    lensMemoryRef.current.lastPhaseVal = 0;
                    vibratoEnvelope = 0;
                }

            } else {
                if (prevBreathPhaseRef.current !== 'IDLE') prevBreathPhaseRef.current = 'IDLE';
                lensMemoryRef.current.vibratoPhase = 0;
                lensMemoryRef.current.lastPhaseVal = 0;
                vibratoEnvelope = 0;
                senticSignal = 0;
                visualVibratoOffset = 0;
                currentVibratoRate = 0;
            }
            
            breathRadius = Math.max(0, Math.min(1, safe(breathRadius + visualVibratoOffset)));
            
            const pulseMode = immersionConfig?.pulseMode || 'BINAURAL';
            const isTimeCrystal = immersionConfig?.isTimeCrystal || false;
            let sigBinaural = 0;

            // --- FLAME IN MIND / PHASE CONJUGATE IMPLOSION ENGINE ---
            const phi = 1.61803398875;
            const fAlpha = visualBeat;                     // 8.00 Hz Schumann Fundamental Anchor
            const fTheta = fAlpha * 0.5;                   // 4.00 Hz Subharmonic Octave Gate
            const fPhiBeta = fAlpha * phi;                 // 12.94 Hz Phi Beta
            const fPhiGamma = fAlpha * Math.pow(phi, 3);   // 33.88 Hz Phi Gamma Peak

            // Fundamental carrier envelopes
            const thetaWave = (Math.sin(now * fTheta * Math.PI * 2) + 1.0) * 0.5;
            const alphaWave = (Math.sin(now * fAlpha * Math.PI * 2) + 1.0) * 0.5;

            // Phase-Amplitude Coupling (PAC): Gamma amplitude gated by Alpha crests
            const isPAC = immersionConfig?.isPACGated !== false;
            const gammaOsc = Math.sin(now * fPhiGamma * Math.PI * 2);
            const pacGamma = isPAC
              ? (gammaOsc * Math.pow(alphaWave, 2.0) + 1.0) * 0.5
              : (gammaOsc + 1.0) * 0.5;

            // Composite Centripetal Wave Cascade
            const flameCascade = (alphaWave * 0.40) + (thetaWave * 0.25) + (pacGamma * 0.35);

            if (isTimeCrystal) {
              const tcTopology = immersionConfig?.timeCrystalTopology || 'FIBONACCI';
              const rawTarget = evaluateTimeCrystal(now, visualBeat, tcTopology);
              const easing = Math.max(10.0, visualBeat * 5.0);

              lensMemoryRef.current.tcSmoothed = lensMemoryRef.current.tcSmoothed ?? 1.0;
              lensMemoryRef.current.tcSmoothed += (rawTarget - lensMemoryRef.current.tcSmoothed) * Math.min(1.0, dt * easing);
              sigBinaural = flameCascade * lensMemoryRef.current.tcSmoothed;
            } else {
              sigBinaural = flameCascade;
            }

            const sigHR = Math.max(0, Math.min(1, (bpm - 40) / 100));

            // Heartbeat Physiological Pulse Signal (drops strictly to 0 when muted)
            const isHeartMuted = !!mutes?.['HEART_KICK'] || (volumes?.['HEART_KICK'] ?? 0) <= 0.001;
            let sigHeart = 0;
            if (!isHeartMuted) {
                const kickCfg = kickConfig || { syncMode: 'BREATH', doubleBeat: true, bpm: 60 };
                const isSecondSync = kickCfg.syncMode === 'BREATH_COUNT' || Boolean(kickCfg.syncToSeconds);
                
                if (isSecondSync && isBreathActive && breathStartTime) {
                    const inh = Math.max(0.5, breathConfig?.inhale || 5.0);
                    const hIn = Math.max(0, breathConfig?.holdIn || 0);
                    const exh = Math.max(0.5, breathConfig?.exhale || 5.0);
                    const hOut = Math.max(0, breathConfig?.holdOut || 0);
                    const totalDur = Math.max(1.0, inh + hIn + exh + hOut);
                    const progress = Math.max(0, now - breathStartTime) % totalDur;
                    
                    let phaseProgress = progress;
                    let phaseDur = inh;
                    if (progress < inh) {
                        phaseProgress = progress;
                        phaseDur = inh;
                    } else if (progress < inh + hIn) {
                        phaseProgress = progress - inh;
                        phaseDur = hIn;
                    } else if (progress < inh + hIn + exh) {
                        phaseProgress = progress - inh - hIn;
                        phaseDur = exh;
                    } else {
                        phaseProgress = progress - inh - hIn - exh;
                        phaseDur = hOut;
                    }
                    
                    const numBeats = Math.max(1, Math.round(phaseDur));
                    const beatStep = phaseDur > 0 ? phaseDur / numBeats : 1.0;
                    const timeSinceBeat = phaseProgress % beatStep;
                    
                    const lubEnv = Math.exp(-timeSinceBeat * 6.5);
                    let dubEnv = 0;
                    if (kickCfg.doubleBeat !== false && timeSinceBeat >= 0.13) {
                        dubEnv = Math.exp(-(timeSinceBeat - 0.13) * 8.5) * 0.45;
                    }
                    const heartVol = (volumes?.['HEART_KICK'] ?? 0.6) * (harmonicMasterVolume ?? 1.0);
                    sigHeart = Math.max(0, Math.min(1.0, (lubEnv + dubEnv) * heartVol));
                } else {
                    const beatInterval = getCardiacInterval(kickCfg, {
                        bpm,
                        binauralFreqs,
                        isBreathActive,
                        breathPhase,
                        heartSyncMode: kickCfg.syncMode
                    });

                    if (lensMemoryRef.current.lastHeartTime === undefined) {
                        lensMemoryRef.current.lastHeartTime = now;
                    }
                    const timeSinceBeat = (now - Number(lensMemoryRef.current.lastHeartTime)) % beatInterval;
                    
                    const lubEnv = Math.exp(-timeSinceBeat * 6.5);
                    let dubEnv = 0;
                    if (kickCfg.doubleBeat !== false && timeSinceBeat >= 0.13) {
                        dubEnv = Math.exp(-(timeSinceBeat - 0.13) * 8.5) * 0.45;
                    }
                    const heartVol = (volumes?.['HEART_KICK'] ?? 0.6) * (harmonicMasterVolume ?? 1.0);
                    sigHeart = Math.max(0, Math.min(1.0, (lubEnv + dubEnv) * heartVol));
                }
            }
            
            let sigAudio = 0;
            const telem = telemetryRef.current as VisualizerTelemetry | null;
            if (telem?.analysers?.postLimit) {
                telem.analysers.postLimit.getByteTimeDomainData(audioDataRef.current);
                let sum = 0;
                for(let i=0; i<audioDataRef.current.length; i++) {
                    const v = (audioDataRef.current[i] - 128) / 128;
                    sum += v*v;
                }
                sigAudio = Math.min(1, Math.sqrt(sum / audioDataRef.current.length) * 4.0); 
            }

            const modContext = {
                now, dt, breathRadius, breathPhase, sigBinaural, sigHR, sigHeart,
                smoothedCoh, sigAudio, macroA, macroB, visualBeat, binauralBreathLinked, isFeedbackActive,
                timeCrystalMode: isTimeCrystal ? 'ON' : 'NONE', pulseMode: pulseMode
            };

            const resolveLocalParam = (key: string, baseVal: number) => resolveModulation(key, baseVal, modulations?.[key], modContext, lensMemoryRef.current);

            const effectiveConfig = { ...latticeConfig };
            (Object.keys(effectiveConfig) as Array<keyof LatticeGlobalConfig>).forEach(key => {
                const val = effectiveConfig[key];
                if (typeof val === 'number') { (effectiveConfig as Record<string, unknown>)[key] = resolveLocalParam(key, val); }
            });

            const effectiveReverb = { ...reverbConfig };
            if (reverbConfig && typeof reverbConfig.wetness === 'number') effectiveReverb.wetness = resolveLocalParam('reverbWetness', reverbConfig.wetness);

            const effectiveDelay = { ...delayConfig };
            if (delayConfig) {
                if (typeof delayConfig.time === 'number') effectiveDelay.time = resolveLocalParam('delayTime', delayConfig.time);
                if (typeof delayConfig.feedback === 'number') effectiveDelay.feedback = resolveLocalParam('delayFeedback', delayConfig.feedback);
                if (typeof delayConfig.wetness === 'number') effectiveDelay.wetness = resolveLocalParam('delayWetness', delayConfig.wetness);
            }

            const effectiveNature = { ...natureConfig };
            if (natureConfig) {
                if (typeof natureConfig.rainVol === 'number') effectiveNature.rainVol = resolveLocalParam('rainVol', natureConfig.rainVol);
                if (typeof natureConfig.streamVol === 'number') effectiveNature.streamVol = resolveLocalParam('streamVol', natureConfig.streamVol);
                if (typeof natureConfig.fireVol === 'number') effectiveNature.fireVol = resolveLocalParam('fireVol', natureConfig.fireVol);
                if (typeof natureConfig.windVol === 'number') effectiveNature.windVol = resolveLocalParam('windVol', natureConfig.windVol);
            }

            const effectiveAether = { ...aetherConfig };
            if (aetherConfig) {
                if (typeof aetherConfig.elasticity === 'number') effectiveAether.elasticity = resolveLocalParam('elasticity', aetherConfig.elasticity);
                if (typeof aetherConfig.viscosity === 'number') effectiveAether.viscosity = resolveLocalParam('viscosity', aetherConfig.viscosity);
            }

            const freq = bpm / 60;
            const hits: string[] = [];
            
            if (sensorMode === 'AETHER') {
                LATTICE_CHANNELS.forEach(ch => { if (!mutes[ch.id] && !stackMutes[ch.type]) hits.push(ch.id); });
            } else {
                if (bpm > 0) {
                    LATTICE_CHANNELS.forEach(ch => {
                        if (mutes[ch.id] || stackMutes[ch.type]) return;
                        const isDrone = ['JOY', 'PEACE', 'INSIGHT', 'COURAGE', 'AWE', 'VOID'].includes(ch.type);
                        if (isDrone) { hits.push(ch.id); } 
                        else {
                            const ratio = ch.freq / freq;
                            if (Math.abs(ratio - Math.round(ratio)) < 0.05) hits.push(ch.id);
                        }
                    });
                }
            }

            // CRITICAL: Unmuted chord voice channels (UNIVERSAL_840 - UNIVERSAL_847) are persistent harmonic voices
            // commanded by the musical progression engine. They must ALWAYS be marked as hits when unmuted so the synth
            // never drops them, regardless of BPM ratios or sensor mode!
            CHORD_VOICE_CHANNELS.forEach(ch => {
                if (!mutes[ch.id] && !stackMutes[ch.type] && !hits.includes(ch.id)) {
                    hits.push(ch.id);
                }
            });

            const currentAttack = Math.max(0.01, attackTime + (isApertureActive ? smoothedCoh : 0));
            const currentRelease = Math.max(0.01, releaseTime + (isApertureActive ? smoothedCoh * 2 : 0));

            LATTICE_CHANNELS.forEach(ch => {
                const isChordVoice = ch.id.startsWith('UNIVERSAL_84');
                const isMuted = !audioEnabled || !isPowered || mutes[ch.id] || stackMutes[ch.type] || (!isChordVoice && entrainmentMode === 'SILENT') || (entrainmentMode === 'SYNCED' && !isBreathActive);
                let amp = visualAmplitudesRef.current.get(ch.id) || 0;

                if (isMuted) {
                    if (amp > 0.001) { amp += (0 - amp) * 0.1; visualAmplitudesRef.current.set(ch.id, amp); } 
                    else if (amp !== 0) { visualAmplitudesRef.current.set(ch.id, 0); }
                    return;
                }

                const faderVolume = volumes[ch.id] !== undefined ? volumes[ch.id] : 1.0;
                let target = 0;
                const isHit = hits.includes(ch.id);

                if (entrainmentMode === 'SYNCED') {
                    let volumeMod = 1.0;
                    const currentPhase = breathPhase || 'IDLE';
                    const applyBehavior = (behavior: string | undefined) => {
                        switch(behavior) {
                            case 'SHUTOFF': case 'SILENCE': volumeMod = 0.0; break;
                            case 'DEEPEN': volumeMod = 0.5; break;
                            case 'SUSPEND': volumeMod = 0.8; break;
                            case 'SHIMMER': volumeMod = 1.0; break;
                            case 'UNDERWATER': volumeMod = 0.4; break;
                            case 'GROUND': volumeMod = 0.7; break;
                            case 'PEAK': volumeMod = 1.5; break;
                            case 'STATIC': volumeMod = 0.6; break;
                            case 'NONE': default: volumeMod = 1.0; break;
                        }
                    };
                    if (currentPhase === 'HOLD_IN') applyBehavior(breathConfig?.holdBehavior);
                    else if (currentPhase === 'HOLD_OUT') applyBehavior(breathConfig?.waitBehavior);
                    
                    const breathVolSwell = 0.1 + ((breathRadius || 0) * 0.9);
                    target = faderVolume * volumeMod * breathVolSwell;
                } else if (isChordVoice || sensorMode === 'AETHER' || entrainmentMode === 'DRONE' || (entrainmentMode !== 'SILENT' && (['JOY', 'PEACE', 'INSIGHT', 'COURAGE', 'AWE', 'VOID', 'UNIVERSAL'].includes(ch.type) || isHit))) {
                    target = faderVolume;
                }

                const idx = parseInt(ch.id.split('_')[1] || '0');
                if (!isChordVoice && activeHarmonicIndex !== undefined && activeHarmonicIndex !== -1 && idx !== activeHarmonicIndex) {
                    target = 0;
                }

                const tau = entrainmentMode === 'SYNCED' ? 0.15 : (target > amp ? currentAttack : currentRelease);
                const alpha = 1.0 - Math.exp(-dt / tau);
                amp += (target - amp) * alpha;
                
                if (Math.abs(target - amp) < 0.001) amp = target;
                visualAmplitudesRef.current.set(ch.id, amp);
            });

            if (audioEnabled) {
                const payload = audioPayloadRef.current;
                
                // Continuous / high-rate physical variables update in place every frame
                payload.now = now;
                payload.breathPhase = breathPhase;
                payload.breathRadius = breathRadius;
                payload.prevBreathPhase = prevBreathPhaseRef.current;
                payload.smoothedCoh = smoothedCoh;
                
                if (!payload.signals || typeof payload.signals !== 'object') {
                    payload.signals = { breath: 0, binaural: 0, hr: 0, coh: 0, audio: 0, macroA: 0, macroB: 0, senticSignal: 0, currentVibratoRate: 0, vibratoEnvelope: 0 };
                }
                const sigs = payload.signals as Record<string, number>;
                sigs.breath = breathRadius;
                sigs.binaural = sigBinaural;
                sigs.hr = sigHR;
                sigs.coh = smoothedCoh;
                sigs.audio = sigAudio;
                sigs.macroA = macroA;
                sigs.macroB = macroB;
                sigs.senticSignal = senticSignal;
                sigs.currentVibratoRate = currentVibratoRate;
                sigs.vibratoEnvelope = vibratoEnvelope;
                
                // Structural dirty-flag checking: only sync non-continuous parameters and dispatch updateAudio when values change
                const last = lastStructuralStateRef.current;
                const hitsStr = hits.length > 0 ? hits.join(',') : '';
                const isDirty = !last.hasDispatchedInitial ||
                    last.bpm !== bpm ||
                    last.pitchMultiplier !== pitchMultiplier ||
                    last.binauralFreqs !== binauralFreqs ||
                    last.volumes !== volumes ||
                    last.mutes !== mutes ||
                    last.stackMutes !== stackMutes ||
                    last.hitsStr !== hitsStr ||
                    last.currentAttack !== currentAttack ||
                    last.currentRelease !== currentRelease ||
                    last.snakeConfig !== snakeConfig ||
                    last.heartHarmonicVols !== heartHarmonicVols ||
                    last.heartHarmonicMutes !== heartHarmonicMutes ||
                    last.breathConfig !== breathConfig ||
                    last.isBreathActive !== isBreathActive ||
                    last.breathStartTime !== breathStartTime ||
                    last.isApertureActive !== isApertureActive ||
                    last.feedbackConfig !== feedbackConfig ||
                    last.baseAperture !== baseAperture ||
                    last.modulations !== modulations ||
                    last.immersionConfig !== immersionConfig ||
                    last.aetherConfig !== effectiveAether ||
                    last.sensorMode !== sensorMode ||
                    last.entrainmentMode !== entrainmentMode ||
                    last.activeHarmonicIndex !== activeHarmonicIndex ||
                    last.harmonicMasterVolume !== harmonicMasterVolume ||
                    last.latticeMode !== latticeMode ||
                    last.isFeedbackActive !== isFeedbackActive ||
                    last.reverbConfig !== effectiveReverb ||
                    last.delayConfig !== effectiveDelay ||
                    last.natureConfig !== effectiveNature ||
                    last.kickConfig !== kickConfig ||
                    last.customFrequencies !== customFrequencies ||
                    last.masterVolume !== masterVolume ||
                    last.masterEq !== masterEq ||
                    last.isMasterEqBypassed !== isMasterEqBypassed ||
                    last.chordGlideConfig !== chordGlideConfig ||
                    last.polyvagalConfig !== polyvagalConfig ||
                    last.isMusicMode !== Boolean(isMusicMode) ||
                    last.currentChordRootNote !== currentChordRootNote ||
                    last.currentChordRootFreq !== currentChordRootFreq;

                if (isDirty) {
                    payload.bpm = bpm;
                    payload.pitchMultiplier = pitchMultiplier;
                    payload.binauralFreqs = binauralFreqs;
                    payload.volumes = volumes;
                    payload.mutes = mutes;
                    payload.stackMutes = stackMutes;
                    payload.hits = hits;
                    payload.currentAttack = currentAttack;
                    payload.currentRelease = currentRelease;
                    payload.snakeConfig = snakeConfig;
                    payload.heartHarmonicVols = heartHarmonicVols;
                    payload.heartHarmonicMutes = heartHarmonicMutes;
                    payload.breathConfig = breathConfig;
                    payload.isBreathActive = isBreathActive;
                    payload.breathStartTime = breathStartTime;
                    payload.isApertureActive = isApertureActive;
                    payload.feedbackConfig = feedbackConfig;
                    payload.baseAperture = baseAperture;
                    payload.modulations = modulations;
                    payload.immersionConfig = immersionConfig;
                    payload.aetherConfig = effectiveAether;
                    payload.sensorMode = sensorMode;
                    payload.entrainmentMode = entrainmentMode;
                    payload.activeHarmonicIndex = activeHarmonicIndex;
                    payload.harmonicMasterVolume = harmonicMasterVolume;
                    payload.latticeMode = latticeMode;
                    payload.isFeedbackActive = isFeedbackActive;
                    payload.reverbConfig = effectiveReverb;
                    payload.delayConfig = effectiveDelay;
                    payload.natureConfig = effectiveNature;
                    payload.kickConfig = kickConfig;
                    payload.heartSyncMode = kickConfig?.syncMode || 'BREATH';
                    payload.customFrequencies = customFrequencies;
                    payload.masterVolume = masterVolume;
                    payload.masterEq = masterEq;
                    payload.isMasterEqBypassed = isMasterEqBypassed;
                    payload.chordGlideConfig = chordGlideConfig;
                    payload.polyvagalConfig = polyvagalConfig;
                    payload.isMusicMode = Boolean(isMusicMode);
                    payload.currentChordRootNote = currentChordRootNote as string | undefined;
                    payload.currentChordRootFreq = currentChordRootFreq as number | undefined;

                    last.hasDispatchedInitial = true;
                    last.bpm = bpm;
                    last.pitchMultiplier = pitchMultiplier;
                    last.binauralFreqs = binauralFreqs;
                    last.volumes = volumes;
                    last.mutes = mutes;
                    last.stackMutes = stackMutes;
                    last.hitsStr = hitsStr;
                    last.currentAttack = currentAttack;
                    last.currentRelease = currentRelease;
                    last.snakeConfig = snakeConfig;
                    last.heartHarmonicVols = heartHarmonicVols;
                    last.heartHarmonicMutes = heartHarmonicMutes;
                    last.breathConfig = breathConfig;
                    last.isBreathActive = isBreathActive;
                    last.breathStartTime = breathStartTime;
                    last.isApertureActive = isApertureActive;
                    last.feedbackConfig = feedbackConfig;
                    last.baseAperture = baseAperture;
                    last.modulations = modulations;
                    last.immersionConfig = immersionConfig;
                    last.aetherConfig = effectiveAether;
                    last.sensorMode = sensorMode;
                    last.entrainmentMode = entrainmentMode;
                    last.activeHarmonicIndex = activeHarmonicIndex;
                    last.harmonicMasterVolume = harmonicMasterVolume;
                    last.latticeMode = latticeMode;
                    last.isFeedbackActive = isFeedbackActive;
                    last.reverbConfig = effectiveReverb;
                    last.delayConfig = effectiveDelay;
                    last.natureConfig = effectiveNature;
                    last.kickConfig = kickConfig;
                    last.customFrequencies = customFrequencies;
                    last.masterVolume = masterVolume;
                    last.masterEq = masterEq;
                    last.isMasterEqBypassed = isMasterEqBypassed;
                    last.chordGlideConfig = chordGlideConfig;
                    last.polyvagalConfig = polyvagalConfig;
                    last.isMusicMode = Boolean(isMusicMode);
                    last.currentChordRootNote = currentChordRootNote;
                    last.currentChordRootFreq = currentChordRootFreq;

                    updateAudioRef.current(payload as unknown as Record<string, unknown>);
                }
            }
            prevBreathPhaseRef.current = breathPhase;
            const phys = physicsStateRef.current;
            phys.breathRadius = breathRadius;
            phys.breathPhase = breathPhase;
            phys.smoothedCoherence = smoothedCoh;
            phys.bpm = bpm;
            phys.effectiveConfig = effectiveConfig;
            phys.hits = hits;
            phys.now = now;
            phys.dt = dt;
            phys.senticSignal = senticSignal;

            if (bus) {
                const telemetryPayload = { ...effectiveConfig, ...effectiveReverb, ...effectiveDelay, ...effectiveNature, ...effectiveAether };
                bus.emit(telemetryPayload);
            }
        };

        runPhysicsRef.current = runPhysics;

        // When the browser tab is visible, runPhysics is called in requestAnimationFrame
        // to stay perfectly locked with the display refresh rate.
        // When the tab is in the background (hidden), this interval ensures continuous audio pacing.
        physicsIntervalRef.current = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
            runPhysics();
        }, 20);

        return () => {
            if (physicsIntervalRef.current) clearInterval(physicsIntervalRef.current);
            runPhysicsRef.current = null;
        };
    }, [audioEnabled, isPowered, bus, loopDataRef]);

    useEffect(() => {
        const canvasGL = canvasGLRef.current;
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !canvasGL) return;
        const ctx = canvas.getContext('2d'); 
        const gl = canvasGL.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: false, depth: true, preserveDrawingBuffer: true });
        if (!ctx) return;

        let logicalWidth = 0;
        let logicalHeight = 0;
        let lastTargetW = 0;
        let lastTargetH = 0;
        let resizeRaf: number | null = null;

        const performResize = () => {
            resizeRaf = null;
            if (!container || !canvas || !canvasGL) return;
            const rect = container.getBoundingClientRect();
            const w = Math.round(rect.width);
            const h = Math.round(rect.height);
            if (w <= 0 || h <= 0) return;

            const dpr = window.devicePixelRatio || 1;
            const targetPixelWidth = Math.floor(w * dpr);
            const targetPixelHeight = Math.floor(h * dpr);

            // Avoid redundant canvas bitmap and WebGL backing store reallocation
            if (targetPixelWidth === lastTargetW && targetPixelHeight === lastTargetH) {
                return;
            }
            lastTargetW = targetPixelWidth;
            lastTargetH = targetPixelHeight;

            logicalWidth = w;
            logicalHeight = h;

            canvas.width = targetPixelWidth;
            canvas.height = targetPixelHeight;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;

            canvasGL.width = targetPixelWidth;
            canvasGL.height = targetPixelHeight;
            canvasGL.style.width = `${w}px`;
            canvasGL.style.height = `${h}px`;
            if (gl) gl.viewport(0, 0, targetPixelWidth, targetPixelHeight);
        };

        const handleResize = () => {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(performResize);
        };
        
        performResize();
        const ro = new ResizeObserver(handleResize);
        ro.observe(container);

        lastRenderTimeRef.current = performance.now();

        const renderLoop = () => {
            if (runPhysicsRef.current) {
                runPhysicsRef.current();
            }
            const nowTime = performance.now();
            const dt = Math.min(0.1, (nowTime - lastRenderTimeRef.current) / 1000);
            lastRenderTimeRef.current = nowTime;

            const safeData = loopDataRef.current || {};
            const dpr = window.devicePixelRatio || 1;

            const activeMode = safeData.activePhysicsMode || 'BIO-BLOOM';
            const activePlugin = VISUALIZER_PLUGINS[activeMode];
            const isWebGLMode = activePlugin?.renderType === 'WEBGL';

            if (lensMemoryRef.current.activeMode !== activeMode) {
                const oldMode = lensMemoryRef.current.activeMode;
                if (oldMode) {
                    const oldPlugin = VISUALIZER_PLUGINS[oldMode];
                    if (oldPlugin && oldPlugin.cleanup) {
                        try {
                            oldPlugin.cleanup({ gl, memory: lensMemoryRef.current });
                        } catch (e) {
                            console.error(`Error cleaning up lens ${oldMode}:`, e);
                        }
                    }
                }
                if (gl && !isWebGLMode) {
                    gl.clearColor(0, 0, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    if (canvasGL.style.display !== 'none') {
                        canvasGL.style.display = 'none';
                    }
                }
                lensMemoryRef.current = { activeMode, modState: {}, tcSmoothed: 1.0, vibratoPhase: 0, lastPhaseVal: 0 };
            }

            // GPU & Context Layer Isolation:
            // Ensure WebGL canvas visibility matches current lens mode to prevent redundant compositor blits
            if (isWebGLMode) {
                if (canvasGL.style.display !== 'block') canvasGL.style.display = 'block';
            } else {
                if (canvasGL.style.display !== 'none') canvasGL.style.display = 'none';
                if (canvas.style.display !== 'block') canvas.style.display = 'block';
            }
            
            // --- DYNAMIC PERFORMANCE SCALING (Zero-GC EMA) ---
            if (lensMemoryRef.current.qualityMultiplier === undefined) {
                lensMemoryRef.current.qualityMultiplier = 1.0;
                lensMemoryRef.current.fpsEma = 60.0;
                lensMemoryRef.current.fpsFrames = 0;
            }
            const mem = lensMemoryRef.current as Record<string, any>;
            const instantFps = dt > 0 ? 1.0 / dt : 60;
            mem.fpsEma = (mem.fpsEma as number) * 0.95 + instantFps * 0.05;
            mem.fpsFrames = ((mem.fpsFrames as number) || 0) + 1;
            if (mem.fpsFrames > 60) {
                const avgFps = mem.fpsEma as number;
                if (avgFps < 45) {
                    mem.qualityMultiplier = Math.max(0.2, (mem.qualityMultiplier as number) - 0.1);
                } else if (avgFps > 55) {
                    mem.qualityMultiplier = Math.min(1.0, (mem.qualityMultiplier as number) + 0.05);
                }
                mem.fpsFrames = 0;
            }
            // -----------------------------------

            const has2DOverlay = Boolean(
                safeData.isTransitioning || 
                (safeData.isBreathActive && safeData.breathConfig && safeData.breathConfig.visualMode !== 'NONE') ||
                safeData.isFeedbackActive
            );

            // In WebGL mode, if no 2D overlays (breath rings/shutter) are active, suspend 2D context completely
            const needs2DTransformStack = !isWebGLMode || has2DOverlay;

            if (needs2DTransformStack) {
                if (canvas.style.display !== 'block') canvas.style.display = 'block';
                // ABSOLUTE MATRIX ENFORCEMENT
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
                if (isWebGLMode) {
                    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
                }
                // GPU CLIPPING MASK
                // This prevents off-screen geometry (like huge radii) from overflowing
                // the Safari Mobile Graphics buffer and causing visual glitches.
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, logicalWidth, logicalHeight);
                ctx.clip();
            } else if (canvas.style.display !== 'none') {
                ctx.clearRect(0, 0, logicalWidth, logicalHeight);
                canvas.style.display = 'none';
            }

            if (safeData.isTransitioning) {
                if (needs2DTransformStack) {
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(-logicalWidth, -logicalHeight, logicalWidth * 3, logicalHeight * 3);
                    ctx.restore();
                }
                animationFrameRef.current = requestAnimationFrame(renderLoop);
                return;
            }

            const { breathRadius, breathPhase, smoothedCoherence, bpm, effectiveConfig, now, senticSignal } = physicsStateRef.current;
            const { 
                themeColors, heartHarmonicVols, heartHarmonicMutes, stackMutes, 
                breathConfig, isBreathActive, 
                immersionConfig, aetherConfig, snakeConfig, binauralFreqs,
                sensorMode, latticeMode, isFeedbackActive
            } = safeData;

            if (vignetteRef.current) {
                const isVignetteMode = isBreathActive && breathConfig?.visualMode === 'VIGNETTE';
                const baseOpacity = isVignetteMode ? (1.0 - breathRadius) * 0.9 : 0;
                const senticGlow = senticSignal ? senticSignal * 0.3 : 0;
                vignetteRef.current.style.opacity = Math.min(1.0, baseOpacity + senticGlow).toFixed(2);
            }

            try {
                const w = logicalWidth;
                const h = logicalHeight;
                
                const { mandala } = layoutRef.current;
                const mCx = (w / 2) + (w * mandala.x); 
                const mCy = (h / 2) - (h * mandala.y);
                
                const vizHeartVols = snakeConfig?.mode === 'SNAKE' ? [0, snakeConfig.vol, 0, 0, 0] : (heartHarmonicVols || []);
                const vizHeartMutes = snakeConfig?.mode === 'SNAKE' ? [true, false, true, true, true] : (heartHarmonicMutes || []);
                const activeBinauralFreq = (binauralFreqs && typeof binauralFreqs['UNIVERSAL'] === 'number' && binauralFreqs['UNIVERSAL'] > 0)
                    ? binauralFreqs['UNIVERSAL']
                    : (binauralFreqs ? (Object.values(binauralFreqs).find(v => typeof v === 'number' && v > 0) || 7.83) : 7.83);
                const effectiveBinauralBeat = isFeedbackActive ? activeBinauralFreq : 0;

                const dw = Math.floor(w * dpr);
                const dh = Math.floor(h * dpr);
                
                const effectiveLayout: LayoutConfig = {
                    mandala: {
                        ...layoutRef.current.mandala,
                        scale: layoutRef.current.mandala.scale
                    },
                    pacer: {
                        ...layoutRef.current.pacer,
                        scale: layoutRef.current.pacer.scale
                    }
                };

                const scaledEffectiveConfig = {
                    ...effectiveConfig,
                    visualScale: ((effectiveConfig?.visualScale as number) || 1.0) * zoomScaleRef.current
                };

                const lensContext: Record<string, unknown> = {
                    ctx, gl, isWebGL: isWebGLMode,
                    w: isWebGLMode ? dw : w, h: isWebGLMode ? dh : h, 
                    logicalW: w, logicalH: h,
                    cx: isWebGLMode ? mCx * dpr : mCx, 
                    cy: isWebGLMode ? mCy * dpr : mCy, 
                    time: now, dt, bpm, coherence: smoothedCoherence,
                    globalBinauralBeat: effectiveBinauralBeat, 
                    effectiveBinauralBeat: activeBinauralFreq,
                    binauralHz: activeBinauralFreq,
                    audioEnabled: !!(audioEnabled && isPowered),
                    amplitudes: visualAmplitudesRef.current,
                    heartHarmonics: { vols: vizHeartVols, mutes: vizHeartMutes, stackMutes: stackMutes?.['HEART'] || false },
                    stackMutes: stackMutes || {}, config: scaledEffectiveConfig, feedback: safeData.feedbackConfig || {},
                    immersion: immersionConfig || {}, aether: aetherConfig || {}, breathRadius: breathRadius, 
                    isBreathActive: !!isBreathActive, breathPhase: breathPhase || 0,
                    chordGlideConfig: safeData.chordGlideConfig,
                    breathConfig: safeData.breathConfig,
                    theme: themeColors || {primary:'#fff',secondary:'#000'}, memory: lensMemoryRef.current, sensorMode: sensorMode,
                    telemetry: telemetryRef.current, latticeMode: latticeMode,
                    visualScale: zoomScaleRef.current,
                    customFrequencies: safeData.customFrequencies || {},
                    colorWheel: getActiveColorWheelId(),
                    colorWheelId: getActiveColorWheelId()
                };

                const renderContext: RenderPipelineContext = {
                    ctx, w, h,
                    layout: effectiveLayout,
                    state: { breathRadius, breathPhase, smoothedCoherence, bpm, effectiveConfig: scaledEffectiveConfig, now, dt },
                    data: safeData,
                    lensContext
                };

                if (!isWebGLMode) {
                    BackgroundLayer.render(renderContext);
                    PhysicsLayer.render(renderContext);
                    BreathLayer.render(renderContext);
                    PostProcessLayer.render(renderContext);
                } else {
                    PhysicsLayer.render(renderContext);
                    if (has2DOverlay) {
                        BreathLayer.render(renderContext);
                        PostProcessLayer.render(renderContext);
                    }
                }

            } catch (err) {
                console.error("Visualizer Render Pipeline Error:", err);
                setRenderError(err instanceof Error ? err : new Error(String(err)));
            }
            
            // Un-clip the GPU context if 2D stack was engaged
            if (needs2DTransformStack) {
                ctx.restore();
            }
            
            animationFrameRef.current = requestAnimationFrame(renderLoop);
        };
        
        renderLoop();
        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            ro.disconnect();
        };
    }, [audioEnabled, isPowered, bus, loopDataRef]);

    return (
        <div 
            ref={containerRef} 
            className="flex-1 relative min-h-0 border-b border-white/10 bg-black shadow-inner flex items-center justify-center overflow-hidden touch-none select-none" 
            onPointerDown={handlePointerDown} 
            onPointerMove={handlePointerMove} 
            onPointerUp={handlePointerUp} 
            onPointerCancel={handlePointerUp} 
            onLostPointerCapture={handlePointerUp}
            onWheel={handleWheel}
        >
            <canvas ref={canvasGLRef} className="absolute inset-0 w-full h-full block" style={{ pointerEvents: 'none' }} />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />
            <div ref={vignetteRef} className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-75 ease-out" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 100%)', opacity: 0, willChange: 'opacity' }} />

            {/* Pinch & Zoom Floating Indicator and Quick Controls (Positioned with clear breathing space below top buttons & text labels) */}
            {showZoomBadge && (
                <div className="absolute top-[5.5rem] sm:top-[7.2rem] left-1/2 -translate-x-1/2 z-[45] pointer-events-auto flex items-center gap-1.5 bg-black/90 backdrop-blur-md border border-cyan-500/40 text-white px-2.5 py-1 rounded-full text-xs font-mono shadow-2xl shadow-cyan-500/20 animate-in fade-in zoom-in-95 duration-150">
                    <button
                        onClick={(e) => { e.stopPropagation(); adjustZoomByStep(-0.15); }}
                        title="Zoom Out"
                        aria-label="Zoom Out"
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <ZoomOut size={13} />
                    </button>
                    <span className="text-cyan-400 font-bold tracking-wider px-1">{Math.round(zoomScale * 100)}%</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); adjustZoomByStep(0.15); }}
                        title="Zoom In"
                        aria-label="Zoom In"
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <ZoomIn size={13} />
                    </button>
                    {Math.abs(zoomScale - 1.0) > 0.05 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                            title="Reset Zoom"
                            aria-label="Reset Zoom"
                            className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                        >
                            <RotateCcw size={10} />
                            <span>1x</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});