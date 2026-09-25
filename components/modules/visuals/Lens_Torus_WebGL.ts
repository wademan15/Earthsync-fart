import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyHSL } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const PHI = 1.61803398875;

const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const getStr = (v: unknown, fallback: string): string => {
    if (v === undefined || v === null || v === '') return fallback;
    return String(v);
};

const PRESETS: VisualizerPreset[] = [
    {
        id: 'torus_gl_1',
        name: '01 Golden Implosion',
        config: {
            masterOpacity: 1, guideOpacity: 0.2, reactivity: 0.5, force: 1.0, blendMode: 'ADDITIVE',
            streamFlow: 0.5, harmonicSpacing: 0.5, bloomStrength: 0, colorDynamics: 0.75, colorShiftSpeed: 0.5,
            vortexPinch: 80, coreSize: 300, fractalDepth: 12, quantumSpin: 0.4, tunnelTwist: -0.2,
            neonFactor: 1.8, saturation: 1.2, cameraPitch: 0.35, cameraYaw: 0.0, cameraRoll: 0, cameraZoom: 0.8
        },
        modulations: {
            streamFlow: { enabled: true, min: 0, max: 1.5, amtBreath: 1, curve: 'EASE_IN_OUT', mixMode: 'ADD' }
        }
    },
    {
        id: 'torus_gl_2',
        name: '02 Spectral Loom',
        config: {
            masterOpacity: 1, reactivity: 0.8, force: 1.5, blendMode: 'ADDITIVE', streamFlow: 1.5,
            harmonicSpacing: 0.6, bloomStrength: 0.5, colorDynamics: 1.0, colorShiftSpeed: 0.5, vortexPinch: 150,
            coreSize: 400, fractalDepth: 12, quantumSpin: 0.5, tunnelTwist: 0.2, neonFactor: 2.5, saturation: 1.5,
            cameraPitch: 0.3, cameraYaw: 0, cameraRoll: 0, cameraZoom: 1.0
        }
    },
    {
        id: 'torus_gl_3',
        name: '03 Quantum Singularity',
        config: {
            masterOpacity: 0.9, reactivity: 0.3, force: 1.0, blendMode: 'NORMAL', streamFlow: -0.5,
            harmonicSpacing: 0.5, bloomStrength: 0, colorDynamics: 0.2, colorShiftSpeed: 0.1, vortexPinch: 50,
            coreSize: 350, fractalDepth: 16, quantumSpin: -0.1, tunnelTwist: 1.5, neonFactor: 1.2, saturation: 0.8,
            cameraPitch: 0, cameraYaw: 0, cameraRoll: 0, cameraZoom: 0.7
        }
    }
];

const VS = `#version 300 es
in float a_index;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_cameraZoom;
uniform float u_cameraPitch;
uniform float u_cameraYaw;
uniform float u_cameraRoll;
uniform float u_fractalDepth;
uniform float u_majorR;
uniform float u_minorR;
uniform float u_layerSpacing;
uniform float u_tunnelTwist;
uniform float u_streamFlow;
uniform float u_quantumSpin;
uniform float u_neonFactor;
uniform float u_colorDynamics;
uniform float u_colorShift;
uniform float u_saturation;
uniform float u_audioAmp;
uniform float u_kaleidoscope;
uniform float u_crystalline;

out vec4 v_color;
out float v_depth;

${KALEIDOSCOPE_GLSL_FUNCS}

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float PHI = 1.61803398875;

const float U_SEGS = 48.0;
const float V_SEGS = 14.0;
const float TORUS_VERTS = (48.0 + 1.0) * (14.0 + 1.0); // 735
const float SPIRAL_SEGS = 480.0;
const float LAYER_VERTS = TORUS_VERTS + SPIRAL_SEGS + 1.0; // 1216

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float layerIdx = floor(a_index / LAYER_VERTS);
    if (layerIdx >= u_fractalDepth) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
    }

    float vertInLayer = mod(a_index, LAYER_VERTS);
    float implosionOffset = mod(u_time * u_streamFlow, 1.0);
    float continuousI = layerIdx + implosionOffset;

    float scale = pow(PHI, -(continuousI * u_layerSpacing));
    float layerSpin = u_time * u_quantumSpin + (u_tunnelTwist * continuousI * PHI * 0.2);

    float R = u_majorR * scale;
    float r = max(0.1, u_minorR * (1.0 + u_audioAmp * 0.5)) * scale;

    vec3 localPos = vec3(0.0);
    bool isSpiral = vertInLayer >= TORUS_VERTS;

    if (!isSpiral) {
        // Torus Wireframe Grid: Longitudinal loops & Latitudinal rings
        float vIdx = floor(vertInLayer / (U_SEGS + 1.0));
        float uIdx = mod(vertInLayer, (U_SEGS + 1.0));

        float angleV = (vIdx / V_SEGS) * TWO_PI;
        float angleU = (uIdx / U_SEGS) * TWO_PI;

        localPos.x = (R + r * cos(angleV)) * cos(angleU);
        localPos.y = (R + r * cos(angleV)) * sin(angleU);
        localPos.z = r * sin(angleV);
    } else {
        // Authentic Fibonacci Torus Knot Spiral (windsV = 8, windsU = 13)
        float sIdx = vertInLayer - TORUS_VERTS;
        float sProgress = sIdx / SPIRAL_SEGS;
        float windsV = 8.0;
        float windsU = 13.0;
        float angleV = sProgress * TWO_PI * windsV + (u_time * 0.4);
        float angleU = sProgress * TWO_PI * windsU + (u_time * 0.4 * PHI);

        float spiral_r = r * 1.05;
        localPos.x = (R + spiral_r * cos(angleV)) * cos(angleU);
        localPos.y = (R + spiral_r * cos(angleV)) * sin(angleU);
        localPos.z = spiral_r * sin(angleV);
    }

    // 3D Rotations (matching Lens_Torus exactly)
    // 1. Layer Spin around Z
    float cSpin = cos(layerSpin), sSpin = sin(layerSpin);
    vec3 p = vec3(localPos.x * cSpin - localPos.y * sSpin, localPos.x * sSpin + localPos.y * cSpin, localPos.z);

    // 2. Pitch around X
    float cX = cos(u_cameraPitch), sX = sin(u_cameraPitch);
    p = vec3(p.x, p.y * cX - p.z * sX, p.y * sX + p.z * cX);

    // 3. Yaw around Y
    float cY = cos(u_cameraYaw), sY = sin(u_cameraYaw);
    p = vec3(p.x * cY + p.z * sY, p.y, -p.x * sY + p.z * cY);

    // 4. Roll around Z
    float cZ = cos(u_cameraRoll), sZ = sin(u_cameraRoll);
    p = vec3(p.x * cZ - p.y * sZ, p.x * sZ + p.y * cZ, p.z);

    // Camera space projection
    p.z += 600.0;
    float dist = max(10.0, p.z);
    float focalLength = 410.0;
    float projScale = (focalLength / dist) * u_cameraZoom;

    // Convert to pixel space then to clip coordinates [-1, 1]
    vec2 pixelPos = p.xy * projScale;
    vec2 ndcPos = vec2((pixelPos.x / (u_resolution.x * 0.5)), -(pixelPos.y / (u_resolution.y * 0.5)));

    if (u_kaleidoscope > 1.5) {
        ndcPos = applyKaleidoscopeFold(ndcPos, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        ndcPos = applyCrystallineLayer(ndcPos, u_crystalline);
    }

    ndcPos += u_center;
    gl_Position = vec4(ndcPos, clamp(dist / 1200.0, 0.0, 1.0), 1.0);

    // Dynamic Spectral Shading matching Lens_Torus
    float layerHue = fract(0.61 + u_colorShift + continuousI * u_colorDynamics * 0.16);
    float finalHue = isSpiral ? fract(layerHue + 0.11) : layerHue;
    float baseSat = clamp(0.85 * u_saturation, 0.0, 1.0);
    float depthFade = clamp(1.0 - (continuousI / max(1.0, u_fractalDepth)), 0.1, 1.0);
    float lineLightness = isSpiral ? 0.95 : (0.45 + depthFade * 0.35);

    vec3 rgb = hsv2rgb(vec3(finalHue, baseSat, lineLightness * u_neonFactor));
    float alpha = isSpiral ? 0.95 : (0.55 * depthFade);
    v_color = vec4(rgb * (1.0 + u_audioAmp * 0.3), alpha);
    v_depth = dist;
}`;

const FS = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_depth;
out vec4 fragColor;

uniform float u_masterOpacity;

void main() {
    float alpha = v_color.a * u_masterOpacity;
    if (alpha <= 0.001) discard;
    fragColor = vec4(v_color.rgb * alpha, alpha);
}`;

export const Lens_Torus_WebGL: VisualizerPlugin = {
    id: 'TORUS_WEBGL',
    name: 'Cosmic Torus WebGL',
    renderType: 'WEBGL',

    parameters: [
        { id: 'cameraZoom', label: 'Camera Zoom', icon: 'Maximize', type: 'SLIDER', min: 0.1, max: 2.0, step: 0.01, color: '#f87171', section: 'GEOMETRY', defaultValue: 0.65 },
        { id: 'cameraPitch', label: 'Camera Pitch', icon: 'MoveVertical', type: 'SLIDER', min: -1.57, max: 1.57, step: 0.05, color: '#ec4899', section: 'GEOMETRY', defaultValue: 0.4 },
        { id: 'cameraYaw', label: 'Camera Yaw', icon: 'MoveHorizontal', type: 'SLIDER', min: -3.14, max: 3.14, step: 0.05, color: '#f43f5e', section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'fractalDepth', label: 'Nested Layers', icon: 'Layers', type: 'SLIDER', min: 1, max: 16, step: 1, color: '#818cf8', section: 'GEOMETRY', defaultValue: 10 },
        { id: 'coreSize', label: 'Major Radius (R)', icon: 'Circle', type: 'SLIDER', min: 50, max: 1000, step: 10, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 320 },
        { id: 'vortexPinch', label: 'Minor Radius (r)', icon: 'Target', type: 'SLIDER', min: 10, max: 500, step: 5, color: '#34d399', section: 'GEOMETRY', defaultValue: 85 },
        { id: 'tunnelTwist', label: 'Vortex Twist', icon: 'RotateCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#a855f7', section: 'GEOMETRY', defaultValue: 0.15 },
        { id: 'harmonicSpacing', label: 'Layer Spacing', icon: 'Maximize', type: 'SLIDER', min: 0.1, max: 2.0, step: 0.05, color: '#34d399', section: 'GEOMETRY', defaultValue: 0.5 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Sun', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#ec4899', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'streamFlow', label: 'Implosion Speed', icon: 'Wind', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#2dd4bf', section: 'PHYSICS', defaultValue: 0.3 },
        { id: 'quantumSpin', label: 'Axial Spin', icon: 'RotateCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#a855f7', section: 'PHYSICS', defaultValue: 0.15 },
        { id: 'force', label: 'Audio Reactivity', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.05, color: '#e879f9', section: 'PHYSICS', defaultValue: 1.2 },
        { id: 'neonFactor', label: 'Line Glow', icon: 'Sun', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.05, color: '#fde047', section: 'LIGHT', defaultValue: 1.8 },
        { id: 'colorShiftSpeed', label: 'Hue Drift Speed', icon: 'RefreshCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#fbbf24', section: 'LIGHT', defaultValue: 0.2 },
        { id: 'colorDynamics', label: 'Layer Hue Offset', icon: 'Palette', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ec4899', section: 'LIGHT', defaultValue: 0.15 },
        { id: 'saturation', label: 'Saturation', icon: 'Droplet', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#ef4444', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const gl = lensCtx.gl as WebGL2RenderingContext;
        if (!gl) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;
        const { w, h, time, memory, amplitudes, cx, cy } = lensCtx;

        const layers = Math.min(16, Math.max(1, Math.floor(getVal(cfg.fractalDepth, 10))));
        const U_SEGS = 48;
        const V_SEGS = 14;
        const TORUS_VERTS = (U_SEGS + 1) * (V_SEGS + 1); // 735
        const SPIRAL_SEGS = 480;
        const vertsPerLayer = TORUS_VERTS + SPIRAL_SEGS + 1; // 1216

        if (!memory.tor_prog) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('Torus Shader Error:', gl.getShaderInfoLog(s));
                }
                return s;
            };

            memory.tor_prog = gl.createProgram()!;
            gl.attachShader(memory.tor_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.tor_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.tor_prog);

            const getLoc = (name: string) => gl.getUniformLocation(memory.tor_prog as WebGLProgram, name);
            memory.tor_locs = {
                time: getLoc('u_time'),
                resolution: getLoc('u_resolution'),
                center: getLoc('u_center'),
                cameraZoom: getLoc('u_cameraZoom'),
                cameraPitch: getLoc('u_cameraPitch'),
                cameraYaw: getLoc('u_cameraYaw'),
                cameraRoll: getLoc('u_cameraRoll'),
                fractalDepth: getLoc('u_fractalDepth'),
                majorR: getLoc('u_majorR'),
                minorR: getLoc('u_minorR'),
                layerSpacing: getLoc('u_layerSpacing'),
                tunnelTwist: getLoc('u_tunnelTwist'),
                streamFlow: getLoc('u_streamFlow'),
                quantumSpin: getLoc('u_quantumSpin'),
                neonFactor: getLoc('u_neonFactor'),
                colorDynamics: getLoc('u_colorDynamics'),
                colorShift: getLoc('u_colorShift'),
                saturation: getLoc('u_saturation'),
                audioAmp: getLoc('u_audioAmp'),
                masterOpacity: getLoc('u_masterOpacity'),
                kaleidoscope: getLoc('u_kaleidoscope'),
                crystalline: getLoc('u_crystalline')
            };

            const maxTotal = 16 * vertsPerLayer;
            const vertexIndices = new Float32Array(maxTotal);
            for (let i = 0; i < maxTotal; i++) vertexIndices[i] = i;

            memory.tor_buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.tor_buf);
            gl.bufferData(gl.ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);

            memory.tor_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.tor_vao);
            const posLoc = gl.getAttribLocation(memory.tor_prog as WebGLProgram, 'a_index');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 1, gl.FLOAT, false, 0, 0);

            // Precompute index buffer for wireframe loops, ribs, and knot line strips
            const lineIndices: number[] = [];
            for (let l = 0; l < 16; l++) {
                const base = l * vertsPerLayer;
                // Longitudinal loops
                for (let v = 0; v <= V_SEGS; v++) {
                    for (let u = 0; u < U_SEGS; u++) {
                        lineIndices.push(base + v * (U_SEGS + 1) + u, base + v * (U_SEGS + 1) + u + 1);
                    }
                }
                // Latitudinal rings (every 3rd step)
                for (let u = 0; u <= U_SEGS; u += 3) {
                    for (let v = 0; v < V_SEGS; v++) {
                        lineIndices.push(base + v * (U_SEGS + 1) + u, base + (v + 1) * (U_SEGS + 1) + u);
                    }
                }
                // Fibonacci Knot spiral
                const spiralBase = base + TORUS_VERTS;
                for (let s = 0; s < SPIRAL_SEGS; s++) {
                    lineIndices.push(spiralBase + s, spiralBase + s + 1);
                }
            }
            memory.tor_indicesPerLayer = lineIndices.length / 16;

            memory.tor_ibuf = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, memory.tor_ibuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), gl.STATIC_DRAW);
        }

        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive luminous neon lines

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.tor_prog as WebGLProgram);
        gl.bindVertexArray(memory.tor_vao as WebGLVertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, memory.tor_ibuf as WebGLBuffer);

        const locs = memory.tor_locs as Record<string, WebGLUniformLocation>;
        gl.uniform1f(locs.time, time);
        gl.uniform2f(locs.resolution, w, h);

        const cxNorm = (cx / w) * 2.0 - 1.0;
        const cyNorm = -((cy / h) * 2.0 - 1.0);
        gl.uniform2f(locs.center, cxNorm, cyNorm);

        gl.uniform1f(locs.cameraZoom, getVal(cfg.cameraZoom, 0.45));
        gl.uniform1f(locs.cameraPitch, getVal(cfg.cameraPitch, 0.4));
        gl.uniform1f(locs.cameraYaw, getVal(cfg.cameraYaw, 0.0));
        gl.uniform1f(locs.cameraRoll, getVal(cfg.cameraRoll, 0.0));
        gl.uniform1f(locs.fractalDepth, layers);
        gl.uniform1f(locs.majorR, getVal(cfg.coreSize, 300));
        gl.uniform1f(locs.minorR, getVal(cfg.vortexPinch, 80));
        gl.uniform1f(locs.layerSpacing, getVal(cfg.harmonicSpacing, 0.5));
        gl.uniform1f(locs.tunnelTwist, getVal(cfg.tunnelTwist, 0.15));
        gl.uniform1f(locs.streamFlow, getVal(cfg.streamFlow, 0.2));
        gl.uniform1f(locs.quantumSpin, getVal(cfg.quantumSpin, 0.1));
        gl.uniform1f(locs.neonFactor, getVal(cfg.neonFactor, 1.5));
        gl.uniform1f(locs.colorDynamics, getVal(cfg.colorDynamics, 0.1));

        const hueSpeed = getVal(cfg.colorShiftSpeed, 0.0);
        gl.uniform1f(locs.colorShift, time * hueSpeed * 0.05);
        gl.uniform1f(locs.saturation, getVal(cfg.saturation, 1.0));

        let totalAmp = 0;
        if (amplitudes) {
            for (const val of amplitudes.values()) {
                totalAmp += val;
            }
        }
        gl.uniform1f(locs.audioAmp, Math.min(2.0, totalAmp * getVal(cfg.force, 1.5)));
        gl.uniform1f(locs.masterOpacity, getVal(cfg.masterOpacity, 1.0));
        gl.uniform1f(locs.kaleidoscope, getVal(cfg.kaleidoscope, 0));
        gl.uniform1f(locs.crystalline, getVal(cfg.crystallineLayer, 0));

        const indicesToDraw = layers * (memory.tor_indicesPerLayer as number);
        gl.drawElements(gl.LINES, indicesToDraw, gl.UNSIGNED_SHORT, 0);
    },

    cleanup: ({ gl, memory }) => {
        if (!gl) return;
        if (memory.tor_prog) gl.deleteProgram(memory.tor_prog as WebGLProgram);
        if (memory.tor_buf) gl.deleteBuffer(memory.tor_buf as WebGLBuffer);
        if (memory.tor_ibuf) gl.deleteBuffer(memory.tor_ibuf as WebGLBuffer);
        if (memory.tor_vao) (gl as WebGL2RenderingContext).deleteVertexArray(memory.tor_vao as WebGLVertexArrayObject);
        delete memory.tor_prog;
        delete memory.tor_buf;
        delete memory.tor_ibuf;
        delete memory.tor_vao;
        delete memory.tor_locs;
        delete memory.tor_indicesPerLayer;
    }
};
