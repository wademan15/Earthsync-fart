import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, UNIVERSAL_CHANNELS, LATTICE_CHANNELS, getFrequencyHSL } from './shared';

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
        id: 'holo_1',
        name: '01. Sacred Bubble',
        config: { 
            complexity: 4.0, frequency: 4.0, amplitude: 0.6, torusFactor: 0.0,
            pulseSpeed: 1.0, noiseScale: 0.0, torusThickness: 0.6, specularGlint: 1.0, fresnelPower: 3.0,
            rotationSpeed: 0.2, colorShift: 0.0, iridescence: 10.0, thickness: 0.8,
            opacity: 1.0, audioReactivity: 1.0, glowIntensity: 1.0,
            colorMode: 'Harmonic (Merrick)', color1: '#00ffff', color2: '#ff00ff', bgColor: '#000000'
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
} `;

const FS = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_aspect;
uniform vec2 u_centerOffset;
uniform float u_audioReactivity;

uniform float u_complexity;
uniform float u_frequency;
uniform float u_amplitude;
uniform float u_pulseSpeed;
uniform float u_noiseScale;
uniform float u_torusFactor;
uniform float u_torusThickness;
uniform float u_rotationSpeed;
uniform float u_colorShift;
uniform float u_opacity;
uniform float u_thickness;
uniform float u_iridescence;
uniform float u_specularGlint;
uniform float u_fresnelPower;

uniform int u_colorMode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bgColor;
uniform float u_glowIntensity;
uniform float u_visualScale;

uniform float u_amps[7];
uniform float u_hues[7];

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// 3D Noise
float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(in vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float map(vec3 p) {
    float r = length(p);
    float theta = acos(clamp(p.z / (r + 0.0001), -1.0, 1.0));
    float phi = atan(p.y, p.x);

    // Torus field with parametric tube thickness
    float tubeR = max(0.05, u_torusThickness);
    float ringR = max(0.3, 1.8 - tubeR);
    vec2 t = vec2(length(p.xz) - ringR, p.y);
    float torusD = length(t) - tubeR;
    
    // Sphere
    float sphereD = r - 1.5;
    
    // Morph between sphere and torus
    float baseD = mix(sphereD, torusD, u_torusFactor);
    
    // Spherical Harmonics (Cymatic patterns)
    float m = floor(u_complexity);
    float n = floor(u_frequency);
    
    float harmonic = sin(m * theta) * cos(n * phi);
    
    // Standing wave dynamics (scaled by audio reactivity and pulse speed)
    float wave = sin(harmonic * 8.0 + u_time * 2.0 * u_pulseSpeed) * u_amplitude * (0.5 + u_audioReactivity * 0.5);
    
    // Fine cymatic displacement using noise & ripples
    float cymaticNoise = noise(p * (3.0 + u_noiseScale * 8.0) + u_time * (0.5 + u_pulseSpeed * 0.5)) * (0.05 + u_noiseScale * 0.15) * (0.5 + u_audioReactivity * 0.5);
    
    return baseD + wave + cymaticNoise;
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
    uv -= u_centerOffset;
    uv.x *= u_aspect;
    
    // Camera setup with User Zoom scale
    float zoom = max(0.1, u_visualScale);
    vec3 ro = vec3(0.0, 0.0, 3.5 / zoom);
    vec3 rd = normalize(vec3(uv, -1.0));
    
    // Rotate camera
    float rotTime = u_time * u_rotationSpeed;
    ro.xz *= rot(rotTime);
    rd.xz *= rot(rotTime);
    ro.yz *= rot(rotTime * 0.5);
    rd.yz *= rot(rotTime * 0.5);
    
    // Raymarching
    float d0 = 0.0;
    float d = 0.0;
    vec3 p;
    
    for(int i = 0; i < 96; i++) {
        p = ro + rd * d0;
        d = map(p);
        if(abs(d) < 0.001 || d0 > 10.0) break;
        d0 += d * 0.5; // Step size reduction for better accuracy on displaced surfaces
    }
    
    vec3 col = vec3(0.0);
    float alpha = 0.0;
    
    vec3 merrickColor = vec3(0.0);
    if (u_colorMode == 0) {
        float totalAmp = 0.001;
        for(int i=0; i<7; i++) {
            merrickColor += hsv2rgb(vec3(u_hues[i], 0.8, 1.0)) * u_amps[i];
            totalAmp += u_amps[i];
        }
        merrickColor /= totalAmp;
        // Add a base color if no audio is playing
        if (totalAmp < 0.01) merrickColor = vec3(0.2, 0.4, 0.8);
    }
    
    if(d0 < 10.0) {
        vec3 n = calcNormal(p);
        vec3 light1 = normalize(vec3(1.0, 1.0, 1.0));
        vec3 light2 = normalize(vec3(-1.0, -1.0, 1.0));
        
        float viewAngle = max(dot(n, -rd), 0.0);
        
        // Iridescence (Thin film interference)
        vec3 iridColor;
        if (u_colorMode == 0) {
            iridColor = merrickColor * (0.5 + 0.5 * cos(u_time * 0.5 + viewAngle * u_iridescence + u_colorShift));
        } else {
            float mixVal = 0.5 + 0.5 * sin(u_time * 0.5 + viewAngle * u_iridescence + u_colorShift);
            iridColor = mix(u_color1, u_color2, mixVal);
        }
        
        // Fresnel effect (brighter at edges) with user-controlled power
        float fresnel = pow(1.0 - viewAngle, max(0.5, u_fresnelPower));
        
        // Lighting
        float diff1 = max(dot(n, light1), 0.0);
        float diff2 = max(dot(n, light2), 0.0);
        float spec1 = pow(max(dot(reflect(-light1, n), -rd), 0.0), 64.0) * u_specularGlint;
        float spec2 = pow(max(dot(reflect(-light2, n), -rd), 0.0), 32.0) * u_specularGlint;
        
        // Combine lighting and iridescence
        col = iridColor * (diff1 * 0.3 + diff2 * 0.1) * 0.5;
        col += fresnel * iridColor * 2.0;
        col += vec3(1.0) * (spec1 + spec2 * 0.5);
        
        // Thickness modulation
        col *= mix(0.5, 1.0, u_thickness);
        
        alpha = fresnel + spec1 + spec2 + 0.1;
        alpha = clamp(alpha, 0.0, 1.0);
    }
    
    // Background glow based on audio
    float glow = exp(-d0 * 0.2) * (0.1 + u_audioReactivity * 0.2) * u_glowIntensity;
    vec3 bgGlowColor = u_colorMode == 0 ? merrickColor : u_color1;
    col += bgGlowColor * glow;
    
    col = mix(col, u_bgColor, smoothstep(5.0, 10.0, d0));
    
    // Gamma correction
    col = pow(col, vec3(1.0 / 2.2));
    
    fragColor = vec4(col, u_opacity * (d0 < 10.0 ? alpha : glow));
}`;

export const Lens_Holocymatic: VisualizerPlugin = {
    id: 'HOLOCYMATIC',
    name: 'Holocymatic 3D',
    renderType: 'WEBGL',
    
    parameters: [
        { id: 'colorMode', label: 'Color Mode', type: 'SELECT', options: ['Harmonic (Merrick)', 'Custom'], section: 'COLOR', defaultValue: 'Harmonic (Merrick)' },
        { id: 'color1', label: 'Primary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#00ffff' },
        { id: 'color2', label: 'Secondary Color', type: 'COLOR', section: 'COLOR', defaultValue: '#ff00ff' },
        { id: 'bgColor', label: 'Background Color', type: 'COLOR', section: 'COLOR', defaultValue: '#000000' },
        { id: 'glowIntensity', label: 'Glow Intensity', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'LIGHT', defaultValue: 1.0 },
        { id: 'complexity', label: 'Harmonic Mode (m)', type: 'SLIDER', min: 1.0, max: 12.0, step: 1.0, section: 'GEOMETRY', defaultValue: 4.0 },
        { id: 'frequency', label: 'Harmonic Mode (n)', type: 'SLIDER', min: 1.0, max: 12.0, step: 1.0, section: 'GEOMETRY', defaultValue: 4.0 },
        { id: 'amplitude', label: 'Wave Amplitude', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.6 },
        { id: 'pulseSpeed', label: 'Pulse Speed', type: 'SLIDER', min: 0.0, max: 4.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'noiseScale', label: 'Capillary Ripples', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'torusFactor', label: 'Torus Field Morph', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'torusThickness', label: 'Torus Tube Radius', type: 'SLIDER', min: 0.1, max: 1.2, step: 0.01, section: 'GEOMETRY', defaultValue: 0.6 },
        { id: 'rotationSpeed', label: 'Rotation Speed', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 0.2 },
        { id: 'colorShift', label: 'Iridescence Hue', type: 'SLIDER', min: 0.0, max: 6.28, step: 0.01, section: 'LIGHT', defaultValue: 0.0 },
        { id: 'iridescence', label: 'Film Thickness', type: 'SLIDER', min: 1.0, max: 20.0, step: 0.1, section: 'LIGHT', defaultValue: 10.0 },
        { id: 'thickness', label: 'Bubble Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'LIGHT', defaultValue: 0.8 },
        { id: 'specularGlint', label: 'Specular Glint', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.05, section: 'LIGHT', defaultValue: 1.0 },
        { id: 'fresnelPower', label: 'Rim Sharpness', type: 'SLIDER', min: 0.5, max: 6.0, step: 0.1, section: 'LIGHT', defaultValue: 3.0 },
        { id: 'opacity', label: 'Master Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'audioReactivity', label: 'Audio Reactivity', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 }
    ],
    
    presets: PRESETS,
    
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, time, memory } = context;

        if (!memory.holocymaticInit || !memory.holoLocTime) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
                return s;
            };

            memory.holoProg = gl.createProgram()!;
            gl.attachShader(memory.holoProg, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(memory.holoProg, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(memory.holoProg);

            memory.holoVao = gl.createVertexArray();
            gl.bindVertexArray(memory.holoVao);
            const qBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            
            const posLoc = gl.getAttribLocation(memory.holoProg, "a_position");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            const getLoc = (name: string) => gl.getUniformLocation(memory.holoProg, name);
            
            memory.holoLocTime = getLoc("u_time");
            memory.holoLocAspect = getLoc("u_aspect");
            memory.holoLocCenterOffset = getLoc("u_centerOffset");
            memory.holoLocAudio = getLoc("u_audioReactivity");
            
            memory.holoLocComplexity = getLoc("u_complexity");
            memory.holoLocFrequency = getLoc("u_frequency");
            memory.holoLocAmplitude = getLoc("u_amplitude");
            memory.holoLocPulseSpeed = getLoc("u_pulseSpeed");
            memory.holoLocNoiseScale = getLoc("u_noiseScale");
            memory.holoLocTorus = getLoc("u_torusFactor");
            memory.holoLocTorusThickness = getLoc("u_torusThickness");
            memory.holoLocRot = getLoc("u_rotationSpeed");
            memory.holoLocColor = getLoc("u_colorShift");
            memory.holoLocOpacity = getLoc("u_opacity");
            memory.holoLocThick = getLoc("u_thickness");
            memory.holoLocIrid = getLoc("u_iridescence");
            memory.holoLocSpec = getLoc("u_specularGlint");
            memory.holoLocFresnel = getLoc("u_fresnelPower");
            
            memory.holoLocColorMode = getLoc("u_colorMode");
            memory.holoLocColor1 = getLoc("u_color1");
            memory.holoLocColor2 = getLoc("u_color2");
            memory.holoLocBgColor = getLoc("u_bgColor");
            memory.holoLocGlowIntensity = getLoc("u_glowIntensity");
            memory.holoLocAmps = getLoc("u_amps");
            memory.holoLocHues = getLoc("u_hues");
            memory.holoLocVisualScale = getLoc("u_visualScale");

            memory.holocymaticInit = true;
        }

        gl.viewport(0, 0, w, h);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        const bg = hex2rgb(getStr(cfg.bgColor, '#000000'));
        gl.clearColor(bg[0], bg[1], bg[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(memory.holoProg);
        gl.bindVertexArray(memory.holoVao);

        gl.uniform1f(memory.holoLocTime, time);
        gl.uniform1f(memory.holoLocAspect, w / h);
        gl.uniform2f(memory.holoLocCenterOffset, (context.cx as number / w) * 2 - 1, 1 - (context.cy as number / h) * 2);
        
        // Calculate audio reactivity from amplitudes
        let audioSum = 0;
        if (context.amplitudes) {
            context.amplitudes.forEach(val => audioSum += val);
        }
        const audioReact = getVal(cfg.audioReactivity, 1.0) * audioSum;
        
        gl.uniform1f(memory.holoLocAudio, audioReact);

        gl.uniform1f(memory.holoLocComplexity, getVal(cfg.complexity, 4.0));
        gl.uniform1f(memory.holoLocFrequency, getVal(cfg.frequency, 4.0));
        gl.uniform1f(memory.holoLocAmplitude, getVal(cfg.amplitude, 0.6) * 0.05);
        gl.uniform1f(memory.holoLocPulseSpeed, getVal(cfg.pulseSpeed, 1.0));
        gl.uniform1f(memory.holoLocNoiseScale, getVal(cfg.noiseScale, 0.0));
        gl.uniform1f(memory.holoLocTorus, getVal(cfg.torusFactor, 0.0));
        gl.uniform1f(memory.holoLocTorusThickness, getVal(cfg.torusThickness, 0.6));
        gl.uniform1f(memory.holoLocRot, getVal(cfg.rotationSpeed, 0.2));
        gl.uniform1f(memory.holoLocColor, getVal(cfg.colorShift, 0.0));
        gl.uniform1f(memory.holoLocOpacity, getVal(cfg.opacity, 1.0));
        gl.uniform1f(memory.holoLocThick, getVal(cfg.thickness, 0.8));
        gl.uniform1f(memory.holoLocIrid, getVal(cfg.iridescence, 10.0));
        gl.uniform1f(memory.holoLocSpec, getVal(cfg.specularGlint, 1.0));
        gl.uniform1f(memory.holoLocFresnel, getVal(cfg.fresnelPower, 3.0));
        
        const cMode = getStr(cfg.colorMode, 'Harmonic (Merrick)') === 'Harmonic (Merrick)' ? 0 : 1;
        gl.uniform1i(memory.holoLocColorMode, cMode);
        
        const amps = [0,0,0,0,0,0,0];
        const hues = [0,0,0,0,0,0,0];
        for (let i = 0; i < 7; i++) {
            hues[i] = getFrequencyHSL(UNIVERSAL_CHANNELS[i].freq).h;
        }
        if (context.amplitudes) {
            const activeEntries: { freq: number, amp: number }[] = [];
            for (const [key, val] of context.amplitudes.entries()) {
                if (val > 0.001) {
                    const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                    const freq = !isNaN(freqNum) && freqNum > 0 ? freqNum : LATTICE_CHANNELS.find(c => c.id === key)?.freq;
                    if (freq) activeEntries.push({ freq, amp: val });
                }
            }
            activeEntries.sort((a, b) => b.amp - a.amp);
            for (let i = 0; i < Math.min(7, activeEntries.length); i++) {
                amps[i] = activeEntries[i].amp;
                hues[i] = getFrequencyHSL(activeEntries[i].freq).h;
            }
        }
        gl.uniform1fv(memory.holoLocAmps, amps);
        gl.uniform1fv(memory.holoLocHues, hues);
        
        const c1 = hex2rgb(getStr(cfg.color1, '#00ffff'));
        gl.uniform3f(memory.holoLocColor1, c1[0], c1[1], c1[2]);
        const c2 = hex2rgb(getStr(cfg.color2, '#ff00ff'));
        gl.uniform3f(memory.holoLocColor2, c2[0], c2[1], c2[2]);
        gl.uniform3f(memory.holoLocBgColor, bg[0], bg[1], bg[2]);
        gl.uniform1f(memory.holoLocGlowIntensity, getVal(cfg.glowIntensity, 1.0));
        gl.uniform1f(memory.holoLocVisualScale, (context.visualScale as number) || 1.0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.holoProg) gl.deleteProgram(memory.holoProg as WebGLProgram);
            if (memory.holoVao) gl.deleteVertexArray(memory.holoVao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
