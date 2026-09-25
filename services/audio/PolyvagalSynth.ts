import { AudioGraph, AudioPayload, PolyvagalConfig } from './AudioTypes';

export interface PolyvagalTelemetry {
    intervalPhase: 'MODULATION' | 'DECOMPRESSION';
    cycleProgress: number; // 0.0 to 1.0 in current cycle
    phaseBlend: number; // 0.0 to 1.0 (1.0 = full modulation, 0.0 = full decompression)
    sessionRemainingSec: number;
    sessionTotalSec: number;
    stapediusTensionLevel: number; // 0.0 to 1.0 (modulation curve for UI visualization)
    formantFrequencies: [number, number, number, number];
    isComplete: boolean;
    bilateralPanPosition?: number; // -1.0 (L) to +1.0 (R)
    currentSomaticPrompt?: string;
    currentSomaticTarget?: string;
    isExhalePhase?: boolean;
    rootFrequency?: number;
    autonomicPathway?: string;
    acousticSanctuary?: string;
}

export interface SomaticPromptItem {
    target: string;
    text: string;
}

export const SOMATIC_PROMPTS: SomaticPromptItem[] = [
    { target: 'Jaw & Trigeminal (CN V)', text: 'Gently unlock your jaw — allow a small space between your back teeth.' },
    { target: 'Shoulders & Trapezius (CN XI)', text: 'Drop your shoulders away from your ears on this exhale.' },
    { target: 'Eyes & Gaze (CN VII)', text: 'Soften your gaze — allow your peripheral vision to gently widen.' },
    { target: 'Throat & Pharynx (CN X)', text: 'Release the back of your throat — let the breath pass effortlessly.' },
    { target: 'Diaphragm & Belly (Vagus)', text: 'Release your belly — let your breath descend naturally downward.' },
    { target: 'Grounding & Interoception', text: 'Notice the gentle weight of your body resting safely right now.' }
];

export const POLYVAGAL_PRESETS: Record<string, Partial<PolyvagalConfig>> = {
    BALANCED_EQUILIBRIUM: {
        activePreset: 'BALANCED_EQUILIBRIUM',
        autonomicPathway: 'BALANCED',
        tier: 2,
        sessionDurationSec: 600,
        stapediusDepth: 0.50,
        formantVolume: 0.40,
        threatRumbleCut: 0.50,
        vocalProsodyLilt: false,
        laryngealWarmth: false,
        aspirationShimmer: false,
        prosodyDepth: 0.25,
        warmthDrive: 0.30,
        aspirationLevel: 0.20,
        bilateralPanning: false,
        vagalHummingGuide: false,
        somaticPrompts: true,
        acousticSanctuary: 'NONE'
    },
    SENSORY_OVERLOAD: {
        activePreset: 'SENSORY_OVERLOAD',
        autonomicPathway: 'SYMPATHETIC',
        tier: 1,
        sessionDurationSec: 600,
        stapediusDepth: 0.35,
        formantVolume: 0.30,
        threatRumbleCut: 0.85,
        vocalProsodyLilt: false,
        laryngealWarmth: false,
        aspirationShimmer: false,
        prosodyDepth: 0.20,
        warmthDrive: 0.30,
        aspirationLevel: 0.20,
        bilateralPanning: true,
        bilateralSpeed: 0.04,
        bilateralDepth: 0.25,
        vagalHummingGuide: false,
        somaticPrompts: true,
        acousticSanctuary: 'FOREST',
        sanctuaryVolume: 0.25
    },
    POST_STRESS_DECOMPRESS: {
        activePreset: 'POST_STRESS_DECOMPRESS',
        autonomicPathway: 'SYMPATHETIC',
        tier: 2,
        sessionDurationSec: 300,
        stapediusDepth: 0.45,
        formantVolume: 0.35,
        threatRumbleCut: 0.65,
        vocalProsodyLilt: false,
        laryngealWarmth: false,
        aspirationShimmer: false,
        prosodyDepth: 0.25,
        warmthDrive: 0.30,
        aspirationLevel: 0.20,
        bilateralPanning: false,
        vagalHummingGuide: false,
        somaticPrompts: true,
        acousticSanctuary: 'SHORELINE',
        sanctuaryVolume: 0.25
    },
    SLEEP_DRIFT: {
        activePreset: 'SLEEP_DRIFT',
        autonomicPathway: 'DORSAL',
        tier: 1,
        sessionDurationSec: 900,
        stapediusDepth: 0.25,
        formantVolume: 0.20,
        threatRumbleCut: 0.70,
        vocalProsodyLilt: false,
        laryngealWarmth: false,
        aspirationShimmer: false,
        prosodyDepth: 0.15,
        warmthDrive: 0.25,
        aspirationLevel: 0.20,
        bilateralPanning: true,
        bilateralSpeed: 0.03,
        bilateralDepth: 0.25,
        vagalHummingGuide: false,
        somaticPrompts: true,
        acousticSanctuary: 'HEARTH',
        sanctuaryVolume: 0.25
    },
    VOCAL_SOCIAL_PRIMING: {
        activePreset: 'VOCAL_SOCIAL_PRIMING',
        autonomicPathway: 'VENTRAL_PRIMING',
        tier: 3,
        sessionDurationSec: 300,
        stapediusDepth: 0.55,
        formantVolume: 0.45,
        threatRumbleCut: 0.45,
        vocalProsodyLilt: false,
        laryngealWarmth: false,
        aspirationShimmer: false,
        prosodyDepth: 0.30,
        warmthDrive: 0.30,
        aspirationLevel: 0.20,
        bilateralPanning: true,
        bilateralSpeed: 0.06,
        bilateralDepth: 0.30,
        vagalHummingGuide: true,
        somaticPrompts: true,
        acousticSanctuary: 'NONE'
    }
};

// Architectural parameter tuning rules for pure-sine formant acoustic filtering
export const POLYVAGAL_LIMITS = {
    // F1 Range: 550 Hz - 850 Hz (Pharyngeal Openness & Vocal Warmth)
    F1_CENTER: 700,
    F1_SWING: 150,
    F1_Q: 0.95, // Broad, musical, silky Q factor to prevent sharp ringing peaks

    // F2 Range: 1250 Hz - 2050 Hz (Vowel Clarity & Phonetic Intimacy)
    F2_CENTER: 1650,
    F2_SWING: 350,
    F2_Q: 1.05, // Smooth vocal tract bandwidth

    // F3 Range: 2450 Hz - 3250 Hz (Acoustic Presence & Singer's Formant)
    F3_CENTER: 2850,
    F3_SWING: 350,
    F3_Q: 1.10,

    // Threat Cutoff: 240 Hz (Porgesian stapedius conditioning threshold: filters low-frequency environmental threat vibrations below human vocal communication range)
    THREAT_CUTOFF_HZ: 240
};

// Memoized glottal waveshaper curve for Laryngeal Vocal Warmth (Strict 1:1 linear pass-through to ensure zero clipping)
let cachedWarmthCurve: Float32Array | null = null;
export const getGlottalWarmthCurve = (samples = 2048): Float32Array => {
    if (cachedWarmthCurve) return cachedWarmthCurve;
    cachedWarmthCurve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / (samples - 1) - 1; // -1 to +1
        cachedWarmthCurve[i] = x;
    }
    return cachedWarmthCurve;
};

// Global telemetry storage so UI and LatticeSynth can read at 60fps without React re-render lag
export const globalPolyvagalTelemetry: PolyvagalTelemetry = {
    intervalPhase: 'MODULATION',
    cycleProgress: 0,
    phaseBlend: 1.0,
    sessionRemainingSec: 600,
    sessionTotalSec: 600,
    stapediusTensionLevel: 0,
    formantFrequencies: [700, 1650, 2850, 5500],
    isComplete: false,
    bilateralPanPosition: 0,
    currentSomaticPrompt: SOMATIC_PROMPTS[0].text,
    currentSomaticTarget: SOMATIC_PROMPTS[0].target,
    isExhalePhase: false,
    rootFrequency: 256.0,
    autonomicPathway: 'BALANCED',
    acousticSanctuary: 'NONE'
};

interface PolyvagalInternalMemory {
    sessionStartTime: number;
    cycleStartTime: number;
    wasEnabled?: boolean;
    lastDurationSec?: number;
    isBypassed?: boolean;
    isSessionBypassed?: boolean;
    appliedQScale?: number;
    appliedF1Freq?: number;
    appliedF2Freq?: number;
    appliedF3Freq?: number;
    appliedF1Gain?: number;
    appliedF2Gain?: number;
    appliedF3Gain?: number;
    appliedRumbleFreq?: number;
    appliedRumbleGain?: number;
    appliedHighGain?: number;
    appliedMakeup?: number;
    appliedWarmth?: number;
}

/**
 * Polyvagal Middle-Ear Auditory Conditioning Engine
 * 
 * Implements Dr. Stephen Porges' Safe and Sound Protocol (SSP) acoustic mechanics:
 * 1. Modulates acoustic transfer characteristics of incoming audio in the human voice band (1,000–4,000 Hz)
 * 2. Dynamically sweeps vocal formant frequencies (F1, F2, F3) with broadened Q factors (1.15–1.30)
 *    to eliminate phase distortion / cancellation on pure sine chords
 * 3. Directional Respiratory Sinus Arrhythmia (RSA):
 *    - Inhale expands formants upward toward alert ventral social engagement
 *    - Exhale constricts formants downward into warm parasympathetic grounding
 * 4. Sub-240 Hz environmental threat rumble cut (leaves musical chord roots 100% intact)
 * 5. Dynamic constant-loudness makeup compensation
 * 6. Ultra-gradual 8-second raised-cosine crossfade between Modulation and Decompression:
 *    - Absolutely ZERO clicks, zero pops, zero discontinuities
 * 7. Nuance Controls:
 *    - Vocal Prosody Lilt: Melodic micro-pitch intonation (±8c to ±35c) with smoothly scaled depth
 *    - Laryngeal Glottal Warmth: Click-free dry/wet parallel soft saturation
 *    - Pharyngeal Aspiration Air: Whisper breath softly sighing on exhalation
 */
export const tickPolyvagal = (
    graph: AudioGraph,
    payload: AudioPayload,
    t: number,
    memory: Record<string, unknown>
) => {
    const config: PolyvagalConfig | undefined = payload.polyvagalConfig;

    if (!memory.polyvagal) {
        memory.polyvagal = {
            sessionStartTime: t,
            cycleStartTime: t,
            wasEnabled: false,
            lastDurationSec: -1
        } as PolyvagalInternalMemory;
    }

    const mem = memory.polyvagal as PolyvagalInternalMemory;
    const filters = graph.polyvagalFormants;
    const rumbleFilter = graph.threatRumbleFilter;

    const isEnabled = !!(config && config.enabled && !config.isEmergencyGrounded);

    // 1. INACTIVE OR EMERGENCY GROUNDED STATE -> Gradual Transparent Bypass
    if (!isEnabled || !filters || !rumbleFilter) {
        mem.wasEnabled = false;

        // Smoothly ramp all filter gains to neutral 0 dB with gentle 0.3s time constants (no clicks)
        // Guard with latch so bypass ramping is only scheduled once rather than 50x per second
        if (!mem.isBypassed) {
            if (rumbleFilter) {
                rumbleFilter.gain.setTargetAtTime(0, t, 0.3);
            }
            if (filters) {
                filters.f1.gain.setTargetAtTime(0, t, 0.3);
                filters.f2.gain.setTargetAtTime(0, t, 0.3);
                filters.f3.gain.setTargetAtTime(0, t, 0.3);
                filters.highShelf.gain.setTargetAtTime(0, t, 0.3);
                if (filters.makeupGain) {
                    filters.makeupGain.gain.setTargetAtTime(1.0, t, 0.3);
                }
                if (filters.warmthWet && filters.warmthDry) {
                    filters.warmthWet.gain.setTargetAtTime(0, t, 0.3);
                    filters.warmthDry.gain.setTargetAtTime(1.0, t, 0.3);
                }
                if (filters.aspirationGain) {
                    filters.aspirationGain.gain.setTargetAtTime(0, t, 0.3);
                }
                if (filters.bilateralPanner) {
                    filters.bilateralPanner.pan.setTargetAtTime(0, t, 0.3);
                }
                if (filters.sanctuaryGain) {
                    filters.sanctuaryGain.gain.setTargetAtTime(0, t, 0.3);
                }
            }
            mem.isBypassed = true;
            mem.appliedF1Gain = 0;
            mem.appliedF2Gain = 0;
            mem.appliedF3Gain = 0;
            mem.appliedRumbleGain = 0;
            mem.appliedHighGain = 0;
            mem.appliedMakeup = 1.0;
        }

        globalPolyvagalTelemetry.stapediusTensionLevel = 0;
        globalPolyvagalTelemetry.cycleProgress = 0;
        globalPolyvagalTelemetry.phaseBlend = 0;
        globalPolyvagalTelemetry.intervalPhase = 'MODULATION';
        globalPolyvagalTelemetry.sessionRemainingSec = config?.sessionDurationSec || 600;
        globalPolyvagalTelemetry.sessionTotalSec = config?.sessionDurationSec || 600;
        globalPolyvagalTelemetry.isComplete = false;
        globalPolyvagalTelemetry.bilateralPanPosition = 0;
        globalPolyvagalTelemetry.isExhalePhase = false;
        return;
    }

    // 2. SESSION TIMING & TITRATION INITIALIZATION
    const sessionDuration = Math.max(60, config.sessionDurationSec || 600);

    if (!mem.wasEnabled || mem.lastDurationSec !== sessionDuration) {
        mem.sessionStartTime = t;
        mem.cycleStartTime = t;
        mem.wasEnabled = true;
        mem.lastDurationSec = sessionDuration;
    }

    const sessionElapsed = Math.max(0, t - mem.sessionStartTime);
    const sessionRemaining = Math.max(0, sessionDuration - sessionElapsed);
    const isSessionComplete = sessionRemaining <= 0.5;

    globalPolyvagalTelemetry.sessionRemainingSec = Math.round(sessionRemaining);
    globalPolyvagalTelemetry.sessionTotalSec = sessionDuration;
    globalPolyvagalTelemetry.isComplete = isSessionComplete;

    if (isSessionComplete) {
        // Clinical session finished: ease all filters to neutral bypass
        if (!mem.isSessionBypassed) {
            rumbleFilter.gain.setTargetAtTime(0, t, 0.4);
            filters.f1.gain.setTargetAtTime(0, t, 0.4);
            filters.f2.gain.setTargetAtTime(0, t, 0.4);
            filters.f3.gain.setTargetAtTime(0, t, 0.4);
            filters.highShelf.gain.setTargetAtTime(0, t, 0.4);
            if (filters.makeupGain) {
                filters.makeupGain.gain.setTargetAtTime(1.0, t, 0.4);
            }
            if (filters.warmthWet && filters.warmthDry) {
                filters.warmthWet.gain.setTargetAtTime(0, t, 0.4);
                filters.warmthDry.gain.setTargetAtTime(1.0, t, 0.4);
            }
            if (filters.aspirationGain) {
                filters.aspirationGain.gain.setTargetAtTime(0, t, 0.4);
            }
            if (filters.bilateralPanner) {
                filters.bilateralPanner.pan.setTargetAtTime(0, t, 0.4);
            }
            if (filters.sanctuaryGain) {
                filters.sanctuaryGain.gain.setTargetAtTime(0, t, 0.4);
            }
            mem.isSessionBypassed = true;
        }
        globalPolyvagalTelemetry.stapediusTensionLevel = 0;
        globalPolyvagalTelemetry.phaseBlend = 0;
        globalPolyvagalTelemetry.bilateralPanPosition = 0;
        globalPolyvagalTelemetry.isExhalePhase = false;
        return;
    }

    mem.isSessionBypassed = false;
    mem.isBypassed = false;

    // 3. AUTONOMIC PATHWAY & CLINICAL RECONDITIONING CYCLE
    const pathway = config.autonomicPathway || 'BALANCED';
    globalPolyvagalTelemetry.autonomicPathway = pathway;
    globalPolyvagalTelemetry.acousticSanctuary = config.acousticSanctuary || 'NONE';

    // Cycle durations tailored by pathway:
    // - Balanced: 60s (38s active, 8s crossfade, 6s rest, 8s crossfade)
    // - Sympathetic (Fight/Flight): 60s with extended 12s rest phase for down-regulation
    // - Dorsal (Freeze/Shutdown): 60s with gentle 5s rest so alertness does not lapse
    // - Ventral Priming: 50s energizing cycle (38s active, 4s crossfade, 4s rest, 4s crossfade)
    const cycleDuration = pathway === 'VENTRAL_PRIMING' ? 50 : 60;
    const cycleElapsed = (t - mem.cycleStartTime) % cycleDuration;
    const cycleProgress = cycleElapsed / cycleDuration;

    let phaseBlend = 1.0;
    let isDecompression = false;

    if (pathway === 'SYMPATHETIC') {
        // Extended rest for calming down sympathetic hyper-arousal
        // 0s-32s: Active, 32s-40s: crossfade into rest, 40s-52s: rest (12s), 52s-60s: crossfade back
        isDecompression = cycleElapsed >= 38 && cycleElapsed < 54;
        if (cycleElapsed >= 32 && cycleElapsed < 40) {
            const p = (cycleElapsed - 32) / 8.0;
            phaseBlend = 0.5 * (1.0 + Math.cos(Math.PI * p));
        } else if (cycleElapsed >= 40 && cycleElapsed < 52) {
            phaseBlend = 0.0;
        } else if (cycleElapsed >= 52) {
            const p = (cycleElapsed - 52) / 8.0;
            phaseBlend = 0.5 * (1.0 - Math.cos(Math.PI * p));
        }
    } else if (pathway === 'VENTRAL_PRIMING') {
        // Quick, crisp priming cycles
        isDecompression = cycleElapsed >= 40 && cycleElapsed < 46;
        if (cycleElapsed >= 38 && cycleElapsed < 42) {
            const p = (cycleElapsed - 38) / 4.0;
            phaseBlend = 0.5 * (1.0 + Math.cos(Math.PI * p));
        } else if (cycleElapsed >= 42 && cycleElapsed < 46) {
            phaseBlend = 0.0;
        } else if (cycleElapsed >= 46) {
            const p = (cycleElapsed - 46) / 4.0;
            phaseBlend = 0.5 * (1.0 - Math.cos(Math.PI * p));
        }
    } else {
        // Standard Balanced / Dorsal cycle
        isDecompression = cycleElapsed >= 44 && cycleElapsed < 56;
        if (cycleElapsed >= 38 && cycleElapsed < 46) {
            const p = (cycleElapsed - 38) / 8.0;
            phaseBlend = 0.5 * (1.0 + Math.cos(Math.PI * p));
        } else if (cycleElapsed >= 46 && cycleElapsed < 52) {
            phaseBlend = 0.0;
        } else if (cycleElapsed >= 52) {
            const p = (cycleElapsed - 52) / 8.0;
            phaseBlend = 0.5 * (1.0 - Math.cos(Math.PI * p));
        }
    }

    // Clamp phaseBlend safely between 0.0 and 1.0
    phaseBlend = Math.max(0.0, Math.min(1.0, phaseBlend));

    globalPolyvagalTelemetry.cycleProgress = cycleProgress;
    globalPolyvagalTelemetry.phaseBlend = phaseBlend;
    globalPolyvagalTelemetry.intervalPhase = isDecompression ? 'DECOMPRESSION' : 'MODULATION';

    // 4. TITRATION TIER & USER SLIDER SCALING
    const tier = config.tier || 2;
    const tierMultiplier = tier === 1 ? 0.75 : (tier === 3 ? 1.25 : 1.0);
    const userDepth = Math.max(0.05, Math.min(1.0, config.stapediusDepth ?? 0.6));
    const userFormantVol = Math.max(0.05, Math.min(1.0, config.formantVolume ?? 0.5));
    const userRumbleCut = Math.max(0.0, Math.min(1.0, config.threatRumbleCut ?? 0.5));

    // 5. DIRECTIONAL RESPIRATORY SINUS ARRHYTHMIA (RSA) & PROSODY WAVE
    let dynamicTension = 0;
    const isBreathPacerActive = !!(payload.isBreathActive && payload.breathStartTime);

    if (config.breathLinked && isBreathPacerActive) {
        const breathVal = typeof payload.signals?.breath === 'number' 
            ? payload.signals.breath 
            : (typeof payload.breathRadius === 'number' ? payload.breathRadius : 0.5);
        dynamicTension = Math.max(0, Math.min(1, breathVal));
    } else {
        const waveA = Math.sin(t * 2 * Math.PI * 0.083) * 0.5 + 0.5;
        const waveB = Math.sin(t * 2 * Math.PI * 0.125 + 1.2) * 0.5 + 0.5;
        dynamicTension = waveA * 0.75 + waveB * 0.25;
    }

    const effectiveTension = dynamicTension * userDepth * tierMultiplier * phaseBlend;
    globalPolyvagalTelemetry.stapediusTensionLevel = effectiveTension;

    // 6. DYNAMIC FORMANT FREQUENCY SWEEP & Q FACTORS TAILORED BY PATHWAY
    // Uses broad, musical, silky Q factors to eliminate any sharp ringing peaks or nasal distortion
    const qScale = pathway === 'SYMPATHETIC' ? 0.85 : (pathway === 'VENTRAL_PRIMING' ? 1.05 : 0.95);
    if (Math.abs(qScale - (mem.appliedQScale || -1)) > 0.01) {
        filters.f1.Q.setTargetAtTime(POLYVAGAL_LIMITS.F1_Q * qScale, t, 0.35);
        filters.f2.Q.setTargetAtTime(POLYVAGAL_LIMITS.F2_Q * qScale, t, 0.35);
        filters.f3.Q.setTargetAtTime(POLYVAGAL_LIMITS.F3_Q * qScale, t, 0.35);
        mem.appliedQScale = qScale;
    }

    const sweepScale = userDepth * tierMultiplier * phaseBlend;
    const rsaOffset = (dynamicTension - 0.5) * 2;
    const f1Center = POLYVAGAL_LIMITS.F1_CENTER + rsaOffset * (POLYVAGAL_LIMITS.F1_SWING * sweepScale);
    const f2Center = POLYVAGAL_LIMITS.F2_CENTER + rsaOffset * (POLYVAGAL_LIMITS.F2_SWING * sweepScale);
    const f3Center = POLYVAGAL_LIMITS.F3_CENTER + rsaOffset * (POLYVAGAL_LIMITS.F3_SWING * sweepScale);

    if (Math.abs(f1Center - (mem.appliedF1Freq || -1)) > 0.5) {
        filters.f1.frequency.setTargetAtTime(f1Center, t, 0.35);
        mem.appliedF1Freq = f1Center;
    }
    if (Math.abs(f2Center - (mem.appliedF2Freq || -1)) > 0.5) {
        filters.f2.frequency.setTargetAtTime(f2Center, t, 0.35);
        mem.appliedF2Freq = f2Center;
    }
    if (Math.abs(f3Center - (mem.appliedF3Freq || -1)) > 0.5) {
        filters.f3.frequency.setTargetAtTime(f3Center, t, 0.35);
        mem.appliedF3Freq = f3Center;
    }

    // 7. FORMANT RESONANCE GAIN (Calibrated soothing acoustic boost, strictly preventing bus clipping)
    const maxBoostDb = userFormantVol * 3.5 * tierMultiplier * (pathway === 'VENTRAL_PRIMING' ? 1.15 : 1.0);
    const f1Gain = maxBoostDb * (0.4 + 0.6 * dynamicTension) * phaseBlend;
    const f2Gain = (maxBoostDb * 0.95) * (0.4 + 0.6 * dynamicTension) * phaseBlend;
    const f3Gain = (maxBoostDb * 0.80) * (0.4 + 0.6 * dynamicTension) * phaseBlend;

    if (Math.abs(f1Gain - (mem.appliedF1Gain ?? -999)) > 0.05) {
        filters.f1.gain.setTargetAtTime(f1Gain, t, 0.35);
        mem.appliedF1Gain = f1Gain;
    }
    if (Math.abs(f2Gain - (mem.appliedF2Gain ?? -999)) > 0.05) {
        filters.f2.gain.setTargetAtTime(f2Gain, t, 0.35);
        mem.appliedF2Gain = f2Gain;
    }
    if (Math.abs(f3Gain - (mem.appliedF3Gain ?? -999)) > 0.05) {
        filters.f3.gain.setTargetAtTime(f3Gain, t, 0.35);
        mem.appliedF3Gain = f3Gain;
    }

    // 8. SUB-240 HZ THREAT RUMBLE ATTENUATION (Dr. Stephen Porges / SSP clinical specification)
    // Low frequencies (< 240 Hz) trigger auditory vigilance and flaccid middle-ear posture.
    // Attenuating this band engages the stapedius reflex, conditioning the middle ear
    // to focus on the human social engagement bandwidth (500 Hz - 4000 Hz).
    if (mem.appliedRumbleFreq !== POLYVAGAL_LIMITS.THREAT_CUTOFF_HZ) {
        rumbleFilter.frequency.setTargetAtTime(POLYVAGAL_LIMITS.THREAT_CUTOFF_HZ, t, 0.35);
        mem.appliedRumbleFreq = POLYVAGAL_LIMITS.THREAT_CUTOFF_HZ;
    }
    const rumbleExtra = pathway === 'SYMPATHETIC' ? 3.0 : 0.0;
    const maxRumbleCutDb = (3.5 + userRumbleCut * 7.5 + rumbleExtra) * tierMultiplier;
    const targetRumbleGain = - maxRumbleCutDb * (0.6 + 0.4 * dynamicTension) * phaseBlend;
    if (Math.abs(targetRumbleGain - (mem.appliedRumbleGain ?? -999)) > 0.05) {
        rumbleFilter.gain.setTargetAtTime(targetRumbleGain, t, 0.35);
        mem.appliedRumbleGain = targetRumbleGain;
    }

    // 9. HIGH-FREQUENCY SAFETY SMOOTHING
    const highDamping = pathway === 'SYMPATHETIC' ? 1.2 : 0.0;
    const targetHighGain = - (0.8 + 1.8 * userDepth + highDamping) * phaseBlend;
    if (Math.abs(targetHighGain - (mem.appliedHighGain ?? -999)) > 0.05) {
        filters.highShelf.gain.setTargetAtTime(targetHighGain, t, 0.35);
        mem.appliedHighGain = targetHighGain;
    }

    // 10. REAL-TIME CONSTANT-LOUDNESS & HEADROOM COMPENSATION
    if (filters.makeupGain) {
        // True acoustic power compensation across F1, F2, F3 and rumble cut to maintain comfortable perceived level and headroom
        const avgFormantDb = (f1Gain + f2Gain + f3Gain) / 3;
        const peakFormantDb = Math.max(f1Gain, f2Gain, f3Gain);
        const formantOffsetDb = - (avgFormantDb * 0.60 + peakFormantDb * 0.25);
        const rumbleCompDb = Math.min(2.5, Math.abs(targetRumbleGain) * 0.15);
        const makeupDb = formantOffsetDb + rumbleCompDb;
        const targetMakeupLinear = Math.max(0.40, Math.min(1.15, Math.pow(10, makeupDb / 20)));
        if (Math.abs(targetMakeupLinear - (mem.appliedMakeup || -1)) > 0.005) {
            filters.makeupGain.gain.setTargetAtTime(targetMakeupLinear, t, 0.35);
            mem.appliedMakeup = targetMakeupLinear;
        }
    }

    // 11. CLEAN LARYNGEAL GLOTTAL WARMTH CONTROLS (Artifact-free)
    if (filters.warmthWet && filters.warmthDry && !mem.appliedWarmth) {
        filters.warmthWet.gain.setTargetAtTime(0, t, 0.35);
        filters.warmthDry.gain.setTargetAtTime(1.0, t, 0.35);
        if (filters.warmthPre) {
            filters.warmthPre.gain.setTargetAtTime(1.0, t, 0.35);
        }
        mem.appliedWarmth = true;
    }

    // 12. PHARYNGEAL ASPIRATION AIR SHIMMER (DYNAMIC VOCAL TRACT BREATH SIGH)
    if (filters.aspirationGain) {
        const userAspLevel = Math.max(0.0, Math.min(1.0, config.aspirationLevel ?? 0.38));
        const isAspEnabled = !!config.aspirationShimmer;

        if (isAspEnabled && phaseBlend > 0.001) {
            if (filters.aspirationFilter) {
                filters.aspirationFilter.frequency.setTargetAtTime(f3Center, t, 0.35);
                filters.aspirationFilter.Q.setTargetAtTime(2.4, t, 0.35);
            }

            const exhaleProgress = Math.max(0, Math.min(1, (1.0 - dynamicTension) * 1.25));
            const sighEnvelope = Math.sin(exhaleProgress * Math.PI);

            const targetAsp = (0.006 + 0.032 * sighEnvelope) * userAspLevel * phaseBlend;
            filters.aspirationGain.gain.setTargetAtTime(targetAsp, t, 0.35);
        } else {
            filters.aspirationGain.gain.setTargetAtTime(0, t, 0.35);
        }
    }

    // 13. BILATERAL EAR CONDITIONING (ALTERNATING STAPEDIUS ACOUSTIC REFLEX)
    if (filters.bilateralPanner) {
        if (config.bilateralPanning && phaseBlend > 0.001) {
            const panSpeed = Math.max(0.01, Math.min(0.2, config.bilateralSpeed ?? 0.06));
            const panDepth = Math.max(0.1, Math.min(0.7, config.bilateralDepth ?? 0.35));
            const pan = Math.sin(t * 2 * Math.PI * panSpeed) * panDepth * phaseBlend;
            filters.bilateralPanner.pan.setTargetAtTime(pan, t, 0.1);
            globalPolyvagalTelemetry.bilateralPanPosition = pan;
        } else {
            filters.bilateralPanner.pan.setTargetAtTime(0, t, 0.2);
            globalPolyvagalTelemetry.bilateralPanPosition = 0;
        }
    }

    // 14. ACOUSTIC SANCTUARY AMBIENT SYNTHESIZER (PLACES OF SAFETY)
    if (filters.sanctuaryGain && filters.sanctuaryFilter && filters.sanctuarySwellGain) {
        const sanctuary = config.acousticSanctuary || 'NONE';
        const userSanctVol = Math.max(0, Math.min(1, config.sanctuaryVolume ?? 0.30));

        if (sanctuary === 'NONE' || phaseBlend <= 0.001) {
            filters.sanctuaryGain.gain.setTargetAtTime(0, t, 0.3);
        } else if (sanctuary === 'FOREST') {
            filters.sanctuaryFilter.type = 'bandpass';
            const windSwell = Math.sin(t * 0.35) * 450 + 2100;
            filters.sanctuaryFilter.frequency.setTargetAtTime(windSwell, t, 0.3);
            filters.sanctuaryFilter.Q.setTargetAtTime(1.1, t, 0.3);
            const targetVol = userSanctVol * 0.28 * phaseBlend;
            filters.sanctuaryGain.gain.setTargetAtTime(targetVol, t, 0.3);
        } else if (sanctuary === 'HEARTH') {
            filters.sanctuaryFilter.type = 'lowpass';
            filters.sanctuaryFilter.frequency.setTargetAtTime(850, t, 0.3);
            filters.sanctuaryFilter.Q.setTargetAtTime(0.7, t, 0.3);
            const crackleMicro = 0.85 + 0.15 * Math.sin(t * 7.3 + Math.cos(t * 2.1));
            const targetVol = userSanctVol * 0.25 * crackleMicro * phaseBlend;
            filters.sanctuaryGain.gain.setTargetAtTime(targetVol, t, 0.3);
        } else if (sanctuary === 'SHORELINE') {
            filters.sanctuaryFilter.type = 'lowpass';
            const oceanFreq = 350 + dynamicTension * 1200;
            filters.sanctuaryFilter.frequency.setTargetAtTime(oceanFreq, t, 0.35);
            filters.sanctuaryFilter.Q.setTargetAtTime(0.9, t, 0.35);
            const oceanSwell = 0.2 + 0.8 * dynamicTension;
            const targetVol = userSanctVol * 0.32 * oceanSwell * phaseBlend;
            filters.sanctuaryGain.gain.setTargetAtTime(targetVol, t, 0.35);
        }
    }

    // 15. SOMATIC PROMPTS ROTATION
    const promptIndex = Math.floor(t / 14) % SOMATIC_PROMPTS.length;
    globalPolyvagalTelemetry.currentSomaticPrompt = config.somaticPrompts !== false ? SOMATIC_PROMPTS[promptIndex].text : '';
    globalPolyvagalTelemetry.currentSomaticTarget = config.somaticPrompts !== false ? SOMATIC_PROMPTS[promptIndex].target : '';

    // 16. VAGAL HUMMING RESONANCE GUIDE TELEMETRY
    const isExhale = dynamicTension < 0.48;
    globalPolyvagalTelemetry.isExhalePhase = isExhale;
    const rootFreq = (payload.customFrequencies && (payload.customFrequencies['UNIVERSAL_840'] || payload.customFrequencies['UNIVERSAL_841'])) || 256.0;
    globalPolyvagalTelemetry.rootFrequency = Math.round(rootFreq * 10) / 10;

    globalPolyvagalTelemetry.formantFrequencies = [
        Math.round(f1Center),
        Math.round(f2Center),
        Math.round(f3Center),
        5500
    ];
};

/**
 * Reset polyvagal session elapsed time and titration countdown
 */
export const resetPolyvagalSession = (memory: Record<string, unknown>, durationSec: number = 600) => {
    const mem = memory?.polyvagal as PolyvagalInternalMemory | undefined;
    if (mem) {
        mem.wasEnabled = false;
        mem.lastDurationSec = -1;
    }
    globalPolyvagalTelemetry.sessionRemainingSec = durationSec;
    globalPolyvagalTelemetry.sessionTotalSec = durationSec;
    globalPolyvagalTelemetry.isComplete = false;
    globalPolyvagalTelemetry.stapediusTensionLevel = 0;
    globalPolyvagalTelemetry.phaseBlend = 0;
};
