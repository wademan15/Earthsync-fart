import { AudioGraph, AudioPayload, ChannelMemory, EntrainmentLayer, resolveActiveLayers } from './AudioTypes';
import { LATTICE_CHANNELS } from '../../components/modules/visuals/shared';
import { evaluateTimeCrystal, getTimeCrystalEvents } from '../kinematics/timeCrystal';
import { COMPOSER_MATRICES, ComposerWarp } from '../kinematics/senticForms';
import { scheduleVoiceGlide } from './ChordGlideEngine';
import { globalPolyvagalTelemetry } from './PolyvagalSynth';

const DRONE_TYPES = new Set(['JOY', 'PEACE', 'INSIGHT', 'COURAGE', 'AWE', 'VOID', 'UNIVERSAL']);
const LOOKAHEAD = 0.150; 

export interface ChannelInstruction {
    id: string;
    isMuted: boolean;
    targetGain: number;
    leftFreq: number;
    rightFreq: number;
    panValue: number;
    waveType: OscillatorType;
    lfoFreq: number;
    lfoDepthGain: number;
    envTimeConstant: number;
    isContinuous: boolean;
    isHit: boolean;
    pulseMode: string;
    activeLayers?: EntrainmentLayer[];
    powerScale?: number;
    baseCarrierFreq?: number;
    beatDeltaFreq?: number;
    isTimeCrystal: boolean;
    tcState: number;
    tcEvents: Array<{ time: number, state: boolean }>;
    nextTcTime: number; 
    composerEvents: Array<{ time: number, freq: number, amp: number }>;
    glideTime?: number;
    glideCurve?: 'EXPONENTIAL' | 'LINEAR';
    baseChordFreq?: number;
    plannedSourceFreq?: number;
    isConjugatePhase?: boolean;
    isochronicHardEdge?: boolean;
}

// Real-time bilateral phase conjugation handler: 180° Anti-Phase polarity reversal
export const setConjugatePhase = (
  inverterGain: GainNode,
  isAntiPhase: boolean,
  audioCtx: AudioContext
) => {
  const t = audioCtx.currentTime;
  inverterGain.gain.cancelScheduledValues(t);
  // Smooth 15ms S-curve ramp prevents DC clicks and audio pops
  inverterGain.gain.setTargetAtTime(isAntiPhase ? -1.0 : 1.0, t, 0.015);
};

const CLINICAL_SQUARE_CACHE = new WeakMap<AudioContext, PeriodicWave>();

/**
 * Creates a clinical-grade, band-limited, Gibbs-free periodic wave for 40Hz and all brainwave frequencies.
 * Uses Lanczos sigma factor damping to eliminate the Gibbs phenomenon overshoot (which in naive square
 * waves causes severe clicks, buffer glitching, and negative gain clipping in Web Audio).
 * Yields a steep ~0.6ms cosine-tapered edge with flat 1.0 peak plateau and flat 0.0 silent floor.
 */
export const getClinicalSquareWave = (ctx: AudioContext): PeriodicWave => {
    const cached = CLINICAL_SQUARE_CACHE.get(ctx);
    if (cached) return cached;

    const N = 25; // 25 harmonics: steep cortical onset without aliasing or HF splatter
    const real = new Float32Array(N + 1);
    const imag = new Float32Array(N + 1);
    for (let k = 1; k <= N; k += 2) {
        const lanczos = Math.sin((Math.PI * k) / (N + 1)) / ((Math.PI * k) / (N + 1));
        imag[k] = (4 / (Math.PI * k)) * Math.pow(lanczos, 1.25);
    }
    // Pre-calculate exact normalization so peak is strictly 1.000 and trough is -1.000
    let maxVal = 0;
    const SAMPLES = 2048;
    for (let i = 0; i < SAMPLES; i++) {
        const theta = (i / SAMPLES) * 2 * Math.PI;
        let sum = 0;
        for (let k = 1; k <= N; k += 2) {
            sum += imag[k] * Math.sin(k * theta);
        }
        if (sum > maxVal) maxVal = sum;
    }
    const norm = maxVal > 0 ? 1.0 / maxVal : 1.0;
    for (let k = 1; k <= N; k += 2) {
        imag[k] *= norm;
    }
    const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    CLINICAL_SQUARE_CACHE.set(ctx, wave);
    return wave;
};

interface GlobalComposerMemory {
    nextBeatTime: number;
    currentBeatIndex: number;
    isRunning: boolean;
    lastWarp: string;
    wasBreathing?: boolean;
}

const calculateLatticeState = (payload: AudioPayload, memory: Record<string, ChannelMemory>, t: number): Record<string, ChannelInstruction> => {
    const isAether = payload.sensorMode === 'AETHER';
    const isPhotic = payload.immersionConfig?.isPhoticStrobe;
    const activeLayers = resolveActiveLayers(payload.immersionConfig);
    const isMultiLayer = activeLayers.length > 1;
    const isBinauralActive = activeLayers.includes('binaural');
    const isIsochronicActive = activeLayers.includes('isochronic');
    const isMonauralActive = activeLayers.includes('monaural');
    const layerMixGain = 1.0 / Math.max(1, activeLayers.length);

    let effectivePulseMode: string;
    if (activeLayers.length === 0) {
        effectivePulseMode = 'OFF';
    } else if (isMultiLayer) {
        effectivePulseMode = 'HYBRID';
    } else if (isIsochronicActive) {
        effectivePulseMode = 'ISOCHRONIC';
    } else if (isMonauralActive) {
        effectivePulseMode = 'MONAURAL';
    } else {
        effectivePulseMode = 'BINAURAL';
    }

    const isTimeCrystal = payload.immersionConfig?.isTimeCrystal || false;
    const tcTopology = payload.immersionConfig?.timeCrystalTopology || 'FIBONACCI';
    const isFractalSync = payload.immersionConfig?.isFractalSync || false;
    const composerWarp = (payload.immersionConfig?.composerWarp || 'LINEAR') as ComposerWarp;
    const intensity = payload.immersionConfig?.composerIntensity ?? 1.0;
    const matrix = COMPOSER_MATRICES[composerWarp] || COMPOSER_MATRICES['LINEAR'];

    // Carrier drift removed to preserve pure entrainment
    const carrierDriftAmt = 0;
    
    // Waveform timbre mapping
    const timbre = payload.immersionConfig?.toneTimbre || 'SINE';
    let waveType: OscillatorType = 'sine';
    if (timbre === 'TRIANGLE') waveType = 'triangle';
    else if (timbre === 'ANALOG') waveType = 'sawtooth';
    else if (timbre === 'WARM_PAD') waveType = 'triangle';
    
    let visualBeat = Math.max(0.1, payload.binauralFreqs['UNIVERSAL'] || 8.0);
    if (isFractalSync) visualBeat = (136.1 * (payload.pitchMultiplier || 1.0)) / 32; 

    const effectiveMode = payload.entrainmentMode || 'DRONE';

    if (!memory._globalComposer) {
        memory._globalComposer = { nextBeatTime: t, currentBeatIndex: 0, isRunning: false, lastWarp: 'LINEAR', wasBreathing: false } as unknown as ChannelMemory;
    }
    const comp = memory._globalComposer as unknown as GlobalComposerMemory;

    // DECOUPLED SCHEDULER: Allows Matrix to run continuously in DRONE mode
    const isActivelyBreathing = effectiveMode === 'SYNCED' && payload.isBreathActive;
    const isContinuousDrone = effectiveMode === 'DRONE' || isAether;
    const shouldComposerRun = isActivelyBreathing || isContinuousDrone;

    // HARD DOWNBEAT SNAP: Aligns Beethoven beat 1 perfectly with the start of an inhale
    if (isActivelyBreathing && !comp.wasBreathing) {
        comp.nextBeatTime = t;
        comp.currentBeatIndex = 0;
    }
    comp.wasBreathing = isActivelyBreathing;

    if (shouldComposerRun && !comp.isRunning) {
        comp.nextBeatTime = t;
        comp.currentBeatIndex = 0;
        comp.isRunning = true;
    } else if (!shouldComposerRun && comp.isRunning) {
        comp.isRunning = false;
        comp.nextBeatTime = t; 
    }

    if (comp.lastWarp !== composerWarp) {
        comp.nextBeatTime = t;
        comp.currentBeatIndex = 0;
        comp.lastWarp = composerWarp;
    }

    const maxExpectedDur = (1.0 / visualBeat) * 2.0;
    if (comp.nextBeatTime < t - 0.5 || isNaN(comp.nextBeatTime) || comp.nextBeatTime > t + maxExpectedDur) {
        comp.nextBeatTime = t;
    }

    const composerEvents: Array<{ time: number, freq: number, amp: number }> = [];
    let loopLimit = 0;
    
    if (composerWarp !== 'LINEAR' && comp.isRunning) {
        const sumTime = matrix.timeWarp[0] + matrix.timeWarp[1] + matrix.timeWarp[2] + matrix.timeWarp[3];
        
        while (comp.nextBeatTime < t + LOOKAHEAD && loopLimit < 10) {
            loopLimit++;
            const safeTime = Math.max(t + 0.005, comp.nextBeatTime);
            
            const rawTimeWarp = matrix.timeWarp[comp.currentBeatIndex];
            const rawAmpWarp = matrix.ampWarp[comp.currentBeatIndex];
            
            const normalizedTimeWarp = (rawTimeWarp / sumTime) * 4.0;
            
            // INTENSITY SLIDER MAP
            const timeWarpFactor = Math.max(0.1, 1.0 + (normalizedTimeWarp - 1.0) * intensity);
            const ampWarpFactor = Math.max(0.0, 1.0 + (rawAmpWarp - 1.0) * intensity);
            
            const beatDur = (1.0 / visualBeat) * timeWarpFactor;
            const beatFreq = 1.0 / beatDur;

            composerEvents.push({ time: safeTime, freq: beatFreq, amp: ampWarpFactor });

            comp.nextBeatTime += beatDur;
            comp.currentBeatIndex = (comp.currentBeatIndex + 1) % 4;
        }
    }

    const currentTcState = isTimeCrystal ? evaluateTimeCrystal(payload.now, visualBeat, tcTopology) : 1.0;

    let activeNodes = 0;
    LATTICE_CHANNELS.forEach(ch => {
        const isPhoticMute = isPhotic && (ch.id === 'UNIVERSAL_0' || ch.id === 'UNIVERSAL_4');
        const isChordVoice = ch.id.startsWith('UNIVERSAL_84');
        const isMusicalModeVoice = isChordVoice || ch.id.startsWith('MUSIC_SCALE') || ch.type === 'SCALE';
        const isMuted = payload.mutes[ch.id] || payload.stackMutes[ch.type] || isPhoticMute || (effectiveMode === 'SILENT' && !isChordVoice && !(payload.isMusicMode && isMusicalModeVoice));

        if (!isMuted) {
            const willPlay = isChordVoice || payload.activeHarmonicIndex === undefined || payload.activeHarmonicIndex === -1 || parseInt(ch.id.split('_')[1] || '0') === payload.activeHarmonicIndex;
            if (willPlay && (isChordVoice || isAether || effectiveMode === 'DRONE' || effectiveMode === 'SYNCED' || DRONE_TYPES.has(ch.type) || payload.hits.includes(ch.id))) {
                activeNodes++;
            }
        }
    });

    const normalizationScaler = activeNodes > 0 ? (1.0 / Math.pow(activeNodes, 0.7)) : 1.0;
    const MASTER_HEADROOM = 0.8; 

    const instructions: Record<string, ChannelInstruction> = {};

    let dynamicGlideTime: number | undefined = undefined;
    if (payload.chordGlideConfig?.enabled) {
        if (payload.chordGlideConfig.syncToBreath) {
            const mult = payload.chordGlideConfig.breathSyncMultiplier ?? 1.0;
            const target = payload.chordGlideConfig.breathSyncTarget || 'PHASE';
            const bConfig = payload.breathConfig;
            const inhaleTime = Math.max(0.2, bConfig?.inhale !== undefined ? Number(bConfig.inhale) : 4);
            const exhaleTime = Math.max(0.2, bConfig?.exhale !== undefined ? Number(bConfig.exhale) : 6);
            const holdInTime = bConfig?.holdIn !== undefined ? Number(bConfig.holdIn) : 0;
            const holdOutTime = bConfig?.holdOut !== undefined ? Number(bConfig.holdOut) : 0;

            if (target === 'INHALE') {
                dynamicGlideTime = Math.max(0.05, inhaleTime * mult);
            } else if (target === 'EXHALE') {
                dynamicGlideTime = Math.max(0.05, exhaleTime * mult);
            } else if (target === 'CYCLE') {
                dynamicGlideTime = Math.max(0.05, (inhaleTime + holdInTime + exhaleTime + holdOutTime) * mult);
            } else {
                // 'PHASE': dynamically match active breath phase (Inhale duration on Inhale, Exhale duration on Exhale)
                const isExhale = payload.breathPhase === 'EXHALE';
                dynamicGlideTime = Math.max(0.05, (isExhale ? exhaleTime : inhaleTime) * mult);
            }
        } else {
            dynamicGlideTime = payload.chordGlideConfig.time;
        }
    }

    LATTICE_CHANNELS.forEach(ch => {
        const isPhoticMute = isPhotic && (ch.id === 'UNIVERSAL_0' || ch.id === 'UNIVERSAL_4');
        const isChordVoice = ch.id.startsWith('UNIVERSAL_84');
        const isMusicalModeVoice = isChordVoice || ch.id.startsWith('MUSIC_SCALE') || ch.type === 'SCALE';
        const isMuted = payload.mutes[ch.id] || payload.stackMutes[ch.type] || isPhoticMute || (effectiveMode === 'SILENT' && !isChordVoice && !(payload.isMusicMode && isMusicalModeVoice)); 
        
        let volLimit = (payload.volumes[ch.id] !== undefined ? payload.volumes[ch.id] : 1.0) * ch.defaultVol;
        const volFreq = (isChordVoice && payload.customFrequencies?.[ch.id]) ? payload.customFrequencies[ch.id] : ch.freq;
        volLimit *= Math.pow(Math.min(1.0, 300 / volFreq), 1.2);

        const isHit = payload.hits.includes(ch.id);
        const isContinuous = effectiveMode === 'DRONE' || effectiveMode === 'SYNCED' || isAether || isChordVoice;

        let targetGain = 0;
        if (!isMuted) {
            if (effectiveMode === 'SYNCED') {
                if (!payload.isBreathActive) {
                    targetGain = 0;
                } else {
                    let volumeMod = 1.0;
                    const currentPhase = payload.breathPhase || 'IDLE';
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
                    if (currentPhase === 'HOLD_IN') applyBehavior(payload.breathConfig?.holdBehavior);
                    else if (currentPhase === 'HOLD_OUT') applyBehavior(payload.breathConfig?.waitBehavior);

                    const radius = Math.max(0, Math.min(1, payload.breathRadius ?? 0));
                    // Organic equal-power sinusoidal breath curve with subtle 0.05 base floor
                    const breathSwell = 0.05 + 0.95 * Math.sin((radius * Math.PI) / 2);
                    targetGain = volLimit * volumeMod * breathSwell;
                }
            } else if (isChordVoice || isAether || effectiveMode === 'DRONE' || (effectiveMode !== 'SILENT' && (DRONE_TYPES.has(ch.type) || isHit))) {
                targetGain = volLimit;
            }
        }

        if (!isChordVoice && payload.activeHarmonicIndex !== undefined && payload.activeHarmonicIndex !== -1 && parseInt(ch.id.split('_')[1] || '0') !== payload.activeHarmonicIndex) {
            targetGain = 0;
        }

        targetGain *= (payload.harmonicMasterVolume ?? 1.0) * MASTER_HEADROOM * normalizationScaler;

        if (payload.isBreathActive && payload.breathConfig?.isSenticPacing && payload.breathConfig?.senticState !== 'NO_EMOTION') {
            targetGain *= (1.0 + ((payload.signals?.vibratoEnvelope || 0) * (payload.breathConfig?.senticVibratoDepth ?? 0.5) * 0.5));
        }

        const effectiveBaseFreq = (payload.customFrequencies && payload.customFrequencies[ch.id]) ? payload.customFrequencies[ch.id] : ch.freq;
        let finalFreq = effectiveBaseFreq * payload.pitchMultiplier + carrierDriftAmt;

        // POLYVAGAL HUMAN VOCAL PROSODY LILT (Calm Organic Pitch Contour)
        // Mimics subtle soothing human vocal inflection synchronized with the breath cycle.
        // STRICT: Zero rapid vibrato or micro-tremor (eliminates any warble/froggy artifact).
        // STRICT PROTECTION: Strictly isolated to ambient drone voices. Never modulates
        // musical mode chord voices, scale voices, or voices participating in musical mode chord glide.
        const canApplyProsody = payload.polyvagalConfig?.enabled && 
            !payload.polyvagalConfig?.isEmergencyGrounded && 
            payload.polyvagalConfig?.vocalProsodyLilt && 
            !isMusicalModeVoice;

        if (canApplyProsody) {
            const blend = typeof globalPolyvagalTelemetry.phaseBlend === 'number' ? globalPolyvagalTelemetry.phaseBlend : 1.0;
            if (blend > 0.001) {
                const prosodyPhase = (typeof payload.breathRadius === 'number') ? payload.breathRadius : (Math.sin(t * 2 * Math.PI * 0.083) * 0.5 + 0.5);
                const userProsodyDepth = Math.max(0.0, Math.min(1.0, payload.polyvagalConfig.prosodyDepth ?? 0.25));
                
                // Pure, smooth, slow respiratory contour (gentle lift during inhalation, soothing settling during exhale)
                // Zero high-frequency tremor or jitter: pure sine arch over the breath period
                const naturalCurve = (prosodyPhase - 0.5) * 2.0; // -1.0 to +1.0

                // Ultra-gentle swing: ±1.0 to ±3.5 cents max (inaudible as pitch shift, perceived purely as organic breath warmth)
                const maxCents = 1.0 + userProsodyDepth * 2.5;
                const centsOffset = naturalCurve * maxCents * blend;
                const prosodyMultiplier = Math.pow(2, centsOffset / 1200);
                finalFreq *= prosodyMultiplier;
            }
        }

        if (payload.aetherConfig?.isPureTone && isAether) finalFreq = payload.aetherConfig.entrainmentTarget;
        
        // HARMONIC FIFTH FIX: STATIC correctly anchors to a hard 1.0 (pure 3:2 shift) instead of biometrics
        if (payload.immersionConfig?.isPerfectFifth && ch.type === 'UNIVERSAL' && !ch.id.startsWith('UNIVERSAL_84')) {
            const shiftPhase = payload.immersionConfig?.isPerfectFifthBreathSync ? payload.breathRadius : 1.0;
            finalFreq += ((finalFreq * 1.5) - finalFreq) * shiftPhase;
        }

        let bBeat = isBinauralActive
            ? (payload.binauralFreqs[ch.type] || payload.binauralFreqs['UNIVERSAL'] || ch.binauralBeat || 8.0)
            : 0;
        if (isFractalSync && isBinauralActive) {
            bBeat = finalFreq / 32;
        }

        const lfoDepthGain = isIsochronicActive ? 0.5 : 0;

        // Golden panner disabled to maintain pure focused entrainment
        const panValue = 0;

        // HARMONIC RESPIRATION TENSION MAPPING:
        // When breathHarmonicTension is active on chord voices (UNIVERSAL_840-UNIVERSAL_847),
        // subtly swell presence during INHALE (+15% gain / prana expansion) and settle into pure fundamental during EXHALE (-10% gain / apana release)
        if (ch.id.startsWith('UNIVERSAL_84') && payload.chordGlideConfig?.breathHarmonicTension && payload.isBreathActive) {
            if (payload.breathPhase === 'INHALE') {
                targetGain *= 1.15;
            } else if (payload.breathPhase === 'EXHALE') {
                targetGain *= 0.90;
            }
        }

        let tcEvents: Array<{time: number, state: boolean}> = [];
        let nextTcTime = memory[ch.id]?.tcLastTime || 0; 
        
        if (isContinuous && isTimeCrystal) {
            const mem = memory[ch.id] || {};
            const lookaheadEnd = payload.now + 0.3; 
            const queryStart = Math.max(payload.now, mem.tcLastTime || payload.now);
            
            if (queryStart < lookaheadEnd) {
                tcEvents = getTimeCrystalEvents(queryStart, lookaheadEnd, visualBeat, tcTopology).map(e => ({ time: e.time, state: e.state }));
                nextTcTime = lookaheadEnd; 
            }
        }

        instructions[ch.id] = {
            id: ch.id,
            isMuted, targetGain,
            leftFreq: finalFreq - (bBeat/2), rightFreq: finalFreq + (bBeat/2),
            panValue, 
            waveType,
            lfoFreq: visualBeat,
            lfoDepthGain,
            envTimeConstant: effectiveMode === 'SYNCED' ? 0.08 : ((targetGain > ((memory[ch.id]?.lastTarget) || 0)) ? payload.currentAttack : payload.currentRelease),
            isContinuous, isHit, pulseMode: effectivePulseMode,
            activeLayers, powerScale: layerMixGain, baseCarrierFreq: finalFreq, beatDeltaFreq: bBeat,
            isTimeCrystal, tcState: currentTcState, tcEvents, nextTcTime,
            composerEvents,
            glideTime: dynamicGlideTime,
            glideCurve: payload.chordGlideConfig?.enabled ? payload.chordGlideConfig.curve : undefined,
            baseChordFreq: effectiveBaseFreq,
            plannedSourceFreq: payload.chordVoiceSourceFreqs?.[ch.id],
            isConjugatePhase: Boolean(payload.immersionConfig?.isConjugatePhase),
            isochronicHardEdge: Boolean(payload.immersionConfig?.isochronicHardEdge)
        };
    });

    return instructions;
};

interface LatticeAuxLayers {
    monoGain: GainNode;
    monoOsc1: OscillatorNode;
    monoOsc2: OscillatorNode;
}

const ensureLayerNodes = (inst: ChannelInstruction, graph: AudioGraph, t: number): LatticeAuxLayers | null => {
    if (!(graph as any)._latticeLayers) (graph as any)._latticeLayers = {};
    const map = (graph as any)._latticeLayers;
    if (map[inst.id]) return map[inst.id];

    const ctx = graph.ctx;
    const isoGate = (graph as any)._latticeIsoGates?.[inst.id];
    const gainNode = graph.latticeGains[inst.id];
    if (!gainNode || !isoGate) return null;

    // Monaural beat generator (sum of twin centered carriers creating physical acoustic interference)
    const monoGain = ctx.createGain();
    monoGain.gain.value = 0;
    const monoOsc1 = ctx.createOscillator();
    const monoOsc2 = ctx.createOscillator();
    monoOsc1.type = inst.waveType || 'sine';
    monoOsc2.type = inst.waveType || 'sine';
    monoOsc1.frequency.value = inst.leftFreq;
    monoOsc2.frequency.value = inst.rightFreq;
    monoOsc1.connect(monoGain);
    monoOsc2.connect(monoGain);
    monoGain.connect(isoGate); // Routes into isoGate so monaural beats also pulse if isochronic is active!
    monoOsc1.start(t);
    monoOsc2.start(t);

    const layerObj: LatticeAuxLayers = {
        monoGain, monoOsc1, monoOsc2
    };
    map[inst.id] = layerObj;
    return layerObj;
};

const createNodesIfMissing = (inst: ChannelInstruction, graph: AudioGraph, t: number) => {
    if (!graph.latticeGains[inst.id]) {
        const ctx = graph.ctx;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; 
        
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        leftOsc.type = inst.waveType || 'sine';
        rightOsc.type = inst.waveType || 'sine';

        const beatDiff = (inst.rightFreq - inst.leftFreq) / 2;
        const initLeft = (inst.plannedSourceFreq && Math.abs(inst.plannedSourceFreq - (inst.baseChordFreq ?? 0)) > 0.5)
            ? (inst.plannedSourceFreq - beatDiff)
            : inst.leftFreq;
        const initRight = (inst.plannedSourceFreq && Math.abs(inst.plannedSourceFreq - (inst.baseChordFreq ?? 0)) > 0.5)
            ? (inst.plannedSourceFreq + beatDiff)
            : inst.rightFreq;

        leftOsc.frequency.value = initLeft;
        rightOsc.frequency.value = initRight;
        
        const pannerNode = ctx.createStereoPanner();
        pannerNode.pan.value = inst.panValue;
        
        const merger = ctx.createChannelMerger(2);
        leftOsc.connect(merger, 0, 0);

        // 180° Anti-Phase polarity reversal stage on right ear path
        const rightInverter = ctx.createGain();
        rightInverter.gain.value = inst.isConjugatePhase ? -1.0 : 1.0;
        rightOsc.connect(rightInverter);
        rightInverter.connect(merger, 0, 1);

        merger.connect(pannerNode);

        // Binaural sub-gain for constant-power balance and seamless mode switching
        const binGain = ctx.createGain();
        binGain.gain.value = 1.0;
        pannerNode.connect(binGain);

        // Clinical Isochronic Pulse Gate (0.0 silent floor to 1.0 peak)
        const isoGate = ctx.createGain();
        isoGate.gain.value = 1.0;
        binGain.connect(isoGate);
        isoGate.connect(gainNode);

        // Isochronic LFO and Depth Attenuator
        const lfoDepth = ctx.createGain();
        lfoDepth.gain.value = 0.0;

        const lfoNode = ctx.createOscillator();
        if (inst.isochronicHardEdge) {
            lfoNode.setPeriodicWave(getClinicalSquareWave(ctx));
        } else {
            lfoNode.type = 'sine';
        }
        lfoNode.frequency.value = inst.lfoFreq;
        lfoNode.connect(lfoDepth);
        lfoDepth.connect(isoGate.gain);
        
        // CLINICAL ENTRAINMENT SAFEGUARD:
        // Entrainment carriers and pulses require pristine phase coherence.
        // Pure entrainment channels bypass spatial reverb and delay to preserve 100% pulse precision and prevent smearing.
        const isEntrainmentChannel = (inst.pulseMode && inst.pulseMode !== 'OFF') || 
            (inst.activeLayers && inst.activeLayers.length > 0) || 
            Math.abs(inst.leftFreq - inst.rightFreq) > 0.05;
        if (!isEntrainmentChannel) {
            gainNode.connect(graph.delayNode);
            gainNode.connect(graph.reverbGain);
        }
        gainNode.connect(graph.masterGain);
        
        leftOsc.start(t);
        rightOsc.start(t);
        lfoNode.start(t);
        
        graph.latticeGains[inst.id] = gainNode;
        graph.latticeOscs[inst.id] = { left: leftOsc, right: rightOsc };
        graph.latticePanners[inst.id] = pannerNode;
        graph.latticeLfos[inst.id] = lfoNode;
        
        if (!(graph as any)._latticeMergers) (graph as any)._latticeMergers = {};
        (graph as any)._latticeMergers[inst.id] = merger;
        if (!(graph as any)._latticeBinGains) (graph as any)._latticeBinGains = {};
        (graph as any)._latticeBinGains[inst.id] = binGain;
        if (!(graph as any)._latticeRightInverters) (graph as any)._latticeRightInverters = {};
        (graph as any)._latticeRightInverters[inst.id] = rightInverter;
        if (!(graph as any)._latticeIsoGates) (graph as any)._latticeIsoGates = {};
        (graph as any)._latticeIsoGates[inst.id] = isoGate;
        if (!(graph as any)._latticeLfoDepths) (graph as any)._latticeLfoDepths = {};
        (graph as any)._latticeLfoDepths[inst.id] = lfoDepth;
    }
};

const destroyNodes = (id: string, graph: AudioGraph) => {
    // CRITICAL: Persistent chord voice channels (UNIVERSAL_840-UNIVERSAL_847) must never be destroyed!
    // Keeping their oscillators running at gain=0 preserves phase continuity and guarantees immediate, click-free glides.
    if (id.startsWith('UNIVERSAL_84')) return;

    try {
        graph.latticeOscs[id]?.left.stop();
        graph.latticeOscs[id]?.right.stop();
        graph.latticeLfos[id]?.stop();
        
        graph.latticeOscs[id]?.left.disconnect();
        graph.latticeOscs[id]?.right.disconnect();
        graph.latticeLfos[id]?.disconnect();
        graph.latticePanners[id]?.disconnect();
        graph.latticeGains[id]?.disconnect();
        
        if ((graph as any)._latticeMergers?.[id]) {
            try { (graph as any)._latticeMergers[id].disconnect(); } catch(e) {}
            delete (graph as any)._latticeMergers[id];
        }

        if ((graph as any)._latticeRightInverters?.[id]) {
            try { (graph as any)._latticeRightInverters[id].disconnect(); } catch(e) {}
            delete (graph as any)._latticeRightInverters[id];
        }

        if ((graph as any)._latticeBinGains?.[id]) {
            try { (graph as any)._latticeBinGains[id].disconnect(); } catch(e) {}
            delete (graph as any)._latticeBinGains[id];
        }

        if ((graph as any)._latticeIsoGates?.[id]) {
            try { (graph as any)._latticeIsoGates[id].disconnect(); } catch(e) {}
            delete (graph as any)._latticeIsoGates[id];
        }

        if ((graph as any)._latticeLfoDepths?.[id]) {
            try { (graph as any)._latticeLfoDepths[id].disconnect(); } catch(e) {}
            delete (graph as any)._latticeLfoDepths[id];
        }

        if ((graph as any)._latticeLayers?.[id]) {
            const l = (graph as any)._latticeLayers[id];
            try { l.monoOsc1?.stop(); l.monoOsc1?.disconnect(); } catch(e) {}
            try { l.monoOsc2?.stop(); l.monoOsc2?.disconnect(); } catch(e) {}
            try { l.monoGain?.disconnect(); } catch(e) {}
            delete (graph as any)._latticeLayers[id];
        }
    } catch (e) {}
    
    delete graph.latticeGains[id];
    delete graph.latticeOscs[id];
    delete graph.latticePanners[id];
    delete graph.latticeLfos[id];
};

const renderLatticeAudio = (graph: AudioGraph, instructions: Record<string, ChannelInstruction>, payload: AudioPayload, t: number, memory: Record<string, ChannelMemory>) => {
    const audioT = t + LOOKAHEAD;

    Object.values(instructions).forEach(inst => {
        if (!memory[inst.id]) memory[inst.id] = {};
        const mem = memory[inst.id];
        const safeTimeConstant = Math.max(0.01, inst.envTimeConstant);

        if ((mem as any).destroyTime && t > (mem as any).destroyTime) {
            destroyNodes(inst.id, graph);
            (mem as any).destroyTime = 0;
            mem.isMuted = true;
            mem.appliedGain = 0;
            if (mem.lfoIso?.active) {
                try { mem.lfoIso.depthNode.disconnect(); } catch(e) {}
                mem.lfoIso.active = false;
            }
        }

        if (inst.isMuted || payload.isMasterPaused) {
            mem.isMuted = true;
            if (graph.latticeGains[inst.id]) {
                const gainNode = graph.latticeGains[inst.id];
                try {
                    if (typeof (gainNode.gain as any).cancelAndHoldAtTime === 'function') {
                        (gainNode.gain as any).cancelAndHoldAtTime(t);
                    } else {
                        gainNode.gain.cancelScheduledValues(t);
                        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
                    }
                    const releaseTime = 0.025;
                    gainNode.gain.setTargetAtTime(0, t, releaseTime);
                } catch(e) {}
                if (!payload.isMasterPaused && !inst.id.startsWith('UNIVERSAL_84') && !(mem as any).destroyTime) {
                    (mem as any).destroyTime = t + 0.15;
                }
            }
            return; 
        }

        if ((mem as any).destroyTime) {
            (mem as any).destroyTime = 0;
            mem.isMuted = false;
        }

        if (mem.isMuted) {
            mem.isMuted = false;
        }

        if (!graph.latticeGains[inst.id]) {
            createNodesIfMissing(inst, graph, t);
            mem.isMuted = false;
            mem.appliedGain = -1;
            mem.appliedLeftFreq = inst.leftFreq;
            mem.appliedRightFreq = inst.rightFreq;
            mem.appliedPan = -999;
            mem.appliedLfoFreq = -1;
        }
        
        const gainNode = graph.latticeGains[inst.id];
        const oscs = graph.latticeOscs[inst.id];
        const pannerNode = graph.latticePanners[inst.id];
        const lfoNode = graph.latticeLfos?.[inst.id]; 

        if (oscs && inst.waveType) {
            if (oscs.left.type !== inst.waveType) oscs.left.type = inst.waveType;
            if (oscs.right.type !== inst.waveType) oscs.right.type = inst.waveType;
        }

        if (Math.abs(inst.panValue - (mem.appliedPan || -999)) > 0.001) {
            pannerNode.pan.setTargetAtTime(inst.panValue, t, 0.1);
            mem.appliedPan = inst.panValue;
        }

        // Real-time 180° Anti-Phase polarity reversal transition handler
        const rightInverter = (graph as any)._latticeRightInverters?.[inst.id];
        if (rightInverter) {
            const targetPhaseGain = inst.isConjugatePhase ? -1.0 : 1.0;
            if (Math.abs(targetPhaseGain - (mem.appliedPhaseGain ?? 1.0)) > 0.05) {
                setConjugatePhase(rightInverter, Boolean(inst.isConjugatePhase), graph.ctx);
                mem.appliedPhaseGain = targetPhaseGain;
            }
        }

        // LAYER STACKING & CONSTANT POWER HEADROOM MANAGEMENT
        const layers = (inst.activeLayers !== undefined)
            ? inst.activeLayers.map(l => (l ? l.toLowerCase() : 'binaural') as EntrainmentLayer)
            : (inst.pulseMode === 'ISOCHRONIC' ? ['isochronic'] : inst.pulseMode === 'MONAURAL' ? ['monaural'] : inst.pulseMode === 'OFF' ? [] : ['binaural']);
        const isBin = layers.includes('binaural');
        const isIso = layers.includes('isochronic');
        const isMono = layers.includes('monaural');
        const pScale = inst.powerScale || (1.0 / Math.sqrt(Math.max(1, layers.length)));
        const binGain = (graph as any)._latticeBinGains?.[inst.id];
        const isoGate = (graph as any)._latticeIsoGates?.[inst.id];
        const lfoDepth = (graph as any)._latticeLfoDepths?.[inst.id];

        // 1. Binaural Carrier Level
        if (binGain) {
            // When binaural is active, binGain passes the stereo pair.
            // When only isochronic is active (without binaural or monaural), binGain passes the centered carrier.
            const targetBinGain = isBin ? pScale : (isIso && !isMono ? pScale : (layers.length === 0 ? pScale : 0));
            if (Math.abs(targetBinGain - (mem.appliedBinGain ?? -1)) > 0.001) {
                binGain.gain.setTargetAtTime(targetBinGain, t, 0.03);
                mem.appliedBinGain = targetBinGain;
            }
        }

        // 2. Monaural Layer Level
        if (isMono || (graph as any)._latticeLayers?.[inst.id]) {
            const aux = ensureLayerNodes(inst, graph, t);
            if (aux) {
                const targetMonoGain = isMono ? pScale * 0.5 : 0;
                if (Math.abs(targetMonoGain - (mem.appliedMonoGain ?? -1)) > 0.001) {
                    aux.monoGain.gain.setTargetAtTime(targetMonoGain, t, 0.03);
                    mem.appliedMonoGain = targetMonoGain;
                }
            }
        }

        // 3. Clinical Isochronic Pulse Gate Level & Waveform
        if (isoGate && lfoDepth && lfoNode) {
            if (isIso) {
                // Isochronic active: base 0.5 + modulation 0.5 = pulse strictly between 0.0 and 1.0
                if (Math.abs(0.5 - (mem.appliedIsoBase ?? -1)) > 0.001) {
                    isoGate.gain.setTargetAtTime(0.5, t, 0.03);
                    lfoDepth.gain.setTargetAtTime(0.5, t, 0.03);
                    mem.appliedIsoBase = 0.5;
                }
                
                // Update LFO Frequency (e.g. 40.0 Hz)
                if (Math.abs(inst.lfoFreq - (mem.appliedLfoFreq || -1)) > 0.01) {
                    lfoNode.frequency.setTargetAtTime(inst.lfoFreq, t, 0.02);
                    mem.appliedLfoFreq = inst.lfoFreq;
                }

                // Update LFO Waveform (Gibbs-free Lanczos Square vs Pure Sine)
                const isochronicWaveType = inst.isochronicHardEdge ? 'square' : 'sine';
                if (mem.appliedIsoWaveType !== isochronicWaveType) {
                    if (inst.isochronicHardEdge) {
                        lfoNode.setPeriodicWave(getClinicalSquareWave(graph.ctx));
                    } else {
                        lfoNode.type = 'sine';
                    }
                    mem.appliedIsoWaveType = isochronicWaveType;
                }
            } else {
                // Isochronic inactive: unity gain pass-through (1.0 floor, 0.0 modulation)
                if (mem.appliedIsoBase !== 1.0) {
                    isoGate.gain.setTargetAtTime(1.0, t, 0.03);
                    lfoDepth.gain.setTargetAtTime(0.0, t, 0.03);
                    mem.appliedIsoBase = 1.0;
                }
            }
        }

        const auxNode = (graph as any)._latticeLayers?.[inst.id];
        const syncAuxFreqs = (isChordChange: boolean, isGliding: boolean, fL: number, fR: number) => {
            if (!auxNode) return;
            if (isChordChange && inst.glideTime && inst.glideTime > 0.01) {
                scheduleVoiceGlide(auxNode.monoOsc1.frequency, inst.leftFreq, t, inst.glideTime, fL, inst.glideCurve || 'EXPONENTIAL');
                scheduleVoiceGlide(auxNode.monoOsc2.frequency, inst.rightFreq, t, inst.glideTime, fR, inst.glideCurve || 'EXPONENTIAL');
            } else if (!isGliding) {
                auxNode.monoOsc1.frequency.setTargetAtTime(inst.leftFreq, t, 0.05);
                auxNode.monoOsc2.frequency.setTargetAtTime(inst.rightFreq, t, 0.05);
            }
        };

        if (inst.isContinuous) {
            if (inst.isTimeCrystal) {
                if (!mem.isTcActive) {
                    try { gainNode.gain.cancelAndHoldAtTime(t); } catch(e) { 
                        gainNode.gain.cancelScheduledValues(t); 
                        gainNode.gain.setValueAtTime(gainNode.gain.value, t);
                    }
                    mem.isTcActive = true;
                    mem.tcLastTime = payload.now;
                    
                    let initVol = inst.targetGain;
                    if (inst.pulseMode === 'ISOCHRONIC') initVol *= inst.tcState > 0.5 ? 1.0 : 0.05;
                    else if (inst.tcState < 0.5) initVol *= 0.5; 
                    
                    gainNode.gain.setTargetAtTime(initVol, audioT, 0.02);
                    oscs.left.frequency.setTargetAtTime(inst.leftFreq, audioT, 0.02);
                    oscs.right.frequency.setTargetAtTime(inst.rightFreq, audioT, 0.02);
                    mem.appliedGain = initVol;
                }

                inst.tcEvents.forEach(event => {
                    const eventAudioTime = audioT + (event.time - payload.now);
                    let evVol = inst.targetGain;
                    if (inst.pulseMode === 'ISOCHRONIC') evVol *= event.state ? 1.0 : 0.05;
                    else if (!event.state) evVol *= 0.5; 
                    
                    gainNode.gain.setTargetAtTime(evVol, eventAudioTime, 0.02);
                    oscs.left.frequency.setTargetAtTime(inst.leftFreq, eventAudioTime, 0.02);
                    oscs.right.frequency.setTargetAtTime(inst.rightFreq, eventAudioTime, 0.02);
                    mem.appliedGain = evVol;
                });
                
                if (inst.nextTcTime > 0) {
                    mem.tcLastTime = inst.nextTcTime; 
                }

            } else {
                if (mem.isTcActive) {
                    try { gainNode.gain.cancelAndHoldAtTime(t); } catch(e) { gainNode.gain.cancelScheduledValues(t); }
                    mem.isTcActive = false;
                    mem.tcLastTime = 0;
                    mem.appliedGain = -1; 
                }

                // NATIVE BASELINE ARCHITECTURE: Perfectly merges the breath envelope and the rhythm matrix
                if (inst.composerEvents && inst.composerEvents.length > 0) {
                    inst.composerEvents.forEach(ev => {
                        const warpedBaseVol = inst.targetGain * ev.amp;
                        
                        // Sharpened the envelope from 0.05 to 0.015 for precise, punchy accents
                        gainNode.gain.setTargetAtTime(warpedBaseVol, ev.time, 0.015);
                        
                        if (isIso) {
                            lfoNode.frequency.setValueAtTime(ev.freq, ev.time);
                        }
                    });
                    mem.appliedGain = inst.targetGain; 
                } else {
                    // Smooth direct real-time envelope tracking with epsilon diffing
                    if (Math.abs(inst.targetGain - (mem.appliedGain ?? -1)) > 0.0005) {
                        gainNode.gain.setTargetAtTime(inst.targetGain, t, safeTimeConstant);
                        mem.appliedGain = inst.targetGain;
                        mem.lastTarget = inst.targetGain;
                    }
                }
                
                const isGliding = (mem.glideEndTime !== undefined) && (t < mem.glideEndTime);
                const isChordChange = (inst.baseChordFreq !== undefined) && Math.abs(inst.baseChordFreq - (mem.appliedBaseChordFreq || -1)) > 0.5;
                if (isChordChange) {
                    const beatDiff = (inst.rightFreq - inst.leftFreq) / 2;
                    const fallbackL = (inst.plannedSourceFreq && Math.abs(inst.plannedSourceFreq - (inst.baseChordFreq ?? 0)) > 0.5)
                        ? (inst.plannedSourceFreq - beatDiff)
                        : (mem.appliedLeftFreq ?? oscs.left.frequency.value);
                    const fallbackR = (inst.plannedSourceFreq && Math.abs(inst.plannedSourceFreq - (inst.baseChordFreq ?? 0)) > 0.5)
                        ? (inst.plannedSourceFreq + beatDiff)
                        : (mem.appliedRightFreq ?? oscs.right.frequency.value);

                    const fromL = isGliding ? (oscs.left.frequency.value || mem.appliedLeftFreq || fallbackL) : (mem.appliedLeftFreq || fallbackL);
                    const fromR = isGliding ? (oscs.right.frequency.value || mem.appliedRightFreq || fallbackR) : (mem.appliedRightFreq || fallbackR);
                    mem.appliedBaseChordFreq = inst.baseChordFreq;
                    if (inst.glideTime && inst.glideTime > 0.01) {
                        mem.glideEndTime = t + inst.glideTime;
                        scheduleVoiceGlide(oscs.left.frequency, inst.leftFreq, t, inst.glideTime, fromL, inst.glideCurve || 'EXPONENTIAL');
                        scheduleVoiceGlide(oscs.right.frequency, inst.rightFreq, t, inst.glideTime, fromR, inst.glideCurve || 'EXPONENTIAL');
                    } else {
                        mem.glideEndTime = undefined;
                        oscs.left.frequency.setTargetAtTime(inst.leftFreq, t, 0.05);
                        oscs.right.frequency.setTargetAtTime(inst.rightFreq, t, 0.05);
                    }
                    mem.appliedLeftFreq = inst.leftFreq;
                    mem.appliedRightFreq = inst.rightFreq;
                    syncAuxFreqs(true, isGliding, fromL, fromR);
                } else if (!isGliding) {
                    // Continuous micro-frequency tracking (vocal prosody lilt, subtle drift)
                    // ONLY applied when voice is NOT actively gliding, strictly preventing any interruption to chord glide
                    if (Math.abs(inst.leftFreq - (mem.appliedLeftFreq || -1)) > 0.001) {
                        oscs.left.frequency.setTargetAtTime(inst.leftFreq, t, 0.08);
                        mem.appliedLeftFreq = inst.leftFreq;
                    }
                    if (Math.abs(inst.rightFreq - (mem.appliedRightFreq || -1)) > 0.001) {
                        oscs.right.frequency.setTargetAtTime(inst.rightFreq, t, 0.08);
                        mem.appliedRightFreq = inst.rightFreq;
                    }
                    syncAuxFreqs(false, false, inst.leftFreq, inst.rightFreq);
                }
            }
        } else {
            const isGliding = (mem.glideEndTime !== undefined) && (t < mem.glideEndTime);
            const isChordChange = (inst.baseChordFreq !== undefined) && Math.abs(inst.baseChordFreq - (mem.appliedBaseChordFreq || -1)) > 0.5;
            if (isChordChange) {
                const beatDiff = (inst.rightFreq - inst.leftFreq) / 2;
                const fallbackL = (inst.plannedSourceFreq && Math.abs(inst.plannedSourceFreq - (inst.baseChordFreq ?? 0)) > 0.5)
                    ? (inst.plannedSourceFreq - beatDiff)
                    : (mem.appliedLeftFreq ?? oscs.left.frequency.value);
                const fallbackR = (inst.plannedSourceFreq && Math.abs(inst.plannedSourceFreq - (inst.baseChordFreq ?? 0)) > 0.5)
                    ? (inst.plannedSourceFreq + beatDiff)
                    : (mem.appliedRightFreq ?? oscs.right.frequency.value);

                const fromL = isGliding ? (oscs.left.frequency.value || mem.appliedLeftFreq || fallbackL) : (mem.appliedLeftFreq || fallbackL);
                const fromR = isGliding ? (oscs.right.frequency.value || mem.appliedRightFreq || fallbackR) : (mem.appliedRightFreq || fallbackR);
                mem.appliedBaseChordFreq = inst.baseChordFreq;
                if (inst.glideTime && inst.glideTime > 0.01) {
                    mem.glideEndTime = t + inst.glideTime;
                    scheduleVoiceGlide(oscs.left.frequency, inst.leftFreq, t, inst.glideTime, fromL, inst.glideCurve || 'EXPONENTIAL');
                    scheduleVoiceGlide(oscs.right.frequency, inst.rightFreq, t, inst.glideTime, fromR, inst.glideCurve || 'EXPONENTIAL');
                } else {
                    mem.glideEndTime = undefined;
                    oscs.left.frequency.setTargetAtTime(inst.leftFreq, t, 0.05);
                    oscs.right.frequency.setTargetAtTime(inst.rightFreq, t, 0.05);
                }
                mem.appliedLeftFreq = inst.leftFreq;
                mem.appliedRightFreq = inst.rightFreq;
                syncAuxFreqs(true, isGliding, fromL, fromR);
            } else if (!isGliding) {
                if (Math.abs(inst.leftFreq - (mem.appliedLeftFreq || -1)) > 0.001) {
                    oscs.left.frequency.setTargetAtTime(inst.leftFreq, t, 0.08);
                    mem.appliedLeftFreq = inst.leftFreq;
                }
                if (Math.abs(inst.rightFreq - (mem.appliedRightFreq || -1)) > 0.001) {
                    oscs.right.frequency.setTargetAtTime(inst.rightFreq, t, 0.08);
                    mem.appliedRightFreq = inst.rightFreq;
                }
                syncAuxFreqs(false, false, inst.leftFreq, inst.rightFreq);
            }
            
            if (inst.isHit && inst.targetGain > 0) {
                if (!mem.isHit) {
                    try { 
                        if (typeof (gainNode.gain as any).cancelAndHoldAtTime === 'function') {
                            (gainNode.gain as any).cancelAndHoldAtTime(t);
                        } else {
                            gainNode.gain.cancelScheduledValues(t);
                            gainNode.gain.setValueAtTime(0, audioT);
                        }
                    } catch(e) {}
                    gainNode.gain.setValueAtTime(0, audioT);
                    gainNode.gain.linearRampToValueAtTime(inst.targetGain, audioT + payload.currentAttack);
                    gainNode.gain.setTargetAtTime(0, audioT + payload.currentAttack, payload.currentRelease);
                    gainNode.gain.setValueAtTime(0, audioT + payload.currentAttack + (payload.currentRelease * 5)); 

                    mem.isHit = true;
                    mem.appliedGain = -1; 
                }
            } else {
                mem.isHit = false;
                if (mem.appliedGain !== 0) {
                    try { 
                        if (typeof (gainNode.gain as any).cancelAndHoldAtTime === 'function') {
                            (gainNode.gain as any).cancelAndHoldAtTime(t);
                        } else {
                            gainNode.gain.cancelScheduledValues(t);
                            gainNode.gain.setValueAtTime(gainNode.gain.value, t);
                        }
                    } catch(e) {}
                    gainNode.gain.setTargetAtTime(0, audioT, payload.currentRelease);
                    gainNode.gain.setValueAtTime(0, audioT + (payload.currentRelease * 5));

                    mem.appliedGain = 0;
                }
            }
        }
    });
};

export const tickLattice = (graph: AudioGraph, payload: AudioPayload, t: number, memory: Record<string, ChannelMemory> = {}) => {
    const instructions = calculateLatticeState(payload, memory, t);
    renderLatticeAudio(graph, instructions, payload, t, memory);
};