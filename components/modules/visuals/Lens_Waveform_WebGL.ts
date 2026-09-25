import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, HEART_CHANNELS, getFrequencyColor } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const getStr = (v: unknown, fallback: string): string => {
    if (v === undefined || v === null || v === '') return fallback;
    return String(v);
};

const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16) / 255;
        const g = parseInt(clean[1] + clean[1], 16) / 255;
        const b = parseInt(clean[2] + clean[2], 16) / 255;
        return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
    }
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
};

interface ActiveTone {
    id: string;
    freq: number;
    amp: number;
    color: string;
    rgb: [number, number, number];
}

const PRESETS: VisualizerPreset[] = [
    {
        id: 'wf_gl_1',
        name: '01. Quantum Neon Beam',
        config: {
            waveStyle: 'COMPOSITE_BEAM', colorMode: 'Neon Prism', waveScale: 0.85, glowIntensity: 1.8,
            beamThickness: 2.2, travelSpeed: 0.5, waveDensity: 0.9, harmonicSpread: 0.4, symmetry: 1,
            audioReactivity: 1.0, masterOpacity: 1.0, color1: '#00f5d4', color2: '#7928ca', color3: '#ff007f'
        }
    },
    {
        id: 'wf_gl_2',
        name: '02. Multi-Harmonic Prism',
        config: {
            waveStyle: 'MULTI_HARMONIC', colorMode: 'Harmonic (Merrick)', waveScale: 0.75, glowIntensity: 1.7,
            beamThickness: 2.0, travelSpeed: 0.45, waveDensity: 0.95, harmonicSpread: 0.5, symmetry: 1,
            audioReactivity: 1.0, masterOpacity: 1.0, color1: '#38bdf8', color2: '#a855f7', color3: '#f43f5e'
        }
    },
    {
        id: 'wf_gl_3',
        name: '03. Polar Cymatic Ring',
        config: {
            waveStyle: 'CIRCULAR_RING', colorMode: 'Bioluminescent Aqua', waveScale: 0.8, glowIntensity: 1.9,
            beamThickness: 2.0, travelSpeed: 0.4, waveDensity: 1.0, harmonicSpread: 0.4, symmetry: 3,
            audioReactivity: 1.0, masterOpacity: 1.0, color1: '#06b6d4', color2: '#10b981', color3: '#3b82f6'
        }
    },
    {
        id: 'wf_gl_4',
        name: '04. Lissajous Orbit',
        config: {
            waveStyle: 'LISSAJOUS_ORBIT', colorMode: 'Electric Violet', waveScale: 0.9, glowIntensity: 2.0,
            beamThickness: 2.2, travelSpeed: 0.6, waveDensity: 1.0, harmonicSpread: 0.5, symmetry: 2,
            audioReactivity: 1.0, masterOpacity: 1.0, color1: '#d946ef', color2: '#8b5cf6', color3: '#06b6d4'
        }
    },
    {
        id: 'wf_gl_5',
        name: '05. Phosphor CRT Oscilloscope',
        config: {
            waveStyle: 'PHOSPHOR_GRID', colorMode: 'Emerald CRT', waveScale: 0.8, glowIntensity: 1.6,
            beamThickness: 1.8, travelSpeed: 0.7, waveDensity: 1.2, harmonicSpread: 0.3, symmetry: 1,
            audioReactivity: 1.0, masterOpacity: 1.0, color1: '#22c55e', color2: '#16a34a', color3: '#4ade80'
        }
    },
    {
        id: 'wf_gl_6',
        name: '06. Dual Ribbon Stream',
        config: {
            waveStyle: 'DUAL_RIBBON', colorMode: 'Solar Gold', waveScale: 0.75, glowIntensity: 1.8,
            beamThickness: 2.2, travelSpeed: 0.4, waveDensity: 1.0, harmonicSpread: 0.5, symmetry: 1,
            audioReactivity: 1.0, masterOpacity: 1.0, color1: '#f59e0b', color2: '#fbbf24', color3: '#d97706'
        }
    }
];

const VS = `#version 300 es
in vec2 a_pos;
in vec4 a_color;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_kaleidoscope;
uniform float u_crystalline;

out vec4 v_color;

${KALEIDOSCOPE_GLSL_FUNCS}

void main() {
    vec2 ndc = vec2(a_pos.x / (u_resolution.x * 0.5), -a_pos.y / (u_resolution.y * 0.5));
    if (u_kaleidoscope > 1.5) {
        ndc = applyKaleidoscopeFold(ndc, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        ndc = applyCrystallineLayer(ndc, u_crystalline);
    }
    ndc += u_center;
    gl_Position = vec4(ndc, 0.0, 1.0);
    v_color = a_color;
}`;

const FS = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 fragColor;

uniform float u_masterOpacity;

void main() {
    fragColor = vec4(v_color.rgb, v_color.a * u_masterOpacity);
}`;

const MAX_POINTS = 16000;

export const Lens_Waveform_WebGL: VisualizerPlugin = {
    id: 'WAVEFORM_WEBGL',
    name: 'Waveform WebGL',
    renderType: 'WEBGL',

    parameters: [
        { id: 'waveStyle', label: 'Beam Morphology', icon: 'Activity', type: 'SELECT', options: ['COMPOSITE_BEAM', 'MULTI_HARMONIC', 'CIRCULAR_RING', 'LISSAJOUS_ORBIT', 'DUAL_RIBBON', 'PHOSPHOR_GRID'], color: '#00f5d4', section: 'MORPHOLOGY', defaultValue: 'COMPOSITE_BEAM' },
        { id: 'colorMode', label: 'Color Harmonic', icon: 'Palette', type: 'SELECT', options: ['Harmonic (Merrick)', 'Neon Prism', 'Bioluminescent Aqua', 'Electric Violet', 'Solar Gold', 'Emerald CRT'], color: '#ec4899', section: 'MORPHOLOGY', defaultValue: 'Neon Prism' },
        { id: 'waveScale', label: 'Wave Amplitude', icon: 'Maximize', type: 'SLIDER', min: 0.1, max: 2.0, step: 0.05, color: '#38bdf8', section: 'HARMONICS', defaultValue: 0.85 },
        { id: 'glowIntensity', label: 'Laser Glow', icon: 'Sun', type: 'SLIDER', min: 0.2, max: 3.5, step: 0.1, color: '#f59e0b', section: 'HARMONICS', defaultValue: 1.8 },
        { id: 'beamThickness', label: 'Beam Thickness', icon: 'Sliders', type: 'SLIDER', min: 0.5, max: 6.0, step: 0.2, color: '#a855f7', section: 'HARMONICS', defaultValue: 2.2 },
        { id: 'travelSpeed', label: 'Harmonic Motion', icon: 'FastForward', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#10b981', section: 'HARMONICS', defaultValue: 0.5 },
        { id: 'waveDensity', label: 'Spatial Frequency', icon: 'Hash', type: 'SLIDER', min: 0.2, max: 2.5, step: 0.05, color: '#06b6d4', section: 'HARMONICS', defaultValue: 0.9 },
        { id: 'harmonicSpread', label: 'Prism Dispersion', icon: 'GitBranch', type: 'SLIDER', min: 0.1, max: 1.5, step: 0.05, color: '#fb7185', section: 'HARMONICS', defaultValue: 0.4 },
        { id: 'symmetry', label: 'Radial Mandala Fold', icon: 'Aperture', type: 'SLIDER', min: 1, max: 8, step: 1, color: '#818cf8', section: 'MORPHOLOGY', defaultValue: 1 },
        { id: 'audioReactivity', label: 'Audio Reactivity', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 2.5, step: 0.1, color: '#22d3ee', section: 'HARMONICS', defaultValue: 1.0 },
        { id: 'color1', label: 'Primary Wavelength', icon: 'Circle', type: 'COLOR', color: '#00f5d4', section: 'PALETTE', defaultValue: '#00f5d4' },
        { id: 'color2', label: 'Harmonic Second', icon: 'Circle', type: 'COLOR', color: '#7928ca', section: 'PALETTE', defaultValue: '#7928ca' },
        { id: 'color3', label: 'Harmonic Third', icon: 'Circle', type: 'COLOR', color: '#ff007f', section: 'PALETTE', defaultValue: '#ff007f' },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const gl = lensCtx.gl as WebGL2RenderingContext;
        if (!gl) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;
        const { w, h, time, memory, amplitudes, bpm = 0, cx, cy } = lensCtx;

        const waveStyle = getStr(cfg.waveStyle, 'COMPOSITE_BEAM');
        const colorMode = getStr(cfg.colorMode, 'Neon Prism');
        const waveScale = getVal(cfg.waveScale, 0.85);
        const glowIntensity = getVal(cfg.glowIntensity, 1.8);
        const beamThickness = getVal(cfg.beamThickness, 2.2);
        const travelSpeed = getVal(cfg.travelSpeed, 0.5);
        const waveDensity = getVal(cfg.waveDensity, 0.9);
        const harmonicSpread = getVal(cfg.harmonicSpread, 0.4);
        const symmetry = Math.max(1, Math.min(8, Math.floor(getVal(cfg.symmetry, 1))));
        const audioReactivity = getVal(cfg.audioReactivity, 1.0);
        const masterOpacity = getVal(cfg.masterOpacity, 1.0);

        const color1 = getStr(cfg.color1, '#00f5d4');
        const color2 = getStr(cfg.color2, '#7928ca');
        const color3 = getStr(cfg.color3, '#ff007f');

        // Compile Shader & Buffers
        if (!memory.wgl_prog) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('Waveform WebGL Shader Error:', gl.getShaderInfoLog(s));
                }
                return s;
            };

            memory.wgl_prog = gl.createProgram()!;
            gl.attachShader(memory.wgl_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.wgl_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.wgl_prog);

            const getLoc = (name: string) => gl.getUniformLocation(memory.wgl_prog as WebGLProgram, name);
            memory.wgl_locs = {
                resolution: getLoc('u_resolution'),
                center: getLoc('u_center'),
                masterOpacity: getLoc('u_masterOpacity'),
                kaleidoscope: getLoc('u_kaleidoscope'),
                crystalline: getLoc('u_crystalline')
            };

            // Vertex array: pos (vec2), color (vec4) -> 6 floats per vertex
            memory.wgl_vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.wgl_vbo);
            gl.bufferData(gl.ARRAY_BUFFER, MAX_POINTS * 6 * 4, gl.DYNAMIC_DRAW);

            memory.wgl_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.wgl_vao);

            const prog = memory.wgl_prog as WebGLProgram;
            const posLoc = gl.getAttribLocation(prog, 'a_pos');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 6 * 4, 0);

            const colLoc = gl.getAttribLocation(prog, 'a_color');
            gl.enableVertexAttribArray(colLoc);
            gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 6 * 4, 2 * 4);

            memory.wgl_vdata = new Float32Array(MAX_POINTS * 6);
        }

        // Active Tones Collection
        const activeTones: ActiveTone[] = [];
        let totalAmp = 0;

        if (amplitudes) {
            LATTICE_CHANNELS.forEach(ch => {
                const rawAmp = amplitudes.get(ch.id) || 0;
                const amp = rawAmp * audioReactivity * 2.0;
                if (amp > 0.01) {
                    const customFreq = (context as unknown as { customFrequencies?: Record<string, number> }).customFrequencies?.[ch.id];
                    const freq = customFreq ?? ch.freq;
                    let toneColor = getFrequencyColor(freq);
                    if (colorMode === 'Neon Prism') {
                        const pal = [color1, color2, color3];
                        toneColor = pal[activeTones.length % pal.length];
                    } else if (colorMode === 'Emerald CRT') {
                        toneColor = '#22c55e';
                    }
                    activeTones.push({ id: ch.id, freq, amp, color: toneColor, rgb: hexToRgb(toneColor) });
                    totalAmp += amp;
                }
            });
        }

        if (activeTones.length === 0) {
            activeTones.push({ id: 'base', freq: 108, amp: 0.5, color: color1, rgb: hexToRgb(color1) });
        }

        if (memory.wf_phaseAccum === undefined) memory.wf_phaseAccum = 0;
        memory.wf_phaseAccum += 0.016 * travelSpeed * 3.0;

        const numSamples = Math.min(400, Math.max(160, Math.floor(w * 0.5)));
        const halfWidth = w * 0.46;
        const maxExcursion = Math.min(h * 0.22, 120);
        const baseAmplitude = maxExcursion * waveScale;

        const computeSample = (tNorm: number, phaseOffset: number = 0): { composite: number, individual: number[] } => {
            let sumY = 0;
            const indY: number[] = [];
            const sampleTime = (memory.wf_phaseAccum as number) + phaseOffset;

            for (let i = 0; i < activeTones.length; i++) {
                const tone = activeTones[i];
                const cycles = (2.0 + Math.log2(Math.max(20, tone.freq) / 20.0) * 1.0) * waveDensity;
                const phase = (tNorm * cycles * Math.PI * 2) + (sampleTime * (tone.freq / 256.0));
                const toneY = Math.sin(phase) * tone.amp;
                indY.push(toneY);
                sumY += toneY;
            }

            const norm = activeTones.length > 1 ? (1.0 / Math.sqrt(activeTones.length)) : 1.0;
            return { composite: Math.tanh(sumY * norm), individual: indY };
        };

        const vData = memory.wgl_vdata as Float32Array;
        let vPtr = 0;

        interface PathBatch { start: number; count: number; }
        const batches: PathBatch[] = [];

        const addPoint = (x: number, y: number, r: number, g: number, b: number, a: number) => {
            if (vPtr >= MAX_POINTS * 6) return;
            vData[vPtr++] = x;
            vData[vPtr++] = y;
            vData[vPtr++] = r;
            vData[vPtr++] = g;
            vData[vPtr++] = b;
            vData[vPtr++] = a;
        };

        // RENDER MODES

        if (waveStyle === 'COMPOSITE_BEAM' || waveStyle === 'PHOSPHOR_GRID') {
            for (let sym = 0; sym < symmetry; sym++) {
                const symAngle = (sym / symmetry) * Math.PI;
                const cosA = Math.cos(symAngle);
                const sinA = Math.sin(symAngle);

                const startIdx = vPtr / 6;
                const [cr, cg, cb] = hexToRgb(colorMode === 'Emerald CRT' ? '#22c55e' : color1);

                for (let s = 0; s <= numSamples; s++) {
                    const t = s / numSamples;
                    const lx = -halfWidth + (t * halfWidth * 2);
                    const edgeWindow = Math.sin(t * Math.PI);
                    const { composite } = computeSample(t);
                    const ly = composite * baseAmplitude * edgeWindow;

                    const rx = lx * cosA - ly * sinA;
                    const ry = lx * sinA + ly * cosA;
                    addPoint(rx, ry, cr, cg, cb, 0.95);
                }
                batches.push({ start: startIdx, count: (vPtr / 6) - startIdx });
            }

        } else if (waveStyle === 'MULTI_HARMONIC') {
            const spreadStep = Math.min(h * 0.08, 45) * harmonicSpread;

            for (let i = 0; i < activeTones.length; i++) {
                const tone = activeTones[i];
                const vOffset = (i - (activeTones.length - 1) / 2) * spreadStep;
                const startIdx = vPtr / 6;
                const [tr, tg, tb] = tone.rgb;

                for (let s = 0; s <= numSamples; s++) {
                    const t = s / numSamples;
                    const lx = -halfWidth + (t * halfWidth * 2);
                    const edgeWindow = Math.sin(t * Math.PI);
                    const { individual } = computeSample(t);
                    const toneVal = individual[i] ? Math.tanh(individual[i]) : 0;
                    const ly = vOffset + (toneVal * baseAmplitude * 0.75 * edgeWindow);

                    addPoint(lx, ly, tr, tg, tb, 0.85);
                }
                batches.push({ start: startIdx, count: (vPtr / 6) - startIdx });
            }

            // Central White Composite
            const startIdx = vPtr / 6;
            for (let s = 0; s <= numSamples; s++) {
                const t = s / numSamples;
                const lx = -halfWidth + (t * halfWidth * 2);
                const edgeWindow = Math.sin(t * Math.PI);
                const { composite } = computeSample(t);
                const ly = composite * baseAmplitude * edgeWindow;
                addPoint(lx, ly, 1.0, 1.0, 1.0, 1.0);
            }
            batches.push({ start: startIdx, count: (vPtr / 6) - startIdx });

        } else if (waveStyle === 'CIRCULAR_RING') {
            const baseRadius = Math.min(w, h) * 0.22;
            const numPolar = 240;
            const [rr, rg, rb] = hexToRgb(color1);

            const startIdx = vPtr / 6;
            for (let i = 0; i <= numPolar; i++) {
                const theta = (i / numPolar) * Math.PI * 2;
                const tNorm = (i / numPolar) * symmetry;
                const { composite } = computeSample(tNorm);
                const r = baseRadius + (composite * (baseAmplitude * 0.4));
                addPoint(Math.cos(theta) * r, Math.sin(theta) * r, rr, rg, rb, 0.95);
            }
            batches.push({ start: startIdx, count: (vPtr / 6) - startIdx });

            // Inner harmonic rings
            for (let k = 1; k < Math.min(3, activeTones.length); k++) {
                const innerR = baseRadius * (1.0 - k * 0.2);
                if (innerR > 10) {
                    const inStart = vPtr / 6;
                    const [ir, ig, ib] = activeTones[k].rgb;
                    for (let i = 0; i <= numPolar; i++) {
                        const theta = (i / numPolar) * Math.PI * 2;
                        const tNorm = (i / numPolar) * symmetry;
                        const { individual } = computeSample(tNorm, k * 0.5);
                        const indVal = individual[k] ? Math.tanh(individual[k]) : 0;
                        const r = innerR + (indVal * (baseAmplitude * 0.25));
                        addPoint(Math.cos(theta) * r, Math.sin(theta) * r, ir, ig, ib, 0.8);
                    }
                    batches.push({ start: inStart, count: (vPtr / 6) - inStart });
                }
            }

        } else if (waveStyle === 'LISSAJOUS_ORBIT') {
            const orbitRadius = Math.min(w, h) * 0.24 * waveScale;
            const orbitPoints = 360;
            const t1 = activeTones[0] || { freq: 432, amp: 1 };
            const t2 = activeTones[1] || activeTones[0];
            const ratio1 = Math.max(1, Math.min(6, Math.round(t1.freq / 64.0)));
            const ratio2 = Math.max(1, Math.min(6, Math.round(t2.freq / 64.0)));
            const phaseShift = (memory.wf_phaseAccum as number) * 0.6;
            const [lr, lg, lb] = hexToRgb(color2);

            const startIdx = vPtr / 6;
            for (let i = 0; i <= orbitPoints; i++) {
                const phi = (i / orbitPoints) * Math.PI * 2;
                const x = Math.sin(phi * ratio1 + phaseShift) * orbitRadius;
                const y = Math.cos(phi * ratio2) * orbitRadius;
                addPoint(x, y, lr, lg, lb, 0.95);
            }
            batches.push({ start: startIdx, count: (vPtr / 6) - startIdx });

        } else if (waveStyle === 'DUAL_RIBBON') {
            const spread = Math.min(h * 0.08, 40);
            const [uR, uG, uB] = hexToRgb(color1);
            const [lR, lG, lB] = hexToRgb(color2);

            const upStart = vPtr / 6;
            for (let s = 0; s <= numSamples; s++) {
                const t = s / numSamples;
                const lx = -halfWidth + (t * halfWidth * 2);
                const edgeWindow = Math.sin(t * Math.PI);
                const { composite } = computeSample(t);
                const ly = -spread + (composite * baseAmplitude * 0.8 * edgeWindow);
                addPoint(lx, ly, uR, uG, uB, 0.9);
            }
            batches.push({ start: upStart, count: (vPtr / 6) - upStart });

            const loStart = vPtr / 6;
            for (let s = 0; s <= numSamples; s++) {
                const t = s / numSamples;
                const lx = -halfWidth + (t * halfWidth * 2);
                const edgeWindow = Math.sin(t * Math.PI);
                const { composite } = computeSample(t, Math.PI * 0.5);
                const ly = spread + (composite * baseAmplitude * 0.8 * edgeWindow);
                addPoint(lx, ly, lR, lG, lB, 0.9);
            }
            batches.push({ start: loStart, count: (vPtr / 6) - loStart });
        }

        // Upload geometry to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, memory.wgl_vbo as WebGLBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vData.subarray(0, vPtr));

        // Render pass
        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive laser glow

        gl.clearColor(0.01, 0.01, 0.03, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.wgl_prog as WebGLProgram);
        gl.bindVertexArray(memory.wgl_vao as WebGLVertexArrayObject);

        const locs = memory.wgl_locs as Record<string, WebGLUniformLocation>;
        gl.uniform2f(locs.resolution, w, h);

        const cxNorm = (cx / w) * 2.0 - 1.0;
        const cyNorm = -((cy / h) * 2.0 - 1.0);
        gl.uniform2f(locs.center, cxNorm, cyNorm);

        gl.uniform1f(locs.masterOpacity, masterOpacity);
        gl.uniform1f(locs.kaleidoscope, getVal(cfg.kaleidoscope, 0));
        gl.uniform1f(locs.crystalline, getVal(cfg.crystallineLayer, 0));

        // Draw each continuous line strip
        batches.forEach(b => {
            gl.drawArrays(gl.LINE_STRIP, b.start, b.count);
        });
    },

    cleanup: ({ gl, memory }) => {
        if (!gl) return;
        if (memory.wgl_prog) gl.deleteProgram(memory.wgl_prog as WebGLProgram);
        if (memory.wgl_vbo) gl.deleteBuffer(memory.wgl_vbo as WebGLBuffer);
        if (memory.wgl_vao) (gl as WebGL2RenderingContext).deleteVertexArray(memory.wgl_vao as WebGLVertexArrayObject);
        delete memory.wgl_prog;
        delete memory.wgl_vbo;
        delete memory.wgl_vao;
        delete memory.wgl_locs;
        delete memory.wgl_vdata;
    }
};
