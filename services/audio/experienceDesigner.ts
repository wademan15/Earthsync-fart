import { TuningTemperament, calculateMusicalScaleFreqs } from '../../components/modules/visuals/shared';
import { ChordDef, getChordFrequencies } from './chordProgressions';
import { EntrainmentLayer } from './AudioTypes';
import { SenticEmotion } from '../kinematics/senticForms';
import { STARTER_LONG_FORM_EXPERIENCES } from './experiencePresets';

export type BreathPhase = 'INHALE' | 'HOLD_IN' | 'EXHALE' | 'HOLD_OUT' | 'FREE_FLOW';
export type SoundSourceType = 'CHORD' | 'PURE_TONE' | 'TONE_STACK';

export interface BlockBreathPattern {
    mode?: 'PACED' | 'FREE_FLOW'; // Controlled cyclic breathing vs unguided ambient flow
    inhale: number;               // Inhale duration in seconds (e.g. 4.0)
    holdIn: number;               // Apex hold duration in seconds (e.g. 2.0 or 7.0)
    exhale: number;               // Exhale duration in seconds (e.g. 6.0 or 8.0)
    holdOut: number;              // Low rest duration in seconds (e.g. 2.0 or 0.0)
    cycles?: number;              // Number of breath loops in this block (e.g. 4, 8, 10). If provided, durationSeconds = (inhale+holdIn+exhale+holdOut)*cycles
    label?: string;               // e.g. "Box 4-4-4-4", "4-7-8 Relax", "Coherent 5.5s"
}

export interface BlockEntrainmentConfig {
    enabled?: boolean;
    frequencyHz?: number;          // Target brainwave frequency (e.g. 0.01 - 100 Hz)
    layers?: EntrainmentLayer[];   // ['binaural', 'isochronic', 'monaural']
}

export interface BlockSenticConfig {
    enabled?: boolean;
    emotion?: SenticEmotion;       // 'LOVE', 'JOY', 'REVERENCE', etc.
    intensity?: number;            // 0.0 - 1.0 (vibrato/modulation depth)
    tideAM?: boolean;
    tideFM?: boolean;
}

export interface BlockHeartConfig {
    enabled?: boolean;
    syncMode?: 'BREATH' | 'BREATH_COUNT' | 'STEADY' | 'BINAURAL';
    bpm?: number;
    volume?: number;
    kickEnabled?: boolean;
    doubleBeat?: boolean;
    baseFreq?: number;
    lpfCutoff?: number;
}

export interface BlockMatrixConfig {
    enabled?: boolean;
    composerWarp?: string;         // 'LINEAR', 'BEETHOVEN', 'MOZART', etc.
    composerIntensity?: number;
}

export interface BlockCrystalConfig {
    enabled?: boolean;
    isTimeCrystal?: boolean;
    topology?: 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE';
}

export interface BlockPulseConfig {
    enabled?: boolean;
    pulseStyle?: string;           // 'BLACK_SHUTTER', 'WHITE_BLOOM', 'CYAN_AURA', etc.
    pulseCustomColor?: string;
    pulseWaveform?: string;        // 'SINE', 'STROBE', 'TRIANGLE', 'HEARTBEAT'
    depth?: number;
    pulseSync?: 'BINAURAL' | 'TIME_CRYSTAL';
    syncWithTimeCrystal?: boolean;
    timeCrystalTopology?: 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE';
    isUncoupled?: boolean;
    customRateHz?: number;
}

export interface BlockBreathConfig {
    enabled?: boolean;
    pattern?: BlockBreathPattern;  // Embedded breath cycle pattern (Inhale / Apex / Exhale / Rest)
    noiseType?: string;            // 'OCEAN', 'RAIN', 'STREAM', 'WIND', 'FIRE', 'FOREST', 'CAVE', 'VINYL', 'DRONE', 'WHITE', 'PINK', 'BROWN', 'SILENCE'
    noiseVolume?: number;          // 0 to 1
    entrainTide?: boolean;
    tideEntrainMode?: 'ISOCHRONIC' | 'BINAURAL' | 'MONAURAL';
    tideEntrainDepth?: number;
    cueTone?: string;              // 'NONE', 'SINE_BELL', 'TIBETAN', 'PIANO', 'HARP', 'WOOD', 'WATER', 'SHAKER', 'CELLO', 'SYNTH', 'OM', 'GONG', 'TRIANGLE'
    cueVolume?: number;
    cueOctave?: number;
    cueDecay?: number;
    visualMode?: string;           // 'RING', 'HORIZON', 'VIGNETTE', 'GLOW', 'DOT', 'CHEVRON', 'NONE'
    colorScheme?: string;          // 'CYAN_OCEAN', 'CHAKRA_RAINBOW', etc.
    customColor?: string;
}

export interface ExperienceBlock {
    id: string;
    label?: string;
    soundType: SoundSourceType;
    
    // Musical Chord
    chord?: {
        name: string;
        root: string;
        type: string;
        octave: number;
        customNotes?: string[];
    };
    
    // Single Pure Tone (Hz)
    pureToneHz?: number;
    
    // Stacked Pure Tones (Hz Array)
    toneStack?: number[];
    
    // Breath & Kinetic Timing
    breathPhase: BreathPhase;
    durationSeconds: number; // Length in seconds
    glideSeconds?: number;   // Transition portamento/crossfade
    description?: string;

    // Sub-Breath Pattern (Inhale / Apex Hold / Exhale / Low Rest + Loops)
    breathPattern?: BlockBreathPattern;

    // Multi-sensory phase customizations (optional accordions)
    breath?: BlockBreathConfig;
    entrainment?: BlockEntrainmentConfig;
    sentics?: BlockSenticConfig;
    heart?: BlockHeartConfig;
    matrix?: BlockMatrixConfig;
    crystal?: BlockCrystalConfig;
    pulse?: BlockPulseConfig;
}

export interface ExperienceDef {
    id: string;
    name: string;
    description: string;
    category?: string;
    pitchRef: number;
    temperament: TuningTemperament;
    loopMode: 'CONTINUOUS' | 'CYCLE_COUNT';
    targetCycles: number;
    blocks: ExperienceBlock[];
    createdAt?: number;
    updatedAt?: number;
}

// --- CURATED FREQUENCY PRESETS & QUICK PICKERS ---

export interface FrequencyPreset {
    name: string;
    freq: number;
    category: 'SOLFEGGIO' | 'PLANETARY' | 'SCHUMANN' | 'SACRED_HARMONIC';
    description: string;
}

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
    // Solfeggio
    { name: '174 Hz Foundation', freq: 174.0, category: 'SOLFEGGIO', description: 'Pain relief, physical security, deep grounding' },
    { name: '285 Hz Quantum Restructure', freq: 285.0, category: 'SOLFEGGIO', description: 'Tissue regeneration, energetic blueprint healing' },
    { name: '396 Hz Root / Liberation', freq: 396.0, category: 'SOLFEGGIO', description: 'Releasing fear, guilt, and emotional blockages' },
    { name: '417 Hz Sacral / Undoing', freq: 417.0, category: 'SOLFEGGIO', description: 'Facilitating change, clearing stagnant patterns' },
    { name: '528 Hz Solar / Transformation', freq: 528.0, category: 'SOLFEGGIO', description: 'Miracle tone, DNA coherence, deep peace' },
    { name: '639 Hz Heart / Connection', freq: 639.0, category: 'SOLFEGGIO', description: 'Interpersonal harmony, empathy, heart resonance' },
    { name: '741 Hz Throat / Awakening', freq: 741.0, category: 'SOLFEGGIO', description: 'Intuition, clean expression, cellular detox' },
    { name: '852 Hz Third Eye / Order', freq: 852.0, category: 'SOLFEGGIO', description: 'Spiritual clarity, pure inner vision' },
    { name: '963 Hz Crown / Unity', freq: 963.0, category: 'SOLFEGGIO', description: 'Crown chakra activation, pure consciousness' },
    
    // Planetary (Hans Cousto)
    { name: '136.10 Hz Earth Year (Om)', freq: 136.10, category: 'PLANETARY', description: 'Cosmic Om, anahata heart center, calming serenity' },
    { name: '126.22 Hz Sun', freq: 126.22, category: 'PLANETARY', description: 'Vitality, radiant energy, solar plexus warmth' },
    { name: '194.18 Hz Earth Day (G)', freq: 194.18, category: 'PLANETARY', description: 'Physical grounding, biological circadian rhythm' },
    { name: '210.42 Hz Synodic Moon', freq: 210.42, category: 'PLANETARY', description: 'Fluidity, emotional openness, sacral sensuality' },
    { name: '221.23 Hz Venus (A)', freq: 221.23, category: 'PLANETARY', description: 'Higher harmony, aesthetic balance, unconditional love' },
    { name: '141.27 Hz Mercury (C#)', freq: 141.27, category: 'PLANETARY', description: 'Mental clarity, linguistic flow, cognitive speed' },
    { name: '144.72 Hz Mars (D)', freq: 144.72, category: 'PLANETARY', description: 'Willpower, focused motivation, muscular energy' },
    { name: '183.58 Hz Jupiter (F#)', freq: 183.58, category: 'PLANETARY', description: 'Expansion, abundance, optimistic horizons' },

    // Schumann Auditory Harmonics (7.83Hz Fundamental scaled up octaves)
    { name: '125.28 Hz Schumann 16th Octave', freq: 125.28, category: 'SCHUMANN', description: 'Audible carrier for natural atmospheric resonance' },
    { name: '250.56 Hz Schumann 32nd Octave', freq: 250.56, category: 'SCHUMANN', description: 'Mid-register atmospheric harmonic alignment' },

    // Sacred Harmonics
    { name: '108.00 Hz Sacred Yantra', freq: 108.0, category: 'SACRED_HARMONIC', description: 'Universal sacred count, rhythmic fundamental' },
    { name: '216.00 Hz Sub-Harmonic 432', freq: 216.0, category: 'SACRED_HARMONIC', description: 'First sub-octave of 432Hz verdian tuning' },
    { name: '432.00 Hz Verdian Standard', freq: 432.0, category: 'SACRED_HARMONIC', description: 'Pythagorean natural frequency, golden ratio geometry' }
];

// --- NOTE AND FREQUENCY UTILITIES ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function freqToPitchInfo(freq: number, pitchRef: number = 432.0): {
    note: string;
    octave: number;
    cents: number;
    exactHz: number;
    label: string;
} {
    if (freq <= 0 || !isFinite(freq)) {
        return { note: 'C', octave: 4, cents: 0, exactHz: 0, label: '0 Hz' };
    }
    // A4 = pitchRef (default 432Hz or 440Hz)
    // midi note for pitchRef is 69 (A4)
    const midi = 69 + 12 * Math.log2(freq / pitchRef);
    const roundedMidi = Math.round(midi);
    const noteIndex = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    const cents = Math.round((midi - roundedMidi) * 100);
    const note = NOTE_NAMES[noteIndex];
    const centsSign = cents > 0 ? `+${cents}c` : cents < 0 ? `${cents}c` : '±0c';
    return {
        note,
        octave,
        cents,
        exactHz: Math.round(freq * 100) / 100,
        label: `${note}${octave} (${centsSign})`
    };
}

export function parseFrequencyList(input: string): number[] {
    return input
        .split(/[\s,;+]+/)
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n) && n > 15 && n < 8000)
        .slice(0, 8); // Up to 8 simultaneous voice channels
}

export function resolveBlockFrequencies(
    block: ExperienceBlock,
    pitchRef: number = 432.0,
    temperament: TuningTemperament = 'JUST_INTONATION',
    octaveShift: number = 0
): {
    frequencies: number[];
    labels: string[];
    primaryLabel: string;
    secondaryInfo: string;
} {
    if (block.soundType === 'CHORD' && block.chord) {
        if (block.chord.customNotes && block.chord.customNotes.length > 0) {
            const scale = calculateMusicalScaleFreqs(pitchRef, temperament, 1, 9);
            const freqs: number[] = [];
            const labels: string[] = [];
            for (const noteStr of block.chord.customNotes) {
                const normalized = noteStr.trim();
                const found = scale.find(s => s.note === normalized || s.note === normalized.replace('♯', '#') || s.note.replace('#', '♯') === normalized);
                if (found) {
                    freqs.push(found.freq);
                    labels.push(`${found.note}: ${found.freq.toFixed(1)}Hz`);
                }
            }
            if (freqs.length > 0) {
                return {
                    frequencies: freqs.slice(0, 8),
                    labels: labels.slice(0, 8),
                    primaryLabel: block.chord.name || 'Custom Voicing',
                    secondaryInfo: `${freqs.length} Selected Notes · ${temperament.replace(/_/g, ' ')}`
                };
            }
        }

        const chordDef: ChordDef = {
            name: block.chord.name || `${block.chord.root}${block.chord.type}`,
            root: block.chord.root,
            type: block.chord.type,
            octave: block.chord.octave ?? 3
        };
        const resolved = getChordFrequencies(chordDef, pitchRef, temperament, octaveShift);
        const freqs = (resolved && Array.isArray(resolved.notes))
            ? resolved.notes.map(n => n.freq).slice(0, 8)
            : [pitchRef];
        const labels = (resolved && Array.isArray(resolved.notes))
            ? resolved.notes.slice(0, 8).map(n => `${n.note}${n.octave}: ${n.freq.toFixed(1)}Hz`)
            : [`${pitchRef.toFixed(1)}Hz`];
        return {
            frequencies: freqs,
            labels,
            primaryLabel: chordDef.name,
            secondaryInfo: `${freqs.length} Voices · ${temperament.replace(/_/g, ' ')}`
        };
    }

    if (block.soundType === 'PURE_TONE') {
        const hz = block.pureToneHz || 432.0;
        const info = freqToPitchInfo(hz, pitchRef);
        return {
            frequencies: [hz],
            labels: [`${info.note}${info.octave} · ${hz.toFixed(1)} Hz (${info.cents > 0 ? '+' : ''}${info.cents}c)`],
            primaryLabel: `${hz.toFixed(1)} Hz Pure Tone`,
            secondaryInfo: `${info.note}${info.octave} Resonant Sine`
        };
    }

    if (block.soundType === 'TONE_STACK') {
        const stack = (block.toneStack && block.toneStack.length > 0) ? block.toneStack.slice(0, 8) : [136.1, 272.2];
        const labels = stack.map((hz, idx) => {
            const info = freqToPitchInfo(hz, pitchRef);
            return `V${idx + 1}: ${hz.toFixed(1)}Hz (${info.note}${info.octave})`;
        });
        return {
            frequencies: stack,
            labels,
            primaryLabel: `${stack.length}-Tone Array`,
            secondaryInfo: stack.map(f => `${f.toFixed(1)}Hz`).join(', ')
        };
    }

    // Default fallback
    return {
        frequencies: [432.0],
        labels: ['432.0 Hz'],
        primaryLabel: '432.0 Hz',
        secondaryInfo: 'Fundamental Tone'
    };
}

// --- CURATED STARTER EXPERIENCES ---

export const STARTER_EXPERIENCES: ExperienceDef[] = STARTER_LONG_FORM_EXPERIENCES;

// --- LOCAL STORAGE PERSISTENCE ---

const STORAGE_KEY = 'planetary_tuner_custom_experiences_v1';

export function loadCustomExperiences(): ExperienceDef[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to load custom experiences from storage:', e);
        return [];
    }
}

export function saveCustomExperience(exp: ExperienceDef): ExperienceDef[] {
    const list = loadCustomExperiences();
    const existingIdx = list.findIndex(item => item.id === exp.id);
    const updated = { ...exp, updatedAt: Date.now() };
    let newList: ExperienceDef[];
    if (existingIdx >= 0) {
        newList = [...list];
        newList[existingIdx] = updated;
    } else {
        newList = [updated, ...list];
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
        console.warn('Failed to save custom experience:', e);
    }
    return newList;
}

export function deleteCustomExperience(id: string): ExperienceDef[] {
    const list = loadCustomExperiences();
    const filtered = list.filter(item => item.id !== id);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.warn('Failed to delete custom experience:', e);
    }
    return filtered;
}

export function getAllExperiences(): ExperienceDef[] {
    const custom = loadCustomExperiences();
    return [...custom, ...STARTER_EXPERIENCES];
}
