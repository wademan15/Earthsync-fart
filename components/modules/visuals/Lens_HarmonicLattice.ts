import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, UNIVERSAL_CHANNELS, getFrequencyHSL } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const getVal = (v: unknown, f: number) => isNaN(parseFloat(v as string)) ? f : parseFloat(v as string);
const getStr = (v: unknown, f: string) => typeof v === 'string' ? v : f;
const hex2rgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
};

const PRESETS: VisualizerPreset[] = [
    {
        id: 'lattice_1',
        name: '01. Constructive Interference',
        config: { 
            scale: 5.0, waveSpeed: 1.0, interference: 0.5, audioReactivity: 1.0, masterOpacity: 1.0,
            colorMode: 'Harmonic (Merrick)', color1: '#14b8a6', color2: '#f43f5e', bgColor: '#000000',
            glowIntensity: 1.0
        },
        modulations: {}
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
uniform float u_amps[7];
uniform float u_hues[7];
uniform float u_scale;
uniform float u_speed;
uniform float u_interference;
uniform float u_opacity;
uniform float u_kaleidoscope;
uniform float u_crystalline;

uniform int u_colorMode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bgColor;
uniform float u_glowIntensity;

${KALEIDOSCOPE_GLSL_FUNCS}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

float map(vec3 p) {
    vec3 q = fract(p * u_scale) - 0.5;
    float d = length(q) - 0.1;
    
    // Interference waves driven by individual amplitude bins
    float wave1 = sin(p.x * 4.0 + u_time * u_speed) * sin(p.y * 4.0 + u_time * u_speed) * (1.0 + u_amps[0] * 2.0);
    float wave2 = cos(p.z * 4.0 - u_time * u_speed) * cos(p.x * 4.0 - u_time * u_speed) * (1.0 + u_amps[1] * 2.0);
    float wave3 = sin(p.y * 4.0 + u_time * u_speed * 1.5) * cos(p.z * 4.0 - u_time * u_speed * 1.5) * (1.0 + u_amps[2] * 2.0);
    
    d += (wave1 + wave2 + wave3) * u_interference * 0.1;
    return d / u_scale;
}

vec3 calcNormal(vec3 p) {
    const float h = 0.001;
    const vec2 k = vec2(1, -1);
    return normalize(k.xyy * map(p + k.xyy * h) +
                     k.yyx * map(p + k.yyx * h) +
                     k.yxy * map(p + k.yxy * h) +
                     k.xxx * map(p + k.xxx * h));
}

void main() {
    vec2 uv = v_uv;
    uv -= u_center;
    uv.x *= u_aspect;
    
    if (u_kaleidoscope > 1.5) {
        uv = applyKaleidoscopeFold(uv, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        uv = applyCrystallineLayer(uv, u_crystalline);
    }
    
    vec3 ro = vec3(u_time * 0.2, u_time * 0.1, u_time * 0.3);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    rd.xy *= rot(u_time * 0.1);
    rd.xz *= rot(u_time * 0.05);
    
    float d0 = 0.0;
    vec3 p;
    for(int i = 0; i < 64; i++) {
        p = ro + rd * d0;
        float d = map(p);
        if(abs(d) < 0.001 || d0 > 20.0) break;
        d0 += d;
    }
    
    vec3 col = vec3(0.0);
    
    vec3 merrickColor = vec3(0.0);
    if (u_colorMode == 0) {
        float totalAmp = 0.001;
        for(int i=0; i<7; i++) {
            merrickColor += hsv2rgb(vec3(u_hues[i], 0.8, 1.0)) * u_amps[i];
            totalAmp += u_amps[i];
        }
        merrickColor /= totalAmp;
        if (totalAmp < 0.01) merrickColor = vec3(0.2, 0.4, 0.8);
    }

    if(d0 < 20.0) {
        vec3 n = calcNormal(p);
        vec3 light = normalize(vec3(1.0, 2.0, -1.0));
        float diff = max(dot(n, light), 0.0);
        float amb = 0.2;
        
        // Color based on position in lattice
        vec3 baseCol;
        if (u_colorMode == 0) {
            baseCol = merrickColor * (0.5 + 0.5 * cos(u_time + p.xyz * 2.0));
        } else {
            baseCol = mix(u_color1, u_color2, sin(p.x * 2.0 + u_time) * 0.5 + 0.5);
        }
        col = baseCol * (diff + amb);
        
        // Fog
        col = mix(col, u_bgColor, 1.0 - exp(-0.1 * d0));
    } else {
        col = u_bgColor;
    }
    
    // Audio glow from higher frequencies
    float highFreqGlow = (u_amps[3] + u_amps[4] + u_amps[5] + u_amps[6]) * 0.25;
    vec3 glowCol = u_colorMode == 0 ? merrickColor : u_color2;
    col += glowCol * highFreqGlow * 3.0 * exp(-d0 * 0.1) * u_glowIntensity;
    
    fragColor = vec4(col, u_opacity);
}`;

export const Lens_HarmonicLattice: VisualizerPlugin = {
    id: 'HARMONIC_LATTICE',
    name: 'Harmonic Lattice',
    renderType: 'WEBGL',
    defaultConfig: {
        scale: 5.0, waveSpeed: 1.0, interference: 0.5, audioReactivity: 1.0, masterOpacity: 1.0,
        colorMode: 'Harmonic (Merrick)', color1: '#14b8a6', color2: '#f43f5e', bgColor: '#000000',
        glowIntensity: 1.0, kaleidoscope: 0, crystallineLayer: 0
    },
    parameters: [
        { id: 'scale', label: 'Lattice Scale', type: 'SLIDER', min: 1.0, max: 10.0, step: 0.1, section: 'GEOMETRY', defaultValue: 5.0 },
        { id: 'waveSpeed', label: 'Wave Speed', type: 'SLIDER', min: 0.0, max: 5.0, step: 0.1, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'interference', label: 'Interference Amp', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'WAVES', defaultValue: 0.5 },
        { id: 'audioReactivity', label: 'Audio Reactivity', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'glowIntensity', label: 'Glow Intensity', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'LIGHT', defaultValue: 1.0 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Compass', type: 'SLIDER', min: 0, max: 24, step: 2, color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'colorMode', label: 'Color Mode', type: 'SELECT', options: ['Harmonic (Merrick)', 'Custom'], section: 'COLOR', defaultValue: 'Harmonic (Merrick)' },
        { id: 'color1', label: 'Primary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#14b8a6' },
        { id: 'color2', label: 'Secondary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#f43f5e' },
        { id: 'bgColor', label: 'Background Color', type: 'COLOR', section: 'COLOR', defaultValue: '#000000' },
        { id: 'masterOpacity', label: 'Master Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 }
    ],
    presets: PRESETS,
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, dt, memory, amplitudes } = context;

        if (!memory.hl_init) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
                return s;
            };

            memory.hl_prog = gl.createProgram()!;
            gl.attachShader(memory.hl_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.hl_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.hl_prog);

            memory.hl_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.hl_vao);
            const qBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            
            const posLoc = gl.getAttribLocation(memory.hl_prog, "a_position");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            const getLoc = (name: string) => gl.getUniformLocation(memory.hl_prog, name);
            memory.hl_locs = {
                time: getLoc("u_time"),
                aspect: getLoc("u_aspect"),
                center: getLoc("u_center"),
                amps: getLoc("u_amps"),
                hues: getLoc("u_hues"),
                scale: getLoc("u_scale"),
                speed: getLoc("u_speed"),
                interference: getLoc("u_interference"),
                opacity: getLoc("u_opacity"),
                colorMode: getLoc("u_colorMode"),
                color1: getLoc("u_color1"),
                color2: getLoc("u_color2"),
                bgColor: getLoc("u_bgColor"),
                glowIntensity: getLoc("u_glowIntensity"),
                kaleidoscope: getLoc("u_kaleidoscope"),
                crystalline: getLoc("u_crystalline")
            };
            memory.hl_time = 0;
            memory.hl_init = true;
        }

        let audioSum = 0;
        if (amplitudes) amplitudes.forEach(val => audioSum += val);
        const react = getVal(cfg.audioReactivity, 1.0) * audioSum;
        
        memory.hl_time += (dt || 0.016) * (1.0 + react * 0.1);

        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        const bg = hex2rgb(getStr(cfg.bgColor, '#000000'));
        gl.clearColor(bg[0], bg[1], bg[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.hl_prog);
        gl.bindVertexArray(memory.hl_vao);

        const ampsArray = new Float32Array(7);
        const huesArray = new Float32Array(7);
        for (let i = 0; i < 7; i++) {
            huesArray[i] = getFrequencyHSL(UNIVERSAL_CHANNELS[i].freq).h;
        }
        if (amplitudes) {
            const activeEntries: { freq: number; amp: number }[] = [];
            for (const [key, val] of amplitudes.entries()) {
                if (val > 0.001) {
                    const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                    activeEntries.push({ freq: !isNaN(freqNum) && freqNum > 0 ? freqNum : 432, amp: val });
                }
            }
            activeEntries.sort((a, b) => b.amp - a.amp);
            for (let i = 0; i < Math.min(7, activeEntries.length); i++) {
                ampsArray[i] = activeEntries[i].amp * react;
                huesArray[i] = getFrequencyHSL(activeEntries[i].freq).h;
            }
        }
        const userZoom = Math.max(0.1, (context.visualScale as number) || 1.0);
        gl.uniform1fv(memory.hl_locs.hues, huesArray);
        gl.uniform1f(memory.hl_locs.time, memory.hl_time);
        gl.uniform1f(memory.hl_locs.aspect, w / h);
        gl.uniform2f(memory.hl_locs.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
        gl.uniform1fv(memory.hl_locs.amps, ampsArray);
        gl.uniform1f(memory.hl_locs.scale, getVal(cfg.scale, 5.0) / userZoom);
        gl.uniform1f(memory.hl_locs.speed, getVal(cfg.waveSpeed, 1.0));
        gl.uniform1f(memory.hl_locs.interference, getVal(cfg.interference, 0.5));
        gl.uniform1f(memory.hl_locs.opacity, getVal(cfg.masterOpacity, 1.0));
        
        const cMode = getStr(cfg.colorMode, 'Harmonic (Merrick)') === 'Harmonic (Merrick)' ? 0 : 1;
        gl.uniform1i(memory.hl_locs.colorMode, cMode);
        
        const c1 = hex2rgb(getStr(cfg.color1, '#14b8a6'));
        const c2 = hex2rgb(getStr(cfg.color2, '#f43f5e'));
        gl.uniform3f(memory.hl_locs.color1, c1[0], c1[1], c1[2]);
        gl.uniform3f(memory.hl_locs.color2, c2[0], c2[1], c2[2]);
        gl.uniform3f(memory.hl_locs.bgColor, bg[0], bg[1], bg[2]);
        
        gl.uniform1f(memory.hl_locs.glowIntensity, getVal(cfg.glowIntensity, 1.0));
        gl.uniform1f(memory.hl_locs.kaleidoscope, getVal(cfg.kaleidoscope, 0.0));
        gl.uniform1f(memory.hl_locs.crystalline, getVal(cfg.crystallineLayer, 0.0));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.hl_prog) gl.deleteProgram(memory.hl_prog as WebGLProgram);
            if (memory.hl_vao) gl.deleteVertexArray(memory.hl_vao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
