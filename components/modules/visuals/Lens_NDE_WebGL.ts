import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyHSL } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const PRESETS: VisualizerPreset[] = [
    {
        id: 'nde_gl_1',
        name: '01 Astral Tunnel',
        config: {
            dimensionalFolds: 24, entitySymmetry: 1.0, tunnelTwist: 0.15, coreCollapse: 0.88,
            quantumSpin: 0.5, phaseFluidity: 0.8, streamFlow: 0.5, agitation: 1.0, plasmaBloom: 0.5,
            colorDynamics: 0.2, saturation: 1.0, edgeHardness: 0.5, visualScale: 1.0, masterOpacity: 1.0,
            blendMode: 'ADDITIVE'
        },
        modulations: {
            streamFlow: { enabled: true, min: 0.1, max: 1.0, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD' }
        }
    },
    {
        id: 'nde_gl_2',
        name: '02 DMT Web',
        config: {
            dimensionalFolds: 16, entitySymmetry: 2.5, tunnelTwist: 1.2, coreCollapse: 1.2,
            quantumSpin: 1.5, phaseFluidity: 0.4, streamFlow: 1.2, agitation: 2.5, plasmaBloom: 0.8,
            colorDynamics: 1.5, saturation: 1.5, edgeHardness: 1.2, visualScale: 0.8, masterOpacity: 1.0,
            blendMode: 'ADDITIVE'
        }
    },
    {
        id: 'nde_gl_3',
        name: '03 Cardiac Singularity',
        config: {
            dimensionalFolds: 8, entitySymmetry: 0.5, tunnelTwist: 0.0, coreCollapse: 1.8,
            quantumSpin: 0.1, phaseFluidity: 0.9, streamFlow: 0.2, agitation: 4.0, plasmaBloom: 1.5,
            colorDynamics: 0.1, saturation: 1.2, edgeHardness: 2.0, visualScale: 1.2, masterOpacity: 1.0,
            blendMode: 'ADDITIVE'
        }
    },
    {
        id: 'nde_gl_4',
        name: '04 Event Horizon',
        config: {
            dimensionalFolds: 48, entitySymmetry: 1.0, tunnelTwist: -0.5, coreCollapse: 0.3,
            quantumSpin: 0.2, phaseFluidity: 0.5, streamFlow: -1.5, agitation: 0.5, plasmaBloom: 0.3,
            colorDynamics: 0.8, saturation: 0.6, edgeHardness: 0.3, visualScale: 1.4, masterOpacity: 1.0,
            blendMode: 'ADDITIVE'
        }
    },
    {
        id: 'nde_gl_5',
        name: '05 Quantum Threads',
        config: {
            dimensionalFolds: 32, entitySymmetry: 3.0, tunnelTwist: 0.4, coreCollapse: 1.0,
            quantumSpin: 2.0, phaseFluidity: 1.0, streamFlow: 0.8, agitation: 1.5, plasmaBloom: 0.4,
            colorDynamics: 0.5, saturation: 1.2, edgeHardness: 0.2, visualScale: 1.0, masterOpacity: 1.0,
            blendMode: 'ADDITIVE'
        }
    }
];

const VS = `#version 300 es
in vec2 a_ringRadial; // (layerIndex, radialIndex)

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_dir;
uniform float u_angle;
uniform float u_layersCount;
uniform float u_radialsCount;
uniform float u_zOffset;
uniform float u_steepness;
uniform float u_maxRadius;
uniform float u_visualScale;
uniform float u_agitation;
uniform float u_vol;
uniform float u_twist;
uniform float u_kaleidoscope;
uniform float u_crystalline;
uniform vec4 u_color;

out vec4 v_color;

${KALEIDOSCOPE_GLSL_FUNCS}

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;

void main() {
    float l = a_ringRadial.x;
    float i = a_ringRadial.y;
    float rawLayer = l + u_zOffset;
    float layerNorm = rawLayer / u_layersCount;

    if (layerNorm > 1.05 || layerNorm < 0.01) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
    }

    float depthScale = pow(layerNorm, u_steepness);
    float matrixExpansion = max(0.1, 1.0 + (u_agitation * u_vol * 0.3));
    float r = u_maxRadius * depthScale * u_visualScale * matrixExpansion;

    float rot = (1.0 - layerNorm) * u_twist * TWO_PI * u_dir + (u_angle * u_dir);
    float radAngle = (i / u_radialsCount) * TWO_PI;

    float totalAngle = radAngle + rot;
    vec2 localPos = vec2(r * cos(totalAngle), r * sin(totalAngle));

    vec2 ndcPos = vec2(localPos.x / (u_resolution.x * 0.5), -localPos.y / (u_resolution.y * 0.5));

    if (u_kaleidoscope > 1.5) {
        ndcPos = applyKaleidoscopeFold(ndcPos, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        ndcPos = applyCrystallineLayer(ndcPos, u_crystalline);
    }

    ndcPos += u_center;
    gl_Position = vec4(ndcPos, 0.0, 1.0);
    v_color = u_color;
}`;

const FS = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 fragColor;

uniform float u_masterOpacity;

void main() {
    float alpha = v_color.a * u_masterOpacity;
    if (alpha <= 0.001) discard;
    fragColor = vec4(v_color.rgb * alpha, alpha);
}`;

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    h = (h % 360 + 360) % 360 / 360;
    s = Math.max(0, Math.min(1, s / 100));
    l = Math.max(0, Math.min(1, l / 100));
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
};

const MAX_LAYERS = 48;
const MAX_RADIALS = 48;

export const Lens_NDE_WebGL: VisualizerPlugin = {
    id: 'NDE_WEBGL',
    name: 'Near Death Experience WebGL',
    renderType: 'WEBGL',

    parameters: [
        { id: 'dimensionalFolds', label: 'Dimensional Rings', icon: 'Layers', type: 'SLIDER', min: 4, max: 48, step: 1, color: '#818cf8', section: 'GEOMETRY', defaultValue: 16 },
        { id: 'entitySymmetry', label: 'Spoke Symmetry', icon: 'Sparkles', type: 'SLIDER', min: 0.5, max: 4.0, step: 0.1, color: '#c084fc', section: 'GEOMETRY', defaultValue: 1.0 },
        { id: 'tunnelTwist', label: 'Tunnel Twist', icon: 'RotateCw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#f43f5e', section: 'GEOMETRY', defaultValue: 0.15 },
        { id: 'coreCollapse', label: 'Perspective Steepness', icon: 'Minimize2', type: 'SLIDER', min: 0.1, max: 2.0, step: 0.05, color: '#38bdf8', section: 'GEOMETRY', defaultValue: 0.88 },
        { id: 'streamFlow', label: 'Tunnel Flight Speed', icon: 'Wind', type: 'SLIDER', min: -3.0, max: 3.0, step: 0.05, color: '#34d399', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'quantumSpin', label: 'Counter-Rotation Spin', icon: 'RotateCcw', type: 'SLIDER', min: -3.0, max: 3.0, step: 0.05, color: '#e879f9', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'phaseFluidity', label: 'Phase Fluidity', icon: 'Waves', type: 'SLIDER', min: 0.1, max: 2.0, step: 0.05, color: '#a78bfa', section: 'PHYSICS', defaultValue: 0.8 },
        { id: 'agitation', label: 'Audio Agitation', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 5.0, step: 0.1, color: '#fbbf24', section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'plasmaBloom', label: 'Plasma Aurora Glow', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#f87171', section: 'LIGHT', defaultValue: 0.5 },
        { id: 'colorDynamics', label: 'Color Drift Speed', icon: 'Palette', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.05, color: '#f472b6', section: 'LIGHT', defaultValue: 0.2 },
        { id: 'saturation', label: 'Color Saturation', icon: 'Droplet', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#4ade80', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'visualScale', label: 'Tunnel Zoom', icon: 'Maximize', type: 'SLIDER', min: 0.2, max: 2.5, step: 0.05, color: '#60a5fa', section: 'GEOMETRY', defaultValue: 1.0 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const gl = lensCtx.gl as WebGL2RenderingContext;
        if (!gl) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;
        const { w, h, time, memory, frequencies, amplitudes, cx, cy } = lensCtx;

        const layersCount = Math.min(MAX_LAYERS, Math.max(4, Math.floor(getVal(cfg.dimensionalFolds, 16))));
        const symmetry = getVal(cfg.entitySymmetry, 1.0);
        const radialsCount = Math.min(MAX_RADIALS, Math.max(4, Math.floor(symmetry * 12)));

        if (!memory.nde_prog) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('NDE Shader Error:', gl.getShaderInfoLog(s));
                }
                return s;
            };

            memory.nde_prog = gl.createProgram()!;
            gl.attachShader(memory.nde_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.nde_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.nde_prog);

            const getLoc = (name: string) => gl.getUniformLocation(memory.nde_prog as WebGLProgram, name);
            memory.nde_locs = {
                resolution: getLoc('u_resolution'),
                center: getLoc('u_center'),
                dir: getLoc('u_dir'),
                angle: getLoc('u_angle'),
                layersCount: getLoc('u_layersCount'),
                radialsCount: getLoc('u_radialsCount'),
                zOffset: getLoc('u_zOffset'),
                steepness: getLoc('u_steepness'),
                maxRadius: getLoc('u_maxRadius'),
                visualScale: getLoc('u_visualScale'),
                agitation: getLoc('u_agitation'),
                vol: getLoc('u_vol'),
                twist: getLoc('u_twist'),
                kaleidoscope: getLoc('u_kaleidoscope'),
                crystalline: getLoc('u_crystalline'),
                color: getLoc('u_color'),
                masterOpacity: getLoc('u_masterOpacity')
            };

            // Allocate full grid of (l, i) vertices: (MAX_LAYERS + 2) * (MAX_RADIALS + 1)
            const numGridLayers = MAX_LAYERS + 2;
            const numGridRadials = MAX_RADIALS + 1;
            const verts = new Float32Array(numGridLayers * numGridRadials * 2);
            let ptr = 0;
            for (let l = 0; l < numGridLayers; l++) {
                for (let i = 0; i < numGridRadials; i++) {
                    verts[ptr++] = l;
                    verts[ptr++] = i;
                }
            }

            memory.nde_vbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.nde_vbuf);
            gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

            memory.nde_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.nde_vao);
            const posLoc = gl.getAttribLocation(memory.nde_prog as WebGLProgram, 'a_ringRadial');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            // Preallocate element buffer for max rings and spokes
            memory.nde_ibuf = gl.createBuffer();
            memory.nde_lastGrid = '';
        }

        // Check if index buffer needs updating due to changing layer/radial counts
        const gridKey = `${layersCount}_${radialsCount}`;
        if (memory.nde_lastGrid !== gridKey) {
            const numGridRadials = MAX_RADIALS + 1;
            const indices: number[] = [];

            // 1. Rings
            for (let l = 0; l <= layersCount + 1; l++) {
                const ringBase = l * numGridRadials;
                for (let i = 0; i < radialsCount; i++) {
                    indices.push(ringBase + i, ringBase + i + 1);
                }
            }
            // 2. Spokes
            for (let i = 0; i < radialsCount; i++) {
                for (let l = 0; l < layersCount + 1; l++) {
                    const i0 = l * numGridRadials + i;
                    const i1 = (l + 1) * numGridRadials + i;
                    indices.push(i0, i1);
                }
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, memory.nde_ibuf as WebGLBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
            memory.nde_indexCount = indices.length;
            memory.nde_lastGrid = gridKey;
        }

        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive luminous moiré overlay

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.nde_prog as WebGLProgram);
        gl.bindVertexArray(memory.nde_vao as WebGLVertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, memory.nde_ibuf as WebGLBuffer);

        const locs = memory.nde_locs as Record<string, WebGLUniformLocation>;
        gl.uniform2f(locs.resolution, w, h);

        const cxNorm = (cx / w) * 2.0 - 1.0;
        const cyNorm = -((cy / h) * 2.0 - 1.0);
        gl.uniform2f(locs.center, cxNorm, cyNorm);

        const travelSpeed = getVal(cfg.streamFlow, 0.5);
        const zOffset = (time * travelSpeed * 2.0) % 1.0;
        const steepness = 1.5 - (getVal(cfg.coreCollapse, 0.88) * 0.5);
        const maxRadius = Math.min(w, h) * 0.65;
        const visualScale = getVal(cfg.visualScale, 1.0);
        const agitation = getVal(cfg.agitation, 1.0);
        const twist = getVal(cfg.tunnelTwist, 0.15);
        const spin = getVal(cfg.quantumSpin, 0.5);
        const colorSpeed = getVal(cfg.colorDynamics, 0.2);
        const satVal = getVal(cfg.saturation, 1.0);
        const masterOpacity = getVal(cfg.masterOpacity, 1.0);

        gl.uniform1f(locs.layersCount, layersCount);
        gl.uniform1f(locs.radialsCount, radialsCount);
        gl.uniform1f(locs.zOffset, zOffset);
        gl.uniform1f(locs.steepness, steepness);
        gl.uniform1f(locs.maxRadius, maxRadius);
        gl.uniform1f(locs.visualScale, visualScale);
        gl.uniform1f(locs.agitation, agitation);
        gl.uniform1f(locs.twist, twist);
        gl.uniform1f(locs.masterOpacity, masterOpacity);
        gl.uniform1f(locs.kaleidoscope, getVal(cfg.kaleidoscope, 0));
        gl.uniform1f(locs.crystalline, getVal(cfg.crystallineLayer, 0));

        // Derive active frequencies and counter-rotating pass properties (matching Lens_NDE exactly)
        let primaryAmp = 0.5;
        let secondaryAmp = 0.4;
        let baseHueA = 220;
        let baseHueB = 280;

        if (frequencies && amplitudes) {
            let primaryFreq = 0;
            let secondaryFreq = 0;
            for (let i = 0; i < LATTICE_CHANNELS.length; i++) {
                const ch = LATTICE_CHANNELS[i];
                const freq = frequencies.get(ch) || 0;
                const amp = amplitudes.get(ch) || 0;
                if (amp > primaryAmp) {
                    secondaryAmp = primaryAmp;
                    secondaryFreq = primaryFreq;
                    primaryAmp = amp;
                    primaryFreq = freq;
                } else if (amp > secondaryAmp) {
                    secondaryAmp = amp;
                    secondaryFreq = freq;
                }
            }
            if (primaryFreq > 0) {
                const hsl = getFrequencyHSL(primaryFreq);
                baseHueA = hsl.h;
            }
            if (secondaryFreq > 0) {
                const hsl = getFrequencyHSL(secondaryFreq);
                baseHueB = hsl.h;
            }
        }

        const passes = [
            { dir: 1.0, angle: time * spin, vol: primaryAmp, hue: baseHueA },
            { dir: -1.0, angle: time * spin * 0.9 + 0.5, vol: secondaryAmp, hue: baseHueB }
        ];

        const indexCount = memory.nde_indexCount as number;

        // Draw Pass 0 (Forward Spin) and Pass 1 (Reverse Spin) -> Authentic Optical Moiré Interference
        for (const pass of passes) {
            const currentHue = (pass.hue + time * 50 * colorSpeed) % 360;
            const sat = Math.max(20, Math.min(100, 70 * satVal + pass.vol * 30));
            const light = Math.max(30, Math.min(95, 50 + pass.vol * 25));
            const [r, g, b] = hslToRgb(currentHue, sat, light);
            const alpha = Math.max(0.15, Math.min(0.9, pass.vol * 1.2));

            gl.uniform1f(locs.dir, pass.dir);
            gl.uniform1f(locs.angle, pass.angle);
            gl.uniform1f(locs.vol, pass.vol);
            gl.uniform4f(locs.color, r, g, b, alpha);

            gl.drawElements(gl.LINES, indexCount, gl.UNSIGNED_SHORT, 0);
        }
    },

    cleanup: ({ gl, memory }) => {
        if (!gl) return;
        if (memory.nde_prog) gl.deleteProgram(memory.nde_prog as WebGLProgram);
        if (memory.nde_vbuf) gl.deleteBuffer(memory.nde_vbuf as WebGLBuffer);
        if (memory.nde_ibuf) gl.deleteBuffer(memory.nde_ibuf as WebGLBuffer);
        if (memory.nde_vao) (gl as WebGL2RenderingContext).deleteVertexArray(memory.nde_vao as WebGLVertexArrayObject);
        delete memory.nde_prog;
        delete memory.nde_vbuf;
        delete memory.nde_ibuf;
        delete memory.nde_vao;
        delete memory.nde_locs;
        delete memory.nde_lastGrid;
        delete memory.nde_indexCount;
    }
};
