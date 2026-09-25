import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS } from './shared';
import { FluidEngineGL } from '../../../services/kinematics/FluidEngineGL';
import {
    getFrequencyRGB,
    getActiveColorWheelId,
    COLOR_WHEEL_PRESETS,
    type HarmonicColorWheelId
} from '../../../services/kinematics/color';

// ── Numeric & String Sanitizers ───────────────────────────────────────────────
const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const getStr = (v: unknown, fallback: string): string => {
    if (v === undefined || v === null || v === '') return fallback;
    return String(v);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    if (!hex) return { r: 0.02, g: 0.04, b: 0.08 };
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return { r: 0.02, g: 0.04, b: 0.08 };
    return {
        r: parseInt(clean.slice(0, 2), 16) / 255,
        g: parseInt(clean.slice(2, 4), 16) / 255,
        b: parseInt(clean.slice(4, 6), 16) / 255
    };
};

// ── Frequency & Tone Resolution ───────────────────────────────────────────────
const CHANNEL_FREQ_MAP: Map<string, number> = new Map();
LATTICE_CHANNELS.forEach(ch => {
    if (ch.id && ch.freq) {
        CHANNEL_FREQ_MAP.set(ch.id, ch.freq);
    }
});

const resolveChannelFreq = (channelId: string, indexFallback: number, customFreqs?: Record<string, number>): number => {
    if (customFreqs && customFreqs[channelId]) {
        return customFreqs[channelId];
    }
    if (CHANNEL_FREQ_MAP.has(channelId)) {
        return CHANNEL_FREQ_MAP.get(channelId)!;
    }
    const match = channelId.match(/\d+(\.\d+)?/);
    if (match) {
        const num = parseFloat(match[0]);
        if (num >= 0.5 && num <= 20000) return num;
    }
    const solfeggio = [256, 384, 432, 528, 639, 741, 852, 963, 512, 136.1];
    return solfeggio[indexFallback % solfeggio.length];
};

interface ActiveToneInfo {
    channelId: string;
    freq: number;
    amp: number;
    r: number;
    g: number;
    b: number;
}

// ── Gas Chamber Visual Presets ────────────────────────────────────────────────
const PRESETS: VisualizerPreset[] = [
    {
        id: 'sbsl_argon_celestial',
        name: '01. Argon Celestial Core (Oceanic Zen)',
        config: {
            gasType: 'ARGON',
            colorMode: 'Tone Harmonic',
            colorWheel: 'ACTIVE_WHEEL',
            bremsstrahlungGlow: 2.8,
            acousticStreaming: 2.6,
            vanDerWaalsCore: 0.12,
            lensStrength: 0.60,
            modalDeform: 0.9,
            tailTrail: 0.988,
            velocityDissipation: 0.04,
            pressure: 0.94,
            curl: 1.0,
            glowIntensity: 0.50,
            edgeSoftness: 0.88,
            causticIntensity: 0.85,
            bubbleFluidImpulse: 1.0,
            backColor: '#010814',
            dyeColor1: '#00d2ff',
            dyeColor2: '#3a7bd5',
            dyeColor3: '#ffffff',
            dyeLuminosity: 0.04,
            splatRadius: 0.08,
            masterOpacity: 1.0,
            visualScale: 1.0
        },
        modulations: {
            bremsstrahlungGlow: { enabled: true, min: 1.8, max: 3.6, amtBinaural: 0.8, mixMode: 'ADD' },
            acousticStreaming:  { enabled: true, min: 1.2, max: 3.8, amtHeart: 0.7, mixMode: 'ADD' },
            glowIntensity:      { enabled: true, min: 0.3, max: 0.75, amtCoh: 0.6, mixMode: 'ADD' }
        }
    },
    {
        id: 'sbsl_xenon_amethyst',
        name: '02. Xenon Amethyst Singularity',
        config: {
            gasType: 'XENON',
            colorMode: 'Tone Harmonic',
            colorWheel: 'ACTIVE_WHEEL',
            bremsstrahlungGlow: 3.0,
            acousticStreaming: 2.5,
            vanDerWaalsCore: 0.16,
            lensStrength: 0.62,
            modalDeform: 1.0,
            tailTrail: 0.990,
            velocityDissipation: 0.035,
            pressure: 0.95,
            curl: 1.0,
            glowIntensity: 0.52,
            edgeSoftness: 0.88,
            causticIntensity: 0.85,
            bubbleFluidImpulse: 1.0,
            backColor: '#05010d',
            dyeColor1: '#a855f7',
            dyeColor2: '#6366f1',
            dyeColor3: '#f43f5e',
            dyeLuminosity: 0.04,
            splatRadius: 0.08,
            masterOpacity: 1.0,
            visualScale: 1.0
        },
        modulations: {
            bremsstrahlungGlow: { enabled: true, min: 2.0, max: 3.8, amtBinaural: 0.85, mixMode: 'ADD' },
            acousticStreaming:  { enabled: true, min: 1.2, max: 3.6, amtHeart: 0.75, mixMode: 'ADD' }
        }
    },
    {
        id: 'sbsl_deep_delta_breath',
        name: '03. Deep Delta Cavitation (Meditative Breath)',
        config: {
            gasType: 'DELTA_DEEP',
            colorMode: 'Tone Harmonic',
            colorWheel: 'ACTIVE_WHEEL',
            bremsstrahlungGlow: 2.5,
            acousticStreaming: 2.0,
            vanDerWaalsCore: 0.08,
            lensStrength: 0.55,
            modalDeform: 0.75,
            tailTrail: 0.994,
            velocityDissipation: 0.03,
            pressure: 0.96,
            curl: 0.8,
            glowIntensity: 0.45,
            edgeSoftness: 0.90,
            causticIntensity: 0.80,
            bubbleFluidImpulse: 0.9,
            backColor: '#010c0e',
            dyeColor1: '#06b6d4',
            dyeColor2: '#0f766e',
            dyeColor3: '#e0f2fe',
            dyeLuminosity: 0.035,
            splatRadius: 0.09,
            masterOpacity: 1.0,
            visualScale: 1.1
        },
        modulations: {
            bremsstrahlungGlow: { enabled: true, min: 1.5, max: 3.2, amtBreath: 1.0, mixMode: 'ADD' },
            tailTrail:          { enabled: true, min: 0.95, max: 0.998, amtHeart: 0.7, mixMode: 'ADD' }
        }
    },
    {
        id: 'sbsl_cryo_aquamarine',
        name: '04. Cryogenic Sapphire Chamber',
        config: {
            gasType: 'CRYO',
            colorMode: 'Tone Harmonic',
            colorWheel: 'ACTIVE_WHEEL',
            bremsstrahlungGlow: 3.0,
            acousticStreaming: 2.8,
            vanDerWaalsCore: 0.14,
            lensStrength: 0.62,
            modalDeform: 1.0,
            tailTrail: 0.986,
            velocityDissipation: 0.05,
            pressure: 0.93,
            curl: 1.1,
            glowIntensity: 0.50,
            edgeSoftness: 0.88,
            causticIntensity: 0.85,
            bubbleFluidImpulse: 1.0,
            backColor: '#010810',
            dyeColor1: '#38bdf8',
            dyeColor2: '#2dd4bf',
            dyeColor3: '#ffffff',
            dyeLuminosity: 0.04,
            splatRadius: 0.08,
            masterOpacity: 1.0,
            visualScale: 1.0
        },
        modulations: {
            bremsstrahlungGlow: { enabled: true, min: 1.8, max: 3.8, amtBinaural: 0.8, mixMode: 'ADD' }
        }
    },
    {
        id: 'sbsl_solar_singularity',
        name: '05. Solar Cavitation Star',
        config: {
            gasType: 'SOLAR',
            colorMode: 'Tone Harmonic',
            colorWheel: 'ACTIVE_WHEEL',
            bremsstrahlungGlow: 3.2,
            acousticStreaming: 2.8,
            vanDerWaalsCore: 0.20,
            lensStrength: 0.65,
            modalDeform: 1.1,
            tailTrail: 0.988,
            velocityDissipation: 0.04,
            pressure: 0.95,
            curl: 1.0,
            glowIntensity: 0.55,
            edgeSoftness: 0.88,
            causticIntensity: 0.90,
            bubbleFluidImpulse: 1.1,
            backColor: '#080300',
            dyeColor1: '#f59e0b',
            dyeColor2: '#ef4444',
            dyeColor3: '#fef08a',
            dyeLuminosity: 0.045,
            splatRadius: 0.08,
            masterOpacity: 1.0,
            visualScale: 1.0
        },
        modulations: {
            bremsstrahlungGlow: { enabled: true, min: 2.0, max: 4.0, amtBinaural: 0.9, mixMode: 'ADD' },
            acousticStreaming:  { enabled: true, min: 1.5, max: 3.8, amtHeart: 0.8, mixMode: 'ADD' }
        }
    }
];

// ── Visualizer Cartridge Definition ───────────────────────────────────────────
export const Lens_Sonoluminescence: VisualizerPlugin = {
    id: 'SONOLUMINESCENCE',
    name: 'Sonoluminescence (Acoustic Cavitation)',
    renderType: 'WEBGL',

    parameters: [
        // ── HARMONIC COLOR WHEEL & TONES ───────────────────────────────────────
        { id: 'colorMode',            label: 'Color Mode',                          icon: 'Palette',  type: 'SELECT', options: ['Tone Harmonic', 'Color Wheel Triad', 'Custom Gas Dye'], section: 'HARMONICS', defaultValue: 'Tone Harmonic' },
        { id: 'colorWheel',           label: 'Harmonic Color Wheel',                icon: 'Sun',      type: 'SELECT', options: ['ACTIVE_WHEEL', 'MERRICK', 'NEWTON', 'CASTEL_BAROQUE', 'SCRIABIN', 'BAUHAUS_KANDINSKY', 'GOETHE', 'VEDIC_CHAKRA', 'WABI_SABI', 'ASTRAL_QUARTZ', 'NORDIC_BOREALIS', 'ABYSSAL_OCEAN', 'DESERT_OCHRE', 'FLORAL_GAIA', 'CYBER_NEON', 'SYNTHWAVE_1984', 'SOLAR_ALCH', 'COSMIC_DUSK', 'MONO_PLATINUM'], section: 'HARMONICS', defaultValue: 'ACTIVE_WHEEL' },
        { id: 'dyeLuminosity',        label: 'Sonochemical Liquid Tracer',          icon: 'Sparkles', type: 'SLIDER', min: 0.01, max: 0.25, step: 0.005, color: '#e879f9', section: 'HARMONICS', defaultValue: 0.04 },

        // ── CAVITATION BUBBLE DYNAMICS ─────────────────────────────────────────
        { id: 'bremsstrahlungGlow',   label: 'Core Luminescence ("Star in a Jar")', icon: 'Sun',      type: 'SLIDER', min: 0.5, max: 4.0, step: 0.1, color: '#38bdf8', section: 'CAVITATION', defaultValue: 2.8 },
        { id: 'acousticStreaming',    label: 'Acoustic Fluid Streaming',           icon: 'Wind',     type: 'SLIDER', min: 0.5, max: 6.0, step: 0.1, color: '#06b6d4', section: 'CAVITATION', defaultValue: 2.6 },
        { id: 'vanDerWaalsCore',      label: 'Gas Incompressible Core',             icon: 'Minimize', type: 'SLIDER', min: 0.05, max: 0.30, step: 0.01, color: '#818cf8', section: 'CAVITATION', defaultValue: 0.12 },
        { id: 'lensStrength',         label: 'Bubble Optical Refraction / Lens',    icon: 'Eye',      type: 'SLIDER', min: 0.1, max: 1.2, step: 0.02, color: '#38bdf8', section: 'CAVITATION', defaultValue: 0.60 },
        { id: 'edgeSoftness',         label: 'Bubble Edge Softness / Fade',         icon: 'Feather',  type: 'SLIDER', min: 0.0, max: 1.0, step: 0.02, color: '#a78bfa', section: 'CAVITATION', defaultValue: 0.88 },
        { id: 'causticIntensity',     label: 'Liquid Caustics',                     icon: 'Waves',    type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#38bdf8', section: 'CAVITATION', defaultValue: 0.85 },
        { id: 'modalDeform',          label: 'Tone Surface Harmonics (Modes 2-5)',  icon: 'Activity', type: 'SLIDER', min: 0.2, max: 2.5, step: 0.05, color: '#ec4899', section: 'CAVITATION', defaultValue: 0.90 },

        // ── FLUID DYNAMICS ────────────────────────────────────────────────────
        { id: 'bubbleFluidImpulse',   label: 'Acoustic Shockwave Impulse',          icon: 'Wind',     type: 'SLIDER', min: 0.0, max: 3.0, step: 0.1, color: '#06b6d4', section: 'FLUID DYNAMICS', defaultValue: 1.0 },
        { id: 'curl',                 label: 'Acoustic Vortex Curl',                icon: 'RefreshCw',type: 'SLIDER', min: 0.5, max: 3.0, step: 0.1, color: '#10b981', section: 'FLUID DYNAMICS', defaultValue: 1.0 },
        { id: 'tailTrail',            label: 'Fluid Dye Persistence',               icon: 'Droplet',  type: 'SLIDER', min: 0.90, max: 0.998, step: 0.002, color: '#2dd4bf', section: 'FLUID DYNAMICS', defaultValue: 0.988 },
        { id: 'glowIntensity',        label: 'Optical Aura & Bloom',                icon: 'Zap',      type: 'SLIDER', min: 0.1, max: 1.2, step: 0.05, color: '#facc15', section: 'FLUID DYNAMICS', defaultValue: 0.50 },

        // ── CUSTOM DYES & THEME ───────────────────────────────────────────────
        { id: 'gasType',              label: 'Noble Gas Cavitation Regime',         icon: 'Activity', type: 'SELECT', options: ['ARGON', 'XENON', 'DELTA_DEEP', 'CRYO', 'SOLAR'], section: 'CHAMBER', defaultValue: 'ARGON' },
        { id: 'dyeColor1',            label: 'Custom Primary Dye',                  icon: 'Palette',  type: 'COLOR',  section: 'CHAMBER', defaultValue: '#00d2ff' },
        { id: 'dyeColor2',            label: 'Custom Secondary Dye',                icon: 'Palette',  type: 'COLOR',  section: 'CHAMBER', defaultValue: '#3a7bd5' },
        { id: 'dyeColor3',            label: 'Custom Cavitation Tint',              icon: 'Palette',  type: 'COLOR',  section: 'CHAMBER', defaultValue: '#ffffff' },
        { id: 'masterOpacity',        label: 'Master Opacity',                      type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'visualScale',          label: 'Visual Scale',                        type: 'SLIDER', min: 0.5, max: 2.0, step: 0.05, section: 'GLOBAL', defaultValue: 1.0 }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    cleanup: (context) => {
        const { memory } = context;
        if (memory.fluidEngine) {
            (memory.fluidEngine as FluidEngineGL).destroy();
            memory.fluidEngine = null;
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    },

    render: (context: LensContext, localConfig: Record<string, unknown>) => {
        const {
            gl, w, h, dt, amplitudes, memory, cx, cy, heartHarmonics
        } = context;
        if (!gl) return;

        // ── 1. One-time Fluid Engine Initialization ───────────────────────────
        if (!memory.fluidEngine) {
            memory.fluidEngine = new FluidEngineGL(gl);
        }
        if (memory.streamPhase === undefined) memory.streamPhase = 0.0;
        if (memory.smoothedAmpsMap === undefined) memory.smoothedAmpsMap = new Map<string, number>();

        const engine  = memory.fluidEngine as FluidEngineGL;
        const canvasW = gl.drawingBufferWidth;
        const canvasH = gl.drawingBufferHeight;
        if (canvasW <= 0 || canvasH <= 0) return;

        const frameDt = Math.min(dt ?? 0.016, 0.033);
        const currentTime = typeof context.time === 'number' ? context.time : performance.now() * 0.001;

        // Exact center alignment (normalized 0..1 for WebGL coordinates)
        const normCx = typeof cx === 'number' && typeof w === 'number' && w > 0 ? cx / w : 0.5;
        const normCy = typeof cy === 'number' && typeof h === 'number' && h > 0 ? 1.0 - cy / h : 0.5;
        const aspect = canvasW / canvasH;

        // ── 2. Entrainment & Harmonic Color Wheel Resolution ──────────────────
        const rawFreq = (context.binauralHz as number) || (context.effectiveBinauralBeat as number) || (context.globalBinauralBeat as number) || 7.83;
        const activeFreq = typeof rawFreq === 'number' && rawFreq > 0 ? rawFreq : 7.83;

        // Harmonic Color Wheel resolution: user override or currently active applet wheel
        const userWheelChoice = getStr(localConfig.colorWheel, 'ACTIVE_WHEEL');
        const activeWheelId: HarmonicColorWheelId = (
            userWheelChoice !== 'ACTIVE_WHEEL' && COLOR_WHEEL_PRESETS[userWheelChoice as HarmonicColorWheelId]
                ? (userWheelChoice as HarmonicColorWheelId)
                : ((context.colorWheelId as HarmonicColorWheelId) || getActiveColorWheelId())
        );
        const activeWheelPreset = COLOR_WHEEL_PRESETS[activeWheelId] || COLOR_WHEEL_PRESETS.MERRICK;
        const wheelColors = activeWheelPreset.colors || [];
        const colorMode = getStr(localConfig.colorMode, 'Tone Harmonic');

        const vanDerWaalsCore = getVal(localConfig.vanDerWaalsCore, 0.12);
        const lumGlow         = getVal(localConfig.bremsstrahlungGlow, 2.8);
        const streamForce     = getVal(localConfig.acousticStreaming, 3.5);
        const tailTrailVal    = getVal(localConfig.tailTrail, 0.988);
        const glowVal         = getVal(localConfig.glowIntensity, 0.75);
        const curlVal         = getVal(localConfig.curl, 1.4);
        const userZoom        = ((context.visualScale as number) ?? 1.0) * getVal(localConfig.visualScale, 1.0);

        // ── 3. Tone Harmonics & Audio Reactivity ──────────────────────────────
        const activeTones: ActiveToneInfo[] = [];
        let totalActiveAmp = 0;
        const smoothedAmps: Map<string, number> = memory.smoothedAmpsMap;
        const customFreqs = (context.customFrequencies as Record<string, number>) || {};
        const isAudioEnabled = context.audioEnabled !== false;

        if (isAudioEnabled && amplitudes && amplitudes.size > 0) {
            let toneIdx = 0;
            for (const [chId, rawAmp] of amplitudes.entries()) {
                const prev = smoothedAmps.get(chId) ?? 0;
                const targetAmp = Math.max(0, rawAmp);
                const next = prev + (targetAmp - prev) * Math.min(1.0, frameDt * 6.0);
                smoothedAmps.set(chId, next);

                if (next > 0.005) {
                    totalActiveAmp += next;
                    const freq = resolveChannelFreq(chId, toneIdx, customFreqs);
                    const rgb255 = getFrequencyRGB(freq, activeWheelId);
                    activeTones.push({
                        channelId: chId,
                        freq,
                        amp: next,
                        r: rgb255.r / 255,
                        g: rgb255.g / 255,
                        b: rgb255.b / 255
                    });
                }
                toneIdx++;
            }
        }

        // Heart pulse coupling (only if audio is enabled)
        if (isAudioEnabled && heartHarmonics && heartHarmonics.vols && heartHarmonics.vols.length > 0) {
            const heartPulse = heartHarmonics.vols.reduce((acc, v, idx) => acc + (heartHarmonics.mutes?.[idx] ? 0 : v), 0) / heartHarmonics.vols.length;
            totalActiveAmp += heartPulse * 0.35;
        }

        // Sort active tones by amplitude descending (strongest harmonic tone first)
        activeTones.sort((a, b) => b.amp - a.amp);

        // ── 4. Color Synthesis (Bubble Core, Meniscus Rim & Radiating Caustics)
        const fallbackPrimaryRgb   = hexToRgb(wheelColors[0] || '#00d2ff');
        const fallbackSecondaryRgb = hexToRgb(wheelColors[7 % wheelColors.length] || '#3a7bd5'); // Harmonic 5th
        const fallbackTertiaryRgb  = hexToRgb(wheelColors[4 % wheelColors.length] || '#22d3ee'); // Harmonic 3rd

        // Base entrainment frequency converted through harmonic color wheel
        const entrainmentRgb255 = getFrequencyRGB(activeFreq > 0 ? activeFreq * 32 : 136.1, activeWheelId);
        const entrainmentRgb = {
            r: entrainmentRgb255.r / 255,
            g: entrainmentRgb255.g / 255,
            b: entrainmentRgb255.b / 255
        };

        let coreColorRgb = { r: 0.25, g: 0.75, b: 1.0 };
        let rimColorRgb  = { r: 0.20, g: 0.65, b: 0.95 };
        let glowColorRgb = { r: 0.30, g: 0.70, b: 1.0 };

        if (colorMode === 'Custom Gas Dye') {
            coreColorRgb = hexToRgb(getStr(localConfig.dyeColor1, '#00d2ff'));
            rimColorRgb  = hexToRgb(getStr(localConfig.dyeColor2, '#3a7bd5'));
            glowColorRgb = hexToRgb(getStr(localConfig.dyeColor3, '#ffffff'));
        } else if (activeTones.length > 0) {
            // Dominant active tone powers the central plasma star
            coreColorRgb = { r: activeTones[0].r, g: activeTones[0].g, b: activeTones[0].b };

            // Secondary active tone (or harmonic fifth) illuminates the bubble rim & meniscus
            if (activeTones.length > 1) {
                rimColorRgb = { r: activeTones[1].r, g: activeTones[1].g, b: activeTones[1].b };
            } else {
                const fifthRgb = getFrequencyRGB(activeTones[0].freq * 1.5, activeWheelId);
                rimColorRgb = { r: fifthRgb.r / 255, g: fifthRgb.g / 255, b: fifthRgb.b / 255 };
            }

            // Tertiary active tone (or harmonic third) radiates through outward acoustic caustics
            if (activeTones.length > 2) {
                glowColorRgb = { r: activeTones[2].r, g: activeTones[2].g, b: activeTones[2].b };
            } else {
                const thirdRgb = getFrequencyRGB(activeTones[0].freq * 1.25, activeWheelId);
                glowColorRgb = { r: thirdRgb.r / 255, g: thirdRgb.g / 255, b: thirdRgb.b / 255 };
            }
        } else {
            // Idle state: Harmonious triad derived from entrainment beat & active harmonic color wheel
            coreColorRgb = entrainmentRgb;
            rimColorRgb  = fallbackSecondaryRgb;
            glowColorRgb = fallbackTertiaryRgb;
        }

        // ── 4b. Modal Surface Deformation & Acoustic Harmonic Modes ─────────
        // In SBSL, acoustic tones excite surface Faraday ripple modes on the bubble wall:
        // Mode 2 (quadrupole), Mode 3 (trefoil), Mode 4 (cross), Mode 5 (pentagram).
        const modalSensitivity = getVal(localConfig.modalDeform, 1.0);
        const toneModes: [number, number, number, number] = [0, 0, 0, 0];
        const toneFrequencies: [number, number, number, number] = [1.0, 1.5, 2.0, 2.5];

        if (activeTones.length > 0) {
            for (let i = 0; i < Math.min(4, activeTones.length); i++) {
                const t = activeTones[i];
                // Scale mode amplitude by tone amplitude with expressive organic deformation
                toneModes[i] = Math.min(0.55, t.amp * 0.45 * modalSensitivity);
                // Map audio frequency down to visually perceptible surface flutter speed
                toneFrequencies[i] = Math.min(10.0, Math.max(1.0, Math.log2(t.freq / 22 + 1) * 2.2));
            }
        } else if (totalActiveAmp > 0.01) {
            toneModes[0] = Math.min(0.40, totalActiveAmp * 0.30 * modalSensitivity);
            toneFrequencies[0] = Math.min(6.0, Math.max(1.0, activeFreq * 0.5));
        }

        const lensStrength = getVal(localConfig.lensStrength, 0.38);

        // ── 5. Navier-Stokes Fluid Engine Configuration ───────────────────────
        const backColorRgb = hexToRgb(getStr(localConfig.backColor, '#010814'));
        const shaderConfig = {
            simRes:              128,
            dyeRes:              512,
            densityDissipation:  tailTrailVal,
            tailTrail:           tailTrailVal,
            velocityDissipation: getVal(localConfig.velocityDissipation, 0.04),
            pressure:            getVal(localConfig.pressure, 0.94),
            pressureIterations:  24,
            curl:                curlVal,
            shading:             true,
            transparent:         false,
            paused:              false,
            bloom:               true,
            bloomIterations:     8,
            bloomResolution:     256,
            bloomIntensity:      glowVal,
            glowIntensity:       glowVal,
            bloomThreshold:      0.45,
            bloomSoftKnee:       0.80,
            sunrays:             false,
            sunraysResolution:   128,
            sunraysWeight:       0.2,
            backColor:           backColorRgb,
            kaleidoscope:        0, // Single acoustic chamber (no kaleidoscope mirrors)
            centerX:             normCx,
            centerY:             normCy,
            vortexRotation:      0.0,
            saturation:          1.25,
            masterOpacity:       getVal(localConfig.masterOpacity, 1.0),

            // Sonoluminescence Cavitation & Bubble parameters
            binauralHz:          activeFreq,
            vanDerWaalsCore:     vanDerWaalsCore,
            bremsstrahlungGlow:  lumGlow * userZoom,
            audioEnergy:         totalActiveAmp,
            time:                currentTime,

            // Dynamic Harmonic Colors
            coreColor:           coreColorRgb,
            rimColor:            rimColorRgb,
            glowColor:           glowColorRgb,

            // Modal Surface Harmonics & 3D Optical Lensing
            toneModes:           toneModes,
            toneFrequencies:     toneFrequencies,
            lensStrength:        lensStrength,
            edgeSoftness:        getVal(localConfig.edgeSoftness, 0.90),
            causticIntensity:    getVal(localConfig.causticIntensity, 0.70)
        };

        // ── 6. Acoustic Cavitation Shockwaves & Hydrodynamic Streaming ────────
        // Single-Bubble Sonoluminescence (SBSL): a micro-bubble trapped at the acoustic pressure node
        // of a resonant water flask experiences violent adiabatic collapse and plasma flashes, launching
        // supersonic spherical acoustic shockwaves into the surrounding liquid and gentle toroidal streaming.
        const isAudioActive = isAudioEnabled && totalActiveAmp > 0.005;
        const fCav = Math.min(4.5, Math.max(0.8, activeFreq * 0.45));
        const cyclePhase = (currentTime * fCav) % 1.0;
        const bubbleRadius = 0.125 * userZoom;
        const fluidImpulseMultiplier = getVal(localConfig.bubbleFluidImpulse, 1.0);

        // A. Supersonic Acoustic Shockwave Impulse:
        // Synchronized with the moment of peak adiabatic collapse (flash)
        if (memory.lastShockCycle === undefined) memory.lastShockCycle = -1;
        const curCycleIdx = Math.floor(currentTime * fCav);

        const splatRadius = getVal(localConfig.splatRadius, 0.08);
        const dyeLuminosity = getVal(localConfig.dyeLuminosity, 0.04) * (isAudioActive ? (1.0 + totalActiveAmp * 0.25) : 0.4);

        if (curCycleIdx !== memory.lastShockCycle && cyclePhase >= 0.92) {
            memory.lastShockCycle = curCycleIdx;
            // Launch radial supersonic pressure shockwave into the fluid velocity field
            const shockRays = 8;
            const shockDist = bubbleRadius * 0.65;
            const shockForce = (isAudioActive ? (1.5 + totalActiveAmp * 2.0) : 0.9) * fluidImpulseMultiplier * 0.4;

            for (let s = 0; s < shockRays; s++) {
                const sang = (s / shockRays) * Math.PI * 2.0;
                const sx = normCx + (Math.cos(sang) * shockDist) / Math.max(0.1, aspect);
                const sy = normCy + Math.sin(sang) * shockDist;
                const svx = Math.cos(sang) * shockForce;
                const svy = Math.sin(sang) * shockForce;

                // Pure fluid displacement shockwave (zero opaque smoke!)
                engine.splat(
                    Math.max(0.01, Math.min(0.99, sx)),
                    Math.max(0.01, Math.min(0.99, sy)),
                    svx,
                    svy,
                    { r: 0.002, g: 0.004, b: 0.008 },
                    splatRadius * 0.8,
                    canvasW,
                    canvasH
                );
            }
        }

        // B. Toroidal Acoustic Streaming Circulation:
        // Smoothly distributed around the perimeter across 8 micro-points with ethereal water luminescence
        const orbitSpeed = isAudioActive ? (0.12 + 0.02 * (activeFreq / 10.0)) : 0.04;
        memory.streamPhase = (memory.streamPhase + frameDt * orbitSpeed) % (Math.PI * 2);

        const streamRadius = bubbleRadius * 1.15;
        const curStreamForce = (isAudioActive ? streamForce * 0.16 : streamForce * 0.035) * fluidImpulseMultiplier;
        const waterGlowLuminosity = dyeLuminosity * 0.20; // Translucent tracer glow, eliminating thick smoke
        const numEmitters = 8;

        for (let i = 0; i < numEmitters; i++) {
            const angle = memory.streamPhase + (i * (Math.PI * 2 / numEmitters));
            const ex = normCx + (Math.cos(angle) * streamRadius) / Math.max(0.1, aspect);
            const ey = normCy + Math.sin(angle) * streamRadius;

            // Acoustic toroidal circulation vector
            const vx = -Math.sin(angle) * curStreamForce;
            const vy =  Math.cos(angle) * curStreamForce;

            let emR: number;
            let emG: number;
            let emB: number;

            if (colorMode === 'Custom Gas Dye') {
                const custom1 = hexToRgb(getStr(localConfig.dyeColor1, '#00d2ff'));
                const custom2 = hexToRgb(getStr(localConfig.dyeColor2, '#3a7bd5'));
                const cRatio = i % 2 === 0 ? 0.8 : 0.2;
                emR = custom1.r * cRatio + custom2.r * (1.0 - cRatio);
                emG = custom1.g * cRatio + custom2.g * (1.0 - cRatio);
                emB = custom1.b * cRatio + custom2.b * (1.0 - cRatio);
            } else if (activeTones.length > 0) {
                const tone = activeTones[i % activeTones.length];
                emR = tone.r;
                emG = tone.g;
                emB = tone.b;
            } else {
                const wheelIdx = (i * 2) % Math.max(1, wheelColors.length);
                const chordRgb = hexToRgb(wheelColors[wheelIdx]);
                emR = chordRgb.r;
                emG = chordRgb.g;
                emB = chordRgb.b;
            }

            engine.splat(
                Math.max(0.01, Math.min(0.99, ex)),
                Math.max(0.01, Math.min(0.99, ey)),
                vx,
                vy,
                {
                    r: emR * waterGlowLuminosity,
                    g: emG * waterGlowLuminosity,
                    b: emB * waterGlowLuminosity
                },
                splatRadius * 0.75,
                canvasW,
                canvasH
            );
        }

        // ── 7. Step & Render Navier-Stokes Fluid & Zen Sonoluminescence Bubble ─
        engine.step(frameDt, shaderConfig, canvasW, canvasH);
    }
};
