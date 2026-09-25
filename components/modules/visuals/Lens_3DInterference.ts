import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyRGB, getStandingWaveUndertone } from './shared';

// ── Helpers ───────────────────────────────────────────────────────────────────
const hexToRgbNorm = (hex: string): [number, number, number] => {
    if (!hex) return [34 / 255, 211 / 255, 238 / 255];
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
    if (cleanHex.length !== 6) return [34 / 255, 211 / 255, 238 / 255]; 
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
    return [r, g, b];
};

// ── Preset data ───────────────────────────────────────────────────────────────
const RAW_PRESETS: Record<string, Record<string, unknown>> = {
    DEFAULT: { masterOpacity: 0.8, visualScale: 1.0, zoom: 1.0, waveDensity: 1.0, lineThickness: 2.0, numEmitters: 2, emitterSpread: 100, staticRotation: 0, agitation: 0, isMultiplicative: 0, geometryMode: 'N-FOLD' },
    SEED_OF_LIFE: { masterOpacity: 0.8, visualScale: 1.2, zoom: 1.0, waveDensity: 1.5, lineThickness: 1.5, numEmitters: 7, emitterSpread: 120, staticRotation: 0, agitation: 0, isMultiplicative: 0, geometryMode: 'SEED' },
    TREE_OF_LIFE: { masterOpacity: 0.8, visualScale: 0.8, zoom: 1.2, waveDensity: 2.0, lineThickness: 1.0, numEmitters: 10, emitterSpread: 100, staticRotation: 0, agitation: 0.1, isMultiplicative: 1, geometryMode: 'TREE' },
    VECTOR_EQUILIBRIUM: { masterOpacity: 0.9, visualScale: 1.2, zoom: 1.0, waveDensity: 1.5, lineThickness: 1.2, numEmitters: 13, emitterSpread: 150, staticRotation: 0, agitation: 0, isMultiplicative: 0, geometryMode: 'VECTOR' },
    METATRONS_CUBE: { masterOpacity: 0.8, visualScale: 1.5, zoom: 0.8, waveDensity: 2.0, lineThickness: 1.0, numEmitters: 13, emitterSpread: 100, staticRotation: 0, agitation: 0.2, isMultiplicative: 1, geometryMode: 'METATRON' },
    FLOWER_OF_LIFE: { masterOpacity: 0.7, visualScale: 2.0, zoom: 0.6, waveDensity: 1.0, lineThickness: 2.0, numEmitters: 19, emitterSpread: 80, staticRotation: 0, agitation: 0.1, isMultiplicative: 0, geometryMode: 'FLOWER' },
    SRI_YANTRA: { masterOpacity: 0.85, visualScale: 1.0, zoom: 1.0, waveDensity: 3.0, lineThickness: 0.8, numEmitters: 10, emitterSpread: 80, staticRotation: 0, agitation: 0, isMultiplicative: 1, geometryMode: 'SRI_YANTRA' },
    CONJUGATE_VORTEX: { masterOpacity: 0.85, visualScale: 1.0, zoom: 1.0, waveDensity: 1.618, lineThickness: 1.6, numEmitters: 9, emitterSpread: 100, staticRotation: 0, agitation: 0, isMultiplicative: 0, geometryMode: 'CONJUGATE_VORTEX' }
};

// ── Shaders ───────────────────────────────────────────────────────────────────
const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// High-precision mobile-hardened fragment shader
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;

uniform vec2  u_resolution;
uniform vec2  u_center;
uniform float u_zoom;
uniform int   u_numEmitters;
uniform vec2  u_emitters[19];   
uniform int   u_numWaves;
uniform vec3  u_waves[16];      
uniform vec3  u_waveColors[16]; 
uniform float u_thickness;
uniform float u_masterOpacity;
uniform int   u_isMultiplicative;
uniform float u_agitation;
uniform float u_idlePhase;
uniform int   u_isConjugateVortex;

void main() {
    vec2 uv = gl_FragCoord.xy;
    uv.y = u_resolution.y - uv.y; 
    
    uv = (uv - u_center) / max(0.001, u_zoom) + u_center;

    vec3 finalColor = vec3(0.0);

    if (u_isConjugateVortex == 1) {
        vec2 p = (uv - u_center) / (u_resolution.y * 0.5 * max(0.001, u_zoom));
        float r = length(p);
        float theta = atan(p.y, p.x);
        
        // Golden Ratio constant
        float phi = 1.61803398875;
        float logPhi = log(phi);
        
        // Counter-rotating Golden Spirals: theta = (1 / log(phi)) * ln(r)
        // Left-handed (imploding / centripetal) vs Right-handed (exploding / centrifugal)
        float spiral1 = sin(theta - (1.0 / logPhi) * log(max(0.0001, r)) + u_idlePhase * 2.0);
        float spiral2 = sin(-theta - (1.0 / logPhi) * log(max(0.0001, r)) - u_idlePhase * 2.0);
        
        // Transverse cancellation leaves pure longitudinal compression nodes
        float interference = abs(spiral1 + spiral2) * 0.5;
        float flameIntensity = pow(interference, 2.5) * exp(-r * 1.5);
        
        // Spectral grade: 8Hz Golden Flame palette (deep obsidian to electric gold to cyan tip)
        vec3 flameColor = mix(vec3(0.02, 0.05, 0.15), vec3(1.0, 0.72, 0.15), flameIntensity);
        flameColor = mix(flameColor, vec3(0.25, 0.90, 1.0), pow(flameIntensity, 4.0));
        
        finalColor += flameColor * u_masterOpacity;
    } else if (u_numWaves == 0) {
        for (int e = 0; e < 19; e++) {
            if (e >= u_numEmitters) break;
            float d     = distance(uv, u_emitters[e]);
            float pulse = 3.0 + sin(u_idlePhase + float(e)) * 1.5;
            float alpha = 1.0 - smoothstep(0.0, max(0.5, pulse), d);
            finalColor += vec3(0.39, 0.78, 1.0) * alpha * 0.5 * u_masterOpacity;
        }
    } else {
        for (int w = 0; w < 16; w++) {
            if (w >= u_numWaves) break;

            float wavelength = max(1.0, u_waves[w].x);
            float amp        = u_waves[w].y;
            float phase      = u_waves[w].z;
            vec3  color      = u_waveColors[w];
            vec3  waveColor  = vec3(0.0);

            if (amp > 0.001) {
                for (int e = 0; e < 19; e++) {
                    if (e >= u_numEmitters) break;

                    float d           = distance(uv, u_emitters[e]);
                    float phaseOffset = u_agitation * 50.0 * float(e);
                    float offset      = d - phase - phaseOffset;
                    float rem         = mod(offset, wavelength);
                    if (rem < 0.0) rem += wavelength;
                    float distToRing  = min(rem, wavelength - rem);
                    
                    float halfThick   = max(0.5, u_thickness * 0.5);
                    float alpha       = 1.0 - smoothstep(
                        max(0.0, halfThick - 1.0),
                        halfThick + 1.0,
                        distToRing
                    );
                    waveColor += color * alpha;
                }

                waveColor *= amp * u_masterOpacity;

                if (u_isMultiplicative == 1) {
                    finalColor = abs(finalColor - waveColor * 2.0);
                } else {
                    finalColor += waveColor;
                }
            }
        }
    }

    finalColor = clamp(finalColor, 0.0, 1.0);
    if (isnan(finalColor.r) || isinf(finalColor.r)) {
        finalColor = vec3(0.0);
    }

    fragColor = vec4(finalColor, 1.0);
}
`;

// ── Plugin ────────────────────────────────────────────────────────────────────
export const Lens_3DInterference: VisualizerPlugin = {
    id:          'INTERFERENCE',
    name:        'Interference',
    renderType:  'WEBGL',

    defaultConfig: { ...RAW_PRESETS.DEFAULT },

    presets: Object.entries(RAW_PRESETS).map<VisualizerPreset>(([id, values]) => ({
        id,
        name: id.replace(/_/g, ' '),
        config: { ...values },
    })),

    parameters: [
        { id: 'geometryMode',    label: 'Sacred Geometry Map', type: 'SELECT', section: 'GEOMETRY', icon: 'Hexagon', options: ['N-FOLD', 'SEED', 'TREE', 'VECTOR', 'METATRON', 'FLOWER', 'SRI_YANTRA', 'CONJUGATE_VORTEX'], color: 'fuchsia', defaultValue: 'N-FOLD' },
        { id: 'numEmitters',     label: 'Emitter Count (N-Fold Only)', type: 'SLIDER', min: 1, max: 12, step: 1, defaultValue: 2, section: 'GEOMETRY' },
        { id: 'emitterSpread',   label: 'Geometry Spread',    type: 'SLIDER', min: 0,            max: 500,         step: 1,    defaultValue: 100,             section: 'GEOMETRY' },
        { id: 'staticRotation',  label: 'Static Rotation',    type: 'SLIDER', min: 0,            max: Math.PI * 2, step: 0.01, defaultValue: 0,               section: 'GEOMETRY' },
        
        { id: 'zoom',            label: 'Camera Zoom',        type: 'SLIDER', min: 0.1,          max: 10.0,        step: 0.1,  defaultValue: 1.0,             section: 'GLOBAL'   }, 
        { id: 'visualScale',     label: 'Visual Scale',       type: 'SLIDER', min: 0.1,          max: 3.0,         step: 0.01, defaultValue: 1.0,             section: 'GLOBAL'   },
        { id: 'masterOpacity',   label: 'Master Opacity',     type: 'SLIDER', min: 0,            max: 1,           step: 0.01, defaultValue: 0.8,             section: 'GLOBAL'   },
        { id: 'isMultiplicative',label: 'Multiplicative Blend',type: 'SLIDER',min: 0,            max: 1,           step: 1,    defaultValue: 0,               section: 'GLOBAL'   },
        
        { id: 'waveDensity',     label: 'Wave Density',       type: 'SLIDER', min: 0.1,          max: 5.0,         step: 0.01, defaultValue: 1.0,             section: 'WAVES'   },
        { id: 'lineThickness',   label: 'Line Thickness',     type: 'SLIDER', min: 0.5,          max: 10.0,        step: 0.1,  defaultValue: 2.0,             section: 'WAVES'   },
        { id: 'agitation',       label: 'Phase Agitation',    type: 'SLIDER', min: 0,            max: 1,           step: 0.01, defaultValue: 0,               section: 'WAVES'   },
    ],

    render: (context: LensContext, localConfig: Record<string, unknown>) => {
        const gl = context.gl as WebGL2RenderingContext;
        if (!gl) return;

        const memory = context.memory;

        if (!memory.gl_init) {
            const compileShader = (type: number, src: string): WebGLShader | null => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
                return s;
            };

            const vs = compileShader(gl.VERTEX_SHADER,   VERTEX_SHADER);
            const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
            if (!vs || !fs) return;

            const prog = gl.createProgram()!;
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

            const vao = gl.createVertexArray()!;
            gl.bindVertexArray(vao);
            const vbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,  1, -1, -1,  1,
                -1,  1,  1, -1,  1,  1,
            ]), gl.STATIC_DRAW);
            const posLoc = gl.getAttribLocation(prog, 'a_position');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);

            const u = (n: string) => gl.getUniformLocation(prog, n);
            memory.prog  = prog;
            memory.vao   = vao;
            memory.locs  = {
                resolution:      u('u_resolution'),
                center:          u('u_center'),
                zoom:            u('u_zoom'), 
                numEmitters:     u('u_numEmitters'),
                emitters:        u('u_emitters'),
                numWaves:        u('u_numWaves'),
                waves:           u('u_waves'),
                waveColors:      u('u_waveColors'),
                thickness:       u('u_thickness'),
                masterOpacity:   u('u_masterOpacity'),
                isMultiplicative:u('u_isMultiplicative'),
                agitation:       u('u_agitation'),
                idlePhase:       u('u_idlePhase'),
                isConjugateVortex: u('u_isConjugateVortex'),
            };

            // STRICT ARRAY LIMITS
            memory.wavePool   = Array.from({ length: 16 }, () => ({
                active: false, freq: 0, amp: 0, phase: 0, wavelength: 100, r: 1, g: 1, b: 1,
            }));
            
            memory.emitterDataArray = new Float32Array(38); // 19 * 2
            memory.waveDataArray = new Float32Array(48);    // 16 * 3
            memory.colorDataArray = new Float32Array(48);   // 16 * 3
            
            memory.colorCache = new Map<number, [number, number, number]>();
            memory.channelPhases = new Map<string, number>();

            memory.idlePhase  = 0;
            memory.gl_init    = true;
        }

        const dt = Math.min(context.dt > 0 ? context.dt : 0.016, 0.05);

        if (!memory.channelPhases) {
            memory.channelPhases = new Map<string, number>();
        }

        const cfg = localConfig || RAW_PRESETS.DEFAULT;
        const masterOpacity    = cfg.masterOpacity    ?? 0.8;
        const userZoom         = (context.visualScale as number) ?? 1.0;
        const visualScale      = (cfg.visualScale      ?? 1.0) * userZoom; 
        const zoom             = (cfg.zoom             ?? 1.0) * userZoom; 
        const waveDensity      = cfg.waveDensity      ?? 1.0;
        const lineThickness    = cfg.lineThickness    ?? 2.0;
        const baseNumEmitters  = Math.min(12, Math.max(1, Math.floor(cfg.numEmitters ?? 2)));
        const emitterSpread    = cfg.emitterSpread    ?? 100;
        const staticRotation   = cfg.staticRotation   ?? 0;
        const agitation        = cfg.agitation        ?? 0;
        const isMultiplicative = cfg.isMultiplicative ? 1 : 0;
        const geometryMode     = cfg.geometryMode     || 'N-FOLD';

        const W = gl.drawingBufferWidth;
        const H = gl.drawingBufferHeight;
        const cx = (context.cx as number);
        const cy = (context.cy as number);

        const wavePool = memory.wavePool;
        const colorCache = memory.colorCache;

        const getCachedColor = (freq: number): [number, number, number] => {
            const cached = colorCache.get(freq);
            if (cached) return cached;
            const rgbObj = getFrequencyRGB(freq);
            const norm: [number, number, number] = [rgbObj.r / 255, rgbObj.g / 255, rgbObj.b / 255];
            colorCache.set(freq, norm);
            return norm;
        };

        interface ActiveWaveCandidate {
            id: string;
            freq: number;
            amp: number;
        }
        const activeCandidates: ActiveWaveCandidate[] = [];

        // 1. Gather active lattice channels
        for (let i = 0; i < LATTICE_CHANNELS.length; i++) {
            const ch  = LATTICE_CHANNELS[i];
            const amp = (context.amplitudes as Map<string, number>)?.get(ch.id) ?? 0;
            if (amp > 0.005) {
                const effFreq = (context as any).customFrequencies?.[ch.id] ?? ch.freq;
                activeCandidates.push({ id: ch.id, freq: effFreq, amp });
            }
        }

        // 2. Gather active heart harmonics
        if (context.heartHarmonics?.vols && !context.heartHarmonics.stackMutes) {
            for (let i = 0; i < context.heartHarmonics.vols.length; i++) {
                const vol    = context.heartHarmonics.vols[i];
                const isMute = context.heartHarmonics.mutes?.[i] ?? false;
                if (!isMute && vol > 0.005) {
                    const freq = 50 * (i + 1);
                    activeCandidates.push({ id: `HEART_${i}`, freq, amp: vol });
                }
            }
        }

        // If more than 16 active harmonics, prioritize loudest to fill the 16 shader wave slots
        if (activeCandidates.length > 16) {
            activeCandidates.sort((a, b) => b.amp - a.amp);
        }

        const waveCount = Math.min(activeCandidates.length, 16);

        for (let w = 0; w < waveCount; w++) {
            const cand = activeCandidates[w];
            const effFreq = cand.freq;
            const amp = cand.amp;

            const baseWL     = (400 * visualScale) / Math.max(1, Math.log10(Math.max(1, effFreq)));
            const wavelength = Math.max(8 * visualScale, baseWL / Math.max(0.1, waveDensity));

            const visualFreq = getStandingWaveUndertone(effFreq, 90);
            const speed = visualFreq * 2.5; // pixels per second
            const cyclesPerSecond = speed / wavelength;

            // Continuous normalized phase [0, 1) strictly tied to channel identity
            let normPhase = memory.channelPhases.get(cand.id) ?? 0;
            normPhase = (normPhase + cyclesPerSecond * dt) % 1.0;
            if (normPhase < 0) normPhase += 1.0;
            memory.channelPhases.set(cand.id, normPhase);

            // Phase in pixels: wrapping modulo wavelength is mathematically continuous in shader with ZERO jumps
            const phase = normPhase * wavelength;
            const rgb = getCachedColor(effFreq);

            const slot = wavePool[w];
            slot.active = true;
            slot.freq = effFreq;
            slot.amp = amp;
            slot.phase = phase;
            slot.wavelength = wavelength;
            slot.r = rgb[0];
            slot.g = rgb[1];
            slot.b = rgb[2];
        }

        // Smooth idle phase for quiescent dots (period 2*PI, zero jump)
        memory.idlePhase = ((memory.idlePhase || 0) + 2.0 * dt) % (Math.PI * 2);

        const emitterData = memory.emitterDataArray;
        emitterData.fill(0);
        let activeEmitters = 0;

        const addPoint = (x: number, y: number) => {
            if (activeEmitters >= 19) return;
            emitterData[activeEmitters * 2] = x;
            emitterData[activeEmitters * 2 + 1] = y;
            activeEmitters++;
        };

        const R = emitterSpread * visualScale;

        if (geometryMode === 'SEED') {
            addPoint(cx, cy);
            for(let i=0; i<6; i++) {
                const a = (i/6) * Math.PI * 2 + staticRotation;
                addPoint(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
            }
        } else if (geometryMode === 'TREE') {
            const dy = -0.5 * R;
            const tx = [0, R, -R, R, -R, 0, R, -R, 0, 0];
            const ty = [-R*2 + dy, -R + dy, -R + dy, R*0.5 + dy, R*0.5 + dy, dy, R*2 + dy, R*2 + dy, R*1.5 + dy, R*3 + dy];
            for (let i = 0; i < 10; i++) {
                if (staticRotation !== 0) {
                    addPoint(
                        cx + tx[i] * Math.cos(staticRotation) - ty[i] * Math.sin(staticRotation),
                        cy + tx[i] * Math.sin(staticRotation) + ty[i] * Math.cos(staticRotation)
                    );
                } else {
                    addPoint(cx + tx[i], cy + ty[i]);
                }
            }
        } else if (geometryMode === 'VECTOR') {
            addPoint(cx, cy);
            for(let i=0; i<6; i++) {
                const a = (i/6) * Math.PI * 2 + staticRotation;
                addPoint(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
            }
            const R2 = R * Math.sqrt(3);
            for(let i=0; i<6; i++) {
                const a = (i/6) * Math.PI * 2 + staticRotation + Math.PI/6;
                addPoint(cx + Math.cos(a)*R2, cy + Math.sin(a)*R2);
            }
        } else if (geometryMode === 'METATRON') {
            addPoint(cx, cy);
            for(let i=0; i<6; i++) {
                const a = (i/6) * Math.PI * 2 + staticRotation;
                addPoint(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
                addPoint(cx + Math.cos(a)*R*2, cy + Math.sin(a)*R*2);
            }
        } else if (geometryMode === 'FLOWER') {
            addPoint(cx, cy);
            for(let i=0; i<6; i++) {
                const a = (i/6) * Math.PI * 2 + staticRotation;
                addPoint(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
            }
            for(let seg=0; seg<6; seg++) {
                const a1 = (seg/6) * Math.PI * 2 + staticRotation;
                const a2 = ((seg+1)/6) * Math.PI * 2 + staticRotation;
                const p1x = cx + Math.cos(a1)*R*2, p1y = cy + Math.sin(a1)*R*2;
                const p2x = cx + Math.cos(a2)*R*2, p2y = cy + Math.sin(a2)*R*2;
                addPoint(p1x, p1y);
                addPoint((p1x + p2x)/2, (p1y + p2y)/2); 
            }
        } else if (geometryMode === 'SRI_YANTRA') {
            addPoint(cx, cy);
            const angles = [-Math.PI/2, Math.PI/2, -Math.PI/2]; 
            const scales = [1.0, 1.618, 2.618]; 
            for(let layer=0; layer<3; layer++) {
                for(let i=0; i<3; i++) {
                    const a = (i/3) * Math.PI * 2 + angles[layer] + staticRotation;
                    addPoint(cx + Math.cos(a)*R*scales[layer], cy + Math.sin(a)*R*scales[layer]);
                }
            }
        } else if (geometryMode === 'CONJUGATE_VORTEX') {
            addPoint(cx, cy);
            const phi = 1.61803398875;
            for (let i = 0; i < 8; i++) {
                const a = i * Math.PI * (3 - Math.sqrt(5)) + staticRotation; // Golden angle (~137.5°)
                const dist = (R * 0.25) * Math.pow(phi, i * 0.35);
                addPoint(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist);
            }
        } else {
            const sym = Math.max(1, Math.floor(baseNumEmitters));
            if (sym === 1) {
                addPoint(cx, cy);
            } else {
                for(let i=0; i<sym; i++) {
                    const a = (i/sym) * Math.PI * 2 + staticRotation;
                    addPoint(cx + Math.cos(a)*R, cy + Math.sin(a)*R);
                }
            }
        }

        const waveData  = memory.waveDataArray; 
        const colorData = memory.colorDataArray; 
        
        for (let w = 0; w < waveCount; w++) {
            const slot = wavePool[w];
            
            waveData[w * 3]     = slot.wavelength;
            waveData[w * 3 + 1] = slot.amp;
            waveData[w * 3 + 2] = slot.phase;
            
            colorData[w * 3]     = slot.r;
            colorData[w * 3 + 1] = slot.g;
            colorData[w * 3 + 2] = slot.b;
        }

        for (let w = waveCount; w < 16; w++) {
            waveData[w * 3]     = 100.0;
            waveData[w * 3 + 1] = 0.0;
            waveData[w * 3 + 2] = 0.0;
            colorData[w * 3]     = 0.0;
            colorData[w * 3 + 1] = 0.0;
            colorData[w * 3 + 2] = 0.0;
        }

        gl.viewport(0, 0, W, H);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(
            isMultiplicative ? gl.ONE : gl.SRC_ALPHA,
            isMultiplicative ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE
        );

        gl.useProgram(memory.prog);
        gl.bindVertexArray(memory.vao);

        const L = memory.locs;
        gl.uniform2f(L.resolution,       W, H);
        gl.uniform2f(L.center,           cx, cy);
        gl.uniform1f(L.zoom,             zoom); 
        gl.uniform1i(L.numEmitters,      activeEmitters);
        gl.uniform2fv(L.emitters,        emitterData);
        gl.uniform1i(L.numWaves,         waveCount);
        gl.uniform3fv(L.waves,           waveData);
        gl.uniform3fv(L.waveColors,      colorData);
        
        gl.uniform1f(L.thickness,        lineThickness * visualScale);
        gl.uniform1f(L.masterOpacity,    masterOpacity);
        gl.uniform1i(L.isMultiplicative, isMultiplicative);
        gl.uniform1f(L.agitation,        agitation);
        gl.uniform1f(L.idlePhase,        memory.idlePhase);
        gl.uniform1i(L.isConjugateVortex, geometryMode === 'CONJUGATE_VORTEX' ? 1 : 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);
    },
    cleanup: (context) => {
        const { gl, memory } = context;
        if (gl) {
            if (memory.prog) gl.deleteProgram(memory.prog as WebGLProgram);
            if (memory.vao) gl.deleteVertexArray(memory.vao as WebGLVertexArrayObject);
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};

export const Lens_Interference = Lens_3DInterference;