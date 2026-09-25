import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getUniversalCymatic, getFrequencyRGB } from './shared';
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

const PRESETS: Record<string, Record<string, unknown>> = {
    "01 Silk Ocean": {
        textureMode: 'SILK_OCEAN',
        skyColor: '#030712',
        horizonColor: '#0ea5e9',
        baseColor: '#38bdf8',
        cameraHeight: 85,
        cameraPitch: -0.22,
        flightSpeed: 14,
        force: 0.75,
        agitation: 0.5,
        terrainSmoothing: 0.75,
        neonFactor: 1.2,
        fogDensity: 1.1,
        sunElevation: 0.12,
        sunSize: 1.4
    },
    "02 Harmonic Dunes": {
        textureMode: 'BIOLUMINESCENT',
        skyColor: '#0f172a',
        horizonColor: '#d946ef',
        baseColor: '#a855f7',
        cameraHeight: 90,
        cameraPitch: -0.24,
        flightSpeed: 12,
        force: 0.8,
        agitation: 0.55,
        terrainSmoothing: 0.7,
        neonFactor: 1.4,
        fogDensity: 1.0,
        sunElevation: 0.18,
        sunSize: 1.6
    },
    "03 Synthwave Horizon": {
        textureMode: 'SYNTH_GRID',
        skyColor: '#090514',
        horizonColor: '#ec4899',
        baseColor: '#22d3ee',
        cameraHeight: 80,
        cameraPitch: -0.20,
        flightSpeed: 20,
        force: 0.7,
        agitation: 0.6,
        terrainSmoothing: 0.65,
        neonFactor: 1.6,
        fogDensity: 0.9,
        sunElevation: 0.08,
        sunSize: 2.0
    },
    "04 Bioluminescent Peaks": {
        textureMode: 'BIOLUMINESCENT',
        skyColor: '#022c22',
        horizonColor: '#2dd4bf',
        baseColor: '#10b981',
        cameraHeight: 95,
        cameraPitch: -0.25,
        flightSpeed: 10,
        force: 0.85,
        agitation: 0.5,
        terrainSmoothing: 0.7,
        neonFactor: 1.5,
        fogDensity: 1.2,
        sunElevation: 0.15,
        sunSize: 1.2
    },
    "05 Celestial Aurora": {
        textureMode: 'CELESTIAL',
        skyColor: '#050816',
        horizonColor: '#818cf8',
        baseColor: '#c084fc',
        cameraHeight: 90,
        cameraPitch: -0.22,
        flightSpeed: 12,
        force: 0.8,
        agitation: 0.45,
        terrainSmoothing: 0.8,
        neonFactor: 1.3,
        fogDensity: 1.1,
        sunElevation: 0.22,
        sunSize: 1.8
    },
    "06 Quantum Abyss": {
        textureMode: 'SILK_OCEAN',
        skyColor: '#020617',
        horizonColor: '#6366f1',
        baseColor: '#06b6d4',
        cameraHeight: 85,
        cameraPitch: -0.22,
        flightSpeed: 16,
        force: 0.85,
        agitation: 0.6,
        terrainSmoothing: 0.75,
        neonFactor: 1.5,
        fogDensity: 1.3,
        sunElevation: -0.05,
        sunSize: 2.0
    }
};

const COMMON_MATH = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865, 0.366025404, -0.577350269, 0.024390244);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.792842914 - 0.853734721 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 3; ++i) {
        v += a * snoise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}
`;

const VS_SOURCE = `#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FS_SOURCE = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

// Canvas & Camera Uniforms
uniform float u_aspect;
uniform float u_time;
uniform float u_zOffset;
uniform float u_cameraHeight;
uniform float u_cameraPitch;
uniform float u_visualScale;
uniform vec2 u_mouseShift;

// Environment Colors & Sun
uniform vec3 u_skyColor;
uniform vec3 u_horizonColor;
uniform vec3 u_baseColor;
uniform float u_sunElevation;
uniform float u_sunSize;
uniform float u_fogDensity;
uniform float u_neonFactor;

// Archetype & Animation
uniform int u_textureMode; // 0: SYNTH_GRID, 1: SILK_OCEAN, 2: BIOLUMINESCENT, 3: CELESTIAL
uniform float u_baseForce;
uniform float u_agitation;
uniform float u_smoothing;
uniform float u_audioEnergy;
uniform float u_breathEnergy;
uniform float u_breathWave;
uniform float u_breathPhase;

// Acoustic Harmonics (up to 32 frequencies from sound engine)
uniform int u_audioCount;
uniform vec4 u_harmonics[32];     // x: amp, y: freq, z: phase, w: modal order n
uniform vec4 u_harmonicsExt[32];  // x: kModal, y: m, z: unused, w: unused

uniform float u_kaleidoscope;
uniform float u_crystalline;

${COMMON_MATH}
${KALEIDOSCOPE_GLSL_FUNCS}

// Continuous 3D Heightfield Evaluation with Acoustic Cymatics & Canyon Topography
float getTerrainHeight(vec2 worldXZ, out float cymaticAccum) {
    cymaticAccum = 0.0;
    
    float audioAct = clamp(u_audioEnergy, 0.0, 1.0);
    float breathAct = clamp(u_breathEnergy, 0.0, 1.0);
    float totalActivity = clamp(audioAct * 1.2 + breathAct * 0.8, 0.0, 1.0);
    
    float basePresence = 0.38 + 0.62 * totalActivity;
    
    // 1. FLIGHT CANYON / VALLEY (open center corridor flanked by lateral mountain ridges)
    float absX = abs(worldXZ.x);
    float mountainRidge = smoothstep(50.0, 320.0, absX);
    
    // Multi-scale harmonic mountains along canyon flanks
    float m1 = sin(worldXZ.y * 0.007 + worldXZ.x * 0.005) * cos(worldXZ.x * 0.004);
    float m2 = sin(worldXZ.y * 0.015 - worldXZ.x * 0.009) * 0.5;
    float mNoise = fbm(worldXZ * 0.004) * (1.0 - u_smoothing * 0.5);
    float mountainHeight = (m1 + m2 + mNoise * 0.8) * 36.0 * mountainRidge * u_baseForce * basePresence;

    // 2. CENTRAL FLUID RIVER & BREATH PACER RHYTHMIC SWELLS
    float breathWaveDist = sin(worldXZ.y * 0.014 - u_breathPhase) * cos(worldXZ.x * 0.008);
    float breathDisplacement = breathWaveDist * 10.0 * breathAct * u_baseForce;
    float breathLift = (u_breathWave - 0.5) * 8.0 * breathAct;
    
    // Forward-flowing fluid river swells
    float riverSwell = sin(worldXZ.y * 0.018 - u_time * 0.8 + worldXZ.x * 0.01) * 4.0 * (1.0 - mountainRidge * 0.7);

    // 3. PHYSICAL ACOUSTIC CYMATICS & HARMONIC RESONANCE
    float acousticWaves = 0.0;
    float totalAudioAmp = 0.0;
    for (int i = 0; i < 32; i++) {
        if (i >= u_audioCount) break;
        vec4 hData = u_harmonics[i];
        vec4 hExt = u_harmonicsExt[i];
        
        float amp = hData.x;
        if (amp < 0.001) continue;
        totalAudioAmp += amp;
        
        float freq = max(20.0, hData.y);
        float phase = hData.z;
        int nOrder = int(hData.w);
        float kModal = max(0.5, hExt.x);
        
        float logF = log2(freq / 20.0);
        float kz = (0.004 + logF * 0.0015) * (1.0 - u_smoothing * 0.35);
        float kx = (0.0025 + float(nOrder) * 0.0008) * (1.0 - u_smoothing * 0.35);
        
        float wave1 = sin(worldXZ.y * kz + worldXZ.x * kx * 0.5 - phase);
        float wave2 = cos(worldXZ.y * kz * 0.7 - worldXZ.x * kx * 0.8 - phase * 0.9);
        float chladni = cos(worldXZ.x * kx * kModal * 0.4) * cos(worldXZ.y * kz * kModal * 0.4);
        
        float disp = (wave1 * 0.6 + wave2 * 0.2 + chladni * 0.2) * amp;
        acousticWaves += disp;
        cymaticAccum += abs(disp) * amp;
    }

    float safeNorm = 1.0 / max(1.0, sqrt(totalAudioAmp * 0.8));
    acousticWaves = acousticWaves * safeNorm * u_agitation * 18.0;

    float h = mountainHeight + breathDisplacement + breathLift + riverSwell + acousticWaves;
    return clamp(h, -14.0, 42.0);
}

vec3 calculateNormal(vec2 worldXZ) {
    float eps = 2.5;
    float dummy;
    float hL = getTerrainHeight(worldXZ - vec2(eps, 0.0), dummy);
    float hR = getTerrainHeight(worldXZ + vec2(eps, 0.0), dummy);
    float hD = getTerrainHeight(worldXZ - vec2(0.0, eps), dummy);
    float hU = getTerrainHeight(worldXZ + vec2(0.0, eps), dummy);
    return normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
}

void main() {
    // 1. Aspect-Corrected Screen Ray Construction
    vec2 uv = v_uv;
    uv.x *= u_aspect;

    if (u_kaleidoscope > 1.5) {
        uv = applyKaleidoscopeFold(uv, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        uv = applyCrystallineLayer(uv, u_crystalline);
    }
    
    float vScale = max(0.2, min(5.0, u_visualScale));
    float fovY = 0.82 / vScale;
    
    float pitch = clamp(u_cameraPitch, -0.85, 0.15);
    float camY = max(20.0, u_cameraHeight);
    vec3 camPos = vec3(u_mouseShift.x, camY, 0.0);
    
    vec3 camForward = normalize(vec3(0.0, sin(pitch), -cos(pitch)));
    vec3 camRight = vec3(1.0, 0.0, 0.0);
    vec3 camUp = normalize(cross(camRight, camForward));
    
    vec3 rayDir = normalize(camForward / tan(fovY * 0.5) + uv.x * camRight + uv.y * camUp);
    
    // 2. Celestial Sky & Sun Evaluation
    float activeSunElev = clamp(u_sunElevation + 0.16, -0.25, 0.85);
    vec3 sunDir = normalize(vec3(0.0, sin(activeSunElev), -cos(activeSunElev)));
    
    float sunDot = dot(rayDir, sunDir);
    float sunAngle = acos(clamp(sunDot, -1.0, 1.0));
    float baseRadius = 0.055 * max(0.3, u_sunSize);
    float disk = 1.0 - smoothstep(baseRadius - 0.003, baseRadius + 0.003, sunAngle);
    
    if (u_textureMode == 0 && disk > 0.01) {
        if (rayDir.y < sunDir.y + baseRadius * 0.25) {
            float slice = fract((sunDir.y - rayDir.y) * 45.0);
            disk *= smoothstep(0.28, 0.48, slice);
        }
    }
    
    float activeGlow = u_breathEnergy * (u_breathWave - 0.5) * 0.35 + u_audioEnergy * 0.4;
    float haloExpansion = 1.0 + activeGlow;
    float innerCorona = pow(max(0.0, 1.0 - sunAngle / (baseRadius * 2.2)), 3.2) * haloExpansion * 0.85;
    float outerGlow = pow(max(0.0, 1.0 - sunAngle / (baseRadius * 4.5)), 1.8) * haloExpansion * 0.45;
    
    vec3 sunCoreColor = u_textureMode == 0 ? vec3(1.0, 0.35, 0.65) : vec3(1.0, 0.98, 0.92);
    vec3 coronaColor = mix(u_horizonColor, sunCoreColor, 0.5);
    vec3 sunFinal = (sunCoreColor * disk) + (coronaColor * innerCorona) + (coronaColor * outerGlow);
    
    float skyElevation = max(0.0, rayDir.y);
    float horizonMix = pow(clamp(1.0 - skyElevation * 2.2, 0.0, 1.0), 2.5);
    vec3 skyColor = mix(u_skyColor, u_horizonColor, horizonMix);
    
    if (rayDir.y > 0.22) {
        vec2 starUV = rayDir.xz / (rayDir.y + 0.1);
        float starGrid = sin(starUV.x * 320.0 + 1.5) * cos(starUV.y * 320.0 + 3.2);
        if (starGrid > 0.991) {
            float twinkle = 0.7 + 0.3 * sin(u_time * 0.8 + starUV.x * 40.0);
            skyColor += vec3(0.85, 0.92, 1.0) * twinkle * (rayDir.y - 0.22);
        }
    }
    vec3 fullSky = skyColor + sunFinal;
    
    // 3. Flowing 3D Fluid Ocean / Terrain Evaluation
    // Any ray pointing below the horizon (rayDir.y < 0) seamlessly intersects the solid surface
    if (rayDir.y < -0.0001) {
        float t = -camPos.y / rayDir.y;
        vec3 p = camPos + rayDir * t;
        
        vec2 sampleXZ = vec2(p.x, p.z - u_zOffset);
        float cymaticAccum = 0.0;
        float h = getTerrainHeight(sampleXZ, cymaticAccum);
        
        // 3 Fast Secant Refinements guarantee true 3D surface convergence
        t = clamp((h - camPos.y) / rayDir.y, 1.0, 3500.0);
        p = camPos + rayDir * t;
        sampleXZ = vec2(p.x, p.z - u_zOffset);
        h = getTerrainHeight(sampleXZ, cymaticAccum);
        
        t = clamp((h - camPos.y) / rayDir.y, 1.0, 3500.0);
        p = camPos + rayDir * t;
        sampleXZ = vec2(p.x, p.z - u_zOffset);
        h = getTerrainHeight(sampleXZ, cymaticAccum);
        
        vec3 N = calculateNormal(sampleXZ);
        
        vec3 lightDir = normalize(vec3(0.25, 0.85, -0.6));
        float diff = max(dot(N, lightDir), 0.0);
        vec3 viewDir = -rayDir;
        vec3 halfVec = normalize(lightDir + viewDir);
        float spec = pow(max(dot(N, halfVec), 0.0), 32.0);
        
        float a0 = u_audioCount > 0 ? u_harmonics[0].x : 0.0;
        float cymaticGlow = clamp(cymaticAccum / 18.0, 0.0, 1.5);
        float audioPeak = a0 * 1.6 + cymaticGlow * 1.2;
        vec3 surfColor = vec3(0.0);
        
        if (u_textureMode == 0) {
            // --- 0: SYNTHWAVE SOLID GROUND WITH CRISP GLOWING WIREFRAME GRID ---
            float cellSize = 22.0;
            vec2 coord = sampleXZ / cellSize;
            vec2 fw = max(fwidth(coord), vec2(0.00001));
            vec2 distToLine = abs(fract(coord - 0.5) - 0.5);
            vec2 distPx = distToLine / fw;
            
            float lineWidthPx = 1.35;
            vec2 lineCov = clamp(vec2(lineWidthPx * 0.5) - distPx + 0.5, 0.0, 1.0);
            float line = max(lineCov.x, lineCov.y);
            
            float maxFw = max(fw.x, fw.y);
            float lodFade = 1.0 - smoothstep(0.22, 0.55, maxFw);
            line *= lodFade;

            // Rich, opaque, solid synthwave twilight floor - NEVER see-through
            vec3 valleyFloor = vec3(0.035, 0.012, 0.075);
            vec3 peakGlow = mix(u_baseColor, u_horizonColor, clamp(h / 35.0 + 0.35, 0.0, 1.0));
            vec3 solidGround = mix(valleyFloor, peakGlow * 0.22, clamp(h / 40.0 + 0.35, 0.0, 1.0)) * (0.45 + diff * 0.55);

            vec3 neonLine = peakGlow * (1.2 + audioPeak * 1.8) * u_neonFactor;
            surfColor = mix(solidGround, neonLine, line);

        } else if (u_textureMode == 1) {
            // --- 1: SILK OCEAN (Pearlescent Waves, Fresnel & Specular Glints) ---
            vec3 deepColor = mix(u_horizonColor * 0.28, vec3(0.01, 0.04, 0.08), 0.5);
            vec3 shallowColor = u_baseColor;
            float elevMix = clamp((h + 14.0) / 45.0, 0.0, 1.0);
            surfColor = mix(deepColor, shallowColor, elevMix);

            float fresnel = pow(1.0 - max(dot(N, viewDir), 0.0), 3.0);
            surfColor += fresnel * u_horizonColor * (0.65 + audioPeak * 0.7);
            surfColor += spec * vec3(1.0, 0.98, 0.92) * (1.2 + audioPeak * 1.4);
            
            vec3 sunHalf = normalize(sunDir + viewDir);
            float sunSpec = pow(max(dot(N, sunHalf), 0.0), 48.0) * disk;
            surfColor += sunSpec * vec3(1.0, 0.95, 0.85) * 1.8;

            surfColor *= (0.45 + diff * 0.55);

        } else if (u_textureMode == 2) {
            // --- 2: BIOLUMINESCENT PEAKS ---
            vec3 rockColor = vec3(0.04, 0.07, 0.10);
            vec3 biolum = u_baseColor;
            float slope = N.y;

            float bioBlend = smoothstep(0.48, 0.82, slope);
            surfColor = mix(rockColor, biolum * (1.0 + audioPeak * 1.4), bioBlend);

            float crest = smoothstep(14.0, 38.0, h);
            surfColor = mix(surfColor, mix(u_baseColor, vec3(1.0, 1.0, 1.0), 0.5), crest * 0.8);
            surfColor *= (0.45 + diff * 0.55);

        } else {
            // --- 3: CELESTIAL AURORA ---
            vec3 deepAura = mix(u_baseColor * 0.35, vec3(0.03, 0.02, 0.08), 0.6);
            vec3 lightAura = mix(u_baseColor, u_horizonColor, 0.55);
            surfColor = mix(deepAura, lightAura, clamp(h / 36.0 + 0.4, 0.0, 1.0));
            
            float pulse = 0.5 + 0.5 * sin(sampleXZ.x * 0.008 + u_time * 1.2);
            surfColor += u_horizonColor * pulse * 0.3 * (1.0 + audioPeak * 1.5);
            surfColor *= (0.45 + diff * 0.55);
        }

        // Distance fog softly blending terrain into horizon sky
        float dist = length(p - camPos);
        float fogStart = 700.0;
        float fogEnd = 1800.0 / max(0.5, u_fogDensity);
        float fog = smoothstep(fogStart, fogEnd, dist);
        vec3 terrainFinal = mix(surfColor, u_horizonColor, fog);
        
        // Exact seamless transition at physical horizon line
        float horizonBlend = smoothstep(-0.003, 0.001, rayDir.y);
        fragColor = vec4(mix(terrainFinal, fullSky, horizonBlend), 1.0);
    } else {
        fragColor = vec4(fullSky, 1.0);
    }
}
`;

export const Lens_3DTerrain: VisualizerPlugin = {
    id: '3D_TERRAIN',
    name: '3D Flow Terrain',
    renderType: 'WEBGL',
    
    parameters: [
        { id: 'textureMode', label: 'Terrain Archetype', icon: 'Layers', type: 'SELECT', options: ['SILK_OCEAN', 'SYNTH_GRID', 'BIOLUMINESCENT', 'CELESTIAL'], color: '#2dd4bf', section: 'GEOMETRY', defaultValue: 'SILK_OCEAN' },
        { id: 'flightSpeed', label: 'Flight Speed', icon: 'Wind', type: 'SLIDER', min: 0, max: 80, step: 1, color: '#34d399', section: 'WAVES', defaultValue: 14 },
        { id: 'force', label: 'Mountain Height', icon: 'Activity', type: 'SLIDER', min: 0.1, max: 3.0, step: 0.05, color: '#e879f9', section: 'PHYSICS', defaultValue: 0.75 },
        { id: 'agitation', label: 'Audio Resonance', icon: 'Zap', type: 'SLIDER', min: 0, max: 3.0, step: 0.05, color: '#ef4444', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'terrainSmoothing', label: 'Wave Smoothness', icon: 'Waves', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#22d3ee', section: 'WAVES', defaultValue: 0.75 },
        
        { id: 'cameraHeight', label: 'Camera Altitude', icon: 'ArrowUp', type: 'SLIDER', min: 30.0, max: 250.0, step: 1.0, color: '#d946ef', section: 'GEOMETRY', defaultValue: 85 },
        { id: 'cameraPitch', label: 'Camera Pitch', icon: 'MoveVertical', type: 'SLIDER', min: -0.85, max: 0.15, step: 0.01, color: '#ec4899', section: 'GEOMETRY', defaultValue: -0.22 },

        { id: 'skyColor', label: 'Zenith Color', icon: 'Cloud', type: 'COLOR', color: '#38bdf8', section: 'LIGHT', defaultValue: '#030712' },
        { id: 'horizonColor', label: 'Horizon Color', icon: 'Sun', type: 'COLOR', color: '#fb923c', section: 'LIGHT', defaultValue: '#0ea5e9' },
        { id: 'baseColor', label: 'Terrain Color', icon: 'Droplet', type: 'COLOR', color: '#a855f7', section: 'LIGHT', defaultValue: '#38bdf8' },
        
        { id: 'neonFactor', label: 'Glow Radiance', icon: 'Sun', type: 'SLIDER', min: 0.5, max: 4.0, step: 0.1, color: '#fde047', section: 'LIGHT', defaultValue: 1.2 },
        { id: 'fogDensity', label: 'Atmospheric Fog', icon: 'Cloud', type: 'SLIDER', min: 0.4, max: 3.0, step: 0.1, color: '#94a3b8', section: 'LIGHT', defaultValue: 1.1 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Compass', type: 'SLIDER', min: 0, max: 24, step: 2, color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'sunElevation', label: 'Celestial Elevation', icon: 'Sun', type: 'SLIDER', min: -0.25, max: 0.7, step: 0.01, color: '#facc15', section: 'LIGHT', defaultValue: 0.12 },
        { id: 'sunSize', label: 'Celestial Size', icon: 'Circle', type: 'SLIDER', min: 0.2, max: 4.0, step: 0.1, color: '#fbbf24', section: 'LIGHT', defaultValue: 1.4 },
    ],

    presets: Object.keys(PRESETS).map((name, i) => ({
        id: `terrain_flow_${i}`,
        name,
        mode: '3D_TERRAIN',
        config: PRESETS[name],
        modulations: {}
    })),

    defaultConfig: {
        ...PRESETS["01 Silk Ocean"],
        kaleidoscope: 0,
        crystallineLayer: 0
    },

    render: (context: LensContext, localConfig?: Record<string, unknown>) => {
        const { gl, w, h, amplitudes, time, breathRadius: rawBreathRadius, memory, config: rawConfig, heartHarmonics, stackMutes, customFrequencies } = context;
        if (!gl) return;

        const config = localConfig ? { ...rawConfig, ...localConfig } : rawConfig;

        // Initialize WebGL2 Program and Fullscreen Quad Buffer on First Run
        if (!memory.terrainProgram) {
            const compileShader = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error("3D Terrain Shader compile error:", gl.getShaderInfoLog(s));
                    gl.deleteShader(s);
                    return null;
                }
                return s;
            };

            const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
            const fs = compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);
            if (!vs || !fs) return;

            const prog = gl.createProgram()!;
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);

            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.error("3D Terrain Program link error:", gl.getProgramInfoLog(prog));
                return;
            }

            memory.terrainProgram = prog;

            const quadVerts = new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                -1,  1,
                 1, -1,
                 1,  1
            ]);

            memory.vaoQuad = gl.createVertexArray();
            gl.bindVertexArray(memory.vaoQuad);
            memory.vboQuad = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, memory.vboQuad);
            gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);

            memory.uniforms = {
                u_aspect: gl.getUniformLocation(prog, "u_aspect"),
                u_time: gl.getUniformLocation(prog, "u_time"),
                u_zOffset: gl.getUniformLocation(prog, "u_zOffset"),
                u_cameraHeight: gl.getUniformLocation(prog, "u_cameraHeight"),
                u_cameraPitch: gl.getUniformLocation(prog, "u_cameraPitch"),
                u_visualScale: gl.getUniformLocation(prog, "u_visualScale"),
                u_mouseShift: gl.getUniformLocation(prog, "u_mouseShift"),
                u_skyColor: gl.getUniformLocation(prog, "u_skyColor"),
                u_horizonColor: gl.getUniformLocation(prog, "u_horizonColor"),
                u_baseColor: gl.getUniformLocation(prog, "u_baseColor"),
                u_sunElevation: gl.getUniformLocation(prog, "u_sunElevation"),
                u_sunSize: gl.getUniformLocation(prog, "u_sunSize"),
                u_fogDensity: gl.getUniformLocation(prog, "u_fogDensity"),
                u_neonFactor: gl.getUniformLocation(prog, "u_neonFactor"),
                u_textureMode: gl.getUniformLocation(prog, "u_textureMode"),
                u_baseForce: gl.getUniformLocation(prog, "u_baseForce"),
                u_agitation: gl.getUniformLocation(prog, "u_agitation"),
                u_smoothing: gl.getUniformLocation(prog, "u_smoothing"),
                u_audioEnergy: gl.getUniformLocation(prog, "u_audioEnergy"),
                u_breathEnergy: gl.getUniformLocation(prog, "u_breathEnergy"),
                u_breathWave: gl.getUniformLocation(prog, "u_breathWave"),
                u_breathPhase: gl.getUniformLocation(prog, "u_breathPhase"),
                u_audioCount: gl.getUniformLocation(prog, "u_audioCount"),
                u_harmonics: gl.getUniformLocation(prog, "u_harmonics[0]"),
                u_harmonicsExt: gl.getUniformLocation(prog, "u_harmonicsExt[0]"),
                u_kaleidoscope: gl.getUniformLocation(prog, "u_kaleidoscope"),
                u_crystalline: gl.getUniformLocation(prog, "u_crystalline")
            };

            memory.zTravel = 0;
            memory.lastTime = time;
        }

        if (!memory.terrainProgram || !memory.uniforms) return;

        const dt = Math.min(0.05, Math.max(0.001, time - ((memory.lastTime as number) || time)));
        memory.lastTime = time;

        const speed = (config.flightSpeed as number) ?? 14;
        memory.zTravel = (((memory.zTravel as number) || 0) + dt * speed) % 100000;

        const modeStr = (config.textureMode as string) || 'SILK_OCEAN';
        let modeInt = 1;
        if (modeStr === 'SYNTH_GRID') modeInt = 0;
        else if (modeStr === 'BIOLUMINESCENT') modeInt = 2;
        else if (modeStr === 'CELESTIAL') modeInt = 3;

        const rgbSky = hexToRgb((config.skyColor as string) || '#030712');
        const rgbHorizon = hexToRgb((config.horizonColor as string) || '#0ea5e9');
        const rgbBase = hexToRgb((config.baseColor as string) || '#38bdf8');

        // Audio Harmonics Accumulation
        const aData = new Float32Array(32 * 4);
        const aDataExt = new Float32Array(32 * 4);
        let aCount = 0;
        let rawAudioAmp = 0;
        let dominantFreq = 0;
        let maxAmp = 0;

        const targetVolumes = new Map<string, { amp: number; freq: number }>();
        const forceMult = (config.force as number) ?? 0.75;

        if (amplitudes && typeof amplitudes === 'object') {
            for (const [id, vol] of Object.entries(amplitudes)) {
                const v = typeof vol === 'number' ? vol : 0;
                if (v > 0.001) {
                    const strId = String(id);
                    const chDef = LATTICE_CHANNELS.find(c => c.id === strId);
                    let freqNum = chDef ? chDef.freq : 100;
                    if (customFrequencies && customFrequencies[strId]) {
                        freqNum = customFrequencies[strId];
                    }
                    if (stackMutes && stackMutes[strId]) continue;

                    if (!targetVolumes.has(strId)) {
                        rawAudioAmp += v;
                        targetVolumes.set(strId, { amp: v * 1.5 * forceMult, freq: freqNum });
                        if (v > maxAmp) {
                            maxAmp = v;
                            dominantFreq = freqNum;
                        }
                    }
                }
            }
        }

        if (heartHarmonics && heartHarmonics.vols && !heartHarmonics.stackMutes) {
            heartHarmonics.vols.forEach((vol: number, i: number) => {
                const isMuted = heartHarmonics.mutes && heartHarmonics.mutes[i];
                if (vol > 0.002 && !isMuted) {
                    rawAudioAmp += vol;
                    targetVolumes.set(`BINAURAL_${i}`, { amp: vol * 1.5 * forceMult, freq: 50 * (i + 1) });
                }
            });
        }

        if (!memory.terrainWaves) memory.terrainWaves = new Map<string, { vol: number; freq: number; phase: number; n: number; m: number; k: number; speed: number }>();
        const currentWaves = memory.terrainWaves as Map<string, { vol: number; freq: number; phase: number; n: number; m: number; k: number; speed: number }>;

        targetVolumes.forEach((data, id) => {
            if (!currentWaves.has(id)) {
                const cym = getUniversalCymatic(data.freq) as { n: number; m: number; k: number; speed: number };
                currentWaves.set(id, { vol: 0, freq: data.freq, phase: 0, n: cym.n, m: cym.m, k: cym.k, speed: cym.speed });
            }
        });

        currentWaves.forEach((wave, id) => {
            const targetData = targetVolumes.get(id);
            const targetAmp = targetData ? targetData.amp : 0;
            
            const lerpFactor = targetAmp > wave.vol ? 0.09 : 0.045;
            wave.vol += (targetAmp - wave.vol) * lerpFactor;

            const dPhase = dt * (wave.speed * 0.7 + Math.log2(Math.max(20, wave.freq) / 20.0) * 0.4);
            wave.phase = (wave.phase + dPhase) % (Math.PI * 2);

            if (wave.vol > 0.0005) {
                if (aCount < 32) {
                    const idx = aCount * 4;
                    aData[idx + 0] = wave.vol;
                    aData[idx + 1] = wave.freq;
                    aData[idx + 2] = wave.phase;
                    aData[idx + 3] = wave.n;

                    aDataExt[idx + 0] = wave.k;
                    aDataExt[idx + 1] = wave.m;
                    aDataExt[idx + 2] = 0;
                    aDataExt[idx + 3] = 0;
                    aCount++;
                }
            } else {
                currentWaves.delete(id);
            }
        });

        // Dynamic audio and breath smoothing
        if (memory.smoothAudioEnergy === undefined) memory.smoothAudioEnergy = 0;
        const targetAudioEnergy = rawAudioAmp > 0.002 ? Math.min(1.0, rawAudioAmp * 2.0) : 0.0;
        const aLerp = targetAudioEnergy > (memory.smoothAudioEnergy as number) ? 0.1 : 0.04;
        memory.smoothAudioEnergy = (memory.smoothAudioEnergy as number) + (targetAudioEnergy - (memory.smoothAudioEnergy as number)) * aLerp;
        if ((memory.smoothAudioEnergy as number) < 0.0005) memory.smoothAudioEnergy = 0.0;

        const isBreathActive = !!context.isBreathActive;
        if (memory.smoothBreathEnergy === undefined) memory.smoothBreathEnergy = 0;
        const targetBreathEnergy = isBreathActive ? 1.0 : 0.0;
        const bLerp = targetBreathEnergy > (memory.smoothBreathEnergy as number) ? 0.08 : 0.03;
        memory.smoothBreathEnergy = (memory.smoothBreathEnergy as number) + (targetBreathEnergy - (memory.smoothBreathEnergy as number)) * bLerp;
        if ((memory.smoothBreathEnergy as number) < 0.0005) memory.smoothBreathEnergy = 0.0;

        const breathPhase = typeof context.breathPhase === 'number' ? (context.breathPhase as number) : (time * 0.628);
        const breathRadius = typeof rawBreathRadius === 'number' ? (rawBreathRadius as number) : (0.5 + 0.5 * Math.sin(breathPhase));
        const breathWave = breathRadius;

        const audioEnergy = memory.smoothAudioEnergy as number;
        const breathEnergy = memory.smoothBreathEnergy as number;

        let effHorizon = rgbHorizon;
        let effBase = rgbBase;
        if (dominantFreq > 0 && audioEnergy > 0.01) {
            const hRgb = getFrequencyRGB(dominantFreq);
            const harmRgb: [number, number, number] = [hRgb.r / 255, hRgb.g / 255, hRgb.b / 255];
            const mixAmt = Math.min(0.7, audioEnergy * 0.8);
            effHorizon = [
                rgbHorizon[0] * (1 - mixAmt) + harmRgb[0] * mixAmt,
                rgbHorizon[1] * (1 - mixAmt) + harmRgb[1] * mixAmt,
                rgbHorizon[2] * (1 - mixAmt) + harmRgb[2] * mixAmt,
            ];
            effBase = [
                rgbBase[0] * (1 - mixAmt) + harmRgb[0] * mixAmt,
                rgbBase[1] * (1 - mixAmt) + harmRgb[1] * mixAmt,
                rgbBase[2] * (1 - mixAmt) + harmRgb[2] * mixAmt,
            ];
        }

        const aspect = w / h;
        const vScale = Math.max(0.2, Math.min(5.0, (context.visualScale as number) || 1.0));

        // Subtle mouse parallax (max ±10px)
        const mouseX = typeof context.cx === 'number' ? context.cx : w * 0.5;
        const mouseY = typeof context.cy === 'number' ? context.cy : h * 0.5;
        const subtleShiftX = (1.0 - (mouseX / w) * 2) * 12.0;
        const subtleShiftY = ((mouseY / h) * 2 - 1) * 6.0;

        // Render Unified Raymarched Screen-Space Terrain & Atmosphere
        gl.viewport(0, 0, w, h);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        gl.useProgram(memory.terrainProgram);
        const u = memory.uniforms as Record<string, WebGLUniformLocation | null>;

        gl.uniform1f(u.u_aspect, aspect);
        gl.uniform1f(u.u_time, time);
        gl.uniform1f(u.u_zOffset, memory.zTravel as number);
        gl.uniform1f(u.u_cameraHeight, (config.cameraHeight as number) ?? 85);
        gl.uniform1f(u.u_cameraPitch, (config.cameraPitch as number) ?? -0.22);
        gl.uniform1f(u.u_visualScale, vScale);
        gl.uniform2f(u.u_mouseShift, subtleShiftX, subtleShiftY);

        gl.uniform3f(u.u_skyColor, rgbSky[0], rgbSky[1], rgbSky[2]);
        gl.uniform3f(u.u_horizonColor, effHorizon[0], effHorizon[1], effHorizon[2]);
        gl.uniform3f(u.u_baseColor, effBase[0], effBase[1], effBase[2]);
        gl.uniform1f(u.u_sunElevation, (config.sunElevation as number) ?? 0.12);
        gl.uniform1f(u.u_sunSize, (config.sunSize as number) ?? 1.4);
        gl.uniform1f(u.u_fogDensity, (config.fogDensity as number) ?? 1.1);
        gl.uniform1f(u.u_neonFactor, (config.neonFactor as number) ?? 1.2);

        gl.uniform1i(u.u_textureMode, modeInt);
        gl.uniform1f(u.u_baseForce, (config.force as number) ?? 0.75);
        gl.uniform1f(u.u_agitation, (config.agitation as number) ?? 0.5);
        gl.uniform1f(u.u_smoothing, (config.terrainSmoothing as number) ?? 0.75);
        gl.uniform1f(u.u_audioEnergy, audioEnergy);
        gl.uniform1f(u.u_breathEnergy, breathEnergy);
        gl.uniform1f(u.u_breathWave, breathWave);
        gl.uniform1f(u.u_breathPhase, breathPhase);

        gl.uniform1i(u.u_audioCount, aCount);
        gl.uniform4fv(u.u_harmonics, aData);
        gl.uniform4fv(u.u_harmonicsExt, aDataExt);
        gl.uniform1f(u.u_kaleidoscope, Number(config.kaleidoscope ?? 0));
        gl.uniform1f(u.u_crystalline, Number(config.crystallineLayer ?? 0));

        gl.bindVertexArray(memory.vaoQuad);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    },

    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            if (memory.terrainProgram) gl.deleteProgram(memory.terrainProgram);
            if (memory.vboQuad) gl.deleteBuffer(memory.vboQuad);
            if (memory.vaoQuad) gl.deleteVertexArray(memory.vaoQuad);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
