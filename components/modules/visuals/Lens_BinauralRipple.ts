import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, UNIVERSAL_CHANNELS, getFrequencyHSL } from './shared';

const getVal = (v: unknown, f: number) => isNaN(parseFloat(v as string)) ? f : parseFloat(v as string);
const getStr = (v: unknown, f: string) => typeof v === 'string' ? v : f;
const hex2rgb = (hex: string) => {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
        const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
        const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
        return [r, g, b];
    }
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
    return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
};

const PRESETS: VisualizerPreset[] = [
    {
        id: 'kaleido_bioluminescent',
        name: '01. Bioluminescent Lotus',
        config: { 
            frequency: 10.0, waveSpeed: 0.6, masterOpacity: 1.0,
            colorMode: 'Custom', color1: '#00f5d4', color2: '#7928ca', color3: '#4361ee', bgColor: '#02040a',
            glowIntensity: 1.6, saturation: 1.35, symmetry: 8, ringCount: 12.0, vortexSpin: 0.4,
            audioReactivity: 1.2
        },
        modulations: {
            frequency: { enabled: true, min: 6.0, max: 18.0, amtBreath: 0.6, mixMode: 'ADD' },
            glowIntensity: { enabled: true, min: 1.0, max: 2.4, amtBinaural: 0.8, mixMode: 'ADD' }
        }
    },
    {
        id: 'kaleido_celestial_gold',
        name: '02. Solar Mandala',
        config: { 
            frequency: 12.0, waveSpeed: 0.5, masterOpacity: 1.0,
            colorMode: 'Custom', color1: '#ffb703', color2: '#fb5607', color3: '#ff006e', bgColor: '#0a0206',
            glowIntensity: 1.8, saturation: 1.4, symmetry: 12, ringCount: 16.0, vortexSpin: 0.25,
            audioReactivity: 1.4
        },
        modulations: {
            ringCount: { enabled: true, min: 8.0, max: 24.0, amtBreath: 1.0, mixMode: 'ADD' },
            waveSpeed: { enabled: true, min: 0.2, max: 1.2, amtBinaural: 0.8, mixMode: 'ADD' }
        }
    },
    {
        id: 'kaleido_harmonic_prism',
        name: '03. Harmonic Prism',
        config: { 
            frequency: 8.0, waveSpeed: 0.7, masterOpacity: 1.0,
            colorMode: 'Harmonic', color1: '#38bdf8', color2: '#a855f7', color3: '#ec4899', bgColor: '#020617',
            glowIntensity: 1.5, saturation: 1.3, symmetry: 6, ringCount: 10.0, vortexSpin: 0.5,
            audioReactivity: 1.5
        },
        modulations: {
            frequency: { enabled: true, min: 4.0, max: 16.0, amtBreath: 0.8, mixMode: 'ADD' },
            glowIntensity: { enabled: true, min: 1.1, max: 2.2, amtBinaural: 0.9, mixMode: 'ADD' }
        }
    },
    {
        id: 'kaleido_emerald_sanctuary',
        name: '04. Emerald Sanctuary',
        config: { 
            frequency: 9.0, waveSpeed: 0.45, masterOpacity: 1.0,
            colorMode: 'Custom', color1: '#10b981', color2: '#06b6d4', color3: '#3b82f6', bgColor: '#010f0b',
            glowIntensity: 1.7, saturation: 1.3, symmetry: 10, ringCount: 14.0, vortexSpin: -0.3,
            audioReactivity: 1.1
        },
        modulations: {
            vortexSpin: { enabled: true, min: -0.8, max: 0.8, amtBreath: 0.7, mixMode: 'ADD' },
            glowIntensity: { enabled: true, min: 1.2, max: 2.5, amtBinaural: 1.0, mixMode: 'ADD' }
        }
    },
    {
        id: 'kaleido_deep_aurora',
        name: '05. Astral Rose',
        config: { 
            frequency: 7.0, waveSpeed: 0.4, masterOpacity: 1.0,
            colorMode: 'Custom', color1: '#f43f5e', color2: '#8b5cf6', color3: '#06b6d4', bgColor: '#06020c',
            glowIntensity: 2.0, saturation: 1.45, symmetry: 16, ringCount: 18.0, vortexSpin: 0.2,
            audioReactivity: 1.3
        },
        modulations: {
            frequency: { enabled: true, min: 5.0, max: 14.0, amtBreath: 0.9, mixMode: 'ADD' },
            ringCount: { enabled: true, min: 10.0, max: 26.0, amtBreath: 1.2, mixMode: 'ADD' }
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
out vec4 fragColor;

uniform float u_time;
uniform float u_aspect;
uniform vec2 u_center;
uniform float u_frequency;
uniform float u_speed;
uniform float u_opacity;

uniform float u_symmetry;
uniform float u_ringCount;
uniform float u_vortexSpin;
uniform float u_audioReactivity;
uniform float u_audioTotal;

uniform int u_colorMode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_bgColor;
uniform float u_glowIntensity;
uniform float u_saturation;
uniform float u_visualScale;

uniform float u_amps[7];
uniform float u_hues[7];

#define PI 3.14159265358979323846

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 adjustSaturation(vec3 color, float sat) {
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luminance), color, sat);
}

void main() {
    // Exact interface grid mandala center alignment
    vec2 p = v_uv - u_center;
    p.x *= u_aspect;
    
    float r = length(p) / max(0.01, u_visualScale);
    float a = atan(p.y, p.x);
    
    // Smooth kaleidoscope angular fold
    float sym = max(2.0, u_symmetry);
    float sector = (2.0 * PI) / sym;
    float modAngle = mod(a + PI, sector) - (sector * 0.5);
    float foldedAngle = abs(modAngle);
    
    // Gentle hypnotic rotation driven by time and vortex spin
    float spin = u_time * u_vortexSpin * 0.2;
    foldedAngle += spin;
    
    float scaledR = r;
    
    // Tone audio reactivity: each harmonic tone modulates concentric harmonic wave modes
    float toneWave = 0.0;
    toneWave += sin(scaledR * (u_frequency * 1.0) - u_time * u_speed * 1.5 + foldedAngle * 2.0) * (0.35 + u_amps[0] * 1.2);
    toneWave += sin(scaledR * (u_frequency * 1.5) - u_time * u_speed * 1.2 - foldedAngle * 3.0) * (0.25 + u_amps[1] * 1.0);
    toneWave += sin(scaledR * (u_frequency * 2.2) - u_time * u_speed * 1.8 + foldedAngle * 4.0) * (0.20 + u_amps[2] * 0.9);
    toneWave += sin(scaledR * (u_frequency * 3.0) - u_time * u_speed * 2.0 - foldedAngle * 5.0) * (0.15 + u_amps[3] * 0.8);
    toneWave += sin(scaledR * (u_frequency * 4.2) - u_time * u_speed * 2.4 + foldedAngle * 6.0) * (0.12 + (u_amps[4] + u_amps[5] + u_amps[6]) * 0.7);

    // Audio swell
    float audioBoost = u_audioTotal * u_audioReactivity;
    toneWave *= (1.0 + audioBoost * 0.8);

    // Concentric interference rings with smooth harmonic ripples
    float ringFreq = u_ringCount + audioBoost * 4.0;
    float rings = sin(scaledR * ringFreq - u_time * u_speed * 2.0 + toneWave * 1.2);
    
    // Silky smooth field value without harsh high-frequency noise or jitter
    float pattern = rings * 0.5 + toneWave * 0.5;
    
    // Harmonic color computation
    vec3 c1 = u_color1;
    vec3 c2 = u_color2;
    vec3 c3 = u_color3;
    
    if (u_colorMode == 0) { // Harmonic spectrum from active audio tones
        float totalAmp = 0.001;
        vec3 mColor = vec3(0.0);
        for(int i=0; i<7; i++) {
            mColor += hsv2rgb(vec3(u_hues[i], 0.85, 1.0)) * (u_amps[i] + 0.1);
            totalAmp += (u_amps[i] + 0.1);
        }
        mColor /= totalAmp;
        c1 = mColor;
        c2 = hsv2rgb(vec3(fract(u_hues[2] + 0.2), 0.8, 1.0));
        c3 = hsv2rgb(vec3(fract(u_hues[5] + 0.3), 0.9, 1.0));
    }
    
    // Multi-color harmonic gradient mapping across mandala petals & rings
    float t1 = smoothstep(-1.0, 1.0, pattern);
    float t2 = smoothstep(0.0, 1.2, scaledR * 1.5 + sin(foldedAngle * 3.0) * 0.2);
    
    vec3 color = mix(c1, c2, t1);
    color = mix(color, c3, t2 * 0.7);
    
    // Delicate glowing ridges and luminous central jewel
    float ridgeGlow = pow(clamp(pattern * 0.5 + 0.5, 0.0, 1.0), 3.0) * 1.4;
    float centerJewel = exp(-scaledR * 4.0) * (1.8 + audioBoost * 2.0);
    
    color += (c1 * 0.6 + c2 * 0.4) * ridgeGlow * u_glowIntensity;
    color += (vec3(1.0) * 0.4 + c1 * 0.6) * centerJewel * u_glowIntensity;
    
    // Soft outer radial vignette so mandala floats serenely in space
    float vignette = smoothstep(1.5, 0.25, r);
    color *= vignette;
    
    // Saturation and deep background blend
    color = adjustSaturation(color, u_saturation + audioBoost * 0.3);
    color = mix(u_bgColor, color, smoothstep(0.0, 0.85, length(color) + centerJewel * 0.5));
    
    // Subtle ambient glow
    color += c1 * 0.04 * u_glowIntensity;

    fragColor = vec4(color, u_opacity);
}`;

export const Lens_BinauralRipple: VisualizerPlugin = {
    id: 'BINAURAL_RIPPLE',
    name: 'Binaural Ripple',
    renderType: 'WEBGL',
    defaultConfig: {
        frequency: 10.0, waveSpeed: 0.6, masterOpacity: 1.0,
        colorMode: 'Custom', color1: '#00f5d4', color2: '#7928ca', color3: '#4361ee', bgColor: '#02040a',
        glowIntensity: 1.6, saturation: 1.35, symmetry: 8, ringCount: 12.0, vortexSpin: 0.4,
        audioReactivity: 1.2
    },
    parameters: [
        { id: 'symmetry', label: 'Mandala Symmetry', type: 'SLIDER', min: 2.0, max: 24.0, step: 1.0, section: 'GEOMETRY', defaultValue: 8 },
        { id: 'ringCount', label: 'Concentric Rings', type: 'SLIDER', min: 4.0, max: 32.0, step: 0.5, section: 'GEOMETRY', defaultValue: 12.0 },
        { id: 'vortexSpin', label: 'Gentle Rotation', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.4 },

        { id: 'frequency', label: 'Wave Harmonics', type: 'SLIDER', min: 2.0, max: 30.0, step: 0.1, section: 'WAVES', defaultValue: 10.0 },
        { id: 'waveSpeed', label: 'Wave Flow Speed', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'WAVES', defaultValue: 0.6 },
        
        { id: 'audioReactivity', label: 'Tone Audio Reactivity', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.05, section: 'PHYSICS', defaultValue: 1.2 },

        { id: 'glowIntensity', label: 'Luminous Glow', type: 'SLIDER', min: 0.0, max: 4.0, step: 0.05, section: 'LIGHT', defaultValue: 1.6 },
        { id: 'saturation', label: 'Color Saturation', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.05, section: 'COLOR', defaultValue: 1.35 },

        { id: 'colorMode', label: 'Color Mode', type: 'SELECT', options: ['Harmonic', 'Custom'], section: 'COLOR', defaultValue: 'Custom' },
        { id: 'color1', label: 'Primary Petal Color', type: 'COLOR', section: 'COLOR', defaultValue: '#00f5d4' },
        { id: 'color2', label: 'Secondary Petal Color', type: 'COLOR', section: 'COLOR', defaultValue: '#7928ca' },
        { id: 'color3', label: 'Outer Glow Color', type: 'COLOR', section: 'COLOR', defaultValue: '#4361ee' },
        { id: 'bgColor', label: 'Background Color', type: 'COLOR', section: 'COLOR', defaultValue: '#02040a' },

        { id: 'masterOpacity', label: 'Master Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 }
    ],
    presets: PRESETS,
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, dt, memory, amplitudes, cx, cy } = context;

        if (!memory.br_init) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
                return s;
            };

            memory.br_prog = gl.createProgram()!;
            gl.attachShader(memory.br_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.br_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.br_prog);

            memory.br_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.br_vao);
            const qBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            
            const posLoc = gl.getAttribLocation(memory.br_prog, "a_position");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            const getLoc = (name: string) => gl.getUniformLocation(memory.br_prog, name);
            memory.br_locs = {
                time: getLoc("u_time"),
                aspect: getLoc("u_aspect"),
                center: getLoc("u_center"),
                frequency: getLoc("u_frequency"),
                speed: getLoc("u_speed"),
                opacity: getLoc("u_opacity"),
                symmetry: getLoc("u_symmetry"),
                ringCount: getLoc("u_ringCount"),
                vortexSpin: getLoc("u_vortexSpin"),
                audioReactivity: getLoc("u_audioReactivity"),
                audioTotal: getLoc("u_audioTotal"),
                colorMode: getLoc("u_colorMode"),
                color1: getLoc("u_color1"),
                color2: getLoc("u_color2"),
                color3: getLoc("u_color3"),
                bgColor: getLoc("u_bgColor"),
                glowIntensity: getLoc("u_glowIntensity"),
                saturation: getLoc("u_saturation"),
                visualScale: getLoc("u_visualScale"),
                amps: getLoc("u_amps"),
                hues: getLoc("u_hues")
            };
            memory.br_time = 0;
            memory.br_smoothAudio = 0.0;
            memory.br_init = true;
        }

        memory.br_time += dt || 0.016;

        const amps = [0, 0, 0, 0, 0, 0, 0];
        const hues = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 7; i++) {
            hues[i] = getFrequencyHSL(UNIVERSAL_CHANNELS[i].freq).h;
        }
        let totalAmp = 0;
        if (amplitudes) {
            const activeEntries: { freq: number; amp: number }[] = [];
            for (const [key, val] of amplitudes.entries()) {
                if (val > 0.001) {
                    const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                    activeEntries.push({
                        freq: !isNaN(freqNum) && freqNum > 0 ? freqNum : 432,
                        amp: val
                    });
                    totalAmp += val;
                }
            }
            activeEntries.sort((a, b) => b.amp - a.amp);
            for (let i = 0; i < Math.min(7, activeEntries.length); i++) {
                amps[i] = activeEntries[i].amp;
                hues[i] = getFrequencyHSL(activeEntries[i].freq).h;
            }
        }
        memory.br_smoothAudio += (totalAmp - memory.br_smoothAudio) * Math.min(1.0, (dt || 0.016) * 6.0);

        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        const bg = hex2rgb(getStr(cfg.bgColor, '#02040a'));
        gl.clearColor(bg[0], bg[1], bg[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.br_prog);
        gl.bindVertexArray(memory.br_vao);

        gl.uniform1f(memory.br_locs.time, memory.br_time);
        gl.uniform1f(memory.br_locs.aspect, w / h);
        
        // Exact interface grid mandala center point (normalized NDC)
        const centerX = typeof cx === 'number' ? (cx / w) * 2.0 - 1.0 : 0.0;
        const centerY = typeof cy === 'number' ? 1.0 - (cy / h) * 2.0 : 0.0;
        gl.uniform2f(memory.br_locs.center, centerX, centerY);
        
        gl.uniform1f(memory.br_locs.frequency, getVal(cfg.frequency, 10.0));
        gl.uniform1f(memory.br_locs.speed, getVal(cfg.waveSpeed, 0.6));
        gl.uniform1f(memory.br_locs.opacity, getVal(cfg.masterOpacity, 1.0));
        
        gl.uniform1f(memory.br_locs.symmetry, Math.round(getVal(cfg.symmetry, 8)));
        gl.uniform1f(memory.br_locs.ringCount, getVal(cfg.ringCount, 12.0));
        gl.uniform1f(memory.br_locs.vortexSpin, getVal(cfg.vortexSpin, 0.4));
        gl.uniform1f(memory.br_locs.audioReactivity, getVal(cfg.audioReactivity, 1.2));
        
        gl.uniform1f(memory.br_locs.audioTotal, memory.br_smoothAudio);
        
        const cMode = getStr(cfg.colorMode, 'Custom') === 'Harmonic' ? 0 : 1;
        gl.uniform1i(memory.br_locs.colorMode, cMode);
        
        const c1 = hex2rgb(getStr(cfg.color1, '#00f5d4'));
        const c2 = hex2rgb(getStr(cfg.color2, '#7928ca'));
        const c3 = hex2rgb(getStr(cfg.color3, '#4361ee'));
        gl.uniform3f(memory.br_locs.color1, c1[0], c1[1], c1[2]);
        gl.uniform3f(memory.br_locs.color2, c2[0], c2[1], c2[2]);
        gl.uniform3f(memory.br_locs.color3, c3[0], c3[1], c3[2]);
        gl.uniform3f(memory.br_locs.bgColor, bg[0], bg[1], bg[2]);
        
        gl.uniform1f(memory.br_locs.glowIntensity, getVal(cfg.glowIntensity, 1.6));
        gl.uniform1f(memory.br_locs.saturation, getVal(cfg.saturation, 1.35));
        gl.uniform1f(memory.br_locs.visualScale, (context.visualScale as number) || 1.0);
        
        gl.uniform1fv(memory.br_locs.amps, amps);
        gl.uniform1fv(memory.br_locs.hues, hues);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.br_prog) gl.deleteProgram(memory.br_prog as WebGLProgram);
            if (memory.br_vao) gl.deleteVertexArray(memory.br_vao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
