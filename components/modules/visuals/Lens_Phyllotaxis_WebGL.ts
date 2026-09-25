import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyHSL } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const GOLDEN_ANGLE = 137.5077640500378 * (Math.PI / 180);

const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const PRESETS: VisualizerPreset[] = [
    {
        id: 'bloom_gl_1',
        name: '01. Golden Sunflower Vortex',
        config: {
            seedCount: 3000, spreadFactor: 4.8, spiralAngle: 0.0, growthExponent: 0.5, petalSymmetry: 0,
            angleModulation: 0.0, vortexPinch: 0.0, minBrightness: 0.5, colorShiftSpeed: 0.2, colorDynamics: 0.4,
            colorGain: 2.2, saturation: 1.0, contrast: 1.0, waveDensity: 12.0, waveSpeed: 1.8, rotationSpeed: 0.2,
            agitation: 0.5, particleSize: 2.5, coreSize: 35, coreOpacity: 1.0, masterOpacity: 1.0, visualScale: 1.0
        }
    },
    {
        id: 'bloom_gl_2',
        name: '02. Sacred Lotus Mandala',
        config: {
            seedCount: 2500, spreadFactor: 5.2, spiralAngle: 0.5, growthExponent: 0.52, petalSymmetry: 8,
            angleModulation: 1.2, vortexPinch: 0.15, minBrightness: 0.6, colorShiftSpeed: -0.1, colorDynamics: 0.8,
            colorGain: 2.5, saturation: 1.2, contrast: 1.1, waveDensity: 16.0, waveSpeed: 2.2, rotationSpeed: 0.15,
            agitation: 0.8, particleSize: 2.8, coreSize: 45, coreOpacity: 1.0, masterOpacity: 1.0, visualScale: 1.0
        }
    },
    {
        id: 'bloom_gl_3',
        name: '03. Cosmic Dahlia Pulse',
        config: {
            seedCount: 3500, spreadFactor: 4.0, spiralAngle: -0.2, growthExponent: 0.48, petalSymmetry: 12,
            angleModulation: 2.0, vortexPinch: 0.25, minBrightness: 0.4, colorShiftSpeed: 0.5, colorDynamics: 0.9,
            colorGain: 2.8, saturation: 1.4, contrast: 1.2, waveDensity: 20.0, waveSpeed: 2.5, rotationSpeed: 0.3,
            agitation: 1.0, particleSize: 2.2, coreSize: 25, coreOpacity: 1.0, masterOpacity: 1.0, visualScale: 1.0
        }
    }
];

const VS = `#version 300 es
in float a_index;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_maxRadius;
uniform float u_visualScale;
uniform float u_seedCount;
uniform float u_spreadFactor;
uniform float u_spiralAngle;
uniform float u_growthExponent;
uniform float u_petalSymmetry;
uniform float u_angleModulation;
uniform float u_vortexPinch;
uniform float u_waveDensity;
uniform float u_waveSpeed;
uniform float u_rotationSpeed;
uniform float u_agitation;
uniform float u_particleSize;
uniform float u_coreSize;
uniform float u_coreOpacity;
uniform float u_colorShift;
uniform float u_colorDynamics;
uniform float u_saturation;
uniform float u_contrast;
uniform float u_colorGain;
uniform float u_minBrightness;
uniform float u_audioAmp;
uniform float u_prismCorrection;
uniform float u_kaleidoscope;
uniform float u_crystalline;

out vec4 v_color;
out float v_isCore;

${KALEIDOSCOPE_GLSL_FUNCS}

const float GOLDEN_ANGLE = 2.39996322972865332; // ~137.508 degrees in radians
const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float n = a_index;
    if (n >= u_seedCount) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
    }

    bool isCore = n < u_coreSize;
    v_isCore = isCore ? 1.0 : 0.0;

    float effectiveAngle = GOLDEN_ANGLE + (u_spiralAngle * (PI / 180.0));
    float currentRotation = u_time * u_rotationSpeed;

    // Radius matching Lens_Phyllotaxis
    float r = u_spreadFactor * pow(n, u_growthExponent) + (u_maxRadius * u_vortexPinch);
    if (r > u_maxRadius) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
    }

    float distNorm = clamp(r / u_maxRadius, 0.0, 1.0);
    float angleWarp = u_angleModulation > 0.0 ? sin(distNorm * 10.0 - u_time * u_waveSpeed) * u_angleModulation : 0.0;
    float theta = n * effectiveAngle + currentRotation + (isCore ? 0.0 : angleWarp);

    vec2 localPixel = vec2(r * cos(theta), r * sin(theta)) * u_visualScale;
    vec2 ndcPos = vec2(localPixel.x / (u_resolution.x * 0.5), -localPixel.y / (u_resolution.y * 0.5));

    if (u_kaleidoscope > 1.5) {
        ndcPos = applyKaleidoscopeFold(ndcPos, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        ndcPos = applyCrystallineLayer(ndcPos, u_crystalline);
    }

    ndcPos += u_center;
    gl_Position = vec4(ndcPos, 0.0, 1.0);

    if (isCore) {
        // Luminous Radiant Core Seed
        v_color = vec4(1.0, 1.0, 1.0, u_coreOpacity);
        gl_PointSize = max(2.0, (u_particleSize * 2.2) * u_visualScale);
    } else {
        // Outer Dynamic Reactive Seed
        float physicalPhase = (distNorm * u_waveDensity) - (u_time * u_waveSpeed);
        float ripple = (sin(physicalPhase) + 1.0) * 0.5;
        if (u_contrast != 1.0) ripple = pow(ripple, max(0.2, u_contrast));

        float size = u_particleSize * (1.0 + (distNorm * 2.0));
        size += ripple * (u_agitation * 4.0 * u_particleSize) * (0.2 + u_audioAmp);
        if (u_petalSymmetry >= 1.0) {
            float symmetryMod = 0.5 + 0.5 * cos(theta * floor(u_petalSymmetry));
            size *= (0.2 + 0.8 * symmetryMod);
        }
        size *= u_visualScale;
        gl_PointSize = max(1.0, size * 1.5);

        // Chromatic Color Progression
        float hue = fract(distNorm * 1.2 + u_colorShift + (distNorm * u_colorDynamics));
        float chVal = ripple;
        float baseIntensity = u_minBrightness + (chVal * (1.0 - u_minBrightness));
        float finalIntensity = (baseIntensity + u_audioAmp * 0.3) * u_colorGain;

        vec3 rgb = hsv2rgb(vec3(hue, u_saturation, min(1.0, finalIntensity)));

        // Prism correction: subtract white light
        if (u_prismCorrection > 0.0) {
            float whiteVal = min(rgb.r, min(rgb.g, rgb.b));
            rgb -= whiteVal * u_prismCorrection;
        }

        float edgeFade = clamp((1.0 - distNorm) * 8.0, 0.0, 1.0);
        float alpha = clamp(finalIntensity * 0.7 * edgeFade, 0.0, 1.0);
        v_color = vec4(rgb, alpha);
    }
}`;

const FS = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_isCore;
out vec4 fragColor;

uniform float u_masterOpacity;

void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float distSq = dot(coord, coord);
    if (distSq > 1.0) discard;

    // Smooth Gaussian bead falloff with intense luminous core
    float core = exp(-distSq * 3.5);
    float alpha = core * v_color.a * u_masterOpacity;
    if (alpha <= 0.001) discard;

    if (v_isCore > 0.5) {
        fragColor = vec4(vec3(1.0) * core * 1.5, alpha);
    } else {
        fragColor = vec4(v_color.rgb * core * 1.3, alpha);
    }
}`;

export const Lens_Phyllotaxis_WebGL: VisualizerPlugin = {
    id: 'PHYLLOTAXIS_WEBGL',
    name: 'Bio-Bloom WebGL',
    renderType: 'WEBGL',

    parameters: [
        { id: 'seedCount', label: 'Seed Count', icon: 'Grid', type: 'SLIDER', min: 200, max: 8000, step: 100, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 3000 },
        { id: 'spreadFactor', label: 'Spread Factor', icon: 'Maximize', type: 'SLIDER', min: 0.5, max: 20.0, step: 0.1, color: '#6366f1', section: 'GEOMETRY', defaultValue: 4.8 },
        { id: 'spiralAngle', label: 'Spiral Angle Offset', icon: 'RotateCcw', type: 'SLIDER', min: -5, max: 5, step: 0.05, color: '#e879f9', section: 'GEOMETRY', defaultValue: 0 },
        { id: 'growthExponent', label: 'Growth Exponent', icon: 'ArrowDown', type: 'SLIDER', min: 0.1, max: 1.5, step: 0.05, color: '#818cf8', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'petalSymmetry', label: 'Petal Symmetry', icon: 'Hexagon', type: 'SLIDER', min: 0, max: 24, step: 1, color: '#a855f7', section: 'PHYSICS', defaultValue: 0 },
        { id: 'angleModulation', label: 'Petal Curvature', icon: 'MoveDiagonal', type: 'SLIDER', min: 0, max: 4.0, step: 0.1, color: '#38bdf8', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'vortexPinch', label: 'Eye of Vortex', icon: 'Minimize2', type: 'SLIDER', min: 0, max: 0.6, step: 0.01, color: '#06b6d4', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'minBrightness', label: 'Min Brightness', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#f59e0b', section: 'LIGHT', defaultValue: 0.5 },
        { id: 'colorShiftSpeed', label: 'Color Shift Speed', icon: 'Palette', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#ec4899', section: 'LIGHT', defaultValue: 0.2 },
        { id: 'colorDynamics', label: 'Color Dynamics', icon: 'Rainbow', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#f43f5e', section: 'LIGHT', defaultValue: 0.4 },
        { id: 'colorGain', label: 'Color Gain', icon: 'Flame', type: 'SLIDER', min: 0.5, max: 4.0, step: 0.1, color: '#f97316', section: 'LIGHT', defaultValue: 2.2 },
        { id: 'saturation', label: 'Saturation', icon: 'Droplet', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#ef4444', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'contrast', label: 'Contrast Curve', icon: 'Sliders', type: 'SLIDER', min: 0.5, max: 3.0, step: 0.1, color: '#84cc16', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'waveDensity', label: 'Ripple Density', icon: 'Activity', type: 'SLIDER', min: 1.0, max: 40.0, step: 0.5, color: '#10b981', section: 'PHYSICS', defaultValue: 12.0 },
        { id: 'waveSpeed', label: 'Wave Speed', icon: 'Zap', type: 'SLIDER', min: -5.0, max: 5.0, step: 0.1, color: '#14b8a6', section: 'PHYSICS', defaultValue: 1.8 },
        { id: 'rotationSpeed', label: 'Axial Rotation', icon: 'RotateCw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#3b82f6', section: 'PHYSICS', defaultValue: 0.2 },
        { id: 'agitation', label: 'Wave Amplitude', icon: 'Volume2', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.1, color: '#a855f7', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'particleSize', label: 'Particle Base Size', icon: 'Circle', type: 'SLIDER', min: 0.5, max: 6.0, step: 0.1, color: '#e879f9', section: 'LIGHT', defaultValue: 2.5 },
        { id: 'coreSize', label: 'Radiant Core Seeds', icon: 'Sun', type: 'SLIDER', min: 0, max: 200, step: 5, color: '#fbcfe8', section: 'LIGHT', defaultValue: 35 },
        { id: 'coreOpacity', label: 'Core Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'prismCorrection', label: 'Prism Correction', icon: 'Sparkles', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#c084fc', section: 'LIGHT', defaultValue: 0.3 },
        { id: 'visualScale', label: 'Zoom Scale', icon: 'Maximize', type: 'SLIDER', min: 0.2, max: 3.0, step: 0.05, color: '#38bdf8', section: 'GEOMETRY', defaultValue: 1.0 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Layers', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'blendMode', label: 'Blend Mode', icon: 'Blend', type: 'SELECT', options: ['NORMAL', 'ADDITIVE'], color: '#ec4899', section: 'GLOBAL', defaultValue: 'ADDITIVE' }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const gl = lensCtx.gl as WebGL2RenderingContext;
        if (!gl) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;
        const { w, h, time, memory, amplitudes, cx, cy } = lensCtx;

        const maxRadius = Math.min(w, h) * 0.48;
        const seedCount = Math.min(8000, Math.max(100, Math.floor(getVal(cfg.seedCount, 3000))));

        if (!memory.phy_prog) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('Phyllotaxis Shader Error:', gl.getShaderInfoLog(s));
                }
                return s;
            };

            memory.phy_prog = gl.createProgram()!;
            gl.attachShader(memory.phy_prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.phy_prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.phy_prog);

            const getLoc = (name: string) => gl.getUniformLocation(memory.phy_prog as WebGLProgram, name);
            memory.phy_locs = {
                time: getLoc('u_time'),
                resolution: getLoc('u_resolution'),
                center: getLoc('u_center'),
                maxRadius: getLoc('u_maxRadius'),
                visualScale: getLoc('u_visualScale'),
                seedCount: getLoc('u_seedCount'),
                spreadFactor: getLoc('u_spreadFactor'),
                spiralAngle: getLoc('u_spiralAngle'),
                growthExponent: getLoc('u_growthExponent'),
                petalSymmetry: getLoc('u_petalSymmetry'),
                angleModulation: getLoc('u_angleModulation'),
                vortexPinch: getLoc('u_vortexPinch'),
                waveDensity: getLoc('u_waveDensity'),
                waveSpeed: getLoc('u_waveSpeed'),
                rotationSpeed: getLoc('u_rotationSpeed'),
                agitation: getLoc('u_agitation'),
                particleSize: getLoc('u_particleSize'),
                coreSize: getLoc('u_coreSize'),
                coreOpacity: getLoc('u_coreOpacity'),
                colorShift: getLoc('u_colorShift'),
                colorDynamics: getLoc('u_colorDynamics'),
                saturation: getLoc('u_saturation'),
                contrast: getLoc('u_contrast'),
                colorGain: getLoc('u_colorGain'),
                minBrightness: getLoc('u_minBrightness'),
                audioAmp: getLoc('u_audioAmp'),
                prismCorrection: getLoc('u_prismCorrection'),
                masterOpacity: getLoc('u_masterOpacity'),
                kaleidoscope: getLoc('u_kaleidoscope'),
                crystalline: getLoc('u_crystalline')
            };

            const maxTotal = 8000;
            const indices = new Float32Array(maxTotal);
            for (let i = 0; i < maxTotal; i++) indices[i] = i;

            memory.phy_buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.phy_buf);
            gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            memory.phy_vao = gl.createVertexArray();
            gl.bindVertexArray(memory.phy_vao);
            const posLoc = gl.getAttribLocation(memory.phy_prog as WebGLProgram, 'a_index');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 1, gl.FLOAT, false, 0, 0);
        }

        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        if (cfg.blendMode === 'NORMAL') {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.phy_prog as WebGLProgram);
        gl.bindVertexArray(memory.phy_vao as WebGLVertexArrayObject);

        const locs = memory.phy_locs as Record<string, WebGLUniformLocation>;
        gl.uniform1f(locs.time, time);
        gl.uniform2f(locs.resolution, w, h);

        const cxNorm = (cx / w) * 2.0 - 1.0;
        const cyNorm = -((cy / h) * 2.0 - 1.0);
        gl.uniform2f(locs.center, cxNorm, cyNorm);

        gl.uniform1f(locs.maxRadius, maxRadius);
        gl.uniform1f(locs.visualScale, getVal(cfg.visualScale, 1.0));
        gl.uniform1f(locs.seedCount, seedCount);
        gl.uniform1f(locs.spreadFactor, getVal(cfg.spreadFactor, 4.8));
        gl.uniform1f(locs.spiralAngle, getVal(cfg.spiralAngle, 0.0));
        gl.uniform1f(locs.growthExponent, getVal(cfg.growthExponent, 0.5));
        gl.uniform1f(locs.petalSymmetry, getVal(cfg.petalSymmetry, 0));
        gl.uniform1f(locs.angleModulation, getVal(cfg.angleModulation, 0.0));
        gl.uniform1f(locs.vortexPinch, getVal(cfg.vortexPinch, 0.0));
        gl.uniform1f(locs.waveDensity, getVal(cfg.waveDensity, 12.0));
        gl.uniform1f(locs.waveSpeed, getVal(cfg.waveSpeed, 1.8));
        gl.uniform1f(locs.rotationSpeed, getVal(cfg.rotationSpeed, 0.2));
        gl.uniform1f(locs.agitation, getVal(cfg.agitation, 0.5));
        gl.uniform1f(locs.particleSize, getVal(cfg.particleSize, 2.5));
        gl.uniform1f(locs.coreSize, getVal(cfg.coreSize, 35));
        gl.uniform1f(locs.coreOpacity, getVal(cfg.coreOpacity, 1.0));

        const colorSpeed = getVal(cfg.colorShiftSpeed, 0.2);
        gl.uniform1f(locs.colorShift, time * colorSpeed * 0.1);
        gl.uniform1f(locs.colorDynamics, getVal(cfg.colorDynamics, 0.4));
        gl.uniform1f(locs.saturation, getVal(cfg.saturation, 1.0));
        gl.uniform1f(locs.contrast, getVal(cfg.contrast, 1.0));
        gl.uniform1f(locs.colorGain, getVal(cfg.colorGain, 2.2));
        gl.uniform1f(locs.minBrightness, getVal(cfg.minBrightness, 0.5));
        gl.uniform1f(locs.prismCorrection, getVal(cfg.prismCorrection, 0.3));

        let totalAmp = 0;
        if (amplitudes) {
            for (const val of amplitudes.values()) totalAmp += val;
        }
        gl.uniform1f(locs.audioAmp, Math.min(2.0, totalAmp * 1.5));
        gl.uniform1f(locs.masterOpacity, getVal(cfg.masterOpacity, 1.0));
        gl.uniform1f(locs.kaleidoscope, getVal(cfg.kaleidoscope, 0));
        gl.uniform1f(locs.crystalline, getVal(cfg.crystallineLayer, 0));

        gl.drawArrays(gl.POINTS, 0, seedCount);
    },

    cleanup: ({ gl, memory }) => {
        if (!gl) return;
        if (memory.phy_prog) gl.deleteProgram(memory.phy_prog as WebGLProgram);
        if (memory.phy_buf) gl.deleteBuffer(memory.phy_buf as WebGLBuffer);
        if (memory.phy_vao) (gl as WebGL2RenderingContext).deleteVertexArray(memory.phy_vao as WebGLVertexArrayObject);
        delete memory.phy_prog;
        delete memory.phy_buf;
        delete memory.phy_vao;
        delete memory.phy_locs;
    }
};
