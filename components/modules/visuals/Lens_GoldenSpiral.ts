import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, UNIVERSAL_CHANNELS, LATTICE_CHANNELS, getFrequencyHSL } from './shared';
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
        id: 'golden_1',
        name: '01. Phi Vortex',
        config: { 
            points: 10000, spread: 5.0, rotationSpeed: 0.5, audioReactivity: 1.0, masterOpacity: 1.0,
            colorMode: 'Harmonic', color1: '#ff0055', color2: '#00eeff', bgColor: '#000000'
        },
        modulations: {
            spread: { enabled: true, min: 2.0, max: 10.0, amtBreath: 1.0, mixMode: 'ADD' }
        }
    }
];

const VS = `#version 300 es
in float a_index;

uniform float u_time;
uniform float u_aspect;
uniform vec2 u_center;
uniform float u_points;
uniform float u_spread;
uniform float u_speed;
uniform float u_amps[7];
uniform float u_hues[7];
uniform float u_reactivity;

uniform int u_colorMode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_kaleidoscope;
uniform float u_crystalline;

out vec3 v_color;
out float v_amp;

#define PHI 2.39996322972865332

${KALEIDOSCOPE_GLSL_FUNCS}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float n = a_index;
    
    // Map index to a frequency bin (0-6)
    int bin = int(mod(n, 7.0));
    float amp = 0.0;
    if (bin == 0) amp = u_amps[0];
    else if (bin == 1) amp = u_amps[1];
    else if (bin == 2) amp = u_amps[2];
    else if (bin == 3) amp = u_amps[3];
    else if (bin == 4) amp = u_amps[4];
    else if (bin == 5) amp = u_amps[5];
    else if (bin == 6) amp = u_amps[6];
    
    float r = u_spread * sqrt(n) * (1.0 + amp * u_reactivity * 0.5);
    float theta = n * PHI + u_time * u_speed;
    
    // Convert polar to cartesian
    vec2 pos = vec2(cos(theta), sin(theta)) * r;

    // Apply kaleidoscope and crystalline reflections
    if (u_kaleidoscope > 1.5) {
        pos = applyKaleidoscopeFold(pos, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        pos = applyCrystallineLayer(pos, u_crystalline);
    }
    
    // Normalize to screen space
    float maxR = u_spread * sqrt(u_points);
    pos /= maxR;
    
    pos += u_center;
    
    // Fix aspect ratio
    pos.x /= u_aspect;
    
    gl_Position = vec4(pos, 0.0, 1.0);
    
    // Point size
    gl_PointSize = 2.0 + amp * u_reactivity * 10.0;
    
    // Color
    if (u_colorMode == 0) {
        // Harmonic spectrum from active color wheel
        float merrickHue = u_hues[bin];
        v_color = hsv2rgb(vec3(merrickHue, 0.8, 0.6 + amp * 0.4));
    } else {
        // Custom
        float mixVal = fract(n * 0.001 + u_time * 0.1);
        v_color = mix(u_color1, u_color2, mixVal) * (0.6 + amp * 0.4);
    }
    
    v_amp = amp;
}`;

const FS = `#version 300 es
precision highp float;

in vec3 v_color;
in float v_amp;
out vec4 fragColor;

uniform float u_opacity;

void main() {
    // Make points circular
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = smoothstep(0.5, 0.3, dist);
    
    fragColor = vec4(v_color, alpha * u_opacity * (0.5 + v_amp * 0.5));
}`;

export const Lens_GoldenSpiral: VisualizerPlugin = {
    id: 'GOLDEN_SPIRAL',
    name: 'Golden Spiral',
    renderType: 'WEBGL',
    defaultConfig: {
        points: 10000, spread: 5.0, rotationSpeed: 0.5, audioReactivity: 1.0, masterOpacity: 1.0,
        colorMode: 'Harmonic', color1: '#ff0055', color2: '#00eeff', bgColor: '#000000',
        kaleidoscope: 0, crystallineLayer: 0
    },
    parameters: [
        { id: 'points', label: 'Node Count', type: 'SLIDER', min: 1000, max: 100000, step: 1000, section: 'GEOMETRY', defaultValue: 10000 },
        { id: 'spread', label: 'Spiral Spread', type: 'SLIDER', min: 1.0, max: 20.0, step: 0.1, section: 'GEOMETRY', defaultValue: 5.0 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Compass', type: 'SLIDER', min: 0, max: 24, step: 2, color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'rotationSpeed', label: 'Rotation Speed', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'audioReactivity', label: 'Audio Reactivity', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'colorMode', label: 'Color Mode', type: 'SELECT', options: ['Harmonic', 'Custom'], section: 'COLOR', defaultValue: 'Harmonic' },
        { id: 'color1', label: 'Primary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#ff0055' },
        { id: 'color2', label: 'Secondary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#00eeff' },
        { id: 'bgColor', label: 'Background Color', type: 'COLOR', section: 'COLOR', defaultValue: '#000000' },
        { id: 'masterOpacity', label: 'Master Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 }
    ],
    presets: PRESETS,
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, time, memory, amplitudes } = context;

        const qualityMult = memory.qualityMultiplier as number ?? 1.0;
        const numPoints = Math.max(100, Math.floor(getVal(cfg.points, 10000) * qualityMult));

        if (!memory.gs_init || memory.gs_points !== numPoints) {
            if (!memory.gs_prog) {
                const compile = (type: number, src: string) => {
                    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
                    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                        console.error(gl.getShaderInfoLog(s));
                    }
                    return s;
                };

                memory.gs_prog = gl.createProgram()!;
                gl.attachShader(memory.gs_prog, compile(gl.VERTEX_SHADER, VS));
                gl.attachShader(memory.gs_prog, compile(gl.FRAGMENT_SHADER, FS));
                gl.linkProgram(memory.gs_prog);

                const getLoc = (name: string) => gl.getUniformLocation(memory.gs_prog, name);
                memory.gs_locs = {
                    time: getLoc("u_time"),
                    aspect: getLoc("u_aspect"),
                    center: getLoc("u_center"),
                    points: getLoc("u_points"),
                    spread: getLoc("u_spread"),
                    speed: getLoc("u_speed"),
                    amps: getLoc("u_amps"),
                    hues: getLoc("u_hues"),
                    reactivity: getLoc("u_reactivity"),
                    opacity: getLoc("u_opacity"),
                    colorMode: getLoc("u_colorMode"),
                    color1: getLoc("u_color1"),
                    color2: getLoc("u_color2"),
                    kaleidoscope: getLoc("u_kaleidoscope"),
                    crystalline: getLoc("u_crystalline")
                };
            }

            if (memory.gs_vao) gl.deleteVertexArray(memory.gs_vao);
            if (memory.gs_buf) gl.deleteBuffer(memory.gs_buf);

            memory.gs_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.gs_vao);
            
            memory.gs_buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.gs_buf);
            
            const indices = new Float32Array(numPoints);
            for (let i = 0; i < numPoints; i++) indices[i] = i;
            gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            
            const posLoc = gl.getAttribLocation(memory.gs_prog, "a_index");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 1, gl.FLOAT, false, 0, 0);

            memory.gs_points = numPoints;
            memory.gs_init = true;
        }

        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending
        
        const bg = hex2rgb(getStr(cfg.bgColor, '#000000'));
        gl.clearColor(bg[0], bg[1], bg[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.gs_prog);
        gl.bindVertexArray(memory.gs_vao);

        const react = getVal(cfg.audioReactivity, 1.0);
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
                    const freq = !isNaN(freqNum) && freqNum > 0 ? freqNum : LATTICE_CHANNELS.find(c => c.id === key)?.freq;
                    if (freq) activeEntries.push({ freq, amp: val });
                }
            }
            activeEntries.sort((a, b) => b.amp - a.amp);
            for (let i = 0; i < Math.min(7, activeEntries.length); i++) {
                ampsArray[i] = activeEntries[i].amp;
                huesArray[i] = getFrequencyHSL(activeEntries[i].freq).h;
            }
        }

        const userZoom = (context.visualScale as number) ?? 1.0;
        gl.uniform1f(memory.gs_locs.time, time);
        gl.uniform1f(memory.gs_locs.aspect, w / h);
        gl.uniform2f(memory.gs_locs.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
        gl.uniform1f(memory.gs_locs.points, numPoints);
        gl.uniform1f(memory.gs_locs.spread, getVal(cfg.spread, 5.0) * userZoom);
        gl.uniform1f(memory.gs_locs.speed, getVal(cfg.rotationSpeed, 0.5));
        gl.uniform1fv(memory.gs_locs.amps, ampsArray);
        gl.uniform1fv(memory.gs_locs.hues, huesArray);
        gl.uniform1f(memory.gs_locs.reactivity, react);
        gl.uniform1f(memory.gs_locs.opacity, getVal(cfg.masterOpacity, 1.0));
        
        const cMode = getStr(cfg.colorMode, 'Harmonic') === 'Harmonic' ? 0 : 1;
        gl.uniform1i(memory.gs_locs.colorMode, cMode);
        
        const c1 = hex2rgb(getStr(cfg.color1, '#ff0055'));
        const c2 = hex2rgb(getStr(cfg.color2, '#00eeff'));
        gl.uniform3f(memory.gs_locs.color1, c1[0], c1[1], c1[2]);
        gl.uniform3f(memory.gs_locs.color2, c2[0], c2[1], c2[2]);
        gl.uniform1f(memory.gs_locs.kaleidoscope, getVal(cfg.kaleidoscope, 0.0));
        gl.uniform1f(memory.gs_locs.crystalline, getVal(cfg.crystallineLayer, 0.0));

        gl.drawArrays(gl.POINTS, 0, numPoints);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.gs_prog) gl.deleteProgram(memory.gs_prog as WebGLProgram);
            if (memory.gs_vao) gl.deleteVertexArray(memory.gs_vao as WebGLVertexArrayObject);
            if (memory.gs_buf) gl.deleteBuffer(memory.gs_buf as WebGLBuffer);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
