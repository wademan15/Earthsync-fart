import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, getFrequencyHSL, getFrequencyRGB } from './shared';
import { FluidEngineGL } from '../../../services/kinematics/FluidEngineGL';

const getVal = (v: unknown, f: number) => (isNaN(parseFloat(v as string)) ? f : parseFloat(v as string));
const getStr = (v: unknown, f: string) => (typeof v === 'string' && v.length > 0 ? v : f);

export interface ChordVoice {
    freq: number;
    amp: number;
    rgb: { r: number; g: number; b: number }; // 0..1 normalized
    hsl: { h: number; s: number; l: number }; // h: 0..360, s: 0..1, l: 0..1
}

// Extracts active chord frequencies and evaluates them against the active Tone Color Wheel
export function extractChordVoices(context: LensContext): ChordVoice[] {
    const voices: ChordVoice[] = [];
    if (!context.amplitudes || context.amplitudes.size === 0) {
        const rgb = getFrequencyRGB(432.0);
        const hsl = getFrequencyHSL(432.0);
        return [{ freq: 432.0, amp: 1.0, rgb: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 }, hsl: { h: hsl.h * 360, s: hsl.s, l: hsl.l } }];
    }

    const customFreqs = (context.customFrequencies as Record<string, number>) || {};
    for (const [id, amp] of context.amplitudes.entries()) {
        if (amp > 0.005) {
            let freq = 0;
            const freqNum = typeof id === 'number' ? id : parseFloat(id as string);
            if (!isNaN(freqNum) && freqNum > 0) {
                freq = freqNum;
            } else if (customFreqs[id]) {
                freq = customFreqs[id];
            }
            if (freq > 0) {
                const rgb = getFrequencyRGB(freq);
                const hsl = getFrequencyHSL(freq);
                voices.push({
                    freq,
                    amp,
                    rgb: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
                    hsl: { h: hsl.h * 360, s: hsl.s, l: hsl.l }
                });
            }
        }
    }

    voices.sort((a, b) => b.amp - a.amp);

    if (voices.length === 0) {
        const rgb = getFrequencyRGB(432.0);
        const hsl = getFrequencyHSL(432.0);
        return [{ freq: 432.0, amp: 1.0, rgb: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 }, hsl: { h: hsl.h * 360, s: hsl.s, l: hsl.l } }];
    }

    return voices;
}

// Helper to convert dominant audio frequency to chromatic hue (0-360) using active color wheel
function getMerrickHue(freq: number): number {
    if (freq <= 0) return 180;
    return getFrequencyHSL(freq).h * 360.0;
}

// ── COLOR PALETTE RGB EXTRACTION FOR VOLUMETRIC EULERIAN DYE ──
function getPaletteRgb(paletteName: string, tNorm: number, merrickHue: number): { r: number; g: number; b: number } {
    const t = ((tNorm % 1.0) + 1.0) % 1.0;
    switch (paletteName) {
        case 'Ocean Bioluminescence': {
            if (t < 0.5) {
                const f = t / 0.5;
                return { r: 0.25 * (1 - f) + 0.05 * f, g: 0.88 * (1 - f) + 0.75 * f, b: 0.72 * (1 - f) + 0.92 * f };
            } else {
                const f = (t - 0.5) / 0.5;
                return { r: 0.05 * (1 - f) + 0.14 * f, g: 0.75 * (1 - f) + 0.28 * f, b: 0.92 * (1 - f) + 0.75 * f };
            }
        }
        case 'Incense Pearl': {
            if (t < 0.5) {
                const f = t / 0.5;
                return { r: 0.96 * (1 - f) + 0.62 * f, g: 0.97 * (1 - f) + 0.75 * f, b: 1.0 * (1 - f) + 0.88 * f };
            } else {
                const f = (t - 0.5) / 0.5;
                return { r: 0.62 * (1 - f) + 0.68 * f, g: 0.75 * (1 - f) + 0.55 * f, b: 0.88 * (1 - f) + 0.92 * f };
            }
        }
        case 'Solar Amber': {
            if (t < 0.5) {
                const f = t / 0.5;
                return { r: 1.0 * (1 - f) + 0.98 * f, g: 0.92 * (1 - f) + 0.62 * f, b: 0.55 * (1 - f) + 0.12 * f };
            } else {
                const f = (t - 0.5) / 0.5;
                return { r: 0.98 * (1 - f) + 0.92 * f, g: 0.62 * (1 - f) + 0.28 * f, b: 0.12 * (1 - f) + 0.42 * f };
            }
        }
        case 'Chord Polyphony (Live Wheel)':
        case 'Harmonic (Merrick)': {
            const h = (merrickHue / 360.0 + t * 0.3) % 1.0;
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = 0.85 * 0.1;
            const q = 0.85 * (1 - f * 0.9);
            const tc = 0.85 * (1 - (1 - f) * 0.9);
            const v = 0.85;
            switch (i % 6) {
                case 0: return { r: v, g: tc, b: p };
                case 1: return { r: q, g: v, b: p };
                case 2: return { r: p, g: v, b: tc };
                case 3: return { r: p, g: q, b: v };
                case 4: return { r: tc, g: p, b: v };
                default: return { r: v, g: p, b: q };
            }
        }
        case 'Sacred Ember': {
            if (t < 0.5) {
                const f = t / 0.5;
                return { r: 1.0 * (1 - f) + 1.0 * f, g: 0.92 * (1 - f) + 0.35 * f, b: 0.65 * (1 - f) + 0.08 * f };
            } else {
                const f = (t - 0.5) / 0.5;
                return { r: 1.0 * (1 - f) + 0.48 * f, g: 0.35 * (1 - f) + 0.08 * f, b: 0.08 * (1 - f) + 0.15 * f };
            }
        }
        case 'Ethereal Aurora':
        default: {
            if (t < 0.5) {
                const f = t / 0.5;
                return { r: 0.0 * (1 - f) + 0.08 * f, g: 0.94 * (1 - f) + 0.76 * f, b: 0.85 * (1 - f) + 0.55 * f };
            } else {
                const f = (t - 0.5) / 0.5;
                return { r: 0.08 * (1 - f) + 0.68 * f, g: 0.76 * (1 - f) + 0.35 * f, b: 0.55 * (1 - f) + 0.98 * f };
            }
        }
    }
}

// ── FAST 2D SIMPLEX/PERLIN GRADIENT NOISE FOR STREAMLINE RIBBONS ──
const P_NOISE = new Uint8Array(512);
const G_NOISE = new Float32Array(512 * 2);
for (let i = 0; i < 256; i++) {
    P_NOISE[i] = i;
    const a = (i / 256.0) * Math.PI * 2.0;
    G_NOISE[i * 2] = Math.cos(a);
    G_NOISE[i * 2 + 1] = Math.sin(a);
}
// Deterministic permutation shuffle
for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(i * 12.9898 + 78.233)) * 43758.5453) % (i + 1);
    const tmp = P_NOISE[i];
    P_NOISE[i] = P_NOISE[j];
    P_NOISE[j] = tmp;
}
for (let i = 0; i < 256; i++) {
    P_NOISE[256 + i] = P_NOISE[i];
    G_NOISE[(256 + i) * 2] = G_NOISE[i * 2];
    G_NOISE[(256 + i) * 2 + 1] = G_NOISE[i * 2 + 1];
}

function noise2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = xf * xf * (3.0 - 2.0 * xf);
    const v = yf * yf * (3.0 - 2.0 * yf);

    const g00 = (P_NOISE[P_NOISE[xi] + yi]) * 2;
    const g10 = (P_NOISE[P_NOISE[xi + 1] + yi]) * 2;
    const g01 = (P_NOISE[P_NOISE[xi] + yi + 1]) * 2;
    const g11 = (P_NOISE[P_NOISE[xi + 1] + yi + 1]) * 2;

    const d00 = G_NOISE[g00] * xf + G_NOISE[g00 + 1] * yf;
    const d10 = G_NOISE[g10] * (xf - 1.0) + G_NOISE[g10 + 1] * yf;
    const d01 = G_NOISE[g01] * xf + G_NOISE[g01 + 1] * (yf - 1.0);
    const d11 = G_NOISE[g11] * (xf - 1.0) + G_NOISE[g11 + 1] * (yf - 1.0);

    const x1 = d00 + u * (d10 - d00);
    const x2 = d01 + u * (d11 - d01);
    return x1 + v * (x2 - x1);
}

function sampleCurlNoise(x: number, y: number, t: number): [number, number] {
    const eps = 0.02;
    const n1 = noise2D(x + eps + t * 0.08, y);
    const n0 = noise2D(x - eps + t * 0.08, y);
    const ddx = (n1 - n0) / (2.0 * eps);

    const m1 = noise2D(x + t * 0.08, y + eps);
    const m0 = noise2D(x + t * 0.08, y - eps);
    const ddy = (m1 - m0) / (2.0 * eps);

    return [ddy, -ddx];
}

interface SmokeRibbon {
    points: Float32Array; // NODES_PER_RIBBON * 2 (x, y)
    age: number;
    maxAge: number;
    emitterAngle: number;
    emitterRadius: number;
    speedMult: number;
    ribbonId: number;
}

// ── PRESETS: THE LIVING SMOKE SUITE ──
const PRESETS: VisualizerPreset[] = [
    {
        id: 'smoke_celestial_incense',
        name: '01. Celestial Incense Wisp',
        config: { 
            smokeEngine: 'Silk Streamline Ribbons',
            ribbonWidth: 8.0,
            zoom: 1.0,
            flowSpeed: 0.18,
            turbulence: 0.35,
            gravityWell: 0.04,
            vortexSpin: 0.25,
            trailLength: 0.95,
            emberGlow: 1.8,
            pointSize: 2.4,
            colorPalette: 'Ethereal Aurora',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 1
        },
        modulations: { 
            flowSpeed: { enabled: true, min: 0.08, max: 0.28, amtBreath: 1.0, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 1.2, max: 2.6, amtBreath: 0.8, amtBinaural: 0.4, mixMode: 'ADD' },
            turbulence: { enabled: true, min: 0.15, max: 0.55, amtBreath: -0.5, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_bioluminescent_vortex',
        name: '02. Bioluminescent Vapor Vortex',
        config: { 
            smokeEngine: 'Volumetric Fluid (Eulerian)',
            ribbonWidth: 9.0,
            zoom: 1.15,
            flowSpeed: 0.22,
            turbulence: 0.28,
            gravityWell: 0.12,
            vortexSpin: 0.55,
            trailLength: 0.96,
            emberGlow: 2.0,
            pointSize: 2.6,
            colorPalette: 'Ocean Bioluminescence',
            colorShift: 0.1,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 1
        },
        modulations: { 
            vortexSpin: { enabled: true, min: 0.3, max: 0.8, amtBinaural: 0.8, mixMode: 'MULT' },
            gravityWell: { enabled: true, min: 0.04, max: 0.22, amtBreath: 0.9, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 1.4, max: 3.0, amtBreath: 0.7, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_astral_pearl',
        name: '03. Pearlescent Prana Mist',
        config: { 
            smokeEngine: 'Volumetric Fluid (Eulerian)',
            ribbonWidth: 7.5,
            zoom: 0.9,
            flowSpeed: 0.12,
            turbulence: 0.45,
            gravityWell: 0.02,
            vortexSpin: 0.15,
            trailLength: 0.97,
            emberGlow: 1.6,
            pointSize: 2.2,
            colorPalette: 'Incense Pearl',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 1
        },
        modulations: { 
            flowSpeed: { enabled: true, min: 0.06, max: 0.18, amtBreath: 0.8, mixMode: 'MULT' },
            pointSize: { enabled: true, min: 1.4, max: 3.4, amtBreath: 0.6, mixMode: 'MULT' }
        }
    },
    {
        id: 'smoke_solar_amber',
        name: '04. Solar Amber Corona',
        config: { 
            smokeEngine: 'Volumetric Fluid (Eulerian)',
            ribbonWidth: 10.0,
            zoom: 1.25,
            flowSpeed: 0.24,
            turbulence: 0.32,
            gravityWell: 0.06,
            vortexSpin: 0.35,
            trailLength: 0.94,
            emberGlow: 2.2,
            pointSize: 2.5,
            colorPalette: 'Solar Amber',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 1
        },
        modulations: { 
            flowSpeed: { enabled: true, min: 0.12, max: 0.36, amtBreath: 1.1, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 1.6, max: 3.4, amtAudio: 1.0, amtBreath: 0.6, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_harmonic_merrick',
        name: '05. Harmonic Spectral Vapor',
        config: { 
            smokeEngine: 'Silk Streamline Ribbons',
            ribbonWidth: 8.5,
            zoom: 1.05,
            flowSpeed: 0.16,
            turbulence: 0.25,
            gravityWell: 0.05,
            vortexSpin: 0.3,
            trailLength: 0.95,
            emberGlow: 1.9,
            pointSize: 2.3,
            colorPalette: 'Harmonic (Merrick)',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 1
        },
        modulations: { 
            flowSpeed: { enabled: true, min: 0.08, max: 0.25, amtBreath: 0.9, mixMode: 'MULT' },
            vortexSpin: { enabled: true, min: 0.1, max: 0.6, amtBinaural: 0.7, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_phi_cone_implosion',
        name: '06. Golden Phi Spiral Smoke',
        config: {
            smokeEngine: 'Volumetric Fluid (Eulerian)',
            ribbonWidth: 9.5,
            zoom: 1.35,
            flowSpeed: 0.20,
            turbulence: 0.18,
            gravityWell: 0.28,
            vortexSpin: 0.72,
            trailLength: 0.975,
            emberGlow: 2.6,
            pointSize: 2.2,
            colorPalette: 'Ocean Bioluminescence',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 8
        },
        modulations: {
            gravityWell: { enabled: true, min: 0.12, max: 0.38, amtHeart: 0.6, amtCoh: 0.5, mixMode: 'MULT' },
            vortexSpin: { enabled: true, min: 0.35, max: 0.95, amtBinaural: 0.85, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 1.8, max: 3.8, amtBinaural: 0.8, amtBreath: 0.5, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_metatron_matrix',
        name: '07. Crystalline Astral Vapor',
        config: {
            smokeEngine: 'Silk Streamline Ribbons',
            ribbonWidth: 7.0,
            zoom: 1.10,
            flowSpeed: 0.22,
            turbulence: 0.10,
            gravityWell: 0.08,
            vortexSpin: 0.40,
            trailLength: 0.965,
            emberGlow: 2.2,
            pointSize: 2.1,
            colorPalette: 'Incense Pearl',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 12
        },
        modulations: {
            emberGlow: { enabled: true, min: 1.5, max: 3.2, amtCoh: 0.85, amtBinaural: 0.4, mixMode: 'ADD' },
            flowSpeed: { enabled: true, min: 0.12, max: 0.32, amtBreath: 0.75, mixMode: 'MULT' }
        }
    },
    {
        id: 'smoke_sri_yantra_temple',
        name: '08. Sri Yantra Sacred Smoke',
        config: {
            smokeEngine: 'Volumetric Fluid (Eulerian)',
            ribbonWidth: 8.5,
            zoom: 1.20,
            flowSpeed: 0.19,
            turbulence: 0.22,
            gravityWell: 0.18,
            vortexSpin: 0.618,
            trailLength: 0.97,
            emberGlow: 2.4,
            pointSize: 2.3,
            colorPalette: 'Harmonic (Merrick)',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 6
        },
        modulations: {
            gravityWell: { enabled: true, min: 0.08, max: 0.32, amtHeart: 0.8, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 1.6, max: 3.5, amtAudio: 0.6, amtBinaural: 0.7, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_flower_of_life',
        name: '09. Genesis Flower of Life Plume',
        config: {
            smokeEngine: 'Silk Streamline Ribbons',
            ribbonWidth: 11.0,
            zoom: 0.85,
            flowSpeed: 0.15,
            turbulence: 0.18,
            gravityWell: 0.05,
            vortexSpin: 0.28,
            trailLength: 0.96,
            emberGlow: 2.0,
            pointSize: 2.5,
            colorPalette: 'Ethereal Aurora',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 6
        },
        modulations: {
            zoom: { enabled: true, min: 0.65, max: 1.15, amtBreath: 0.85, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 1.4, max: 3.0, amtBreath: 0.9, mixMode: 'ADD' }
        }
    },
    {
        id: 'smoke_venus_pentagram_rose',
        name: '10. Venus Rose Pentagram Bloom',
        config: {
            smokeEngine: 'Volumetric Fluid (Eulerian)',
            ribbonWidth: 12.0,
            zoom: 1.15,
            flowSpeed: 0.21,
            turbulence: 0.26,
            gravityWell: 0.14,
            vortexSpin: 0.55,
            trailLength: 0.975,
            emberGlow: 2.5,
            pointSize: 2.2,
            colorPalette: 'Solar Amber',
            colorShift: 0.05,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 10
        },
        modulations: {
            vortexSpin: { enabled: true, min: 0.25, max: 0.75, amtBinaural: 0.75, mixMode: 'MULT' },
            gravityWell: { enabled: true, min: 0.06, max: 0.24, amtBreath: 0.6, amtCoh: 0.4, mixMode: 'MULT' }
        }
    },
    {
        id: 'smoke_zero_point_dynamo',
        name: '11. Toroidal Singularity Plume',
        config: {
            smokeEngine: 'Silk Streamline Ribbons',
            ribbonWidth: 8.0,
            zoom: 1.30,
            flowSpeed: 0.28,
            turbulence: 0.14,
            gravityWell: 0.35,
            vortexSpin: 0.85,
            trailLength: 0.98,
            emberGlow: 2.8,
            pointSize: 2.0,
            colorPalette: 'Ocean Bioluminescence',
            colorShift: 0.0,
            seedX: 0.0,
            seedY: 0.0,
            kaleidoscope: 16
        },
        modulations: {
            gravityWell: { enabled: true, min: 0.18, max: 0.40, amtHeart: 0.85, amtBreath: 0.6, mixMode: 'MULT' },
            emberGlow: { enabled: true, min: 2.0, max: 4.2, amtBinaural: 1.0, mixMode: 'ADD' }
        }
    }
];

// ── SHADERS: FLUID SIMULATION & POINT SPRITE RENDERING ──

const VS_QUAD = `#version 300 es
layout(location = 0) in vec2 a_p; 
out vec2 v_uv; 
void main() { 
    v_uv = a_p * 0.5 + 0.5; 
    gl_Position = vec4(a_p, 0.0, 1.0); 
}`;

const FS_PHYSICS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_posTex;
uniform float u_time;
uniform vec2 u_seed;
uniform float u_zoom, u_flowSpeed, u_gravityWell, u_turbulence, u_vortexSpin;
uniform float u_audioReactivity;
uniform float u_breath;
uniform float u_binauralHz;

out vec4 fragColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// 2D Simplex-like Perlin Gradient Noise for Fluid Flow
vec2 hash2(vec2 p) {
    vec2 p2 = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p2) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// Divergence-Free 2D Curl of Potential Field
vec2 curlNoise(vec2 p, float t) {
    float eps = 0.015;
    vec2 pT = p + vec2(t * 0.12, cos(t * 0.08) * 0.2);
    
    // Multi-octave potential field
    float psi_x1 = (noise((pT + vec2(eps, 0.0)) * 1.5) + noise((pT + vec2(eps, 0.0)) * 3.2 + vec2(5.2, 1.3)) * 0.5);
    float psi_x0 = (noise((pT - vec2(eps, 0.0)) * 1.5) + noise((pT - vec2(eps, 0.0)) * 3.2 + vec2(5.2, 1.3)) * 0.5);
    float dpsi_dx = (psi_x1 - psi_x0) / (2.0 * eps);

    float psi_y1 = (noise((pT + vec2(0.0, eps)) * 1.5) + noise((pT + vec2(0.0, eps)) * 3.2 + vec2(5.2, 1.3)) * 0.5);
    float psi_y0 = (noise((pT - vec2(0.0, eps)) * 1.5) + noise((pT - vec2(0.0, eps)) * 3.2 + vec2(5.2, 1.3)) * 0.5);
    float dpsi_dy = (psi_y1 - psi_y0) / (2.0 * eps);

    // 2D Curl: (dPsi/dy, -dPsi/dx)
    return vec2(dpsi_dy, -dpsi_dx);
}

void main() {
    vec4 data = texture(u_posTex, v_uv);
    vec2 pos = data.xy;
    float age = data.z;
    float lifeRaw = data.w;
    float life = lifeRaw <= 0.0 ? 1.0 : lifeRaw;

    age += 0.008;

    // Self-healing memory guard
    bool isCorrupt = isnan(pos.x) || isnan(pos.y) || isnan(age) || isnan(life);
    bool isBlank = (age <= 0.01 && life == 0.0);
    float distSq = dot(pos, pos);

    if (age >= life || distSq > 12.0 || isCorrupt || isBlank) {
        // Respawn in harmonic golden distribution
        float h1 = hash(v_uv + u_time);
        float h2 = hash(v_uv + u_time + 7.13);
        
        float r = sqrt(h1) * 2.2;
        float theta = h2 * 6.2831853;
        pos = vec2(cos(theta), sin(theta)) * r + u_seed * 0.5;
        
        age = 0.0;
        life = 1.5 + hash(v_uv * 4.0 + u_time) * 2.5;
    } else {
        vec2 p = pos * u_zoom;
        
        // 1. Fluid Curl Vector (Laminar stream currents)
        vec2 curl = curlNoise(p, u_time * 0.4);
        
        // 2. Golden-Ratio Toroidal Spiral Vortex
        vec2 relPos = pos - u_seed * 0.5;
        float r = length(relPos) + 0.0001;
        vec2 tangent = vec2(-relPos.y, relPos.x) / r;
        vec2 normal = -relPos / r;
        
        // Dynamic vortex twist with breathing modulation
        float breathExpansion = (u_breath - 0.5) * 2.0; // -1 to +1
        vec2 spiral = (tangent * u_vortexSpin) + (normal * (u_gravityWell - breathExpansion * 0.03));

        // 3. Binaural micro-flutter & Audio reactivity
        float binauralShimmer = sin(u_time * max(1.0, u_binauralHz * 2.0) + r * 4.0) * 0.04;
        
        // Combine velocities into smooth wind vector
        vec2 vel = (curl * u_flowSpeed * (1.0 + u_turbulence * 1.5)) + (spiral * u_flowSpeed * 1.2);
        vel += normal * (binauralShimmer + u_audioReactivity * 0.15);

        pos += vel * 0.016; 
    }

    fragColor = vec4(pos, age, life);
}`;

const VS_RENDER = `#version 300 es
layout(location = 0) in vec2 a_particle_uv; 

uniform sampler2D u_posTex;
uniform float u_aspect;
uniform vec2 u_center;
uniform float u_emberGlow;
uniform float u_colorShift;
uniform float u_audioReactivity;
uniform float u_visualScale;
uniform float u_pointSize;
uniform int u_paletteMode;
uniform float u_harmonicHue;
uniform float u_breath;
uniform vec4 u_chordHues;
uniform int u_chordCount;

out vec4 v_color;
out float v_lifePhase;

vec3 hueShift(vec3 col, float shift) {
    vec3 m = vec3(cos(shift), -sin(shift) * 0.57735, 0.0);
    m = vec3(m.x + m.y, m.x - m.y, -m.y);
    float v = 0.57735;
    vec3 a = vec3(v, v, v);
    return mix(vec3(dot(a, col)), col, m.x) + cross(a, col) * m.y;
}

vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
    vec4 data = texture(u_posTex, a_particle_uv);
    vec2 pos = data.xy;
    float age = data.z;
    float life = max(0.1, data.w);

    // Hardware safety cull
    if (isnan(pos.x) || isnan(pos.y) || abs(pos.x) > 15.0 || abs(pos.y) > 15.0) {
        gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
        v_color = vec4(0.0);
        v_lifePhase = 0.0;
        return;
    }

    float tNorm = clamp(age / life, 0.0, 1.0);
    v_lifePhase = tNorm;
    
    // Smooth ingress & egress envelope
    float alpha = smoothstep(0.0, 0.15, tNorm) * smoothstep(1.0, 0.7, tNorm);

    // ── ZEN SMOKE COLOR PALETTES ──
    vec3 col = vec3(1.0);

    if (u_paletteMode == 0) {
        // Ethereal Aurora Smoke: Electric Aqua -> Jade Mint -> Astral Violet Smoke
        vec3 c1 = vec3(0.0, 0.94, 0.85);
        vec3 c2 = vec3(0.08, 0.76, 0.55);
        vec3 c3 = vec3(0.68, 0.35, 0.98);
        col = mix(c1, c2, smoothstep(0.0, 0.5, tNorm));
        col = mix(col, c3, smoothstep(0.5, 1.0, tNorm));
    } else if (u_paletteMode == 1) {
        // Ocean Bioluminescence: Seafoam Aqua -> Electric Cyan -> Deep Abyssal Blue
        vec3 c1 = vec3(0.25, 0.88, 0.72);
        vec3 c2 = vec3(0.05, 0.75, 0.92);
        vec3 c3 = vec3(0.14, 0.28, 0.75);
        col = mix(c1, c2, smoothstep(0.0, 0.45, tNorm));
        col = mix(col, c3, smoothstep(0.45, 1.0, tNorm));
    } else if (u_paletteMode == 2) {
        // Incense Pearl: Silvery Opalescent White -> Sage Haze -> Celestial Amethyst
        vec3 c1 = vec3(0.96, 0.97, 1.0);
        vec3 c2 = vec3(0.62, 0.75, 0.88);
        vec3 c3 = vec3(0.68, 0.55, 0.92);
        col = mix(c1, c2, smoothstep(0.0, 0.4, tNorm));
        col = mix(col, c3, smoothstep(0.4, 1.0, tNorm));
    } else if (u_paletteMode == 3) {
        // Solar Amber: Golden Sandalwood Smoke -> Honey Amber -> Rose Quartz Embers
        vec3 c1 = vec3(1.0, 0.92, 0.55);
        vec3 c2 = vec3(0.98, 0.62, 0.12);
        vec3 c3 = vec3(0.92, 0.28, 0.42);
        col = mix(c1, c2, smoothstep(0.0, 0.5, tNorm));
        col = mix(col, c3, smoothstep(0.5, 1.0, tNorm));
    } else if (u_paletteMode == 4) {
        // Chord Polyphony / Harmonic (Live Color Wheel):
        // Partition particle population across active chord voice tones
        int chordN = max(1, min(4, u_chordCount));
        int voiceIdx = int(floor(a_particle_uv.x * float(chordN))) % chordN;
        float baseHue = (voiceIdx == 0) ? u_chordHues.x :
                        (voiceIdx == 1) ? u_chordHues.y :
                        (voiceIdx == 2) ? u_chordHues.z : u_chordHues.w;
        float hue0 = fract(baseHue + a_particle_uv.y * 0.04);
        float hue1 = fract(hue0 + 0.08);
        float hue2 = fract(hue0 + 0.25);
        vec3 c1 = hsl2rgb(vec3(hue0, 0.85, 0.75));
        vec3 c2 = hsl2rgb(vec3(hue1, 0.9, 0.55));
        vec3 c3 = hsl2rgb(vec3(hue2, 0.95, 0.4));
        col = mix(c1, c2, smoothstep(0.0, 0.5, tNorm));
        col = mix(col, c3, smoothstep(0.5, 1.0, tNorm));
    } else {
        // Sacred Ember Smoke: White-Hot Core -> Sacred Incense Flame -> Deep Velvet Smoke
        vec3 hot = vec3(1.0, 0.92, 0.65);
        vec3 core = vec3(1.0, 0.35, 0.08);
        vec3 tail = vec3(0.48, 0.08, 0.15);
        col = mix(hot, core, smoothstep(0.0, 0.3, tNorm));
        col = mix(col, tail, smoothstep(0.3, 1.0, tNorm));
    }

    if (u_colorShift > 0.001) {
        col = hueShift(col, u_colorShift * 6.28318);
    }

    // Position mapping
    vec2 screenPos = pos * max(0.001, u_visualScale); 
    screenPos.x /= u_aspect;
    screenPos += u_center; 

    gl_Position = vec4(screenPos, 0.0, 1.0);
    
    // Fine silky smoke filaments: microscopic motes tracing fluid streamlines
    float dynamicSize = u_pointSize * (0.7 + tNorm * 0.7);
    gl_PointSize = clamp(dynamicSize, 1.0, 10.0);
    
    float reactiveGlow = u_emberGlow * (1.0 + u_audioReactivity * 1.2);
    // Crisp luminous color with rich dynamic range
    v_color = vec4(col * reactiveGlow * 0.15 * alpha, alpha);
}
`;

const FS_RENDER = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_lifePhase;
out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distSq = dot(coord, coord);
    if (distSq > 0.25) {
        discard;
    }
    
    // High-definition silky smoke wisp profile: crisp bright core with delicate soft edge
    float d = sqrt(distSq) * 2.0;
    float core = exp(-d * d * 5.0);
    float feather = smoothstep(1.0, 0.0, d);
    float density = core * feather;
    
    fragColor = vec4(v_color.rgb * density, v_color.a * density);
}`;

const FS_TRAIL = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_screenTex;
uniform float u_trailLength;
out vec4 fragColor;

void main() {
    // Pure persistence feedback: preserves razor-sharp curling vortex filaments without smudging
    vec4 prev = texture(u_screenTex, v_uv);
    fragColor = vec4(prev.rgb * u_trailLength, 1.0);
}`;

const FS_COMPOSITE = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_center;
uniform float u_masterOpacity;
uniform float u_kaleidoscope;
uniform float u_aspect;
out vec4 fragColor;

void main() {
    vec2 uv = v_uv;
    if (u_kaleidoscope > 1.5) {
        // Center-relative coordinates with aspect correction for circular symmetry
        vec2 p = (v_uv * 2.0 - 1.0) - u_center;
        p.x *= u_aspect;
        
        float r = length(p);
        float theta = atan(p.y, p.x);
        
        float sectors = float(int(u_kaleidoscope + 0.5));
        float sectorAngle = 6.28318530718 / sectors;
        
        // Bilateral mirror folding
        theta = mod(theta, sectorAngle);
        if (theta > sectorAngle * 0.5) {
            theta = sectorAngle - theta;
        }
        
        vec2 foldedP = vec2(cos(theta), sin(theta)) * r;
        foldedP.x /= u_aspect;
        uv = (foldedP + u_center + 1.0) * 0.5;
        uv = clamp(uv, 0.001, 0.999);
    }

    vec3 col = texture(u_tex, uv).rgb;
    
    // Contrast enhancement & tone-mapping: deep inky blacks and crisp luminous wisps
    // Completely eliminates the washed-out milky haze while preserving fine filament detail
    col = pow(col, vec3(1.15));
    col = col / (1.0 + col * 0.25);
    
    // Gentle wide vignette to soften extreme edges without tunneling
    float r = length((v_uv * 2.0 - 1.0) - u_center);
    col *= smoothstep(1.8, 0.9, r);

    fragColor = vec4(col, clamp(u_masterOpacity, 0.0, 1.0));
}`;

const VS_RIBBON = `#version 300 es
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_norm;
layout(location = 2) in float a_side;
layout(location = 3) in float a_t;
layout(location = 4) in float a_phase;

uniform float u_aspect;
uniform vec2 u_center;
uniform float u_visualScale;
uniform float u_ribbonWidth;
uniform float u_emberGlow;
uniform float u_colorShift;
uniform int u_paletteMode;
uniform float u_harmonicHue;
uniform float u_breath;
uniform vec4 u_chordHues;
uniform int u_chordCount;

out vec4 v_color;
out float v_side;
out float v_t;

vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

vec3 hueShift(vec3 color, float shift) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(shift);
    return vec3(color * cosAngle + cross(k, color) * sin(shift) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {
    v_side = a_side;
    v_t = a_t;

    float w = (u_ribbonWidth * 0.0035) * (0.35 + a_t * 1.6) * (0.85 + u_breath * 0.35);
    vec2 pos = a_pos + a_norm * (a_side * w);
    pos *= max(0.001, u_visualScale);
    pos.x /= u_aspect;
    pos += u_center;

    gl_Position = vec4(pos, 0.0, 1.0);

    float tNorm = a_t;
    vec3 col = vec3(1.0);

    if (u_paletteMode == 0) {
        vec3 c1 = vec3(0.0, 0.94, 0.85);
        vec3 c2 = vec3(0.08, 0.76, 0.55);
        vec3 c3 = vec3(0.68, 0.35, 0.98);
        col = mix(c1, c2, smoothstep(0.0, 0.5, tNorm));
        col = mix(col, c3, smoothstep(0.5, 1.0, tNorm));
    } else if (u_paletteMode == 1) {
        vec3 c1 = vec3(0.25, 0.88, 0.72);
        vec3 c2 = vec3(0.05, 0.75, 0.92);
        vec3 c3 = vec3(0.14, 0.28, 0.75);
        col = mix(c1, c2, smoothstep(0.0, 0.45, tNorm));
        col = mix(col, c3, smoothstep(0.45, 1.0, tNorm));
    } else if (u_paletteMode == 2) {
        vec3 c1 = vec3(0.96, 0.97, 1.0);
        vec3 c2 = vec3(0.62, 0.75, 0.88);
        vec3 c3 = vec3(0.68, 0.55, 0.92);
        col = mix(c1, c2, smoothstep(0.0, 0.4, tNorm));
        col = mix(col, c3, smoothstep(0.4, 1.0, tNorm));
    } else if (u_paletteMode == 3) {
        vec3 c1 = vec3(1.0, 0.92, 0.55);
        vec3 c2 = vec3(0.98, 0.62, 0.12);
        vec3 c3 = vec3(0.92, 0.28, 0.42);
        col = mix(c1, c2, smoothstep(0.0, 0.5, tNorm));
        col = mix(col, c3, smoothstep(0.5, 1.0, tNorm));
    } else if (u_paletteMode == 4) {
        // Chord Polyphony / Harmonic (Live Color Wheel):
        // Partition continuous silk ribbons across active chord voices
        int chordN = max(1, min(4, u_chordCount));
        int voiceIdx = int(floor(a_phase * float(chordN))) % chordN;
        float baseHue = (voiceIdx == 0) ? u_chordHues.x :
                        (voiceIdx == 1) ? u_chordHues.y :
                        (voiceIdx == 2) ? u_chordHues.z : u_chordHues.w;
        float hue0 = fract(baseHue + fract(a_phase * 0.08));
        float hue1 = fract(hue0 + 0.08);
        float hue2 = fract(hue0 + 0.25);
        vec3 c1 = hsl2rgb(vec3(hue0, 0.85, 0.75));
        vec3 c2 = hsl2rgb(vec3(hue1, 0.9, 0.55));
        vec3 c3 = hsl2rgb(vec3(hue2, 0.95, 0.4));
        col = mix(c1, c2, smoothstep(0.0, 0.5, tNorm));
        col = mix(col, c3, smoothstep(0.5, 1.0, tNorm));
    } else {
        vec3 hot = vec3(1.0, 0.92, 0.65);
        vec3 core = vec3(1.0, 0.35, 0.08);
        vec3 tail = vec3(0.48, 0.08, 0.15);
        col = mix(hot, core, smoothstep(0.0, 0.3, tNorm));
        col = mix(col, tail, smoothstep(0.3, 1.0, tNorm));
    }

    if (u_colorShift > 0.001) {
        col = hueShift(col, u_colorShift * 6.28318);
    }

    float alpha = smoothstep(0.0, 0.08, a_t) * (1.0 - smoothstep(0.6, 1.0, a_t));
    v_color = vec4(col * u_emberGlow * 0.4, alpha);
}`;

const FS_RIBBON = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_side;
in float v_t;
out vec4 fragColor;

void main() {
    float d = abs(v_side);
    float core = exp(-d * d * 3.5);
    float edge = smoothstep(1.0, 0.1, d);
    float profile = core * edge;
    fragColor = vec4(v_color.rgb * profile, v_color.a * profile);
}`;

const NUM_RIBBONS = 128;
const NODES_PER_RIBBON = 48;

function stepRibbons(
    ribbons: SmokeRibbon[],
    vertexData: Float32Array,
    time: number,
    dt: number,
    flowSpeed: number,
    turbulence: number,
    vortexSpin: number,
    gravityWell: number,
    seedX: number,
    seedY: number,
    breath: number
) {
    let vIdx = 0;
    const speed = (flowSpeed * 0.8 + 0.05) * (0.8 + breath * 0.5);

    for (let r = 0; r < ribbons.length; r++) {
        const ribbon = ribbons[r];
        const pts = ribbon.points;
        ribbon.age += 1;

        // Shift nodes down (history propagation)
        for (let i = NODES_PER_RIBBON - 1; i > 0; i--) {
            const cur = i * 2;
            const prev = (i - 1) * 2;
            pts[cur] = pts[prev];
            pts[cur + 1] = pts[prev + 1];
        }

        // Evaluate velocity at head
        const hx = pts[0];
        const hy = pts[1];

        // Centered coordinates
        const dx = hx - seedX;
        const dy = hy - seedY;
        const distSq = dx * dx + dy * dy + 0.001;
        const dist = Math.sqrt(distSq);

        // Toroidal swirl
        const swirlX = -dy / (dist + 0.15) * vortexSpin;
        const swirlY = dx / (dist + 0.15) * vortexSpin;

        // Gravity well
        const gravX = -dx * gravityWell / (dist + 0.1);
        const gravY = -dy * gravityWell / (dist + 0.1);

        // Curl noise
        const [curlX, curlY] = sampleCurlNoise(hx * 2.5, hy * 2.5, time * 0.2);

        // Combined velocity
        const vx = (swirlX + gravX + curlX * turbulence * 1.5) * speed;
        const vy = (swirlY + gravY + curlY * turbulence * 1.5) * speed;

        pts[0] += vx * 60.0 * dt;
        pts[1] += vy * 60.0 * dt;

        // Respawn if too old or out of bounds
        if (ribbon.age > ribbon.maxAge || Math.abs(pts[0]) > 2.5 || Math.abs(pts[1]) > 2.5) {
            ribbon.age = 0;
            ribbon.maxAge = 120 + Math.floor(Math.random() * 120);
            ribbon.emitterAngle = (r / ribbons.length) * Math.PI * 2.0 + Math.random() * 0.2;
            ribbon.emitterRadius = 0.02 + Math.random() * 0.08;
            const startX = seedX + Math.cos(ribbon.emitterAngle) * ribbon.emitterRadius;
            const startY = seedY + Math.sin(ribbon.emitterAngle) * ribbon.emitterRadius;
            for (let i = 0; i < NODES_PER_RIBBON; i++) {
                pts[i * 2] = startX;
                pts[i * 2 + 1] = startY;
            }
        }

        // Generate ribbon mesh vertices
        for (let i = 0; i < NODES_PER_RIBBON; i++) {
            const idx = i * 2;
            const px = pts[idx];
            const py = pts[idx + 1];

            // Tangent calculation
            let tx = 0, ty = 1;
            if (i === 0) {
                tx = px - pts[idx + 2];
                ty = py - pts[idx + 3];
            } else if (i === NODES_PER_RIBBON - 1) {
                tx = pts[idx - 2] - px;
                ty = pts[idx - 1] - py;
            } else {
                tx = pts[idx - 2] - pts[idx + 2];
                ty = pts[idx - 1] - pts[idx + 3];
            }
            const len = Math.sqrt(tx * tx + ty * ty) || 1.0;
            tx /= len;
            ty /= len;

            // Normal (-ty, tx)
            const nx = -ty;
            const ny = tx;
            const t = i / (NODES_PER_RIBBON - 1);
            const phase = r / ribbons.length;

            // Left vertex (side = -1)
            vertexData[vIdx++] = px;
            vertexData[vIdx++] = py;
            vertexData[vIdx++] = nx;
            vertexData[vIdx++] = ny;
            vertexData[vIdx++] = -1.0;
            vertexData[vIdx++] = t;
            vertexData[vIdx++] = phase;

            // Right vertex (side = +1)
            vertexData[vIdx++] = px;
            vertexData[vIdx++] = py;
            vertexData[vIdx++] = nx;
            vertexData[vIdx++] = ny;
            vertexData[vIdx++] = 1.0;
            vertexData[vIdx++] = t;
            vertexData[vIdx++] = phase;
        }
    }
}

function buildProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(vs);
        gl.deleteShader(vs);
        throw new Error(`VS compile error: ${info}`);
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(fs);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        throw new Error(`FS compile error: ${info}`);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program link error: ${info}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
}

export const Lens_LivingWind: VisualizerPlugin = {
    id: 'LIVING_WIND',
    name: 'Living Smoke',
    renderType: 'WEBGL',
    isLegacy: false,
    defaultConfig: PRESETS[0].config,
    parameters: [
        { 
            id: 'smokeEngine', 
            label: 'Smoke Simulation Engine', 
            type: 'SELECT', 
            options: ['Volumetric Fluid (Eulerian)', 'Silk Streamline Ribbons', 'Kinetic Vapor Motes'], 
            section: 'PHYSICS', 
            defaultValue: 'Volumetric Fluid (Eulerian)' 
        },
        { 
            id: 'colorPalette', 
            label: 'Smoke Atmosphere', 
            type: 'SELECT', 
            options: ['Chord Polyphony (Live Wheel)', 'Ethereal Aurora', 'Ocean Bioluminescence', 'Incense Pearl', 'Solar Amber', 'Harmonic (Merrick)', 'Sacred Ember'], 
            section: 'LIGHT', 
            defaultValue: 'Chord Polyphony (Live Wheel)' 
        },
        { id: 'ribbonWidth', label: 'Streamline Ribbon Width', type: 'SLIDER', min: 1.0, max: 20.0, step: 0.5, section: 'GEOMETRY', defaultValue: 8.0 },
        { id: 'zoom', label: 'Field Scale', type: 'SLIDER', min: 0.4, max: 2.5, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'flowSpeed', label: 'Drift Velocity', type: 'SLIDER', min: 0.0, max: 0.5, step: 0.01, section: 'PHYSICS', defaultValue: 0.18 },
        { id: 'turbulence', label: 'Curl Turbulence', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.35 },
        { id: 'vortexSpin', label: 'Toroidal Spin', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.25 },
        { id: 'gravityWell', label: 'Centripetal Force', type: 'SLIDER', min: 0.0, max: 0.4, step: 0.01, section: 'PHYSICS', defaultValue: 0.04 },
        { id: 'pointSize', label: 'Smoke Strand Fineness', type: 'SLIDER', min: 1.0, max: 6.0, step: 0.1, section: 'GEOMETRY', defaultValue: 2.4 },
        { id: 'trailLength', label: 'Smoke Persistence', type: 'SLIDER', min: 0.8, max: 0.99, step: 0.005, section: 'LIGHT', defaultValue: 0.95 },
        { id: 'emberGlow', label: 'Smoke Luminescence', type: 'SLIDER', min: 0.2, max: 4.5, step: 0.1, section: 'LIGHT', defaultValue: 1.8 },
        { id: 'colorShift', label: 'Harmonic Hue Shift', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.0 },
        { id: 'seedX', label: 'Vortex Offset X', type: 'SLIDER', min: -1.0, max: 1.0, step: 0.001, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'seedY', label: 'Vortex Offset Y', type: 'SLIDER', min: -1.0, max: 1.0, step: 0.001, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Symmetry', type: 'SLIDER', min: 1, max: 24, step: 1, section: 'GEOMETRY', defaultValue: 1 }
    ],
    presets: PRESETS,
    
    // Garbage Collection Lifecycle
    cleanup: (context: { gl?: WebGL2RenderingContext | WebGLRenderingContext | null, memory: Record<string, unknown> }) => {
        const gl = context.gl as WebGL2RenderingContext;
        const mem = context.memory;
        if (gl && mem.initLivingWind) {
            const deleteFBO = (f: unknown) => {
                const target = f as { tex?: WebGLTexture | null; fbo?: WebGLFramebuffer | null } | null | undefined;
                if(target) { 
                    if (target.tex) gl.deleteTexture(target.tex); 
                    if (target.fbo) gl.deleteFramebuffer(target.fbo); 
                }
            };
            deleteFBO(mem.lw_physA); deleteFBO(mem.lw_physB);
            deleteFBO(mem.lw_screenA); deleteFBO(mem.lw_screenB);

            if (mem.lw_pPhys) gl.deleteProgram(mem.lw_pPhys as WebGLProgram);
            if (mem.lw_pRend) gl.deleteProgram(mem.lw_pRend as WebGLProgram);
            if (mem.lw_pTrail) gl.deleteProgram(mem.lw_pTrail as WebGLProgram);
            if (mem.lw_pComp) gl.deleteProgram(mem.lw_pComp as WebGLProgram);
            if (mem.lw_pRibbon) gl.deleteProgram(mem.lw_pRibbon as WebGLProgram);

            if (mem.lw_vaoQuad) gl.deleteVertexArray(mem.lw_vaoQuad as WebGLVertexArrayObject);
            if (mem.lw_vaoPoints) gl.deleteVertexArray(mem.lw_vaoPoints as WebGLVertexArrayObject);
            if (mem.lw_vaoRibbon) gl.deleteVertexArray(mem.lw_vaoRibbon as WebGLVertexArrayObject);
            if (mem.lw_bRibbonVbo) gl.deleteBuffer(mem.lw_bRibbonVbo as WebGLBuffer);
            if (mem.lw_bRibbonEbo) gl.deleteBuffer(mem.lw_bRibbonEbo as WebGLBuffer);

            if (mem.fluidEngine) {
                (mem.fluidEngine as FluidEngineGL).destroy();
                delete mem.fluidEngine;
            }
        }
        Object.keys(mem).forEach(key => delete mem[key]);
    },

    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, time, memory } = context;

        const parseGlobal = (cfgObj: Record<string, unknown>, keys: string[], defaultVal: number) => {
            for (const k of keys) {
                if (cfgObj[k] !== undefined) {
                    const v = cfgObj[k];
                    if (typeof v === 'string' && v.includes('%')) return parseFloat(v) / 100.0;
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') return parseFloat(v);
                }
            }
            return defaultVal;
        };

        const userZoom = (context.visualScale as number) ?? 1.0;
        const vScale = parseGlobal(cfg, ['visualScale', 'Visual Scale', 'scale', 'visual_scale'], 1.0) * userZoom;
        const mOpacity = parseGlobal(cfg, ['masterOpacity', 'Master Opacity', 'opacity', 'master_opacity'], 1.0);
        const aReact = parseGlobal(cfg, ['audioReactivity', 'Audio Reactivity', 'reactivity', 'audio_reactivity'], 0.0);
        const fMult = parseGlobal(cfg, ['forceMultiplier', 'Force Multiplier', 'force', 'force_multiplier'], 1.0);

        // Respiration & Binaural context
        const breathRadius = (context.breathRadius !== undefined) ? context.breathRadius : 0.5;
        const binauralHz = context.globalBinauralBeat || 0.0;

        // Dominant frequency for Harmonic color mode
        let dominantFreq = 432.0;
        if (context.amplitudes && context.amplitudes.size > 0) {
            let maxAmp = 0;
            const customFreqs = (context.customFrequencies as Record<string, number>) || {};
            for (const [id, amp] of context.amplitudes.entries()) {
                if (amp > maxAmp) {
                    maxAmp = amp;
                    const freqNum = typeof id === 'number' ? id : parseFloat(id as string);
                    if (!isNaN(freqNum) && freqNum > 0) {
                        dominantFreq = freqNum;
                    } else if (customFreqs[id]) {
                        dominantFreq = customFreqs[id];
                    }
                }
            }
        }
        const harmonicHue = getMerrickHue(dominantFreq);

        // Palette mapping
        const paletteStr = getStr(cfg.colorPalette, 'Ethereal Aurora');
        let paletteMode = 0;
        if (paletteStr === 'Ocean Bioluminescence') paletteMode = 1;
        else if (paletteStr === 'Incense Pearl') paletteMode = 2;
        else if (paletteStr === 'Solar Amber') paletteMode = 3;
        else if (paletteStr === 'Harmonic (Merrick)') paletteMode = 4;
        else if (paletteStr === 'Sacred Ember') paletteMode = 5;
        else paletteMode = 0;

        const engineMode = getStr(cfg.smokeEngine, 'Volumetric Fluid (Eulerian)');
        const modTime = (time % 2000.0) * fMult;

        // ══════════════════════════════════════════════════════════════
        // MODE 1: VOLUMETRIC FLUID (EULERIAN NAVIER-STOKES SIMULATION)
        // ══════════════════════════════════════════════════════════════
        if (engineMode === 'Volumetric Fluid (Eulerian)') {
            if (!memory.fluidEngine) {
                memory.fluidEngine = new FluidEngineGL(gl);
            }
            const engine = memory.fluidEngine as FluidEngineGL;

            // Compute normalized emitter coordinates centered on visualizer canvas center
            const canvasCxNorm = (context.cx !== undefined && w > 0) ? (context.cx as number) / w : 0.5;
            const canvasCyNorm = (context.cy !== undefined && h > 0) ? 1.0 - (context.cy as number) / h : 0.5;
            const normCx = canvasCxNorm + getVal(cfg.seedX, 0.0) * 0.35;
            const normCy = canvasCyNorm + getVal(cfg.seedY, 0.0) * 0.35;

            // Dye color from selected palette & harmonics
            const dyeRgb = getPaletteRgb(paletteStr, modTime * 0.05, harmonicHue);

            const flowSpeed = getVal(cfg.flowSpeed, 0.18);
            const vortexSpin = getVal(cfg.vortexSpin, 0.25);
            const turbulence = getVal(cfg.turbulence, 0.35);
            const zoomVal = getVal(cfg.zoom, 1.0);
            const baseR = 0.30 * (0.8 + breathRadius * 0.5) * zoomVal;

            // Balanced central dye injection (zero linear momentum drift)
            engine.splat(normCx, normCy, 0, 0, dyeRgb, baseR * 0.9, w, h);

            // Symmetrically balanced toroidal swirling satellites
            const aspect = (w > 0 && h > 0) ? (w / h) : 1.0;
            const numSatellites = 4;
            const orbitRadius = 0.065 * zoomVal;
            const swirlSpeed = (vortexSpin * 45.0 + flowSpeed * 25.0);

            for (let i = 0; i < numSatellites; i++) {
                const orbit = modTime * vortexSpin * 2.2 + (i * Math.PI * 2.0) / numSatellites;
                const cosA = Math.cos(orbit);
                const sinA = Math.sin(orbit);
                const ox = normCx + (cosA * orbitRadius) / aspect;
                const oy = normCy + sinA * orbitRadius;
                const ovx = (-sinA * swirlSpeed) / aspect;
                const ovy = cosA * swirlSpeed;
                engine.splat(ox, oy, ovx, ovy, dyeRgb, baseR * 0.55, w, h);
            }

            const shaderConfig = {
                simRes: 128,
                dyeRes: 512,
                densityDissipation: getVal(cfg.trailLength, 0.95),
                tailTrail: getVal(cfg.trailLength, 0.95),
                velocityDissipation: 0.035,
                pressure: 0.92,
                pressureIterations: 24,
                curl: turbulence * 6.0 + 0.5,
                shading: true,
                transparent: false,
                paused: false,
                bloom: true,
                bloomIterations: 6,
                bloomResolution: 256,
                bloomIntensity: getVal(cfg.emberGlow, 1.8) * 0.35,
                glowIntensity: getVal(cfg.emberGlow, 1.8) * 0.35,
                bloomThreshold: 0.45,
                bloomSoftKnee: 0.70,
                sunrays: false,
                backColor: { r: 0.01, g: 0.015, b: 0.03 },
                kaleidoscope: getVal(cfg.kaleidoscope, 1) > 1 ? getVal(cfg.kaleidoscope, 1) : 0,
                centerX: normCx,
                centerY: normCy,
                vortexRotation: (modTime * 0.04 * vortexSpin) % (Math.PI * 2),
                saturation: 1.35,
                masterOpacity: mOpacity
            };

            engine.step(Math.min(context.dt ?? 0.016, 0.033), shaderConfig, w, h);
            return;
        }

        // ── PROGRAM & BUFFER INITIALIZATION FOR RIBBONS & PARTICLES ──
        if (!memory.lw_pPhys || !memory.lw_pRend || !memory.lw_pTrail || !memory.lw_pComp || !memory.lw_pRibbon || !memory.initLivingWind || memory.w !== w || memory.h !== h) {
            gl.getExtension('EXT_color_buffer_float');

            if (memory.initLivingWind) {
                const deleteFBO = (f: unknown) => {
                    const target = f as { tex?: WebGLTexture | null; fbo?: WebGLFramebuffer | null } | null | undefined;
                    if (target) { 
                        if (target.tex) gl.deleteTexture(target.tex); 
                        if (target.fbo) gl.deleteFramebuffer(target.fbo); 
                    }
                };
                deleteFBO(memory.lw_physA); deleteFBO(memory.lw_physB);
                deleteFBO(memory.lw_screenA); deleteFBO(memory.lw_screenB);
                if (memory.lw_pPhys) gl.deleteProgram(memory.lw_pPhys as WebGLProgram);
                if (memory.lw_pRend) gl.deleteProgram(memory.lw_pRend as WebGLProgram);
                if (memory.lw_pTrail) gl.deleteProgram(memory.lw_pTrail as WebGLProgram);
                if (memory.lw_pComp) gl.deleteProgram(memory.lw_pComp as WebGLProgram);
                if (memory.lw_pRibbon) gl.deleteProgram(memory.lw_pRibbon as WebGLProgram);
                if (memory.lw_vaoQuad) gl.deleteVertexArray(memory.lw_vaoQuad as WebGLVertexArrayObject);
                if (memory.lw_vaoPoints) gl.deleteVertexArray(memory.lw_vaoPoints as WebGLVertexArrayObject);
                if (memory.lw_vaoRibbon) gl.deleteVertexArray(memory.lw_vaoRibbon as WebGLVertexArrayObject);
                if (memory.lw_bRibbonVbo) gl.deleteBuffer(memory.lw_bRibbonVbo as WebGLBuffer);
                if (memory.lw_bRibbonEbo) gl.deleteBuffer(memory.lw_bRibbonEbo as WebGLBuffer);
            }

            const pPhys = buildProgram(gl, VS_QUAD, FS_PHYSICS);
            const pRend = buildProgram(gl, VS_RENDER, FS_RENDER);
            const pTrail = buildProgram(gl, VS_QUAD, FS_TRAIL);
            const pComp = buildProgram(gl, VS_QUAD, FS_COMPOSITE);
            const pRibbon = buildProgram(gl, VS_RIBBON, FS_RIBBON);

            memory.lw_pPhys = pPhys;
            memory.lw_pRend = pRend;
            memory.lw_pTrail = pTrail;
            memory.lw_pComp = pComp;
            memory.lw_pRibbon = pRibbon;

            // Cache uniform locations
            memory.lw_uPhys = {
                posTex: gl.getUniformLocation(pPhys, "u_posTex"),
                time: gl.getUniformLocation(pPhys, "u_time"),
                zoom: gl.getUniformLocation(pPhys, "u_zoom"),
                flowSpeed: gl.getUniformLocation(pPhys, "u_flowSpeed"),
                turbulence: gl.getUniformLocation(pPhys, "u_turbulence"),
                vortexSpin: gl.getUniformLocation(pPhys, "u_vortexSpin"),
                gravityWell: gl.getUniformLocation(pPhys, "u_gravityWell"),
                seed: gl.getUniformLocation(pPhys, "u_seed"),
                audioReactivity: gl.getUniformLocation(pPhys, "u_audioReactivity"),
                breath: gl.getUniformLocation(pPhys, "u_breath"),
                binauralHz: gl.getUniformLocation(pPhys, "u_binauralHz")
            };

            memory.lw_uTrail = {
                screenTex: gl.getUniformLocation(pTrail, "u_screenTex"),
                trailLength: gl.getUniformLocation(pTrail, "u_trailLength")
            };

            memory.lw_uRend = {
                posTex: gl.getUniformLocation(pRend, "u_posTex"),
                aspect: gl.getUniformLocation(pRend, "u_aspect"),
                center: gl.getUniformLocation(pRend, "u_center"),
                emberGlow: gl.getUniformLocation(pRend, "u_emberGlow"),
                colorShift: gl.getUniformLocation(pRend, "u_colorShift"),
                audioReactivity: gl.getUniformLocation(pRend, "u_audioReactivity"),
                visualScale: gl.getUniformLocation(pRend, "u_visualScale"),
                pointSize: gl.getUniformLocation(pRend, "u_pointSize"),
                paletteMode: gl.getUniformLocation(pRend, "u_paletteMode"),
                harmonicHue: gl.getUniformLocation(pRend, "u_harmonicHue"),
                breath: gl.getUniformLocation(pRend, "u_breath")
            };

            memory.lw_uRibbon = {
                aspect: gl.getUniformLocation(pRibbon, "u_aspect"),
                center: gl.getUniformLocation(pRibbon, "u_center"),
                visualScale: gl.getUniformLocation(pRibbon, "u_visualScale"),
                ribbonWidth: gl.getUniformLocation(pRibbon, "u_ribbonWidth"),
                emberGlow: gl.getUniformLocation(pRibbon, "u_emberGlow"),
                colorShift: gl.getUniformLocation(pRibbon, "u_colorShift"),
                paletteMode: gl.getUniformLocation(pRibbon, "u_paletteMode"),
                harmonicHue: gl.getUniformLocation(pRibbon, "u_harmonicHue"),
                breath: gl.getUniformLocation(pRibbon, "u_breath")
            };

            memory.lw_uComp = {
                tex: gl.getUniformLocation(pComp, "u_tex"),
                center: gl.getUniformLocation(pComp, "u_center"),
                masterOpacity: gl.getUniformLocation(pComp, "u_masterOpacity"),
                kaleidoscope: gl.getUniformLocation(pComp, "u_kaleidoscope"),
                aspect: gl.getUniformLocation(pComp, "u_aspect")
            };

            const createFBO = (width: number, height: number, internalFormat: number, format: number, type: number) => {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                const fbo = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
                return { tex, fbo };
            };

            const pSize = 256;
            memory.lw_physA = createFBO(pSize, pSize, gl.RGBA16F, gl.RGBA, gl.FLOAT);
            memory.lw_physB = createFBO(pSize, pSize, gl.RGBA16F, gl.RGBA, gl.FLOAT);
            memory.lw_screenA = createFBO(w, h, gl.RGBA16F, gl.RGBA, gl.FLOAT);
            memory.lw_screenB = createFBO(w, h, gl.RGBA16F, gl.RGBA, gl.FLOAT);

            memory.lw_vaoQuad = gl.createVertexArray(); 
            gl.bindVertexArray(memory.lw_vaoQuad);
            const bQuad = gl.createBuffer(); 
            gl.bindBuffer(gl.ARRAY_BUFFER, bQuad);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); 
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

            const uvData = new Float32Array(pSize * pSize * 2);
            for (let y = 0; y < pSize; y++) {
                for (let x = 0; x < pSize; x++) {
                    const idx = (y * pSize + x) * 2;
                    uvData[idx] = (x + 0.5) / pSize;     
                    uvData[idx+1] = (y + 0.5) / pSize;   
                }
            }

            memory.lw_vaoPoints = gl.createVertexArray(); 
            gl.bindVertexArray(memory.lw_vaoPoints);
            const bPoints = gl.createBuffer(); 
            gl.bindBuffer(gl.ARRAY_BUFFER, bPoints);
            gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); 
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

            // Setup Ribbon buffers & state
            const ribbons: SmokeRibbon[] = [];
            const seedX = getVal(cfg.seedX, 0.0);
            const seedY = getVal(cfg.seedY, 0.0);
            for (let r = 0; r < NUM_RIBBONS; r++) {
                const pts = new Float32Array(NODES_PER_RIBBON * 2);
                const angle = (r / NUM_RIBBONS) * Math.PI * 2.0;
                const radius = 0.02 + Math.random() * 0.08;
                const startX = seedX + Math.cos(angle) * radius;
                const startY = seedY + Math.sin(angle) * radius;
                for (let i = 0; i < NODES_PER_RIBBON; i++) {
                    pts[i * 2] = startX;
                    pts[i * 2 + 1] = startY;
                }
                ribbons.push({
                    points: pts,
                    age: Math.floor(Math.random() * 100),
                    maxAge: 120 + Math.floor(Math.random() * 120),
                    emitterAngle: angle,
                    emitterRadius: radius,
                    speedMult: 0.8 + Math.random() * 0.4,
                    ribbonId: r
                });
            }
            memory.lw_ribbons = ribbons;
            memory.lw_ribbonVertexData = new Float32Array(NUM_RIBBONS * NODES_PER_RIBBON * 2 * 7);

            // Pre-generate quad strip indices for continuous ribbons
            const ribbonIndices = new Uint16Array(NUM_RIBBONS * (NODES_PER_RIBBON - 1) * 6);
            let idx = 0;
            for (let r = 0; r < NUM_RIBBONS; r++) {
                const baseRibbon = r * (NODES_PER_RIBBON * 2);
                for (let s = 0; s < NODES_PER_RIBBON - 1; s++) {
                    const v0 = baseRibbon + s * 2;
                    const v1 = v0 + 1;
                    const v2 = v0 + 2;
                    const v3 = v0 + 3;

                    ribbonIndices[idx++] = v0;
                    ribbonIndices[idx++] = v1;
                    ribbonIndices[idx++] = v2;

                    ribbonIndices[idx++] = v2;
                    ribbonIndices[idx++] = v1;
                    ribbonIndices[idx++] = v3;
                }
            }

            memory.lw_vaoRibbon = gl.createVertexArray();
            gl.bindVertexArray(memory.lw_vaoRibbon);

            const bRibbonVbo = gl.createBuffer();
            memory.lw_bRibbonVbo = bRibbonVbo;
            gl.bindBuffer(gl.ARRAY_BUFFER, bRibbonVbo);
            gl.bufferData(gl.ARRAY_BUFFER, memory.lw_ribbonVertexData.byteLength, gl.DYNAMIC_DRAW);

            const bRibbonEbo = gl.createBuffer();
            memory.lw_bRibbonEbo = bRibbonEbo;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bRibbonEbo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ribbonIndices, gl.STATIC_DRAW);

            const stride = 7 * 4;
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0); // pos
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8); // norm
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16); // side
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 20); // t
            gl.enableVertexAttribArray(4);
            gl.vertexAttribPointer(4, 1, gl.FLOAT, false, stride, 24); // phase

            gl.bindFramebuffer(gl.FRAMEBUFFER, memory.lw_screenA.fbo); 
            gl.clearColor(0,0,0,1); 
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, memory.lw_screenB.fbo); 
            gl.clearColor(0,0,0,1); 
            gl.clear(gl.COLOR_BUFFER_BIT);

            memory.lw_flip = false;
            memory.w = w; 
            memory.h = h; 
            memory.initLivingWind = true;
        }

        const readScreen = memory.lw_flip ? memory.lw_screenB : memory.lw_screenA;
        const writeScreen = memory.lw_flip ? memory.lw_screenA : memory.lw_screenB;

        const uTrail = memory.lw_uTrail;
        const uComp = memory.lw_uComp;

        // ══════════════════════════════════════════════════════════════
        // MODE 2: SILK STREAMLINE RIBBONS (CONTINUOUS CURVING VEILS)
        // ══════════════════════════════════════════════════════════════
        if (engineMode === 'Silk Streamline Ribbons') {
            const ribbons = memory.lw_ribbons as SmokeRibbon[];
            const vertexData = memory.lw_ribbonVertexData as Float32Array;
            const dt = Math.min(context.dt ?? 0.016, 0.033);

            stepRibbons(
                ribbons,
                vertexData,
                modTime,
                dt,
                getVal(cfg.flowSpeed, 0.18),
                getVal(cfg.turbulence, 0.35),
                getVal(cfg.vortexSpin, 0.25),
                getVal(cfg.gravityWell, 0.04),
                getVal(cfg.seedX, 0.0),
                getVal(cfg.seedY, 0.0),
                breathRadius
            );

            // Upload dynamic vertex geometry
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.lw_bRibbonVbo as WebGLBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);

            // Pass 1: Trail persistence
            gl.bindFramebuffer(gl.FRAMEBUFFER, writeScreen.fbo);
            gl.viewport(0, 0, w, h);
            gl.disable(gl.BLEND);
            
            gl.useProgram(memory.lw_pTrail);
            gl.bindVertexArray(memory.lw_vaoQuad);
            gl.activeTexture(gl.TEXTURE0); 
            gl.bindTexture(gl.TEXTURE_2D, readScreen.tex);
            gl.uniform1i(uTrail.screenTex, 0);
            gl.uniform1f(uTrail.trailLength, getVal(cfg.trailLength, 0.95));
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Pass 2: Draw continuous silk streamline ribbons
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            const uRibbon = memory.lw_uRibbon;
            gl.useProgram(memory.lw_pRibbon);
            gl.bindVertexArray(memory.lw_vaoRibbon);

            gl.uniform1f(uRibbon.aspect, w / h);
            gl.uniform2f(uRibbon.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
            gl.uniform1f(uRibbon.visualScale, vScale);
            gl.uniform1f(uRibbon.ribbonWidth, getVal(cfg.ribbonWidth, 8.0));
            gl.uniform1f(uRibbon.emberGlow, getVal(cfg.emberGlow, 1.8));
            gl.uniform1f(uRibbon.colorShift, getVal(cfg.colorShift, 0.0));
            gl.uniform1i(uRibbon.paletteMode, paletteMode);
            gl.uniform1f(uRibbon.harmonicHue, harmonicHue);
            gl.uniform1f(uRibbon.breath, breathRadius);

            gl.drawElements(gl.TRIANGLES, NUM_RIBBONS * (NODES_PER_RIBBON - 1) * 6, gl.UNSIGNED_SHORT, 0);

            // Pass 3: Composite to canvas
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            
            gl.useProgram(memory.lw_pComp);
            gl.bindVertexArray(memory.lw_vaoQuad);
            gl.activeTexture(gl.TEXTURE0); 
            gl.bindTexture(gl.TEXTURE_2D, writeScreen.tex);
            gl.uniform1i(uComp.tex, 0);
            gl.uniform2f(uComp.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
            gl.uniform1f(uComp.masterOpacity, mOpacity);
            gl.uniform1f(uComp.kaleidoscope, getVal(cfg.kaleidoscope, 1.0));
            gl.uniform1f(uComp.aspect, w / h);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            memory.lw_flip = !memory.lw_flip;
            return;
        }

        // ══════════════════════════════════════════════════════════════
        // MODE 3: KINETIC VAPOR MOTES (LAGRANGIAN GPGPU PARTICLES)
        // ══════════════════════════════════════════════════════════════
        const readPhys = memory.lw_flip ? memory.lw_physB : memory.lw_physA;
        const writePhys = memory.lw_flip ? memory.lw_physA : memory.lw_physB;
        const uPhys = memory.lw_uPhys;
        const uRend = memory.lw_uRend;

        // Step physics FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, writePhys.fbo);
        gl.viewport(0, 0, 256, 256); 
        gl.disable(gl.BLEND);
        
        gl.useProgram(memory.lw_pPhys);
        gl.bindVertexArray(memory.lw_vaoQuad);
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, readPhys.tex);
        gl.uniform1i(uPhys.posTex, 0);
        gl.uniform1f(uPhys.time, modTime);
        gl.uniform1f(uPhys.zoom, getVal(cfg.zoom, 1.0));
        gl.uniform1f(uPhys.flowSpeed, getVal(cfg.flowSpeed, 0.18));
        gl.uniform1f(uPhys.turbulence, getVal(cfg.turbulence, 0.35));
        gl.uniform1f(uPhys.vortexSpin, getVal(cfg.vortexSpin, 0.25));
        gl.uniform1f(uPhys.gravityWell, getVal(cfg.gravityWell, 0.04));
        gl.uniform2f(uPhys.seed, getVal(cfg.seedX, 0.0), getVal(cfg.seedY, 0.0));
        gl.uniform1f(uPhys.audioReactivity, aReact);
        gl.uniform1f(uPhys.breath, breathRadius);
        gl.uniform1f(uPhys.binauralHz, binauralHz);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Trail persistence
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeScreen.fbo);
        gl.viewport(0, 0, w, h);
        gl.disable(gl.BLEND);
        
        gl.useProgram(memory.lw_pTrail);
        gl.bindVertexArray(memory.lw_vaoQuad);
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, readScreen.tex);
        gl.uniform1i(uTrail.screenTex, 0);
        gl.uniform1f(uTrail.trailLength, getVal(cfg.trailLength, 0.95));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Render point sprites
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        
        gl.useProgram(memory.lw_pRend);
        gl.bindVertexArray(memory.lw_vaoPoints); 
        
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, writePhys.tex); 
        gl.uniform1i(uRend.posTex, 0);
        gl.uniform1f(uRend.aspect, w / h);
        gl.uniform2f(uRend.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
        gl.uniform1f(uRend.emberGlow, getVal(cfg.emberGlow, 1.8));
        gl.uniform1f(uRend.colorShift, getVal(cfg.colorShift, 0.0));
        gl.uniform1f(uRend.audioReactivity, aReact);
        gl.uniform1f(uRend.visualScale, vScale);
        gl.uniform1f(uRend.pointSize, getVal(cfg.pointSize, 2.4));
        gl.uniform1i(uRend.paletteMode, paletteMode);
        gl.uniform1f(uRend.harmonicHue, harmonicHue);
        gl.uniform1f(uRend.breath, breathRadius);
        
        gl.drawArrays(gl.POINTS, 0, 256 * 256); 

        // Composite to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.useProgram(memory.lw_pComp);
        gl.bindVertexArray(memory.lw_vaoQuad);
        gl.activeTexture(gl.TEXTURE0); 
        gl.bindTexture(gl.TEXTURE_2D, writeScreen.tex);
        gl.uniform1i(uComp.tex, 0);
        gl.uniform2f(uComp.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
        gl.uniform1f(uComp.masterOpacity, mOpacity);
        gl.uniform1f(uComp.kaleidoscope, getVal(cfg.kaleidoscope, 1.0));
        gl.uniform1f(uComp.aspect, w / h);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        memory.lw_flip = !memory.lw_flip;
    }
};
