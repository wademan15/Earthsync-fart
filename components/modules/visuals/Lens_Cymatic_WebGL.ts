import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, HEART_HARMONIC_DEFS, getUniversalCymatic, getActiveHarmonicColor, BESSEL_ZEROS, getActiveColorWheelId, COLOR_WHEEL_PRESETS, getPitchClass } from './shared';
import type { ChordGlideConfig } from '../../../services/audio/chordProgressions';

const MAX_PARTICLES = 35000;
const TWO_PI = Math.PI * 2;
const SQRT3_HALF = Math.sqrt(3) * 0.5;
const INV_SQRT2 = 1.0 / Math.SQRT2;

// High-precision precomputed Bessel lookup table for instant zero-overhead evaluation
const BESSEL_LUT_SIZE = 512;
const BESSEL_MAX_X = 35.0;
const BESSEL_MAX_N = 12;
const BESSEL_LUT = new Float32Array((BESSEL_MAX_N + 1) * BESSEL_LUT_SIZE);

(() => {
    const STEPS = 32;
    const step = Math.PI / STEPS;
    for (let n = 0; n <= BESSEL_MAX_N; n++) {
        for (let i = 0; i < BESSEL_LUT_SIZE; i++) {
            const x = (i / (BESSEL_LUT_SIZE - 1)) * BESSEL_MAX_X;
            let sum = 0;
            for (let s = 0; s < STEPS; s++) {
                const th = (s + 0.5) * step;
                sum += Math.cos(n * th - x * Math.sin(th));
            }
            BESSEL_LUT[n * BESSEL_LUT_SIZE + i] = sum / STEPS;
        }
    }
})();

const fastBesselJ = (n: number, x: number): number => {
    if (x <= 0) return n === 0 ? 1 : 0;
    const clampedX = Math.min(BESSEL_MAX_X, Math.abs(x));
    const idx = Math.min(BESSEL_LUT_SIZE - 1, (clampedX * ((BESSEL_LUT_SIZE - 1) / BESSEL_MAX_X)) | 0);
    const safeN = Math.min(BESSEL_MAX_N, Math.max(0, Math.round(n)));
    return BESSEL_LUT[safeN * BESSEL_LUT_SIZE + idx];
};

const fastBesselJContinuous = (n: number, x: number): number => {
    const safeN = Math.max(0, Math.min(BESSEL_MAX_N, n));
    const nLow = Math.floor(safeN);
    const nHigh = Math.min(BESSEL_MAX_N, Math.ceil(safeN));
    if (nLow === nHigh) return fastBesselJ(nLow, x);
    const frac = safeN - nLow;
    return (1.0 - frac) * fastBesselJ(nLow, x) + frac * fastBesselJ(nHigh, x);
};

export interface CymaticMode {
    n: number;
    m: number;
    k: number;
    speed: number;
    vol: number;
    volRatio: number;
    color: string;
    currentFreq?: number;
    contN?: number;
    contM?: number;
    contK?: number;
}

interface DynamicWave {
    n: number;
    m: number;
    k: number;
    speed: number;
    vol: number;
    color: string;
    type: string;
    currentFreq: number;
    contN: number;
    contM: number;
    contK: number;
}

const evaluateWave = (
    plateShape: string,
    modalFormula: string,
    mode: CymaticMode,
    u: number,
    v: number,
    r: number,
    theta: number,
    sym: number
): number => {
    const effN = Math.max(1, (mode.contN ?? mode.n) * sym);
    let effM = Math.max(1, (mode.contM ?? mode.m));
    const kVal = mode.contK ?? mode.k ?? (BESSEL_ZEROS[Math.round(effN)]?.[Math.round(effM)] ?? (Math.PI * (effM + 1.5)));

    switch (plateShape) {
        case 'SQUARE': {
            if (modalFormula === 'RITZ_SYMMETRIC') {
                return Math.cos(effN * Math.PI * u) * Math.cos(effM * Math.PI * v) +
                       Math.cos(effM * Math.PI * u) * Math.cos(effN * Math.PI * v);
            } else if (modalFormula === 'DIAGONAL') {
                const uD = (u + v) * 0.70710678;
                const vD = (u - v) * 0.70710678;
                return Math.cos(effN * Math.PI * uD) * Math.cos(effM * Math.PI * vD);
            } else if (modalFormula === 'RADIAL_CONCENTRIC') {
                return Math.cos(kVal * r) * Math.cos(effN * theta);
            } else {
                if (Math.abs(effN - effM) < 0.05) effM += 0.8;
                return Math.cos(effN * Math.PI * u) * Math.cos(effM * Math.PI * v) -
                       Math.cos(effM * Math.PI * u) * Math.cos(effN * Math.PI * v);
            }
        }
        case 'HEXAGON': {
            const k = effN * Math.PI;
            const waveSum = Math.cos(k * u) +
                            Math.cos(-0.5 * k * u + 0.866025 * k * v) +
                            Math.cos(-0.5 * k * u - 0.866025 * k * v);
            return (waveSum / 3.0) * Math.cos(effM * Math.PI * r);
        }
        case 'OCTAGON': {
            const k = effN * Math.PI;
            const waveSum = Math.cos(k * u) +
                            Math.cos(k * v) +
                            Math.cos(k * (u + v) * 0.70710678) +
                            Math.cos(k * (u - v) * 0.70710678);
            return (waveSum * 0.25) * Math.cos(effM * Math.PI * r);
        }
        case 'TRIANGLE': {
            const w1 = Math.cos(2 * Math.PI * effN * u / 1.73205) * Math.cos(2 * Math.PI * effM * v);
            const w2 = Math.cos(2 * Math.PI * effM * u / 1.73205) * Math.cos(Math.PI * effN * v * 1.73205);
            return 0.5 * (w1 - w2);
        }
        case 'PENTAGON': {
            let sumP = 0;
            for (let p = 0; p < 5; p++) {
                const ang = p * 1.256637;
                sumP += Math.cos(effN * Math.PI * (u * Math.cos(ang) + v * Math.sin(ang)));
            }
            return (sumP * 0.2) * Math.cos(effM * Math.PI * r);
        }
        case 'ELLIPSE': {
            const ue = u / 1.25;
            const ve = v / 0.8;
            const re = Math.sqrt(ue * ue + ve * ve);
            const the = Math.atan2(ve, ue);
            return fastBesselJContinuous(effN, re * kVal) * Math.cos(effN * the);
        }
        case 'CIRCLE':
        default: {
            if (modalFormula === 'RITZ_SYMMETRIC') {
                return (fastBesselJContinuous(effN, r * kVal) + fastBesselJContinuous(effM, r * kVal)) * 0.5 * Math.cos(effN * theta);
            } else if (modalFormula === 'RADIAL_CONCENTRIC') {
                return fastBesselJ(0, r * kVal);
            } else {
                return fastBesselJContinuous(effN, r * kVal) * Math.cos(effN * theta);
            }
        }
    }
};

const evaluateSuperposition = (
    modes: CymaticMode[],
    plateShape: string,
    modalFormula: string,
    u: number,
    v: number,
    sym: number,
    roughness = 0
): number => {
    const numModes = modes.length;
    if (numModes === 0) return 0;
    const r = Math.sqrt(u * u + v * v);
    const theta = Math.atan2(v, u);

    let total = 0;
    for (let i = 0; i < numModes; i++) {
        const mode = modes[i];
        const w = evaluateWave(plateShape, modalFormula, mode, u, v, r, theta, sym);
        total += w * mode.volRatio;
    }
    if (roughness > 0.001) {
        const plateEntropy = (Math.sin(r * 22.0) * Math.cos(theta * 14.0) + Math.sin((u + v) * 16.0) * 0.5) * roughness * 0.25;
        total += plateEntropy;
    }
    return total;
};

const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

function hslToRgb(hDeg: number, sPct: number, lPct: number): [number, number, number] {
    const h = (((hDeg % 360) + 360) % 360) / 360;
    const s = Math.max(0, Math.min(1, sPct / 100));
    const l = Math.max(0, Math.min(1, lPct / 100));
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
        let tC = t;
        if (tC < 0) tC += 1;
        if (tC > 1) tC -= 1;
        if (tC < 1 / 6) return p + (q - p) * 6 * tC;
        if (tC < 1 / 2) return q;
        if (tC < 2 / 3) return p + (q - p) * (2 / 3 - tC) * 6;
        return p;
    };
    return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
}

const parseColorToRgb = (col: string | undefined | null): [number, number, number] => {
    if (!col) return [1.0, 1.0, 1.0];
    const str = String(col).trim();
    if (str.startsWith('#')) {
        const hex = str.slice(1);
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16) / 255;
            const g = parseInt(hex[1] + hex[1], 16) / 255;
            const b = parseInt(hex[2] + hex[2], 16) / 255;
            return [isNaN(r) ? 1.0 : r, isNaN(g) ? 1.0 : g, isNaN(b) ? 1.0 : b];
        }
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        return [isNaN(r) ? 1.0 : r, isNaN(g) ? 1.0 : g, isNaN(b) ? 1.0 : b];
    }
    if (str.startsWith('hsl')) {
        const match = str.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/i);
        if (match) {
            return hslToRgb(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
        }
    }
    if (str.startsWith('rgb')) {
        const match = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
        if (match) {
            return [
                Math.max(0, Math.min(1, parseFloat(match[1]) / 255)),
                Math.max(0, Math.min(1, parseFloat(match[2]) / 255)),
                Math.max(0, Math.min(1, parseFloat(match[3]) / 255))
            ];
        }
    }
    return [1.0, 1.0, 1.0];
};

const insidePlateShape = (plateShape: string, u: number, v: number): boolean => {
    switch (plateShape) {
        case 'SQUARE':
            return Math.abs(u) <= 0.94 && Math.abs(v) <= 0.94;
        case 'HEXAGON': {
            const hApothem = 0.94 * 0.866025;
            return Math.abs(u) <= 0.94 && Math.abs(0.5 * u + 0.866025 * v) <= hApothem && Math.abs(0.5 * u - 0.866025 * v) <= hApothem;
        }
        case 'OCTAGON': {
            const oApothem = 0.94 * 0.92388;
            const d1 = Math.abs((u + v) * INV_SQRT2);
            const d2 = Math.abs((u - v) * INV_SQRT2);
            return Math.abs(u) <= oApothem && Math.abs(v) <= oApothem && d1 <= oApothem && d2 <= oApothem;
        }
        case 'TRIANGLE': {
            const yBottom = 0.94 * 0.5;
            const dotL = u * (-SQRT3_HALF) + (v - yBottom) * (-0.5);
            const dotR = u * SQRT3_HALF + (v - yBottom) * (-0.5);
            return v <= yBottom && dotL >= 0 && dotR >= 0;
        }
        case 'PENTAGON': {
            const pApothem = 0.94 * 0.809017;
            for (let j = 0; j < 5; j++) {
                const ang = j * (TWO_PI / 5) - Math.PI * 0.5;
                if (u * Math.cos(ang) + v * Math.sin(ang) > pApothem) return false;
            }
            return true;
        }
        case 'ELLIPSE':
            return ((u * u) / 1.3225 + (v * v) / 0.7225) <= 0.94 * 0.94;
        case 'CIRCLE':
        default:
            return (u * u + v * v) <= 0.94 * 0.94;
    }
};

const PRESETS: VisualizerPreset[] = [
    {
        id: 'cymatic_gl_resonant_quartz',
        name: 'Resonant Quartz',
        config: {
            plateShape: 'CIRCLE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'CHLADNI',
            harmonicSymmetry: 1,
            snapStrength: 1.8,
            plateDamping: 0.35,
            edgeRecycle: 'OFF',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.92,
            highMotionOpacity: 0.8,
            particleSize: 0.7,
            force: 1.1,
            reactivity: 1.0,
            phaseFluidity: 0.35,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.5,
            agitation: 0.45,
            streamFlow: 0.0,
            meshElasticity: 0.25,
            turbulence: 0.04,
            harmonicRoughness: 0.0,
            colorSyncMode: 'HARMONIC_WHEEL',
            colorCycleSpeed: 0.15,
            colorIntensity: 1.5,
            glow: 0.75,
            minBrightness: 0.85,
            colorGain: 2.2,
            chromaticPrism: 'ON',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_sacred_hexagram',
        name: 'Sacred Hexagram',
        config: {
            plateShape: 'HEXAGON',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RITZ_SYMMETRIC',
            harmonicSymmetry: 3,
            snapStrength: 2.2,
            plateDamping: 0.28,
            edgeRecycle: 'ON',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.95,
            highMotionOpacity: 0.85,
            particleSize: 0.65,
            force: 1.2,
            reactivity: 1.15,
            phaseFluidity: 0.4,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.46,
            agitation: 0.4,
            streamFlow: 0.0,
            meshElasticity: 0.3,
            turbulence: 0.02,
            harmonicRoughness: 0.0,
            colorSyncMode: 'WAVE_INTERFERENCE',
            colorCycleSpeed: 0.2,
            colorIntensity: 1.8,
            glow: 0.85,
            minBrightness: 0.88,
            colorGain: 2.6,
            chromaticPrism: 'ON',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_vortex_nebula',
        name: 'Vortex Nebula',
        config: {
            plateShape: 'CIRCLE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RADIAL_CONCENTRIC',
            harmonicSymmetry: 2,
            snapStrength: 1.3,
            plateDamping: 0.2,
            edgeRecycle: 'ON',
            perspectiveTilt: 18,
            latticeDensity: 1.0,
            membraneTension: 0.7,
            highMotionOpacity: 0.9,
            particleSize: 0.8,
            force: 1.4,
            reactivity: 1.35,
            phaseFluidity: 0.65,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.36,
            agitation: 0.7,
            streamFlow: 0.85,
            meshElasticity: 0.45,
            turbulence: 0.12,
            harmonicRoughness: 0.0,
            colorSyncMode: 'KINETIC_SPECTRUM',
            colorCycleSpeed: 0.3,
            colorIntensity: 2.2,
            glow: 1.5,
            minBrightness: 0.8,
            colorGain: 3.2,
            chromaticPrism: 'ON',
            cometTrails: 0.38,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 0.95,
            blendMode: 'ADDITIVE'
        }
    },
    {
        id: 'cymatic_gl_soliton_mandala',
        name: 'Soliton Mandala',
        config: {
            plateShape: 'SQUARE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'DIAGONAL',
            harmonicSymmetry: 4,
            snapStrength: 2.0,
            plateDamping: 0.3,
            edgeRecycle: 'ON',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.92,
            highMotionOpacity: 0.8,
            particleSize: 0.6,
            force: 1.25,
            reactivity: 1.1,
            phaseFluidity: 0.38,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.48,
            agitation: 0.45,
            streamFlow: 0.0,
            meshElasticity: 0.35,
            turbulence: 0.03,
            harmonicRoughness: 0.0,
            colorSyncMode: 'HARMONIC_WHEEL',
            colorCycleSpeed: 0.15,
            colorIntensity: 1.6,
            glow: 1.1,
            minBrightness: 0.85,
            colorGain: 2.8,
            chromaticPrism: 'ON',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_obsidian_brass',
        name: 'Obsidian Brass',
        config: {
            plateShape: 'SQUARE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'CHLADNI',
            harmonicSymmetry: 1,
            snapStrength: 2.8,
            plateDamping: 0.52,
            edgeRecycle: 'OFF',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.98,
            highMotionOpacity: 0.7,
            particleSize: 0.55,
            force: 1.05,
            reactivity: 0.95,
            phaseFluidity: 0.28,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.62,
            agitation: 0.32,
            streamFlow: 0.0,
            meshElasticity: 0.15,
            turbulence: 0.01,
            harmonicRoughness: 0.0,
            colorSyncMode: 'OFF',
            colorCycleSpeed: 0.0,
            colorIntensity: 1.0,
            glow: 0.35,
            minBrightness: 0.95,
            colorGain: 1.8,
            chromaticPrism: 'OFF',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_prismatic_octave',
        name: 'Prismatic Octave',
        config: {
            plateShape: 'OCTAGON',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RITZ_SYMMETRIC',
            harmonicSymmetry: 2,
            snapStrength: 1.7,
            plateDamping: 0.3,
            edgeRecycle: 'ON',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.9,
            highMotionOpacity: 0.85,
            particleSize: 0.75,
            force: 1.3,
            reactivity: 1.25,
            phaseFluidity: 0.45,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.45,
            agitation: 0.5,
            streamFlow: 0.1,
            meshElasticity: 0.3,
            turbulence: 0.04,
            harmonicRoughness: 0.0,
            colorSyncMode: 'RADIAL_OCTAVE',
            colorCycleSpeed: 0.25,
            colorIntensity: 2.0,
            glow: 1.25,
            minBrightness: 0.8,
            colorGain: 3.8,
            chromaticPrism: 'ON',
            cometTrails: 0.05,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_lotus_cymatosphere',
        name: 'Lotus Cymatosphere',
        config: {
            plateShape: 'CIRCLE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RADIAL_CONCENTRIC',
            harmonicSymmetry: 6,
            snapStrength: 1.6,
            plateDamping: 0.4,
            edgeRecycle: 'OFF',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.88,
            highMotionOpacity: 0.8,
            particleSize: 0.65,
            force: 0.95,
            reactivity: 0.9,
            phaseFluidity: 0.3,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.55,
            agitation: 0.3,
            streamFlow: 0.0,
            meshElasticity: 0.25,
            turbulence: 0.02,
            harmonicRoughness: 0.0,
            colorSyncMode: 'HARMONIC_WHEEL',
            colorCycleSpeed: 0.1,
            colorIntensity: 1.4,
            glow: 0.8,
            minBrightness: 0.85,
            colorGain: 2.4,
            chromaticPrism: 'ON',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_quantum_torus',
        name: 'Quantum Torus',
        config: {
            plateShape: 'CIRCLE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RADIAL_CONCENTRIC',
            harmonicSymmetry: 1,
            snapStrength: 1.5,
            plateDamping: 0.25,
            edgeRecycle: 'ON',
            perspectiveTilt: 38,
            latticeDensity: 1.0,
            membraneTension: 0.85,
            highMotionOpacity: 0.88,
            particleSize: 0.75,
            force: 1.2,
            reactivity: 1.1,
            phaseFluidity: 0.5,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.42,
            agitation: 0.48,
            streamFlow: 0.45,
            meshElasticity: 0.35,
            turbulence: 0.05,
            harmonicRoughness: 0.0,
            colorSyncMode: 'WAVE_INTERFERENCE',
            colorCycleSpeed: 0.2,
            colorIntensity: 1.7,
            glow: 0.95,
            minBrightness: 0.82,
            colorGain: 2.6,
            chromaticPrism: 'ON',
            cometTrails: 0.18,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_pythagorean_triangle',
        name: 'Pythagorean Triangle',
        config: {
            plateShape: 'TRIANGLE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'CHLADNI',
            harmonicSymmetry: 3,
            snapStrength: 2.4,
            plateDamping: 0.32,
            edgeRecycle: 'ON',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.94,
            highMotionOpacity: 0.82,
            particleSize: 0.65,
            force: 1.2,
            reactivity: 1.1,
            phaseFluidity: 0.36,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.46,
            agitation: 0.42,
            streamFlow: 0.0,
            meshElasticity: 0.28,
            turbulence: 0.03,
            harmonicRoughness: 0.0,
            colorSyncMode: 'CHORD_SEPARATION',
            colorCycleSpeed: 0.15,
            colorIntensity: 1.6,
            glow: 0.85,
            minBrightness: 0.85,
            colorGain: 2.7,
            chromaticPrism: 'ON',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_golden_pentasphere',
        name: 'Golden Pentasphere',
        config: {
            plateShape: 'PENTAGON',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RITZ_SYMMETRIC',
            harmonicSymmetry: 5,
            snapStrength: 1.9,
            plateDamping: 0.28,
            edgeRecycle: 'ON',
            perspectiveTilt: 0,
            latticeDensity: 1.0,
            membraneTension: 0.92,
            highMotionOpacity: 0.85,
            particleSize: 0.65,
            force: 1.15,
            reactivity: 1.05,
            phaseFluidity: 0.38,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.48,
            agitation: 0.4,
            streamFlow: 0.0,
            meshElasticity: 0.32,
            turbulence: 0.02,
            harmonicRoughness: 0.0,
            colorSyncMode: 'RADIAL_OCTAVE',
            colorCycleSpeed: 0.18,
            colorIntensity: 1.7,
            glow: 0.9,
            minBrightness: 0.85,
            colorGain: 2.8,
            chromaticPrism: 'ON',
            cometTrails: 0.0,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_hyper_kinetic_surge',
        name: 'Hyper-Kinetic Surge',
        config: {
            plateShape: 'OCTAGON',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'DIAGONAL',
            harmonicSymmetry: 2,
            snapStrength: 1.9,
            plateDamping: 0.22,
            edgeRecycle: 'ON',
            perspectiveTilt: 12,
            latticeDensity: 1.0,
            membraneTension: 0.8,
            highMotionOpacity: 0.9,
            particleSize: 0.8,
            force: 2.1,
            reactivity: 2.2,
            phaseFluidity: 0.55,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.38,
            agitation: 0.9,
            streamFlow: 0.3,
            meshElasticity: 0.4,
            turbulence: 0.2,
            harmonicRoughness: 0.05,
            colorSyncMode: 'KINETIC_SPECTRUM',
            colorCycleSpeed: 0.35,
            colorIntensity: 2.4,
            glow: 1.3,
            minBrightness: 0.85,
            colorGain: 3.2,
            chromaticPrism: 'ON',
            cometTrails: 0.22,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    },
    {
        id: 'cymatic_gl_celestial_anamorphic',
        name: 'Celestial Anamorphic',
        config: {
            plateShape: 'ELLIPSE',
            nodalPolarity: 'ATTRACT',
            modalFormula: 'RITZ_SYMMETRIC',
            harmonicSymmetry: 2,
            snapStrength: 1.6,
            plateDamping: 0.3,
            edgeRecycle: 'ON',
            perspectiveTilt: 48,
            latticeDensity: 1.0,
            membraneTension: 0.88,
            highMotionOpacity: 0.85,
            particleSize: 0.75,
            force: 1.15,
            reactivity: 1.05,
            phaseFluidity: 0.42,
            gravity: 0.0,
            solarWind: 0.0,
            viscosity: 0.46,
            agitation: 0.44,
            streamFlow: 0.15,
            meshElasticity: 0.3,
            turbulence: 0.04,
            harmonicRoughness: 0.0,
            colorSyncMode: 'HARMONIC_WHEEL',
            colorCycleSpeed: 0.15,
            colorIntensity: 1.6,
            glow: 1.05,
            minBrightness: 0.85,
            colorGain: 2.6,
            chromaticPrism: 'ON',
            cometTrails: 0.2,
            exclusiveToneSweep: 'OFF',
            toneSweepPos: 0.0,
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        }
    }
];


const VS = `#version 300 es
in vec2 a_pos;
in vec2 a_vel;
in float a_index;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_scale;
uniform float u_tiltScaleY;
uniform float u_particleSize;
uniform float u_dpr;
uniform float u_glow;
uniform float u_colorGain;
uniform vec3 u_dominantColor;
uniform vec3 u_idleColor;
uniform vec3 u_whiteColor;
uniform int u_isNebula;
uniform int u_isChromatic;
uniform vec3 u_palette[8];
uniform int u_paletteSize;

uniform int u_colorSyncMode;
uniform vec3 u_colorWheel[12];
uniform float u_activePitchClass;
uniform float u_time;
uniform float u_colorCycleSpeed;
uniform float u_symmetry;
uniform float u_maxRadius;
uniform float u_colorIntensity;

out vec4 v_color;
out float v_isMoving;

vec3 sampleColorWheel(float p) {
    float wrapped = mod(p, 12.0);
    int idx0 = int(floor(wrapped));
    int idx1 = int(mod(float(idx0 + 1), 12.0));
    float f = fract(wrapped);
    float smoothF = f * f * (3.0 - 2.0 * f);
    return mix(u_colorWheel[idx0], u_colorWheel[idx1], smoothF);
}

void main() {
    vec2 pos = vec2(a_pos.x, -a_pos.y * u_tiltScaleY);
    vec2 ndcPos = (pos / (u_resolution * 0.5)) * u_scale;
    ndcPos += u_center;
    gl_Position = vec4(ndcPos, 0.0, 1.0);

    float speedSq = dot(a_vel, a_vel);
    bool isMoving = speedSq > 0.45;
    v_isMoving = isMoving ? 1.0 : 0.0;

    // Base high-contrast crystalline white sand
    vec3 col = u_idleColor;
    float alpha = 1.0;

    if (u_colorSyncMode > 0) {
        vec3 wheelCol = u_idleColor;
        if (u_colorSyncMode == 1) {
            // 1: HARMONIC_WHEEL - Polar 360-degree color wheel mandala divided by harmonic symmetry folds
            float ang = atan(a_pos.y, a_pos.x);
            float normAng = (ang + 3.14159265) / 6.2831853;
            float p = u_activePitchClass + (normAng * 12.0 * max(1.0, u_symmetry)) + (u_time * u_colorCycleSpeed * 0.4);
            wheelCol = sampleColorWheel(p);
        } else if (u_colorSyncMode == 2) {
            // 2: WAVE_INTERFERENCE - Standing wave amplitude & spatial phase dispersion moire
            float rNorm = clamp(length(a_pos) / max(1.0, u_maxRadius), 0.0, 1.0);
            float wavePattern = sin(a_pos.x * 0.02 * u_symmetry) * cos(a_pos.y * 0.02 * u_symmetry)
                              + sin((a_pos.x + a_pos.y) * 0.015) * 0.7;
            float p = u_activePitchClass + wavePattern * 3.5 + rNorm * 4.0 + (u_time * u_colorCycleSpeed * 0.3);
            wheelCol = sampleColorWheel(p);
        } else if (u_colorSyncMode == 3) {
            // 3: CHORD_SEPARATION - Multi-voice overtone separation across plate geometry
            float ang = atan(a_pos.y, a_pos.x);
            float seg = floor(mod((ang + 3.14159265) / 6.2831853 * float(max(1, u_paletteSize)), float(max(1, u_paletteSize))));
            int pIdx = int(mod(seg + float(int(a_index) % max(1, u_paletteSize)), float(max(1, u_paletteSize))));
            wheelCol = (u_paletteSize > 0) ? u_palette[pIdx] : u_dominantColor;
        } else if (u_colorSyncMode == 4) {
            // 4: RADIAL_OCTAVE - Concentric harmonic octave rings radiating outward
            float rNorm = clamp(length(a_pos) / max(1.0, u_maxRadius), 0.0, 1.0);
            float p = u_activePitchClass + (rNorm * 12.0 * (u_symmetry * 0.5 + 0.8)) + (u_time * u_colorCycleSpeed * 0.4);
            wheelCol = sampleColorWheel(p);
        } else if (u_colorSyncMode == 5) {
            // 5: KINETIC_SPECTRUM - Velocity & acoustic excitation glow
            float speed = sqrt(speedSq);
            float p = u_activePitchClass + (speed * 8.0) + (u_time * u_colorCycleSpeed * 0.2);
            wheelCol = sampleColorWheel(p);
        }

        float satGain = clamp(u_colorIntensity, 0.1, 3.5);
        if (u_isNebula == 1) {
            col = isMoving ? mix(wheelCol, u_whiteColor, 0.4) : wheelCol;
            alpha = isMoving ? 0.95 : 0.90;
        } else {
            if (isMoving) {
                // Moving particles: illuminated with vibrant spectral hue
                col = mix(wheelCol, vec3(1.0), 0.22);
                alpha = 0.88;
            } else {
                // Stationary nodal sand: crisp physical white sand infused with deep, harmonic wheel tone
                float tint = clamp(0.38 + satGain * 0.22, 0.2, 0.95);
                col = mix(u_idleColor, wheelCol, tint);
                alpha = 1.0;
            }
        }
    } else if (u_isNebula == 1) {
        col = isMoving ? u_whiteColor : u_dominantColor;
        alpha = isMoving ? 0.95 : 0.90;
    } else if (u_isChromatic == 1 && u_paletteSize > 0) {
        int colIdx = int(mod(a_index, float(u_paletteSize)));
        vec3 pCol = u_palette[colIdx];
        if (isMoving) {
            // Moving particles: excited acoustic vibration with tone hue and bright white highlight
            col = mix(pCol, vec3(1.0), 0.35);
            alpha = 0.85;
        } else {
            // Stationary nodal sand: crisp physical white sand infused with rich harmonic frequency tint
            float tint = clamp(0.22 + u_colorGain * 0.10, 0.25, 0.52);
            col = mix(u_idleColor, pCol, tint);
            alpha = 1.0;
        }
    } else {
        if (isMoving) {
            col = mix(u_dominantColor, vec3(1.0), 0.40);
            alpha = 0.85;
        } else {
            col = u_idleColor;
            alpha = 1.0;
        }
    }

    v_color = vec4(col, alpha);
    
    // Fine micro-crystalline sand grains for high-density 35k simulation
    float baseSz = max(0.8, u_particleSize * 1.15) * u_dpr;
    float glowBoost = u_glow * 0.5 * u_dpr;
    gl_PointSize = clamp(baseSz + (isMoving ? 0.3 * u_dpr : glowBoost), 1.0 * u_dpr, 8.0 * u_dpr);
}`;

const FS = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_isMoving;
out vec4 fragColor;

uniform float u_glow;
uniform float u_masterOpacity;
uniform float u_highMotionOpacity;

void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float distSq = dot(coord, coord);
    if (distSq > 1.0) discard;
    float dist = sqrt(distSq);

    // Physical sand grain core (dense, solid, crisp circular grain)
    float core = 1.0 - smoothstep(0.55, 0.90, dist);

    // Soft radiant harmonic sheen at grain edges
    float glow = exp(-distSq * 2.8);

    // High-contrast alpha: stationary nodal sand forms solid, luminous geometric curves; flying sand respects motion translucency
    float motionAlphaFactor = mix(1.0, u_highMotionOpacity, v_isMoving);
    float alpha = (v_isMoving > 0.5)
        ? clamp((core * 0.85 + glow * 0.4) * v_color.a * u_masterOpacity * motionAlphaFactor, 0.0, 1.0)
        : clamp((core * 0.98 + glow * 0.5) * v_color.a * u_masterOpacity, 0.0, 1.0);

    if (alpha <= 0.02) discard;

    // Boost luminance so sand grains stand out with stunning contrast against the dark plate
    vec3 col = v_color.rgb * (1.05 + core * 0.35 + glow * 0.25);
    fragColor = vec4(col, alpha);
}`;

const TRAIL_VS = `#version 300 es
void main() {
    float x = float((gl_VertexID & 1) << 2) - 1.0;
    float y = float((gl_VertexID & 2) << 1) - 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}`;

const TRAIL_FS = `#version 300 es
precision highp float;
uniform vec4 u_fadeColor;
out vec4 fragColor;
void main() {
    fragColor = u_fadeColor;
}`;

export const Lens_Cymatic_WebGL: VisualizerPlugin = {
    id: 'CYMATIC_WEBGL',
    name: 'Cymatic WebGL',
    renderType: 'WEBGL',

    parameters: [
        { id: 'plateShape', label: 'Plate Shape', type: 'SELECT', section: 'GEOMETRY', icon: 'Grid', options: ['CIRCLE', 'SQUARE', 'HEXAGON', 'OCTAGON', 'TRIANGLE', 'PENTAGON', 'ELLIPSE'], color: '#6366f1', defaultValue: 'CIRCLE' },
        { id: 'nodalPolarity', label: 'Nodal Polarity', type: 'CUSTOM_TOGGLE', section: 'GEOMETRY', icon: 'Sun', options: ['ATTRACT', 'REPEL'], color: '#a855f7', defaultValue: 'ATTRACT' },
        { id: 'modalFormula', label: 'Modal Formula', type: 'SELECT', section: 'GEOMETRY', icon: 'Sliders', options: ['CHLADNI', 'RITZ_SYMMETRIC', 'DIAGONAL', 'RADIAL_CONCENTRIC'], color: '#ec4899', defaultValue: 'CHLADNI' },
        { id: 'harmonicSymmetry', label: 'Harmonic Fold', icon: 'Layers', type: 'SLIDER', min: 1, max: 8, step: 1, color: '#38bdf8', section: 'GEOMETRY', defaultValue: 1 },
        { id: 'snapStrength', label: 'Nodal Snap', icon: 'Magnet', type: 'SLIDER', min: 0.2, max: 3.5, step: 0.1, color: '#c084fc', section: 'GEOMETRY', defaultValue: 1.2 },
        { id: 'plateDamping', label: 'Rim Damping', icon: 'Shield', type: 'SLIDER', min: 0.05, max: 0.95, step: 0.05, color: '#10b981', section: 'GEOMETRY', defaultValue: 0.3 },
        { id: 'edgeRecycle', label: 'Edge Sand Recycle', type: 'CUSTOM_TOGGLE', section: 'GEOMETRY', icon: 'RotateCcw', options: ['OFF', 'ON'], color: '#38bdf8', defaultValue: 'OFF' },
        { id: 'perspectiveTilt', label: 'Plate Perspective Tilt', icon: 'Maximize2', type: 'SLIDER', min: 0, max: 75, step: 1, color: '#a855f7', section: 'GEOMETRY', defaultValue: 0 },
        { id: 'latticeDensity', label: 'Particle Count', icon: 'Activity', type: 'SLIDER', min: 0.1, max: 1.0, step: 0.05, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 0.95 },
        { id: 'membraneTension', label: 'Nodal Adhesion', icon: 'Maximize', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#6366f1', section: 'GEOMETRY', defaultValue: 0.9 },
        { id: 'highMotionOpacity', label: 'Motion Translucency', icon: 'Ghost', type: 'SLIDER', min: 0.1, max: 1.0, step: 0.05, color: '#ec4899', section: 'LIGHT', defaultValue: 0.75 },
        { id: 'particleSize', label: 'Sand Size', icon: 'Sparkles', type: 'SLIDER', min: 0.3, max: 2.5, step: 0.05, color: '#fbbf24', section: 'GEOMETRY', defaultValue: 0.75 },
        { id: 'force', label: 'Plate Drive Force', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 2.5, step: 0.05, color: '#f59e0b', section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'reactivity', label: 'Audio Sensitivity', icon: 'Activity', type: 'SLIDER', min: 0.1, max: 3.0, step: 0.1, color: '#f97316', section: 'AUDIO', defaultValue: 1.0 },
        { id: 'phaseFluidity', label: 'Harmonic Fluidity', icon: 'Activity', type: 'SLIDER', min: 0.1, max: 0.9, step: 0.02, color: '#06b6d4', section: 'PHYSICS', defaultValue: 0.4 },
        { id: 'gravity', label: 'Gravity Force', icon: 'ArrowDown', type: 'SLIDER', min: 0.0, max: 0.1, step: 0.005, color: '#84cc16', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'solarWind', label: 'Solar Wind', icon: 'Wind', type: 'SLIDER', min: 0.0, max: 0.5, step: 0.02, color: '#06b6d4', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'viscosity', label: 'Medium Drag', icon: 'Droplet', type: 'SLIDER', min: 0.1, max: 0.9, step: 0.02, color: '#0ea5e9', section: 'PHYSICS', defaultValue: 0.48 },
        { id: 'agitation', label: 'Vibration Jitter', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 1.5, step: 0.05, color: '#f43f5e', section: 'PHYSICS', defaultValue: 0.55 },
        { id: 'streamFlow', label: 'Vortex Swirl', icon: 'RotateCw', type: 'SLIDER', min: 0.0, max: 1.5, step: 0.05, color: '#10b981', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'meshElasticity', label: 'Elasticity', icon: 'Maximize', type: 'SLIDER', min: 0.0, max: 0.8, step: 0.05, color: '#a855f7', section: 'PHYSICS', defaultValue: 0.25 },
        { id: 'turbulence', label: 'Plate Turbulence', icon: 'Wind', type: 'SLIDER', min: 0.0, max: 0.5, step: 0.01, color: '#10b981', section: 'PHYSICS', defaultValue: 0.05 },
        { id: 'harmonicRoughness', label: 'Plate Roughness', icon: 'Shield', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ec4899', section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'colorSyncMode', label: 'Color Wheel Sync', type: 'SELECT', section: 'LIGHT', icon: 'Sun', options: ['OFF', 'HARMONIC_WHEEL', 'WAVE_INTERFERENCE', 'CHORD_SEPARATION', 'RADIAL_OCTAVE', 'KINETIC_SPECTRUM'], color: '#f59e0b', defaultValue: 'HARMONIC_WHEEL' },
        { id: 'colorCycleSpeed', label: 'Spectral Drift Speed', icon: 'RotateCw', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#38bdf8', section: 'LIGHT', defaultValue: 0.2 },
        { id: 'colorIntensity', label: 'Spectral Saturation', icon: 'Flame', type: 'SLIDER', min: 0.2, max: 3.5, step: 0.1, color: '#ec4899', section: 'LIGHT', defaultValue: 1.5 },
        { id: 'glow', label: 'Particle Glow', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#eab308', section: 'LIGHT', defaultValue: 0.75 },
        { id: 'minBrightness', label: 'Nodal Brightness', icon: 'Sliders', type: 'SLIDER', min: 0.1, max: 1.0, step: 0.05, color: '#d946ef', section: 'LIGHT', defaultValue: 0.8 },
        { id: 'colorGain', label: 'Color Gain', icon: 'Flame', type: 'SLIDER', min: 0.5, max: 4.0, step: 0.1, color: '#f97316', section: 'LIGHT', defaultValue: 2.2 },
        { id: 'chromaticPrism', label: 'Chromatic Separation', type: 'CUSTOM_TOGGLE', section: 'LIGHT', icon: 'Sparkles', options: ['ON', 'OFF'], color: '#a855f7', defaultValue: 'ON' },
        { id: 'cometTrails', label: 'Sand Phosphor Trails', icon: 'Flame', type: 'SLIDER', min: 0.0, max: 0.9, step: 0.02, color: '#f43f5e', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'exclusiveToneSweep', label: 'Tone Journey Mode', type: 'CUSTOM_TOGGLE', section: 'AUDIO', icon: 'Radio', options: ['ON', 'OFF'], color: '#38bdf8', defaultValue: 'OFF' },
        { id: 'toneSweepPos', label: 'Journey Sweep Position', icon: 'Sliders', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, color: '#38bdf8', section: 'AUDIO', defaultValue: 0.0 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'blendMode', label: 'Optical Mode', type: 'SELECT', section: 'GLOBAL', icon: 'Blend', options: ['NORMAL', 'ADDITIVE'], color: '#ec4899', defaultValue: 'NORMAL' }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const gl = lensCtx.gl as WebGL2RenderingContext;
        if (!gl) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;
        const { w, h, memory, amplitudes, bpm = 0, theme, cx, cy } = lensCtx;
        const time = (lensCtx.time as number) || 0;

        const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
        const logicalW = (lensCtx.logicalW as number) || (w / dpr);
        const logicalH = (lensCtx.logicalH as number) || (h / dpr);
        const maxRadius = (Math.min(logicalW, logicalH) / 2) * 0.95;

        const density = getVal(cfg.latticeDensity, 0.85);
        const quality = (memory.cwgl_qualityMultiplier as number) ?? 1.0;
        const activeParticleCount = Math.min(MAX_PARTICLES, Math.floor(MAX_PARTICLES * Math.max(0.1, Math.min(1.0, density)) * quality));
        const plateShape = String(cfg.plateShape || 'CIRCLE');
        const isNebula = cfg.blendMode === 'ADDITIVE';

        // 1. Initial Data Buffer setup
        const needsInit = !memory.cwgl_initialized || memory.cwgl_lastShape !== plateShape;
        if (needsInit) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            memory.cwgl_normPos = new Float32Array(MAX_PARTICLES * 2);
            memory.cwgl_normVel = new Float32Array(MAX_PARTICLES * 2);
            memory.cwgl_pixelPos = new Float32Array(MAX_PARTICLES * 2);
            memory.cwgl_pixelVel = new Float32Array(MAX_PARTICLES * 2);

            memory.cwgl_initialized = true;
            memory.cwgl_lastShape = plateShape;

            // Uniform plate seed across the specific plate geometry in normalized coordinates [-1, 1]
            const normPos = memory.cwgl_normPos as Float32Array;
            for (let i = 0; i < MAX_PARTICLES; i++) {
                const ix = i * 2;
                const iy = ix + 1;
                let su = 0;
                let sv = 0;
                let attempts = 0;
                do {
                    su = (Math.random() - 0.5) * 1.88;
                    sv = (Math.random() - 0.5) * 1.88;
                    attempts++;
                } while (attempts < 15 && !insidePlateShape(plateShape, su, sv));
                normPos[ix] = su;
                normPos[iy] = sv;
            }
        }

        // 2. Initialize WebGL Shader Programs & VAO
        if (!memory.cwgl_prog) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('Cymatic WebGL Shader Error:', gl.getShaderInfoLog(s));
                }
                return s;
            };

            memory.cwgl_prog = gl.createProgram()!;
            gl.attachShader(memory.cwgl_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.cwgl_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.cwgl_prog);

            // Trail fading program for silky phosphor trails
            memory.cwgl_trailProg = gl.createProgram()!;
            gl.attachShader(memory.cwgl_trailProg, compile(gl.VERTEX_SHADER, TRAIL_VS));
            gl.attachShader(memory.cwgl_trailProg, compile(gl.FRAGMENT_SHADER, TRAIL_FS));
            gl.linkProgram(memory.cwgl_trailProg);
            memory.cwgl_trailFadeLoc = gl.getUniformLocation(memory.cwgl_trailProg as WebGLProgram, 'u_fadeColor');
            memory.cwgl_emptyVao = gl.createVertexArray();

            const getLoc = (name: string) => gl.getUniformLocation(memory.cwgl_prog as WebGLProgram, name);
            memory.cwgl_locs = {
                resolution: getLoc('u_resolution'),
                center: getLoc('u_center'),
                scale: getLoc('u_scale'),
                tiltScaleY: getLoc('u_tiltScaleY'),
                particleSize: getLoc('u_particleSize'),
                dpr: getLoc('u_dpr'),
                glow: getLoc('u_glow'),
                colorGain: getLoc('u_colorGain'),
                masterOpacity: getLoc('u_masterOpacity'),
                highMotionOpacity: getLoc('u_highMotionOpacity'),
                dominantColor: getLoc('u_dominantColor'),
                idleColor: getLoc('u_idleColor'),
                whiteColor: getLoc('u_whiteColor'),
                isNebula: getLoc('u_isNebula'),
                isChromatic: getLoc('u_isChromatic'),
                palette: getLoc('u_palette'),
                paletteSize: getLoc('u_paletteSize'),
                colorSyncMode: getLoc('u_colorSyncMode'),
                colorWheel: getLoc('u_colorWheel'),
                activePitchClass: getLoc('u_activePitchClass'),
                colorCycleSpeed: getLoc('u_colorCycleSpeed'),
                colorIntensity: getLoc('u_colorIntensity'),
                time: getLoc('u_time'),
                symmetry: getLoc('u_symmetry'),
                maxRadius: getLoc('u_maxRadius')
            };

            // Dynamic VBO for Positions and Velocities
            memory.cwgl_posBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_posBuf);
            gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * 2 * 4, gl.DYNAMIC_DRAW);

            memory.cwgl_velBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_velBuf);
            gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * 2 * 4, gl.DYNAMIC_DRAW);

            const indices = new Float32Array(MAX_PARTICLES);
            for (let i = 0; i < MAX_PARTICLES; i++) indices[i] = i;
            memory.cwgl_idxBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_idxBuf);
            gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            memory.cwgl_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.cwgl_vao);

            const prog = memory.cwgl_prog as WebGLProgram;
            const posLoc = gl.getAttribLocation(prog, 'a_pos');
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_posBuf);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            const velLoc = gl.getAttribLocation(prog, 'a_vel');
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_velBuf);
            gl.enableVertexAttribArray(velLoc);
            gl.vertexAttribPointer(velLoc, 2, gl.FLOAT, false, 0, 0);

            const idxLoc = gl.getAttribLocation(prog, 'a_index');
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_idxBuf);
            gl.enableVertexAttribArray(idxLoc);
            gl.vertexAttribPointer(idxLoc, 1, gl.FLOAT, false, 0, 0);
        }

        // 3. Audio & Chord Tone Extraction - Strictly Mirroring Sound, Glide Times, and Breath
        if (!memory.cwgl_waves) memory.cwgl_waves = new Map<string, DynamicWave>();
        if (!memory.cwgl_targetVolumes) memory.cwgl_targetVolumes = new Map<string, number>();
        if (!memory.cwgl_targetFreqs) memory.cwgl_targetFreqs = new Map<string, number>();

        const currentWaves = memory.cwgl_waves as Map<string, DynamicWave>;
        const targetVolumes = memory.cwgl_targetVolumes as Map<string, number>;
        const targetFreqs = memory.cwgl_targetFreqs as Map<string, number>;

        targetVolumes.clear();
        targetFreqs.clear();

        interface ToneCandidate { id: string; freq: number; baseVol: number; }
        const toneCandidates: ToneCandidate[] = [];
        const reactivity = getVal(cfg.reactivity, 1.0);
        const rawForce = getVal(cfg.force, 1.0);
        const forceMult = Math.max(0.1, rawForce);

        // Breath and Glide synchronization parameters
        const isBreathActive = Boolean(lensCtx.isBreathActive);
        const chordGlide = (lensCtx as unknown as { chordGlideConfig?: ChordGlideConfig }).chordGlideConfig;
        const isBreathSynced = isBreathActive || Boolean(chordGlide?.syncToBreath);
        const breathRadius = typeof lensCtx.breathRadius === 'number' ? lensCtx.breathRadius : 0.5;

        // Effective acoustic glide duration in seconds (mirrors chord portamento and breath timing)
        let glideTimeSec = 0.4; // default natural vocal glide
        if (chordGlide?.enabled !== false && typeof chordGlide?.time === 'number' && chordGlide.time > 0.01) {
            glideTimeSec = chordGlide.time;
        }
        if (isBreathSynced && chordGlide?.syncToBreath) {
            const breathConfig = (lensCtx as unknown as { breathConfig?: { inhale?: number; exhale?: number } }).breathConfig;
            const phaseDuration = (breathConfig?.inhale ?? 4.0);
            const mult = chordGlide.breathSyncMultiplier ?? 1.0;
            glideTimeSec = Math.max(1.8, phaseDuration * mult);
        }

        const customFreqs = (lensCtx as unknown as { customFrequencies?: Record<string, number> }).customFrequencies || {};

        // Extract all live sounding tones directly from audio amplitudes
        if (amplitudes) {
            amplitudes.forEach((rawAmp, chId) => {
                const amp = rawAmp * reactivity * 8.0;
                if (amp > 0.005) {
                    let freq = customFreqs[chId];
                    if (!freq) {
                        const channelDef = LATTICE_CHANNELS.find(c => c.id === chId);
                        if (channelDef) freq = channelDef.freq;
                    }
                    if (freq && freq > 10) {
                        toneCandidates.push({ id: chId, freq, baseVol: amp * forceMult });
                    }
                }
            });

            // Ensure chord voices (UNIVERSAL_840 - UNIVERSAL_847) are verified if present
            LATTICE_CHANNELS.forEach(ch => {
                if (!amplitudes.has(ch.id)) {
                    const rawAmp = amplitudes.get(ch.id) || 0;
                    const amp = rawAmp * reactivity * 8.0;
                    if (amp > 0.005) {
                        const freq = customFreqs[ch.id] ?? ch.freq;
                        toneCandidates.push({ id: ch.id, freq, baseVol: amp * forceMult });
                    }
                }
            });
        }

        if (bpm > 0 && HEART_HARMONIC_DEFS) {
            HEART_HARMONIC_DEFS.forEach((def, i) => {
                const id = `HEART_HARMONIC_${i}`;
                const rawAmp = amplitudes?.get(id) || 0;
                const amp = rawAmp * reactivity * 8.0;
                if (amp > 0.005) {
                    toneCandidates.push({ id, freq: (bpm / 60) * def.mult, baseVol: amp * forceMult });
                }
            });
        }

        const hasRealSound = toneCandidates.length > 0;

        // When audio is silent or paused:
        // Do NOT inject a loud fake 432Hz tone. Allow previous waves to decay to zero so sand settles cleanly.
        // For visualizer preview before audio has started, provide a gentle dormant mode only if memory has no waves:
        if (!hasRealSound && currentWaves.size === 0 && !lensCtx.audioEnabled) {
            toneCandidates.push({
                id: 'DORMANT_RESONANCE_432',
                freq: 432,
                baseVol: 0.15 * Math.max(0.2, forceMult)
            });
        }

        // Sort ascending by frequency for consistent ordering
        toneCandidates.sort((a, b) => a.freq - b.freq);

        // --- TONE JOURNEY SWEEP VS SUPERPOSITION ---
        const isExclusiveSweep = cfg.exclusiveToneSweep === 'ON' || cfg.exclusiveToneSweep === true;
        const sweepPos = Math.max(0.0, Math.min(1.0, getVal(cfg.toneSweepPos, 0.0)));

        if (isExclusiveSweep) {
            const N = toneCandidates.length;
            if (N === 1) {
                targetVolumes.set(toneCandidates[0].id, toneCandidates[0].baseVol);
                targetFreqs.set(toneCandidates[0].id, toneCandidates[0].freq);
            } else if (N > 1) {
                const sweepCoord = sweepPos * (N - 1);
                toneCandidates.forEach((candidate, idx) => {
                    const dist = Math.abs(sweepCoord - idx);
                    if (dist < 1.0) {
                        const weight = 0.5 * (1.0 + Math.cos(Math.PI * dist));
                        const vol = candidate.baseVol * weight;
                        if (vol > 0.002) {
                            targetVolumes.set(candidate.id, vol);
                            targetFreqs.set(candidate.id, candidate.freq);
                        }
                    }
                });
            }
        } else {
            toneCandidates.forEach(cand => {
                targetVolumes.set(cand.id, cand.baseVol);
                targetFreqs.set(cand.id, cand.freq);
            });
        }

        // Frame delta time in seconds
        const dtSec = Math.max(0.001, Math.min(0.1, (lensCtx.dt as number) || 0.016));

        // Frequency and volume glide rates synchronized with the actual acoustic glide time
        const freqTau = Math.max(0.01, glideTimeSec * 0.33);
        const freqGlideAlpha = 1.0 - Math.exp(-dtSec / freqTau);

        const volTau = Math.max(0.01, (isBreathSynced ? 0.8 : glideTimeSec * 0.28));
        const volGlideAlpha = 1.0 - Math.exp(-dtSec / volTau);

        // Update existing waves or spawn new wave entries
        targetVolumes.forEach((targetAmp, id) => {
            const targetF = targetFreqs.get(id) || 100;
            if (!currentWaves.has(id)) {
                const newWave: DynamicWave = {
                    n: 2, m: 1, k: Math.PI * 3.5, speed: 0.4, vol: 0,
                    color: getActiveHarmonicColor(targetF),
                    type: 'HARMONIC',
                    currentFreq: targetF,
                    contN: 2, contM: 1, contK: Math.PI * 3.5
                };
                getUniversalCymatic(targetF, newWave);
                newWave.contN = newWave.n;
                newWave.contM = newWave.m;
                newWave.contK = newWave.k;
                currentWaves.set(id, newWave);
            }
        });

        const activeModes: CymaticMode[] = [];
        let totalVol = 0;

        currentWaves.forEach((wave, id) => {
            const targetAmp = targetVolumes.get(id) || 0;
            const targetF = targetFreqs.get(id) || wave.currentFreq || 100;

            // 1. Continuous frequency glide moving with actual sound transition time
            if (wave.currentFreq === undefined) wave.currentFreq = targetF;
            wave.currentFreq += (targetF - wave.currentFreq) * freqGlideAlpha;

            // Recalculate cymatic mode from continuous frequency
            getUniversalCymatic(wave.currentFreq, wave);

            // 2. Smooth continuous modal morphing along the glide
            wave.contN = (wave.contN ?? wave.n) + (wave.n - (wave.contN ?? wave.n)) * freqGlideAlpha;
            wave.contM = (wave.contM ?? wave.m) + (wave.m - (wave.contM ?? wave.m)) * freqGlideAlpha;
            wave.contK = (wave.contK ?? wave.k) + (wave.k - (wave.contK ?? wave.k)) * freqGlideAlpha;

            // 3. Smooth harmonic color shifting
            wave.color = getActiveHarmonicColor(wave.currentFreq);

            // 4. Smooth volume fading
            const currentV = (wave.vol as number) || 0;
            const newV = currentV + (targetAmp - currentV) * volGlideAlpha;
            wave.vol = newV;

            if (newV > 0.002) {
                activeModes.push({
                    n: wave.n,
                    m: wave.m,
                    k: wave.contK ?? wave.k,
                    speed: wave.speed,
                    vol: newV,
                    volRatio: 0,
                    color: wave.color,
                    currentFreq: wave.currentFreq,
                    contN: wave.contN,
                    contM: wave.contM,
                    contK: wave.contK
                });
                totalVol += newV;
            } else if (targetAmp <= 0.001 && newV <= 0.002) {
                currentWaves.delete(id);
            }
        });

        // Dominant mode sorted first
        activeModes.sort((a, b) => b.vol - a.vol);

        const safeTotalVol = Math.max(0.001, totalVol);
        for (let i = 0; i < activeModes.length; i++) {
            activeModes[i].volRatio = activeModes[i].vol / safeTotalVol;
        }

        // 4. Synchronous Chladni Physics & Nodal Settling Simulation
        // Scaled by actual sound energy and breath state
        const soundEnergy = Math.min(2.5, totalVol);
        const isSilent = soundEnergy < 0.005;

        // Breath modulation of force: swells on inhale, softens on exhale
        const breathForceFactor = isBreathSynced
            ? (0.15 + 0.85 * Math.pow(Math.max(0, Math.min(1, breathRadius)), 1.15))
            : 1.0;
        const effectiveForce = forceMult * breathForceFactor;

        // Acoustic tone presence: 1.0 when active tones drive the plate, smoothly falling to 0.0 when tones fade out
        const tonePresence = (isSilent || !lensCtx.audioEnabled) ? 0.0 : Math.min(1.0, soundEnergy * 2.5);

        const normPos = memory.cwgl_normPos as Float32Array;
        const normVel = memory.cwgl_normVel as Float32Array;
        const pixelPos = memory.cwgl_pixelPos as Float32Array;
        const pixelVel = memory.cwgl_pixelVel as Float32Array;

        const modalFormula = String(cfg.modalFormula || 'CHLADNI');
        const nodalPolarity = String(cfg.nodalPolarity || 'ATTRACT');
        const isRepel = nodalPolarity === 'REPEL';
        const sym = getVal(cfg.harmonicSymmetry, 1);
        const snap = getVal(cfg.snapStrength, 1.2);
        const adhesion = getVal(cfg.membraneTension, 0.9);
        const agitationMultiplier = getVal(cfg.agitation, 0.55);
        const viscosity = getVal(cfg.viscosity, 0.48);
        const edgeRecycle = cfg.edgeRecycle === 'ON';
        const centralGravity = getVal(cfg.gravity, 0) * effectiveForce * tonePresence;
        const solarWindStrength = getVal(cfg.solarWind, 0) * effectiveForce * tonePresence;
        const flowFactor = getVal(cfg.streamFlow, 0);
        const vortexStream = flowFactor * effectiveForce * 1.5 * tonePresence;
        const turbulence = getVal(cfg.turbulence, 0.05);
        const roughness = getVal(cfg.harmonicRoughness, 0.0);
        const meshElasticity = getVal(cfg.meshElasticity, 0.25);
        const plateDamping = Math.max(0.05, Math.min(0.95, getVal(cfg.plateDamping, 0.3)));

        // Turbulence is purely acoustic plate vibration: when tones fade out, turbulence ceases completely
        const turbStrength = turbulence * effectiveForce * tonePresence;

        const stepH = 0.006;
        // Sound directly drives drift and vibration kick!
        // When sound is silent or fades out, acoustic displacement ceases completely.
        const driftMultiplier = 0.0035 * snap * effectiveForce * tonePresence;
        const kickMultiplier = 0.014 * agitationMultiplier * effectiveForce * tonePresence;
        const dragFactor = Math.max(0.7, 0.88 - (viscosity * 0.14));
        const stickFactor = Math.max(0.02, 0.15 * (1.0 - adhesion));

        for (let i = 0; i < activeParticleCount; i++) {
            const ix = i * 2;
            const iy = ix + 1;
            let u = normPos[ix];
            let v = normPos[iy];
            let vx = normVel[ix];
            let vy = normVel[iy];

            const w0 = evaluateSuperposition(activeModes, plateShape, modalFormula, u, v, sym, roughness);
            const amp0 = Math.abs(w0);
            const targetAmp = isRepel ? (1.0 - amp0) : amp0;

            if (targetAmp < 0.038) {
                // Stationary in nodal groove: zero vibration kick, high surface static friction
                vx *= stickFactor;
                vy *= stickFactor;

                // High turbulence creates micro-leakage out of shallow nodal lines
                if (turbStrength > 0.05) {
                    const leak = (turbStrength - 0.05) * 0.003;
                    vx += (Math.random() - 0.5) * leak;
                    vy += (Math.random() - 0.5) * leak;
                }
            } else {
                // On vibrating plate: calculate downhill gradient towards zero-displacement nodal groove
                const wU = evaluateSuperposition(activeModes, plateShape, modalFormula, u + stepH, v, sym, roughness);
                const wV = evaluateSuperposition(activeModes, plateShape, modalFormula, u, v + stepH, sym, roughness);
                const targetAmpU = isRepel ? (1.0 - Math.abs(wU)) : Math.abs(wU);
                const targetAmpV = isRepel ? (1.0 - Math.abs(wV)) : Math.abs(wV);

                const gradU = (targetAmpU * targetAmpU - targetAmp * targetAmp) / stepH;
                const gradV = (targetAmpV * targetAmpV - targetAmp * targetAmp) / stepH;

                // Downhill drift force
                vx -= gradU * driftMultiplier;
                vy -= gradV * driftMultiplier;

                // Vertical vibration kick
                const kick = kickMultiplier * targetAmp;
                vx += (Math.random() - 0.5) * kick;
                vy += (Math.random() - 0.5) * kick;

                // Environmental forces (shielded inside nodal lines)
                if (centralGravity > 0) {
                    vx -= u * centralGravity * 0.01;
                    vy -= v * centralGravity * 0.01;
                }
                if (vortexStream > 0) {
                    vx += -v * vortexStream * 0.01;
                    vy += u * vortexStream * 0.01;
                }
                if (solarWindStrength > 0) {
                    vx += solarWindStrength * 0.005;
                }

                // Plate Turbulence: dynamic aerodynamic micro-vortices & chaotic eddies
                if (turbStrength > 0.001) {
                    const tPhase = time * 1.5;
                    const eddyU = (Math.sin(v * 9.8 + tPhase) + Math.cos(v * 20.4 - tPhase * 0.6) * 0.5) * turbStrength * 0.012;
                    const eddyV = (Math.cos(u * 9.8 - tPhase) - Math.sin(u * 20.4 + tPhase * 0.6) * 0.5) * turbStrength * 0.012;
                    vx += eddyU;
                    vy += eddyV;
                    vx += (Math.random() - 0.5) * turbStrength * 0.006;
                    vy += (Math.random() - 0.5) * turbStrength * 0.006;
                }

                // Mesh Elasticity: restore acoustic grid coherence by damping wild perpendicular motions
                if (meshElasticity > 0 && targetAmp > 0.08) {
                    const elasticDamp = meshElasticity * 0.22;
                    vx *= (1.0 - elasticDamp);
                    vy *= (1.0 - elasticDamp);
                }

                // Dynamic air drag
                vx *= dragFactor;
                vy *= dragFactor;
            }

            // Actively still the sand if tones fade out: rapid viscous deceleration into motionless rest
            if (tonePresence < 0.08) {
                vx *= 0.62;
                vy *= 0.62;
                if (Math.abs(vx) < 0.00005) vx = 0.0;
                if (Math.abs(vy) < 0.00005) vy = 0.0;
            }

            // Speed clamping
            const speedSq = vx * vx + vy * vy;
            if (speedSq > 0.0025) {
                const speed = Math.sqrt(speedSq);
                vx = (vx / speed) * 0.05;
                vy = (vy / speed) * 0.05;
            }

            u += vx;
            v += vy;

            // Plate boundary clamping & bounce parameterized by plateDamping and geometry
            let atBoundary = false;
            let normX = 0;
            let normY = 0;

            if (plateShape === 'SQUARE') {
                if (Math.abs(u) > 0.94) {
                    atBoundary = true;
                    normX = Math.sign(u);
                    u = normX * 0.94;
                }
                if (Math.abs(v) > 0.94) {
                    atBoundary = true;
                    normY = Math.sign(v);
                    v = normY * 0.94;
                }
            } else if (plateShape === 'HEXAGON') {
                const hApothem = 0.94 * 0.866025;
                const d1 = 0.5 * u + 0.866025 * v;
                const d2 = 0.5 * u - 0.866025 * v;
                if (Math.abs(u) > 0.94 || Math.abs(d1) > hApothem || Math.abs(d2) > hApothem) {
                    atBoundary = true;
                    normX = u;
                    normY = v;
                    u *= 0.96;
                    v *= 0.96;
                }
            } else if (plateShape === 'OCTAGON') {
                const oApothem = 0.94 * 0.92388;
                const d1 = Math.abs((u + v) * INV_SQRT2);
                const d2 = Math.abs((u - v) * INV_SQRT2);
                if (Math.abs(u) > oApothem || Math.abs(v) > oApothem || d1 > oApothem || d2 > oApothem) {
                    atBoundary = true;
                    normX = u;
                    normY = v;
                    u *= 0.96;
                    v *= 0.96;
                }
            } else if (plateShape === 'TRIANGLE') {
                const yBottom = 0.94 * 0.5;
                const dotL = u * (-SQRT3_HALF) + (v - yBottom) * (-0.5);
                const dotR = u * SQRT3_HALF + (v - yBottom) * (-0.5);
                if (v > yBottom || dotL < 0 || dotR < 0) {
                    atBoundary = true;
                    normX = u;
                    normY = v;
                    u *= 0.95;
                    v *= 0.95;
                }
            } else if (plateShape === 'PENTAGON') {
                const pApothem = 0.94 * 0.809017;
                for (let j = 0; j < 5; j++) {
                    const ang = j * (TWO_PI / 5) - Math.PI * 0.5;
                    if (u * Math.cos(ang) + v * Math.sin(ang) > pApothem) {
                        atBoundary = true;
                        normX = Math.cos(ang);
                        normY = Math.sin(ang);
                        u *= 0.96;
                        v *= 0.96;
                        break;
                    }
                }
            } else if (plateShape === 'ELLIPSE') {
                const rEll = Math.sqrt((u * u) / 1.3225 + (v * v) / 0.7225);
                if (rEll > 0.94) {
                    atBoundary = true;
                    normX = u / 1.3225;
                    normY = v / 0.7225;
                    const factor = 0.94 / rEll;
                    u *= factor;
                    v *= factor;
                }
            } else {
                // CIRCLE
                const rSq = u * u + v * v;
                if (rSq > 0.8836) { // 0.94^2
                    atBoundary = true;
                    const r = Math.sqrt(rSq);
                    normX = u / r;
                    normY = v / r;
                    u = normX * 0.94;
                    v = normY * 0.94;
                }
            }

            if (atBoundary) {
                if (edgeRecycle && Math.random() < 0.06) {
                    // Respawn gently inside the plate geometry
                    let su = 0;
                    let sv = 0;
                    let attempts = 0;
                    do {
                        su = (Math.random() - 0.5) * 1.8;
                        sv = (Math.random() - 0.5) * 1.8;
                        attempts++;
                    } while (attempts < 10 && !insidePlateShape(plateShape, su, sv));
                    u = su;
                    v = sv;
                    vx = (Math.random() - 0.5) * 0.005;
                    vy = (Math.random() - 0.5) * 0.005;
                } else {
                    // Elastic rim collision dampened by plateDamping
                    const nLen = Math.sqrt(normX * normX + normY * normY);
                    if (nLen > 0.0001) {
                        const nx = normX / nLen;
                        const ny = normY / nLen;
                        const dot = vx * nx + vy * ny;
                        if (dot > 0) {
                            const restitution = 1.0 - plateDamping;
                            vx -= (1.0 + restitution) * dot * nx;
                            vy -= (1.0 + restitution) * dot * ny;
                        }
                    } else {
                        vx *= -(1.0 - plateDamping);
                        vy *= -(1.0 - plateDamping);
                    }
                }
            }

            normPos[ix] = u;
            normPos[iy] = v;
            normVel[ix] = vx;
            normVel[iy] = vy;

            // Scale normalized plate position to physical canvas pixels
            pixelPos[ix] = u * maxRadius;
            pixelPos[iy] = v * maxRadius;
            pixelVel[ix] = vx * maxRadius;
            pixelVel[iy] = vy * maxRadius;
        }

        // 5. Upload Render Positions and Velocities directly to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_posBuf as WebGLBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pixelPos.subarray(0, activeParticleCount * 2));

        gl.bindBuffer(gl.ARRAY_BUFFER, memory.cwgl_velBuf as WebGLBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pixelVel.subarray(0, activeParticleCount * 2));

        // 6. Viewport and Depth State
        gl.viewport(0, 0, w, h);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);

        // 7. Background Clearing & Phosphor Persistence Trails
        const cometTrails = Math.max(0.0, Math.min(0.9, getVal(cfg.cometTrails, 0.0)));
        if (cometTrails <= 0.02) {
            // Clean, pristine obsidian plate: 100% razor-sharp contrast, zero muddy accumulation
            gl.clearColor(0.012, 0.012, 0.014, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        } else {
            // Smooth phosphor motion persistence for active trails
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(memory.cwgl_trailProg as WebGLProgram);

            const fadeAlpha = Math.max(0.05, Math.min(0.96, (1.0 - cometTrails) * 0.85));
            gl.uniform4f(memory.cwgl_trailFadeLoc as WebGLUniformLocation, 0.012, 0.012, 0.014, fadeAlpha);
            gl.bindVertexArray(memory.cwgl_emptyVao as WebGLVertexArrayObject);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        // 8. Draw Tactile Sand Particles
        gl.enable(gl.BLEND);
        if (isNebula) {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else {
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }

        gl.useProgram(memory.cwgl_prog as WebGLProgram);
        gl.bindVertexArray(memory.cwgl_vao as WebGLVertexArrayObject);

        const locs = memory.cwgl_locs as Record<string, WebGLUniformLocation>;
        gl.uniform2f(locs.resolution, logicalW, logicalH);

        const cxNorm = (cx / w) * 2.0 - 1.0;
        const cyNorm = -((cy / h) * 2.0 - 1.0);
        gl.uniform2f(locs.center, cxNorm, cyNorm);

        const userZoom = (lensCtx.visualScale as number) ?? 1.0;
        gl.uniform1f(locs.scale, userZoom);

        const tiltDeg = getVal(cfg.perspectiveTilt, 0);
        const tiltScaleY = Math.max(0.05, 1.0 - (tiltDeg / 90.0));
        gl.uniform1f(locs.tiltScaleY, tiltScaleY);

        gl.uniform1f(locs.particleSize, getVal(cfg.particleSize, 1.2));
        gl.uniform1f(locs.dpr, dpr);

        // Sand opacity is preserved at full visibility: no opacity fade when tones fade out
        const effectiveMasterOpacity = getVal(cfg.masterOpacity, 1.0);
        gl.uniform1f(locs.masterOpacity, effectiveMasterOpacity);

        const motionOpacity = getVal(cfg.highMotionOpacity, 0.75);
        gl.uniform1f(locs.highMotionOpacity, motionOpacity);

        const effectiveGlow = getVal(cfg.glow, 0.75);
        gl.uniform1f(locs.glow, effectiveGlow);

        gl.uniform1f(locs.colorGain, getVal(cfg.colorGain, 2.2));
        gl.uniform1i(locs.isNebula, isNebula ? 1 : 0);
        gl.uniform1i(locs.isChromatic, cfg.chromaticPrism !== 'OFF' ? 1 : 0);

        const dominantHex = activeModes.length > 0 ? activeModes[0].color : (theme?.secondary || '#ffffff');
        const domRgb = parseColorToRgb(dominantHex);
        gl.uniform3f(locs.dominantColor, domRgb[0], domRgb[1], domRgb[2]);

        const minBrightness = getVal(cfg.minBrightness, 0.8);
        const lBase = Math.floor(215 + (minBrightness * 35));
        const lBoost = Math.floor(Math.min(1.5, effectiveGlow) * 15);
        const lTotal = Math.min(255, Math.max(180, lBase + lBoost));
        const idleVal = lTotal / 255;
        gl.uniform3f(locs.idleColor, idleVal, idleVal, idleVal);
        gl.uniform3f(locs.whiteColor, 1.0, 1.0, 1.0);

        // Upload chromatic palette
        const paletteArray = new Float32Array(24);
        const palSize = Math.min(8, activeModes.length);
        for (let i = 0; i < palSize; i++) {
            const rgb = parseColorToRgb(activeModes[i].color);
            paletteArray[i * 3] = rgb[0];
            paletteArray[i * 3 + 1] = rgb[1];
            paletteArray[i * 3 + 2] = rgb[2];
        }
        gl.uniform3fv(locs.palette, paletteArray);
        gl.uniform1i(locs.paletteSize, palSize);

        // Upload active 12-tone Color Wheel and Pattern Synchronization
        const wheelId = getActiveColorWheelId();
        const wheelPreset = COLOR_WHEEL_PRESETS[wheelId] || COLOR_WHEEL_PRESETS.MERRICK;
        const wheelColors = new Float32Array(36);
        for (let i = 0; i < 12; i++) {
            const rgb = parseColorToRgb(wheelPreset.colors[i]);
            wheelColors[i * 3] = rgb[0];
            wheelColors[i * 3 + 1] = rgb[1];
            wheelColors[i * 3 + 2] = rgb[2];
        }
        gl.uniform3fv(locs.colorWheel, wheelColors);

        let syncModeInt = 1; // Default HARMONIC_WHEEL
        const syncModeStr = String(cfg.colorSyncMode || 'HARMONIC_WHEEL');
        if (syncModeStr === 'OFF') syncModeInt = 0;
        else if (syncModeStr === 'HARMONIC_WHEEL') syncModeInt = 1;
        else if (syncModeStr === 'WAVE_INTERFERENCE') syncModeInt = 2;
        else if (syncModeStr === 'CHORD_SEPARATION') syncModeInt = 3;
        else if (syncModeStr === 'RADIAL_OCTAVE') syncModeInt = 4;
        else if (syncModeStr === 'KINETIC_SPECTRUM') syncModeInt = 5;

        gl.uniform1i(locs.colorSyncMode, syncModeInt);

        let dominantFreq = 432;
        if (activeModes.length > 0 && activeModes[0].currentFreq) {
            dominantFreq = activeModes[0].currentFreq;
        }
        const pitchInfo = getPitchClass(dominantFreq);
        gl.uniform1f(locs.activePitchClass, pitchInfo.noteIndex);
        gl.uniform1f(locs.colorCycleSpeed, getVal(cfg.colorCycleSpeed, 0.2));
        gl.uniform1f(locs.colorIntensity, getVal(cfg.colorIntensity, 1.5));
        gl.uniform1f(locs.time, time);
        gl.uniform1f(locs.symmetry, Math.max(1.0, getVal(cfg.harmonicSymmetry, 1)));
        gl.uniform1f(locs.maxRadius, maxRadius);

        gl.drawArrays(gl.POINTS, 0, activeParticleCount);
    },

    cleanup: ({ gl, memory }) => {
        if (memory.cwgl_waves) {
            (memory.cwgl_waves as Map<string, unknown>).clear();
            delete memory.cwgl_waves;
        }
        if (memory.cwgl_targetVolumes) delete memory.cwgl_targetVolumes;
        if (memory.cwgl_targetFreqs) delete memory.cwgl_targetFreqs;
        if (memory.cwgl_activeModes) delete memory.cwgl_activeModes;
        if (memory.cwgl_normPos) delete memory.cwgl_normPos;
        if (memory.cwgl_normVel) delete memory.cwgl_normVel;
        if (memory.cwgl_pixelPos) delete memory.cwgl_pixelPos;
        if (memory.cwgl_pixelVel) delete memory.cwgl_pixelVel;
        if (!gl) return;
        const gl2 = gl as WebGL2RenderingContext;
        if (memory.cwgl_prog) gl2.deleteProgram(memory.cwgl_prog as WebGLProgram);
        if (memory.cwgl_trailProg) gl2.deleteProgram(memory.cwgl_trailProg as WebGLProgram);
        if (memory.cwgl_posBuf) gl2.deleteBuffer(memory.cwgl_posBuf as WebGLBuffer);
        if (memory.cwgl_velBuf) gl2.deleteBuffer(memory.cwgl_velBuf as WebGLBuffer);
        if (memory.cwgl_idxBuf) gl2.deleteBuffer(memory.cwgl_idxBuf as WebGLBuffer);
        if (memory.cwgl_vao) gl2.deleteVertexArray(memory.cwgl_vao as WebGLVertexArrayObject);
        if (memory.cwgl_emptyVao) gl2.deleteVertexArray(memory.cwgl_emptyVao as WebGLVertexArrayObject);
        delete memory.cwgl_prog;
        delete memory.cwgl_trailProg;
        delete memory.cwgl_posBuf;
        delete memory.cwgl_velBuf;
        delete memory.cwgl_idxBuf;
        delete memory.cwgl_vao;
        delete memory.cwgl_emptyVao;
        delete memory.cwgl_locs;
        delete memory.cwgl_trailFadeLoc;
        delete memory.cwgl_initialized;
        delete memory.cwgl_lastShape;
    }
};
