import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, UNIVERSAL_CHANNELS, getFrequencyHSL } from './shared';

const getVal = (v: unknown, f: number) => isNaN(parseFloat(v as string)) ? f : parseFloat(v as string);
const getStr = (v: unknown, f: string) => typeof v === 'string' ? v : f;

const hex2rgb = (hex: string) => {
    const c = hex.replace('#', '');
    return [
        parseInt(c.substring(0, 2), 16) / 255,
        parseInt(c.substring(2, 4), 16) / 255,
        parseInt(c.substring(4, 6), 16) / 255
    ];
};

// --- PRESETS ---
const PRESETS: VisualizerPreset[] = [
    {
        id: 'orbit_1',
        name: '01. Seraphim Breathing',
        config: { 
            zoom: 1.2, panX: 0, panY: 0, rotation: 0.0, trapWidth: 0.02, coreGlow: 1.5, iter: 150,
            power: 2.0, seedX: 0.285, seedY: 0.01,
            weightCross: 1.0, weightPoint: 1.0, weightCore: 1.0, 
            weightHalo: 0.0, haloRadius: 1.618, weightLotus: 0.0, lotusPetals: 6.0,
            colorShift: 0.0, colorSpeed: 0.1, saturation: 1.2,
            grain: 0.05, ripple: 0.0,
            colorMode: 'Harmonic (Merrick)', color1: '#ff0055', color2: '#00eeff', bgColor: '#000000'
        },
        modulations: { 
            seedX: { enabled: true, min: 0.280, max: 0.295, amtBreath: 1.0, mixMode: 'ADD' },
            coreGlow: { enabled: true, min: 1.2, max: 2.0, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    {
        id: 'orbit_2',
        name: '02. Sacred Audio Mandala',
        config: { 
            zoom: 0.8, panX: 0, panY: 0, rotation: 1.57, trapWidth: 0.03, coreGlow: 2.0, iter: 200,
            power: 3.0, seedX: -0.4, seedY: 0.0,
            weightCross: 0.2, weightPoint: 0.2, weightCore: 1.0, 
            weightHalo: 0.8, haloRadius: 1.618, weightLotus: 1.0, lotusPetals: 6.0,
            colorShift: 0.6, colorSpeed: 0.5, saturation: 2.0,
            grain: 0.1, ripple: 0.01,
            colorMode: 'Harmonic (Merrick)', color1: '#ff0055', color2: '#00eeff', bgColor: '#000000'
        },
        modulations: { 
            weightHalo: { enabled: true, min: 0.2, max: 1.5, amtAudio: 1.0, mixMode: 'ADD' },
            weightLotus: { enabled: true, min: 0.2, max: 2.0, amtAudio: 1.0, mixMode: 'ADD' },
            trapWidth: { enabled: true, min: 0.02, max: 0.08, amtAudio: 1.0, mixMode: 'ADD' },
            ripple: { enabled: true, min: 0.0, max: 0.02, amtAudio: 1.0, mixMode: 'ADD' }
        }
    }
];

// --- SHADERS ---

const VS_MAIN = `#version 300 es
in vec2 a_p; 
out vec2 v_uv; 
void main() { 
    v_uv = a_p * 0.5 + 0.5; 
    gl_Position = vec4(a_p, 0, 1); 
}`;

const FS_MAIN = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform float u_time, u_aspect;
uniform float u_zoom, u_trapWidth, u_coreGlow, u_iter;
uniform vec2 u_pan;
uniform vec2 u_center;
uniform float u_rotation;

// GLOBAL WRAPPER UNIFORMS (Injected by the platform)
uniform float u_visualScale;
uniform float u_masterOpacity;
uniform float u_audioReactivity;
uniform float u_forceMultiplier;

// GOD MODE UNIFORMS
uniform vec2 u_seed;
uniform vec3 u_weights; 
uniform float u_power;

uniform float u_weightHalo;
uniform float u_haloRadius;
uniform float u_weightLotus;
uniform float u_lotusPetals;

uniform float u_colorShift;
uniform float u_colorSpeed;
uniform float u_saturation;
uniform float u_grain;
uniform float u_ripple;

uniform float u_amps[7];
uniform float u_hues[7];

// New params
uniform int u_colorMode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bgColor;

out vec4 fragColor;

vec3 hueShift(vec3 col, float shift) {
    vec3 m = vec3(cos(shift), -sin(shift) * 0.57735, 0.0);
    m = vec3(m.x + m.y, m.x - m.y, -m.y);
    float v = 0.57735;
    vec3 a = vec3(v, v, v);
    return mix(vec3(dot(a, col)), col, m.x) + cross(a, col) * m.y;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() { 
    vec2 p = v_uv * 2.0 - 1.0;
    p -= u_center;
    p.x *= u_aspect;
    
    // 1. VISUAL SCALE OVERRIDE
    p *= (1.0 / max(0.001, u_visualScale)); 
    
    float s_rot = sin(u_rotation);
    float c_rot = cos(u_rotation);
    p = vec2(p.x * c_rot - p.y * s_rot, p.x * s_rot + p.y * c_rot);

    vec2 z = (p - u_pan) / max(0.01, u_zoom);
    
    // 2. FORCE MULTIPLIER OVERRIDE
    float t = u_time * max(0.0, u_forceMultiplier);
    
    vec2 rippleOffset = vec2(
        sin(p.y * 100.0 + t * 2.0),
        cos(p.x * 100.0 + t * 2.0)
    ) * u_ripple;
    z += rippleOffset;

    vec2 c = u_seed + vec2(cos(t * 0.15), sin(t * 0.2)) * 0.02;

    float trap_cross = 100.0;
    float trap_point = 100.0;
    float trap_core  = 100.0;
    float trap_halo  = 100.0;
    float trap_lotus = 100.0;

    for(int i = 0; i < 500; i++) {
        if(i >= int(u_iter)) break;
        
        float r = length(z);
        if(r > 10.0) break; 
        
        float a = atan(z.y, z.x + 0.00001);
        
        float a_mut = a * u_power;
        z = pow(r + 0.00001, u_power) * vec2(cos(a_mut), sin(a_mut)) + c;

        trap_cross = min(trap_cross, abs(z.x * z.y));
        trap_point = min(trap_point, length(z - vec2(0.0, 1.0)));
        trap_core  = min(trap_core, length(z));
        
        trap_halo = min(trap_halo, abs(length(z) - u_haloRadius));
        trap_lotus = min(trap_lotus, abs(sin(a * u_lotusPetals) * r));
    }

    float width = max(0.0001, u_trapWidth);
    
    float int_cross = exp(-trap_cross / width) * u_weights.x;
    float int_point = exp(-trap_point / width) * u_weights.y;
    float int_core  = exp(-trap_core  / width) * u_weights.z;
    float int_halo  = exp(-trap_halo  / width) * u_weightHalo;
    float int_lotus = exp(-trap_lotus / width) * u_weightLotus;

    // 3. AUDIO REACTIVITY INJECTION
    float baseAudio = (u_amps[0] + u_amps[1] + u_amps[2] + u_amps[3] + u_amps[4] + u_amps[5] + u_amps[6]) / 7.0;
    float audioBoost = 1.0 + baseAudio * u_audioReactivity * 2.0;

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

    vec3 col = vec3(0.0);
    if (u_colorMode == 0) {
        col += merrickColor * int_cross;
        col += mix(merrickColor, vec3(1.0), 0.5) * int_point;
        col += mix(merrickColor, vec3(0.9, 0.6, 1.0), 0.3) * int_core;
        col += mix(merrickColor, vec3(1.0, 0.8, 0.4), 0.5) * int_halo;
        col += mix(merrickColor, vec3(0.4, 0.9, 1.0), 0.5) * int_lotus;
    } else {
        vec3 col_cross = u_color1;
        vec3 col_point = u_color2;
        vec3 col_core  = mix(u_color1, u_color2, 0.5);
        vec3 col_halo  = vec3(1.0, 0.8, 0.4);
        vec3 col_lotus = vec3(0.4, 0.9, 1.0);

        col += col_cross * int_cross;
        col += col_point * int_point;
        col += col_core  * int_core;
        col += col_halo  * int_halo;
        col += col_lotus * int_lotus;
    }

    col *= u_coreGlow * audioBoost;

    // Saturated & Shifted
    float currentShift = u_colorShift + t * u_colorSpeed;
    col = hueShift(col, currentShift);
    
    vec3 lumCoeff = vec3(0.2126, 0.7152, 0.0722);
    float lum = dot(col, lumCoeff);
    col = mix(vec3(lum), col, u_saturation);

    float grainNoise = fract(sin(dot(v_uv, vec2(12.9898, 78.233) + t)) * 43758.5453);
    col += (vec3(grainNoise) - 0.5) * u_grain;

    float radius = length((v_uv * 2.0 - 1.0) - u_center);
    col *= smoothstep(1.2, 0.5, radius);

    col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
    
    col += u_bgColor;

    // 4. MASTER OPACITY OVERRIDE
    fragColor = vec4(col, clamp(u_masterOpacity, 0.0, 1.0)); 
}`;

export const Lens_FractalTree: VisualizerPlugin = {
    id: 'FRACTAL_TREE',
    name: 'Fractal Tree',
    renderType: 'WEBGL',
    isLegacy: false,
    defaultConfig: PRESETS[0].config,
    parameters: [
        { id: 'colorMode', label: 'Color Mode', type: 'SELECT', options: ['Harmonic (Merrick)', 'Custom'], section: 'COLOR', defaultValue: 'Harmonic (Merrick)' },
        { id: 'color1', label: 'Primary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#ff0055' },
        { id: 'color2', label: 'Secondary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#00eeff' },
        { id: 'bgColor', label: 'Background Color', type: 'COLOR', section: 'COLOR', defaultValue: '#000000' },
        { id: 'zoom', label: 'Scale', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.2 },
        { id: 'panX', label: 'Pan X', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'panY', label: 'Pan Y', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'rotation', label: 'Entity Spin', type: 'SLIDER', min: -3.14, max: 3.14, step: 0.01, section: 'PHYSICS', defaultValue: 0.0 },
        
        { id: 'grain', label: 'Cosmic Grain', type: 'SLIDER', min: 0.0, max: 0.5, step: 0.01, section: 'TEXTURE', defaultValue: 0.05 },
        { id: 'ripple', label: 'Glass Ripple', type: 'SLIDER', min: 0.0, max: 0.05, step: 0.001, section: 'TEXTURE', defaultValue: 0.0 },

        { id: 'coreGlow', label: 'Master Glow', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.1, section: 'LIGHT', defaultValue: 1.5 },
        { id: 'saturation', label: 'Saturation', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'LIGHT', defaultValue: 1.0 },
        { id: 'colorShift', label: 'Hue Base', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.0 },
        { id: 'colorSpeed', label: 'Auto Color Cycle', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'LIGHT', defaultValue: 0.1 },
        
        { id: 'power', label: 'Dimensional Wings (Z^N)', type: 'SLIDER', min: 1.5, max: 8.0, step: 0.1, section: 'GEOMETRY', defaultValue: 2.0 },
        { id: 'seedX', label: 'Julia Seed X', type: 'SLIDER', min: -1.0, max: 1.0, step: 0.001, section: 'GEOMETRY', defaultValue: 0.285 },
        { id: 'seedY', label: 'Julia Seed Y', type: 'SLIDER', min: -1.0, max: 1.0, step: 0.001, section: 'GEOMETRY', defaultValue: 0.01 },
        
        { id: 'trapWidth', label: 'Master Thickness', type: 'SLIDER', min: 0.001, max: 0.2, step: 0.001, section: 'GEOMETRY', defaultValue: 0.02 },
        { id: 'weightCross', label: 'Outer Vein Vol', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'GEOMETRY', defaultValue: 1.0 },
        { id: 'weightPoint', label: 'Inner Shell Vol', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'GEOMETRY', defaultValue: 1.0 },
        { id: 'weightCore', label: 'Heart Vol', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'GEOMETRY', defaultValue: 1.0 },

        { id: 'weightHalo', label: 'Golden Halo Vol', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'haloRadius', label: 'Halo Radius (Phi)', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.01, section: 'GEOMETRY', defaultValue: 1.618 },
        { id: 'weightLotus', label: 'Lotus Ray Vol', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'lotusPetals', label: 'Lotus Petals', type: 'SLIDER', min: 2.0, max: 12.0, step: 1.0, section: 'GEOMETRY', defaultValue: 6.0 },

        { id: 'iter', label: 'Computation Depth', type: 'SLIDER', min: 50, max: 500, step: 10, section: 'PHYSICS', defaultValue: 150 }
    ],
    presets: PRESETS,
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, time, memory } = context;

        // The parser that finds the host UI's global variables and converts percentages
        const parseGlobal = (cfgObj: Record<string, unknown>, keys: string[], defaultVal: number) => {
            for (const k of keys) {
                if (cfgObj[k] !== undefined) {
                    const v = cfgObj[k];
                    if (typeof v === 'string' && v.includes('%')) return parseFloat(v) / 100.0;
                    return parseFloat(v as string);
                }
            }
            return defaultVal;
        };

        const userZoom = (context.visualScale as number) ?? 1.0;
        const vScale = parseGlobal(cfg, ['visualScale', 'Visual Scale', 'scale', 'visual_scale'], 1.0) * userZoom;
        const mOpacity = parseGlobal(cfg, ['masterOpacity', 'Master Opacity', 'opacity', 'master_opacity'], 1.0);
        const aReact = parseGlobal(cfg, ['audioReactivity', 'Audio Reactivity', 'reactivity', 'audio_reactivity'], 0.0);
        const fMult = parseGlobal(cfg, ['forceMultiplier', 'Force Multiplier', 'force', 'force_multiplier'], 1.0);

        if (!memory.fractalTreeInit || memory.w !== w) {
            const compile = (t: number, s: string) => { 
                const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); 
                return sh; 
            };

            memory.pMain = gl.createProgram()!; 
            gl.attachShader(memory.pMain, compile(gl.VERTEX_SHADER, VS_MAIN)); 
            gl.attachShader(memory.pMain, compile(gl.FRAGMENT_SHADER, FS_MAIN)); 
            gl.linkProgram(memory.pMain);

            memory.fractalTreeVao = gl.createVertexArray(); gl.bindVertexArray(memory.fractalTreeVao);
            const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            
            memory.w = w; memory.fractalTreeInit = true;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        
        // Critical for Master Opacity: Enables proper alpha blending to the background
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        const bg = hex2rgb(getStr(cfg.bgColor, '#000000'));
        gl.clearColor(bg[0], bg[1], bg[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(memory.pMain); 
        gl.bindVertexArray(memory.fractalTreeVao);
        
        const loc = (p: any, n: string) => gl.getUniformLocation(p, n);
        
        // Feed the global host parameters into the shader
        gl.uniform1f(loc(memory.pMain, "u_visualScale"), vScale);
        gl.uniform1f(loc(memory.pMain, "u_masterOpacity"), mOpacity);
        gl.uniform1f(loc(memory.pMain, "u_audioReactivity"), aReact);
        gl.uniform1f(loc(memory.pMain, "u_forceMultiplier"), fMult);

        gl.uniform1f(loc(memory.pMain, "u_time"), time);
        gl.uniform1f(loc(memory.pMain, "u_aspect"), w/h);
        gl.uniform2f(loc(memory.pMain, "u_center"), (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
        gl.uniform1f(loc(memory.pMain, "u_zoom"), getVal(cfg.zoom, 1.2));
        gl.uniform2f(loc(memory.pMain, "u_pan"), getVal(cfg.panX, 0.0), getVal(cfg.panY, 0.0));
        gl.uniform1f(loc(memory.pMain, "u_rotation"), getVal(cfg.rotation, 0.0));
        
        const qualityMult = memory.qualityMultiplier ?? 1.0;
        const baseIter = getVal(cfg.iter, 150);
        gl.uniform1f(loc(memory.pMain, "u_iter"), Math.max(10, Math.floor(baseIter * qualityMult)));
        
        gl.uniform1f(loc(memory.pMain, "u_grain"), getVal(cfg.grain, 0.05));
        gl.uniform1f(loc(memory.pMain, "u_ripple"), getVal(cfg.ripple, 0.0));
        gl.uniform1f(loc(memory.pMain, "u_trapWidth"), getVal(cfg.trapWidth, 0.02));
        gl.uniform3f(loc(memory.pMain, "u_weights"), getVal(cfg.weightCross, 1.0), getVal(cfg.weightPoint, 1.0), getVal(cfg.weightCore, 1.0));
        
        gl.uniform1f(loc(memory.pMain, "u_weightHalo"), getVal(cfg.weightHalo, 0.0));
        gl.uniform1f(loc(memory.pMain, "u_haloRadius"), getVal(cfg.haloRadius, 1.618));
        gl.uniform1f(loc(memory.pMain, "u_weightLotus"), getVal(cfg.weightLotus, 0.0));
        gl.uniform1f(loc(memory.pMain, "u_lotusPetals"), getVal(cfg.lotusPetals, 6.0));

        gl.uniform2f(loc(memory.pMain, "u_seed"), getVal(cfg.seedX, 0.285), getVal(cfg.seedY, 0.01));
        gl.uniform1f(loc(memory.pMain, "u_power"), getVal(cfg.power, 2.0));
        
        gl.uniform1f(loc(memory.pMain, "u_coreGlow"), getVal(cfg.coreGlow, 1.5));
        gl.uniform1f(loc(memory.pMain, "u_colorShift"), getVal(cfg.colorShift, 0.0));
        gl.uniform1f(loc(memory.pMain, "u_colorSpeed"), getVal(cfg.colorSpeed, 0.1));
        gl.uniform1f(loc(memory.pMain, "u_saturation"), getVal(cfg.saturation, 1.0));
        
        const amps = [0,0,0,0,0,0,0];
        const hues = [0,0,0,0,0,0,0];
        for (let i = 0; i < 7; i++) {
            hues[i] = getFrequencyHSL(UNIVERSAL_CHANNELS[i].freq).h;
        }
        if (context.amplitudes) {
            let i = 0;
            for (const [key, val] of context.amplitudes.entries()) {
                if (i < 7) {
                    amps[i] = val;
                    const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                    if (!isNaN(freqNum) && freqNum > 0) {
                        hues[i] = getFrequencyHSL(freqNum).h;
                    }
                    i++;
                }
            }
        }
        gl.uniform1fv(loc(memory.pMain, "u_amps"), amps);
        gl.uniform1fv(loc(memory.pMain, "u_hues"), hues);
        
        const cMode = getStr(cfg.colorMode, 'Harmonic (Merrick)') === 'Harmonic (Merrick)' ? 0 : 1;
        gl.uniform1i(loc(memory.pMain, "u_colorMode"), cMode);
        const c1 = hex2rgb(getStr(cfg.color1, '#ff0055'));
        gl.uniform3f(loc(memory.pMain, "u_color1"), c1[0], c1[1], c1[2]);
        const c2 = hex2rgb(getStr(cfg.color2, '#00eeff'));
        gl.uniform3f(loc(memory.pMain, "u_color2"), c2[0], c2[1], c2[2]);
        gl.uniform3f(loc(memory.pMain, "u_bgColor"), bg[0], bg[1], bg[2]);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.pMain) gl.deleteProgram(memory.pMain as WebGLProgram);
            if (memory.fractalTreeVao) gl.deleteVertexArray(memory.fractalTreeVao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
