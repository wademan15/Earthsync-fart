import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyColor, HEART_HARMONIC_DEFS } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
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

interface ActiveMode {
    n: number;
    speed: number;
    vol: number;
    color: string;
    rgb: [number, number, number];
}

const PRESETS: VisualizerPreset[] = [
    {
        id: 'aura_gl_1',
        name: '01. Bioluminescent Lotus',
        config: {
            tension: 0.35, roughness: 0.15, smoothing: 0.85, driftSpeed: 0.3, plasma: 0.7,
            nucleus: 0.8, reactivity: 1.2, force: 1.5, visualScale: 1.0, masterOpacity: 1.0
        }
    },
    {
        id: 'aura_gl_2',
        name: '02. Solar Corona Flare',
        config: {
            tension: 0.2, roughness: 0.45, smoothing: 0.65, driftSpeed: 0.6, plasma: 1.2,
            nucleus: 0.9, reactivity: 1.5, force: 2.0, visualScale: 1.1, masterOpacity: 1.0
        }
    },
    {
        id: 'aura_gl_3',
        name: '03. Deep Astral Mist',
        config: {
            tension: 0.55, roughness: 0.08, smoothing: 0.92, driftSpeed: 0.15, plasma: 0.5,
            nucleus: 0.5, reactivity: 1.0, force: 1.2, visualScale: 0.95, masterOpacity: 1.0
        }
    }
];

const VS = `#version 300 es
in vec2 a_pos;
in vec4 a_color;
in float a_dist;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_kaleidoscope;
uniform float u_crystalline;

out vec4 v_color;
out float v_dist;

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
    v_dist = a_dist;
}`;

const FS = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_dist;
out vec4 fragColor;

uniform float u_masterOpacity;

void main() {
    float falloff = pow(clamp(1.0 - v_dist, 0.0, 1.0), 1.6);
    float alpha = v_color.a * falloff * u_masterOpacity;
    if (alpha <= 0.001) discard;
    fragColor = vec4(v_color.rgb * falloff * 1.2, alpha);
}`;

const MAX_AURA_VERTS = 12000;
const RESOLUTION = 180;

export const Lens_Aura_WebGL: VisualizerPlugin = {
    id: 'AURA_WEBGL',
    name: 'Zen Aura WebGL',
    renderType: 'WEBGL',

    parameters: [
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Layers', type: 'SLIDER', min: 0, max: 1, step: 0.05, color: '#ffffff', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'reactivity', label: 'Audio Reactivity', icon: 'Activity', type: 'SLIDER', min: 0, max: 2.5, step: 0.05, color: '#22d3ee', section: 'PHYSICS', defaultValue: 1.2 },
        { id: 'force', label: 'Harmonic Force', icon: 'Zap', type: 'SLIDER', min: 0, max: 5.0, step: 0.1, color: '#f43f5e', section: 'PHYSICS', defaultValue: 1.5 },
        { id: 'tension', label: 'Surface Tension', icon: 'Minimize2', type: 'SLIDER', min: 0, max: 1, step: 0.05, color: '#38bdf8', section: 'GEOMETRY', defaultValue: 0.35 },
        { id: 'roughness', label: 'Plasma Turbulence', icon: 'Flame', type: 'SLIDER', min: 0, max: 1, step: 0.05, color: '#fb923c', section: 'PHYSICS', defaultValue: 0.15 },
        { id: 'smoothing', label: 'Fluid Viscosity', icon: 'Droplet', type: 'SLIDER', min: 0.1, max: 1, step: 0.05, color: '#a855f7', section: 'PHYSICS', defaultValue: 0.85 },
        { id: 'driftSpeed', label: 'Undulation Speed', icon: 'Wind', type: 'SLIDER', min: 0, max: 2, step: 0.05, color: '#4ade80', section: 'PHYSICS', defaultValue: 0.3 },
        { id: 'plasma', label: 'Ethereal Bloom', icon: 'Sun', type: 'SLIDER', min: 0, max: 2.0, step: 0.05, color: '#facc15', section: 'LIGHT', defaultValue: 0.7 },
        { id: 'nucleus', label: 'Nucleus Density', icon: 'Target', type: 'SLIDER', min: 0, max: 1.5, step: 0.05, color: '#ec4899', section: 'LIGHT', defaultValue: 0.8 },
        { id: 'visualScale', label: 'Visual Scale', icon: 'Maximize', type: 'SLIDER', min: 0.2, max: 2.5, step: 0.05, color: '#e879f9', section: 'GEOMETRY', defaultValue: 1.0 }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const gl = lensCtx.gl as WebGL2RenderingContext;
        if (!gl) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;
        const { w, h, time, memory, amplitudes, bpm = 0, cx, cy } = lensCtx;

        const reactivity = getVal(cfg.reactivity, 1.2);
        const force = getVal(cfg.force, 1.5);
        const tension = getVal(cfg.tension, 0.35);
        const roughness = getVal(cfg.roughness, 0.15);
        const smoothing = getVal(cfg.smoothing, 0.85);
        const driftSpeed = getVal(cfg.driftSpeed, 0.3);
        const plasma = getVal(cfg.plasma, 0.7);
        const nucleus = getVal(cfg.nucleus, 0.8);
        const visualScale = getVal(cfg.visualScale, 1.0);
        const masterOpacity = getVal(cfg.masterOpacity, 1.0);

        if (!memory.awgl_prog) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('Aura WebGL Shader Error:', gl.getShaderInfoLog(s));
                }
                return s;
            };

            memory.awgl_prog = gl.createProgram()!;
            gl.attachShader(memory.awgl_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.awgl_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.awgl_prog);

            const getLoc = (name: string) => gl.getUniformLocation(memory.awgl_prog as WebGLProgram, name);
            memory.awgl_locs = {
                resolution: getLoc('u_resolution'),
                center: getLoc('u_center'),
                masterOpacity: getLoc('u_masterOpacity'),
                kaleidoscope: getLoc('u_kaleidoscope'),
                crystalline: getLoc('u_crystalline')
            };

            // Vertex layout: pos (vec2), color (vec4), dist (float) -> 7 floats
            memory.awgl_vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.awgl_vbo);
            gl.bufferData(gl.ARRAY_BUFFER, MAX_AURA_VERTS * 7 * 4, gl.DYNAMIC_DRAW);

            memory.awgl_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.awgl_vao);

            const prog = memory.awgl_prog as WebGLProgram;
            const posLoc = gl.getAttribLocation(prog, 'a_pos');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 7 * 4, 0);

            const colLoc = gl.getAttribLocation(prog, 'a_color');
            gl.enableVertexAttribArray(colLoc);
            gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 7 * 4, 2 * 4);

            const distLoc = gl.getAttribLocation(prog, 'a_dist');
            gl.enableVertexAttribArray(distLoc);
            gl.vertexAttribPointer(distLoc, 1, gl.FLOAT, false, 7 * 4, 6 * 4);

            memory.awgl_vdata = new Float32Array(MAX_AURA_VERTS * 7);
        }

        // Collect Active Modes
        const activeModes: ActiveMode[] = [];
        if (amplitudes) {
            LATTICE_CHANNELS.forEach((ch, index) => {
                const amp = (amplitudes.get(ch.id) || 0) * reactivity * force;
                if (amp > 0.01) {
                    const hex = getFrequencyColor(ch.freq);
                    activeModes.push({
                        n: (index % 5) + 2,
                        speed: 0.5 + (index * 0.15),
                        vol: amp,
                        color: hex,
                        rgb: hexToRgb(hex)
                    });
                }
            });
        }

        if (bpm > 0 && HEART_HARMONIC_DEFS) {
            HEART_HARMONIC_DEFS.forEach((def, index) => {
                const id = `HEART_HARMONIC_${index}`;
                const amp = (amplitudes?.get(id) || 0) * reactivity * force;
                if (amp > 0.01) {
                    const hex = getFrequencyColor((bpm / 60) * def.mult);
                    activeModes.push({
                        n: index + 2,
                        speed: 0.3 + (index * 0.1),
                        vol: amp,
                        color: hex,
                        rgb: hexToRgb(hex)
                    });
                }
            });
        }

        if (activeModes.length === 0) {
            activeModes.push({ n: 3, speed: 0.4, vol: 0.5, color: '#38bdf8', rgb: hexToRgb('#38bdf8') });
        }

        const maxRadius = Math.min(w, h) * 0.42 * visualScale;
        const vData = memory.awgl_vdata as Float32Array;
        let vPtr = 0;

        interface FanBatch { start: number; count: number; }
        const batches: FanBatch[] = [];

        const pushBlobFan = (mode: ActiveMode, baseR: number, distortionLimit: number, alpha: number, driftOffset: number) => {
            const startIdx = vPtr / 7;
            const [r, g, b] = mode.rgb;

            // Center vertex
            vData[vPtr++] = 0;
            vData[vPtr++] = 0;
            vData[vPtr++] = r;
            vData[vPtr++] = g;
            vData[vPtr++] = b;
            vData[vPtr++] = alpha;
            vData[vPtr++] = 0.0; // center dist

            // Perimeter vertices
            for (let i = 0; i <= RESOLUTION; i++) {
                const theta = (i / RESOLUTION) * Math.PI * 2;
                const effectiveTheta = theta + driftOffset;

                const flow = Math.sin(mode.n * effectiveTheta - time * mode.speed);
                const subLobe = Math.max(1, mode.n - 1);
                const backFlow = Math.cos(subLobe * effectiveTheta + time * mode.speed * 0.6);

                const actualRoughness = roughness * (1.0 - smoothing);
                const jitter = actualRoughness > 0 ? Math.sin(effectiveTheta * mode.n * 3 + time * 2) * actualRoughness * 0.3 : 0;
                const elasticity = 1.0 - (tension * 0.8);
                const waveMix = (flow * 0.6) + (backFlow * 0.4) + jitter;

                const drawR = Math.max(1, baseR * (1 + (waveMix * distortionLimit * mode.vol * elasticity)));
                const px = Math.cos(theta) * drawR;
                const py = Math.sin(theta) * drawR;

                vData[vPtr++] = px;
                vData[vPtr++] = py;
                vData[vPtr++] = r;
                vData[vPtr++] = g;
                vData[vPtr++] = b;
                vData[vPtr++] = alpha;
                vData[vPtr++] = 1.0; // edge dist
            }

            batches.push({ start: startIdx, count: RESOLUTION + 2 });
        };

        // Render 3 layered passes per mode matching Lens_Aura
        activeModes.forEach((mode, index) => {
            const driftOffset = time * driftSpeed * (index % 2 === 0 ? 1 : -1);

            // Layer 1: Massive Ethereal Outer Aura (Plasma Bloom)
            pushBlobFan(mode, maxRadius * 0.7, 0.4, mode.vol * 0.25 * (1.0 + plasma * 0.5), driftOffset);

            // Layer 2: Mid-Aura
            pushBlobFan(mode, maxRadius * 0.5, 0.3, mode.vol * 0.45 * (1.0 + plasma * 0.3), driftOffset);

            // Layer 3: The Nucleus (Solid Glowing Inner Core)
            if (nucleus > 0.05) {
                pushBlobFan(mode, maxRadius * 0.25 * nucleus, 0.1, mode.vol * 0.85, driftOffset * 1.5);
            }
        });

        // Upload geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, memory.awgl_vbo as WebGLBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vData.subarray(0, vPtr));

        // Render pass with screen/additive blending
        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Screen/additive glow

        gl.clearColor(0.01, 0.01, 0.02, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.awgl_prog as WebGLProgram);
        gl.bindVertexArray(memory.awgl_vao as WebGLVertexArrayObject);

        const locs = memory.awgl_locs as Record<string, WebGLUniformLocation>;
        gl.uniform2f(locs.resolution, w, h);

        const cxNorm = (cx / w) * 2.0 - 1.0;
        const cyNorm = -((cy / h) * 2.0 - 1.0);
        gl.uniform2f(locs.center, cxNorm, cyNorm);

        gl.uniform1f(locs.masterOpacity, masterOpacity);
        gl.uniform1f(locs.kaleidoscope, getVal(cfg.kaleidoscope, 0));
        gl.uniform1f(locs.crystalline, getVal(cfg.crystallineLayer, 0));

        // Draw each triangle fan
        batches.forEach(b => {
            gl.drawArrays(gl.TRIANGLE_FAN, b.start, b.count);
        });
    },

    cleanup: ({ gl, memory }) => {
        if (!gl) return;
        if (memory.awgl_prog) gl.deleteProgram(memory.awgl_prog as WebGLProgram);
        if (memory.awgl_vbo) gl.deleteBuffer(memory.awgl_vbo as WebGLBuffer);
        if (memory.awgl_vao) (gl as WebGL2RenderingContext).deleteVertexArray(memory.awgl_vao as WebGLVertexArrayObject);
        delete memory.awgl_prog;
        delete memory.awgl_vbo;
        delete memory.awgl_vao;
        delete memory.awgl_locs;
        delete memory.awgl_vdata;
    }
};
