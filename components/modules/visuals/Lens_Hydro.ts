import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyRGB } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

/**
 * Maps high audio frequencies to their subharmonic octave undertone (f/2, f/4, f/8...)
 * so that high frequencies produce pristine, stable, visible standing waves without spatial aliasing.
 * Frequencies below 90Hz remain completely untouched to preserve their original geometry.
 */
function getStandingWaveUndertone(freq: number, maxFreq: number = 90): number {
    if (!isFinite(freq) || freq <= 0) return 40;
    let f = freq;
    while (f > maxFreq) {
        f /= 2;
    }
    return f;
}

// Exact Presets with full physical Petri Dish configuration & breath modulation
const RAW_PRESETS = {
    "01 Pure Deionized Water": {
        category: "Laboratory Acoustic",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.52,
            cameraYaw: 0.0,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.7,
            surfaceTension: 1.5,
            viscosity: 0.15,
            force: 1.4,
            faradayEffect: 0.45,
            harmonicOvertones: 0.2,
            fluidTurbulence: 0.0,
            lightAngle: 0.85,
            lightElevation: 1.2,
            lightIntensity: 2.2,
            lightWarmth: 0.0,
            rimLightIntensity: 0.8,
            rimLightAngle: 0.0,
            causticIntensity: 2.2,
            causticDispersion: 0.25,
            ambientGlow: 0.1,
            lightSweepSpeed: 0.0,
            waterTint: 'DEIONIZED_PURE',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticIntensity: { enabled: true, min: 1.2, max: 3.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 1.6, max: 2.8, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            force: { enabled: true, min: 0.8, max: 2.2, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            surfaceTension: { enabled: true, min: 1.0, max: 2.5, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' }
        }
    },
    "02 Faraday Resonance": {
        category: "Laboratory Acoustic",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.6,
            cameraYaw: 0.2,
            cameraZoom: 1.05,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.85,
            surfaceTension: 1.2,
            viscosity: 0.08,
            force: 1.8,
            faradayEffect: 0.8,
            harmonicOvertones: 0.5,
            fluidTurbulence: 0.05,
            lightAngle: 1.1,
            lightElevation: 1.0,
            lightIntensity: 2.8,
            lightWarmth: 0.2,
            rimLightIntensity: 1.2,
            rimLightAngle: 0.4,
            causticIntensity: 2.8,
            causticDispersion: 0.4,
            ambientGlow: 0.2,
            lightSweepSpeed: 0.05,
            waterTint: 'SAPPHIRE_CYAN',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            faradayEffect: { enabled: true, min: 0.3, max: 0.9, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 1.8, max: 3.8, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightElevation: { enabled: true, min: 0.7, max: 1.6, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            force: { enabled: true, min: 1.0, max: 2.5, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "03 Golden Solar Caustics": {
        category: "Optics & Sunlight",
        config: {
            visualScale: 0.95,
            cameraPitch: 0.44,
            cameraYaw: -0.15,
            cameraZoom: 1.1,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.65,
            surfaceTension: 2.0,
            viscosity: 0.18,
            force: 1.6,
            faradayEffect: 0.3,
            harmonicOvertones: 0.7,
            fluidTurbulence: 0.0,
            lightAngle: 0.5,
            lightElevation: 1.3,
            lightIntensity: 3.2,
            lightWarmth: 0.85,
            rimLightIntensity: 1.5,
            rimLightAngle: -0.2,
            causticIntensity: 3.4,
            causticDispersion: 0.6,
            ambientGlow: 0.25,
            lightSweepSpeed: 0.02,
            waterTint: 'GOLDEN_AMBER',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticIntensity: { enabled: true, min: 1.8, max: 4.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 0.6, max: 2.2, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            harmonicOvertones: { enabled: true, min: 0.2, max: 1.5, amtBinaural: 1.0, mixMode: 'ADD' },
            force: { enabled: true, min: 1.0, max: 2.8, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "04 Liquid Mercury": {
        category: "Reflective Heavy Fluid",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.58,
            cameraYaw: 0.35,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.9,
            surfaceTension: 3.5,
            viscosity: 0.05,
            force: 2.0,
            faradayEffect: 0.2,
            harmonicOvertones: 0.4,
            fluidTurbulence: 0.0,
            lightAngle: 0.7,
            lightElevation: 0.9,
            lightIntensity: 4.2,
            lightWarmth: -0.3,
            rimLightIntensity: 2.2,
            rimLightAngle: 0.5,
            causticIntensity: 0.4,
            causticDispersion: 0.1,
            ambientGlow: 0.0,
            lightSweepSpeed: 0.08,
            waterTint: 'MERCURY_SILVER',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            lightIntensity: { enabled: true, min: 2.5, max: 5.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 1.0, max: 3.2, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            force: { enabled: true, min: 1.0, max: 3.0, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' }
        }
    },
    "05 Bioluminescent Abyss": {
        category: "Deep Trance",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.48,
            cameraYaw: -0.25,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.75,
            surfaceTension: 1.4,
            viscosity: 0.3,
            force: 1.5,
            faradayEffect: 0.5,
            harmonicOvertones: 0.3,
            fluidTurbulence: 0.1,
            lightAngle: 1.2,
            lightElevation: 1.1,
            lightIntensity: 1.8,
            lightWarmth: -0.7,
            rimLightIntensity: 1.8,
            rimLightAngle: 0.8,
            causticIntensity: 3.2,
            causticDispersion: 0.5,
            ambientGlow: 0.85,
            lightSweepSpeed: 0.03,
            waterTint: 'BIOLUMINESCENT_EMERALD',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            ambientGlow: { enabled: true, min: 0.3, max: 1.4, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            causticIntensity: { enabled: true, min: 1.5, max: 4.2, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            force: { enabled: true, min: 0.8, max: 2.4, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    "06 Ultraviolet Resonance": {
        category: "Fluorescent Acoustic",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.52,
            cameraYaw: 0.1,
            cameraZoom: 1.02,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.8,
            surfaceTension: 1.8,
            viscosity: 0.12,
            force: 1.9,
            faradayEffect: 0.6,
            harmonicOvertones: 0.8,
            fluidTurbulence: 0.02,
            lightAngle: 2.1,
            lightElevation: 1.4,
            lightIntensity: 2.6,
            lightWarmth: -0.9,
            rimLightIntensity: 2.5,
            rimLightAngle: -0.5,
            causticIntensity: 3.5,
            causticDispersion: 0.8,
            ambientGlow: 0.6,
            lightSweepSpeed: 0.06,
            waterTint: 'ULTRAVIOLET_INDIGO',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticDispersion: { enabled: true, min: 0.3, max: 1.0, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 1.2, max: 3.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            ambientGlow: { enabled: true, min: 0.2, max: 0.9, amtBinaural: 1.0, mixMode: 'ADD' }
        }
    },
    "07 Sacred Solfeggio 528": {
        category: "Sacred Geometry",
        config: {
            visualScale: 0.92,
            cameraPitch: 0.45,
            cameraYaw: 0.0,
            cameraZoom: 1.05,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.7,
            surfaceTension: 2.0,
            viscosity: 0.12,
            force: 2.0,
            faradayEffect: 0.6,
            harmonicOvertones: 0.9,
            fluidTurbulence: 0.0,
            lightAngle: 0.9,
            lightElevation: 1.3,
            lightIntensity: 2.8,
            lightWarmth: 0.5,
            rimLightIntensity: 1.4,
            rimLightAngle: 0.2,
            causticIntensity: 3.0,
            causticDispersion: 0.45,
            ambientGlow: 0.3,
            lightSweepSpeed: 0.01,
            waterTint: 'SAPPHIRE_CYAN',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            harmonicOvertones: { enabled: true, min: 0.4, max: 1.8, amtBinaural: 1.0, mixMode: 'ADD' },
            lightWarmth: { enabled: true, min: 0.1, max: 0.9, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            surfaceTension: { enabled: true, min: 1.2, max: 3.0, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "08 Prismatic Dispersion": {
        category: "Optics & Sunlight",
        config: {
            visualScale: 0.92,
            cameraPitch: 0.48,
            cameraYaw: -0.3,
            cameraZoom: 1.05,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.75,
            surfaceTension: 1.6,
            viscosity: 0.14,
            force: 1.7,
            faradayEffect: 0.5,
            harmonicOvertones: 0.6,
            fluidTurbulence: 0.0,
            lightAngle: 1.4,
            lightElevation: 1.2,
            lightIntensity: 3.0,
            lightWarmth: 0.1,
            rimLightIntensity: 1.8,
            rimLightAngle: 0.6,
            causticIntensity: 3.6,
            causticDispersion: 1.0,
            ambientGlow: 0.2,
            lightSweepSpeed: 0.04,
            waterTint: 'PRISMATIC_OPAL',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticDispersion: { enabled: true, min: 0.4, max: 1.0, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            causticIntensity: { enabled: true, min: 2.0, max: 4.8, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 1.8, max: 3.8, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    "09 Moonlit Obsidian Basin": {
        category: "Nocturne & Calm",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.4,
            cameraYaw: 0.45,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.8,
            surfaceTension: 2.2,
            viscosity: 0.25,
            force: 1.3,
            faradayEffect: 0.35,
            harmonicOvertones: 0.4,
            fluidTurbulence: 0.0,
            lightAngle: 3.14,
            lightElevation: 0.8,
            lightIntensity: 2.4,
            lightWarmth: -0.85,
            rimLightIntensity: 2.0,
            rimLightAngle: 0.0,
            causticIntensity: 2.0,
            causticDispersion: 0.2,
            ambientGlow: 0.15,
            lightSweepSpeed: 0.015,
            waterTint: 'DEIONIZED_PURE',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            lightIntensity: { enabled: true, min: 1.2, max: 3.0, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            cameraPitch: { enabled: true, min: 0.35, max: 0.48, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            surfaceTension: { enabled: true, min: 1.5, max: 2.8, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    "10 Crimson Elixir": {
        category: "Alchemical Fluid",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.55,
            cameraYaw: -0.2,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.8,
            surfaceTension: 1.9,
            viscosity: 0.22,
            force: 2.2,
            faradayEffect: 0.7,
            harmonicOvertones: 0.85,
            fluidTurbulence: 0.05,
            lightAngle: 0.6,
            lightElevation: 1.1,
            lightIntensity: 3.4,
            lightWarmth: 0.7,
            rimLightIntensity: 2.2,
            rimLightAngle: -0.4,
            causticIntensity: 3.2,
            causticDispersion: 0.35,
            ambientGlow: 0.5,
            lightSweepSpeed: 0.05,
            waterTint: 'ROSE_QUARTZ',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            ambientGlow: { enabled: true, min: 0.2, max: 0.85, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 1.0, max: 3.0, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            force: { enabled: true, min: 1.2, max: 3.2, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "11 Sonic Plasma Dish": {
        category: "High-Energy Cyma",
        config: {
            visualScale: 0.95,
            cameraPitch: 0.62,
            cameraYaw: 0.3,
            cameraZoom: 1.08,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.9,
            surfaceTension: 1.1,
            viscosity: 0.06,
            force: 2.6,
            faradayEffect: 0.85,
            harmonicOvertones: 1.2,
            fluidTurbulence: 0.08,
            lightAngle: 1.8,
            lightElevation: 1.5,
            lightIntensity: 3.8,
            lightWarmth: -0.4,
            rimLightIntensity: 2.6,
            rimLightAngle: 0.7,
            causticIntensity: 4.2,
            causticDispersion: 0.7,
            ambientGlow: 0.45,
            lightSweepSpeed: 0.12,
            waterTint: 'SAPPHIRE_CYAN',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            faradayEffect: { enabled: true, min: 0.4, max: 1.0, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 2.2, max: 4.8, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            causticIntensity: { enabled: true, min: 2.0, max: 5.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' }
        }
    },
    "12 Ethereal Nectar": {
        category: "Fluid & Ethereal",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.46,
            cameraYaw: 0.0,
            cameraZoom: 1.02,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.7,
            surfaceTension: 2.5,
            viscosity: 0.35,
            force: 1.3,
            faradayEffect: 0.25,
            harmonicOvertones: 0.5,
            fluidTurbulence: 0.0,
            lightAngle: 0.75,
            lightElevation: 1.4,
            lightIntensity: 2.5,
            lightWarmth: 0.95,
            rimLightIntensity: 1.2,
            rimLightAngle: 0.1,
            causticIntensity: 2.6,
            causticDispersion: 0.3,
            ambientGlow: 0.4,
            lightSweepSpeed: 0.01,
            waterTint: 'GOLDEN_AMBER',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            ambientGlow: { enabled: true, min: 0.15, max: 0.7, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightElevation: { enabled: true, min: 0.9, max: 1.8, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            surfaceTension: { enabled: true, min: 1.6, max: 3.2, amtBreath: 1.0, mixMode: 'MULT' }
        }
    }
};

const VS_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

// Canvas & Camera Uniforms
uniform vec2 u_resolution;
uniform vec2 u_centerOffset;
uniform float u_aspect;
uniform float u_time;
uniform float u_cameraPitch;
uniform float u_cameraYaw;
uniform float u_cameraZoom;

// Physical Dish & Fluid Uniforms
uniform float u_dishRadius;
uniform float u_glassThickness;
uniform float u_meniscus;
uniform float u_surfaceTension;
uniform float u_viscosity;
uniform float u_force;
uniform float u_faradayEffect;
uniform float u_harmonicOvertones;
uniform float u_fluidTurbulence;

// Lighting & Optical Uniforms
uniform float u_lightAngle;
uniform float u_lightElevation;
uniform float u_lightIntensity;
uniform float u_lightWarmth;
uniform float u_rimLightIntensity;
uniform float u_rimLightAngle;
uniform float u_causticIntensity;
uniform float u_causticDispersion;
uniform float u_ambientGlow;
uniform float u_lightSweepSpeed;
uniform int u_waterTint;
uniform float u_masterOpacity;

// Acoustic & Entrainment Signals
uniform float u_binauralBeat;
uniform float u_binauralPulse;
uniform float u_breathRadius;
uniform float u_breathWave;
uniform int u_activeChannelCount;
uniform float u_kaleidoscope;
uniform float u_crystalline;

// Harmonics Data:
// u_harmonics[i]: x = amp, y = freq, z = phase, w = lobeOrder(m)
uniform vec4 u_harmonics[16];
// u_harmonicsExt[i]: x = wavenumber(k), y = color.r, z = color.g, w = color.b
uniform vec4 u_harmonicsExt[16];

${KALEIDOSCOPE_GLSL_FUNCS}

#define PI 3.14159265358979323846

// Bessel Function J_n(x) using high-precision numerical quadrature
float besselJ(int n, float x) {
    float sum = 0.0;
    const int ITERS = 20;
    float step = PI / 20.0;
    for(int i = 0; i < ITERS; i++) {
        float t = (float(i) + 0.5) * step;
        sum += cos(float(n) * t - x * sin(t));
    }
    return sum / 20.0;
}

// Standing wave surface elevation function eta(r, theta, t) inside the dish
float getWaterElevation(vec2 pXZ, out vec3 waveColorMix, out float causticLaplacian) {
    float r = length(pXZ);
    float R_dish = u_dishRadius;
    
    if (r > R_dish) {
        waveColorMix = vec3(0.1, 0.4, 0.7);
        causticLaplacian = 0.0;
        return 0.0;
    }
    
    float theta = atan(pXZ.y, pXZ.x);
    
    // 1. Capillary Meniscus curvature near glass wall
    float distToWall = max(0.0, R_dish - r);
    float meniscusH = u_meniscus * 0.024 * exp(-distToWall / 0.038);
    
    // 2. Superposition of Standing Wave Modes
    float waveSum = 0.0;
    float laplacianSum = 0.0;
    vec3 colorAccum = vec3(0.0);
    float totalWeight = 0.001;
    
    float tensionScale = max(0.2, u_surfaceTension);
    float totalForce = u_force * (1.0 + (u_breathRadius - 0.5) * 0.4);
    
    // Ambient breathing pulse
    float macroSwell = sin(u_time * 0.8 + r * 3.0) * 0.0015 * (1.0 + u_breathRadius);
    
    for(int i = 0; i < 16; i++) {
        if (i >= u_activeChannelCount) break;
        
        vec4 h1 = u_harmonics[i];
        vec4 h2 = u_harmonicsExt[i];
        
        float amp = h1.x;
        if (amp < 0.001) continue;
        
        float freq = max(1.0, h1.y);
        float phase = h1.z;
        int m = int(h1.w); // angular lobe order
        float k = h2.x / tensionScale; // radial wavenumber
        vec3 chColor = h2.yzw;
        
        // Faraday subharmonic mode splitting (omega/2)
        float osc = mix(cos(phase), cos(phase * 0.5), u_faradayEffect);
        
        // Viscous damping decaying toward glass edge
        float damping = exp(-u_viscosity * k * r * 0.03);
        
        // Radial Bessel standing wave mode
        float J = besselJ(m, k * r);
        float modeLobe = cos(float(m) * theta);
        
        float modeWave = amp * damping * J * modeLobe * osc;
        
        if (u_harmonicOvertones > 0.01) {
            float J2 = besselJ(m * 2, k * 2.0 * r);
            float mode2 = (amp * 0.4) * damping * J2 * cos(float(m * 2) * theta) * cos(phase * 2.0);
            modeWave += mode2 * u_harmonicOvertones;
        }
        
        waveSum += modeWave;
        
        // Laplacian approximation for caustics (proportional to k^2 * mode)
        laplacianSum += (k * k * 0.01) * modeWave;
        
        colorAccum += chColor * amp;
        totalWeight += amp;
    }
    
    // Subtle thermal/fluid turbulence
    if (u_fluidTurbulence > 0.001) {
        float turb = sin(pXZ.x * 24.0 + u_time * 1.5) * cos(pXZ.y * 24.0 - u_time * 1.2) * (u_fluidTurbulence * 0.002);
        waveSum += turb;
    }
    
    // Boundary dampening right at the physical glass contact line
    float boundaryDamp = smoothstep(R_dish, R_dish - 0.015, r);
    float finalWave = (waveSum * 0.035 * totalForce + macroSwell) * boundaryDamp;
    
    waveColorMix = colorAccum / totalWeight;
    causticLaplacian = laplacianSum * totalForce * boundaryDamp;
    
    return finalWave + meniscusH;
}

// Finite-difference surface normal vector for high-precision specular glints
vec3 getWaterNormal(vec2 pXZ, out vec3 waveColor, out float causticLap) {
    float eps = 0.003;
    float h0 = getWaterElevation(pXZ, waveColor, causticLap);
    vec3 cDump; float lDump;
    float hX = getWaterElevation(pXZ + vec2(eps, 0.0), cDump, lDump);
    float hZ = getWaterElevation(pXZ + vec2(0.0, eps), cDump, lDump);
    
    vec3 N = vec3(h0 - hX, eps, h0 - hZ);
    return normalize(N);
}

// Helper to compute light color from temperature warmth (-1.0 cool to +1.0 warm)
vec3 getLightColor(float warmth) {
    vec3 coolLight = vec3(0.7, 0.85, 1.0); // 9000K moonlit blue
    vec3 neutralLight = vec3(1.0, 0.98, 0.95); // 6500K studio daylight
    vec3 warmLight = vec3(1.0, 0.82, 0.55); // 2800K golden sunlight / incandescent
    
    if (warmth < 0.0) {
        return mix(neutralLight, coolLight, -warmth);
    } else {
        return mix(neutralLight, warmLight, warmth);
    }
}

void main() {
    // Aspect-corrected Screen UV
    vec2 uv = (v_uv - u_centerOffset);
    uv.x *= u_aspect;
    uv /= max(0.1, u_cameraZoom);
    
    if (u_kaleidoscope > 1.5) {
        uv = applyKaleidoscopeFold(uv, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        uv = applyCrystallineLayer(uv, u_crystalline);
    }
    
    // 3D Camera Setup
    float pitch = clamp(u_cameraPitch, 0.05, 1.35); // 0.05 (near top-down) to 1.35 (~77 deg tilt)
    float yaw = u_cameraYaw;
    
    vec3 camTarget = vec3(0.0, -0.02, 0.0);
    float camDist = 2.4;
    
    vec3 camPos = vec3(
        camDist * sin(pitch) * sin(yaw),
        camDist * cos(pitch),
        camDist * sin(pitch) * cos(yaw)
    );
    
    vec3 camForward = normalize(camTarget - camPos);
    vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
    vec3 camUp = cross(camRight, camForward);
    
    vec3 rayDir = normalize(camForward + uv.x * camRight + uv.y * camUp);
    
    // Geometry Constants
    float R_dish = u_dishRadius;
    float glassThick = u_glassThickness;
    float R_outer = R_dish + glassThick;
    float D_floor = -0.06;
    
    // Angled Key Light Source in World Space (with orbital sweep support)
    float activeKeyAzimuth = u_lightAngle + u_time * u_lightSweepSpeed;
    float lightElev = max(0.2, u_lightElevation);
    vec3 keyLightDir = normalize(vec3(
        cos(activeKeyAzimuth) * 0.9,
        lightElev,
        sin(activeKeyAzimuth) * 0.9
    ));
    vec3 keyLightColor = getLightColor(u_lightWarmth);
    
    // Secondary Rim / Backlight Source
    float activeRimAzimuth = activeKeyAzimuth + PI + u_rimLightAngle;
    vec3 rimLightDir = normalize(vec3(
        cos(activeRimAzimuth) * 0.85,
        max(0.2, lightElev * 0.8),
        sin(activeRimAzimuth) * 0.85
    ));
    vec3 rimLightColor = getLightColor(-u_lightWarmth * 0.5 + 0.1);
    
    // Studio Environment Palette
    vec3 studioDark = vec3(0.012, 0.015, 0.02);
    vec3 tableStage = vec3(0.025, 0.03, 0.038);
    vec3 glassColor = vec3(0.85, 0.92, 0.98);
    
    // Tint Selection
    vec3 waterBaseAbsorption;
    vec3 waterSurfaceTint;
    
    if (u_waterTint == 0) {
        // Pure Deionized Water (Neutral crystal clear with crisp caustic nodes)
        waterBaseAbsorption = vec3(0.4, 0.25, 0.15);
        waterSurfaceTint = vec3(0.85, 0.94, 1.0);
    } else if (u_waterTint == 1) {
        // Sapphire / Cyan Aqua (Deep ocean laboratory)
        waterBaseAbsorption = vec3(1.2, 0.35, 0.08);
        waterSurfaceTint = vec3(0.2, 0.75, 1.0);
    } else if (u_waterTint == 2) {
        // Golden Amber / Resin
        waterBaseAbsorption = vec3(0.15, 0.45, 1.4);
        waterSurfaceTint = vec3(1.0, 0.78, 0.3);
    } else if (u_waterTint == 3) {
        // Mercury Silver (Hyper-reflective liquid metal)
        waterBaseAbsorption = vec3(0.1, 0.1, 0.1);
        waterSurfaceTint = vec3(0.95, 0.97, 1.0);
    } else if (u_waterTint == 4) {
        // Bioluminescent Emerald
        waterBaseAbsorption = vec3(1.4, 0.15, 0.6);
        waterSurfaceTint = vec3(0.2, 1.0, 0.7);
    } else if (u_waterTint == 5) {
        // Rose Quartz / Ruby Elixir
        waterBaseAbsorption = vec3(0.2, 1.2, 0.8);
        waterSurfaceTint = vec3(1.0, 0.35, 0.55);
    } else if (u_waterTint == 6) {
        // Ultraviolet / Electric Indigo
        waterBaseAbsorption = vec3(0.7, 1.1, 0.15);
        waterSurfaceTint = vec3(0.6, 0.3, 1.0);
    } else {
        // Prismatic Opal / Iridescent
        waterBaseAbsorption = vec3(0.3, 0.3, 0.3);
        waterSurfaceTint = vec3(0.88, 0.92, 1.0);
    }
    
    // --- RAYMARCHING & SURFACE EVALUATION ---
    vec3 finalColor = studioDark;
    
    // Intersect plane y = 0 (water plane baseline)
    float t_water = -camPos.y / rayDir.y;
    
    if (rayDir.y < -0.0001 && t_water > 0.0) {
        vec3 p_water = camPos + rayDir * t_water;
        float r_water = length(p_water.xz);
        
        // 1. INSIDE PETRI DISH LIQUID CHAMBER (r <= R_dish)
        if (r_water <= R_dish) {
            vec3 modeColorMix;
            float causticLap;
            
            // True normal taking wave elevation into account
            vec3 N = getWaterNormal(p_water.xz, modeColorMix, causticLap);
            vec3 V = -rayDir;
            
            // Blend channel acoustic frequency color into water tint
            vec3 activeTint = mix(waterSurfaceTint, modeColorMix, 0.35);
            
            // Prismatic iridescence sheen if Opal tint is active
            if (u_waterTint == 7) {
                float viewDot = dot(N, V);
                vec3 rainbowSheen = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + viewDot * 2.0));
                activeTint = mix(activeTint, rainbowSheen, 0.45);
            }
            
            // A. Fresnel Reflectance (Schlick's formula for water, IOR ~ 1.333 -> F0 ~ 0.02)
            float NdotV = max(0.0, dot(N, V));
            float F0 = (u_waterTint == 3) ? 0.78 : 0.022; // Mercury is hyper-reflective
            float fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
            
            // B. Dual-Angled Specular Highlights (Key Light + Rim Backlight)
            vec3 H_key = normalize(keyLightDir + V);
            float NdotH_key = max(0.0, dot(N, H_key));
            float specSharpKey = pow(NdotH_key, 180.0) * u_lightIntensity * 2.4;
            float specSoftKey = pow(NdotH_key, 32.0) * u_lightIntensity * 0.4;
            vec3 specularGlintKey = keyLightColor * (specSharpKey + specSoftKey);
            
            vec3 H_rim = normalize(rimLightDir + V);
            float NdotH_rim = max(0.0, dot(N, H_rim));
            float specSharpRim = pow(NdotH_rim, 120.0) * u_rimLightIntensity * 1.8;
            float specSoftRim = pow(NdotH_rim, 24.0) * u_rimLightIntensity * 0.3;
            vec3 specularGlintRim = rimLightColor * (specSharpRim + specSoftRim);
            
            vec3 totalSpecular = specularGlintKey + specularGlintRim;
            
            // C. Refraction into the Fluid & Basin Floor Caustics
            vec3 refractedRay = refract(rayDir, N, 1.0 / 1.333);
            if (length(refractedRay) < 0.01) refractedRay = rayDir;
            
            // Floor intersection at y = D_floor
            float t_floor = (D_floor - p_water.y) / refractedRay.y;
            vec3 p_floor = p_water + refractedRay * t_floor;
            float r_floor = length(p_floor.xz);
            
            // Floor base color (dark obsidian anti-reflective plate)
            vec3 floorBase = vec3(0.018, 0.022, 0.028);
            if (r_floor < R_dish) {
                // Caustic focusing on the floor with chromatic dispersion
                float disp = u_causticDispersion;
                float causticR = clamp(1.0 + (causticLap * (1.0 + disp * 0.45)) * 1.8 * u_causticIntensity, 0.0, 5.5);
                float causticG = clamp(1.0 + causticLap * 1.8 * u_causticIntensity, 0.0, 5.5);
                float causticB = clamp(1.0 + (causticLap * (1.0 - disp * 0.45)) * 1.8 * u_causticIntensity, 0.0, 5.5);
                vec3 causticRGB = vec3(causticR, causticG, causticB);
                
                float causticGlow = pow(clamp(causticLap * 0.8, 0.0, 3.0), 2.0) * u_causticIntensity;
                
                // Beer-Lambert light absorption through fluid depth
                float fluidTravel = length(p_floor - p_water);
                vec3 absorbance = exp(-waterBaseAbsorption * fluidTravel * 20.0);
                
                vec3 causticLight = activeTint * causticRGB * keyLightColor * 0.75 + keyLightColor * causticGlow * 0.5;
                vec3 floorLit = floorBase + causticLight;
                vec3 refractedFloor = floorLit * absorbance;
                
                // Subsurface / Ambient Luminescence within fluid body
                vec3 ambientFluidGlow = activeTint * u_ambientGlow * (0.6 + 0.4 * u_breathRadius);
                refractedFloor += ambientFluidGlow;
                
                // Studio sky & overhead angled reflection
                vec3 skyReflect = mix(studioDark, activeTint * 0.8 + keyLightColor * 0.4, pow(1.0 - NdotV, 3.0));
                
                // Combine Refracted Floor + Surface Fresnel Reflection + Specular Glints
                finalColor = mix(refractedFloor, skyReflect, fresnel) + totalSpecular;
            } else {
                finalColor = floorBase;
            }
            
            // Subtle ambient occlusion vignette near inner rim
            float rimAO = smoothstep(R_dish, R_dish - 0.08, r_water);
            finalColor *= (0.7 + 0.3 * rimAO);
        }
        // 2. GLASS RIM OF PETRI DISH (R_dish < r <= R_outer)
        else if (r_water <= R_outer) {
            float normRim = (r_water - R_dish) / glassThick;
            
            // Glass surface normal (curved rounded bevel)
            vec2 radialDir = normalize(p_water.xz);
            float rimBevel = sin(normRim * PI);
            vec3 N_glass = normalize(vec3(radialDir.x * (normRim - 0.5) * 2.0, 1.0 - rimBevel * 0.5, radialDir.y * (normRim - 0.5) * 2.0));
            
            vec3 V = -rayDir;
            vec3 H_glass = normalize(keyLightDir + V);
            float NdotH = max(0.0, dot(N_glass, H_glass));
            float glassSpec = pow(NdotH, 140.0) * u_lightIntensity * 2.8;
            
            vec3 H_glassRim = normalize(rimLightDir + V);
            float NdotH_rim = max(0.0, dot(N_glass, H_glassRim));
            float glassSpecRim = pow(NdotH_rim, 90.0) * u_rimLightIntensity * 2.0;
            
            float fresnelGlass = 0.04 + 0.96 * pow(1.0 - max(0.0, dot(N_glass, V)), 4.0);
            
            vec3 glassBody = mix(tableStage * 0.6, glassColor * 0.7, rimBevel);
            finalColor = mix(glassBody, keyLightColor, fresnelGlass) + keyLightColor * glassSpec + rimLightColor * glassSpecRim;
        }
        // 3. TABLETOP / LABORATORY STAGE OUTSIDE DISH (r > R_outer)
        else {
            // Soft contact shadow cast by petri dish
            float shadow = smoothstep(R_outer + 0.22, R_outer, r_water) * 0.65;
            
            // Subtle table grid / stage texture
            float grid = (sin(p_water.x * 60.0) * sin(p_water.z * 60.0) > 0.95) ? 0.015 : 0.0;
            vec3 tableColor = tableStage * (1.0 - shadow) + vec3(grid);
            
            finalColor = tableColor;
        }
    }
    
    // Viewport radial falloff vignette
    float vRad = length(uv);
    float vignette = smoothstep(1.8, 0.4, vRad);
    finalColor *= vignette;
    
    fragColor = vec4(finalColor, clamp(u_masterOpacity, 0.0, 1.0));
}
`;

export const Lens_Hydro: VisualizerPlugin = {
    id: 'HYDRO',
    name: 'Hydro Cymatic',
    renderType: 'WEBGL',
    isLegacy: false,
    
    parameters: [
        // Camera & Framing
        { id: 'cameraPitch', label: 'View Tilt Angle', icon: 'MoveVertical', type: 'SLIDER', min: 0.05, max: 1.25, step: 0.01, color: '#38bdf8', section: 'CAMERA', defaultValue: 0.52 },
        { id: 'cameraYaw', label: 'Orbit Rotation', icon: 'RotateCcw', type: 'SLIDER', min: -3.14, max: 3.14, step: 0.02, color: '#818cf8', section: 'CAMERA', defaultValue: 0.0 },
        { id: 'cameraZoom', label: 'Petri Dish Scale', icon: 'Maximize', type: 'SLIDER', min: 0.4, max: 2.0, step: 0.02, color: '#6366f1', section: 'CAMERA', defaultValue: 1.0 },
        
        // Physics & Standing Waves
        { id: 'force', label: 'Acoustic Force', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 4.0, step: 0.05, color: '#e879f9', section: 'PHYSICS', defaultValue: 1.4 },
        { id: 'surfaceTension', label: 'Surface Tension', icon: 'Activity', type: 'SLIDER', min: 0.2, max: 4.0, step: 0.05, color: '#ef4444', section: 'PHYSICS', defaultValue: 1.5 },
        { id: 'viscosity', label: 'Fluid Damping', icon: 'Droplet', type: 'SLIDER', min: 0.0, max: 0.9, step: 0.02, color: '#34d399', section: 'PHYSICS', defaultValue: 0.15 },
        { id: 'faradayEffect', label: 'Faraday Subharmonic', icon: 'Waves', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#2dd4bf', section: 'PHYSICS', defaultValue: 0.45 },
        { id: 'harmonicOvertones', label: 'Fractal Overtones', icon: 'Layers', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#ec4899', section: 'PHYSICS', defaultValue: 0.2 },
        { id: 'fluidTurbulence', label: 'Thermal Drift', icon: 'Wind', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.02, color: '#fbbf24', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'meniscus', label: 'Glass Wall Meniscus', icon: 'Circle', type: 'SLIDER', min: 0.0, max: 1.5, step: 0.05, color: '#22d3ee', section: 'PHYSICS', defaultValue: 0.7 },
        
        // Angled Lighting & Optics
        { id: 'lightAngle', label: 'Key Light Azimuth', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 6.28, step: 0.05, color: '#fde047', section: 'LIGHT', defaultValue: 0.85 },
        { id: 'lightElevation', label: 'Key Light Height', icon: 'Sun', type: 'SLIDER', min: 0.2, max: 3.0, step: 0.05, color: '#facc15', section: 'LIGHT', defaultValue: 1.2 },
        { id: 'lightIntensity', label: 'Key Specular Glint', icon: 'Sparkles', type: 'SLIDER', min: 0.1, max: 6.0, step: 0.1, color: '#ffffff', section: 'LIGHT', defaultValue: 2.2 },
        { id: 'lightWarmth', label: 'Light Warmth / Temp', icon: 'Flame', type: 'SLIDER', min: -1.0, max: 1.0, step: 0.05, color: '#f97316', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'rimLightIntensity', label: 'Rim Backlight Power', icon: 'Moon', type: 'SLIDER', min: 0.0, max: 4.0, step: 0.1, color: '#c084fc', section: 'LIGHT', defaultValue: 0.8 },
        { id: 'rimLightAngle', label: 'Rim Offset Angle', icon: 'Compass', type: 'SLIDER', min: -3.14, max: 3.14, step: 0.05, color: '#a855f7', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'causticIntensity', label: 'Floor Caustics', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 6.0, step: 0.1, color: '#38bdf8', section: 'LIGHT', defaultValue: 2.2 },
        { id: 'causticDispersion', label: 'Prismatic Dispersion', icon: 'Rainbow', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.02, color: '#06b6d4', section: 'LIGHT', defaultValue: 0.25 },
        { id: 'ambientGlow', label: 'Fluid Luminescence', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#10b981', section: 'LIGHT', defaultValue: 0.1 },
        { id: 'lightSweepSpeed', label: 'Orbital Light Sweep', icon: 'RotateCw', type: 'SLIDER', min: 0.0, max: 0.3, step: 0.005, color: '#eab308', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Compass', type: 'SLIDER', min: 0, max: 24, step: 2, color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 }
    ],

    defaultConfig: {
        cameraPitch: 0.52,
        cameraYaw: 0.0,
        cameraZoom: 1.0,
        dishRadius: 1.0,
        glassThickness: 0.05,
        meniscus: 0.7,
        surfaceTension: 1.5,
        viscosity: 0.15,
        force: 1.4,
        faradayEffect: 0.45,
        harmonicOvertones: 0.2,
        fluidTurbulence: 0.0,
        lightAngle: 0.85,
        lightElevation: 1.2,
        lightIntensity: 2.2,
        lightWarmth: 0.0,
        rimLightIntensity: 0.8,
        rimLightAngle: 0.0,
        causticIntensity: 2.2,
        causticDispersion: 0.25,
        ambientGlow: 0.1,
        lightSweepSpeed: 0.0,
        kaleidoscope: 0,
        crystallineLayer: 0,
        waterTint: 0,
        masterOpacity: 1.0
    },

    presets: Object.entries(RAW_PRESETS).map(([name, data]: [string, Record<string, unknown>], i) => ({
        id: `factory_hydro_${i}`,
        name,
        config: { ...(data.config as Record<string, unknown>) },
        modulations: (data.modulations as Record<string, any>) || {}
    })),

    render: (context: LensContext, localConfig?: Record<string, unknown>) => {
        const { gl, w, h, amplitudes, time, dt, globalBinauralBeat, breathRadius, memory, config: rawConfig } = context;
        if (!gl) return;

        const config = localConfig ? { ...rawConfig, ...localConfig } : rawConfig;

        // Initialize WebGL2 Program and Quad Buffer on First Run
        if (!memory.hydroProgram) {
            const compileShader = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error("Hydro Shader compile error:", gl.getShaderInfoLog(s));
                    gl.deleteShader(s);
                    return null;
                }
                return s;
            };

            const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
            const fs = compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);
            if (!vs || !fs) return;

            const prog = gl.createProgram()!;
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);

            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.error("Hydro Program link error:", gl.getProgramInfoLog(prog));
                return;
            }

            memory.hydroProgram = prog;

            // Fullscreen Quad Buffer
            const quadVerts = new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                -1,  1,
                 1, -1,
                 1,  1
            ]);

            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
            memory.quadVbo = vbo;

            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            const posAttr = gl.getAttribLocation(prog, 'a_position');
            gl.enableVertexAttribArray(posAttr);
            gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
            memory.quadVao = vao;

            // Cache uniform locations
            memory.locs = {
                u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
                u_centerOffset: gl.getUniformLocation(prog, 'u_centerOffset'),
                u_aspect: gl.getUniformLocation(prog, 'u_aspect'),
                u_time: gl.getUniformLocation(prog, 'u_time'),
                u_cameraPitch: gl.getUniformLocation(prog, 'u_cameraPitch'),
                u_cameraYaw: gl.getUniformLocation(prog, 'u_cameraYaw'),
                u_cameraZoom: gl.getUniformLocation(prog, 'u_cameraZoom'),
                u_dishRadius: gl.getUniformLocation(prog, 'u_dishRadius'),
                u_glassThickness: gl.getUniformLocation(prog, 'u_glassThickness'),
                u_meniscus: gl.getUniformLocation(prog, 'u_meniscus'),
                u_surfaceTension: gl.getUniformLocation(prog, 'u_surfaceTension'),
                u_viscosity: gl.getUniformLocation(prog, 'u_viscosity'),
                u_force: gl.getUniformLocation(prog, 'u_force'),
                u_faradayEffect: gl.getUniformLocation(prog, 'u_faradayEffect'),
                u_harmonicOvertones: gl.getUniformLocation(prog, 'u_harmonicOvertones'),
                u_fluidTurbulence: gl.getUniformLocation(prog, 'u_fluidTurbulence'),
                u_lightAngle: gl.getUniformLocation(prog, 'u_lightAngle'),
                u_lightElevation: gl.getUniformLocation(prog, 'u_lightElevation'),
                u_lightIntensity: gl.getUniformLocation(prog, 'u_lightIntensity'),
                u_lightWarmth: gl.getUniformLocation(prog, 'u_lightWarmth'),
                u_rimLightIntensity: gl.getUniformLocation(prog, 'u_rimLightIntensity'),
                u_rimLightAngle: gl.getUniformLocation(prog, 'u_rimLightAngle'),
                u_causticIntensity: gl.getUniformLocation(prog, 'u_causticIntensity'),
                u_causticDispersion: gl.getUniformLocation(prog, 'u_causticDispersion'),
                u_ambientGlow: gl.getUniformLocation(prog, 'u_ambientGlow'),
                u_lightSweepSpeed: gl.getUniformLocation(prog, 'u_lightSweepSpeed'),
                u_waterTint: gl.getUniformLocation(prog, 'u_waterTint'),
                u_masterOpacity: gl.getUniformLocation(prog, 'u_masterOpacity'),
                u_binauralBeat: gl.getUniformLocation(prog, 'u_binauralBeat'),
                u_binauralPulse: gl.getUniformLocation(prog, 'u_binauralPulse'),
                u_breathRadius: gl.getUniformLocation(prog, 'u_breathRadius'),
                u_breathWave: gl.getUniformLocation(prog, 'u_breathWave'),
                u_activeChannelCount: gl.getUniformLocation(prog, 'u_activeChannelCount'),
                u_kaleidoscope: gl.getUniformLocation(prog, 'u_kaleidoscope'),
                u_crystalline: gl.getUniformLocation(prog, 'u_crystalline'),
                u_harmonics: gl.getUniformLocation(prog, 'u_harmonics'),
                u_harmonicsExt: gl.getUniformLocation(prog, 'u_harmonicsExt')
            };

            memory.channelPhases = new Float32Array(16);
            memory.channelSmoothAmps = new Float32Array(16);
        }

        const prog = memory.hydroProgram;
        const locs = memory.locs;
        gl.useProgram(prog);
        gl.bindVertexArray(memory.quadVao);

        // Viewport and Dimensions
        gl.viewport(0, 0, w, h);
        const aspect = w / Math.max(1, h);

        // Advance Channel Dynamic Phases & Smooth Amplitudes
        const safeDt = typeof dt === 'number' && dt > 0 && dt < 0.1 ? dt : 0.016;
        const safeTime = typeof time === 'number' ? time : 0;
        const binauralBeat = typeof globalBinauralBeat === 'number' && globalBinauralBeat > 0 ? globalBinauralBeat : 7.83;
        const safeBreath = typeof breathRadius === 'number' ? breathRadius : 0.5;

        const harmonicsData = new Float32Array(16 * 4);
        const harmonicsExtData = new Float32Array(16 * 4);

        if (!memory.channelSmoothAmpsMap) memory.channelSmoothAmpsMap = new Map<string, number>();
        if (!memory.channelPhasesMap) memory.channelPhasesMap = new Map<string, number>();

        // Collect all active sounding channels across the entire spectrum (including all G&M scale octaves 3-5)
        const activeChannelsList: { ch: { id: string; name: string; freq: number }; amp: number; visualFreq: number; phase: number }[] = [];

        LATTICE_CHANNELS.forEach((ch) => {
            const rawAmp = amplitudes?.get(ch.id) || 0;
            const targetAmp = isFinite(rawAmp) ? rawAmp : 0;
            
            // Exponential smoothing per channel ID
            let curAmp = memory.channelSmoothAmpsMap.get(ch.id) || 0;
            curAmp += (targetAmp - curAmp) * (1.0 - Math.exp(-safeDt / 0.08));
            memory.channelSmoothAmpsMap.set(ch.id, curAmp);

            if (curAmp > 0.001 || targetAmp > 0.001) {
                const effFreq = (context as any).customFrequencies?.[ch.id] ?? ch.freq;
                // Undertone folding for frequencies > 90Hz to produce stable, crisp standing waves
                const visualFreq = getStandingWaveUndertone(effFreq, 90);
                const speed = 2.0 + Math.log10(Math.max(1, visualFreq));
                let curPhase = memory.channelPhasesMap.get(ch.id) || 0;
                curPhase = (curPhase + safeDt * speed * 3.0) % (Math.PI * 2000);
                memory.channelPhasesMap.set(ch.id, curPhase);

                activeChannelsList.push({
                    ch: { id: ch.id, name: ch.name, freq: effFreq },
                    amp: curAmp,
                    visualFreq,
                    phase: curPhase
                });
            }
        });

        // Also check any numeric keys in amplitudes (e.g. custom or tone generator keys)
        if (amplitudes) {
            for (const [key, rawAmp] of amplitudes.entries()) {
                if (typeof key === 'number' || (!isNaN(parseFloat(key as string)) && !LATTICE_CHANNELS.some(c => c.id === key))) {
                    const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                    if (freqNum > 0 && isFinite(rawAmp) && rawAmp > 0.001) {
                        const strKey = `freq_${freqNum}`;
                        let curAmp = memory.channelSmoothAmpsMap.get(strKey) || 0;
                        curAmp += (rawAmp - curAmp) * (1.0 - Math.exp(-safeDt / 0.08));
                        memory.channelSmoothAmpsMap.set(strKey, curAmp);
                        if (curAmp > 0.001) {
                            const visualFreq = getStandingWaveUndertone(freqNum, 90);
                            const speed = 2.0 + Math.log10(Math.max(1, visualFreq));
                            let curPhase = memory.channelPhasesMap.get(strKey) || 0;
                            curPhase = (curPhase + safeDt * speed * 3.0) % (Math.PI * 2000);
                            memory.channelPhasesMap.set(strKey, curPhase);
                            activeChannelsList.push({
                                ch: { id: strKey, name: `${freqNum} Hz`, freq: freqNum },
                                amp: curAmp,
                                visualFreq,
                                phase: curPhase
                            });
                        }
                    }
                }
            }
        }

        // Sort by amplitude so the strongest active tones fill the 16 shader harmonics
        activeChannelsList.sort((a, b) => b.amp - a.amp);

        const activeCount = Math.min(16, activeChannelsList.length);
        for (let i = 0; i < activeCount; i++) {
            const item = activeChannelsList[i];
            const lobeOrder = Math.max(0, Math.round(Math.sqrt(item.visualFreq) * 0.35) % 9);
            const wavenumber = Math.max(1.0, Math.round(Math.sqrt(item.visualFreq) * 1.6));
            const rgb = getFrequencyRGB(item.ch.freq);

            const offset = i * 4;
            // x: amp, y: freq, z: phase, w: m (lobeOrder)
            harmonicsData[offset + 0] = item.amp;
            harmonicsData[offset + 1] = item.ch.freq;
            harmonicsData[offset + 2] = item.phase;
            harmonicsData[offset + 3] = lobeOrder;

            // x: k (wavenumber), y: r, z: g, w: b
            harmonicsExtData[offset + 0] = wavenumber;
            harmonicsExtData[offset + 1] = rgb.r / 255.0;
            harmonicsExtData[offset + 2] = rgb.g / 255.0;
            harmonicsExtData[offset + 3] = rgb.b / 255.0;
        }

        // If completely silent, maintain a subtle harmonic baseline so the water has presence
        if (activeCount === 0) {
            const rgb1 = getFrequencyRGB(136.1);
            const rgb2 = getFrequencyRGB(432.0);
            harmonicsData[0] = 0.04;
            harmonicsData[1] = 136.1;
            harmonicsData[2] = safeTime * 1.5;
            harmonicsData[3] = 4;
            harmonicsExtData[0] = 5.0;
            harmonicsExtData[1] = rgb1.r / 255.0; harmonicsExtData[2] = rgb1.g / 255.0; harmonicsExtData[3] = rgb1.b / 255.0;

            harmonicsData[4] = 0.03;
            harmonicsData[5] = 432.0;
            harmonicsData[6] = safeTime * 2.2;
            harmonicsData[7] = 6;
            harmonicsExtData[4] = 8.0;
            harmonicsExtData[5] = rgb2.r / 255.0; harmonicsExtData[6] = rgb2.g / 255.0; harmonicsExtData[7] = rgb2.b / 255.0;
        }

        // Upload Uniforms
        gl.uniform2f(locs.u_resolution, w, h);
        gl.uniform2f(locs.u_centerOffset, 0.0, 0.0);
        gl.uniform1f(locs.u_aspect, aspect);
        gl.uniform1f(locs.u_time, safeTime);
        
        gl.uniform1f(locs.u_cameraPitch, Number(config.cameraPitch ?? 0.52));
        gl.uniform1f(locs.u_cameraYaw, Number(config.cameraYaw ?? 0.0));
        gl.uniform1f(locs.u_cameraZoom, Number(config.cameraZoom ?? 1.0) * Number(config.visualScale ?? 1.0));
        
        gl.uniform1f(locs.u_dishRadius, Number(config.dishRadius ?? 1.0));
        gl.uniform1f(locs.u_glassThickness, Number(config.glassThickness ?? 0.05));
        gl.uniform1f(locs.u_meniscus, Number(config.meniscus ?? 0.7));
        gl.uniform1f(locs.u_surfaceTension, Number(config.surfaceTension ?? 1.5));
        gl.uniform1f(locs.u_viscosity, Number(config.viscosity ?? 0.15));
        gl.uniform1f(locs.u_force, Number(config.force ?? 1.4));
        gl.uniform1f(locs.u_faradayEffect, Number(config.faradayEffect ?? 0.45));
        gl.uniform1f(locs.u_harmonicOvertones, Number(config.harmonicOvertones ?? 0.2));
        gl.uniform1f(locs.u_fluidTurbulence, Number(config.fluidTurbulence ?? 0.0));
        
        gl.uniform1f(locs.u_lightAngle, Number(config.lightAngle ?? 0.85));
        gl.uniform1f(locs.u_lightElevation, Number(config.lightElevation ?? 1.2));
        gl.uniform1f(locs.u_lightIntensity, Number(config.lightIntensity ?? 2.2));
        gl.uniform1f(locs.u_lightWarmth, Number(config.lightWarmth ?? 0.0));
        gl.uniform1f(locs.u_rimLightIntensity, Number(config.rimLightIntensity ?? 0.8));
        gl.uniform1f(locs.u_rimLightAngle, Number(config.rimLightAngle ?? 0.0));
        gl.uniform1f(locs.u_causticIntensity, Number(config.causticIntensity ?? 2.2));
        gl.uniform1f(locs.u_causticDispersion, Number(config.causticDispersion ?? 0.25));
        gl.uniform1f(locs.u_ambientGlow, Number(config.ambientGlow ?? 0.1));
        gl.uniform1f(locs.u_lightSweepSpeed, Number(config.lightSweepSpeed ?? 0.0));
        
        let tintIndex = 0;
        if (config.waterTint === 'SAPPHIRE_CYAN') tintIndex = 1;
        else if (config.waterTint === 'GOLDEN_AMBER') tintIndex = 2;
        else if (config.waterTint === 'MERCURY_SILVER') tintIndex = 3;
        else if (config.waterTint === 'BIOLUMINESCENT_EMERALD') tintIndex = 4;
        else if (config.waterTint === 'ROSE_QUARTZ' || config.waterTint === 'CRIMSON_ELIXIR') tintIndex = 5;
        else if (config.waterTint === 'ULTRAVIOLET_INDIGO') tintIndex = 6;
        else if (config.waterTint === 'PRISMATIC_OPAL') tintIndex = 7;
        else if (typeof config.waterTint === 'number') tintIndex = config.waterTint;
        gl.uniform1i(locs.u_waterTint, tintIndex);
        
        gl.uniform1f(locs.u_masterOpacity, Number(config.masterOpacity ?? 1.0));
        gl.uniform1f(locs.u_kaleidoscope, Number(config.kaleidoscope ?? 0.0));
        gl.uniform1f(locs.u_crystalline, Number(config.crystallineLayer ?? 0.0));
        
        gl.uniform1f(locs.u_binauralBeat, binauralBeat);
        gl.uniform1f(locs.u_binauralPulse, Math.sin(safeTime * binauralBeat * Math.PI * 2));
        gl.uniform1f(locs.u_breathRadius, safeBreath);
        gl.uniform1f(locs.u_breathWave, Math.sin(safeTime * 0.8));
        gl.uniform1i(locs.u_activeChannelCount, activeCount);
        
        gl.uniform4fv(locs.u_harmonics, harmonicsData);
        gl.uniform4fv(locs.u_harmonicsExt, harmonicsExtData);

        // Draw Fullscreen Quad
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },

    cleanup: (context: { gl: WebGL2RenderingContext | WebGLRenderingContext | null, memory: Record<string, unknown> }) => {
        const { gl, memory } = context;
        if (gl && memory.hydroProgram) {
            gl.deleteProgram(memory.hydroProgram as WebGLProgram);
        }
        if (gl && memory.quadVbo) {
            gl.deleteBuffer(memory.quadVbo as WebGLBuffer);
        }
        if (gl && memory.quadVao && (gl as WebGL2RenderingContext).deleteVertexArray) {
            (gl as WebGL2RenderingContext).deleteVertexArray(memory.quadVao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(k => delete memory[k]);
    }
};
