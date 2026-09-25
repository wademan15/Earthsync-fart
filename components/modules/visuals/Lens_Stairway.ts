import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyRGB } from './shared';
import { KALEIDOSCOPE_GLSL_FUNCS } from './layers/kaleidoscope2D';

const hexToRgb = (hex: string): [number, number, number] => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return [r / 255.0, g / 255.0, b / 255.0];
};

const PRESETS: Record<string, any> = {
    "01 Golden Ascent": {
        ascentSpeed: 1.0,
        stepWidth: 1.2,
        stepGlow: 1.6,
        portalRadiance: 2.0,
        lightShafts: 1.4,
        nebulaIntensity: 1.0,
        primaryColor: '#fbbf24',
        portalColor: '#fffbeb',
        skyColor: '#0a0600',
        cameraTilt: 0.15,
        stairPattern: 'STRAIGHT'
    },
    "02 Indigo Transcendence": {
        ascentSpeed: 0.8,
        stepWidth: 1.4,
        stepGlow: 1.8,
        portalRadiance: 2.2,
        lightShafts: 1.6,
        nebulaIntensity: 1.2,
        primaryColor: '#818cf8',
        portalColor: '#c084fc',
        skyColor: '#030712',
        cameraTilt: 0.18,
        stairPattern: 'SPIRAL'
    },
    "03 Emerald Sanctuary": {
        ascentSpeed: 0.9,
        stepWidth: 1.1,
        stepGlow: 1.5,
        portalRadiance: 1.9,
        lightShafts: 1.2,
        nebulaIntensity: 0.9,
        primaryColor: '#34d399',
        portalColor: '#a7f3d0',
        skyColor: '#022c22',
        cameraTilt: 0.12,
        stairPattern: 'STRAIGHT'
    },
    "04 Rose Quartz Temple": {
        ascentSpeed: 0.7,
        stepWidth: 1.3,
        stepGlow: 1.7,
        portalRadiance: 2.1,
        lightShafts: 1.5,
        nebulaIntensity: 1.1,
        primaryColor: '#f472b6',
        portalColor: '#fdf2f8',
        skyColor: '#180812',
        cameraTilt: 0.16,
        stairPattern: 'SPIRAL'
    },
    "05 Violet Astral Bridge": {
        ascentSpeed: 1.2,
        stepWidth: 1.5,
        stepGlow: 2.0,
        portalRadiance: 2.4,
        lightShafts: 1.8,
        nebulaIntensity: 1.3,
        primaryColor: '#c084fc',
        portalColor: '#f5d0fe',
        skyColor: '#0f051d',
        cameraTilt: 0.22,
        stairPattern: 'STRAIGHT'
    },
    "06 Diamond Infinity": {
        ascentSpeed: 1.1,
        stepWidth: 1.0,
        stepGlow: 2.0,
        portalRadiance: 2.5,
        lightShafts: 1.8,
        nebulaIntensity: 0.8,
        primaryColor: '#38bdf8',
        portalColor: '#ffffff',
        skyColor: '#020617',
        cameraTilt: 0.14,
        stairPattern: 'SPIRAL'
    }
};

const STAIRWAY_VS = `#version 300 es
precision highp float;
precision highp int;
layout(location = 0) in vec2 a_pos;
out vec2 v_uv;
void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const STAIRWAY_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_ascent;
uniform vec3 u_primaryColor;
uniform vec3 u_portalColor;
uniform vec3 u_skyColor;
uniform float u_stepWidth;
uniform float u_stepGlow;
uniform float u_portalRadiance;
uniform float u_lightShafts;
uniform float u_nebulaIntensity;
uniform float u_cameraTilt;
uniform float u_binauralPulse;
uniform float u_breathWave;
uniform float u_breathEnergy;
uniform float u_audioEnergy;
uniform float u_totalActivity;
uniform int u_isSpiral;
uniform vec2 u_centerOffset;
uniform float u_visualScale;
uniform float u_kaleidoscope;
uniform float u_crystalline;

${KALEIDOSCOPE_GLSL_FUNCS}

// Fast noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.05;
        a *= 0.5;
    }
    return v;
}

// Raymarching Distance Fields
float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

// Scene Map: Staircase + Light Pillars
float mapScene(vec3 p, out float matID, out float stepIndex) {
    float d = 1e5;
    matID = 0.0;
    stepIndex = 0.0;

    // Continuous ascending coordinate
    float zStep = 1.4;
    float yStep = 0.7;
    float totalTravel = u_ascent;

    // Align domain repetition along step height
    float shiftedY = p.y + totalTravel * 0.5;
    float stepIdx = floor(shiftedY / yStep);
    stepIndex = stepIdx;

    float localY = mod(shiftedY, yStep) - yStep * 0.5;
    float expectedZ = stepIdx * zStep - totalTravel;
    float localZ = p.z - expectedZ;

    // Spiral angle modulation if selected
    float xOffset = 0.0;
    if (u_isSpiral == 1) {
        xOffset = sin(stepIdx * 0.25) * 1.8 * u_stepWidth;
    }

    // Step dimensions - gentle dynamic expansion with breath / audio
    float breathMod = u_breathEnergy * (u_breathWave - 0.5) * 0.15;
    float audioMod = u_audioEnergy * 0.08;
    float stepScale = 1.0 + breathMod + audioMod;
    vec3 halfSize = vec3(1.8 * u_stepWidth * stepScale, 0.12, 0.65 * stepScale);
    
    vec3 stepPos = vec3(p.x - xOffset, localY, localZ);
    float dStep = sdBox(stepPos, halfSize);

    // Light Balustrade Pillars on the sides
    vec3 pillar1Pos = vec3(abs(p.x - xOffset) - (halfSize.x + 0.15), localY - 0.4, localZ);
    float dPillar = sdBox(pillar1Pos, vec3(0.06, 0.4, 0.06));

    if (dStep < d) {
        d = dStep;
        matID = 1.0; // Crystal step
    }
    if (dPillar < d) {
        d = dPillar;
        matID = 2.0; // Glowing pillar
    }

    return d;
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    p /= max(0.01, u_visualScale);
    p += u_centerOffset;

    if (u_kaleidoscope > 1.5) {
        p = applyKaleidoscopeFold(p, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        p = applyCrystallineLayer(p, u_crystalline);
    }

    // Camera setup (looking upward towards the celestial portal)
    float tilt = u_cameraTilt + u_breathEnergy * (u_breathWave - 0.5) * 0.03;
    vec3 ro = vec3(0.0, 0.8, -4.5);
    vec3 target = vec3(0.0, 3.5, 12.0);
    target.y += tilt * 6.0;

    vec3 ww = normalize(target - ro);
    vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));
    vec3 vv = cross(ww, uu);
    vec3 rd = normalize(p.x * uu + p.y * vv + 1.3 * ww);

    // --- 1. BACKGROUND CELESTIAL SKY & PORTAL ---
    vec3 portalPos = vec3(0.0, 5.2, 14.0);
    vec3 toPortal = portalPos - ro;
    float portalDist = length(toPortal);
    vec3 portalDir = toPortal / portalDist;

    float portalAlignment = dot(rd, portalDir);
    float portalGlow = max(0.0, portalAlignment);

    // Cosmic Nebula Background (calm, slow drift)
    vec2 nebUV = p * 1.8 + vec2(u_time * 0.008, u_time * 0.005);
    float neb1 = fbm(nebUV * 2.0);
    float neb2 = fbm(nebUV * 4.0 + neb1);
    vec3 nebulaColor = mix(u_skyColor, u_primaryColor * 0.45, neb1 * u_nebulaIntensity);
    nebulaColor += u_portalColor * neb2 * 0.25 * u_nebulaIntensity;

    // Celestial Sun / Portal Aperture (dynamic breathing / binaural resonance)
    float portalAngle = acos(clamp(portalAlignment, -1.0, 1.0));
    float portalCore = smoothstep(0.18, 0.0, portalAngle);
    float activeCoronaMod = 1.0 + u_binauralPulse * 0.3 + u_breathEnergy * (u_breathWave - 0.5) * 0.25;
    float portalCorona = pow(max(0.0, 1.0 - portalAngle * 1.6), 3.5) * activeCoronaMod;
    float portalOuter = pow(max(0.0, 1.0 - portalAngle * 0.8), 2.0) * 0.5 * activeCoronaMod;

    // Volumetric God Rays from Portal
    float rayNoise = fbm(vec2(atan(p.y - 0.25, p.x) * 4.0 + u_time * 0.05, portalAngle * 5.0));
    float godRays = pow(portalGlow, 8.0) * rayNoise * u_lightShafts * (0.6 + u_totalActivity * 0.4);

    vec3 sky = nebulaColor;
    sky += u_portalColor * portalCore * u_portalRadiance * 1.8;
    sky += mix(u_primaryColor, u_portalColor, 0.6) * (portalCorona + godRays) * u_portalRadiance;
    sky += u_primaryColor * portalOuter * 0.6;

    // Shimmering Stars (calm, subtle twinkle)
    float starVal = sin(p.x * 220.0 + u_time * 0.08) * cos(p.y * 220.0);
    if (starVal > 0.982) {
        float twinkle = 0.5 + 0.5 * sin(u_time * 2.0 + p.x * 100.0);
        sky += vec3(1.0, 0.95, 0.9) * twinkle * 0.7;
    }

    // --- 2. RAYMARCHING THE CELESTIAL STAIRWAY ---
    float t = 0.5;
    float maxT = 28.0;
    float matID = 0.0;
    float stepIdx = 0.0;
    float hitMatID = 0.0;
    float hitStep = 0.0;
    bool hit = false;
    vec3 hitPos = vec3(0.0);

    float glowAccum = 0.0;

    for (int i = 0; i < 64; i++) {
        vec3 pos = ro + rd * t;
        float d = mapScene(pos, matID, stepIdx);

        // Soft volumetric stair glow accumulation (peaceful, gentle)
        glowAccum += exp(-d * 3.5) * (0.012 * u_stepGlow);

        if (d < 0.003) {
            hit = true;
            hitMatID = matID;
            hitStep = stepIdx;
            hitPos = pos;
            break;
        }

        t += max(d * 0.7, 0.02);
        if (t > maxT) break;
    }

    vec3 col = sky;

    if (hit) {
        // Compute Normal
        vec2 e = vec2(0.003, 0.0);
        float dummy1, dummy2;
        vec3 n = normalize(vec3(
            mapScene(hitPos + e.xyy, dummy1, dummy2) - mapScene(hitPos - e.xyy, dummy1, dummy2),
            mapScene(hitPos + e.yxy, dummy1, dummy2) - mapScene(hitPos - e.yxy, dummy1, dummy2),
            mapScene(hitPos + e.yyx, dummy1, dummy2) - mapScene(hitPos - e.yyx, dummy1, dummy2)
        ));

        // Lighting
        vec3 lightDir = normalize(portalPos - hitPos);
        float diff = max(dot(n, lightDir), 0.0);
        vec3 viewDir = normalize(ro - hitPos);
        vec3 halfV = normalize(lightDir + viewDir);
        float spec = pow(max(dot(n, halfV), 0.0), 32.0);
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

        // Crystal step illumination - calm, steady when idle; responsive when audio/breath is active
        float stepWavePhase = hitStep * 0.4 - u_time * (0.2 + u_audioEnergy * 0.8);
        float stepPulse = (0.5 + 0.5 * sin(stepWavePhase)) * u_totalActivity;
        vec3 crystalBase = mix(u_primaryColor * 0.35, u_portalColor * 0.75, 0.3);
        
        vec3 stepCol = crystalBase * (0.45 + diff * 0.75);
        stepCol += u_portalColor * spec * (0.8 + u_audioEnergy * 1.5);
        stepCol += u_primaryColor * fresnel * (u_stepGlow * 0.9 + u_breathEnergy * 0.5);
        stepCol += u_portalColor * stepPulse * 0.35;

        // Distance fog into celestial radiance
        float fog = smoothstep(6.0, 24.0, t);
        col = mix(stepCol, sky, fog);
    }

    // Add accumulated volumetric glow
    col += u_primaryColor * glowAccum * (0.8 + u_totalActivity * 0.6);

    // Ethereal Bloom Vignette
    float vig = 1.0 - length(p) * 0.3;
    col *= max(0.0, vig);

    // Subtle golden / chromatic warmth
    col = pow(col, vec3(0.94));

    fragColor = vec4(col, 1.0);
}
`;

function buildProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
    const compile = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error("Stairway shader error:", gl.getShaderInfoLog(s));
            gl.deleteShader(s);
            return null;
        }
        return s;
    };

    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    if (prog && vs && fs) {
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) return prog;
        console.error("Stairway link error:", gl.getProgramInfoLog(prog));
    }
    return null;
}

export const Lens_Stairway: VisualizerPlugin = {
    id: 'STAIRWAY',
    name: 'Celestial Stairway',
    renderType: 'WEBGL',
    
    parameters: [
        { id: 'stairPattern', label: 'Stair Geometry', icon: 'Layers', type: 'SELECT', options: ['STRAIGHT', 'SPIRAL'], color: '#2dd4bf', section: 'GEOMETRY', defaultValue: 'STRAIGHT' },
        { id: 'ascentSpeed', label: 'Ascension Speed', icon: 'ArrowUp', type: 'SLIDER', min: 0, max: 4.0, step: 0.05, color: '#34d399', section: 'WAVES', defaultValue: 1.0 },
        { id: 'stepWidth', label: 'Staircase Width', icon: 'Maximize', type: 'SLIDER', min: 0.5, max: 2.5, step: 0.05, color: '#38bdf8', section: 'GEOMETRY', defaultValue: 1.2 },
        { id: 'stepGlow', label: 'Crystal Glow', icon: 'Sun', type: 'SLIDER', min: 0.5, max: 4.0, step: 0.1, color: '#fbbf24', section: 'LIGHT', defaultValue: 1.6 },
        { id: 'portalRadiance', label: 'Portal Radiance', icon: 'Lightbulb', type: 'SLIDER', min: 0.5, max: 5.0, step: 0.1, color: '#facc15', section: 'LIGHT', defaultValue: 2.0 },
        { id: 'lightShafts', label: 'Divine Rays', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 3.0, step: 0.1, color: '#c084fc', section: 'LIGHT', defaultValue: 1.4 },
        { id: 'nebulaIntensity', label: 'Cosmic Nebula', icon: 'Cloud', type: 'SLIDER', min: 0, max: 2.5, step: 0.1, color: '#d946ef', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'cameraTilt', label: 'Gaze Angle', icon: 'MoveVertical', type: 'SLIDER', min: -0.2, max: 0.6, step: 0.01, color: '#ec4899', section: 'GEOMETRY', defaultValue: 0.15 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Compass', type: 'SLIDER', min: 0, max: 24, step: 2, color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },

        { id: 'primaryColor', label: 'Stair Aura Color', icon: 'Palette', type: 'COLOR', color: '#fbbf24', section: 'LIGHT', defaultValue: '#fbbf24' },
        { id: 'portalColor', label: 'Portal Core Color', icon: 'Sun', type: 'COLOR', color: '#ffffff', section: 'LIGHT', defaultValue: '#fffbeb' },
        { id: 'skyColor', label: 'Void Space Color', icon: 'Cloud', type: 'COLOR', color: '#0a0600', section: 'LIGHT', defaultValue: '#0a0600' },
    ],

    presets: Object.keys(PRESETS).map((name, i) => ({
        id: `stairway_webgl_${i}`,
        name,
        mode: 'STAIRWAY',
        config: PRESETS[name],
        modulations: {}
    })),

    defaultConfig: {
        ...PRESETS["01 Golden Ascent"],
        kaleidoscope: 0,
        crystallineLayer: 0
    },

    initialize: (context) => {
        const { gl, memory } = context;
        if (!gl) return;
        memory.needsRecompile = true;
    },

    render: (context) => {
        const { gl, memory, time, config, amplitudes, heartHarmonics, globalBinauralBeat } = context;
        if (!gl) return;

        const w = gl.canvas.width;
        const h = gl.canvas.height;

        if (!memory.progStairway || memory.needsRecompile) {
            const prog = buildProgram(gl, STAIRWAY_VS, STAIRWAY_FS);
            if (prog) {
                memory.progStairway = prog;
                memory.needsRecompile = false;
            }

            const quadVerts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
            memory.vaoQuad = gl.createVertexArray();
            gl.bindVertexArray(memory.vaoQuad);
            memory.vboQuad = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.vboQuad);
            gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);

            memory.ascentDistance = 0;
            memory.lastTime = time;
        }

        if (!memory.progStairway) return;

        const dt = Math.min(0.05, Math.max(0.001, time - ((memory.lastTime as number) || time)));
        memory.lastTime = time;

        // 1. Audio & Binaural Excitation Tracking
        let rawAudioAmp = 0;
        let dominantFreq = 0;
        let maxAmp = 0;
        if (amplitudes) {
            LATTICE_CHANNELS.forEach(ch => {
                const v = amplitudes.get(ch.id) || 0;
                if (v > 0.002) {
                    rawAudioAmp += v;
                    if (v > maxAmp) {
                        maxAmp = v;
                        dominantFreq = ch.freq;
                    }
                }
            });
            for (const [key, v] of amplitudes.entries()) {
                const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                if (!isNaN(freqNum) && freqNum > 0 && v > maxAmp) {
                    maxAmp = v;
                    dominantFreq = freqNum;
                }
            }
        }
        if (heartHarmonics && heartHarmonics.vols && !heartHarmonics.stackMutes) {
            heartHarmonics.vols.forEach((v: number, i: number) => {
                const isMuted = heartHarmonics.mutes && heartHarmonics.mutes[i];
                if (v > 0.002 && !isMuted) rawAudioAmp += v;
            });
        }

        if (memory.smoothAudioEnergy === undefined) memory.smoothAudioEnergy = 0;
        const targetAudioEnergy = rawAudioAmp > 0.002 ? Math.min(1.0, rawAudioAmp * 1.8) : 0.0;
        const aLerp = targetAudioEnergy > (memory.smoothAudioEnergy as number) ? 0.1 : 0.04;
        memory.smoothAudioEnergy = (memory.smoothAudioEnergy as number) + (targetAudioEnergy - (memory.smoothAudioEnergy as number)) * aLerp;
        if ((memory.smoothAudioEnergy as number) < 0.0005) memory.smoothAudioEnergy = 0.0;

        // 2. Breath Pacer Excitation Tracking
        const isBreathActive = !!context.isBreathActive;
        if (memory.smoothBreathEnergy === undefined) memory.smoothBreathEnergy = 0;
        const targetBreathEnergy = isBreathActive ? 1.0 : 0.0;
        const bLerp = targetBreathEnergy > (memory.smoothBreathEnergy as number) ? 0.08 : 0.03;
        memory.smoothBreathEnergy = (memory.smoothBreathEnergy as number) + (targetBreathEnergy - (memory.smoothBreathEnergy as number)) * bLerp;
        if ((memory.smoothBreathEnergy as number) < 0.0005) memory.smoothBreathEnergy = 0.0;

        const audioEnergy = memory.smoothAudioEnergy as number;
        const breathEnergy = memory.smoothBreathEnergy as number;
        const totalActivity = Math.min(1.0, audioEnergy + breathEnergy);

        // 3. Zen Ascension Glide
        // Completely stationary (speed 0) when silent & breath pacer off.
        // Meditative glide (0.4 - 1.2 units/sec) when tones or breath active.
        const baseSpeed = (config.ascentSpeed as number) ?? 1.0;
        const effectiveSpeed = baseSpeed * (audioEnergy * 0.75 + breathEnergy * 0.55);
        if (memory.ascentDistance === undefined) memory.ascentDistance = 0;
        memory.ascentDistance = (memory.ascentDistance as number) + dt * effectiveSpeed;

        // 4. Binaural Beat & Breath Pacer Modulation
        const beatFreq = Math.max(0.5, Math.min(30.0, globalBinauralBeat || 6.0));
        const binauralPulse = audioEnergy > 0.001 
            ? Math.sin(time * Math.PI * 2 * (beatFreq / 2)) * audioEnergy 
            : 0.0;

        const breathPhase = typeof context.breathPhase === 'number' ? (context.breathPhase as number) : (time * 0.628);
        const breathRadius = typeof context.breathRadius === 'number' ? (context.breathRadius as number) : (0.5 + 0.5 * Math.sin(breathPhase));
        const breathWave = breathRadius;

        let rgbPrimary = hexToRgb((config.primaryColor as string) || '#fbbf24');
        if (dominantFreq > 0 && audioEnergy > 0.01) {
            const hRgb = getFrequencyRGB(dominantFreq);
            const harmRgb: [number, number, number] = [hRgb.r / 255, hRgb.g / 255, hRgb.b / 255];
            const mixAmt = Math.min(0.85, audioEnergy);
            rgbPrimary = [
                rgbPrimary[0] * (1 - mixAmt) + harmRgb[0] * mixAmt,
                rgbPrimary[1] * (1 - mixAmt) + harmRgb[1] * mixAmt,
                rgbPrimary[2] * (1 - mixAmt) + harmRgb[2] * mixAmt,
            ];
        }
        const rgbPortal = hexToRgb((config.portalColor as string) || '#fffbeb');
        const rgbSky = hexToRgb((config.skyColor as string) || '#0a0600');

        gl.viewport(0, 0, w, h);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        gl.useProgram(memory.progStairway);

        gl.uniform2f(gl.getUniformLocation(memory.progStairway, "u_resolution"), w, h);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_time"), time);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_ascent"), memory.ascentDistance as number);

        gl.uniform3f(gl.getUniformLocation(memory.progStairway, "u_primaryColor"), rgbPrimary[0], rgbPrimary[1], rgbPrimary[2]);
        gl.uniform3f(gl.getUniformLocation(memory.progStairway, "u_portalColor"), rgbPortal[0], rgbPortal[1], rgbPortal[2]);
        gl.uniform3f(gl.getUniformLocation(memory.progStairway, "u_skyColor"), rgbSky[0], rgbSky[1], rgbSky[2]);

        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_stepWidth"), (config.stepWidth as number) ?? 1.2);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_stepGlow"), (config.stepGlow as number) ?? 1.6);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_portalRadiance"), (config.portalRadiance as number) ?? 2.0);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_lightShafts"), (config.lightShafts as number) ?? 1.4);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_nebulaIntensity"), (config.nebulaIntensity as number) ?? 1.0);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_cameraTilt"), (config.cameraTilt as number) ?? 0.15);

        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_binauralPulse"), binauralPulse);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_breathWave"), breathWave);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_breathEnergy"), breathEnergy);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_audioEnergy"), audioEnergy);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_totalActivity"), totalActivity);
        gl.uniform1i(gl.getUniformLocation(memory.progStairway, "u_isSpiral"), config.stairPattern === 'SPIRAL' ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_visualScale"), (context.visualScale as number) || 1.0);
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_kaleidoscope"), Number(config.kaleidoscope ?? 0));
        gl.uniform1f(gl.getUniformLocation(memory.progStairway, "u_crystalline"), Number(config.crystallineLayer ?? 0));

        // Subtle, stable zen cursor parallax
        const mouseX = typeof context.cx === 'number' ? context.cx : w * 0.5;
        const mouseY = typeof context.cy === 'number' ? context.cy : h * 0.5;
        const offsetX = (1.0 - (mouseX / w) * 2) * 0.04;
        const offsetY = ((mouseY / h) * 2 - 1) * 0.025;
        gl.uniform2f(gl.getUniformLocation(memory.progStairway, "u_centerOffset"), offsetX, offsetY);

        gl.bindVertexArray(memory.vaoQuad);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindVertexArray(null);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.progStairway) gl.deleteProgram(memory.progStairway);
            if (memory.vboQuad) gl.deleteBuffer(memory.vboQuad);
            if (memory.vaoQuad) gl.deleteVertexArray(memory.vaoQuad);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
