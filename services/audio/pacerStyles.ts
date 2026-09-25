export interface PacerStyle {
    id: string;
    name: string;
    description: string;
    tag: string;
}

export interface PacerColorScheme {
    id: string;
    name: string;
    tag: string;
    accent: string;
    colors: {
        inhale: string;
        holdIn: string;
        exhale: string;
        holdOut: string;
    };
}

export const PACER_STYLES: PacerStyle[] = [
    { id: 'RING', name: 'Expanding Ring', tag: 'Concentric', description: 'Concentric breath circle expanding with respiration' },
    { id: 'GLOW', name: 'Radial Aura', tag: 'Ambient', description: 'Soft radiant ambient halo breathing outward' },
    { id: 'DOT', name: 'Pulsing Dot', tag: 'Minimal', description: 'Minimalist focal center point pulsing with breath' },
    { id: 'CHEVRON', name: 'Flow Chevron', tag: 'Directional', description: 'Directional inhale and exhale chevron vectors' },
    { id: 'HORIZON', name: 'Tidal Horizon', tag: 'Oceanic', description: 'Rising and falling ocean tide water level' },
    { id: 'VIGNETTE', name: 'Ambient Vignette', tag: 'Peripheral', description: 'Peripheral edge breathing aura framing viewport' },
    { id: 'NONE', name: 'Hidden (Audio Only)', tag: 'Stealth', description: 'Hides on-canvas visual while keeping audio pacing active' },
];

export const PACER_COLOR_SCHEMES: PacerColorScheme[] = [
    {
        id: 'CYAN_OCEAN',
        name: 'Cosmic Tide',
        tag: 'Default',
        accent: '#22d3ee',
        colors: {
            inhale: '#22d3ee',
            holdIn: '#fbbf24',
            exhale: '#60a5fa',
            holdOut: '#c084fc',
        }
    },
    {
        id: 'EMERALD_ZEN',
        name: 'Emerald Zen',
        tag: 'Healing',
        accent: '#34d399',
        colors: {
            inhale: '#34d399',
            holdIn: '#a3e635',
            exhale: '#059669',
            holdOut: '#14b8a6',
        }
    },
    {
        id: 'SUNSET_BLOOM',
        name: 'Sunset Bloom',
        tag: 'Warm',
        accent: '#fb923c',
        colors: {
            inhale: '#fb923c',
            holdIn: '#f43f5e',
            exhale: '#ec4899',
            holdOut: '#a855f7',
        }
    },
    {
        id: 'SOLAR_AMBER',
        name: 'Solar Gold',
        tag: 'Vitality',
        accent: '#facc15',
        colors: {
            inhale: '#facc15',
            holdIn: '#f59e0b',
            exhale: '#ea580c',
            holdOut: '#ca8a04',
        }
    },
    {
        id: 'AMETHYST_COSMOS',
        name: 'Amethyst Sky',
        tag: 'Intuition',
        accent: '#c084fc',
        colors: {
            inhale: '#c084fc',
            holdIn: '#e879f9',
            exhale: '#818cf8',
            holdOut: '#9333ea',
        }
    },
    {
        id: 'ICE_AURA',
        name: 'Arctic Crystal',
        tag: 'Clarity',
        accent: '#38bdf8',
        colors: {
            inhale: '#bae6fd',
            holdIn: '#38bdf8',
            exhale: '#93c5fd',
            holdOut: '#67e8f9',
        }
    },
    {
        id: 'ROSE_QUARTZ',
        name: 'Rose Quartz',
        tag: 'Compassion',
        accent: '#f472b6',
        colors: {
            inhale: '#f472b6',
            holdIn: '#fda4af',
            exhale: '#fb7185',
            holdOut: '#e11d48',
        }
    },
    {
        id: 'MONOCHROME',
        name: 'Silver Mono',
        tag: 'Minimal',
        accent: '#f8fafc',
        colors: {
            inhale: '#f8fafc',
            holdIn: '#cbd5e1',
            exhale: '#94a3b8',
            holdOut: '#64748b',
        }
    },
];

/**
 * Returns the 4 phase colors (Inhale, HoldIn, Exhale, HoldOut) and overall accent
 * based on current scheme ID and optional custom tint color.
 */
export const getPacerColors = (colorSchemeId?: string, customColor?: string) => {
    if (colorSchemeId === 'CUSTOM_COLOR' && customColor) {
        return {
            inhale: customColor,
            holdIn: '#fbbf24',
            exhale: customColor,
            holdOut: '#a855f7',
            accent: customColor,
        };
    }
    const found = PACER_COLOR_SCHEMES.find(s => s.id === colorSchemeId);
    if (found) {
        return { ...found.colors, accent: found.accent };
    }
    // Default Fallback
    return {
        inhale: '#22d3ee',
        holdIn: '#fbbf24',
        exhale: '#60a5fa',
        holdOut: '#c084fc',
        accent: '#22d3ee',
    };
};
