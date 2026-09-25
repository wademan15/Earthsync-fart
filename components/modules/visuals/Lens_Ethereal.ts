import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyHSL } from './shared';

const getVal = (v: unknown, f: number) => isNaN(parseFloat(v as string)) ? f : parseFloat(v as string);

// --- THE MASTER PRESET SUITE ---
const PRESETS: VisualizerPreset[] = [
    {
        id: 'ethereal_1',
        name: '01. Deep Breath Nebula',
        config: { expansion: 0.5, chromaticSplit: 0.0, flowSpeed: 0.3, complexity: 1.0, panX: 0, panY: 0, col1: 0.6, col2: 0.55, col3: 0.75, exposure: 2.5, gamma: 1.2, invert: 0, kaleidoscope: 0, vortex: 0, singularity: 0, aspectBreathing: 0, zoomVelocity: 0, lightning: 0, roughness: 0, turbulence: 0, hueCycle: 0, saturation: 1.0, solarize: 0, crystallize: 0, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            expansion: { enabled: true, min: 0.5, max: 1.8, amtBreath: 1.0, mixMode: 'ADD' },
            vortex: { enabled: true, min: 0.0, max: 0.15, amtBreath: 0.8, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_2',
        name: '02. Audio Lattice',
        config: { expansion: 1.2, chromaticSplit: 0.1, flowSpeed: 0.5, complexity: 1.5, panX: 0, panY: 0, col1: 0.5, col2: 0.9, col3: 0.1, exposure: 3.0, gamma: 1.1, invert: 0, kaleidoscope: 0, vortex: 0, singularity: 0, aspectBreathing: 0, zoomVelocity: 0.1, lightning: 0.0, roughness: 0.0, turbulence: 0.2, hueCycle: 0, saturation: 1.5, solarize: 0, crystallize: 0.8, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            crystallize: { enabled: true, min: 0.6, max: 1.0, amtAudio: 1.0, mixMode: 'ADD' }, 
            chromaticSplit: { enabled: true, min: 0.1, max: 0.6, amtAudio: 1.0, mixMode: 'ADD' },
            saturation: { enabled: true, min: 0.5, max: 2.5, amtAudio: 0.8, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_3',
        name: '03. Systolic Void',
        config: { expansion: 0.2, chromaticSplit: 0.0, flowSpeed: 0.2, complexity: 2.0, panX: 0, panY: 0, col1: 0.0, col2: 0.02, col3: 0.05, exposure: 2.0, gamma: 1.5, invert: 0, kaleidoscope: 0, vortex: 0.1, singularity: 0.4, aspectBreathing: 0, zoomVelocity: 0, lightning: 0.2, roughness: 0.4, turbulence: 0.2, hueCycle: 0, saturation: 1.0, solarize: 0, crystallize: 0, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            visualScale: { enabled: true, min: 0.9, max: 1.3, amtHeart: 1.0, mixMode: 'ADD' },
            complexity: { enabled: true, min: 2.0, max: 3.0, amtHeart: 0.8, mixMode: 'ADD' },
            singularity: { enabled: true, min: 0.4, max: 0.7, amtHeart: 0.9, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_4',
        name: '04. Hyperspace Mandala',
        config: { expansion: 1.5, chromaticSplit: 0.0, flowSpeed: 0.2, complexity: 1.5, panX: 0, panY: 0, col1: 0.8, col2: 0.7, col3: 0.9, exposure: 3.5, gamma: 1.0, invert: 0, kaleidoscope: 0.3, vortex: 0.0, singularity: 0, aspectBreathing: 0, zoomVelocity: 0.6, lightning: 0, roughness: 0.1, turbulence: 0, hueCycle: 0, saturation: 2.0, solarize: 0, crystallize: 0, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            vortex: { enabled: true, min: -0.2, max: 0.2, amtBreath: 1.0, mixMode: 'ADD' },
            hueCycle: { enabled: true, min: 0.0, max: 1.0, amtAudio: 0.6, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_5',
        name: '05. Neural Pathways',
        config: { expansion: 1.0, chromaticSplit: 0.05, flowSpeed: 0.4, complexity: 0.8, panX: 0, panY: 0, col1: 0.4, col2: 0.5, col3: 0.6, exposure: 1.8, gamma: 1.0, invert: 1, kaleidoscope: 0, vortex: 0, singularity: 0, aspectBreathing: 0, zoomVelocity: 0, lightning: 0.8, roughness: 0.6, turbulence: 0.4, hueCycle: 0, saturation: 1.0, solarize: 0, crystallize: 0, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            aspectBreathing: { enabled: true, min: 0.0, max: 0.4, amtBreath: 1.0, mixMode: 'ADD' },
            expansion: { enabled: true, min: 1.0, max: 2.0, amtBreath: 0.8, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_6',
        name: '06. Abyssal Threads',
        // Dark, eerie, highly complex bioluminescent webbing. 
        config: { expansion: 0.3, chromaticSplit: 0.02, flowSpeed: 0.1, complexity: 2.8, panX: 0, panY: 0, col1: 0.65, col2: 0.55, col3: 0.1, exposure: 1.8, gamma: 2.0, invert: 0, kaleidoscope: 0, vortex: 0.05, singularity: 0, aspectBreathing: 0, zoomVelocity: 0.02, lightning: 0.6, roughness: 0.4, turbulence: 0.1, hueCycle: 0, saturation: 0.8, solarize: 0, crystallize: 0, visualScale: 1.2, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            lightning: { enabled: true, min: 0.4, max: 0.8, amtAudio: 0.8, mixMode: 'ADD' },
            exposure: { enabled: true, min: 1.5, max: 2.5, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_7',
        name: '07. Liquid Mercury',
        config: { expansion: 0.5, chromaticSplit: 0.0, flowSpeed: 1.5, complexity: 1.5, panX: 0, panY: 0, col1: 0.5, col2: 0.5, col3: 0.5, exposure: 4.0, gamma: 1.8, invert: 0, kaleidoscope: 0, vortex: 0, singularity: 0, aspectBreathing: 0, zoomVelocity: 0, lightning: 0.1, roughness: 0.2, turbulence: 0.8, hueCycle: 0, saturation: 0.0, solarize: 1.0, crystallize: 0, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            forceMultiplier: { enabled: true, min: 1.0, max: 3.0, amtHeart: 1.0, mixMode: 'ADD' },
            turbulence: { enabled: true, min: 0.8, max: 1.5, amtHeart: 0.5, mixMode: 'ADD' }
        }
    },
    {
        id: 'ethereal_8',
        name: '08. God Mode',
        config: { expansion: 1.0, chromaticSplit: 0.1, flowSpeed: 0.5, complexity: 1.2, panX: 0, panY: 0, col1: 0.0, col2: 0.3, col3: 0.6, exposure: 3.0, gamma: 1.2, invert: 0, kaleidoscope: 0.15, vortex: 0, singularity: 0.1, aspectBreathing: 0, zoomVelocity: 0.2, lightning: 0.2, roughness: 0.1, turbulence: 0.3, hueCycle: 0.5, saturation: 2.0, solarize: 0, crystallize: 0.5, visualScale: 1.0, forceMultiplier: 1.0, audioReactivity: 1.0, masterOpacity: 1.0 },
        modulations: { 
            kaleidoscope: { enabled: true, min: 0.15, max: 0.4, amtBreath: 1.0, mixMode: 'ADD' },
            crystallize: { enabled: true, min: 0.3, max: 0.9, amtAudio: 1.0, mixMode: 'ADD' },
            chromaticSplit: { enabled: true, min: 0.1, max: 0.5, amtAudio: 0.8, mixMode: 'ADD' }
        }
    }
];

const VS = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 v_uv;

uniform float u_time;
uniform float u_aspect;
uniform vec2 u_pan;
uniform vec2 u_center;

// GLOBAL MODIFIERS
uniform float u_visualScale;
uniform float u_forceMultiplier;
uniform float u_audioReactivity;
uniform float u_masterOpacity;

// STANDARD PHYSICS
uniform float u_expansion;
uniform float u_flowSpeed;
uniform float u_complexity;

// PSYCHEDELIC WARPING
uniform float u_kaleidoscope;
uniform float u_vortex;
uniform float u_singularity;
uniform float u_aspectBreathing;
uniform float u_zoomVelocity;
uniform float u_lightning;
uniform float u_roughness;
uniform float u_turbulence;

// SENSORY & LIGHT
uniform float u_hue1;
uniform float u_hue2;
uniform float u_hue3;
uniform float u_exposure;
uniform float u_gamma;
uniform float u_invert;

uniform float u_hueCycle;
uniform float u_saturation;
uniform float u_chromaticSplit;
uniform float u_solarize;
uniform float u_crystallize;

out vec4 fragColor;

// --- MATH FUNCTIONS ---
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// True Value Noise Hash
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// --- THE INTRINSIC CRYSTAL FBM ---
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    
    // Morph Edge: 0.5 = perfectly smooth curve. 0.01 = razor sharp flat panes.
    float edge = mix(0.5, 0.01, u_crystallize);
    
    for (int i = 0; i < 6; ++i) {
        // Force the FBM grid itself into a diamond lattice
        vec2 gp = rot(0.785398) * p; 
        vec2 id = floor(gp);
        vec2 f = fract(gp);
        
        // Flattens the noise interpolation to create intrinsic facets
        vec2 u = smoothstep(0.5 - edge, 0.5 + edge, f);
        
        float n = mix(mix(hash(id + vec2(0.0,0.0)), hash(id + vec2(1.0,0.0)), u.x),
                      mix(hash(id + vec2(0.0,1.0)), hash(id + vec2(1.0,1.0)), u.x), u.y);
        
        n = mix(n, abs(n - 0.5) * 2.0, u_lightning); 
        v += a * n;
        p = rot(0.5) * p * 2.0 + shift;
        a *= (0.5 + u_roughness * 0.2); 
    }
    return v;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = v_uv;
    uv -= u_center;
    
    uv *= (1.0 / max(0.01, u_visualScale));

    uv.x *= u_aspect * (1.0 + u_aspectBreathing);
    uv += u_pan;

    if (u_singularity > 0.01) {
        uv *= pow(length(uv), 1.0 + u_singularity * 2.0);
    }

    if (u_vortex > 0.01) {
        uv *= rot(length(uv) * u_vortex * 3.0);
    }

    if (u_kaleidoscope > 0.01) {
        float segments = mix(1.0, 12.0, u_kaleidoscope);
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        angle = mod(angle, 6.28318 / segments);
        angle = abs(angle - 3.14159 / segments);
        uv = radius * vec2(cos(angle), sin(angle));
    }

    float t = (u_time * u_flowSpeed * 0.5) + (u_time * u_zoomVelocity * 2.0);

    float hOffset = u_time * u_hueCycle * 0.5;
    float sat = clamp(u_saturation, 0.0, 3.0);

    vec3 c1 = hsv2rgb(vec3(u_hue1 + hOffset, min(sat, 1.0), 0.2)); 
    vec3 c2 = hsv2rgb(vec3(u_hue2 + hOffset, min(sat * 0.8, 1.0), 1.0)); 
    vec3 c3 = hsv2rgb(vec3(u_hue3 + hOffset, min(sat * 0.6, 1.0), 1.0)); 
    
    if (sat > 1.0) {
        c1 *= 1.0 + (sat - 1.0) * 0.5;
        c2 *= 1.0 + (sat - 1.0) * 0.5;
        c3 *= 1.0 + (sat - 1.0) * 0.5;
    }

    float appliedForce = max(0.0, u_forceMultiplier);

    vec2 q = vec2(0.0);
    q.x = fbm(uv + 0.05 * t * appliedForce);
    q.y = fbm(uv + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * t * appliedForce);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * t * appliedForce);

    float turb = (1.0 + u_expansion + (u_turbulence * 3.0)) * appliedForce; 
    
    float f = fbm(uv + r * turb * u_complexity);

    vec3 color = mix(c1, c2, clamp((f*f)*4.0, 0.0, 1.0));
    color = mix(color, c3, clamp(length(q), 0.0, 1.0));
    color = mix(color, vec3(1.0), clamp(length(r.x), 0.0, 1.0) * f * f * f * 2.0);

    if (u_chromaticSplit > 0.01) {
        float jitter = u_chromaticSplit * 0.08 * max(0.0, u_audioReactivity);
        float f_r = fbm(uv + vec2(jitter, 0.0) + r * turb * u_complexity);
        float f_b = fbm(uv - vec2(jitter, 0.0) + r * turb * u_complexity);
        color.r += (f_r * f_r * 0.8);
        color.b += (f_b * f_b * 0.8);
    }

    if (u_solarize > 0.01) {
        color = mix(color, sin(color * 3.14159), u_solarize);
    }

    float vignette = 1.0 - smoothstep(0.4, 1.5, length(uv / max(0.01, u_visualScale)));
    color *= vignette;

    color *= u_exposure;
    color = color / (1.0 + color); 
    color = pow(color, vec3(1.0 / max(0.1, u_gamma)));  
    if (u_invert > 0.5) color = 1.0 - color; 

    color *= clamp(u_masterOpacity, 0.0, 1.0);

    fragColor = vec4(color, 1.0);
}`;

export const Lens_Ethereal: VisualizerPlugin = {
    id: 'ETHEREAL',
    name: 'Living Nebula',
    renderType: 'WEBGL',
    isLegacy: false,
    defaultConfig: PRESETS[0].config,
    parameters: [
        // GLOBAL MODIFIERS
        { id: 'visualScale', label: 'Visual Scale', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'forceMultiplier', label: 'Force Multiplier', type: 'SLIDER', min: 0.0, max: 5.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'audioReactivity', label: 'Audio Reactivity', type: 'SLIDER', min: 0.0, max: 5.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'masterOpacity', label: 'Master Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 },

        // STANDARD PHYSICS & GEOMETRY
        { id: 'expansion', label: 'Expansion', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'flowSpeed', label: 'Flow Speed', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'complexity', label: 'Complexity', type: 'SLIDER', min: 0.1, max: 3.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'panX', label: 'Pan X', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'panY', label: 'Pan Y', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0 },

        // PSYCHEDELIC WARPING
        { id: 'kaleidoscope', label: 'Kaleidoscope', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0, color: '#f43f5e' },
        { id: 'vortex', label: 'Vortex Spin', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0, color: '#f43f5e' },
        { id: 'singularity', label: 'Singularity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0, color: '#f43f5e' },
        { id: 'aspectBreathing', label: 'Dim. Squeeze', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0, color: '#f43f5e' },
        
        { id: 'zoomVelocity', label: 'Hyperspace', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0, color: '#a855f7' },
        { id: 'lightning', label: 'Lightning Morph', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0, color: '#a855f7' },
        { id: 'roughness', label: 'Roughness', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0, color: '#a855f7' },
        { id: 'turbulence', label: 'Turbulence', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0, color: '#a855f7' },

        // SENSORY & LIGHT
        { id: 'crystallize', label: 'Crystalline', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.0, color: '#3b82f6' },
        { id: 'chromaticSplit', label: 'RGB Glitch', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.0, color: '#3b82f6' },
        { id: 'hueCycle', label: 'Hue Strobe', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.0, color: '#3b82f6' },
        { id: 'saturation', label: 'Saturation', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'LIGHT', defaultValue: 1.0, color: '#3b82f6' },
        { id: 'solarize', label: 'Phase Invert', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.0, color: '#3b82f6' },

        // STANDARD COLOR & TONE
        { id: 'col1', label: 'Void Hue', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.6 },
        { id: 'col2', label: 'Dust Hue', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.55 },
        { id: 'col3', label: 'Core Hue', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.75 },
        { id: 'exposure', label: 'Exposure', type: 'SLIDER', min: 0.1, max: 10.0, step: 0.1, section: 'LIGHT', defaultValue: 2.5 },
        { id: 'gamma', label: 'Gamma', type: 'SLIDER', min: 0.1, max: 4.0, step: 0.1, section: 'LIGHT', defaultValue: 1.2 },
        { id: 'invert', label: 'Invert', type: 'SLIDER', min: 0, max: 1, step: 1, section: 'LIGHT', defaultValue: 0 }
    ],
    presets: PRESETS,
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, time, memory } = context;

        if (!memory.etherealInit || !memory.locTime) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
                return s;
            };

            memory.prog = gl.createProgram()!;
            gl.attachShader(memory.prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.prog);

            memory.etherealVao = gl.createVertexArray();
            gl.bindVertexArray(memory.etherealVao);
            const qBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            
            const posLoc = gl.getAttribLocation(memory.prog, "a_position");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            const getLoc = (name: string) => gl.getUniformLocation(memory.prog, name);
            
            memory.locTime = getLoc("u_time");
            memory.locAspect = getLoc("u_aspect");
            memory.locPan = getLoc("u_pan");
            memory.locCenter = getLoc("u_center");
            
            memory.locVisScale = getLoc("u_visualScale");
            memory.locForceMul = getLoc("u_forceMultiplier");
            memory.locAudReact = getLoc("u_audioReactivity");
            memory.locMastOpac = getLoc("u_masterOpacity");

            memory.locExpansion = getLoc("u_expansion");
            memory.locFlow = getLoc("u_flowSpeed");
            memory.locComplexity = getLoc("u_complexity");

            memory.locKal = getLoc("u_kaleidoscope");
            memory.locVor = getLoc("u_vortex");
            memory.locSing = getLoc("u_singularity");
            memory.locAspBre = getLoc("u_aspectBreathing");
            
            memory.locZoomV = getLoc("u_zoomVelocity");
            memory.locLight = getLoc("u_lightning");
            memory.locRough = getLoc("u_roughness");
            memory.locTurb = getLoc("u_turbulence");

            memory.locChrom = getLoc("u_chromaticSplit");
            memory.locHueCyc = getLoc("u_hueCycle");
            memory.locSat = getLoc("u_saturation");
            memory.locSol = getLoc("u_solarize");
            memory.locCrys = getLoc("u_crystallize");

            memory.locCol1 = getLoc("u_hue1");
            memory.locCol2 = getLoc("u_hue2");
            memory.locCol3 = getLoc("u_hue3");
            memory.locExp = getLoc("u_exposure");
            memory.locGamma = getLoc("u_gamma");
            memory.locInv = getLoc("u_invert");

            memory.etherealInit = true;
        }

        gl.viewport(0, 0, w, h);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.prog);
        gl.bindVertexArray(memory.etherealVao);

        gl.uniform1f(memory.locTime, time);
        gl.uniform1f(memory.locAspect, w / h);
        gl.uniform2f(memory.locPan, getVal(cfg.panX, 0.0), getVal(cfg.panY, 0.0));
        gl.uniform2f(memory.locCenter, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);

        gl.uniform1f(memory.locVisScale, getVal(cfg.visualScale, 1.0) * ((context.visualScale as number) || 1.0));
        gl.uniform1f(memory.locForceMul, getVal(cfg.forceMultiplier, 1.0));
        gl.uniform1f(memory.locAudReact, getVal(cfg.audioReactivity, 1.0));
        gl.uniform1f(memory.locMastOpac, getVal(cfg.masterOpacity, 1.0));

        gl.uniform1f(memory.locExpansion, getVal(cfg.expansion, 0.5));
        gl.uniform1f(memory.locFlow, getVal(cfg.flowSpeed, 0.5));
        gl.uniform1f(memory.locComplexity, getVal(cfg.complexity, 1.0));

        gl.uniform1f(memory.locKal, getVal(cfg.kaleidoscope, 0.0));
        gl.uniform1f(memory.locVor, getVal(cfg.vortex, 0.0));
        gl.uniform1f(memory.locSing, getVal(cfg.singularity, 0.0));
        gl.uniform1f(memory.locAspBre, getVal(cfg.aspectBreathing, 0.0));

        gl.uniform1f(memory.locZoomV, getVal(cfg.zoomVelocity, 0.0));
        gl.uniform1f(memory.locLight, getVal(cfg.lightning, 0.0));
        gl.uniform1f(memory.locRough, getVal(cfg.roughness, 0.0));
        gl.uniform1f(memory.locTurb, getVal(cfg.turbulence, 0.0));

        gl.uniform1f(memory.locChrom, getVal(cfg.chromaticSplit, 0.0));
        gl.uniform1f(memory.locHueCyc, getVal(cfg.hueCycle, 0.0));
        gl.uniform1f(memory.locSat, getVal(cfg.saturation, 1.0));
        gl.uniform1f(memory.locSol, getVal(cfg.solarize, 0.0));
        gl.uniform1f(memory.locCrys, getVal(cfg.crystallize, 0.0));

        let h1 = getVal(cfg.col1, 0.6);
        let h2 = getVal(cfg.col2, 0.55);
        let h3 = getVal(cfg.col3, 0.75);

        if (context.amplitudes && context.amplitudes.size > 0) {
            const activeEntries: { freq: number, amp: number }[] = [];
            for (const [key, val] of context.amplitudes.entries()) {
                if (val > 0.001) {
                    const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                    const freq = !isNaN(freqNum) && freqNum > 0 ? freqNum : LATTICE_CHANNELS.find(c => c.id === key)?.freq;
                    if (freq) activeEntries.push({ freq, amp: val });
                }
            }
            if (activeEntries.length > 0) {
                activeEntries.sort((a, b) => b.amp - a.amp);
                const react = getVal(cfg.audioReactivity, 1.0);
                const blend = Math.min(0.85, activeEntries[0].amp * react);
                const domHue = getFrequencyHSL(activeEntries[0].freq).h;
                h1 = (h1 * (1 - blend) + domHue * blend) % 1.0;
                if (activeEntries.length > 1) {
                    const secHue = getFrequencyHSL(activeEntries[1].freq).h;
                    h2 = (h2 * (1 - blend) + secHue * blend) % 1.0;
                }
                if (activeEntries.length > 2) {
                    const tertHue = getFrequencyHSL(activeEntries[2].freq).h;
                    h3 = (h3 * (1 - blend) + tertHue * blend) % 1.0;
                }
            }
        }

        gl.uniform1f(memory.locCol1, h1);
        gl.uniform1f(memory.locCol2, h2);
        gl.uniform1f(memory.locCol3, h3);
        gl.uniform1f(memory.locExp, getVal(cfg.exposure, 2.5));
        gl.uniform1f(memory.locGamma, getVal(cfg.gamma, 1.2));
        gl.uniform1f(memory.locInv, getVal(cfg.invert, 0));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.prog) gl.deleteProgram(memory.prog as WebGLProgram);
            if (memory.etherealVao) gl.deleteVertexArray(memory.etherealVao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};