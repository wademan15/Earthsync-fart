import { AudioGraph, AudioPayload, BreathConfig } from './AudioTypes';
import { createNoiseBuffer } from '../dsp/generators';
import { SENTIC_STATES, SenticEmotion } from '../kinematics/senticForms';

const AVAILABLE_NOISES = [
    'WHITE', 'PINK', 'BROWN', 'OCEAN', 'RAIN', 'STREAM', 
    'WIND', 'FIRE', 'FOREST', 'CAVE', 'VINYL', 'DRONE'
];

// Perceptual dynamic filter compensation multipliers for uniform perceived volume across textures
const TEXTURE_LOUDNESS_COMPENSATION: Record<string, number> = {
    'OCEAN': 1.0,
    'WIND': 1.02,
    'PINK': 1.02,
    'BROWN': 0.98,
    'RAIN': 1.04,
    'STREAM': 1.06,
    'WHITE': 1.15,
    'FOREST': 1.04,
    'CAVE': 0.96,
    'FIRE': 1.04,
    'VINYL': 1.08,
    'DRONE': 1.0,
};

export const tickBreath = (graph: AudioGraph, payload: AudioPayload, t: number, resolveParam: Function, memory: any) => {
    const config = payload.breathConfig;
    if (!config) return;

    const currentPhase = (payload.breathPhase || 'IDLE').toUpperCase();

    if (payload.isBreathActive && currentPhase !== memory.lastBreathPhase) {
        const mask = config.cuePhaseMask || { inhale: true, exhale: true, holdIn: false, holdOut: false };
        let shouldTrigger = false;
        
        const isInhale = currentPhase === 'INHALE';
        const isExhale = currentPhase === 'EXHALE';
        const isHoldIn = currentPhase === 'HOLD_IN';
        const isHoldOut = currentPhase === 'HOLD_OUT';

        if (isInhale && (mask as any).inhale !== false) shouldTrigger = true;
        else if (isExhale && (mask as any).exhale !== false) shouldTrigger = true;
        else if (isHoldIn && Boolean((mask as any).holdIn)) shouldTrigger = true;
        else if (isHoldOut && Boolean((mask as any).holdOut)) shouldTrigger = true;

        const activeTone = (config.cueTone || config.toneType || 'SINE_BELL').toUpperCase();
        if (shouldTrigger && activeTone !== 'NONE') {
            previewCueTone(graph, config, currentPhase, payload.bpm, {
                isMusicMode: payload.isMusicMode,
                rootNote: payload.currentChordRootNote,
                rootFreq: payload.currentChordRootFreq
            });
        }
        memory.lastBreathPhase = currentPhase; 
    }

    if ((!payload.isBreathActive || payload.isMasterPaused) && graph.noiseGain) {
        if (memory.appliedTargetVol !== 0) {
            try {
                graph.noiseGain.gain.cancelScheduledValues(t);
                graph.noiseGain.gain.setValueAtTime(graph.noiseGain.gain.value, t);
                graph.noiseGain.gain.linearRampToValueAtTime(0, t + 0.02);
                memory.appliedTargetVol = 0;
            } catch {}
        }
        if (memory.noiseBank) {
            Object.values(memory.noiseBank).forEach((bank: any) => {
                if (bank?.gain && bank.appliedGain !== 0) {
                    try {
                        bank.gain.gain.cancelScheduledValues(t);
                        bank.gain.gain.setValueAtTime(bank.gain.gain.value, t);
                        bank.gain.gain.linearRampToValueAtTime(0, t + 0.02);
                        bank.appliedGain = 0;
                    } catch {}
                }
            });
        }
    }

    if (payload.isBreathActive && !payload.isMasterPaused && graph.noiseGain && graph.filterNode) {
        
        if (!memory.noiseBank || memory.noiseBank_ctx !== graph.ctx) {
            if (memory.noiseBank) {
                Object.values(memory.noiseBank).forEach((bank: any) => {
                    try { bank.source.stop(); bank.source.disconnect(); bank.gain.disconnect(); } catch(e) {}
                });
            }

            memory.noiseBank = {};
            memory.noiseBank_ctx = graph.ctx; 

            if (graph.noiseNode) {
                try { graph.noiseNode.stop(); graph.noiseNode.disconnect(); } catch(e) {}
            }
        }

        // On-demand lazy noise bank creation: ensures only actively needed textures run on mobile CPUs
        const getNoiseBank = (type: string) => {
            if (!memory.noiseBank[type]) {
                try {
                    const source = graph.ctx.createBufferSource();
                    source.buffer = createNoiseBuffer(graph.ctx, type);
                    source.loop = true;
                    const gain = graph.ctx.createGain();
                    gain.gain.value = 0; 
                    source.connect(gain);
                    
                    if (graph.filterNode) {
                        gain.connect(graph.filterNode); 
                    } else {
                        gain.connect(graph.noiseGain); 
                    }
                    
                    source.start(t);
                    memory.noiseBank[type] = { source, gain, appliedGain: 0 };
                } catch (e) {
                    console.warn(`Failed to initialize noise bank for ${type}:`, e);
                }
            }
            return memory.noiseBank[type];
        };

        if (config.oceanVol > 0) {
            const fVol = resolveParam('oceanVol', config.oceanVol);
            
            // Determine active noise type directly from config.noiseType to prevent old stale phase noises
            let activeNoiseType = (config.noiseType || config.inhaleNoise || 'OCEAN').toUpperCase();
            
            // Check for phase-specific silence
            const isSilentHold = (currentPhase === 'HOLD_IN' && config.holdInNoise === 'SILENCE') || 
                                 (currentPhase === 'HOLD_OUT' && config.holdOutNoise === 'SILENCE') || 
                                 activeNoiseType === 'SILENCE' || activeNoiseType === 'NONE';

            const FADE_TIME = 0.08;
            if (!isSilentHold && AVAILABLE_NOISES.includes(activeNoiseType)) {
                // Ensure the active noise source is initialized
                getNoiseBank(activeNoiseType);

                Object.keys(memory.noiseBank).forEach(type => {
                    const bank = memory.noiseBank[type];
                    if (!bank) return;
                    const compGain = TEXTURE_LOUDNESS_COMPENSATION[type] ?? 1.0;
                    const targetFade = (type === activeNoiseType) ? compGain : 0.0;
                    if (Math.abs(targetFade - bank.appliedGain) > 0.005) {
                        if (typeof (bank.gain.gain as any).cancelAndHoldAtTime === 'function') {
                            try {
                                (bank.gain.gain as any).cancelAndHoldAtTime(t);
                            } catch {
                                bank.gain.gain.cancelScheduledValues(t);
                            }
                        } else {
                            bank.gain.gain.cancelScheduledValues(t);
                        }
                        bank.gain.gain.linearRampToValueAtTime(targetFade, t + FADE_TIME);
                        bank.appliedGain = targetFade;
                    }
                });
            } else {
                Object.keys(memory.noiseBank).forEach(type => {
                    const bank = memory.noiseBank[type];
                    if (bank && bank.appliedGain > 0) {
                        if (typeof (bank.gain.gain as any).cancelAndHoldAtTime === 'function') {
                            try {
                                (bank.gain.gain as any).cancelAndHoldAtTime(t);
                            } catch {
                                bank.gain.gain.cancelScheduledValues(t);
                            }
                        } else {
                            bank.gain.gain.cancelScheduledValues(t);
                        }
                        bank.gain.gain.linearRampToValueAtTime(0, t + FADE_TIME);
                        bank.appliedGain = 0;
                    }
                });
            }

            const minFilter = 200;
            const maxFilter = 1200 + ((payload.smoothedCoh || 0) * 1000);
            
            let breathVolSwell = 0.1 + ((payload.breathRadius || 0) * 0.9);
            let filterFreq = minFilter + ((payload.breathRadius || 0) * (maxFilter - minFilter));
            
            if (isSilentHold) {
                breathVolSwell = 0.0;
            } else if (currentPhase === 'HOLD_OUT') {
                breathVolSwell = Math.max(breathVolSwell, 0.6); 
                filterFreq = Math.max(filterFreq, 800);
            } else if (currentPhase === 'HOLD_IN') {
                breathVolSwell = 1.0;
                filterFreq = maxFilter;
            }
            
            const targetVol = Math.max(0, Math.min(1.0, fVol * breathVolSwell));
            const safeFilterFreq = Math.max(20, Math.min(20000, filterFreq));
            
            if (Math.abs(targetVol - (memory.appliedTargetVol || -1)) > 0.005) {
                graph.noiseGain.gain.setTargetAtTime(targetVol, t, 0.1);
                memory.appliedTargetVol = targetVol;
            }

            if (Math.abs(safeFilterFreq - (memory.appliedFilterFreq || -1)) > 1.0) {
                graph.filterNode.frequency.setTargetAtTime(safeFilterFreq, t, 0.1);
                memory.appliedFilterFreq = safeFilterFreq;
            }

            if (graph.filterNode.Q && Math.abs(1.0 - (memory.appliedFilterQ || -1)) > 0.1) {
                graph.filterNode.Q.setTargetAtTime(1.0, t, 0.1);
                memory.appliedFilterQ = 1.0;
            }

            const isSentic = !!(config.isSenticPacing && config.senticState && config.senticState !== 'NO_EMOTION');
            const vibEnvelope = payload.signals?.vibratoEnvelope || 0; 
            const vibRate = payload.signals?.currentVibratoRate || 7.83; 
            const intensity = config.senticVibratoDepth ?? 0.5;

            if (isSentic && vibEnvelope > 0 && (config.isSenticTideAM !== false || config.isSenticTideFM !== false)) {
                if (!memory.senticLfo) {
                    memory.senticLfo = graph.ctx.createOscillator();
                    memory.senticLfo.start();
                }
                if (Math.abs(vibRate - (memory.appliedVibRate || -1)) > 0.05) {
                    memory.senticLfo.frequency.setTargetAtTime(vibRate, t, 0.1);
                    memory.appliedVibRate = vibRate;
                }

                if (config.isSenticTideAM !== false) {
                    if (!memory.senticLfoDepthAM) {
                        memory.senticLfoDepthAM = graph.ctx.createGain();
                        memory.senticLfo.connect(memory.senticLfoDepthAM);
                        memory.senticLfoDepthAM.connect(graph.noiseGain.gain); 
                    }
                    const tremDepth = targetVol * 0.8 * intensity * vibEnvelope; 
                    if (Math.abs(tremDepth - (memory.appliedTremDepth || -1)) > 0.005) {
                        memory.senticLfoDepthAM.gain.setTargetAtTime(tremDepth, t, 0.05);
                        memory.appliedTremDepth = tremDepth;
                    }
                } else if (memory.senticLfoDepthAM && (memory.appliedTremDepth || 0) > 0) {
                    memory.senticLfoDepthAM.gain.setTargetAtTime(0, t, 0.1);
                    memory.appliedTremDepth = 0;
                }

                if (config.isSenticTideFM !== false) {
                    if (!memory.senticLfoDepthFM) {
                        memory.senticLfoDepthFM = graph.ctx.createGain();
                        memory.senticLfo.connect(memory.senticLfoDepthFM);
                        memory.senticLfoDepthFM.connect(graph.filterNode.frequency); 
                    }
                    const filterWobble = safeFilterFreq * 0.15 * intensity * vibEnvelope;
                    if (Math.abs(filterWobble - (memory.appliedFilterWobble || -1)) > 0.5) {
                        memory.senticLfoDepthFM.gain.setTargetAtTime(filterWobble, t, 0.05);
                        memory.appliedFilterWobble = filterWobble;
                    }
                } else if (memory.senticLfoDepthFM && (memory.appliedFilterWobble || 0) > 0) {
                    memory.senticLfoDepthFM.gain.setTargetAtTime(0, t, 0.1);
                    memory.appliedFilterWobble = 0;
                }
            } else {
                if (memory.senticLfoDepthAM && (Number(memory.appliedTremDepth) || 0) > 0) { 
                    memory.senticLfoDepthAM.gain.setTargetAtTime(0, t, 0.05); 
                    memory.appliedTremDepth = 0;
                }
                if (memory.senticLfoDepthFM && (Number(memory.appliedFilterWobble) || 0) > 0) { 
                    memory.senticLfoDepthFM.gain.setTargetAtTime(0, t, 0.05); 
                    memory.appliedFilterWobble = 0;
                }
            }

            // Breath Tide Entrainment Modulation (Default: OFF / UNMODULATED)
            const isEntrainActive = Boolean(config.entrainTide);
            const entrainMode = config.tideEntrainMode || 'ISOCHRONIC';
            const entrainIntensity = Math.max(0, Math.min(1.0, config.tideEntrainDepth ?? 0.4));
            const entrainRate = Math.max(0.5, Math.min(40, payload.binauralFreqs?.['BREATH'] || payload.binauralFreqs?.['UNIVERSAL'] || 7.83));

            // Clean reset function when disabled or mode changed
            const resetTideEntrain = () => {
                if (memory.tideEntrainDepth) {
                    try { memory.tideEntrainDepth.disconnect(); } catch (e) {}
                    memory.tideEntrainDepth = null;
                }
                if (memory.tideEntrainLfo) {
                    try { memory.tideEntrainLfo.stop(); memory.tideEntrainLfo.disconnect(); } catch (e) {}
                    memory.tideEntrainLfo = null;
                }
                if (graph.lfoGain && memory.appliedLfoGain !== 1.0) {
                    graph.lfoGain.gain.setTargetAtTime(1.0, t, 0.05);
                    memory.appliedLfoGain = 1.0;
                }
                if (graph.noisePanner && memory.appliedPan !== 0) {
                    graph.noisePanner.pan.setTargetAtTime(0, t, 0.05);
                    memory.appliedPan = 0;
                }
                memory.appliedEntrainMode = null;
                memory.appliedEntrainDepth = 0;
                memory.appliedEntrainRate = 0;
            };

            if (!isEntrainActive || targetVol <= 0.005 || isSilentHold || entrainIntensity <= 0.01) {
                // Keep completely unmodulated by default
                if (memory.tideEntrainLfo || memory.tideEntrainDepth || (memory.appliedEntrainDepth || 0) > 0 || memory.appliedLfoGain !== 1.0 || memory.appliedPan !== 0) {
                    resetTideEntrain();
                }
            } else {
                // If mode changed, reset existing connections
                if (memory.appliedEntrainMode !== entrainMode) {
                    resetTideEntrain();
                    memory.appliedEntrainMode = entrainMode;
                }

                if (!memory.tideEntrainLfo) {
                    memory.tideEntrainLfo = graph.ctx.createOscillator();
                    memory.tideEntrainLfo.type = entrainMode === 'ISOCHRONIC' ? 'triangle' : 'sine';
                    memory.tideEntrainLfo.start();
                }
                if (!memory.tideEntrainDepth) {
                    memory.tideEntrainDepth = graph.ctx.createGain();
                    memory.tideEntrainLfo.connect(memory.tideEntrainDepth);

                    if (entrainMode === 'BINAURAL' && graph.noisePanner) {
                        memory.tideEntrainDepth.connect(graph.noisePanner.pan);
                        if (graph.lfoGain && memory.appliedLfoGain !== 1.0) {
                            graph.lfoGain.gain.setTargetAtTime(1.0, t, 0.05);
                            memory.appliedLfoGain = 1.0;
                        }
                    } else if (graph.lfoGain) {
                        memory.tideEntrainDepth.connect(graph.lfoGain.gain);
                        if (graph.noisePanner && memory.appliedPan !== 0) {
                            graph.noisePanner.pan.setTargetAtTime(0, t, 0.05);
                            memory.appliedPan = 0;
                        }
                    }
                }

                // Update rate
                if (Math.abs(entrainRate - (Number(memory.appliedEntrainRate) || -1)) > 0.02) {
                    memory.tideEntrainLfo.frequency.setTargetAtTime(entrainRate, t, 0.05);
                    memory.appliedEntrainRate = entrainRate;
                }

                // Update depth according to quality mode
                if (entrainMode === 'BINAURAL') {
                    // Bilateral stereo panning modulation between ears
                    const panAmp = entrainIntensity * 0.9;
                    if (Math.abs(panAmp - (Number(memory.appliedEntrainDepth) || -1)) > 0.01) {
                        memory.tideEntrainDepth.gain.setTargetAtTime(panAmp, t, 0.05);
                        memory.appliedEntrainDepth = panAmp;
                    }
                } else if (entrainMode === 'ISOCHRONIC') {
                    // Crisp periodic pulse gating with triangle envelope
                    const pulseDepth = entrainIntensity * 0.5;
                    const baseGain = 1.0 - pulseDepth;
                    if (graph.lfoGain && Math.abs(baseGain - (memory.appliedLfoGain ?? -1)) > 0.005) {
                        graph.lfoGain.gain.setTargetAtTime(baseGain, t, 0.05);
                        memory.appliedLfoGain = baseGain;
                    }
                    if (Math.abs(pulseDepth - (Number(memory.appliedEntrainDepth) || -1)) > 0.01) {
                        memory.tideEntrainDepth.gain.setTargetAtTime(pulseDepth, t, 0.05);
                        memory.appliedEntrainDepth = pulseDepth;
                    }
                } else {
                    // MONAURAL: Smooth sinusoidal amplitude envelope
                    const amDepth = entrainIntensity * 0.45;
                    const baseGain = 1.0 - amDepth;
                    if (graph.lfoGain && Math.abs(baseGain - (memory.appliedLfoGain ?? -1)) > 0.005) {
                        graph.lfoGain.gain.setTargetAtTime(baseGain, t, 0.05);
                        memory.appliedLfoGain = baseGain;
                    }
                    if (Math.abs(amDepth - (Number(memory.appliedEntrainDepth) || -1)) > 0.01) {
                        memory.tideEntrainDepth.gain.setTargetAtTime(amDepth, t, 0.05);
                        memory.appliedEntrainDepth = amDepth;
                    }
                }
            }

        } else {
            if (graph.noiseGain && (memory.appliedTargetVol || 0) > 0) {
                graph.noiseGain.gain.setTargetAtTime(0, t, 0.05);
                memory.appliedTargetVol = 0;
            }
            if (memory.senticLfoDepthAM && (memory.appliedTremDepth || 0) > 0) {
                memory.senticLfoDepthAM.gain.setTargetAtTime(0, t, 0.05);
                memory.appliedTremDepth = 0;
            }
            if (memory.senticLfoDepthFM && (memory.appliedFilterWobble || 0) > 0) {
                memory.senticLfoDepthFM.gain.setTargetAtTime(0, t, 0.05);
                memory.appliedFilterWobble = 0;
            }
            if (memory.tideEntrainDepth || memory.tideEntrainLfo) {
                try { memory.tideEntrainDepth?.disconnect(); } catch (e) {}
                try { memory.tideEntrainLfo?.stop(); memory.tideEntrainLfo?.disconnect(); } catch (e) {}
                memory.tideEntrainDepth = null;
                memory.tideEntrainLfo = null;
                memory.appliedEntrainDepth = 0;
            }
            if (graph.lfoGain && memory.appliedLfoGain !== 1.0) {
                graph.lfoGain.gain.setTargetAtTime(1.0, t, 0.05);
                memory.appliedLfoGain = 1.0;
            }
            if (graph.noisePanner && memory.appliedPan !== 0) {
                graph.noisePanner.pan.setTargetAtTime(0, t, 0.05);
                memory.appliedPan = 0;
            }
            if (memory.noiseBank) {
                Object.values(memory.noiseBank).forEach((bank: any) => {
                    if (bank && bank.gain && bank.appliedGain > 0) {
                        bank.gain.gain.setTargetAtTime(0, t, 0.05);
                        bank.appliedGain = 0;
                    }
                });
            }
        }
    } else {
        if (graph.noiseGain && (memory.appliedTargetVol || 0) > 0) { 
            graph.noiseGain.gain.setTargetAtTime(0, t, 0.05); 
            memory.appliedTargetVol = 0;
        }
        if (memory.tideEntrainDepth || memory.tideEntrainLfo) {
            try { memory.tideEntrainDepth?.disconnect(); } catch (e) {}
            try { memory.tideEntrainLfo?.stop(); memory.tideEntrainLfo?.disconnect(); } catch (e) {}
            memory.tideEntrainDepth = null;
            memory.tideEntrainLfo = null;
            memory.appliedEntrainDepth = 0;
        }
        if (graph.lfoGain && memory.appliedLfoGain !== 1.0) {
            graph.lfoGain.gain.setTargetAtTime(1.0, t, 0.05);
            memory.appliedLfoGain = 1.0;
        }
        if (graph.noisePanner && memory.appliedPan !== 0) {
            graph.noisePanner.pan.setTargetAtTime(0, t, 0.05);
            memory.appliedPan = 0;
        }
        if (memory.senticLfoDepthAM && (memory.appliedTremDepth || 0) > 0) {
            memory.senticLfoDepthAM.gain.setTargetAtTime(0, t, 0.05);
            memory.appliedTremDepth = 0;
        }
        if (memory.senticLfoDepthFM && (memory.appliedFilterWobble || 0) > 0) {
            memory.senticLfoDepthFM.gain.setTargetAtTime(0, t, 0.05);
            memory.appliedFilterWobble = 0;
        }
        if (memory.noiseBank) {
            Object.values(memory.noiseBank).forEach((bank: any) => {
                if (bank && bank.gain && bank.appliedGain > 0) {
                    bank.gain.gain.setTargetAtTime(0, t, 0.05);
                    bank.appliedGain = 0;
                }
            });
        }
        memory.lastBreathPhase = 'IDLE';
    }
};

export const updateBreathBuffer = (graph: AudioGraph, config: BreathConfig) => {
    return;
};

const NOTE_FREQUENCIES: Record<string, number> = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00,
    'G#': 415.30, 'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

const SACRED_FREQUENCIES: Record<string, number> = {
    'SCHUMANN': 250.56,
    'EARTH_OM': 136.10,
    'PHI': 414.21,
    'FIFTHS': 384.00,
    'HARMONIC': 512.00,
    'PLANCK': 256.00,
    'TRITONE': 361.98,
    'SOL_432': 432.00,
    'A432': 432.00,
    'SOL_174': 174.00,
    'SOL_285': 285.00,
    'SOL_396': 396.00,
    'SOL_417': 417.00,
    'SOL_528': 528.00,
    'SOL_639': 639.00,
    'SOL_741': 741.00,
    'SOL_852': 852.00,
    'SOL_963': 963.00,
};

export interface CueChordSyncContext {
    isMusicMode?: boolean;
    rootNote?: string;
    rootFreq?: number;
}

export const previewCueTone = (graph: AudioGraph, config: BreathConfig, phaseArg?: any, bpm: number = 60, chordSyncContext?: CueChordSyncContext) => {
    const phase = typeof phaseArg === 'string' ? phaseArg.toUpperCase() : 'TEST';
    const isTurnaround = phase === 'HOLD_IN' || phase === 'HOLD_OUT';
    
    let requestedVol = typeof config.cueVolume === 'number' ? config.cueVolume : 0.5;
    if (isTurnaround && typeof config.turnaroundVol === 'number') {
        requestedVol = config.turnaroundVol;
    } else if (!isTurnaround && phase !== 'TEST' && typeof config.bellVol === 'number') {
        requestedVol = config.bellVol;
    }
    // Fallback to cueVolume if specific bellVol/turnaroundVol resolved to 0 but master cueVolume is active
    if (requestedVol <= 0 && typeof config.cueVolume === 'number' && config.cueVolume > 0) {
        requestedVol = config.cueVolume;
    }
    if (requestedVol <= 0) return;

    const ctx = graph.ctx;
    const t = ctx.currentTime;
    
    const toneType = (config.cueTone || config.toneType || 'SINE_BELL').toUpperCase();
    if (toneType === 'NONE') return;

    // 1. Calculate Base Frequency from Musical Scale / Sacred Pitch / Direct Hz
    let base = 261.63; // Default C4
    const intervalDrop = 1.5; // Default Exhale drop

    // Auto-sync turnaround bell to root note of current chord in Music Mode
    const shouldSyncToChordRoot = Boolean(
        config.syncTurnaroundToChordRoot &&
        (chordSyncContext?.isMusicMode || chordSyncContext?.rootFreq || chordSyncContext?.rootNote)
    );

    if (shouldSyncToChordRoot && chordSyncContext?.rootFreq && chordSyncContext.rootFreq > 20) {
        let syncedBase = chordSyncContext.rootFreq;
        while (syncedBase < 220) syncedBase *= 2;
        while (syncedBase > 700) syncedBase /= 2;
        base = syncedBase;
    } else if (shouldSyncToChordRoot && chordSyncContext?.rootNote && NOTE_FREQUENCIES[chordSyncContext.rootNote]) {
        const octave = config.cueOctave ?? 4;
        base = NOTE_FREQUENCIES[chordSyncContext.rootNote] * Math.pow(2, octave - 4);
    } else if (config.cuePitchHz && config.cuePitchHz > 20) {
        base = config.cuePitchHz;
    } else if (config.cueBase === 'HEART') {
        base = (bpm / 60) * 128;
    } else if (config.cueBase && SACRED_FREQUENCIES[config.cueBase]) {
        base = SACRED_FREQUENCIES[config.cueBase];
    } else if (config.cueBase && NOTE_FREQUENCIES[config.cueBase]) {
        const octave = config.cueOctave ?? 4;
        base = NOTE_FREQUENCIES[config.cueBase] * Math.pow(2, octave - 4);
    } else if (config.cueBase === '432') {
        base = 432.0;
    } else if (config.cueBase === '528') {
        base = 528.0;
    } else {
        base = 250.56; // Default Schumann tuned
    }

    // Apply Harmonic Multiplier (H1 to H32, default 16/16 = 1.0)
    const mult = (config.cueHarmonic || 16) / 16.0;
    let targetFreq = base * mult;
    
    // Apply Fine Pitch Shift in Semitones (-12 to +12)
    if (config.cuePitchShift) {
        targetFreq = targetFreq * Math.pow(2, config.cuePitchShift / 12);
    }
    
    // Musical phase transposition for breathwork navigation
    if (phase === 'EXHALE') targetFreq = targetFreq / intervalDrop;
    else if (phase === 'HOLD_IN') targetFreq = targetFreq * 1.25; // Major third harmonic lift at apex
    else if (phase === 'HOLD_OUT') targetFreq = targetFreq / (intervalDrop * 1.2); // Grounding nadir root

    const decayTime = Math.max(0.3, config.cueDecay ?? 2.5);
    const vol = Math.max(0.001, requestedVol * 0.4);

    // =========================================================================
    // DEDICATED HIGH-FIDELITY ACOUSTIC SOUND MODELS FOR ALL 12 CUE TONE TYPES
    // =========================================================================

    if (toneType === 'WOOD') {
        // TEMPLE WOOD BLOCK / MOKUGYO (Organic pitch drop transient + resonant body)
        const osc = ctx.createOscillator();
        const bodyOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        const bpf = ctx.createBiquadFilter();

        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(Math.min(1800, targetFreq * 1.2), t);
        bpf.Q.setValueAtTime(3.5, t);

        osc.type = 'sine';
        bodyOsc.type = 'triangle';

        // Snappy organic pitch knock drop in 25ms
        osc.frequency.setValueAtTime(targetFreq * 1.45, t);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, t + 0.028);

        bodyOsc.frequency.setValueAtTime(targetFreq * 2.32, t);
        bodyOsc.frequency.exponentialRampToValueAtTime(targetFreq * 1.5, t + 0.04);

        const woodDecay = Math.min(0.65, decayTime * 0.4);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol * 1.2, t + 0.003); // Instant wooden knock
        gain.gain.exponentialRampToValueAtTime(0.0001, t + woodDecay);

        osc.connect(gain);
        bodyOsc.connect(gain);
        gain.connect(bpf);
        bpf.connect(graph.masterGain);

        osc.start(t);
        bodyOsc.start(t);
        osc.stop(t + woodDecay + 0.05);
        bodyOsc.stop(t + woodDecay + 0.05);
        return;
    }

    if (toneType === 'WATER') {
        // NATURAL WATER DROPLET (Quick resonant pitch sweep chirp + bubble pop)
        const osc = ctx.createOscillator();
        const bubble = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        bubble.type = 'sine';

        // Upward liquid droplet chirp
        const dropFreq = Math.max(300, targetFreq);
        osc.frequency.setValueAtTime(dropFreq * 0.75, t);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 1.4, t + 0.035);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 1.2, t + 0.12);

        bubble.frequency.setValueAtTime(dropFreq * 2.1, t);
        bubble.frequency.exponentialRampToValueAtTime(dropFreq * 1.8, t + 0.06);

        const dropDecay = Math.min(0.4, decayTime * 0.25);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol * 1.1, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dropDecay);

        osc.connect(gain);
        bubble.connect(gain);
        gain.connect(graph.masterGain);

        osc.start(t);
        bubble.start(t);
        osc.stop(t + dropDecay + 0.05);
        bubble.stop(t + dropDecay + 0.05);
        return;
    }

    if (toneType === 'SHAKER') {
        // SEED SHAKER / ORGANIC PERCUSSION (Bandpassed noise strike)
        const bufferSize = ctx.sampleRate * 0.25;
        const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(Math.min(6000, Math.max(1200, targetFreq * 4)), t);
        bpf.Q.setValueAtTime(2.0, t);

        const gain = ctx.createGain();
        const shakerDecay = Math.min(0.25, decayTime * 0.15);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol * 0.9, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + shakerDecay);

        noise.connect(bpf);
        bpf.connect(gain);
        gain.connect(graph.masterGain);

        noise.start(t);
        noise.stop(t + shakerDecay + 0.05);
        return;
    }

    if (toneType === 'OM') {
        // SACRED OM / VOCAL FORMANT DRONE (Vocal resonance F1=450Hz, F2=800Hz, F3=2300Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();
        const masterOmGain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(targetFreq, t);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(targetFreq * 1.5, t); // Fifth

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(targetFreq * 0.5, t); // Deep sub

        const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 450; f1.Q.value = 4.0;
        const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 800; f2.Q.value = 4.5;
        const f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2300; f3.Q.value = 3.0;

        const mixGain = ctx.createGain();
        osc1.connect(mixGain);
        osc2.connect(mixGain);
        osc3.connect(mixGain);

        mixGain.connect(f1); f1.connect(masterOmGain);
        mixGain.connect(f2); f2.connect(masterOmGain);
        mixGain.connect(f3); f3.connect(masterOmGain);

        // Smooth meditative vocal envelope (gentle swell and long ambient decay)
        const omDecay = Math.max(1.8, decayTime * 1.2);
        masterOmGain.gain.setValueAtTime(0.0001, t);
        masterOmGain.gain.linearRampToValueAtTime(vol * 0.85, t + 0.08);
        masterOmGain.gain.exponentialRampToValueAtTime(0.0001, t + omDecay);
        masterOmGain.connect(graph.masterGain);

        osc1.start(t); osc2.start(t); osc3.start(t);
        osc1.stop(t + omDecay + 0.1);
        osc2.stop(t + omDecay + 0.1);
        osc3.stop(t + omDecay + 0.1);
        return;
    }

    if (toneType === 'CELLO') {
        // BOWED CELLO (Warm saw + triangle mix with lowpass filter & gentle vibrato swell)
        const oscSaw = ctx.createOscillator();
        const oscTri = ctx.createOscillator();
        const celloGain = ctx.createGain();
        const lpf = ctx.createBiquadFilter();

        oscSaw.type = 'sawtooth';
        oscSaw.frequency.setValueAtTime(targetFreq, t);

        oscTri.type = 'triangle';
        oscTri.frequency.setValueAtTime(targetFreq * 0.5, t); // Sub octave warmth

        // 5.5Hz expressive vibrato
        const vib = ctx.createOscillator();
        const vibGain = ctx.createGain();
        vib.frequency.setValueAtTime(5.5, t);
        vibGain.gain.setValueAtTime(targetFreq * 0.008, t);
        vib.connect(vibGain);
        vibGain.connect(oscSaw.frequency);
        vibGain.connect(oscTri.frequency);
        vib.start(t);

        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(Math.min(1800, targetFreq * 3.5), t);
        lpf.Q.setValueAtTime(2.0, t);

        const celloDecay = Math.max(1.5, decayTime);
        celloGain.gain.setValueAtTime(0.0001, t);
        celloGain.gain.linearRampToValueAtTime(vol * 0.9, t + 0.06); // Bow friction swell
        celloGain.gain.exponentialRampToValueAtTime(0.0001, t + celloDecay);

        oscSaw.connect(lpf);
        oscTri.connect(lpf);
        lpf.connect(celloGain);
        celloGain.connect(graph.masterGain);

        oscSaw.start(t); oscTri.start(t);
        oscSaw.stop(t + celloDecay + 0.1);
        oscTri.stop(t + celloDecay + 0.1);
        vib.stop(t + celloDecay + 0.1);
        return;
    }

    if (toneType === 'SYNTH') {
        // VINTAGE ANALOG SUB SYNTH (Dual detuned saw/pulse with 24dB resonant lowpass sweep)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const synthGain = ctx.createGain();
        const lpf = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(targetFreq * 0.997, t); // Detuned

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(targetFreq * 1.003, t);

        lpf.type = 'lowpass';
        lpf.Q.setValueAtTime(4.0, t);
        lpf.frequency.setValueAtTime(3200, t);
        lpf.frequency.exponentialRampToValueAtTime(Math.max(120, targetFreq * 1.1), t + 0.28);

        synthGain.gain.setValueAtTime(0.0001, t);
        synthGain.gain.linearRampToValueAtTime(vol * 0.85, t + 0.012);
        synthGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);

        osc1.connect(lpf);
        osc2.connect(lpf);
        lpf.connect(synthGain);
        synthGain.connect(graph.masterGain);

        osc1.start(t); osc2.start(t);
        osc1.stop(t + decayTime + 0.1);
        osc2.stop(t + decayTime + 0.1);
        return;
    }

    if (toneType === 'PIANO') {
        // PIANO CHIME (Hammer knock transient + inharmonic string partials)
        const bellMasterGain = ctx.createGain();
        bellMasterGain.gain.setValueAtTime(0.0001, t);
        bellMasterGain.gain.linearRampToValueAtTime(vol * 1.1, t + 0.005);
        bellMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);
        bellMasterGain.connect(graph.masterGain);

        const partials = [1.0, 2.003, 3.012, 4.025, 5.04];
        const weights = [1.0, 0.45, 0.22, 0.1, 0.04];
        
        partials.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            const pGain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(targetFreq * ratio, t);
            
            const pDecay = Math.max(0.2, decayTime / (1 + idx * 0.6));
            pGain.gain.setValueAtTime(weights[idx], t);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + pDecay);
            
            osc.connect(pGain);
            pGain.connect(bellMasterGain);
            osc.start(t);
            osc.stop(t + decayTime + 0.1);
        });
        return;
    }

    if (toneType === 'GONG') {
        // TEMPLE GONG (Deep sub-harmonic fundamental + rich metallic clash & slow bloom)
        const bellMasterGain = ctx.createGain();
        bellMasterGain.gain.setValueAtTime(0.0001, t);
        bellMasterGain.gain.linearRampToValueAtTime(vol * 1.1, t + 0.035); // Slow metallic bloom
        bellMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(2.5, decayTime * 1.4));
        bellMasterGain.connect(graph.masterGain);

        const partials = [0.5, 1.0, 1.414, 2.08, 3.12, 4.8];
        const weights = [0.8, 1.0, 0.65, 0.45, 0.25, 0.12];

        partials.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            const pGain = ctx.createGain();
            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(targetFreq * ratio, t);

            const pDecay = Math.max(0.4, (decayTime * 1.3) / (1 + idx * 0.35));
            pGain.gain.setValueAtTime(weights[idx], t);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + pDecay);

            osc.connect(pGain);
            pGain.connect(bellMasterGain);
            osc.start(t);
            osc.stop(t + Math.max(2.5, decayTime * 1.4) + 0.1);
        });
        return;
    }

    if (toneType === 'TRIANGLE') {
        // CRYSTAL CHIME / TRIANGLE (Sparkling high crystalline overtone spectrum)
        const bellMasterGain = ctx.createGain();
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.setValueAtTime(400, t);

        bellMasterGain.gain.setValueAtTime(0.0001, t);
        bellMasterGain.gain.linearRampToValueAtTime(vol * 0.95, t + 0.004);
        bellMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);
        bellMasterGain.connect(hpf);
        hpf.connect(graph.masterGain);

        const partials = [1.0, 3.14, 5.86, 9.42];
        const weights = [1.0, 0.6, 0.35, 0.18];

        partials.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            const pGain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(targetFreq * ratio, t);

            const pDecay = Math.max(0.3, decayTime / (1 + idx * 0.4));
            pGain.gain.setValueAtTime(weights[idx], t);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + pDecay);

            osc.connect(pGain);
            pGain.connect(bellMasterGain);
            osc.start(t);
            osc.stop(t + decayTime + 0.1);
        });
        return;
    }

    if (toneType === 'HARP') {
        // PLUCKED HARP / BINAURAL PING (Plucked string harmonic integer series)
        const bellMasterGain = ctx.createGain();
        bellMasterGain.gain.setValueAtTime(0.0001, t);
        bellMasterGain.gain.linearRampToValueAtTime(vol * 1.1, t + 0.003); // Crisp pluck
        bellMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime);
        bellMasterGain.connect(graph.masterGain);

        const partials = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
        const weights = [1.0, 0.5, 0.28, 0.14, 0.06, 0.02];

        partials.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            const pGain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(targetFreq * ratio, t);

            const pDecay = Math.max(0.15, decayTime / (1 + idx * 0.75));
            pGain.gain.setValueAtTime(weights[idx], t);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + pDecay);

            osc.connect(pGain);
            pGain.connect(bellMasterGain);
            osc.start(t);
            osc.stop(t + decayTime + 0.1);
        });
        return;
    }

    if (toneType === 'TIBETAN') {
        // TIBETAN TINGSHA BOWL (Twin beating frequencies 1.0x & 1.018x with non-integer overtones)
        const bellMasterGain = ctx.createGain();
        bellMasterGain.gain.setValueAtTime(0.0001, t);
        bellMasterGain.gain.linearRampToValueAtTime(vol * 1.0, t + 0.006);
        bellMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + decayTime * 1.2);
        bellMasterGain.connect(graph.masterGain);

        const partials = [1.0, 1.018, 2.77, 5.18, 8.41];
        const weights = [1.0, 0.85, 0.45, 0.25, 0.12];

        partials.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            const pGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(targetFreq * ratio, t);

            const pDecay = Math.max(0.3, (decayTime * 1.2) / (1 + idx * 0.4));
            pGain.gain.setValueAtTime(weights[idx], t);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + pDecay);

            osc.connect(pGain);
            pGain.connect(bellMasterGain);
            osc.start(t);
            osc.stop(t + decayTime * 1.2 + 0.1);
        });
        return;
    }

    if (toneType === 'BOWL') {
        // CRYSTAL SINGING BOWL (Subtle resonant harmonic partials)
        const bellMasterGain = ctx.createGain();
        bellMasterGain.gain.setValueAtTime(0.00001, t);
        bellMasterGain.gain.linearRampToValueAtTime(vol * 0.9, t + 0.02);
        bellMasterGain.gain.exponentialRampToValueAtTime(0.00001, t + decayTime * 1.15);
        bellMasterGain.connect(graph.masterGain);

        const partials = [1.0, 2.756, 5.404];
        const weights = [1.0, 0.28, 0.08];

        partials.forEach((ratio, idx) => {
            const osc = ctx.createOscillator();
            const pGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(targetFreq * ratio, t);

            const pDecay = Math.max(0.3, (decayTime * 1.15) / (1 + idx * 0.5));
            pGain.gain.setValueAtTime(weights[idx], t);
            pGain.gain.exponentialRampToValueAtTime(0.00001, t + pDecay);

            osc.connect(pGain);
            pGain.connect(bellMasterGain);
            osc.start(t);
            osc.stop(t + decayTime * 1.15 + 0.1);
        });
        return;
    }

    // DEFAULT & PURE_SINE / SINE_BELL:
    // The ultra-pure, peaceful, serene single-oscillator sine wave (zero harshness, pristine tranquility)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, t);

    // Smooth, gentle click-free envelope and serene organic exponential decay
    const attackTime = 0.035; // Gentle peaceful onset
    gain.gain.setValueAtTime(0.00001, t);
    gain.gain.linearRampToValueAtTime(vol, t + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, t + decayTime);

    osc.connect(gain);
    gain.connect(graph.masterGain);

    osc.start(t);
    osc.stop(t + decayTime + 0.05);
};

export const tickMetronome = (graph: AudioGraph, payload: AudioPayload, t: number, memory: any) => {
    const met = payload.breathConfig?.metronome;
    
    if (!met || !met.enabled || (met.vol ?? 0.5) <= 0) {
        memory.nextBeatTime = undefined; 
        memory.sessionActive = false;
        return;
    }

    if (payload.isMasterPaused || (met.syncToBreath && !payload.isBreathActive)) {
        memory.nextBeatTime = undefined;
        memory.sessionActive = false;
        return;
    }

    let beatDuration = 0;
    let totalBreath = 10.0;
    if (met.syncToBreath && payload.breathConfig) {
        const uiTotal = (payload.breathConfig.inhale || 0) + 
                        (payload.breathConfig.holdIn || 0) + 
                        (payload.breathConfig.exhale || 0) + 
                        (payload.breathConfig.holdOut || 0);
                        
        totalBreath = payload.signals?.currentInterval || uiTotal || 10.0;
        if (totalBreath > 0) {
            const sub = Math.max(1, met.subdivision || 4);
            beatDuration = totalBreath / sub;
        }
    } else {
        beatDuration = 60 / Math.max(1, met.bpm || 60);
    }

    if (beatDuration <= 0) return;

    const currentPhase = payload.breathPhase || 'IDLE';
    const uiTriggeredNewCycle = payload.isBreathActive && currentPhase === 'INHALE' && memory.lastMetroPhase !== 'INHALE';
    memory.lastMetroPhase = currentPhase;

    if (uiTriggeredNewCycle) {
        if (!memory.sessionActive) {
            memory.nextBeatTime = t;
            memory.currentBeat = 0;
            memory.sessionActive = true;
        } else {
            const theoreticalStart = memory.nextBeatTime - (memory.currentBeat * beatDuration);
            
            if (Math.abs(theoreticalStart - t) > 0.25 || totalBreath !== memory.lastTotalBreath) {
                memory.nextBeatTime = t;
                memory.currentBeat = 0;
            }
        }
    }
    
    if (currentPhase === 'IDLE') {
        memory.sessionActive = false;
    }

    memory.lastTotalBreath = totalBreath;

    if (memory.nextBeatTime === undefined || isNaN(memory.nextBeatTime)) {
        memory.nextBeatTime = t;
        memory.currentBeat = 0;
        memory.sessionActive = true;
    }
    
    if (memory.nextBeatTime < t - 0.5) {
        memory.nextBeatTime = t;
    }

    const LOOKAHEAD = 0.15; 
    let loopLimit = 0; 
    
    while (memory.nextBeatTime < t + LOOKAHEAD && loopLimit < 10) {
        loopLimit++;
        
        const safeScheduleTime = Math.max(t + 0.005, memory.nextBeatTime);
        let shouldPlay = true;
        const isFirstBeat = met.syncToBreath && (memory.currentBeat === 0);

        if (met.syncToBreath && met.phaseMask && payload.breathConfig) {
            const cfg = payload.breathConfig;
            
            const targetElapsed = (memory.currentBeat * beatDuration) % totalBreath;
            
            let targetPhase = 'INHALE';
            if (targetElapsed >= cfg.inhale) {
                targetPhase = 'HOLD_IN';
                if (targetElapsed >= cfg.inhale + cfg.holdIn) {
                    targetPhase = 'EXHALE';
                    if (targetElapsed >= cfg.inhale + cfg.holdIn + cfg.exhale) {
                        targetPhase = 'HOLD_OUT';
                    }
                }
            }

            if (targetPhase === 'INHALE' && !met.phaseMask.inhale) shouldPlay = false;
            if (targetPhase === 'HOLD_IN' && !met.phaseMask.holdIn) shouldPlay = false;
            if (targetPhase === 'EXHALE' && !met.phaseMask.exhale) shouldPlay = false;
            if (targetPhase === 'HOLD_OUT' && !met.phaseMask.holdOut) shouldPlay = false;
        }

        if (shouldPlay) {
            const ctx = graph.ctx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(graph.masterGain);

            let freq = 1000;
            if (met.sound === 'STONE') freq = 600;
            else if (met.sound === 'CEDAR') freq = 800;
            else if (met.sound === 'CLAY') freq = 400;
            else if (met.sound === 'THUNDER') freq = 100;

            if (isFirstBeat) freq *= 1.25;

            const decayTime = 0.05 + ((met.foam || 0.5) * 0.2);

            osc.frequency.setValueAtTime(freq, safeScheduleTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.1, safeScheduleTime + decayTime);

            const clickVol = Math.max(0.001, met.vol ?? 0.5);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.setValueAtTime(clickVol * (isFirstBeat ? 1.2 : 1.0), safeScheduleTime);
            gain.gain.exponentialRampToValueAtTime(0.001, safeScheduleTime + decayTime);

            osc.start(safeScheduleTime);
            osc.stop(safeScheduleTime + decayTime);
        }

        memory.nextBeatTime += beatDuration;
        memory.currentBeat++;
        
        if (met.syncToBreath) {
            const sub = Math.max(1, met.subdivision || 4);
            if (memory.currentBeat >= sub) {
                memory.currentBeat = 0;
            }
        }
    }
};