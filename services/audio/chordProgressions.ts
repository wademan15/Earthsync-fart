import { TuningTemperament, calculateMusicalScaleFreqs } from '../../components/modules/visuals/shared';

export type MusicalMood = 
    | 'SERENITY' 
    | 'MELANCHOLY' 
    | 'EUPHORIA' 
    | 'MYSTIC' 
    | 'TRANSCENDENCE' 
    | 'GROUNDING' 
    | 'REVERENCE'
    | 'NEO_SOUL'
    | 'GOSPEL';

export interface ChordDef {
    name: string;
    root: string;       // e.g. 'C', 'D#', 'Eb', etc.
    type: string;       // e.g. 'maj', 'min', 'maj7', 'min7', 'sus2', 'sus4', 'add9', 'dim', '13', '7#9', etc.
    octave?: number;    // default 3 or 4
    bassNote?: string;  // optional slash bass
    voicing?: number[]; // semitone offsets from root, e.g. [0, 4, 7] for maj
}

export type BreathGlideSyncTarget = 'PHASE' | 'INHALE' | 'EXHALE' | 'CYCLE';

export type VoiceLeadingMode = 'CLOSEST_PITCH' | 'STRICT_VOICING' | 'CONTRARY_MOTION';
export type VoicingStyle = 'FULL' | 'ROOTLESS_SHELL' | 'OPEN_DROP2';

export interface ChordGlideConfig {
    enabled: boolean;          // Toggle portamento on/off
    time: number;             // 0.05s to 1.5s (default 0.4s)
    curve: 'EXPONENTIAL' | 'LINEAR';
    voiceLeading: VoiceLeadingMode;
    syncToBreath?: boolean;    // Dynamically synchronize glide duration with breath timing
    breathSyncTarget?: BreathGlideSyncTarget; // 'PHASE' (dynamic inhale on inhale / exhale on exhale), 'INHALE', 'EXHALE', 'CYCLE'
    breathSyncMultiplier?: number; // 0.25, 0.5, 0.75, 1.0 (default 1.0 = 100% of breath phase)
    adaptiveJustIntonation?: boolean; // Dynamic Root Anchoring to eliminate syntonic wolf intervals
    voicingStyle?: VoicingStyle;       // 'FULL', 'ROOTLESS_SHELL' (Bill Evans), 'OPEN_DROP2'
    lowIntervalLimit?: boolean;       // Prevent harmonic clutter below C3 (130Hz)
    breathHarmonicTension?: boolean;  // Inhale blooms subtle upper harmonics, exhale settles into fundamental
    abComparisonMode?: 'PRESET' | '12TET'; // Instant A/B temperament toggling
    generativeDrift?: boolean;        // Organic Markov wandering through harmonic progression
}

export const DEFAULT_CHORD_GLIDE_CONFIG: ChordGlideConfig = {
    enabled: true,
    time: 0.4,
    curve: 'EXPONENTIAL',
    voiceLeading: 'CLOSEST_PITCH',
    syncToBreath: false,
    breathSyncTarget: 'PHASE',
    breathSyncMultiplier: 1.0,
    adaptiveJustIntonation: true,
    voicingStyle: 'FULL',
    lowIntervalLimit: true,
    breathHarmonicTension: true,
    abComparisonMode: 'PRESET',
    generativeDrift: false
};

export interface ChordGlidePreset {
    label: string;
    time: number;
    description: string;
    syncToBreath?: boolean;
    breathSyncTarget?: BreathGlideSyncTarget;
    breathSyncMultiplier?: number;
}

export const CHORD_GLIDE_PRESETS: ChordGlidePreset[] = [
    { label: 'Fast', time: 0.15, description: '150ms snappy slide', syncToBreath: false },
    { label: 'Lyrical', time: 0.4, description: '400ms vocal portamento', syncToBreath: false },
    { label: 'Meditative', time: 0.8, description: '800ms ambient glide', syncToBreath: false },
    { label: 'Deep Swell', time: 1.2, description: '1200ms slow swell', syncToBreath: false },
    { label: 'Breath Sync', time: 4.0, description: 'Auto-syncs to Inhale & Exhale timing', syncToBreath: true, breathSyncTarget: 'PHASE', breathSyncMultiplier: 1.0 }
];

export interface ProgressionDef {
    id: string;
    name: string;
    mood: MusicalMood;
    description: string;
    recommendedTemperament: TuningTemperament;
    recommendedPitch: number;
    chords: ChordDef[];
    isCustom?: boolean;
}

export interface MoodCategory {
    mood: MusicalMood;
    label: string;
    color: string;
    description: string;
    progressions: ProgressionDef[];
}

export const CHORD_VOICINGS: Record<string, number[]> = {
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10],
    '7': [0, 4, 7, 10],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    'add9': [0, 4, 7, 14],
    'min9': [0, 3, 7, 10, 14],
    'maj9': [0, 4, 7, 11, 14],
    '9': [0, 4, 7, 10, 14],
    '6': [0, 4, 7, 9],
    'min6': [0, 3, 7, 9],
    'min11': [0, 3, 7, 10, 14, 17],
    'maj11': [0, 4, 7, 11, 14, 17],
    '7sus4': [0, 5, 7, 10],
    '9sus4': [0, 5, 7, 10, 14],
    'maj7#11': [0, 4, 7, 11, 18],
    'dim': [0, 3, 6],
    'dim7': [0, 3, 6, 9],
    'm7b5': [0, 3, 6, 10],
    'aug': [0, 4, 8],
    '5': [0, 7, 12],
    '7#9': [0, 4, 7, 10, 15],
    '7b9': [0, 4, 7, 10, 13],
    '13': [0, 4, 7, 10, 14, 21],
    'maj13': [0, 4, 7, 11, 14, 21],
    '7alt': [0, 4, 6, 10, 15],
    'neutral': [0, 3, 7], // 350-cent neutral third in microtonal systems
    'neutral7': [0, 3, 7, 10]
};

export const CHORD_TYPE_OPTIONS: Array<{ type: string; label: string; description: string }> = [
    { type: 'maj', label: 'Major', description: 'Root, Major 3rd, Perfect 5th' },
    { type: 'min', label: 'Minor', description: 'Root, Minor 3rd, Perfect 5th' },
    { type: 'maj7', label: 'Maj7', description: 'Lush, warm, open' },
    { type: 'min7', label: 'Min7', description: 'Introspective, jazz, soulful' },
    { type: 'dom7', label: 'Dom7', description: 'Blues, tension, forward drive' },
    { type: '7', label: '7', description: 'Dominant 7th forward motion' },
    { type: 'sus2', label: 'Sus2', description: 'Open, floating, neutral' },
    { type: 'sus4', label: 'Sus4', description: 'Suspended anticipation' },
    { type: 'add9', label: 'Add9', description: 'Luminous acoustic color' },
    { type: 'min9', label: 'Min9', description: 'Deep emotive melancholy' },
    { type: 'maj9', label: 'Maj9', description: 'Rich, celestial elegance' },
    { type: '9', label: '9', description: 'Dominant 9th smooth funk/blues' },
    { type: '6', label: '6th', description: 'Warm vintage resolution' },
    { type: 'min6', label: 'Min6', description: 'Film noir, modal color' },
    { type: 'min11', label: 'Min11', description: 'Atmospheric modern ambient' },
    { type: '13', label: '13th', description: 'Extended dominant neo-soul color' },
    { type: '7sus4', label: '7sus4', description: 'Modern gospel / r&b suspension' },
    { type: '9sus4', label: '9sus4', description: 'Floating gospel 9th suspension' },
    { type: '7#9', label: '7#9', description: 'Sharp-nine purple / neo-soul bite' },
    { type: '7b9', label: '7b9', description: 'Flat-nine gospel diminished resolution' },
    { type: 'm7b5', label: 'm7b5 (Half-Dim)', description: 'Minor 2-5-1 and 7-3-6 hinge' },
    { type: 'dim7', label: 'Dim7', description: 'Full diminished gospel passing chord' },
    { type: 'neutral', label: 'Neutral Triad (350¢)', description: 'Ancient microtonal third poised between major and minor' },
    { type: 'neutral7', label: 'Neutral 7th', description: 'Contemplative microtonal 7th for desert meditation' },
    { type: 'dim', label: 'Dim', description: 'Tense, mysterious tension' },
    { type: 'aug', label: 'Aug', description: 'Unresolved, dreamlike' },
    { type: '5', label: '5th (Power)', description: 'Root & 5th pure resonance' },
    { type: '7alt', label: '7alt', description: 'Altered dominant tension' }
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const CUSTOM_PROGRESSIONS_STORAGE_KEY = 'ppl_custom_progressions';

export function loadCustomProgressions(): ProgressionDef[] {
    try {
        const data = localStorage.getItem(CUSTOM_PROGRESSIONS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {
        // Fallback to empty array if storage is inaccessible
    }
    return [];
}

export function saveCustomProgressions(progs: ProgressionDef[]): void {
    try {
        localStorage.setItem(CUSTOM_PROGRESSIONS_STORAGE_KEY, JSON.stringify(progs));
    } catch {
        // Ignore storage quotas or restrictions
    }
}

export function deleteCustomProgression(id: string): ProgressionDef[] {
    const current = loadCustomProgressions().filter(p => p.id !== id);
    saveCustomProgressions(current);
    return current;
}

export function addOrUpdateCustomProgression(prog: ProgressionDef): ProgressionDef[] {
    const list = loadCustomProgressions();
    const idx = list.findIndex(p => p.id === prog.id);
    const updated = { ...prog, isCustom: true };
    if (idx >= 0) {
        list[idx] = updated;
    } else {
        list.push(updated);
    }
    saveCustomProgressions(list);
    return list;
}

export function getAllMoodCategories(customList: ProgressionDef[] = []): MoodCategory[] {
    return MOOD_CATEGORIES.map(cat => {
        const matchingCustom = customList.filter(p => p.mood === cat.mood);
        return {
            ...cat,
            progressions: [...cat.progressions, ...matchingCustom]
        };
    });
}

const NOTE_OFFSETS: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
};

export const MOOD_CATEGORIES: MoodCategory[] = [
    {
        mood: 'SERENITY',
        label: 'Serenity & Stillness',
        color: '#06b6d4', // Cyan
        description: 'Peaceful, slow-evolving major 7th and sus2 chords designed for deep relaxation and restorative breathwork.',
        progressions: [
            {
                id: 'serenity_ocean',
                name: 'Ocean of Calm (Cmaj7 - Fmaj7 - Am7 - Gsus4)',
                mood: 'SERENITY',
                description: 'Drifting modal cadence with lush major 7ths, invoking spaciousness.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'serenity_dawn',
                name: 'Golden Dawn (D - Gmaj7 - Bm7 - Aadd9)',
                mood: 'SERENITY',
                description: 'Gentle warmth with luminous open 5ths and 9ths.',
                recommendedTemperament: 'WERCKMEISTER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'D', root: 'D', type: 'maj', octave: 3 },
                    { name: 'Gmaj7', root: 'G', type: 'maj7', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Aadd9', root: 'A', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'serenity_sanctuary',
                name: 'Emerald Sanctuary (Em9 - Cmaj7 - G - Dsus2)',
                mood: 'SERENITY',
                description: 'Gentle cyclical descent that cradles the mind in effortless ease.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Em9', root: 'E', type: 'min9', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'Dsus2', root: 'D', type: 'sus2', octave: 3 }
                ]
            },
            {
                id: 'serenity_lotus',
                name: 'Lotus Bloom (Fmaj7 - G6 - Em7 - Am7)',
                mood: 'SERENITY',
                description: 'Classic IV-V-iii-vi meditative loop with radiant gentle colors.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'G6', root: 'G', type: '6', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 }
                ]
            },
            {
                id: 'serenity_stillness',
                name: 'Deep Stillness (Cmaj9 - Am7 - Fmaj7 - C)',
                mood: 'SERENITY',
                description: 'Ultra-low agitation progression with pure 9th floating harmonic centers.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Cmaj9', root: 'C', type: 'maj9', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'serenity_pacific_8',
                name: 'Pacific Horizon (8 Chords: Cmaj7 - Em7 - Fmaj7 - G6 - Am7 - Em7 - Dm7 - Gsus4)',
                mood: 'SERENITY',
                description: 'Long-form 8-bar breathing journey drifting like ocean swells across tranquil waters.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'G6', root: 'G', type: '6', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Dm7', root: 'D', type: 'min7', octave: 3 },
                    { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'serenity_breathe_8',
                name: 'Breathe & Dissolve (8 Chords: Dmaj7 - Gmaj7 - F#m7 - Bm7 - Em7 - Asus4 - A - Dadd9)',
                mood: 'SERENITY',
                description: 'Expansive 8-phase cycle allowing complete neurological parasympathetic release.',
                recommendedTemperament: 'WERCKMEISTER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Dmaj7', root: 'D', type: 'maj7', octave: 3 },
                    { name: 'Gmaj7', root: 'G', type: 'maj7', octave: 3 },
                    { name: 'F#m7', root: 'F#', type: 'min7', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Asus4', root: 'A', type: 'sus4', octave: 3 },
                    { name: 'A', root: 'A', type: 'maj', octave: 3 },
                    { name: 'Dadd9', root: 'D', type: 'add9', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'MELANCHOLY',
        label: 'Melancholy & Longing',
        color: '#6366f1', // Indigo
        description: 'Poignant minor 9ths, reflective suspensions, and emotive harmonic resolution.',
        progressions: [
            {
                id: 'melancholy_twilight',
                name: 'Twilight Reflection (Am9 - Fmaj7 - Dm9 - Em7)',
                mood: 'MELANCHOLY',
                description: 'Introspective, yearning minor sonorities reflecting deep emotional processing.',
                recommendedTemperament: 'KIRNBERGER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Am9', root: 'A', type: 'min9', octave: 3 },
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 }
                ]
            },
            {
                id: 'melancholy_solitude',
                name: 'Solitude in Minor (Em - Cmaj7 - Am - Bm)',
                mood: 'MELANCHOLY',
                description: 'Classic lament bass movement moving between minor introspection and soft release.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'Em', root: 'E', type: 'min', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'Am', root: 'A', type: 'min', octave: 3 },
                    { name: 'Bm', root: 'B', type: 'min', octave: 3 }
                ]
            },
            {
                id: 'melancholy_rain',
                name: 'Rain on Glass (Dm7 - Bbmaj7 - Gm7 - Asus4)',
                mood: 'MELANCHOLY',
                description: 'Slow teardrop cadence with poignant natural minor descending bass.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Dm7', root: 'D', type: 'min7', octave: 3 },
                    { name: 'Bbmaj7', root: 'Bb', type: 'maj7', octave: 3 },
                    { name: 'Gm7', root: 'G', type: 'min7', octave: 3 },
                    { name: 'Asus4', root: 'A', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'melancholy_autumn',
                name: 'Autumn Leaves (Cm7 - Fm7 - Bb - Ebmaj7)',
                mood: 'MELANCHOLY',
                description: 'Warm circle-of-fifths jazz progression evoking memories and nostalgia.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'Cm7', root: 'C', type: 'min7', octave: 3 },
                    { name: 'Fm7', root: 'F', type: 'min7', octave: 3 },
                    { name: 'Bb', root: 'Bb', type: 'maj', octave: 3 },
                    { name: 'Ebmaj7', root: 'Eb', type: 'maj7', octave: 3 }
                ]
            },
            {
                id: 'melancholy_memory',
                name: 'Whispering Echoes (F#m7 - Dmaj7 - Bm7 - C#m7)',
                mood: 'MELANCHOLY',
                description: 'Bittersweet reflective cycle with delicate minor seventh nuances.',
                recommendedTemperament: 'KIRNBERGER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'F#m7', root: 'F#', type: 'min7', octave: 3 },
                    { name: 'Dmaj7', root: 'D', type: 'maj7', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'C#m7', root: 'C#', type: 'min7', octave: 3 }
                ]
            },
            {
                id: 'melancholy_nocturne_8',
                name: 'Autumn Nocturne (8 Chords: Am9 - Am7 - Fmaj7 - Em7 - Dm9 - Dm6 - E7sus4 - E7)',
                mood: 'MELANCHOLY',
                description: 'Extended 8-chord sorrowful waltz with delicate chromatic bass voice leading.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'Am9', root: 'A', type: 'min9', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                    { name: 'Dm6', root: 'D', type: 'min6', octave: 3 },
                    { name: 'E7sus4', root: 'E', type: '7sus4', octave: 3 },
                    { name: 'E7', root: 'E', type: '7', octave: 3 }
                ]
            },
            {
                id: 'melancholy_minor_ii_v_8',
                name: 'Crying in the Rain (8 Chords: Cm9 - Abmaj7 - Fm9 - G7b9 - Cm9 - Ebmaj7 - Dm7b5 - G7sus4)',
                mood: 'MELANCHOLY',
                description: 'Emotional jazz-noir minor cycle with half-diminished and flat-nine tension.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Cm9', root: 'C', type: 'min9', octave: 3 },
                    { name: 'Abmaj7', root: 'Ab', type: 'maj7', octave: 3 },
                    { name: 'Fm9', root: 'F', type: 'min9', octave: 3 },
                    { name: 'G7b9', root: 'G', type: '7b9', octave: 3 },
                    { name: 'Cm9', root: 'C', type: 'min9', octave: 3 },
                    { name: 'Ebmaj7', root: 'Eb', type: 'maj7', octave: 3 },
                    { name: 'Dm7b5', root: 'D', type: 'm7b5', octave: 3 },
                    { name: 'G7sus4', root: 'G', type: '7sus4', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'EUPHORIA',
        label: 'Euphoria & Vitality',
        color: '#f59e0b', // Amber / Gold
        description: 'Uplifting, radiant cadences that awaken heart coherence, energy, and inspiration.',
        progressions: [
            {
                id: 'euphoria_radiance',
                name: 'Solar Radiance (E - Aadd9 - C#m7 - Bsus4)',
                mood: 'EUPHORIA',
                description: 'Bright, expansive triad harmonies resonant with vitality.',
                recommendedTemperament: '12TET',
                recommendedPitch: 444.0,
                chords: [
                    { name: 'E', root: 'E', type: 'maj', octave: 3 },
                    { name: 'Aadd9', root: 'A', type: 'add9', octave: 3 },
                    { name: 'C#m7', root: 'C#', type: 'min7', octave: 3 },
                    { name: 'Bsus4', root: 'B', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'euphoria_triumph',
                name: 'Ascension (C - G - Am - Fadd9)',
                mood: 'EUPHORIA',
                description: 'The timeless hero’s cycle, filling the room with uplifting, victorious resonance.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'Am', root: 'A', type: 'min', octave: 3 },
                    { name: 'Fadd9', root: 'F', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'euphoria_awakening',
                name: 'Prana Awakening (D - A - Bm7 - Gadd9)',
                mood: 'EUPHORIA',
                description: 'Sunlit major lifts that stimulate cellular vitality and endorphin release.',
                recommendedTemperament: '12TET',
                recommendedPitch: 444.0,
                chords: [
                    { name: 'D', root: 'D', type: 'maj', octave: 3 },
                    { name: 'A', root: 'A', type: 'maj', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Gadd9', root: 'G', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'euphoria_golden',
                name: 'Golden Hour (Fmaj7 - C - Dm7 - Bbadd9)',
                mood: 'EUPHORIA',
                description: 'Warm late-afternoon glow with joyful expansive resolves.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'Dm7', root: 'D', type: 'min7', octave: 3 },
                    { name: 'Bbadd9', root: 'Bb', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'euphoria_heart_528',
                name: 'Ecstatic Heart 528Hz (G - D - Em7 - Cadd9)',
                mood: 'EUPHORIA',
                description: 'Tuned precisely to 528Hz Solfeggio frequency for heart chakra coherence.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 528.0,
                chords: [
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'D', root: 'D', type: 'maj', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Cadd9', root: 'C', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'euphoria_solar_flare_8',
                name: 'Solar Flare (8 Chords: E - B - C#m7 - Aadd9 - E - F#m7 - G#m7 - Bsus4)',
                mood: 'EUPHORIA',
                description: 'Dynamic 8-step crescendo opening solar vitality and heart-centered power.',
                recommendedTemperament: '12TET',
                recommendedPitch: 444.0,
                chords: [
                    { name: 'E', root: 'E', type: 'maj', octave: 3 },
                    { name: 'B', root: 'B', type: 'maj', octave: 3 },
                    { name: 'C#m7', root: 'C#', type: 'min7', octave: 3 },
                    { name: 'Aadd9', root: 'A', type: 'add9', octave: 3 },
                    { name: 'E', root: 'E', type: 'maj', octave: 3 },
                    { name: 'F#m7', root: 'F#', type: 'min7', octave: 3 },
                    { name: 'G#m7', root: 'G#', type: 'min7', octave: 3 },
                    { name: 'Bsus4', root: 'B', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'euphoria_endless_hymn_8',
                name: 'Endless Horizon (8 Chords: G - D - Em7 - C - G - Am7 - Dsus4 - Gadd9)',
                mood: 'EUPHORIA',
                description: 'Sweeping 8-chord hymn celebrating triumph, renewal, and radiant joy.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'D', root: 'D', type: 'maj', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Dsus4', root: 'D', type: 'sus4', octave: 3 },
                    { name: 'Gadd9', root: 'G', type: 'add9', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'MYSTIC',
        label: 'Mystic & Esoteric',
        color: '#a855f7', // Purple
        description: 'Lydian, Dorian, and microtonal shifts exploring cosmic, unearthly tonal textures.',
        progressions: [
            {
                id: 'mystic_desert_mirage',
                name: 'Mirage of the Solitary Dune (Maqam Rast Neutral 3rd)',
                mood: 'MYSTIC',
                description: 'Ancient microtonal contemplation featuring the 350-cent neutral third ("zalzal") poised between major and minor, evoking vast desert horizons and deep stillness.',
                recommendedTemperament: 'RAST_NEUTRAL_3RD',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'D(neutral)', root: 'D', type: 'neutral', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 },
                    { name: 'C(neutral7)', root: 'C', type: 'neutral7', octave: 3 },
                    { name: 'D5', root: 'D', type: '5', octave: 3 }
                ]
            },
            {
                id: 'mystic_cosmic_web',
                name: 'Lydian Dreamscape (Cmaj7 - D - Em9 - Bm7)',
                mood: 'MYSTIC',
                description: 'Lydian raised-fourth brightness creating weightless floating sensations.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 430.54,
                chords: [
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'D', root: 'D', type: 'maj', octave: 3 },
                    { name: 'Em9', root: 'E', type: 'min9', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 }
                ]
            },
            {
                id: 'mystic_shamanic',
                name: 'Dorian Shamanic (Dm7 - G - Dm7 - Am7)',
                mood: 'MYSTIC',
                description: 'Ancient modal chant cadence used in transformative sound journeys.',
                recommendedTemperament: 'WERCKMEISTER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Dm7', root: 'D', type: 'min7', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'Dm7', root: 'D', type: 'min7', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 }
                ]
            },
            {
                id: 'mystic_isis',
                name: 'Temple of Isis (F#m - C#m - Dmaj7 - E)',
                mood: 'MYSTIC',
                description: 'Esoteric Phrygian / Aeolian progression evoking stone sanctums and incense.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'F#m', root: 'F#', type: 'min', octave: 3 },
                    { name: 'C#m', root: 'C#', type: 'min', octave: 3 },
                    { name: 'Dmaj7', root: 'D', type: 'maj7', octave: 3 },
                    { name: 'E', root: 'E', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'mystic_astral',
                name: 'Astral Horizon (Am7 - Bm7 - Cmaj7 - Dsus4)',
                mood: 'MYSTIC',
                description: 'Stepwise ascending modal progression leading toward cosmic expansion.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 430.54,
                chords: [
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'Dsus4', root: 'D', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'mystic_bells',
                name: 'Tibetan Singing Bells (Dsus2 - Asus4 - Csus2 - G5)',
                mood: 'MYSTIC',
                description: 'Open quartal and quintal chords simulating metal singing bowls.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Dsus2', root: 'D', type: 'sus2', octave: 3 },
                    { name: 'Asus4', root: 'A', type: 'sus4', octave: 3 },
                    { name: 'Csus2', root: 'C', type: 'sus2', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 }
                ]
            },
            {
                id: 'mystic_astral_staircase_8',
                name: 'Astral Staircase (8 Chords: Dm9 - Em7 - Fmaj7 - G6 - Am7 - Bm7 - Cmaj7 - Dsus4)',
                mood: 'MYSTIC',
                description: 'Continuous 8-chord Dorian ascension rising through celestial planes of perception.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 430.54,
                chords: [
                    { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
                    { name: 'G6', root: 'G', type: '6', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'Dsus4', root: 'D', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'mystic_lydian_voyage_10',
                name: 'Lydian Voyage (10 Chords: Cmaj7#11 - D - Em9 - Bm7 - Cmaj7#11 - F#m7 - Gmaj7 - A - Bm7 - Cmaj7)',
                mood: 'MYSTIC',
                description: 'Expansive 10-step mystical journey bathed in sharp-eleventh cosmic overtone shimmer.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 430.54,
                chords: [
                    { name: 'Cmaj7#11', root: 'C', type: 'maj7#11', octave: 3 },
                    { name: 'D', root: 'D', type: 'maj', octave: 3 },
                    { name: 'Em9', root: 'E', type: 'min9', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Cmaj7#11', root: 'C', type: 'maj7#11', octave: 3 },
                    { name: 'F#m7', root: 'F#', type: 'min7', octave: 3 },
                    { name: 'Gmaj7', root: 'G', type: 'maj7', octave: 3 },
                    { name: 'A', root: 'A', type: 'maj', octave: 3 },
                    { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'TRANSCENDENCE',
        label: 'Transcendence & Aether',
        color: '#ec4899', // Pink / Rose
        description: 'Airy, boundless open-voiced suspensions for transcendental meditation and cosmic journeying.',
        progressions: [
            {
                id: 'transcendence_crown',
                name: 'Aetheric Crown (Fsus2 - C - Gsus4 - Am7)',
                mood: 'TRANSCENDENCE',
                description: 'Open second suspensions that melt tonal boundaries into unified drone harmony.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Fsus2', root: 'F', type: 'sus2', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 }
                ]
            },
            {
                id: 'transcendence_infinite',
                name: 'Celestial Orbit (Abmaj7 - Ebmaj7 - Fm7 - Bbsus4)',
                mood: 'TRANSCENDENCE',
                description: 'Rich flat-key romance evoking stargazing and infinity.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Abmaj7', root: 'Ab', type: 'maj7', octave: 3 },
                    { name: 'Ebmaj7', root: 'Eb', type: 'maj7', octave: 3 },
                    { name: 'Fm7', root: 'F', type: 'min7', octave: 3 },
                    { name: 'Bbsus4', root: 'Bb', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'transcendence_gateway',
                name: 'Cosmic Gateway (C#m7 - Amaj7 - E - B)',
                mood: 'TRANSCENDENCE',
                description: 'Ascending Aeolian/Ionian cycle opening expansive higher awareness.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'C#m7', root: 'C#', type: 'min7', octave: 3 },
                    { name: 'Amaj7', root: 'A', type: 'maj7', octave: 3 },
                    { name: 'E', root: 'E', type: 'maj', octave: 3 },
                    { name: 'B', root: 'B', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'transcendence_starlight',
                name: 'Starlight Drift (Dmaj9 - F#m7 - Gmaj7 - Asus4)',
                mood: 'TRANSCENDENCE',
                description: 'Crystalline major ninths resembling distant nebula clusters.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Dmaj9', root: 'D', type: 'maj9', octave: 3 },
                    { name: 'F#m7', root: 'F#', type: 'min7', octave: 3 },
                    { name: 'Gmaj7', root: 'G', type: 'maj7', octave: 3 },
                    { name: 'Asus4', root: 'A', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'transcendence_void',
                name: 'Singing Void (Asus2 - E - F#m7 - Dsus2)',
                mood: 'TRANSCENDENCE',
                description: 'Sparse, suspended acoustic space dissolving the perception of physical weight.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Asus2', root: 'A', type: 'sus2', octave: 3 },
                    { name: 'E', root: 'E', type: 'maj', octave: 3 },
                    { name: 'F#m7', root: 'F#', type: 'min7', octave: 3 },
                    { name: 'Dsus2', root: 'D', type: 'sus2', octave: 3 }
                ]
            },
            {
                id: 'transcendence_infinity_8',
                name: 'Chamber of Infinity (8 Chords: Fmaj9 - G6 - Am9 - Cmaj7 - Dm9 - Em7 - Fsus2 - Gsus4)',
                mood: 'TRANSCENDENCE',
                description: 'Infinite 8-stage loop dissolving ego barriers through cascading suspensions.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 },
                    { name: 'G6', root: 'G', type: '6', octave: 3 },
                    { name: 'Am9', root: 'A', type: 'min9', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Fsus2', root: 'F', type: 'sus2', octave: 3 },
                    { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 }
                ]
            },
            {
                id: 'transcendence_stargate_8',
                name: 'Stargate Orbit (8 Chords: Abmaj7 - Bbm7 - Cm7 - Dbmaj7 - Eb6 - Fm7 - Bbsus4 - Ebmaj7)',
                mood: 'TRANSCENDENCE',
                description: 'Grand flat-scale harmonic ascent opening multi-dimensional calm.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Abmaj7', root: 'Ab', type: 'maj7', octave: 3 },
                    { name: 'Bbm7', root: 'Bb', type: 'min7', octave: 3 },
                    { name: 'Cm7', root: 'C', type: 'min7', octave: 3 },
                    { name: 'Dbmaj7', root: 'Db', type: 'maj7', octave: 3 },
                    { name: 'Eb6', root: 'Eb', type: '6', octave: 3 },
                    { name: 'Fm7', root: 'F', type: 'min7', octave: 3 },
                    { name: 'Bbsus4', root: 'Bb', type: 'sus4', octave: 3 },
                    { name: 'Ebmaj7', root: 'Eb', type: 'maj7', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'GROUNDING',
        label: 'Grounding & Earth',
        color: '#10b981', // Emerald
        description: 'Rooted, solid open fifths and pentatonic cadences that ground the body and stabilize the nervous system.',
        progressions: [
            {
                id: 'grounding_terra',
                name: 'Terra Firma (C5 - G5 - F5 - C5)',
                mood: 'GROUNDING',
                description: 'Pure acoustic open fifths that eliminate dissonance and establish somatic stability.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'C5', root: 'C', type: '5', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 },
                    { name: 'F5', root: 'F', type: '5', octave: 3 },
                    { name: 'C5', root: 'C', type: '5', octave: 3 }
                ]
            },
            {
                id: 'grounding_roots',
                name: 'Roots in Granite (D5 - A5 - G5 - D5)',
                mood: 'GROUNDING',
                description: 'Deep resonant fifths locking into primal pelvic and spinal alignment.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'D5', root: 'D', type: '5', octave: 3 },
                    { name: 'A5', root: 'A', type: '5', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 },
                    { name: 'D5', root: 'D', type: '5', octave: 3 }
                ]
            },
            {
                id: 'grounding_schumann',
                name: 'Schumann Resonance Harmonic (Em - G - C - D)',
                mood: 'GROUNDING',
                description: 'Simple natural minor cadence grounding cerebral alpha-theta rhythms into earth frequency.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Em', root: 'E', type: 'min', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'D', root: 'D', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'grounding_forest',
                name: 'Ancient Cedar (A5 - E5 - D5 - E5)',
                mood: 'GROUNDING',
                description: 'Hypnotic repetitive fifths evoking stillness beneath canopy giants.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'A5', root: 'A', type: '5', octave: 3 },
                    { name: 'E5', root: 'E', type: '5', octave: 3 },
                    { name: 'D5', root: 'D', type: '5', octave: 3 },
                    { name: 'E5', root: 'E', type: '5', octave: 3 }
                ]
            },
            {
                id: 'grounding_earth_circle_8',
                name: 'Primal Earth Circle (8 Chords: C5 - G5 - Am7 - F5 - C5 - Em7 - F5 - G5)',
                mood: 'GROUNDING',
                description: 'Deep somatic 8-part sequence anchoring lower chakras to core bedrock.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'C5', root: 'C', type: '5', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'F5', root: 'F', type: '5', octave: 3 },
                    { name: 'C5', root: 'C', type: '5', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'F5', root: 'F', type: '5', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 }
                ]
            },
            {
                id: 'grounding_stone_hymn_6',
                name: 'Nordic Stone Hymn (6 Chords: D5 - F5 - C5 - G5 - Bb5 - A5)',
                mood: 'GROUNDING',
                description: 'Heavy archaic resonant fifths creating visceral grounding and focus.',
                recommendedTemperament: 'PYTHAGOREAN',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'D5', root: 'D', type: '5', octave: 3 },
                    { name: 'F5', root: 'F', type: '5', octave: 3 },
                    { name: 'C5', root: 'C', type: '5', octave: 3 },
                    { name: 'G5', root: 'G', type: '5', octave: 3 },
                    { name: 'Bb5', root: 'Bb', type: '5', octave: 3 },
                    { name: 'A5', root: 'A', type: '5', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'REVERENCE',
        label: 'Reverence & Cathedral',
        color: '#38bdf8', // Light Blue / Sky
        description: 'Sacred choral cadences reminiscent of Renaissance and Baroque cathedral polyphony.',
        progressions: [
            {
                id: 'reverence_sacred',
                name: 'Sacred Polyphony (Dm - C - Bb - Asus4 - A)',
                mood: 'REVERENCE',
                description: 'Andalusian / Renaissance choral cadence with Picardy third release.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'Dm', root: 'D', type: 'min', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'Bb', root: 'Bb', type: 'maj', octave: 3 },
                    { name: 'Asus4', root: 'A', type: 'sus4', octave: 3 },
                    { name: 'A', root: 'A', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'reverence_vespers',
                name: 'Vespers of Light (G - Em - C - Dsus4 - D)',
                mood: 'REVERENCE',
                description: 'Candlelit evening hymns with pure mean-tone thirds and pure fifths.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'Em', root: 'E', type: 'min', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'Dsus4', root: 'D', type: 'sus4', octave: 3 },
                    { name: 'D', root: 'D', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'reverence_gregorian',
                name: 'Gregorian Mist (Am - G - F - Em)',
                mood: 'REVERENCE',
                description: 'Descending chant modes echoing across vaulted stone sanctuary arches.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'Am', root: 'A', type: 'min', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 },
                    { name: 'F', root: 'F', type: 'maj', octave: 3 },
                    { name: 'Em', root: 'E', type: 'min', octave: 3 }
                ]
            },
            {
                id: 'reverence_cathedral',
                name: 'Cathedral Spire (C - Am - Dm - G)',
                mood: 'REVERENCE',
                description: 'Grand classical cadence echoing in pure historical temperament.',
                recommendedTemperament: 'WERCKMEISTER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'Am', root: 'A', type: 'min', octave: 3 },
                    { name: 'Dm', root: 'D', type: 'min', octave: 3 },
                    { name: 'G', root: 'G', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'reverence_miserere_8',
                name: 'Miserere Polyphony (8 Chords: Dm - Gm - C - F - Bb - Edim - Asus4 - A)',
                mood: 'REVERENCE',
                description: 'Extended 8-stage polyphonic circle of fifths echoing through ancient stone cathedral vaults.',
                recommendedTemperament: 'MEANTONE_QUARTER',
                recommendedPitch: 415.0,
                chords: [
                    { name: 'Dm', root: 'D', type: 'min', octave: 3 },
                    { name: 'Gm', root: 'G', type: 'min', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'F', root: 'F', type: 'maj', octave: 3 },
                    { name: 'Bb', root: 'Bb', type: 'maj', octave: 3 },
                    { name: 'Edim', root: 'E', type: 'dim', octave: 3 },
                    { name: 'Asus4', root: 'A', type: 'sus4', octave: 3 },
                    { name: 'A', root: 'A', type: 'maj', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'NEO_SOUL',
        label: 'Neo-Soul & Warm Velvet',
        color: '#f43f5e', // Rose / Velvet
        description: 'Lush 9ths, 11ths, 13ths, passing altered dominants, and buttery chromatic voice leading (6 to 12 chords).',
        progressions: [
            {
                id: 'neosoul_dangelo_8',
                name: "D'Angelo Velvet Glide (8 Chords: F#m9 - B13 - Emaj9 - C#m9 - F#m11 - G#m7 - Amaj9 - G#7#9)",
                mood: 'NEO_SOUL',
                description: 'Iconic 8-chord smooth Rhodes progression with lush 13ths, 11ths, and altered resolution.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'F#m9', root: 'F#', type: 'min9', octave: 3 },
                    { name: 'B13', root: 'B', type: '13', octave: 3 },
                    { name: 'Emaj9', root: 'E', type: 'maj9', octave: 3 },
                    { name: 'C#m9', root: 'C#', type: 'min9', octave: 3 },
                    { name: 'F#m11', root: 'F#', type: 'min11', octave: 3 },
                    { name: 'G#m7', root: 'G#', type: 'min7', octave: 3 },
                    { name: 'Amaj9', root: 'A', type: 'maj9', octave: 3 },
                    { name: 'G#7#9', root: 'G#', type: '7#9', octave: 3 }
                ]
            },
            {
                id: 'neosoul_erykah_8',
                name: "Erykah's Moonlit Rhodes (8 Chords: Dbmaj9 - C7#9 - Bmaj9 - Bb7alt - Ebm9 - Ab13 - Dbmaj9 - Ab7sus4)",
                mood: 'NEO_SOUL',
                description: 'Buttery flat-key neo-soul cycle with chromatic descending dominant passing chords.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Dbmaj9', root: 'Db', type: 'maj9', octave: 3 },
                    { name: 'C7#9', root: 'C', type: '7#9', octave: 3 },
                    { name: 'Bmaj9', root: 'B', type: 'maj9', octave: 3 },
                    { name: 'Bb7alt', root: 'Bb', type: '7alt', octave: 3 },
                    { name: 'Ebm9', root: 'Eb', type: 'min9', octave: 3 },
                    { name: 'Ab13', root: 'Ab', type: '13', octave: 3 },
                    { name: 'Dbmaj9', root: 'Db', type: 'maj9', octave: 3 },
                    { name: 'Ab7sus4', root: 'Ab', type: '7sus4', octave: 3 }
                ]
            },
            {
                id: 'neosoul_dilla_8',
                name: 'J Dilla Midnight Slum (8 Chords: Ebmaj9 - Dm7 - G7b9 - Cm9 - F9 - Bbmaj9 - Abmaj7 - Bb7sus4)',
                mood: 'NEO_SOUL',
                description: 'Classic hip-hop soul loop steeped in minor 2-5s and warm major 9th pads.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Ebmaj9', root: 'Eb', type: 'maj9', octave: 3 },
                    { name: 'Dm7', root: 'D', type: 'min7', octave: 3 },
                    { name: 'G7b9', root: 'G', type: '7b9', octave: 3 },
                    { name: 'Cm9', root: 'C', type: 'min9', octave: 3 },
                    { name: 'F9', root: 'F', type: '9', octave: 3 },
                    { name: 'Bbmaj9', root: 'Bb', type: 'maj9', octave: 3 },
                    { name: 'Abmaj7', root: 'Ab', type: 'maj7', octave: 3 },
                    { name: 'Bb7sus4', root: 'Bb', type: '7sus4', octave: 3 }
                ]
            },
            {
                id: 'neosoul_electric_garden_12',
                name: 'Electric Garden (12 Chords: Fmaj9 - Em7 - A7#9 - Dm9 - G13 - Cmaj9 - Cm9 - F9 - Bbmaj9 - Bbm9 - Am9 - D7alt)',
                mood: 'NEO_SOUL',
                description: 'Epic 12-chord masterclass progression traversing secondary dominants and modal interchanges.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'A7#9', root: 'A', type: '7#9', octave: 3 },
                    { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                    { name: 'G13', root: 'G', type: '13', octave: 3 },
                    { name: 'Cmaj9', root: 'C', type: 'maj9', octave: 3 },
                    { name: 'Cm9', root: 'C', type: 'min9', octave: 3 },
                    { name: 'F9', root: 'F', type: '9', octave: 3 },
                    { name: 'Bbmaj9', root: 'Bb', type: 'maj9', octave: 3 },
                    { name: 'Bbm9', root: 'Bb', type: 'min9', octave: 3 },
                    { name: 'Am9', root: 'A', type: 'min9', octave: 3 },
                    { name: 'D7alt', root: 'D', type: '7alt', octave: 3 }
                ]
            },
            {
                id: 'neosoul_strasbourg_8',
                name: 'Strasbourg Breeze (8 Chords: Abmaj9 - Gm7 - C7#9 - Fm9 - Bbm9 - Eb13 - Abmaj9 - Eb7sus4)',
                mood: 'NEO_SOUL',
                description: 'Roy Hargrove inspired soulful jazz progression with rich melodic voice leading.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Abmaj9', root: 'Ab', type: 'maj9', octave: 3 },
                    { name: 'Gm7', root: 'G', type: 'min7', octave: 3 },
                    { name: 'C7#9', root: 'C', type: '7#9', octave: 3 },
                    { name: 'Fm9', root: 'F', type: 'min9', octave: 3 },
                    { name: 'Bbm9', root: 'Bb', type: 'min9', octave: 3 },
                    { name: 'Eb13', root: 'Eb', type: '13', octave: 3 },
                    { name: 'Abmaj9', root: 'Ab', type: 'maj9', octave: 3 },
                    { name: 'Eb7sus4', root: 'Eb', type: '7sus4', octave: 3 }
                ]
            },
            {
                id: 'neosoul_golden_velvet_6',
                name: 'Golden Velvet (6 Chords: Bmaj9 - A#m7 - D#7alt - G#m9 - C#m9 - F#13)',
                mood: 'NEO_SOUL',
                description: 'Compact 6-chord sultry groove loaded with tension and silky resolution.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Bmaj9', root: 'B', type: 'maj9', octave: 3 },
                    { name: 'A#m7', root: 'A#', type: 'min7', octave: 3 },
                    { name: 'D#7alt', root: 'D#', type: '7alt', octave: 3 },
                    { name: 'G#m9', root: 'G#', type: 'min9', octave: 3 },
                    { name: 'C#m9', root: 'C#', type: 'min9', octave: 3 },
                    { name: 'F#13', root: 'F#', type: '13', octave: 3 }
                ]
            }
        ]
    },
    {
        mood: 'GOSPEL',
        label: 'Gospel & Soulful Praise',
        color: '#eab308', // Warm Gold / Sunlight
        description: 'Anointed 7-3-6-2-5-1 movements, church walk-downs, diminished passing chords, and suspended releases (6 to 10 chords).',
        progressions: [
            {
                id: 'gospel_sunday_morning_8',
                name: 'Sunday Morning 7-3-6-2-5-1 (8 Chords: Fmaj9 - Em7b5 - A7#9 - Dm9 - G7 - Gm7 - C7sus4 - Fmaj9)',
                mood: 'GOSPEL',
                description: 'The definitive gospel turnaround movement powering soul music and modern worship.',
                recommendedTemperament: 'VALLOTTI',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 },
                    { name: 'Em7b5', root: 'E', type: 'm7b5', octave: 3 },
                    { name: 'A7#9', root: 'A', type: '7#9', octave: 3 },
                    { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                    { name: 'G7', root: 'G', type: '7', octave: 3 },
                    { name: 'Gm7', root: 'G', type: 'min7', octave: 3 },
                    { name: 'C7sus4', root: 'C', type: '7sus4', octave: 3 },
                    { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 }
                ]
            },
            {
                id: 'gospel_praise_walk_8',
                name: 'Preacher’s Praise Walk-Down (8 Chords: Ab - C7 - Fm9 - Ebm7 - Dbmaj7 - Ddim7 - Eb7sus4 - Ab)',
                mood: 'GOSPEL',
                description: 'Triumphant church walk-down featuring chromatic diminished passing chords into suspended glory.',
                recommendedTemperament: 'WERCKMEISTER_III',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Ab', root: 'Ab', type: 'maj', octave: 3 },
                    { name: 'C7', root: 'C', type: '7', octave: 3 },
                    { name: 'Fm9', root: 'F', type: 'min9', octave: 3 },
                    { name: 'Ebm7', root: 'Eb', type: 'min7', octave: 3 },
                    { name: 'Dbmaj7', root: 'Db', type: 'maj7', octave: 3 },
                    { name: 'Ddim7', root: 'D', type: 'dim7', octave: 3 },
                    { name: 'Eb7sus4', root: 'Eb', type: '7sus4', octave: 3 },
                    { name: 'Ab', root: 'Ab', type: 'maj', octave: 3 }
                ]
            },
            {
                id: 'gospel_sanctuary_grace_10',
                name: 'Sanctuary Grace Choral Ascent (10 Chords: C - E7 - Am7 - Gm7 - C7 - Fmaj9 - F#dim7 - C - G7sus4 - Cadd9)',
                mood: 'GOSPEL',
                description: 'Full 10-chord uplifting choral journey lifting worshippers from reverence to ecstatic release.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'E7', root: 'E', type: '7', octave: 3 },
                    { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                    { name: 'Gm7', root: 'G', type: 'min7', octave: 3 },
                    { name: 'C7', root: 'C', type: '7', octave: 3 },
                    { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 },
                    { name: 'F#dim7', root: 'F#', type: 'dim7', octave: 3 },
                    { name: 'C', root: 'C', type: 'maj', octave: 3 },
                    { name: 'G7sus4', root: 'G', type: '7sus4', octave: 3 },
                    { name: 'Cadd9', root: 'C', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'gospel_total_praise_8',
                name: 'Total Praise & Elevation (8 Chords: Ebmaj9 - G7#9 - Cm9 - Bbm9 - Abmaj9 - Abm6 - Eb - Bb7sus4)',
                mood: 'GOSPEL',
                description: 'Richard Smallwood inspired choral masterpiece with minor iv plagal resolution.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Ebmaj9', root: 'Eb', type: 'maj9', octave: 3 },
                    { name: 'G7#9', root: 'G', type: '7#9', octave: 3 },
                    { name: 'Cm9', root: 'C', type: 'min9', octave: 3 },
                    { name: 'Bbm9', root: 'Bb', type: 'min9', octave: 3 },
                    { name: 'Abmaj9', root: 'Ab', type: 'maj9', octave: 3 },
                    { name: 'Abm6', root: 'Ab', type: 'min6', octave: 3 },
                    { name: 'Eb', root: 'Eb', type: 'maj', octave: 3 },
                    { name: 'Bb7sus4', root: 'Bb', type: '7sus4', octave: 3 }
                ]
            },
            {
                id: 'gospel_healing_organ_8',
                name: 'Anointed Healing Organ (8 Chords: Bbmaj9 - D7alt - Gm9 - Fm7 - Ebmaj7 - Ebm6 - Fsus4 - Bbadd9)',
                mood: 'GOSPEL',
                description: 'Warm Hammond B3 organ voicings delivering peace, healing, and spiritual stillness.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Bbmaj9', root: 'Bb', type: 'maj9', octave: 3 },
                    { name: 'D7alt', root: 'D', type: '7alt', octave: 3 },
                    { name: 'Gm9', root: 'G', type: 'min9', octave: 3 },
                    { name: 'Fm7', root: 'F', type: 'min7', octave: 3 },
                    { name: 'Ebmaj7', root: 'Eb', type: 'maj7', octave: 3 },
                    { name: 'Ebm6', root: 'Eb', type: 'min6', octave: 3 },
                    { name: 'Fsus4', root: 'F', type: 'sus4', octave: 3 },
                    { name: 'Bbadd9', root: 'Bb', type: 'add9', octave: 3 }
                ]
            },
            {
                id: 'gospel_worship_flow_6',
                name: 'Worship Flow (6 Chords: Gadd9 - B7 - Em7 - Cmaj7 - C#dim7 - Dsus4)',
                mood: 'GOSPEL',
                description: 'Intimate devotional progression moving through secondary dominant and diminished passing lift.',
                recommendedTemperament: 'JUST_INTONATION',
                recommendedPitch: 432.0,
                chords: [
                    { name: 'Gadd9', root: 'G', type: 'add9', octave: 3 },
                    { name: 'B7', root: 'B', type: '7', octave: 3 },
                    { name: 'Em7', root: 'E', type: 'min7', octave: 3 },
                    { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    { name: 'C#dim7', root: 'C#', type: 'dim7', octave: 3 },
                    { name: 'Dsus4', root: 'D', type: 'sus4', octave: 3 }
                ]
            }
        ]
    }
];

export interface ResolvedChordNote {
    note: string;
    name?: string;
    octave: number;
    freq: number;
    channelId: string;
}

export interface ResolvedChordInfo {
    name: string;
    root?: string;
    notes: ResolvedChordNote[];
    consonance?: ConsonanceAnalysis;
}

export interface ChordResolutionOptions {
    adaptiveJustIntonation?: boolean;
    voicingStyle?: VoicingStyle;
    lowIntervalLimit?: boolean;
    abComparisonMode?: 'PRESET' | '12TET';
}

/**
 * Pure 5-limit Just Intonation interval ratios relative to a dynamic chord root (1/1)
 * Used to eliminate the syntonic comma wolf interval on non-C roots.
 */
const PURE_JUST_INTERVAL_RATIOS: Record<number, number> = {
    0: 1.0,           // 1/1 Unison / Tonic
    1: 16 / 15,       // 16/15 Minor 2nd
    2: 9 / 8,         // 9/8 Major 2nd
    3: 6 / 5,         // 6/5 Pure Minor 3rd (315.6¢)
    4: 5 / 4,         // 5/4 Pure Major 3rd (386.3¢)
    5: 4 / 3,         // 4/3 Pure 4th
    6: 45 / 32,       // 45/32 Pure Tritone (or 7/5)
    7: 3 / 2,         // 3/2 Pure 5th (702.0¢)
    8: 8 / 5,         // 8/5 Pure Minor 6th
    9: 5 / 3,         // 5/3 Pure Major 6th
    10: 9 / 5,        // 9/5 Minor 7th (or harmonic 7th 7/4 = 1.75)
    11: 15 / 8,       // 15/8 Pure Major 7th (1088.3¢)
    12: 2.0           // 2/1 Octave
};

/**
 * Calculates exact frequencies and channel IDs for a chord in the current temperament & pitch reference.
 * Supports Adaptive Just Intonation (Dynamic Root Anchoring), Bill Evans Rootless Shell Voicings,
 * Open Drop-2 voice spreading, and Low-Interval Limit protection.
 */
export function getChordFrequencies(
    chord: ChordDef,
    pitchRef: number,
    temperament: TuningTemperament,
    octaveShift: number = 0,
    options?: ChordResolutionOptions
): ResolvedChordInfo {
    const effectiveTemperament = options?.abComparisonMode === '12TET' ? '12TET' : temperament;
    const baseOctave = (chord.octave ?? 3) + octaveShift;
    const rootOffset = NOTE_OFFSETS[chord.root] ?? 0;
    let voicingOffsets = [...(chord.voicing ?? CHORD_VOICINGS[chord.type] ?? [0, 4, 7])];

    // 1. BILL EVANS ROOTLESS SHELL VOICING:
    // If enabled and the chord has 4+ voices (extended chords / 7ths / 9ths), omit root (0)
    // from the upper voice cluster to remove acoustic clutter in the 150-300Hz spectrum.
    // Adds the 9th (+14) if not already present to preserve a lush 4-voice shell.
    if (options?.voicingStyle === 'ROOTLESS_SHELL' && voicingOffsets.length >= 4 && voicingOffsets.includes(0)) {
        voicingOffsets = voicingOffsets.filter(offset => offset !== 0);
        if (!voicingOffsets.includes(14)) {
            voicingOffsets.push(14);
            voicingOffsets.sort((a, b) => a - b);
        }
    }

    // 2. OPEN DROP-2 VOICING:
    // Drops the second-highest voice down an octave (-12) to distribute sound across 2 registers
    if (options?.voicingStyle === 'OPEN_DROP2' && voicingOffsets.length >= 4) {
        const sorted = [...voicingOffsets].sort((a, b) => a - b);
        const secondHighest = sorted[sorted.length - 2];
        const dropped = secondHighest - 12;
        voicingOffsets = sorted.map((v, i) => i === sorted.length - 2 ? dropped : v).sort((a, b) => a - b);
    }

    const noteNamesOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Generate keyboard scale frequencies for 3 octaves starting at (3 + octaveShift)
    const scale = calculateMusicalScaleFreqs(pitchRef, effectiveTemperament, 3 + octaveShift, 3);

    // Compute root fundamental pitch in the current scale
    const rootScaleIdx = scale.findIndex(s => s.octave === baseOctave && s.note.startsWith(chord.root));
    const rootFundamental = rootScaleIdx !== -1 ? scale[rootScaleIdx].freq : pitchRef * Math.pow(2, (rootOffset - 9) / 12 + (baseOctave - 4));

    const isAdaptiveJust = effectiveTemperament === 'JUST_INTONATION' && options?.adaptiveJustIntonation !== false;

    const resolvedNotes: ResolvedChordNote[] = [];

    voicingOffsets.forEach((semitonesFromRoot) => {
        const totalSemitonesFromC = rootOffset + semitonesFromRoot;
        const notePitchClass = ((totalSemitonesFromC % 12) + 12) % 12;
        const octaveOffset = Math.floor(totalSemitonesFromC / 12);
        const finalOctave = baseOctave + octaveOffset;
        const noteName = noteNamesOrder[notePitchClass];

        let finalFreq: number;

        if (isAdaptiveJust) {
            // ADAPTIVE JUST INTONATION (DYNAMIC ROOT ANCHORING):
            // Center pure harmonic ratios directly on the active chord's root, dissolving syntonic comma wolf beats!
            const octaveMult = Math.pow(2, Math.floor(semitonesFromRoot / 12));
            const semitoneInOctave = ((semitonesFromRoot % 12) + 12) % 12;
            const pureRatio = (PURE_JUST_INTERVAL_RATIOS[semitoneInOctave] ?? Math.pow(2, semitoneInOctave / 12)) * octaveMult;
            finalFreq = rootFundamental * pureRatio;
        } else {
            // Match against historical temperament scale
            const matchIdx = scale.findIndex(s => s.octave === finalOctave && (s.note === `${noteName}${finalOctave}` || s.note.startsWith(noteName)));
            if (matchIdx !== -1) {
                finalFreq = scale[matchIdx].freq;
            } else {
                const closest = scale.find(s => s.note.startsWith(noteName));
                finalFreq = closest ? closest.freq * Math.pow(2, finalOctave - closest.octave) : pitchRef * Math.pow(2, (totalSemitonesFromC - 9) / 12 + (baseOctave - 4));
            }
        }

        // LOW-INTERVAL LIMIT (LIL) PROTECTION:
        // Acoustic intervals smaller than a pure 5th below C3 (130.8 Hz) produce harsh intermodulation mud.
        // If an inner/lower voice is below C3 and too close to the bass note, shift it up one octave.
        if (options?.lowIntervalLimit !== false && finalFreq < 130.8 && semitonesFromRoot > 0 && semitonesFromRoot < 7) {
            finalFreq *= 2;
        }

        // Match to closest scale channel ID for visual tracking
        const closestScaleIdx = scale.reduce((bestIdx, s, idx) => {
            return Math.abs(s.freq - finalFreq) < Math.abs(scale[bestIdx].freq - finalFreq) ? idx : bestIdx;
        }, 0);

        resolvedNotes.push({
            note: noteName,
            name: `${noteName}${finalOctave}`,
            octave: finalOctave,
            freq: Math.round(finalFreq * 100) / 100,
            channelId: `UNIVERSAL_${800 + closestScaleIdx}`
        });
    });

    const consonance = analyzeChordConsonance(resolvedNotes, chord.name);

    return {
        name: chord.name,
        root: chord.root,
        notes: resolvedNotes,
        consonance
    };
}

export interface ConsonanceAnalysis {
    score: number; // 0% to 100%
    rating: 'PURE_RESONANCE' | 'CONSONANT' | 'LYRICAL_WARMTH' | 'EXPRESSIVE_TENSION' | 'ALTERED_COLOR';
    label: string;
    description: string;
    intervals: Array<{ name: string; centsDiff: number; ratioStr: string }>;
}

/**
 * Analyzes harmonic consonance, acoustic smoothness, and interval purity of a resolved chord.
 */
export function analyzeChordConsonance(notes: ResolvedChordNote[], _chordName?: string): ConsonanceAnalysis {
    void _chordName;
    if (!notes || notes.length < 2) {
        return {
            score: 100,
            rating: 'PURE_RESONANCE',
            label: '100% Pure Unison',
            description: 'Fundamental acoustic unity with zero intermodulation.',
            intervals: []
        };
    }

    const sorted = [...notes].sort((a, b) => a.freq - b.freq);
    const fundamental = sorted[0].freq;
    let scoreTotal = 0;
    const intervalItems: Array<{ name: string; centsDiff: number; ratioStr: string }> = [];

    // Evaluate each voice against the fundamental
    for (let i = 1; i < sorted.length; i++) {
        const ratio = sorted[i].freq / fundamental;
        const semitonesRaw = 12 * Math.log2(ratio);
        const semitoneInOctave = Math.round(((semitonesRaw % 12) + 12) % 12);
        const centsDeviation = Math.round((semitonesRaw - Math.round(semitonesRaw)) * 100);

        let itemScore = 80;
        let intName = 'Interval';
        let ratioStr = 'n/a';

        switch (semitoneInOctave) {
            case 0: // Octave / Unison
                itemScore = 100;
                intName = 'Pure Octave (2:1)';
                ratioStr = '2/1';
                break;
            case 7: // Perfect 5th
                itemScore = 96;
                intName = 'Perfect 5th (3:2)';
                ratioStr = '3/2';
                break;
            case 4: // Major 3rd
                itemScore = 92;
                intName = 'Major 3rd (5:4)';
                ratioStr = '5/4';
                break;
            case 3: // Minor 3rd
                itemScore = 88;
                intName = 'Minor 3rd (6:5)';
                ratioStr = '6/5';
                break;
            case 9: // Major 6th
                itemScore = 90;
                intName = 'Major 6th (5:3)';
                ratioStr = '5/3';
                break;
            case 8: // Minor 6th
                itemScore = 85;
                intName = 'Minor 6th (8:5)';
                ratioStr = '8/5';
                break;
            case 5: // Perfect 4th
                itemScore = 86;
                intName = 'Perfect 4th (4:3)';
                ratioStr = '4/3';
                break;
            case 2: // Major 2nd / 9th
                itemScore = 82;
                intName = 'Major 9th / 2nd (9:8)';
                ratioStr = '9/8';
                break;
            case 11: // Major 7th
                itemScore = 78;
                intName = 'Major 7th (15:8)';
                ratioStr = '15/8';
                break;
            case 10: // Minor 7th
                itemScore = 82;
                intName = 'Minor 7th (9:5 / 7:4)';
                ratioStr = '9/5';
                break;
            case 6: // Tritone / #11
                itemScore = 60;
                intName = 'Tritone / #11 (45:32)';
                ratioStr = '45/32';
                break;
            case 1: // Minor 2nd / b9
                itemScore = 55;
                intName = 'Minor 2nd (16:15)';
                ratioStr = '16/15';
                break;
            default:
                itemScore = 75;
                intName = 'Microtonal / Color';
                ratioStr = '~';
        }

        scoreTotal += itemScore;
        intervalItems.push({
            name: `${sorted[i].note} (${intName})`,
            centsDiff: centsDeviation,
            ratioStr
        });
    }

    const avgScore = Math.round(scoreTotal / (sorted.length - 1));

    let rating: ConsonanceAnalysis['rating'] = 'CONSONANT';
    let label = `${avgScore}% Consonant`;
    let description = 'Harmonic balance with gentle warmth.';

    if (avgScore >= 92) {
        rating = 'PURE_RESONANCE';
        label = `${avgScore}% Pure Resonance`;
        description = 'Acoustically beatless harmony with crystalline overtone lock.';
    } else if (avgScore >= 84) {
        rating = 'CONSONANT';
        label = `${avgScore}% Lush Consonance`;
        description = 'Rich, serene stability with organic warmth.';
    } else if (avgScore >= 76) {
        rating = 'LYRICAL_WARMTH';
        label = `${avgScore}% Lyrical Warmth`;
        description = 'Extended modal color supporting heart-centered reflection.';
    } else if (avgScore >= 66) {
        rating = 'EXPRESSIVE_TENSION';
        label = `${avgScore}% Expressive Tension`;
        description = 'Deliberate harmonic anticipation awaiting meditative resolution.';
    } else {
        rating = 'ALTERED_COLOR';
        label = `${avgScore}% Altered Mystic`;
        description = 'High chromatic tension exploring deep subconscious states.';
    }

    return {
        score: avgScore,
        rating,
        label,
        description,
        intervals: intervalItems
    };
}

/**
 * Generates the next chord index using musical Markov-style harmonic branching.
 * Allows organic wandering through the mood's progression without rigid monotonic looping.
 */
export function getNextGenerativeChordIndex(currentIndex: number, totalChords: number, _mood?: MusicalMood): number {
    void _mood;
    if (totalChords <= 1) return 0;
    if (totalChords === 2) return (currentIndex + 1) % 2;

    const rand = Math.random();

    // Harmonic branching weights:
    // 60% chance: Step forward to the next sequential chord (smooth melodic flow)
    // 25% chance: Step forward by 2 chords or skip to relative resolution
    // 15% chance: Return to chord 0 (tonic grounding / resolution)
    if (currentIndex === totalChords - 1) {
        // At the end of the phrase, 80% chance to resolve to tonic (0), 20% to linger on penultimate chord
        return rand < 0.8 ? 0 : totalChords - 2;
    }

    if (rand < 0.60) {
        return (currentIndex + 1) % totalChords;
    } else if (rand < 0.85) {
        return (currentIndex + 2) % totalChords;
    } else {
        // Return to tonic root
        return 0;
    }
}

