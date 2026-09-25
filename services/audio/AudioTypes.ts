// ==========================================
// UTILITY: THE IMMUTABILITY CONTRACT
// ==========================================
import type { ChordGlideConfig } from './ChordGlideEngine';
export type { ChordGlideConfig };

export type StackMutes = Record<string, boolean>;

export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends Function 
        ? T[P] 
        : T[P] extends object 
            ? DeepReadonly<T[P]> 
            : T[P];
};

// ==========================================
// CORE AUDIO CONFIGURATIONS
// ==========================================
export type MetronomeSound = 'WOODBLOCK' | 'BAMBOO' | 'DRIP' | 'CHIME' | 'STONE' | 'CEDAR' | 'CLAY' | 'THUNDER';
export type TurnaroundMode = 'NONE' | 'SHIMMER' | 'PEAK' | 'SILENCE' | 'UNDERWATER' | 'GROUND' | 'STATIC' | 'DEEPEN' | 'SUSPEND' | 'SHUTOFF';

export interface ReverbConfig { decay: number; preDelay: number; diffusion: number; damping: number; modulation: number; wetness: number; isEntrainmentSync: boolean; }
export interface KickConfig { 
    freq: number; 
    decay: number; 
    attack: number; 
    drive: number; 
    type: 'SINE' | 'SQUARE' | 'SAW' | 'TRIANGLE';
    waveType?: 'sine' | 'triangle';
    baseFreq?: number;
    pitchStart?: number;
    pitchDecay?: number;
    ampAttack?: number;
    ampDecay?: number;
    clickLevel?: number;
    lpfCutoff?: number;
    saturation?: number;
    bpm?: number;
    syncMode?: 'BREATH' | 'BREATH_COUNT' | 'BINAURAL' | 'STEADY';
    syncToSeconds?: boolean;
    doubleBeat?: boolean;
    colorScheme?: string;
    customColor?: string;
}
export interface MetronomeConfig { enabled: boolean; sound: MetronomeSound; bpm: number; syncToBreath: boolean; foam: number; vol: number; subdivision: number; phaseMask: { inhale: boolean, holdIn: boolean, exhale: boolean, holdOut: boolean }; countdownBeats: number; }

export interface BreathConfig { 
    inhale: number; 
    holdIn: number; 
    exhale: number; 
    holdOut: number; 
    oceanVol: number; 
    noiseVolume?: number;
    noiseType?: string; 
    inhaleNoise?: string;
    holdInNoise?: string;
    exhaleNoise?: string;
    holdOutNoise?: string;
    toneType: string; 
    cueTone?: string;
    visualMode: string; 
    colorScheme?: string;
    customColor?: string;
    cueBase?: string; 
    cueOctave?: number;
    cueScale?: string;
    cuePitchHz?: number;
    cueHarmonic?: number; 
    cueVolume?: number; 
    turnaroundVol?: number; // Apex / nadir turnaround cue chime volume (0.0 - 1.0)
    bellVol?: number; // Phase cycle transition bell chime volume (0.0 - 1.0)
    cueDecay?: number; // Ring / decay time in seconds (0.5 - 8.0s)
    cuePitchShift?: number; // Fine pitch / detune in semitones (-12 to +12)
    cuePhaseMask?: { inhale?: boolean; holdIn?: boolean; exhale?: boolean; holdOut?: boolean }; // Turnaround trigger phases
    syncTurnaroundToChordRoot?: boolean; // When in Music Mode, turnaround bell automatically synchronizes pitch to current chord root
    entrainTide?: boolean; 
    tideEntrainMode?: 'BINAURAL' | 'ISOCHRONIC' | 'MONAURAL';
    tideEntrainDepth?: number;
    tideEq?: number[]; 
    isBreathActive?: boolean;
    metronome?: MetronomeConfig; 
    holdBehavior?: TurnaroundMode; 
    waitBehavior?: TurnaroundMode; 
    
    // SENTIC OVERLAY SETTINGS
    senticState?: string; 
    isSenticPacing?: boolean; 
    senticVibratoDepth?: number; 
    isSenticVisual?: boolean; 
    isSenticTideAM?: boolean; 
    isSenticTideFM?: boolean; 
    isSenticSoloist?: boolean; 
    isSenticHaptics?: boolean; 
}

// ==========================================
// MASTER 12-BAND EQUALIZER CONFIGURATION
// ==========================================
export const MASTER_EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000, 20000];

export interface EqPreset {
    id: string;
    name: string;
    description: string;
    gains: number[];
}

export const MASTER_EQ_PRESETS: EqPreset[] = [
    { id: 'flat', name: 'Flat Reference', description: 'Zero coloration, neutral response across all frequencies', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'sub_bass', name: 'Sub Bass / Earth', description: 'Deep grounding sub-bass boost for body resonation', gains: [5.5, 4.5, 3.0, 1.5, 0, 0, 0, 0, -0.5, -1.0, -2.0, -3.0] },
    { id: 'meditation', name: 'Warm Meditation', description: 'Gentle low-mid warmth with relaxed high-frequency roll-off', gains: [3.0, 3.5, 3.0, 2.0, 1.0, 0, -1.0, -2.0, -3.0, -3.5, -4.0, -5.0] },
    { id: 'bell_chime', name: 'Bell & Chime Clarity', description: 'Enhanced presence for Tibetan bowls, singing bowls, and turnaround bells', gains: [-1.5, -1.0, 0, 0, 1.5, 3.0, 4.5, 5.0, 4.0, 3.0, 2.0, 1.0] },
    { id: 'ethereal', name: 'Ethereal Air & Sheen', description: 'Lifted upper treble and air band for oceanic foam and crystal tones', gains: [-2.0, -1.5, -1.0, 0, 0, 1.0, 2.0, 3.5, 5.0, 6.0, 5.5, 4.5] },
    { id: 'smile', name: 'Acoustic Smile', description: 'Boosted deep foundations and sparkling top end with relaxed mids', gains: [4.5, 3.5, 2.0, 0, -1.0, -1.5, -1.0, 0.5, 2.5, 4.0, 4.5, 4.0] },
    { id: 'presence', name: 'Harmonic Presence', description: 'Forward midrange articulation for vocal and binaural resonance', gains: [-1.0, 0, 1.0, 2.5, 4.0, 4.5, 3.5, 2.0, 1.0, 0, -1.0, -2.0] },
];

export interface SnakeConfig { mode: 'SNAKE' | 'HARMONIC'; transpose: number; glide: number; vol: number; isBinaural: boolean; }
export interface DelayConfig { time: number; feedback: number; cutoff: number; wetness: number; isPingPong: boolean; }
export interface NatureConfig { biome: 'TEMPERATE' | 'JUNGLE' | 'OCEAN' | 'CAVE'; timeMode: 'AUTO' | 'DAY' | 'NIGHT'; rainVol: number; streamVol: number; fireVol: number; windVol: number; birdVol: number; birdDensity: number; birdDiversity: number; }

// ==========================================
// ESOTERIC PHYSICS & IMMERSION CONFIGURATIONS
// ==========================================
export interface AetherConfig {
    isPureTone: boolean;
    entrainmentTarget: number;
}

export type ToneTimbre = 'SINE' | 'ANALOG' | 'TRIANGLE' | 'WARM_PAD';

export type EntrainmentLayer = 'binaural' | 'monaural' | 'isochronic';
export type EntrainmentMode = 'BINAURAL' | 'MONAURAL' | 'ISOCHRONIC' | 'HYBRID' | 'OFF';
export type TimeCrystalTopology = 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE' | 'PI' | 'GOLDEN' | string;
export type ComposerWarp = 'LINEAR' | 'BEETHOVEN' | 'MOZART' | 'HAYDN' | 'SCHUBERT' | 'CHOPIN' | 'BACH' | 'BRAHMS' | string;

export const resolveActiveLayers = (immersionConfig?: Partial<ImmersionConfig>): EntrainmentLayer[] => {
    if (immersionConfig?.activeLayers !== undefined) {
        return immersionConfig.activeLayers;
    }
    if (immersionConfig?.pulseMode === 'OFF') return [];
    if (immersionConfig?.pulseMode === 'ISOCHRONIC') return ['isochronic'];
    if (immersionConfig?.pulseMode === 'MONAURAL') return ['monaural'];
    return ['binaural'];
};

export interface ImmersionConfig {
    pulseMode?: EntrainmentMode;
    activeLayers?: EntrainmentLayer[];
    isTimeCrystal?: boolean;
    timeCrystalTopology?: TimeCrystalTopology;
    isPerfectFifth?: boolean;
    isPerfectFifthBreathSync?: boolean;
    isFractalSync?: boolean;
    isPhoticStrobe?: boolean;
    strobeOpacity?: number;
    isGoldenPanner?: boolean;
    isCarrierDrift?: boolean;
    isConjugatePhase?: boolean;       // 180° Anti-Phase polarity reversal (π)
    isochronicHardEdge?: boolean;     // False: Soft Sine/Raised Cosine; True: Sharp Square
    isPACGated?: boolean;             // Phase-Amplitude Coupling: Alpha crests gate Gamma bursts
    composerWarp?: ComposerWarp;
    composerIntensity?: number;
    toneTimbre?: ToneTimbre;
}

export interface BioSignals {
    vibratoEnvelope?: number;
    heartRate?: number;
    hrvComplexity?: number;
    [key: string]: number | undefined; 
}

// ==========================================
// HARDWARE: THE WEB AUDIO API GRAPH
// ==========================================
export interface AudioGraph {
    ctx: AudioContext;
    masterGain: GainNode;
    outputCeiling?: GainNode;
    masterEqNodes?: BiquadFilterNode[];
    limiter: DynamicsCompressorNode;
    reverbNode: ConvolverNode;
    reverbGain: GainNode;
    delayNode: DelayNode;
    delayFeedback: GainNode;
    delayGain: GainNode;
    analyserPreLimit: AnalyserNode;
    analyserPostLimit: AnalyserNode;
    latticeGains: Record<string, GainNode>;
    latticeOscs: Record<string, { left: OscillatorNode, right: OscillatorNode }>;
    latticePanners: Record<string, StereoPannerNode>;
    latticeLfos: Record<string, OscillatorNode>;
    heartGains: Record<string, GainNode>;
    heartOscs: Record<string, { left: OscillatorNode, right: OscillatorNode }>;
    noiseNode?: AudioBufferSourceNode | null;
    noiseGain: GainNode;
    filterNode: BiquadFilterNode;
    lfoGain: GainNode;
    noisePanner?: StereoPannerNode;
    polyvagalGain?: GainNode;
    threatRumbleFilter?: BiquadFilterNode;
    polyvagalFormants?: {
        f1: BiquadFilterNode;
        f2: BiquadFilterNode;
        f3: BiquadFilterNode;
        highShelf: BiquadFilterNode;
        makeupGain: GainNode;
        vocalWarmth?: WaveShaperNode;
        warmthDry?: GainNode;
        warmthWet?: GainNode;
        warmthPre?: GainNode;
        warmthOut?: GainNode;
        aspirationGain?: GainNode;
        aspirationFilter?: BiquadFilterNode;
        bilateralPanner?: StereoPannerNode;
        sanctuaryGain?: GainNode;
        sanctuaryFilter?: BiquadFilterNode;
        sanctuarySwellGain?: GainNode;
    };
}

// ==========================================
// STATE MACHINE MEMORY (TEARDOWN BLUEPRINT)
// ==========================================
export interface ChannelMemory {
    lastTarget?: number;
    isMuted?: boolean;
    isHit?: boolean;
    isTcActive?: boolean;
    tcLastTime?: number;
    lfoIso?: {
        active: boolean;
        depthNode: GainNode;
    };
    [key: string]: any; 
}

export interface AudioEngineMemory {
    lattice: Record<string, ChannelMemory>;
    heart: Record<string, ChannelMemory>;
    [key: string]: any; 
}

// ==========================================
// THE PAYLOAD (IMMUTABLE DATA CONTRACT)
// ==========================================
interface BaseAudioPayload {
    now: number; 
    bpm: number; 
    pitchMultiplier: number; 
    binauralFreqs: Record<string, number>;
    volumes: Record<string, number>; 
    mutes: Record<string, boolean>; 
    stackMutes: Record<string, boolean>;
    hits: string[]; 
    currentAttack: number; 
    currentRelease: number; 
    snakeConfig: SnakeConfig;
    heartHarmonicVols: number[]; 
    heartHarmonicMutes: boolean[]; 
    smoothedCoh: number; 
    modulations: Record<string, number>;
    aetherConfig: AetherConfig; 
    delayConfig: DelayConfig; 
    reverbConfig: ReverbConfig; 
    natureConfig: NatureConfig;
    immersionConfig: ImmersionConfig; 
    baseAperture: number; 
    isApertureActive: boolean; 
    breathRadius: number;
    breathPhase: string; 
    binauralBreathLinked: boolean; 
    activeHarmonicIndex: number;
    harmonicMasterVolume: number; 
    latticeMode: string; 
    isFeedbackActive: boolean;
    signals: BioSignals; 
    macros: Record<string, number>; 
    entrainmentMode: string; 
    sensorMode: string | null;
    breathConfig?: BreathConfig; 
    isBreathActive?: boolean;
    breathStartTime?: number;
    customFrequencies?: Record<string, number>;
    chordVoiceSourceFreqs?: Record<string, number>;
    kickConfig?: KickConfig;
    heartSyncMode?: 'BREATH' | 'BREATH_COUNT' | 'BINAURAL' | 'STEADY';
    isMusicMode?: boolean;
    currentChordRootNote?: string;
    currentChordRootFreq?: number;
    masterVolume?: number;
    masterEq?: number[];
    isMasterEqBypassed?: boolean;
    chordGlideConfig?: ChordGlideConfig;
    polyvagalConfig?: PolyvagalConfig;
}

export type AudioPayload = DeepReadonly<BaseAudioPayload>;

export type PolyvagalTier = 1 | 2 | 3;

export type AutonomicPathway = 'BALANCED' | 'SYMPATHETIC' | 'DORSAL' | 'VENTRAL_PRIMING';

export type AcousticSanctuary = 'NONE' | 'FOREST' | 'HEARTH' | 'SHORELINE';

export type PolyvagalRecoveryPreset = 
    | 'CUSTOM' 
    | 'BALANCED_EQUILIBRIUM' 
    | 'SENSORY_OVERLOAD' 
    | 'POST_STRESS_DECOMPRESS' 
    | 'SLEEP_DRIFT' 
    | 'VOCAL_SOCIAL_PRIMING';

export interface PolyvagalConfig {
    enabled: boolean;
    tier: PolyvagalTier; // 1: Acclimation (5m), 2: Conditioning (10m), 3: Toning (15m)
    stapediusDepth: number; // 0.0 to 1.0
    formantVolume: number; // 0.0 to 1.0
    threatRumbleCut: number; // 0.0 to 1.0 (0 to -18dB shelf below 500Hz)
    breathLinked: boolean; // true = locked to breath pacer, false = internal 0.1Hz LFO
    sessionDurationSec: number; // e.g. 300 (5m), 600 (10m), 900 (15m)
    sessionStartTime: number; // performance.now() or AudioContext.currentTime
    isEmergencyGrounded: boolean;
    vocalProsodyLilt?: boolean; // Micro-intonation melodic pitch inflection synced to breath/prosody
    laryngealWarmth?: boolean; // Glottal even-order harmonic saturation
    aspirationShimmer?: boolean; // Soft pharyngeal breath whisper on exhale
    prosodyDepth?: number; // 0.0 to 1.0 (calibrated sweet spot: ~0.48 for natural ±14 cents)
    warmthDrive?: number; // 0.0 to 1.0 (calibrated sweet spot: ~0.48 for velvety glottal body)
    aspirationLevel?: number; // 0.0 to 1.0 (calibrated sweet spot: ~0.38 for whisper breath air)
    // Optional Polyvagal Enhancements:
    autonomicPathway?: AutonomicPathway; // Starting point adaptation (Balanced, Sympathetic, Dorsal, Ventral)
    bilateralPanning?: boolean;          // Slow figure-8 stapedius bilateral ear panning (EMDR-like)
    bilateralSpeed?: number;            // Speed in Hz (0.02 - 0.12 Hz, default 0.06 Hz)
    bilateralDepth?: number;            // Panning depth (0.1 - 0.7, default 0.35)
    vagalHummingGuide?: boolean;         // Guided root-pitch humming resonance during exhale
    hummingMicFeedback?: boolean;       // Real-time audio pitch/resonance feedback for humming
    somaticPrompts?: boolean;           // Cranial nerve release micro-cues (jaw, shoulders, gaze, belly)
    acousticSanctuary?: AcousticSanctuary; // Ambient safety soundscapes ('NONE' | 'FOREST' | 'HEARTH' | 'SHORELINE')
    sanctuaryVolume?: number;           // Ambient sanctuary volume (0.0 to 1.0, default 0.30)
    activePreset?: PolyvagalRecoveryPreset; // Active clinical recovery preset
}

export const DEFAULT_POLYVAGAL_CONFIG: PolyvagalConfig = {
    enabled: false,
    tier: 2,
    stapediusDepth: 0.50,
    formantVolume: 0.40,
    threatRumbleCut: 0.50,
    breathLinked: true,
    sessionDurationSec: 600,
    sessionStartTime: 0,
    isEmergencyGrounded: false,
    vocalProsodyLilt: false, // Clean pure drone pitch by default (zero warble/tremor)
    laryngealWarmth: false,  // Transparent, distortion-free output
    aspirationShimmer: false, // Whisper air off by default for pristine sine purity
    prosodyDepth: 0.25,
    warmthDrive: 0.30,
    aspirationLevel: 0.20,
    autonomicPathway: 'BALANCED',
    bilateralPanning: false,
    bilateralSpeed: 0.06,
    bilateralDepth: 0.35,
    vagalHummingGuide: false,
    hummingMicFeedback: false,
    somaticPrompts: true,
    acousticSanctuary: 'NONE',
    sanctuaryVolume: 0.25,
    activePreset: 'BALANCED_EQUILIBRIUM'
};

export type { ChordGlideConfig, BreathGlideSyncTarget, ChordGlidePreset } from './chordProgressions';
export { DEFAULT_CHORD_GLIDE_CONFIG, CHORD_GLIDE_PRESETS } from './chordProgressions';
export {
    calculateSemitoneDistance,
    computeVoiceLeading,
    scheduleVoiceGlide,
    scheduleBinauralVoiceGlide,
    type VoiceAssignment,
    type VoiceLeadingPlan
} from './ChordGlideEngine';