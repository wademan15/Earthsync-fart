import { KickConfig } from './AudioTypes';

export interface KickPreset { id: string; name: string; config: KickConfig; }

export const DEFAULT_KICK_CONFIG: KickConfig = { 
    freq: 48,
    decay: 0.35,
    attack: 0.01,
    drive: 1.0,
    type: 'SINE',
    waveType: 'sine', 
    baseFreq: 48, 
    pitchStart: 110, 
    pitchDecay: 0.07, 
    ampAttack: 0.01, 
    ampDecay: 0.35, 
    clickLevel: 0.08, 
    lpfCutoff: 160, 
    saturation: 15,
    syncMode: 'BREATH',
    doubleBeat: true,
    bpm: 60
};

export const DEFAULT_KICK_PRESETS: KickPreset[] = [
    { id: 'cardiac_thud', name: 'Cardiac Thud (RSA)', config: { ...DEFAULT_KICK_CONFIG, syncMode: 'BREATH', doubleBeat: true, bpm: 60 } },
    { id: 'binaural_lock', name: 'Binaural Phase Lock', config: { ...DEFAULT_KICK_CONFIG, syncMode: 'BINAURAL', doubleBeat: true, bpm: 60 } },
    { id: 'vagal_deep', name: 'Vagal Deep Tone', config: { ...DEFAULT_KICK_CONFIG, baseFreq: 40, freq: 40, lpfCutoff: 120, saturation: 25, syncMode: 'BREATH', doubleBeat: false, bpm: 48 } },
    { id: 'steady_75bpm', name: 'Active Flow (75 BPM)', config: { ...DEFAULT_KICK_CONFIG, baseFreq: 52, freq: 52, syncMode: 'STEADY', doubleBeat: true, bpm: 75 } }
];

export interface HeartbeatPresetOption {
    id: string;
    name: string;
    tag: string;
    description: string;
    syncMode: 'BREATH' | 'BREATH_COUNT' | 'BINAURAL' | 'STEADY';
    syncToSeconds?: boolean;
    doubleBeat: boolean;
    baseFreq: number;
    decay: number;
    bpm?: number;
}

export interface HeartColorScheme {
    id: string;
    name: string;
    tag: string;
    accent: string;
    glow: string;
}

export const HEARTBEAT_PRESET_OPTIONS: HeartbeatPresetOption[] = [
    {
        id: 'breath_count_1s',
        name: 'Second Count (1s Sync)',
        tag: 'Turnaround Sync',
        description: '1 beat per second synced with breath turnarounds (5 beats on 5s inhale, 5 beats on 5s exhale)',
        syncMode: 'BREATH_COUNT',
        syncToSeconds: true,
        doubleBeat: true,
        baseFreq: 48,
        decay: 0.35,
        bpm: 60,
    },
    {
        id: 'cardiac_thud',
        name: 'Cardiac Thud (RSA)',
        tag: 'Respiration Sync',
        description: 'Synchronized with respiratory sinus arrhythmia wave (speeds up on inhale, slows on exhale)',
        syncMode: 'BREATH',
        doubleBeat: true,
        baseFreq: 48,
        decay: 0.35,
        bpm: 60,
    },
    {
        id: 'binaural_lock',
        name: 'Binaural Phase Lock',
        tag: 'Entrainment',
        description: 'Locked directly to the binaural beat frequency cadence',
        syncMode: 'BINAURAL',
        doubleBeat: true,
        baseFreq: 48,
        decay: 0.35,
        bpm: 60,
    },
    {
        id: 'vagal_deep',
        name: 'Vagal Deep Tone',
        tag: 'Parasympathetic',
        description: 'Deep 40Hz sub-audible vagus nerve resonance pulse at deep 48 BPM',
        syncMode: 'BREATH',
        doubleBeat: false,
        baseFreq: 40,
        decay: 0.45,
        bpm: 48,
    },
    {
        id: 'steady_60bpm',
        name: 'Metronomic 60 BPM',
        tag: 'Coherence',
        description: 'Steady 1.0 Hz constant cardiac anchor pulse',
        syncMode: 'STEADY',
        doubleBeat: true,
        baseFreq: 48,
        decay: 0.35,
        bpm: 60,
    },
    {
        id: 'steady_75bpm',
        name: 'Active Flow 75 BPM',
        tag: 'Cardio Tempo',
        description: 'Uplifting 75 BPM natural rhythmic pulse',
        syncMode: 'STEADY',
        doubleBeat: true,
        baseFreq: 52,
        decay: 0.30,
        bpm: 75,
    },
];

export const HEART_COLOR_SCHEMES: HeartColorScheme[] = [
    {
        id: 'ROSE_LOVE',
        name: 'Rose Pulse',
        tag: 'Heart Chakra',
        accent: '#fb7185',
        glow: 'rgba(251, 113, 133, 0.5)',
    },
    {
        id: 'RUBY_CARDIO',
        name: 'Crimson Ruby',
        tag: 'Vitality',
        accent: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.5)',
    },
    {
        id: 'EMERALD_ANAHATA',
        name: 'Emerald Anahata',
        tag: 'Balance',
        accent: '#34d399',
        glow: 'rgba(52, 211, 153, 0.5)',
    },
    {
        id: 'VIOLET_BLISS',
        name: 'Amethyst Pulse',
        tag: 'Transcendence',
        accent: '#c084fc',
        glow: 'rgba(192, 132, 252, 0.5)',
    },
    {
        id: 'GOLDEN_SOLAR',
        name: 'Golden Core',
        tag: 'Radiance',
        accent: '#facc15',
        glow: 'rgba(250, 204, 21, 0.5)',
    },
    {
        id: 'CYAN_TIDE',
        name: 'Ocean Flow',
        tag: 'Calm',
        accent: '#22d3ee',
        glow: 'rgba(34, 211, 238, 0.5)',
    },
    {
        id: 'WHITE_LOTUS',
        name: 'Pure Opal',
        tag: 'Minimal',
        accent: '#f8fafc',
        glow: 'rgba(248, 250, 252, 0.5)',
    },
];

export const getHeartColor = (colorSchemeId?: string, customColor?: string): string => {
    if (colorSchemeId === 'CUSTOM_COLOR' && customColor) {
        return customColor;
    }
    const found = HEART_COLOR_SCHEMES.find(s => s.id === colorSchemeId);
    return found?.accent || '#fb7185';
};
