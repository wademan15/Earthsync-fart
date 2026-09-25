import { getActiveHarmonicColor } from '../../../../services/kinematics/color';

export type LatticeType = 'UNIVERSAL' | 'HEART';
export type TimeCrystalTopology = 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE';
export type ComposerWarp = 'LINEAR' | 'BEETHOVEN' | 'MOZART' | 'HAYDN' | 'SCHUBERT';

export interface HarmonicChannel {
  id: string; type: LatticeType; name: string; freq: number;
  multiplier?: number; binauralBeat?: number; defaultVol: number;
  noteLabel?: string; octave?: number;    
}

export interface FeedbackConfig { 
  sensitivity: number; 
  threshold: number; 
  depth: number; 
  isHarmonicBloom: boolean; 
  isAngelChord: boolean; 
  isCrystallize: boolean;
  pulseStyle?: string;
  pulseCustomColor?: string;
  pulseWaveform?: 'SINE' | 'STROBE' | 'TRIANGLE' | 'HEARTBEAT' | string;
  pulseDepth?: number;
  pulseSync?: 'BINAURAL' | 'TIME_CRYSTAL';
  syncWithTimeCrystal?: boolean;
  timeCrystalTopology?: TimeCrystalTopology;
  isUncoupled?: boolean;
  customRateHz?: number;
}

export type ToneTimbre = 'SINE' | 'ANALOG' | 'TRIANGLE' | 'WARM_PAD';

export type EntrainmentLayer = 'binaural' | 'isochronic' | 'monaural';

export interface ImmersionConfig { 
  pulseMode: 'BINAURAL' | 'ISOCHRONIC' | 'MONAURAL' | 'HYBRID';
  activeLayers?: EntrainmentLayer[];
  isTimeCrystal: boolean;
  timeCrystalTopology?: TimeCrystalTopology;
  composerWarp?: ComposerWarp;
  isPerfectFifth: boolean; 
  isPerfectFifthBreathSync?: boolean; 
  isFractalSync: boolean; 
  isPhoticStrobe: boolean; 
  isGoldenPanner?: boolean; 
  isCarrierDrift?: boolean; 
  strobeOpacity: number; 
  toneTimbre?: 'SINE' | 'ANALOG' | 'TRIANGLE' | 'WARM_PAD';
}

export interface AetherConfig { elasticity: number; viscosity: number; besselOrder: number; entrainmentTarget: number; isPureTone: boolean; isWander: boolean; separation: number; }

export const BASE_FREQ = 8.0; 
export const DEFAULT_IMMERSION_CONFIG: ImmersionConfig = { 
  pulseMode: 'BINAURAL', 
  activeLayers: ['binaural'],
  isTimeCrystal: false, 
  timeCrystalTopology: 'FIBONACCI',
  composerWarp: 'LINEAR',
  isPerfectFifth: false, 
  isFractalSync: false, 
  isPhoticStrobe: false, 
  isGoldenPanner: false, 
  isCarrierDrift: false, 
  strobeOpacity: 0.1,
  toneTimbre: 'SINE'
};
export const DEFAULT_AETHER_CONFIG: AetherConfig = { elasticity: 1.0, viscosity: 0.5, besselOrder: 4, entrainmentTarget: 8.0, isPureTone: false, isWander: true, separation: 0.8 };

// EXPANDED ENTRAINMENT MODES
export const ENTRAINMENT_MODES = [
    { name: 'Mayer Wave', freq: 0.1, desc: 'Heart-Brain Coherence' },
    { name: 'Cranial Stillpoint', freq: 0.155, desc: 'Golden Ratio Cascade' },
    { name: 'Sacral Pulse', freq: 0.25, desc: 'Golden Ratio Cascade' },
    { name: 'Deep Delta', freq: 0.39, desc: 'Golden Ratio Cascade' },
    { name: 'Epsilon', freq: 0.5, desc: 'Trance / Pain Relief' },
    { name: 'Implosion Delta', freq: 0.618, desc: 'Golden Ratio Cascade' },
    { name: 'Heart/Brain Sync', freq: 1.0, desc: 'Golden Ratio Cascade' },
    { name: 'Delta', freq: 1.5, desc: 'Deep Sleep / Healing' },
    { name: 'Phi Delta', freq: 1.618, desc: 'Golden Ratio Cascade' },
    { name: 'Phi Theta', freq: 2.618, desc: 'Golden Ratio Cascade' },
    { name: 'Deep Theta', freq: 4.0, desc: 'Astral / Trance' },
    { name: 'Shamanic Theta', freq: 4.5, desc: 'Dream State / Vision' },
    { name: 'Puharich Earth', freq: 6.66, desc: 'Puharich Tesla Resonance' },
    { name: 'Body Resonance', freq: 7.0, desc: 'Bentov Aorta Standing Wave' },
    { name: 'Schumann', freq: 7.83, desc: 'Earth Resonance' },
    { name: 'Universal', freq: 8.0, desc: 'Phi-Power Beat' },
    { name: 'ESP Strobe', freq: 9.0, desc: 'Hurkos Telepathy Peak' },
    { name: 'Pineal Pulse', freq: 9.6, desc: 'Third Eye Activation' },
    { name: 'Alpha', freq: 10.0, desc: 'Flow State' },
    { name: 'High Alpha', freq: 12.0, desc: 'Centering / Stability' },
    { name: 'Beta', freq: 14.0, desc: 'Active Focus' },
    { name: 'Awakened Mind', freq: 20.0, desc: 'High Energy / Peak Focus' },
    { name: 'Kundalini Spine', freq: 33.0, desc: 'Bentov Spinal Resonance' },
    { name: 'Gamma', freq: 40.0, desc: 'Insight / Binding' },
    { name: 'Hyper-Gamma', freq: 100.0, desc: 'Advanced Monk State' }
];

export const LATTICE_COLORS: Record<LatticeType, string> = { UNIVERSAL: '#f59e0b', HEART: '#fb7185' };
export const ARCHETYPE_GEOMETRY: Record<LatticeType, { n: number }> = { UNIVERSAL: { n: 12 }, HEART: { n: 1 } };

// HARMONIC COLOR WHEEL (Supports Dynamic Palettes with Merrick Default)
export const getMerrickColor = (freq: number): string => {
    return getActiveHarmonicColor(freq);
};

export const createChannel = (type: LatticeType, index: number, freq: number, beatDerivation: (f: number) => number, volCap: number, customName?: string, octave?: number): HarmonicChannel => ({ id: `${type}_${index}`, type, name: customName || `${type} MODE ${index + 1}`, freq, multiplier: freq / BASE_FREQ, binauralBeat: beatDerivation(freq), defaultVol: volCap, noteLabel: customName, octave: octave });

// 1. UNIVERSAL FREQUENCIES
export const UNIVERSAL_CHANNELS = [ 
    createChannel('UNIVERSAL', 0, 256.0, () => 8.0, 0.8, "Ground"), 
    createChannel('UNIVERSAL', 1, 384.0, () => 8.0, 0.8, "Fifth"), 
    createChannel('UNIVERSAL', 2, 432.0, () => 8.0, 0.8, "Water"), 
    createChannel('UNIVERSAL', 3, 528.0, () => 8.0, 0.8, "Life"), 
    createChannel('UNIVERSAL', 4, 963.0, () => 8.0, 0.8, "Source"), 
    createChannel('UNIVERSAL', 5, 512.0, () => 8.0, 0.8, "DNA"), 
    createChannel('UNIVERSAL', 6, 72.0, () => 8.0, 0.8, "Heal") 
];

// 2. MUSICAL KEYBOARD & HISTORICAL TEMPERAMENTS
export type TuningTemperament = 
    | '12TET' 
    | 'WERCKMEISTER_III' 
    | 'KIRNBERGER_III' 
    | 'VALLOTTI' 
    | 'JUST_INTONATION' 
    | 'PYTHAGOREAN' 
    | 'MEANTONE_QUARTER' 
    | 'SOLFEGGIO_HARMONIC'
    | 'RAST_NEUTRAL_3RD';

export interface TemperamentInfo {
    id: TuningTemperament;
    name: string;
    shortName: string;
    description: string;
    era: string;
}

export const TEMPERAMENTS: TemperamentInfo[] = [
    {
        id: '12TET',
        name: '12-Tone Equal Temperament',
        shortName: 'Equal (12-TET)',
        description: 'Modern standard logarithmic 12-interval division where every semitone is exactly 100 cents (2^(1/12)).',
        era: 'Modern Standard'
    },
    {
        id: 'WERCKMEISTER_III',
        name: 'Werckmeister III (Well-Tempered)',
        shortName: 'Werckmeister III',
        description: 'Historic circular well-temperament (1691) with 4 tempered fifths (C-G, G-D, D-A, B-F#) and 8 pure fifths, inspiring Bach’s Well-Tempered Clavier.',
        era: 'High Baroque (1691)'
    },
    {
        id: 'KIRNBERGER_III',
        name: 'Kirnberger III (Well-Tempered)',
        shortName: 'Kirnberger III',
        description: 'Johann Philipp Kirnberger (1779) well-temperament combining a pure C-E major third with four split 1/4-comma fifths and pure remaining fifths.',
        era: 'Late Baroque (1779)'
    },
    {
        id: 'VALLOTTI',
        name: 'Vallotti (Well-Tempered)',
        shortName: 'Vallotti',
        description: 'Francesco Antonio Vallotti (1779) well-temperament with 6 fifths tempered by 1/6 Pythagorean comma (F-C-G-D-A-E-B) and 6 pure fifths.',
        era: 'Classical / Baroque (1779)'
    },
    {
        id: 'JUST_INTONATION',
        name: 'Just Intonation (5-Limit Pure)',
        shortName: 'Just Intonation',
        description: 'Harmonic rational frequency ratios (3:2 fifths, 5:4 major thirds, 6:5 minor thirds) with absolute zero acoustic beating on tonic triads.',
        era: 'Ancient / Pure Harmonic'
    },
    {
        id: 'PYTHAGOREAN',
        name: 'Pythagorean Tuning (3-Limit)',
        shortName: 'Pythagorean (3-Limit)',
        description: 'Sacred geometry tuning built exclusively on pure 3:2 fifths stacked across the circle, yielding pure fifths and wide major thirds (81:64).',
        era: 'Ancient Greece (500 BCE)'
    },
    {
        id: 'MEANTONE_QUARTER',
        name: 'Quarter-Comma Meantone',
        shortName: '1/4-Comma Meantone',
        description: 'Renaissance tuning (Pietro Aaron, 1523) where fifths are narrowed by 1/4 syntonic comma to produce acoustically pure major thirds.',
        era: 'Renaissance (1523)'
    },
    {
        id: 'SOLFEGGIO_HARMONIC',
        name: 'Solfeggio Harmonic Matrix',
        shortName: 'Solfeggio Harmonic',
        description: 'Harmonic matrix aligned with the ancient Solfeggio fundamental frequencies (396, 417, 528, 639, 741, 852 Hz) scaled into standard keyboard geometry.',
        era: 'Vedic / Gregorian Matrix'
    },
    {
        id: 'RAST_NEUTRAL_3RD',
        name: 'Maqam Rast (Neutral Third ~350¢)',
        shortName: 'Neutral 3rd / Rast',
        description: 'Ancient microtonal scale featuring the 350-cent neutral third ("zalzal" / contemplative blue interval) centered perfectly between major and minor.',
        era: 'Ancient Middle Eastern / Maqam'
    }
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const TEMPERAMENT_CENTS: Record<string, number[]> = {
    '12TET': [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
    'WERCKMEISTER_III': [0, 90.0, 192.0, 294.0, 390.0, 498.0, 588.0, 696.0, 792.0, 888.0, 996.0, 1092.0],
    'KIRNBERGER_III': [0, 90.225, 193.157, 294.135, 386.314, 498.045, 590.224, 696.578, 792.180, 889.735, 996.090, 1088.269],
    'VALLOTTI': [0, 94.135, 196.090, 298.045, 392.180, 501.955, 590.224, 698.045, 794.135, 894.135, 998.045, 1090.224],
    'MEANTONE_QUARTER': [0, 76.049, 193.157, 310.265, 386.314, 503.422, 579.471, 696.578, 772.627, 889.735, 1006.843, 1082.892],
    'RAST_NEUTRAL_3RD': [0, 100.0, 200.0, 350.0, 400.0, 500.0, 600.0, 700.0, 800.0, 900.0, 1050.0, 1100.0]
};

export const TEMPERAMENT_RATIOS: Record<string, number[]> = {
    'JUST_INTONATION': [1.0, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8],
    'PYTHAGOREAN': [1.0, 2187/2048, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128],
    'SOLFEGGIO_HARMONIC': [1.0, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 16/9, 15/8]
};

export const calculateMusicalScaleFreqs = (baseA4: number = 440.0, temperament: TuningTemperament = '12TET', startOctave: number = 3, numOctaves: number = 3): { note: string, octave: number, freq: number, id: string }[] => {
    const results: { note: string, octave: number, freq: number, id: string }[] = [];
    let c4Freq: number;
    
    if (TEMPERAMENT_CENTS[temperament]) {
        const cents = TEMPERAMENT_CENTS[temperament];
        const aCents = cents[9]; // A is index 9
        c4Freq = baseA4 / Math.pow(2.0, aCents / 1200.0);
        
        for (let p = 0; p < numOctaves; p++) {
            const octave = startOctave + p;
            const octaveFactor = Math.pow(2.0, octave - 4);
            for (let m = 0; m < 12; m++) {
                const noteFreq = c4Freq * Math.pow(2.0, cents[m] / 1200.0) * octaveFactor;
                const idx = p * 12 + m;
                results.push({
                    note: `${NOTE_NAMES[m]}${octave}`,
                    octave,
                    freq: noteFreq,
                    id: `UNIVERSAL_${800 + idx}`
                });
            }
        }
    } else {
        const ratios = TEMPERAMENT_RATIOS[temperament] || TEMPERAMENT_RATIOS['JUST_INTONATION'];
        const aRatio = ratios[9];
        c4Freq = baseA4 / aRatio;
        
        for (let p = 0; p < numOctaves; p++) {
            const octave = startOctave + p;
            const octaveFactor = Math.pow(2.0, octave - 4);
            for (let m = 0; m < 12; m++) {
                const noteFreq = c4Freq * ratios[m] * octaveFactor;
                const idx = p * 12 + m;
                results.push({
                    note: `${NOTE_NAMES[m]}${octave}`,
                    octave,
                    freq: noteFreq,
                    id: `UNIVERSAL_${800 + idx}`
                });
            }
        }
    }
    
    return results;
};

export const generateMusicalScale = (baseA4: number = 440.0, temperament: TuningTemperament = '12TET'): HarmonicChannel[] => {
    const list = calculateMusicalScaleFreqs(baseA4, temperament, 3, 3);
    return list.map((item, idx) => 
        createChannel(
            'UNIVERSAL',
            800 + idx,
            item.freq,
            () => 8.0,
            0.8,
            item.note,
            item.octave
        )
    );
};

export const MUSIC_SCALE_CHANNELS = generateMusicalScale(440.0, '12TET');

// 3. G&M SCALE (January 2026: Compton Wavelength Derivation)
// Eliminates Planck's constant (h), rooting the acoustic code purely in rest mass energy.
// Formula: E_n = a * m * c^2 * (2^q * 3^m)
const generateGMScale = (): HarmonicChannel[] => {
    const M_E = 9.1093837e-31;     // Electron rest mass (kg)
    const C = 299792458;           // Speed of light (m/s)
    const E_REST = M_E * (C * C);  // Core rest energy of the particle (Joules)
    
    // Coupling constant 'a' derived from the 12 invariants of the GM-scale.
    // Normalizes the deterministic quantum rest energy into the biological acoustic range.
    const A_COUPLING = 3.126e15; 
    
    // Pythagorean 3-limit Just Intonation ratios (2^q * 3^m)
    // Used instead of 12-TET equal temperament to ensure phase coherence.
    const GM_QUANTIZATION = [
        Math.pow(2, 0) * Math.pow(3, 0),    // C (1/1)
        Math.pow(2, 8) * Math.pow(3, -5),   // C# (256/243)
        Math.pow(2, -3) * Math.pow(3, 2),   // D (9/8)
        Math.pow(2, 5) * Math.pow(3, -3),   // D# (32/27)
        Math.pow(2, -6) * Math.pow(3, 4),   // E (81/64)
        Math.pow(2, 2) * Math.pow(3, -1),   // F (4/3)
        Math.pow(2, 10) * Math.pow(3, -6),  // F# (1024/729)
        Math.pow(2, -1) * Math.pow(3, 1),   // G (3/2)
        Math.pow(2, 7) * Math.pow(3, -4),   // G# (128/81)
        Math.pow(2, -4) * Math.pow(3, 3),   // A (27/16)
        Math.pow(2, 4) * Math.pow(3, -2),   // A# (16/9)
        Math.pow(2, -7) * Math.pow(3, 5)    // B (243/128)
    ];
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const channels: HarmonicChannel[] = [];
    let index = 100;
    
    // Map spanning octaves 3 to 5 (p = 0 to 2)
    for (let p = 0; p <= 2; p++) {
        const octave = p + 3; 
        
        for (let m = 0; m < 12; m++) {
            // Frequency = a * mc^2 * (2^q * 3^m) * 2^p
            const quantizationFactor = GM_QUANTIZATION[m] * Math.pow(2, p);
            const freq = A_COUPLING * E_REST * quantizationFactor;
            
            channels.push(createChannel(
                'UNIVERSAL', 
                index++, 
                freq, 
                () => 8.0, 
                0.8, 
                `${noteNames[m]}${octave}`, 
                octave
            ));
        }
    }
    return channels;
};
export const GM_SCALE_CHANNELS = generateGMScale();

// 3. BENTOV ARRAY (Bio-Resonant)
export const BENTOV_CHANNELS = [
    createChannel('UNIVERSAL', 200, 112.0, () => 7.0, 0.8, "Body Res"), 
    createChannel('UNIVERSAL', 201, 125.28, () => 7.83, 0.8, "Earth"),   
    createChannel('UNIVERSAL', 202, 132.0, () => 8.0, 0.8, "Spine"),     
    createChannel('UNIVERSAL', 203, 110.0, () => 8.0, 0.8, "Cave"),      
    createChannel('UNIVERSAL', 204, 256.0, () => 8.0, 0.8, "Heart"),     
];

// 4. PUHARICH ARRAY (ESP / Nuclear Resonance)
export const PUHARICH_CHANNELS = [
    createChannel('UNIVERSAL', 300, 128.0, () => 4.0, 0.8, "Shaman"),    
    createChannel('UNIVERSAL', 301, 106.56, () => 6.66, 0.8, "Earth"),   
    createChannel('UNIVERSAL', 302, 128.0, () => 8.0, 0.8, "Phonon"),    
    createChannel('UNIVERSAL', 303, 144.0, () => 9.0, 0.8, "Telepathy"), 
    createChannel('UNIVERSAL', 304, 360.0, () => 8.0, 0.8, "Nerve"),     
];

// 5. DAN WINTER ARRAY (Phase Conjugate Implosion)
// Based on Golden Ratio (Phi) exponents. Carriers shifted up to audible octaves.
const PHI = 1.618033988749895;
export const WINTER_CHANNELS = [
    createChannel('UNIVERSAL', 400, Math.pow(PHI, 4) * 32, () => Math.pow(PHI, 4), 0.8, "Phi^4 Alpha"), 
    createChannel('UNIVERSAL', 401, Math.pow(PHI, 5) * 16, () => Math.pow(PHI, 5), 0.8, "Phi^5 Hi-Alpha"), 
    createChannel('UNIVERSAL', 402, Math.pow(PHI, 6) * 8, () => Math.pow(PHI, 6), 0.8, "Phi^6 Beta"),    
    createChannel('UNIVERSAL', 403, Math.pow(PHI, 7) * 4, () => Math.pow(PHI, 7), 0.8, "Phi^7 Gamma"),   
    createChannel('UNIVERSAL', 404, Math.pow(PHI, 8) * 4, () => Math.pow(PHI, 8), 0.8, "Phi^8 Hi-Gamma") 
];

// 6. RICHARD MERRICK ARRAY (Interference & Damping Wells)
// Harmonic Series intersecting with Fibonacci Series (Just Intonation based on C=256)
export const MERRICK_CHANNELS = [
    createChannel('UNIVERSAL', 500, 256.0 * (1/1), () => 8.0, 0.8, "Root 1:1"), 
    createChannel('UNIVERSAL', 501, 256.0 * (3/2), () => 8.0, 0.8, "Perf 5th 3:2"), 
    createChannel('UNIVERSAL', 502, 256.0 * (5/3), () => 8.0, 0.8, "Maj 6th 5:3"), 
    createChannel('UNIVERSAL', 503, 256.0 * (8/5), () => 8.0, 0.8, "Gold 6th 8:5"), 
    createChannel('UNIVERSAL', 504, 256.0 * (13/8), () => 8.0, 0.8, "Fibonacci 13:8"), 
];

// 7. MANFRED CLYNES ARRAY (Sentic States)
// Biological frequency signatures tied to precise emotional actuation
export const CLYNES_CHANNELS = [
    createChannel('UNIVERSAL', 600, 150.0, () => 4.0, 0.8, "Reverence"), // Deep, slow, expansive (Theta)
    createChannel('UNIVERSAL', 601, 200.0, () => 10.0, 0.8, "Love"),     // Smooth, rounded (Alpha)
    createChannel('UNIVERSAL', 602, 300.0, () => 14.0, 0.8, "Joy"),      // Bouncy, light (Beta)
    createChannel('UNIVERSAL', 603, 100.0, () => 1.5, 0.8, "Grief"),     // Heavy, dragging (Delta)
];

// 8. CUSTOM USER ARRAY (User-defined frequencies)
export const DEFAULT_CUSTOM_CHANNELS: HarmonicChannel[] = [
    createChannel('UNIVERSAL', 700, 111.0, () => 8.0, 0.8, "Cellular (111Hz)"),
    createChannel('UNIVERSAL', 701, 222.0, () => 8.0, 0.8, "Balance (222Hz)"),
    createChannel('UNIVERSAL', 702, 333.0, () => 8.0, 0.8, "Clarity (333Hz)"),
    createChannel('UNIVERSAL', 703, 432.0, () => 8.0, 0.8, "Verdi (432Hz)"),
    createChannel('UNIVERSAL', 704, 528.0, () => 8.0, 0.8, "Miracle (528Hz)"),
    createChannel('UNIVERSAL', 705, 639.0, () => 8.0, 0.8, "Heart (639Hz)"),
    createChannel('UNIVERSAL', 706, 741.0, () => 8.0, 0.8, "Awaken (741Hz)"),
    createChannel('UNIVERSAL', 707, 852.0, () => 8.0, 0.8, "Spirit (852Hz)"),
];

export const ALL_CUSTOM_SLOT_CHANNELS: HarmonicChannel[] = Array.from({ length: 16 }, (_, i) => 
    createChannel('UNIVERSAL', 700 + i, DEFAULT_CUSTOM_CHANNELS[i]?.freq || (100.0 * (i + 1)), () => 8.0, 0.8, DEFAULT_CUSTOM_CHANNELS[i]?.name || `Custom ${i + 1}`)
);

// 9. THE KNOB (Continuous Live Rotary Frequency Selector)
export const KNOB_CHANNEL: HarmonicChannel = createChannel('UNIVERSAL', 799, 432.0, () => 8.0, 0.9, "The Knob (432Hz)");
export const KNOB_CHANNELS: HarmonicChannel[] = [KNOB_CHANNEL];

export type PresetType = 'UNIVERSAL' | 'MUSIC_SCALE' | 'GM_SCALE' | 'BENTOV' | 'PUHARICH' | 'WINTER' | 'MERRICK' | 'CLYNES' | 'KNOB' | 'CUSTOM';

export interface Preset {
    id: PresetType;
    name: string;
    description: string;
    channels: HarmonicChannel[];
}

// THE MASTER PRESET LIBRARY
export const PRESETS: Preset[] = [
    { id: 'KNOB', name: 'The Knob', description: 'Turn to select frequency — continuous live dial for acoustic & visualizer exploration', channels: KNOB_CHANNELS },
    { id: 'MUSIC_SCALE', name: 'Musical Keyboard', description: 'Chromatic keyboard with selectable concert pitch (432Hz, 440Hz, 415Hz, 528Hz) & historical temperaments (Equal, Well-Tempered, Just Intonation, Pythagorean, Meantone)', channels: MUSIC_SCALE_CHANNELS },
    { id: 'UNIVERSAL', name: 'Universal', description: 'Core grounding and healing frequencies', channels: UNIVERSAL_CHANNELS },
    { id: 'CUSTOM', name: 'Custom (User)', description: 'User-defined custom frequency array', channels: DEFAULT_CUSTOM_CHANNELS },
    { id: 'GM_SCALE', name: 'G & M (Compton)', description: 'Jan 2026 True Matter Wavelength Derivation', channels: GM_SCALE_CHANNELS },
    { id: 'BENTOV', name: 'Bentov', description: 'Bio-resonant frequencies of the human body', channels: BENTOV_CHANNELS },
    { id: 'PUHARICH', name: 'Puharich', description: 'Nuclear ESP, Shamanic Trance, and Nerve Resonance', channels: PUHARICH_CHANNELS },
    { id: 'WINTER', name: 'Winter (Fractal)', description: 'Golden Ratio Phase Conjugation and Implosion', channels: WINTER_CHANNELS },
    { id: 'MERRICK', name: 'Merrick (Matrix)', description: 'Fibonacci Damping Wells and Pure Harmonics', channels: MERRICK_CHANNELS },
    { id: 'CLYNES', name: 'Clynes (Sentics)', description: 'Biological Signatures of Pure Emotion', channels: CLYNES_CHANNELS }
];

export const HEART_CHANNELS: HarmonicChannel[] = [
    { id: `HEART_KICK`, type: 'HEART', name: 'CARDIAC KICK DRUM', freq: 50.0, defaultVol: 0.8 },
    { id: `HEART_HARMONIC_0`, type: 'HEART', name: 'Sub-Harmonic (0.5x)', freq: 0.5, defaultVol: 0.5 },
    { id: `HEART_HARMONIC_1`, type: 'HEART', name: 'Fundamental (1.0x)', freq: 1.0, defaultVol: 0.8 },
    { id: `HEART_HARMONIC_2`, type: 'HEART', name: '2nd Harmonic (2.0x)', freq: 2.0, defaultVol: 0.6 },
    { id: `HEART_HARMONIC_3`, type: 'HEART', name: '3rd Harmonic (3.0x)', freq: 3.0, defaultVol: 0.4 },
    { id: `HEART_HARMONIC_4`, type: 'HEART', name: '4th Harmonic (4.0x)', freq: 4.0, defaultVol: 0.2 }
];

// 10. CHORD PROGRESSION VOICES (Polyphonic Voice Leading & Portamento Array)
export const CHORD_VOICE_CHANNELS: HarmonicChannel[] = Array.from({ length: 8 }, (_, i) => 
    createChannel('UNIVERSAL', 840 + i, 261.63, () => 8.0, 0.8, `Chord Voice ${i + 1}`)
);

export const LATTICE_CHANNELS = [...UNIVERSAL_CHANNELS, ...MUSIC_SCALE_CHANNELS, ...CHORD_VOICE_CHANNELS, ...GM_SCALE_CHANNELS, ...BENTOV_CHANNELS, ...PUHARICH_CHANNELS, ...WINTER_CHANNELS, ...MERRICK_CHANNELS, ...CLYNES_CHANNELS, ...ALL_CUSTOM_SLOT_CHANNELS, KNOB_CHANNEL];
export const ALL_CHANNELS = [...LATTICE_CHANNELS];

export const HEART_HARMONIC_DEFS = [ { label: 'Sub-Harmonic (0.5x)', mult: 0.5 }, { label: 'Fundamental (1.0x)', mult: 1.0 }, { label: '2nd Harmonic (2.0x)', mult: 2.0 }, { label: '3rd Harmonic (3.0x)', mult: 3.0 }, { label: '4th Harmonic (4.0x)', mult: 4.0 } ];

export const safe = (n: number) => Number.isFinite(n) ? n : 0;

export const getHarmonicGeometry = (channel: HarmonicChannel): { n: number, kScale: number } => {
    let n = 12; let kScale = 1.0;
    if (channel.freq > 60) { kScale = 0.25; if (channel.freq > 500) kScale = 0.125; }
    if (channel.type === 'UNIVERSAL') { 
        const index = parseInt(channel.id.split('_')[1] || '0'); 
        const map = [4, 6, 8, 5, 12, 16, 24]; 
        n = map[index % map.length]; 
    } else if (channel.type === 'HEART') { 
        n = 1; 
    }
    return { n, kScale };
};