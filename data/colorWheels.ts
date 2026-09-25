/**
 * Color Wheel & Harmonic Color Palette System
 * Designer-grade chromatic mappings for musical pitch classes & visualizers.
 */

export type HarmonicColorWheelId = 
  // Scientific & Acoustic
  | 'MERRICK'          // Richard Merrick's Harmonic Interference Wheel (Fifths as Complements)
  | 'NEWTON'           // Sir Isaac Newton's Opticks Spectrum (Solar Octave)
  | 'CASTEL_BAROQUE'   // Father Louis-Bertrand Castel's 1734 Clavecin Oculaire
  // Synesthetic & Art History
  | 'SCRIABIN'         // Alexander Scriabin's Prometheus Synesthetic System
  | 'BAUHAUS_KANDINSKY'// Wassily Kandinsky & Bauhaus Weimar 1919 Color-Tone Matrix
  | 'GOETHE'           // Johann Wolfgang von Goethe's Theory of Colours (Emotional / Polar)
  // Meditative & Sacred Mineral
  | 'VEDIC_CHAKRA'     // Traditional 7-Ray Vedic & Kundalini Energy Centers
  | 'WABI_SABI'        // Japanese Wabi-Sabi, Sumi Ink, Matcha & Bengara Earth Minerals
  | 'ASTRAL_QUARTZ'    // Prismatic Crystal Refraction, Celestite & Angel Aura Opal
  // Atmospheric & Nature
  | 'NORDIC_BOREALIS'  // Aurora Borealis 557nm Oxygen & 391nm Nitrogen Plasma
  | 'ABYSSAL_OCEAN'    // Hadopelagic Abyss & Bioluminescent Marine Luciferin
  | 'DESERT_OCHRE'     // Sedona Red Rock, Adobe Terracotta & High-Desert Turquoise
  | 'FLORAL_GAIA'      // Living Botanical Chlorophyll, Orchid & Photosynthetic Harmonics
  // Modern & Architectural
  | 'CYBER_NEON'       // Cyberpunk High-Contrast Electric Spectrum
  | 'SYNTHWAVE_1984'   // Miami Sunset 1984 Retrowave & Laser Grid
  | 'SOLAR_ALCH'       // Alchemical Gold, Solar Flare & Radiant Amber
  | 'COSMIC_DUSK'      // Deep Twilight & Ethereal Bioluminescent Obsidian
  | 'MONO_PLATINUM';   // Architectural Platinum, Liquid Mercury & Obsidian Monolith

export type ColorWheelCategory = 'Scientific' | 'Synesthetic' | 'Meditative' | 'Atmospheric' | 'Modern';

export interface ColorWheelPreset {
  id: HarmonicColorWheelId;
  name: string;
  subtitle: string;
  category: ColorWheelCategory;
  description: string;
  // 12 chromatic semitone colors starting from C (index 0) through B (index 11)
  // [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
  colors: [string, string, string, string, string, string, string, string, string, string, string, string];
  // 12 Hues in degrees [0-360] for smooth interpolation
  hues: [number, number, number, number, number, number, number, number, number, number, number, number];
  tags: string[];
}

export const CHROMATIC_NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

export const COLOR_WHEEL_PRESETS: Record<HarmonicColorWheelId, ColorWheelPreset> = {
  MERRICK: {
    id: 'MERRICK',
    name: 'Merrick Interference',
    subtitle: 'Harmonic Interference Theory',
    category: 'Scientific',
    description: 'Polar harmonic mapping placing musical fifths as visual complements across the color circle.',
    // [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
    colors: [
      '#00ffff', '#0077ff', '#0000ff', '#7700ff', '#ff00ff', '#ff0000',
      '#ff4400', '#ff8800', '#ffbb00', '#ffff00', '#88ff00', '#00ff88'
    ],
    hues: [180, 210, 240, 270, 300, 360, 15, 30, 45, 60, 90, 135],
    tags: ['Harmonic', 'Acoustic', 'Scientific']
  },
  NEWTON: {
    id: 'NEWTON',
    name: 'Newton Opticks',
    subtitle: '1704 Prismatic Spectrum',
    category: 'Scientific',
    description: "Sir Isaac Newton's historical mapping aligning the Dorian musical octave directly to the optical prism rainbow.",
    colors: [
      '#e60000', '#ff4d00', '#ff8c00', '#ffb700', '#ffee00', '#22c55e',
      '#06b6d4', '#2563eb', '#3b82f6', '#4f46e5', '#7c3aed', '#9333ea'
    ],
    hues: [0, 18, 33, 43, 55, 142, 189, 217, 217, 244, 263, 271],
    tags: ['Prismatic', 'Historical', 'Classical']
  },
  CASTEL_BAROQUE: {
    id: 'CASTEL_BAROQUE',
    name: 'Castel Ocular',
    subtitle: '1734 Clavecin Oculaire',
    category: 'Scientific',
    description: "Father Louis-Bertrand Castel's Enlightenment color organ uniting Rameau's harmony with classic French academy pigments.",
    colors: [
      '#2563eb', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316',
      '#ea580c', '#dc2626', '#be123c', '#7c3aed', '#9333ea', '#1d4ed8'
    ],
    hues: [217, 173, 142, 84, 48, 25, 22, 0, 345, 263, 271, 224],
    tags: ['Historical', 'Baroque', 'Color Organ']
  },
  SCRIABIN: {
    id: 'SCRIABIN',
    name: 'Scriabin Synesthesia',
    subtitle: 'Prometheus Clavier à Lumières',
    category: 'Synesthetic',
    description: "Russian mystic composer Alexander Scriabin's celebrated circle-of-fifths synesthetic color organ.",
    colors: [
      '#dc2626', '#818cf8', '#facc15', '#a855f7', '#f8fafc', '#991b1b',
      '#38bdf8', '#f97316', '#e0e7ff', '#16a34a', '#c084fc', '#475569'
    ],
    hues: [0, 235, 48, 271, 210, 0, 199, 25, 230, 142, 279, 215],
    tags: ['Synesthetic', 'Mystic', 'Orchestral']
  },
  BAUHAUS_KANDINSKY: {
    id: 'BAUHAUS_KANDINSKY',
    name: 'Bauhaus & Kandinsky',
    subtitle: '1919 Weimar Form & Timbre',
    category: 'Synesthetic',
    description: "Wassily Kandinsky's synesthetic timbre theories: energetic trumpet yellow, deep organ blue, scarlet violins, and balanced geometric purity.",
    colors: [
      '#facc15', '#fb923c', '#ef4444', '#dc2626', '#a855f7', '#7c3aed',
      '#1d4ed8', '#1e40af', '#059669', '#10b981', '#34d399', '#fde047'
    ],
    hues: [48, 28, 0, 350, 271, 263, 224, 220, 160, 152, 156, 54],
    tags: ['Modernist', 'Bauhaus', 'Primary']
  },
  GOETHE: {
    id: 'GOETHE',
    name: 'Goethe Emotional',
    subtitle: 'Polarity & Human Experience',
    category: 'Synesthetic',
    description: 'Johann Wolfgang von Goethe’s warm/cool polarities, emphasizing emotional resonance, warmth, and depth.',
    colors: [
      '#f59e0b', '#fb923c', '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
      '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#84cc16'
    ],
    hues: [38, 28, 350, 330, 292, 271, 239, 217, 199, 173, 161, 84],
    tags: ['Emotional', 'Designer', 'Warmth']
  },
  VEDIC_CHAKRA: {
    id: 'VEDIC_CHAKRA',
    name: 'Vedic Kundalini',
    subtitle: '7-Ray Subtle Body Spectrum',
    category: 'Meditative',
    description: 'Sacred energy center progression from Muladhara Root red to Sahasrara Crown transcendental violet and diamond white.',
    colors: [
      '#ef4444', '#f97316', '#fbbf24', '#fef08a', '#22c55e', '#10b981',
      '#06b6d4', '#0284c7', '#6366f1', '#8b5cf6', '#a855f7', '#f1f5f9'
    ],
    hues: [0, 25, 43, 53, 142, 161, 189, 201, 239, 258, 271, 210],
    tags: ['Meditative', 'Chakras', 'Sacred']
  },
  WABI_SABI: {
    id: 'WABI_SABI',
    name: 'Wabi-Sabi Zen',
    subtitle: 'Sumi Ink & Japanese Earth Tones',
    category: 'Meditative',
    description: 'Understated shibui aesthetics: roasted iron bengara red, aged copper patina rokusho, matcha green, and mountain mist indigo.',
    colors: [
      '#4d7c0f', '#65a30d', '#0d9488', '#1e3a8a', '#312e81', '#581c87',
      '#831843', '#991b1b', '#c2410c', '#b45309', '#a16207', '#3f6212'
    ],
    hues: [84, 84, 173, 224, 243, 275, 333, 0, 17, 27, 37, 84],
    tags: ['Organic', 'Zen', 'Earth Minerals']
  },
  ASTRAL_QUARTZ: {
    id: 'ASTRAL_QUARTZ',
    name: 'Astral Quartz',
    subtitle: 'Celestite & Angel Aura Opal',
    category: 'Meditative',
    description: 'Luminous optical crystal refraction: celestite pastel blue, rainbow moonstone flashes, rose quartz blush, and starlight facets.',
    colors: [
      '#38bdf8', '#7dd3fc', '#67e8f9', '#a7f3d0', '#fef08a', '#fde047',
      '#fbcfe8', '#f472b6', '#e879f9', '#c084fc', '#a5b4fc', '#e2e8f0'
    ],
    hues: [199, 199, 187, 152, 53, 54, 325, 330, 291, 279, 230, 215],
    tags: ['Prismatic', 'Pastel', 'Crystalline']
  },
  NORDIC_BOREALIS: {
    id: 'NORDIC_BOREALIS',
    name: 'Nordic Borealis',
    subtitle: '557nm Oxygen & Nitrogen Plasma',
    category: 'Atmospheric',
    description: 'Spectral atmospheric aurora: vibrant 557nm atomic oxygen emerald, 391nm nitrogen purple, fjord azure, and arctic ice sheen.',
    colors: [
      '#10b981', '#34d399', '#22d3ee', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#c084fc', '#f472b6', '#fb7185', '#fde047', '#6ee7b7'
    ],
    hues: [152, 156, 189, 199, 217, 239, 258, 279, 330, 350, 54, 156],
    tags: ['Atmospheric', 'Polar', 'Luminescence']
  },
  ABYSSAL_OCEAN: {
    id: 'ABYSSAL_OCEAN',
    name: 'Hadopelagic Abyss',
    subtitle: 'Mariana Trench Bioluminescence',
    category: 'Atmospheric',
    description: 'Deep ocean trench darkness glowing with cold luciferin sapphire, siphonophore aqua, lanternfish phosphorus, and hydrothermal bronze.',
    colors: [
      '#06b6d4', '#0891b2', '#0284c7', '#1d4ed8', '#1e1b4b', '#4c1d95',
      '#701a75', '#9f1239', '#d97706', '#ca8a04', '#16a34a', '#14b8a6'
    ],
    hues: [189, 191, 201, 224, 243, 263, 297, 343, 33, 43, 142, 173],
    tags: ['Aquatic', 'Deep Sea', 'Bioluminescent']
  },
  DESERT_OCHRE: {
    id: 'DESERT_OCHRE',
    name: 'Desert Mirage',
    subtitle: 'Sedona Sandstone & Turquoise',
    category: 'Atmospheric',
    description: 'Ancient geological strata: Sedona red rock, sunbaked adobe clay, golden dunes, high-desert sage, and pueblo turquoise.',
    colors: [
      '#dc2626', '#ea580c', '#c2410c', '#d97706', '#f59e0b', '#ca8a04',
      '#65a30d', '#15803d', '#0d9488', '#0284c7', '#4338ca', '#be123c'
    ],
    hues: [0, 22, 17, 33, 38, 43, 84, 142, 173, 201, 239, 345],
    tags: ['Earthy', 'Warm', 'Sandstone']
  },
  FLORAL_GAIA: {
    id: 'FLORAL_GAIA',
    name: 'Gaia Botanical',
    subtitle: 'Living Chlorophyll & Bloom',
    category: 'Atmospheric',
    description: 'Living photosynthetic wavelengths: chlorophyll emerald, flowering orchid magenta, marigold nectar, and rainforest canopy.',
    colors: [
      '#10b981', '#059669', '#16a34a', '#eab308', '#f97316', '#f43f5e',
      '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#3b82f6', '#22c55e'
    ],
    hues: [152, 160, 142, 48, 25, 350, 330, 292, 271, 258, 217, 142],
    tags: ['Biophilic', 'Living Flora', 'Chlorophyll']
  },
  CYBER_NEON: {
    id: 'CYBER_NEON',
    name: 'Cyberpunk Neon',
    subtitle: 'High-Luminance Electroluminescence',
    category: 'Modern',
    description: 'Electric Tokyo nightscape with laser turquoise, hot magenta, radioactive lime, and plasma ultraviolet.',
    colors: [
      '#ff0055', '#ff00aa', '#d900ff', '#7b00ff', '#0037ff', '#00d0ff',
      '#00ffc8', '#00ff66', '#77ff00', '#f6ff00', '#ff9900', '#ff3300'
    ],
    hues: [340, 320, 291, 269, 227, 190, 167, 144, 92, 62, 36, 12],
    tags: ['Vibrant', 'Modern', 'Futuristic']
  },
  SYNTHWAVE_1984: {
    id: 'SYNTHWAVE_1984',
    name: 'Outrun 1984',
    subtitle: 'Miami Sunset & Laser Grid',
    category: 'Modern',
    description: 'Sunset retro-future aesthetic: scorching flamingo pinks, electric tangerine dusk, palm tree violet shadows, and laser cyan.',
    colors: [
      '#ff6b35', '#f75c03', '#ff007f', '#d000ff', '#7209b7', '#3a0ca3',
      '#4361ee', '#4cc9f0', '#00f5d4', '#06d6a0', '#ffd166', '#ff9f1c'
    ],
    hues: [16, 22, 330, 289, 275, 258, 229, 194, 172, 164, 42, 34],
    tags: ['Retro', 'Outrun', 'Sunset Neon']
  },
  SOLAR_ALCH: {
    id: 'SOLAR_ALCH',
    name: 'Solar Alchemical',
    subtitle: 'Golden Ratio & Corona Flame',
    category: 'Modern',
    description: 'Warm, radiant gradient of rich gold, copper, deep saffron, cinnabar, and molten brass.',
    colors: [
      '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#ea580c', '#c2410c',
      '#dc2626', '#b91c1c', '#e11d48', '#f43f5e', '#fb7185', '#fde047'
    ],
    hues: [43, 38, 33, 27, 22, 17, 0, 0, 346, 350, 350, 54],
    tags: ['Warm', 'Golden', 'Radiant']
  },
  COSMIC_DUSK: {
    id: 'COSMIC_DUSK',
    name: 'Cosmic Twilight',
    subtitle: 'Deep Bioluminescent Aurora',
    category: 'Modern',
    description: 'Luminous midnight teals, shimmering amethyst, deep ocean blues, and ethereal aurora greens.',
    colors: [
      '#38bdf8', '#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb7185',
      '#f59e0b', '#34d399', '#2dd4bf', '#22d3ee', '#60a5fa', '#a5b4fc'
    ],
    hues: [199, 235, 258, 279, 330, 350, 38, 156, 173, 189, 217, 230],
    tags: ['Relaxing', 'Ambient', 'Twilight']
  },
  MONO_PLATINUM: {
    id: 'MONO_PLATINUM',
    name: 'Obsidian & Platinum',
    subtitle: 'Architectural Liquid Metals',
    category: 'Modern',
    description: 'Pure tonal gradation through liquid mercury, forged platinum, titanium white, moonlit zinc, and polished black tourmaline.',
    colors: [
      '#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569',
      '#334155', '#1e293b', '#475569', '#64748b', '#94a3b8', '#f1f5f9'
    ],
    hues: [210, 215, 215, 215, 215, 215, 217, 222, 215, 215, 215, 210],
    tags: ['Minimalist', 'Monochrome', 'Architectural']
  }
};

export const COLOR_WHEEL_CATEGORIES: ('ALL' | ColorWheelCategory)[] = [
  'ALL',
  'Scientific',
  'Synesthetic',
  'Meditative',
  'Atmospheric',
  'Modern'
];

export const COLOR_WHEEL_ORDER: HarmonicColorWheelId[] = [
  // Scientific & Acoustic
  'MERRICK',
  'NEWTON',
  'CASTEL_BAROQUE',
  // Synesthetic & Art History
  'SCRIABIN',
  'BAUHAUS_KANDINSKY',
  'GOETHE',
  // Meditative & Sacred Mineral
  'VEDIC_CHAKRA',
  'WABI_SABI',
  'ASTRAL_QUARTZ',
  // Atmospheric & Nature
  'NORDIC_BOREALIS',
  'ABYSSAL_OCEAN',
  'DESERT_OCHRE',
  'FLORAL_GAIA',
  // Modern & Architectural
  'CYBER_NEON',
  'SYNTHWAVE_1984',
  'SOLAR_ALCH',
  'COSMIC_DUSK',
  'MONO_PLATINUM'
];

