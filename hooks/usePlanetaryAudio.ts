import { useEffect, useRef, useCallback, useState } from 'react';
import { resolveModulation } from '../components/modules/visuals/shared';

export * from '../services/audio/AudioTypes';
import { AudioGraph, AudioPayload, ReverbConfig, BreathConfig, DelayConfig } from '../services/audio/AudioTypes';

import { buildAudioGraph, closeAudioGraph } from '../services/audio/AudioGraphBuilder';
import { tickLattice } from '../services/audio/LatticeSynth';
import { tickHeart, triggerHeartPulse, getCardiacInterval } from '../services/audio/HeartSynth';
import { tickBreath, updateBreathBuffer, previewCueTone } from '../services/audio/BreathSynth';
import { tickAtmosphere } from '../services/audio/AtmosphereSynth';
import { tickPolyvagal, resetPolyvagalSession } from '../services/audio/PolyvagalSynth';

export const usePlanetaryAudio = (globalMute: boolean) => {
    const graphRef = useRef<AudioGraph | null>(null);
    const isPlayingRef = useRef(false);
    const isMasterPausedRef = useRef(false);
    const currentPayloadRef = useRef<AudioPayload | null>(null);
    const audioModMemoryRef = useRef<any>({});
    const [audioEnabled, setAudioEnabled] = useState(false);

    const updateAudio = useCallback((payload: AudioPayload) => { currentPayloadRef.current = payload; }, []);
    
    const updateBreathConfig = useCallback((config: BreathConfig) => {
        if (graphRef.current) updateBreathBuffer(graphRef.current, config);
    }, []);

    const previewCue = useCallback((config: BreathConfig, arg2?: any, arg3?: any, chordContext?: any) => {
        if (graphRef.current) {
            const bpm = typeof arg3 === 'number' ? arg3 : (typeof arg2 === 'number' ? arg2 : 60);
            const phase = typeof arg2 === 'string' ? arg2 : 'TEST';
            const chordCtx = chordContext || {
                isMusicMode: currentPayloadRef.current?.isMusicMode,
                rootNote: currentPayloadRef.current?.currentChordRootNote,
                rootFreq: currentPayloadRef.current?.currentChordRootFreq
            };
            previewCueTone(graphRef.current, config, phase, bpm, chordCtx);
        }
    }, []);

    const triggerKick = useCallback((time: number, data: any) => {
        if (graphRef.current && isPlayingRef.current) triggerHeartPulse(graphRef.current, time, data);
    }, []);

    const initAudio = useCallback(async (reverbConfig: ReverbConfig, breathConfig: BreathConfig, binauralFreqs: Record<string, number>, delayConfig: DelayConfig) => {
        try {
            if (!graphRef.current) {
                graphRef.current = await buildAudioGraph(reverbConfig, breathConfig, delayConfig);
            } else if (graphRef.current.ctx.state === 'suspended') {
                await graphRef.current.ctx.resume();
            }
            if (graphRef.current?.masterGain) {
                const ctx = graphRef.current.ctx;
                const t = ctx.currentTime;
                const targetVol = typeof currentPayloadRef.current?.masterVolume === 'number'
                    ? Math.max(0, Math.min(1.0, currentPayloadRef.current.masterVolume))
                    : 0.82;
                try {
                    graphRef.current.masterGain.gain.cancelScheduledValues(t);
                    graphRef.current.masterGain.gain.setValueAtTime(0.0001, t);
                    graphRef.current.masterGain.gain.linearRampToValueAtTime(targetVol, t + 0.04);
                } catch {}
            }
            isPlayingRef.current = true;
            isMasterPausedRef.current = false;
        } catch (err) {
            console.error("Audio init error:", err);
            throw err;
        }
    }, []);

    const closeAudio = useCallback(() => {
        isPlayingRef.current = false;
        isMasterPausedRef.current = false;
        if (graphRef.current) closeAudioGraph(graphRef.current);
    }, []);

    const pauseAudio = useCallback(() => {
        isMasterPausedRef.current = true;
        if (graphRef.current?.ctx) {
            const ctx = graphRef.current.ctx;
            const t = ctx.currentTime;
            if (graphRef.current.masterGain) {
                try {
                    graphRef.current.masterGain.gain.cancelScheduledValues(t);
                    graphRef.current.masterGain.gain.setValueAtTime(graphRef.current.masterGain.gain.value, t);
                    graphRef.current.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.025);
                } catch {}
            }
            setTimeout(() => {
                if (isMasterPausedRef.current && graphRef.current?.ctx && graphRef.current.ctx.state === 'running') {
                    graphRef.current.ctx.suspend().catch(console.warn);
                }
            }, 30);
        }
    }, []);

    const stopAudio = useCallback(() => {
        isPlayingRef.current = false;
        isMasterPausedRef.current = false;
        if (graphRef.current?.ctx) {
            const ctx = graphRef.current.ctx;
            const t = ctx.currentTime;
            if (graphRef.current.masterGain) {
                try {
                    graphRef.current.masterGain.gain.cancelScheduledValues(t);
                    graphRef.current.masterGain.gain.setValueAtTime(graphRef.current.masterGain.gain.value, t);
                    graphRef.current.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.02);
                } catch {}
            }
            if (graphRef.current.noiseGain) {
                try {
                    graphRef.current.noiseGain.gain.cancelScheduledValues(t);
                    graphRef.current.noiseGain.gain.setValueAtTime(0, t);
                } catch {}
            }
            if (graphRef.current.latticeGains) {
                Object.values(graphRef.current.latticeGains).forEach((node: any) => {
                    try {
                        node.gain.cancelScheduledValues(t);
                        node.gain.setValueAtTime(0.0001, t);
                    } catch {}
                });
            }
            setTimeout(() => {
                if (!isPlayingRef.current && graphRef.current?.ctx && graphRef.current.ctx.state === 'running') {
                    graphRef.current.ctx.suspend().catch(console.warn);
                }
            }, 30);
        }
        setAudioEnabled(false);
    }, []);

    const resumeAudio = useCallback(async () => {
        isMasterPausedRef.current = false;
        isPlayingRef.current = true;
        setAudioEnabled(true);
        if (graphRef.current?.ctx) {
            if (graphRef.current.ctx.state === 'suspended') {
                await graphRef.current.ctx.resume().catch(console.warn);
            }
            const ctx = graphRef.current.ctx;
            const t = ctx.currentTime;
            if (graphRef.current.masterGain) {
                const targetVol = typeof currentPayloadRef.current?.masterVolume === 'number'
                    ? Math.max(0, Math.min(1.0, currentPayloadRef.current.masterVolume))
                    : 0.82;
                try {
                    graphRef.current.masterGain.gain.cancelScheduledValues(t);
                    graphRef.current.masterGain.gain.setValueAtTime(0.0001, t);
                    graphRef.current.masterGain.gain.linearRampToValueAtTime(targetVol, t + 0.04);
                } catch {}
            }
        }
    }, []);

    useEffect(() => {
        if (globalMute && isPlayingRef.current) closeAudio();
    }, [globalMute, closeAudio]);

    useEffect(() => {
        const wakeUpAudio = () => {
            const ctx = graphRef.current?.ctx;
            if (ctx && ctx.state === 'suspended' && isPlayingRef.current && !isMasterPausedRef.current) {
                ctx.resume().catch(err => console.warn("Failed to resume AudioContext:", err));
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') wakeUpAudio();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('touchstart', wakeUpAudio, { passive: true });
        window.addEventListener('click', wakeUpAudio, { passive: true });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('touchstart', wakeUpAudio);
            window.removeEventListener('click', wakeUpAudio);
        };
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!graphRef.current || !isPlayingRef.current || globalMute || isMasterPausedRef.current) return;
            const payload = currentPayloadRef.current;
            if (!payload) return;

            const graph = graphRef.current;
            const t = graph.ctx.currentTime;
            
            let visualBeat = Math.min(payload.binauralFreqs['UNIVERSAL'] || 7.83, 60.0);
            if (payload.immersionConfig?.isFractalSync) {
                visualBeat = (136.1 * (payload.pitchMultiplier || 1.0)) / 32;
            }

            // Compute heart envelope for audio modulation (drops to 0 when muted)
            const isHeartMuted = !!payload.mutes?.['HEART_KICK'] || (payload.volumes?.['HEART_KICK'] ?? 0) <= 0.001;
            let sigHeart = 0;
            if (!isHeartMuted) {
                const kickCfg = payload.kickConfig || { syncMode: 'BREATH', doubleBeat: true, bpm: 60 };
                const beatInterval = getCardiacInterval(kickCfg, payload);

                const nowSec = payload.now || (t);
                const mem = audioModMemoryRef.current as Record<string, unknown>;
                if (mem.lastHeartTime === undefined) {
                    mem.lastHeartTime = nowSec;
                }
                const timeSinceBeat = (nowSec - Number(mem.lastHeartTime)) % beatInterval;
                const lubEnv = Math.exp(-timeSinceBeat * 6.5);
                let dubEnv = 0;
                if (kickCfg.doubleBeat !== false && timeSinceBeat >= 0.13) {
                    dubEnv = Math.exp(-(timeSinceBeat - 0.13) * 8.5) * 0.45;
                }
                const heartVol = (payload.volumes?.['HEART_KICK'] ?? 0.6) * (payload.harmonicMasterVolume ?? 1.0);
                sigHeart = Math.max(0, Math.min(1.0, (lubEnv + dubEnv) * heartVol));
            }

            const mem = audioModMemoryRef.current as Record<string, any>;
            if (!mem.modContext) {
                mem.modContext = {
                    now: 0, dt: 0.1, breathRadius: 0, breathPhase: 'IDLE',
                    sigBinaural: 0, sigHR: 0, sigHeart: 0, smoothedCoh: 0,
                    sigAudio: 0, macroA: 0, macroB: 0, visualBeat: 7.83,
                    binauralBreathLinked: true, isFeedbackActive: false
                };
            }
            const modContext = mem.modContext;
            modContext.now = payload.now;
            modContext.dt = 0.1;
            modContext.breathRadius = payload.signals?.breath || payload.breathRadius || 0;
            modContext.breathPhase = payload.breathPhase || 'IDLE';
            modContext.sigBinaural = payload.signals?.binaural || 0;
            modContext.sigHR = payload.signals?.hr || 0;
            modContext.sigHeart = sigHeart;
            modContext.smoothedCoh = payload.signals?.coh || payload.smoothedCoh || 0;
            modContext.sigAudio = payload.signals?.audio || 0;
            modContext.macroA = payload.macros?.a || 0;
            modContext.macroB = payload.macros?.b || 0;
            modContext.visualBeat = visualBeat;
            modContext.binauralBreathLinked = !!payload.binauralBreathLinked;
            modContext.isFeedbackActive = !!payload.isFeedbackActive;

            const resolveParam = (key: string, baseVal: number) => {
                return resolveModulation(key, baseVal, payload.modulations?.[key], modContext, audioModMemoryRef.current);
            };

            tickLattice(graph, payload, t, audioModMemoryRef.current);
            tickHeart(graph, payload, t, audioModMemoryRef.current);
            
            tickBreath(graph, payload, t, resolveParam, audioModMemoryRef.current);
            
            tickAtmosphere(graph, payload, t, resolveParam);

            tickPolyvagal(graph, payload, t, audioModMemoryRef.current);

            // Master Output Volume update
            if (graph.masterGain && typeof payload.masterVolume === 'number') {
                const targetVol = Math.max(0, Math.min(1.0, payload.masterVolume));
                if (Math.abs(targetVol - (mem.appliedMasterVol ?? -1)) > 0.005) {
                    graph.masterGain.gain.setTargetAtTime(targetVol, t, 0.05);
                    mem.appliedMasterVol = targetVol;
                }
            }

            // Master 12-Band Equalizer update
            if (graph.masterEqNodes && graph.masterEqNodes.length === 12) {
                const isBypassed = !!payload.isMasterEqBypassed;
                const eq = payload.masterEq || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                graph.masterEqNodes.forEach((node, i) => {
                    const targetGain = isBypassed ? 0 : (eq[i] ?? 0);
                    const memKey = `appliedEq_${i}`;
                    if (Math.abs(targetGain - (mem[memKey] ?? -999)) > 0.05) {
                        node.gain.setTargetAtTime(targetGain, t, 0.05);
                        mem[memKey] = targetGain;
                    }
                });
            }

        }, 20);

        return () => clearInterval(intervalId);
    }, [globalMute]);

    return { 
        audioEnabled, 
        setAudioEnabled, 
        toggleAudio: () => { 
            if (audioEnabled) closeAudio(); 
            else initAudio({ decay: 3.5, preDelay: 20, diffusion: 0.8, damping: 4000, modulation: 0.2, wetness: 0.0, isEntrainmentSync: false }, { inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, oceanVol: 0.3, noiseType: 'PINK', toneType: 'SINE_BELL', visualMode: 'RING', tideEq: [0,0,0,0,0,0,0,0,0,0,0,0], metronome: { enabled: false, sound: 'BAMBOO', bpm: 60, syncToBreath: true, foam: 0.5, vol: 0.5, subdivision: 4, phaseMask: { inhale: true, holdIn: true, exhale: true, holdOut: true }, countdownBeats: 0 }, holdBehavior: 'SHIMMER', waitBehavior: 'UNDERWATER' }, { UNIVERSAL: 8.0 }, { time: 0.5, feedback: 0.0, cutoff: 2000, wetness: 0.0, isPingPong: false }).catch(err => {
                console.error("Failed to toggle audio:", err);
            }); 
        }, 
        updateAudio, 
        initAudio, 
        closeAudio, 
        pauseAudio,
        stopAudio,
        resumeAudio,
        get isMasterPaused() { return isMasterPausedRef.current; },
        updateBreathConfig, 
        setMasterVolume: (vol: number) => {
            if (graphRef.current?.masterGain) {
                const targetVol = Math.max(0, Math.min(1.0, vol));
                graphRef.current.masterGain.gain.setTargetAtTime(targetVol, graphRef.current.ctx.currentTime, 0.02);
            }
        },
        setMasterEq: (eqGains: number[], isBypassed: boolean = false) => {
            if (graphRef.current?.masterEqNodes) {
                const t = graphRef.current.ctx.currentTime;
                graphRef.current.masterEqNodes.forEach((node, i) => {
                    const targetGain = isBypassed ? 0 : (eqGains[i] ?? 0);
                    node.gain.setTargetAtTime(targetGain, t, 0.02);
                });
            }
        },
        previewCue, 
        triggerHeartPulse: triggerKick, 
        resetPolyvagalSession: (durationSec?: number) => resetPolyvagalSession(audioModMemoryRef.current, durationSec),
        graphRef,
        get audioCtx() { return graphRef.current?.ctx || null; }, 
        get telemetry() { return { analysers: graphRef.current ? { preLimit: graphRef.current.analyserPreLimit, postLimit: graphRef.current.analyserPostLimit } : { preLimit: null as any, postLimit: null as any } }; }
    };
};