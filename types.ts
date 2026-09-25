
export type TuningSystem = 'JUST_INTONATION' | 'PYTHAGOREAN' | 'MEANTONE' | 'WELL_TEMPERED' | '12_TET' | '19_EDO';

// --- TRINITY ARCHITECTURE TYPES ---
export type SensorMode = 'AETHER' | 'TIDAL' | 'CRYSTALLINE';
export type ViewMode = 'PLAYER' | 'STUDIO';

// --- DATA STRUCTURES ---

export interface HRMData {
  bpm: number;
  rrIntervals: number[];
  timestamp: number;
}

// --- VISUALIZATION METRICS ---

export interface CepstrumPoint {
  q: number; 
  a: number; 
}

export interface CepstrumMetrics {
  gamitude: number;
  dominantQuefrency: number; 
  state: string;
  description: string;
  graphData: CepstrumPoint[];
}

export interface VagalVisuals {
  rsaWave: { i: number; bpm: number }[];
  poincare: { x: number; y: number }[];
  avgRr: number;
}

export interface LorenzPoint {
    x: number; y: number; z: number; color?: string;
}

// --- PHYSICS ENGINE METRICS ---

export interface SpectralMetrics {
  lfHfRatio: number;
  totalPower: number;
  vlfPower: number;   
  lfPower: number;
  hfPower: number;
  lfNu: number;       
  hfNu: number;       
  dominantFreq: number;
  coherenceScore: number;
  spectralState: string;
  stateDescription: string;
  stateColor: string;
  noiseFloor: number; 
  respRate: number; 
}

export interface AlphaMetrics {
  schumannScore: number;      
  isLocked: boolean;          
  brainState: string;         
  voiceMessage: string;       
  bestLockType: 'SCHUMANN' | 'PHI' | 'HARMONIC' | 'NONE'; 
  bestLockHarmonic: number;   
  targetFreq: number;         
  currentFreq: number;
  schumannTarget: number;     
  schumannDeviation: number;  
}

export interface HarmonicInterval {
    ratio: number;
    name: string;
    cents: number; 
    accuracy: number; 
    baseHz: number;
    targetHz: number;
}

export interface HarmonicMetrics {
    currentInterval: HarmonicInterval | null;
    history: HarmonicInterval[]; 
    consonanceScore: number; 
    rootNote: string; 
    tuningSystem: TuningSystem;
}

// --- SUBSYSTEM METRICS ---

export interface MayerWaveMetrics {
  power: number;
  peakFreq: number;
  resonanceScore: number;
}

export interface RecursionMetrics {
  fundamentalFreq: number;
  fractalTargets: number[];
  recursionScore: number;
  isCoherent: boolean;
  internal: { phiRatio: number; depth: number; };
}

export interface VagalMetrics {
  rmssd: number; lnRmssd: number; sdnn: number; meanRr: number; meanHr: number;
  sd1: number; sd2: number; sd1Sd2Ratio: number;
  pnn50: number; sdsd: number;
  zScore: number; physioAge: number; chronologicalAge: number; state: string;
}

export interface BaevskyMetrics {
  si: number; amo: number; mo: number; mxdm: number;
  zone: 'ATHLETE' | 'READY' | 'LOAD' | 'STRESS';
}

export interface ReadinessMetrics {
  alpha1: number; readinessScore: number; zone: string; message: string;
  state: string; color: string; bufferSize: number; isReliable: boolean;
  artifactPercentage: number; statusReason: 'BUFFERING' | 'NOISE' | 'ACTIVE'; 
}

export interface SomaticMetrics {
  status: 'CALIBRATING' | 'ACTIVE' | 'BUFFERING';
  progress: number; currentNoise: number; noiseRatio: number; score: number; 
  state: 'TUNED' | 'MINOR STATIC' | 'INTERFERENCE' | 'CALIBRATING';
  message: string;
  internal: { jerk: number; tension: number; kinetic: number; sway: number; resp: number; impulse: number; };
}

export interface CarrierWaveMetrics {
  status: 'BUFFERING' | 'ACTIVE' | 'ECTOPIC_IGNORED';
  amplitude_mv: number; jitter_percent: number; integrity_score: number;
  state: 'LOCKED' | 'JITTER' | 'FRACTURED' | 'BUFFERING';
  message: string; envelopeBuffer: number[]; qtc: number; qrsDuration: number;
}

export interface ZeroPointMetrics {
  status: 'ACTIVE' | 'BUFFERING' | 'CALIBRATING';
  zero_score: number; refraction_index: number; raw_score?: number; noise_level_mv: number; 
  target_floor_mv?: number; diastole_duration_ms?: number;
  state: 'ZERO_POINT' | 'RIPPLES' | 'EYE_OF_STORM' | 'UNGROUNDED' | 'TURBULENCE' | 'CALIBRATING';
  message: string; bpm?: number; mode?: 'SILENCE' | 'VELOCITY_GROUND' | 'ERROR';
  lastBeatTimestamp: number; phase: 'IDLE' | 'REFRACTORY' | 'MEASURING'; orbit_radius: number; 
}

export interface LorenzMetrics {
    points: LorenzPoint[];
    dimensionScore: number; coreDensity: number;    
    state: 'FRACTAL' | 'LINEAR' | 'SCATTERED' | 'CALIBRATING';
}

export interface MSEMetrics {
  scales: number[];
  entropy: number[];
  complexityIndex: number;
}

// --- AGGREGATE DIAGNOSTICS ---

export interface DiagnosticsMetrics {
    sdnn: number; rmssd: number; sdsd: number; nn50: number; pnn50: number; meanRr: number; meanHr: number; sdnnIndex: number;
    cv: number; rrRange: number;
    vlf: number; lf: number; hf: number; lfHfRatio: number; totalPower: number; lfNu: number; hfNu: number; respRate: number; mainPeak: number; coherenceScore: number;
    sd1: number; sd2: number; sd1Sd2Ratio: number; cvi: number; csi: number; 
    sampEn: number; alpha1: number; alpha2: number; 
    vagalEfficiency: number;
    hti: number; tinn: number; stressIndex: number; portaIndex: number; guzikIndex: number; mad: number; pas: number;
    timeIrreversibility: number; 
    skewness: number; kurtosis: number; turningPointRatio: number;
    cepstralGamitude: number; peakQuefrency: number; spectralEntropy: number; harmonicComplexity: number;
    fundamentalFreq: number; phiRatio: number; recursionDepth: number; implosionIndex: number;
    mayerPower: number; mayerPeak: number; mayerPurity: number;
    harmonicRoot: string; harmonicInterval: string; harmonicRatio: number; harmonicCents: number; harmonicAccuracy: number; harmonicConsonance: number; harmonicBaseHz: number; harmonicTargetHz: number; harmonicTuningSystem: string;
    schumannLockScore: number; schumannHarmonic: number; schumannType: string; schumannTarget: number; schumannDeviation: number;
    zpScore: number; zpRefraction: number; zpState: string; zpPhase: string; noise_level_mv: number; carrierAmp: number; carrierJitter: number; carrierIntegrity: number; carrierState: string;
    somaticScore: number; somaticJerk: number; somaticState: string; somaticIntegration: number;
    accTotalPower: number; accX: number; accY: number; accZ: number; contractility: number;
    pepLatency: number; mechRespRate: number; mechRespAmp: number; swayFreq: number; swayCoherence: number; swayAmplitude: number; microTremor: number; postureAngle: number; verticalOscillation: number; kineticState: string;
    inspiratoryDutyCycle: number;
    qtc: number; qrsDuration: number; qtState: string;
    vagalLogRmssd: number; vagalZScore: number; vagalPhysioAge: number; vagalState: string;
    baevskyMode: number; baevskyAmplitude: number; baevskyRange: number; baevskyZone: string;
    readinessAlpha: number; readinessScore: number; readinessZone: string; readinessArtifacts: number;
    lorenzDimension: number; lorenzDensity: number; lorenzState: string;
    fftAlgorithm: string; fftWindow: string; fftDetrend: string; fftInterpolation: string; ecgSource: string; ecgProtocol: string; ecgSampleRate: number; ecgGain: number;
    decelerationCapacity: number; accelerationCapacity: number; prsaCurve: number[]; turbulenceOnset: number; turbulenceSlope: number; cpcCoherence: number; cpcSpectrum: number[];
    pulseTransitTime: number; 
    signalQualityIndex: number;
    
    telemetry: { batteryLevel: number; temperature: number; rssi: number; };
    lmsNoiseReductionDb: number;
    
    hysteresisArea: number; 
    recoveryElasticity: number; 
    lissajousLock: number;
}

/**
 * Prefer passing Partial<DiagnosticsMetrics> (or a focused subset)
 * into UI components instead of the full aggregate bag.
 * This keeps component contracts narrow and avoids over-fetching.
 */
export type DiagnosticsPartial = Partial<DiagnosticsMetrics>;

/** Minimal metrics surface used by the main tuner view in demo mode */
export interface TunerDisplayMetrics {
  coherenceScore?: number;
  dominantFreq?: number;
  lfHfRatio?: number;
  spectralState?: string;
  stateDescription?: string;
  stateColor?: string;
  vagalTone?: number;
  stressIndex?: number;
  alphaPower?: number;
  thetaPower?: number;
  entropy?: number;
}
