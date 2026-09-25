import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, CHORD_VOICE_CHANNELS, HEART_CHANNELS, getFrequencyRGB } from './shared';
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
        id: 'venus_1',
        name: '01. Orbital Rose',
        config: { 
            speed: 1.0, trailLength: 0.94, glow: 0.53, centerRayOpacity: 0.0, orbitalLineOpacity: 0.85,
            nodeSize: 0.018, audioReactivity: 1.0, masterOpacity: 1.0,
            colorMode: 'Harmonic (Merrick)', earthColor: '#4ade80', venusColor: '#facc15', lineColor: '#ffcc66', bgColor: '#000000'
        },
        modulations: {}
    },
    {
        id: 'venus_2',
        name: '02. Solar Mandala',
        config: { 
            speed: 0.8, trailLength: 0.92, glow: 0.45, centerRayOpacity: 0.35, orbitalLineOpacity: 0.9,
            nodeSize: 0.016, audioReactivity: 1.0, masterOpacity: 1.0,
            colorMode: 'Harmonic (Merrick)', earthColor: '#38bdf8', venusColor: '#f43f5e', lineColor: '#e2e8f0', bgColor: '#000000'
        },
        modulations: {}
    }
];

const VS = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FS_DRAW = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_aspect;
uniform vec2 u_center;
uniform float u_audio;
uniform float u_glow;
uniform float u_chordPulse;

uniform float u_centerRayOpacity;
uniform float u_orbitalLineOpacity;
uniform float u_nodeSize;

uniform int u_colorMode;
uniform vec3 u_earthColor;
uniform vec3 u_venusColor;
uniform vec3 u_lineColor;

uniform int u_numTones;
uniform float u_angles[8];
uniform float u_radii[8];
uniform float u_amps[8];
uniform vec3 u_toneColors[8];
uniform float u_rootFreq;
uniform float u_visualScale;
uniform float u_morphAlpha;
uniform float u_kaleidoscope;
uniform float u_crystalline;

${KALEIDOSCOPE_GLSL_FUNCS}

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 uv = v_uv * 2.0 - 1.0;
    uv -= u_center;
    uv /= max(0.01, u_visualScale);
    uv.x *= u_aspect;
    
    if (u_kaleidoscope > 1.5) {
        uv = applyKaleidoscopeFold(uv, u_kaleidoscope);
    }
    if (u_crystalline > 1.5) {
        uv = applyCrystallineLayer(uv, u_crystalline);
    }
    
    vec3 col = vec3(0.0);
    vec2 center = vec2(0.0);
    
    vec2 positions[8];
    vec3 colors[8];
    
    for(int i=0; i<8; i++) {
        if (i >= u_numTones) break;
        
        float amp = u_amps[i];
        float r = u_radii[i];
        float angle = u_angles[i];
        
        // Fluid continuous celestial coordinates
        positions[i] = vec2(cos(angle), sin(angle)) * r;
        
        if (u_colorMode == 0) {
            colors[i] = u_toneColors[i];
        } else {
            float t = u_numTones > 1 ? float(i) / float(u_numTones - 1) : 0.5;
            colors[i] = mix(u_earthColor, u_venusColor, t);
        }
        
        // Planet orbital node with delicate radiant glow
        float dPlanet = length(uv - positions[i]) - (u_nodeSize + amp * 0.01);
        float planetCore = smoothstep(0.003, 0.0, dPlanet);
        float planetGlow = exp(-length(uv - positions[i]) * 20.0) * (u_glow + u_chordPulse * 0.35) * (0.6 + amp * 1.0);
        col += colors[i] * (planetCore * 1.5 + planetGlow) * u_morphAlpha;
        
        // Radiant trigger ripple wave on chord change
        if (u_chordPulse > 0.001) {
            float waveR = (1.0 - u_chordPulse) * 0.22;
            float dRing = abs(length(uv - positions[i]) - waveR);
            float ringCore = smoothstep(0.012, 0.0, dRing) * u_chordPulse * 0.7;
            float ringGlow = exp(-dRing * 16.0) * u_chordPulse * 0.4;
            col += colors[i] * (ringCore + ringGlow);
        }
        
        // Optional harmonic ray line connecting orbital node to center
        if (u_centerRayOpacity > 0.001) {
            float dLineRoot = sdSegment(uv, center, positions[i]);
            float lineCoreRoot = smoothstep(0.003, 0.0, dLineRoot);
            float lineGlowRoot = exp(-dLineRoot * 24.0) * u_glow * (0.2 + amp * 0.3);
            col += colors[i] * (lineCoreRoot * 0.7 + lineGlowRoot) * u_centerRayOpacity * u_morphAlpha;
        }
    }
    
    // Inter-orbital resonance geometry (Pentagram / Rose weave lines between nodes)
    if (u_orbitalLineOpacity > 0.001 && u_numTones > 1) {
        float pulseBoost = 1.0 + u_chordPulse * 0.5;
        for(int i=0; i<8; i++) {
            if (i >= u_numTones) break;
            for(int j=i+1; j<8; j++) {
                if (j >= u_numTones) break;
                float dLine = sdSegment(uv, positions[i], positions[j]);
                float lineCore = smoothstep(0.003, 0.0, dLine);
                float lineGlow = exp(-dLine * 22.0) * u_glow * 0.35;
                vec3 mixCol = mix(colors[i], colors[j], 0.5);
                col += mixCol * (lineCore * 0.85 + lineGlow) * u_orbitalLineOpacity * pulseBoost * u_morphAlpha;
            }
        }
    }
    
    // Central core node (subtle harmonic center)
    float dRoot = length(uv - center) - 0.015 - u_audio * 0.01;
    vec3 rootCol = u_colorMode == 0 ? (u_numTones > 0 ? colors[0] : vec3(0.5, 0.6, 0.8)) : u_lineColor;
    float rootCore = smoothstep(0.003, 0.0, dRoot);
    float rootGlow = exp(-length(uv - center) * 22.0) * u_glow * 0.5;
    col += rootCol * (rootCore + rootGlow);
    
    fragColor = vec4(col, 1.0);
}`;

const FS_TRAIL = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform float u_trailLength;

void main() {
    vec4 col = texture(u_tex, v_uv);
    fragColor = vec4(col.rgb * u_trailLength, col.a);
}`;

const FS_OUTPUT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform float u_opacity;
uniform vec3 u_bgColor;

void main() {
    vec4 col = texture(u_tex, v_uv);
    vec3 finalCol = u_bgColor + col.rgb;
    fragColor = vec4(finalCol, col.a * u_opacity);
}`;

export const Lens_VenusPentagram: VisualizerPlugin = {
    id: 'VENUS_PENTAGRAM',
    name: 'Venus Pentagram',
    renderType: 'WEBGL',
    defaultConfig: {
        speed: 1.0, trailLength: 0.94, glow: 0.53, centerRayOpacity: 0.0, orbitalLineOpacity: 0.85,
        nodeSize: 0.018, audioReactivity: 1.0, masterOpacity: 1.0,
        colorMode: 'Harmonic (Merrick)', earthColor: '#4ade80', venusColor: '#facc15', lineColor: '#ffcc66', bgColor: '#000000',
        kaleidoscope: 0, crystallineLayer: 0
    },
    parameters: [
        { id: 'speed', label: 'Orbital Speed', type: 'SLIDER', min: 0.0, max: 5.0, step: 0.1, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'centerRayOpacity', label: 'Center Line Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'orbitalLineOpacity', label: 'Orbital Line Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GEOMETRY', defaultValue: 0.85 },
        { id: 'nodeSize', label: 'Node Size', type: 'SLIDER', min: 0.005, max: 0.04, step: 0.001, section: 'GEOMETRY', defaultValue: 0.018 },
        { id: 'trailLength', label: 'Trail Persistence', type: 'SLIDER', min: 0.5, max: 0.94, step: 0.001, section: 'LIGHT', defaultValue: 0.94 },
        { id: 'glow', label: 'Energy Glow', type: 'SLIDER', min: 0.0, max: 0.53, step: 0.01, section: 'LIGHT', defaultValue: 0.53 },
        { id: 'audioReactivity', label: 'Audio Reactivity', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.01, section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'kaleidoscope', label: 'Kaleidoscope Folds', icon: 'Compass', type: 'SLIDER', min: 0, max: 24, step: 2, color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'crystallineLayer', label: 'Crystalline Facets', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 16, step: 1, color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 0 },
        { id: 'colorMode', label: 'Color Mode', type: 'SELECT', options: ['Harmonic (Merrick)', 'Custom'], section: 'COLOR', defaultValue: 'Harmonic (Merrick)' },
        { id: 'earthColor', label: 'Earth Color', type: 'COLOR', section: 'COLOR', defaultValue: '#4ade80' },
        { id: 'venusColor', label: 'Venus Color', type: 'COLOR', section: 'COLOR', defaultValue: '#facc15' },
        { id: 'lineColor', label: 'Line Color', type: 'COLOR', section: 'COLOR', defaultValue: '#ffcc66' },
        { id: 'bgColor', label: 'Background Color', type: 'COLOR', section: 'COLOR', defaultValue: '#000000' },
        { id: 'masterOpacity', label: 'Master Opacity', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, section: 'GLOBAL', defaultValue: 1.0 }
    ],
    presets: PRESETS,
    render: (context: LensContext, lCfg?: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;
        const cfg = lCfg ? { ...context.config, ...lCfg } : context.config;
        const { w, h, dt, memory, amplitudes, globalBinauralBeat } = context;

        if (!memory.vp_init || memory.vp_w !== w || memory.vp_h !== h) {
            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
                return s;
            };

            if (!memory.vp_progDraw) {
                memory.vp_progDraw = gl.createProgram()!;
                gl.attachShader(memory.vp_progDraw, compile(gl.VERTEX_SHADER, VS));
                gl.attachShader(memory.vp_progDraw, compile(gl.FRAGMENT_SHADER, FS_DRAW));
                gl.bindAttribLocation(memory.vp_progDraw, 0, "a_position");
                gl.linkProgram(memory.vp_progDraw);

                memory.vp_progTrail = gl.createProgram()!;
                gl.attachShader(memory.vp_progTrail, compile(gl.VERTEX_SHADER, VS));
                gl.attachShader(memory.vp_progTrail, compile(gl.FRAGMENT_SHADER, FS_TRAIL));
                gl.bindAttribLocation(memory.vp_progTrail, 0, "a_position");
                gl.linkProgram(memory.vp_progTrail);

                memory.vp_progOut = gl.createProgram()!;
                gl.attachShader(memory.vp_progOut, compile(gl.VERTEX_SHADER, VS));
                gl.attachShader(memory.vp_progOut, compile(gl.FRAGMENT_SHADER, FS_OUTPUT));
                gl.bindAttribLocation(memory.vp_progOut, 0, "a_position");
                gl.linkProgram(memory.vp_progOut);

                memory.vp_vao = gl.createVertexArray();
                gl.bindVertexArray(memory.vp_vao);
                const qBuf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
                
                gl.enableVertexAttribArray(0);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

                const getLocD = (name: string) => gl.getUniformLocation(memory.vp_progDraw, name);
                memory.vp_locsD = {
                    time: getLocD("u_time"),
                    aspect: getLocD("u_aspect"),
                    center: getLocD("u_center"),
                    audio: getLocD("u_audio"),
                    glow: getLocD("u_glow"),
                    chordPulse: getLocD("u_chordPulse"),
                    centerRayOpacity: getLocD("u_centerRayOpacity"),
                    orbitalLineOpacity: getLocD("u_orbitalLineOpacity"),
                    nodeSize: getLocD("u_nodeSize"),
                    colorMode: getLocD("u_colorMode"),
                    earthColor: getLocD("u_earthColor"),
                    venusColor: getLocD("u_venusColor"),
                    lineColor: getLocD("u_lineColor"),
                    numTones: getLocD("u_numTones"),
                    angles: getLocD("u_angles"),
                    radii: getLocD("u_radii"),
                    amps: getLocD("u_amps"),
                    toneColors: getLocD("u_toneColors"),
                    rootFreq: getLocD("u_rootFreq"),
                    visualScale: getLocD("u_visualScale"),
                    morphAlpha: getLocD("u_morphAlpha"),
                    kaleidoscope: getLocD("u_kaleidoscope"),
                    crystalline: getLocD("u_crystalline")
                };

                const getLocT = (name: string) => gl.getUniformLocation(memory.vp_progTrail, name);
                memory.vp_locsT = {
                    tex: getLocT("u_tex"),
                    trailLength: getLocT("u_trailLength")
                };

                const getLocO = (name: string) => gl.getUniformLocation(memory.vp_progOut, name);
                memory.vp_locsO = {
                    tex: getLocO("u_tex"),
                    opacity: getLocO("u_opacity"),
                    bgColor: getLocO("u_bgColor")
                };
            }

            // Create FBOs
            const createFBO = () => {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                const fbo = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
                return { tex, fbo };
            };

            if (memory.vp_fboRead) gl.deleteFramebuffer(memory.vp_fboRead.fbo);
            if (memory.vp_fboWrite) gl.deleteFramebuffer(memory.vp_fboWrite.fbo);
            
            memory.vp_fboRead = createFBO();
            memory.vp_fboWrite = createFBO();
            
            // Clear FBOs
            gl.bindFramebuffer(gl.FRAMEBUFFER, memory.vp_fboRead.fbo);
            gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, memory.vp_fboWrite.fbo);
            gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);

            memory.vp_w = w;
            memory.vp_h = h;
            memory.vp_time = 0;
            memory.vp_chordPulse = 0;
            memory.vp_init = true;
        }

        let audioSum = 0;
        if (amplitudes) amplitudes.forEach(val => audioSum += val);
        const react = getVal(cfg.audioReactivity, 1.0) * audioSum;
        const speed = getVal(cfg.speed, 1.0) * (1.0 + react * 0.2);
        const deltaTime = Math.min(0.05, Math.max(0.001, dt || 0.016));
        
        // Initialize persistent continuous orbital state in memory if needed
        if (!memory.vp_currentRadii) {
            memory.vp_currentRadii = new Float32Array(8);
            memory.vp_currentAmps = new Float32Array(8);
            memory.vp_currentColors = new Float32Array(24);
            memory.vp_angles = new Float32Array(8);
            memory.vp_targetFreqs = new Float32Array(8);
            memory.vp_currentFreqs = new Float32Array(8);
            memory.vp_activeToneCount = 2;
            memory.vp_morphAlpha = 1.0;
            memory.vp_chordPulse = 0.0;
            memory.vp_fadeTimer = 0.0;
            
            // Seed initial state with Venus-Earth 8:5 ratio
            const r0 = 0.28, r1 = 0.44;
            memory.vp_currentRadii[0] = r0;
            memory.vp_currentRadii[1] = r1;
            memory.vp_currentAmps[0] = 0.6;
            memory.vp_currentAmps[1] = 0.6;
            memory.vp_currentFreqs[0] = 256.0;
            memory.vp_currentFreqs[1] = 256.0 * (8.0 / 5.0);
            const rgb0 = getFrequencyRGB(256.0);
            const rgb1 = getFrequencyRGB(256.0 * 1.6);
            memory.vp_currentColors[0] = rgb0.r/255; memory.vp_currentColors[1] = rgb0.g/255; memory.vp_currentColors[2] = rgb0.b/255;
            memory.vp_currentColors[3] = rgb1.r/255; memory.vp_currentColors[4] = rgb1.g/255; memory.vp_currentColors[5] = rgb1.b/255;
        }

        memory.vp_chordPulse = Math.max(0.0, (memory.vp_chordPulse || 0) - deltaTime * 1.2);

        // Extract active tones from audio
        const targetFreqs = [0,0,0,0,0,0,0,0];
        const targetAmps = [0,0,0,0,0,0,0,0];
        const targetColors = new Float32Array(24);
        let numTones = 0;
        
        const customFreqs = (context.customFrequencies as Record<string, number>) || {};
        const chordVoiceIds = CHORD_VOICE_CHANNELS.map(c => c.id);
        const candidateTones: { id: string; freq: number; amp: number }[] = [];
        
        if (amplitudes) {
            for (const [key, val] of amplitudes.entries()) {
                if (val > 0.001) {
                    const strKey = String(key);
                    const freqNum = typeof key === 'number' ? key : parseFloat(strKey);
                    let freq: number | undefined;
                    if (!isNaN(freqNum) && freqNum > 0 && !strKey.startsWith('UNIVERSAL_') && !strKey.startsWith('MUSIC_SCALE_')) {
                        freq = freqNum;
                    } else if (customFreqs[strKey]) {
                        freq = customFreqs[strKey];
                    } else {
                        const stdCh = LATTICE_CHANNELS.find(c => c.id === strKey) 
                                   || CHORD_VOICE_CHANNELS.find(c => c.id === strKey) 
                                   || HEART_CHANNELS.find(c => c.id === strKey);
                        if (stdCh) freq = stdCh.freq;
                    }
                    if (freq && freq > 1.0) {
                        candidateTones.push({ id: strKey, freq, amp: val });
                    }
                }
            }
        }
        
        let activeChordTones = candidateTones.filter(t => chordVoiceIds.includes(t.id) || t.id.startsWith('MUSIC_SCALE_'));
        
        if (activeChordTones.length === 0) {
            const mutes = (context as any).data?.audio?.mutes || (context as any).mutes || {};
            for (const id of chordVoiceIds) {
                const freq = customFreqs[id];
                const isMuted = mutes[id] ?? false;
                if (freq && freq > 20 && !isMuted) {
                    activeChordTones.push({ id, freq, amp: 0.8 });
                }
            }
        }
        
        const activeTonesToUse = activeChordTones.length > 0 ? activeChordTones : candidateTones;
        
        const uniqueEntries: { freq: number; amp: number }[] = [];
        for (const entry of activeTonesToUse) {
            const existing = uniqueEntries.find(e => Math.abs(e.freq - entry.freq) < 0.5);
            if (existing) {
                existing.amp = Math.max(existing.amp, entry.amp);
            } else {
                uniqueEntries.push({ freq: entry.freq, amp: entry.amp });
            }
        }
        uniqueEntries.sort((a, b) => a.freq - b.freq);
        
        if (uniqueEntries.length > 0) {
            for (let i = 0; i < Math.min(8, uniqueEntries.length); i++) {
                const { freq, amp } = uniqueEntries[i];
                targetFreqs[numTones] = freq;
                targetAmps[numTones] = amp;
                const rgb = getFrequencyRGB(freq);
                targetColors[numTones * 3] = rgb.r / 255;
                targetColors[numTones * 3 + 1] = rgb.g / 255;
                targetColors[numTones * 3 + 2] = rgb.b / 255;
                numTones++;
            }
        } else {
            numTones = 2;
            targetFreqs[0] = 256.0;
            targetFreqs[1] = 256.0 * (8.0 / 5.0);
            targetAmps[0] = 0.6;
            targetAmps[1] = 0.6;
            const rgb0 = getFrequencyRGB(targetFreqs[0]);
            const rgb1 = getFrequencyRGB(targetFreqs[1]);
            targetColors[0] = rgb0.r / 255; targetColors[1] = rgb0.g / 255; targetColors[2] = rgb0.b / 255;
            targetColors[3] = rgb1.r / 255; targetColors[4] = rgb1.g / 255; targetColors[5] = rgb1.b / 255;
        }

        // Detect chord change / scale transition
        const chordKey = uniqueEntries.map(e => Math.round(e.freq * 10) / 10).join('_');
        if (memory.vp_lastChordKey !== undefined && memory.vp_lastChordKey !== chordKey && uniqueEntries.length > 0) {
            memory.vp_chordPulse = 1.0;
            memory.vp_fadeTimer = 1.0; // Trigger fluid fade in/out window
        }
        memory.vp_lastChordKey = chordKey;

        // Smoothly decay fade timer toward 0
        if (memory.vp_fadeTimer > 0) {
            memory.vp_fadeTimer = Math.max(0.0, memory.vp_fadeTimer - deltaTime * 1.5);
        }

        // Fluid morph alpha curve: soft dip during chord shift, then blooming back
        // When fadeTimer is 1.0 -> dip to 0.5, when 0.0 -> full 1.0
        const transitionDip = memory.vp_fadeTimer > 0.5 
            ? (1.0 - memory.vp_fadeTimer) * 2.0 // 1.0 -> 0.0 dip
            : (1.0 - memory.vp_fadeTimer);      // recover back to 1.0
        const morphAlpha = 0.55 + 0.45 * Math.sin(transitionDip * Math.PI * 0.5);

        // Smooth continuous interpolation of tone count, radii, amps, freqs, and colors
        const lerpSpeed = Math.min(1.0, deltaTime * 3.5); // Smooth organic glide (~300-400ms transition)
        const toneCountLerp = Math.min(1.0, deltaTime * 4.0);
        memory.vp_activeToneCount += (numTones - memory.vp_activeToneCount) * toneCountLerp;
        const currentActiveTones = Math.round(memory.vp_activeToneCount);

        const targetRootFreq = targetFreqs[0] > 0.001 ? targetFreqs[0] : (globalBinauralBeat || 256.0);
        const currentRootFreq = memory.vp_currentFreqs[0] > 0.001 ? memory.vp_currentFreqs[0] : targetRootFreq;

        const uploadRadii = new Float32Array(8);
        const uploadAngles = new Float32Array(8);
        const uploadAmps = new Float32Array(8);

        for (let i = 0; i < 8; i++) {
            // Target radius calculation
            const spacing = 0.50 / Math.max(2, numTones);
            const targetR = i < numTones ? (0.20 + i * spacing) : 0.0;
            const targetAmp = i < numTones ? targetAmps[i] : 0.0;
            const targetF = i < numTones ? targetFreqs[i] : (targetRootFreq * (1 + i * 0.2));

            // Continuous exponential smoothing for orbital radius, amp, and frequency
            memory.vp_currentRadii[i] += (targetR - memory.vp_currentRadii[i]) * lerpSpeed;
            memory.vp_currentAmps[i] += (targetAmp - memory.vp_currentAmps[i]) * lerpSpeed;
            memory.vp_currentFreqs[i] += (targetF - memory.vp_currentFreqs[i]) * lerpSpeed;

            // Smooth color interpolation
            for (let c = 0; c < 3; c++) {
                const idx = i * 3 + c;
                memory.vp_currentColors[idx] += (targetColors[idx] - memory.vp_currentColors[idx]) * lerpSpeed;
            }

            // Continuous phase integration: angular velocity based on current smoothed frequency ratio
            const currentRatio = memory.vp_currentFreqs[i] / Math.max(1.0, currentRootFreq);
            const angVel = currentRatio * 1.5 * speed;
            memory.vp_angles[i] = (memory.vp_angles[i] + deltaTime * angVel) % (Math.PI * 2000.0);

            uploadRadii[i] = memory.vp_currentRadii[i];
            uploadAngles[i] = memory.vp_angles[i];
            uploadAmps[i] = memory.vp_currentAmps[i];
        }

        gl.viewport(0, 0, w, h);

        // 1. Bind Write FBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, memory.vp_fboWrite.fbo);
        gl.disable(gl.BLEND);

        // 2. Draw Read FBO (old trail) with dynamic dissipation during chord transitions
        gl.useProgram(memory.vp_progTrail);
        gl.bindVertexArray(memory.vp_vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, memory.vp_fboRead.tex);
        gl.uniform1i(memory.vp_locsT.tex, 0);

        // When a chord changes, gently accelerate trail decay so old geometric lines dissolve like cosmic dust
        const baseTrailVal = Math.min(0.95, getVal(cfg.trailLength, 0.94));
        const fadeTransitionDamping = memory.vp_fadeTimer > 0.0 ? (1.0 - memory.vp_fadeTimer * 0.12) : 1.0;
        const effectiveTrail = baseTrailVal * (1.0 - (memory.vp_chordPulse || 0) * 0.20) * fadeTransitionDamping;
        gl.uniform1f(memory.vp_locsT.trailLength, Math.max(0.75, effectiveTrail));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // 3. Draw new frame on top (additive)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE); // Additive
        gl.useProgram(memory.vp_progDraw);
        gl.bindVertexArray(memory.vp_vao);
        gl.uniform1f(memory.vp_locsD.time, memory.vp_time);
        gl.uniform1f(memory.vp_locsD.aspect, w / h);
        gl.uniform2f(memory.vp_locsD.center, (context.cx as number / w) * 2.0 - 1.0, 1.0 - (context.cy as number / h) * 2.0);
        gl.uniform1f(memory.vp_locsD.audio, react);
        const glowVal = Math.min(0.53, getVal(cfg.glow, 0.53));
        gl.uniform1f(memory.vp_locsD.glow, glowVal);
        gl.uniform1f(memory.vp_locsD.chordPulse, memory.vp_chordPulse || 0.0);
        gl.uniform1f(memory.vp_locsD.morphAlpha, morphAlpha);
        
        gl.uniform1f(memory.vp_locsD.centerRayOpacity, getVal(cfg.centerRayOpacity, 0.0));
        gl.uniform1f(memory.vp_locsD.orbitalLineOpacity, getVal(cfg.orbitalLineOpacity, 0.85));
        gl.uniform1f(memory.vp_locsD.nodeSize, getVal(cfg.nodeSize, 0.018));
        gl.uniform1f(memory.vp_locsD.visualScale, (context.visualScale as number) || 1.0);
        
        gl.uniform1i(memory.vp_locsD.numTones, Math.max(2, currentActiveTones));
        gl.uniform1fv(memory.vp_locsD.angles, uploadAngles);
        gl.uniform1fv(memory.vp_locsD.radii, uploadRadii);
        gl.uniform1fv(memory.vp_locsD.amps, uploadAmps);
        gl.uniform3fv(memory.vp_locsD.toneColors, memory.vp_currentColors);
        gl.uniform1f(memory.vp_locsD.rootFreq, currentRootFreq);
        
        const cMode = getStr(cfg.colorMode, 'Harmonic (Merrick)') === 'Harmonic (Merrick)' ? 0 : 1;
        gl.uniform1i(memory.vp_locsD.colorMode, cMode);
        
        const cE = hex2rgb(getStr(cfg.earthColor, '#4ade80'));
        const cV = hex2rgb(getStr(cfg.venusColor, '#facc15'));
        const cL = hex2rgb(getStr(cfg.lineColor, '#ffcc66'));
        gl.uniform3f(memory.vp_locsD.earthColor, cE[0], cE[1], cE[2]);
        gl.uniform3f(memory.vp_locsD.venusColor, cV[0], cV[1], cV[2]);
        gl.uniform3f(memory.vp_locsD.lineColor, cL[0], cL[1], cL[2]);
        gl.uniform1f(memory.vp_locsD.kaleidoscope, getVal(cfg.kaleidoscope, 0.0));
        gl.uniform1f(memory.vp_locsD.crystalline, getVal(cfg.crystallineLayer, 0.0));
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // 4. Draw Write FBO to Canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(memory.vp_progOut);
        gl.bindVertexArray(memory.vp_vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, memory.vp_fboWrite.tex);
        gl.uniform1i(memory.vp_locsO.tex, 0);
        gl.uniform1f(memory.vp_locsO.opacity, getVal(cfg.masterOpacity, 1.0));
        
        const bg = hex2rgb(getStr(cfg.bgColor, '#000000'));
        gl.uniform3f(memory.vp_locsO.bgColor, bg[0], bg[1], bg[2]);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disable(gl.BLEND);

        // 5. Swap FBOs
        const temp = memory.vp_fboRead;
        memory.vp_fboRead = memory.vp_fboWrite;
        memory.vp_fboWrite = temp;
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.vp_progDraw) gl.deleteProgram(memory.vp_progDraw as WebGLProgram);
            if (memory.vp_progTrail) gl.deleteProgram(memory.vp_progTrail as WebGLProgram);
            if (memory.vp_progOut) gl.deleteProgram(memory.vp_progOut as WebGLProgram);
            if (memory.vp_vao) gl.deleteVertexArray(memory.vp_vao as WebGLVertexArrayObject);
            if (memory.vp_fboRead) {
                gl.deleteFramebuffer((memory.vp_fboRead as any).fbo);
                gl.deleteTexture((memory.vp_fboRead as any).tex);
            }
            if (memory.vp_fboWrite) {
                gl.deleteFramebuffer((memory.vp_fboWrite as any).fbo);
                gl.deleteTexture((memory.vp_fboWrite as any).tex);
            }
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
