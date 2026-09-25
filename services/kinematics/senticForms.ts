export type SenticEmotion = 
    | 'NO_EMOTION' 
    | 'ANGER' 
    | 'HATE' 
    | 'GRIEF' 
    | 'LOVE' 
    | 'SEX' 
    | 'JOY' 
    | 'REVERENCE'
    | 'SERENITY'
    | 'COMPASSION'
    | 'INTEREST'
    | 'COURAGE'
    | 'AWE';
export type ComposerWarp = 'LINEAR' | 'BEETHOVEN' | 'MOZART' | 'HAYDN' | 'SCHUBERT' | 'CHOPIN' | 'BACH' | 'BRAHMS';

export interface ComposerMatrix {
    timeWarp: [number, number, number, number]; 
    ampWarp: [number, number, number, number];  
}

// Clynes' "Inner Pulse" data points, mapping the unique neuro-motor rhythm of historical composers.
export const COMPOSER_MATRICES: Record<ComposerWarp, ComposerMatrix> = {
    LINEAR: { timeWarp: [1.0, 1.0, 1.0, 1.0], ampWarp: [1.0, 1.0, 1.0, 1.0] },
    BEETHOVEN: { timeWarp: [1.06, 0.89, 0.96, 1.11], ampWarp: [1.0, 0.39, 0.83, 0.81] },
    MOZART: { timeWarp: [1.05, 0.95, 1.05, 0.95], ampWarp: [1.0, 0.21, 0.53, 0.23] },
    HAYDN: { timeWarp: [1.08, 0.94, 0.97, 1.02], ampWarp: [1.0, 0.42, 0.68, 1.02] },
    SCHUBERT: { timeWarp: [0.97, 1.14, 0.98, 0.90], ampWarp: [1.0, 0.65, 0.40, 0.75] },
    CHOPIN: { timeWarp: [1.12, 0.85, 1.08, 0.95], ampWarp: [1.0, 0.15, 0.85, 0.40] },
    BACH: { timeWarp: [1.01, 0.99, 1.02, 0.98], ampWarp: [1.0, 0.60, 0.85, 0.60] },
    BRAHMS: { timeWarp: [1.04, 0.90, 1.09, 0.97], ampWarp: [1.0, 0.45, 0.90, 0.55] }
};

const generateCurve = (generator: (t: number) => number, resolution = 1024): Float32Array => {
    const curve = new Float32Array(resolution);
    for (let i = 0; i < resolution; i++) {
        curve[i] = Math.max(0, Math.min(1.0, generator(i / resolution)));
    }
    return curve;
};

const genLinear = (t: number) => Math.sin(t * Math.PI);
const genAnger = (t: number) => t < 0.15 ? Math.pow(t / 0.15, 2) : Math.max(0, 1.0 - ((t - 0.15) / 0.25)); 
const genHate = (t: number) => t < 0.3 ? Math.pow(t / 0.3, 0.5) : t < 0.8 ? 1.0 : Math.max(0, 1.0 - ((t - 0.8) / 0.2)); 
const genGrief = (t: number) => t < 0.25 ? Math.pow(t / 0.25, 0.5) : Math.max(0, (1 - ((t - 0.25) / 0.4)) * Math.exp(-(t - 0.25) * 5)); 
const genLove = (t: number) => Math.pow(Math.sin(t * Math.PI), 1.4); 
const genSex = (t: number) => Math.max(0, Math.sin(t * Math.PI) - 0.25 * Math.sin(t * Math.PI * 3));
const genJoy = (t: number) => t < 0.2 ? Math.pow(t / 0.2, 0.7) : Math.max(0, Math.cos((t - 0.2) * Math.PI * 2.5) * Math.exp(-(t - 0.2) * 4)); 
const genReverence = (t: number) => Math.sin(t * Math.PI);

export interface SenticData {
    interval: number;       
    deviation: number;      
    directive: string;      
    curveLUT: Float32Array; 
    envelopeLUT: Float32Array;
    vibBaseRate: number;    
    vibModRate: number;     
    vibPitchCents: number;  
    tPeak: number;          
    envelopePower: number;  
}

const createSenticData = (
    interval: number,
    deviation: number,
    directive: string,
    gen: (t: number) => number,
    vibBaseRate: number,
    vibModRate: number,
    vibPitchCents: number,
    tPeak: number,
    envelopePower: number
): SenticData => {
    const curveLUT = generateCurve(gen);
    const envelopeLUT = new Float32Array(curveLUT.length);
    for (let i = 0; i < curveLUT.length; i++) {
        envelopeLUT[i] = Math.max(0, Math.min(1.0, Math.pow(curveLUT[i], envelopePower || 1.0)));
    }
    return {
        interval,
        deviation,
        directive,
        curveLUT,
        envelopeLUT,
        vibBaseRate,
        vibModRate,
        vibPitchCents,
        tPeak,
        envelopePower
    };
};

export const SENTIC_STATES: Record<SenticEmotion, SenticData> = {
    NO_EMOTION: createSenticData(10.0, 0.0, "Breathe naturally with the circle.", genLinear, 0, 0, 0, 0.5, 1.0),
    ANGER: createSenticData(4.8, 0.75, "Sharp, forceful spike outward.", genAnger, 6.5, 1.5, 25, 0.15, 0.5),
    HATE: createSenticData(5.3, 0.75, "Slow, grinding push. Hold the tension.", genHate, 5.0, -1.0, 15, 0.3, 1.2),
    GRIEF: createSenticData(8.2, 0.6, "Slow rise. Let the breath fall out passively.", genGrief, 4.0, -0.5, 8, 0.25, 0.8),
    LOVE: createSenticData(7.4, 0.5, "Smooth, deep, embracing pull inward.", genLove, 5.0, 1.0, 18, 0.5, 2.5),
    SEX: createSenticData(4.9, 0.75, "Deep swell, followed by a secondary surge.", genSex, 5.5, 2.0, 22, 0.65, 1.5),
    JOY: createSenticData(5.2, 0.75, "Light, upward burst. Rebound and float.", genJoy, 6.0, 0.5, 15, 0.2, 1.0),
    REVERENCE: createSenticData(9.8, 0.5, "Vast, extended expansion. Dissolve into space.", genReverence, 3.5, 0.5, 12, 0.5, 2.0),
    SERENITY: createSenticData(10.0, 0.4, "Tranquil stillness and harmonious rest.", genLinear, 3.0, 0.2, 10, 0.5, 2.0),
    COMPASSION: createSenticData(7.6, 0.45, "Heart-centered gentle warmth and care.", genLove, 4.8, 0.8, 16, 0.5, 2.2),
    INTEREST: createSenticData(6.0, 0.5, "Engaged attentiveness and curiosity.", genJoy, 5.5, 0.6, 14, 0.3, 1.2),
    COURAGE: createSenticData(5.5, 0.6, "Steady resolve and grounded presence.", genAnger, 5.0, 0.5, 18, 0.25, 0.8),
    AWE: createSenticData(9.5, 0.5, "Expansive wonder and open awareness.", genReverence, 3.8, 0.6, 14, 0.5, 2.2)
};

export const SENTIC_CYCLE_ORDER: SenticEmotion[] = ['NO_EMOTION', 'ANGER', 'HATE', 'GRIEF', 'LOVE', 'SEX', 'JOY', 'REVERENCE', 'SERENITY', 'COMPASSION', 'INTEREST', 'COURAGE', 'AWE'];

export const SENTIC_EMOTION_META: { id: SenticEmotion; name: string; tag: string; color: string }[] = [
    { id: 'NO_EMOTION', name: 'Natural', tag: 'Linear', color: '#94a3b8' },
    { id: 'LOVE', name: 'Love', tag: 'Anahata', color: '#f472b6' },
    { id: 'JOY', name: 'Joy', tag: 'Burst & Rebound', color: '#fbbf24' },
    { id: 'REVERENCE', name: 'Reverence', tag: 'Vast Expansion', color: '#c084fc' },
    { id: 'SERENITY', name: 'Serenity', tag: 'Tranquil Stillness', color: '#38bdf8' },
    { id: 'COMPASSION', name: 'Compassion', tag: 'Heart Warmth', color: '#ec4899' },
    { id: 'INTEREST', name: 'Interest', tag: 'Attentive Focus', color: '#10b981' },
    { id: 'COURAGE', name: 'Courage', tag: 'Grounded Resolve', color: '#f97316' },
    { id: 'AWE', name: 'Awe', tag: 'Expansive Wonder', color: '#8b5cf6' },
    { id: 'GRIEF', name: 'Grief', tag: 'Passive Release', color: '#60a5fa' },
    { id: 'ANGER', name: 'Anger', tag: 'Forceful Spike', color: '#ef4444' },
    { id: 'HATE', name: 'Hate', tag: 'Tension Hold', color: '#b91c1c' },
    { id: 'SEX', name: 'Eros', tag: 'Swell & Surge', color: '#e11d48' },
];

export const generateSenticSvgPath = (lut?: Float32Array, width = 120, height = 30): string => {
    if (!lut || lut.length === 0) return `M 0 ${height} L ${width} ${height}`;
    const steps = 30;
    const stepSize = Math.floor(lut.length / steps);
    let path = `M 0 ${(height - lut[0] * (height - 6) - 3).toFixed(1)}`;
    for (let i = 1; i <= steps; i++) {
        const idx = Math.min(lut.length - 1, i * stepSize);
        const x = ((i / steps) * width).toFixed(1);
        const y = (height - (lut[idx] * (height - 6)) - 3).toFixed(1);
        path += ` L ${x} ${y}`;
    }
    return path;
};

export const getQuasiRandomInterval = (state: SenticEmotion): number => {
    const data = SENTIC_STATES[state];
    const rand = (Math.random() + Math.random() + Math.random()) / 3; 
    const jitter = (rand * 2 - 1) * data.deviation; 
    return Math.max(1.0, data.interval + jitter); 
};

export const getEssenticRadius = (state: SenticEmotion, progressRatio: number): number => {
    if (progressRatio < 0 || progressRatio >= 1.0) return 0;
    const lut = SENTIC_STATES[state]?.curveLUT;
    if (!lut) return 0; 
    const index = Math.floor(progressRatio * 1023); 
    return lut[Math.min(1023, Math.max(0, index))];
};

export const getEssenticEnvelope = (state: SenticEmotion, progressRatio: number): number => {
    if (progressRatio < 0 || progressRatio >= 1.0) return 0;
    const lut = SENTIC_STATES[state]?.envelopeLUT;
    if (!lut) return 0;
    const index = Math.floor(progressRatio * 1023);
    return lut[Math.min(1023, Math.max(0, index))];
};