import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyColor, getFrequencyHSL } from './shared';

const MAX_BUFFER = 60000;
const PHI = 1.61803398875;

const RAW_PRESETS = {
    "01 Golden Implosion": { category: "Breath Sync", config: { masterOpacity: 1, guideOpacity: 0.2, reactivity: 0.5, force: 0, blendMode: 'ADDITIVE', streamFlow: 0, harmonicSpacing: 3, bloomStrength: 0, colorDynamics: 0.75, colorShiftSpeed: 2, vortexPinch: 500, coreSize: 1000, fractalDepth: 16, quantumSpin: 2, tunnelTwist: -2, neonFactor: 0.1, saturation: 1, cameraPitch: 0.1, cameraYaw: -3.15, cameraRoll: 0, cameraZoom: 2 }, modulations: { streamFlow: { enabled: true, min: 0, max: 1.5, amtBreath: 1, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.3, binauralHarmonic: 1, linkBreathBinaural: false }, bloomStrength: { enabled: true, min: 0, max: 0.15, amtBreath: 1, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.3, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "02 Spectral Loom": { category: "Audio Reactive", config: { masterOpacity: 1, reactivity: 0.8, force: 1.5, blendMode: 'ADDITIVE', streamFlow: 1.5, harmonicSpacing: 1.2, bloomStrength: 0.5, colorDynamics: 1.0, colorShiftSpeed: 0.5, vortexPinch: 150, coreSize: 400, fractalDepth: 12, quantumSpin: 0.5, tunnelTwist: 0.2, neonFactor: 2.5, saturation: 1.5, cameraPitch: 0.3, cameraYaw: 0, cameraRoll: 0, cameraZoom: 1.2 }, modulations: { vortexPinch: { enabled: true, min: 120, max: 240, amtAudio: 1.0, amtBreath: 0, mixMode: 'ADD', curve: 'EXPONENTIAL', inertia: 0.4, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "03 Quantum Singularity": { category: "Deep Trance", config: { masterOpacity: 0.9, reactivity: 0.3, force: 0, blendMode: 'NORMAL', streamFlow: -0.5, harmonicSpacing: 0.5, bloomStrength: 0, colorDynamics: 0.2, colorShiftSpeed: 0.1, vortexPinch: 30, coreSize: 800, fractalDepth: 16, quantumSpin: -0.1, tunnelTwist: 1.5, neonFactor: 1.0, saturation: 0.8, cameraPitch: 0, cameraYaw: 0, cameraRoll: 0, cameraZoom: 0.6 }, modulations: { tunnelTwist: { enabled: true, min: 1.2, max: 2.2, amtBinaural: 1.0, amtBreath: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.5, binauralHarmonic: 0.5, linkBreathBinaural: false }, cameraZoom: { enabled: true, min: 0.55, max: 0.75, amtBreath: 1.0, amtAudio: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.3, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "04 Harmonic Resonator": { category: "Biofeedback", config: { masterOpacity: 1, reactivity: 0.9, force: 2.0, blendMode: 'ADDITIVE', streamFlow: 0.2, harmonicSpacing: 2.0, bloomStrength: 0.8, colorDynamics: 0.5, colorShiftSpeed: -1.0, vortexPinch: 200, coreSize: 300, fractalDepth: 8, quantumSpin: 0.8, tunnelTwist: 0.0, neonFactor: 3.0, saturation: 1.2, cameraPitch: 0.5, cameraYaw: 0.2, cameraRoll: 0, cameraZoom: 1.5 }, modulations: { neonFactor: { enabled: true, min: 1.5, max: 3.5, amtBreath: 1.0, amtAudio: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.4, binauralHarmonic: 1, linkBreathBinaural: false }, quantumSpin: { enabled: true, min: 0.1, max: 0.6, amtCoh: 1.0, amtAudio: 0, mixMode: 'ADD', curve: 'LINEAR', inertia: 0.6, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "05 The Ethereal Knot": { category: "Sacred Geometry", config: { masterOpacity: 0.8, reactivity: 0.4, force: 0, blendMode: 'ADDITIVE', streamFlow: 1.0, harmonicSpacing: 0.8, bloomStrength: 0.3, colorDynamics: 0.9, colorShiftSpeed: 1.2, vortexPinch: 80, coreSize: 600, fractalDepth: 14, quantumSpin: 0.3, tunnelTwist: -0.5, neonFactor: 0.8, saturation: 1.0, cameraPitch: -0.4, cameraYaw: 0, cameraRoll: 0.1, cameraZoom: 1.0 }, modulations: { harmonicSpacing: { enabled: true, min: 0.6, max: 1.4, amtBreath: 1.0, amtAudio: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.35, binauralHarmonic: 1, linkBreathBinaural: false }, colorShiftSpeed: { enabled: true, min: 0.5, max: 1.8, amtBinaural: 1.0, amtAudio: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.5, binauralHarmonic: 0.5, linkBreathBinaural: false } } },
    "06 Hyperspace Drive": { category: "Deep Trance", config: { masterOpacity: 1, reactivity: 0.7, force: 0, blendMode: 'ADDITIVE', streamFlow: 4.0, harmonicSpacing: 1.5, bloomStrength: 1.0, colorDynamics: 0.1, colorShiftSpeed: 0.0, vortexPinch: 400, coreSize: 200, fractalDepth: 16, quantumSpin: 0.0, tunnelTwist: 0.8, neonFactor: 2.0, saturation: 2.0, cameraPitch: 0, cameraYaw: 0, cameraRoll: 0, cameraZoom: 1.8 }, modulations: { streamFlow: { enabled: true, min: 2.0, max: 4.5, amtAudio: 1.0, amtBreath: 0, mixMode: 'ADD', curve: 'EXPONENTIAL', inertia: 0.45, binauralHarmonic: 1, linkBreathBinaural: false }, bloomStrength: { enabled: true, min: 0.3, max: 1.2, amtAudio: 1.0, amtBreath: 0.3, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.35, binauralHarmonic: 1, linkBreathBinaural: false } } }
};

export const Lens_Torus: VisualizerPlugin = {
    id: 'TORUS',
    name: 'Torus',
    renderType: 'CANVAS_2D',
    isLegacy: true, 
    
    parameters: [
        { id: 'cameraZoom', label: 'Camera Zoom', icon: 'Maximize', type: 'SLIDER', min: 0.1, max: 2.0, step: 0.01, color: '#f87171', section: 'GEOMETRY', defaultValue: 0.45 },
        { id: 'cameraPitch', label: 'Camera Pitch', icon: 'MoveVertical', type: 'SLIDER', min: -1.57, max: 1.57, step: 0.05, color: '#ec4899', section: 'GEOMETRY', defaultValue: 0.4 },
        { id: 'cameraYaw', label: 'Camera Yaw', icon: 'MoveHorizontal', type: 'SLIDER', min: -3.14, max: 3.14, step: 0.05, color: '#f43f5e', section: 'GEOMETRY', defaultValue: 0.0 },
        { id: 'fractalDepth', label: 'Nested Layers', icon: 'Layers', type: 'SLIDER', min: 1, max: 16, step: 1, color: '#818cf8', section: 'GEOMETRY', defaultValue: 8 },
        { id: 'coreSize', label: 'Major Radius (R)', icon: 'Circle', type: 'SLIDER', min: 10, max: 1000, step: 1, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 300 },
        { id: 'vortexPinch', label: 'Minor Radius (r)', icon: 'Target', type: 'SLIDER', min: 1, max: 500, step: 1, color: '#34d399', section: 'GEOMETRY', defaultValue: 80 },
        { id: 'tunnelTwist', label: 'Vortex Twist', icon: 'RotateCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#a855f7', section: 'GEOMETRY', defaultValue: 0.15 },
        { id: 'harmonicSpacing', label: 'Layer Spacing', icon: 'Maximize', type: 'SLIDER', min: 0.1, max: 3.0, step: 0.05, color: '#34d399', section: 'GEOMETRY', defaultValue: 0.5 },
        { id: 'streamFlow', label: 'Implosion Speed', icon: 'Wind', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#2dd4bf', section: 'PHYSICS', defaultValue: 0.2 },
        { id: 'quantumSpin', label: 'Axial Spin', icon: 'RotateCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#a855f7', section: 'PHYSICS', defaultValue: 0.1 },
        { id: 'force', label: 'Audio Bump Force', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 3.0, step: 0.05, color: '#e879f9', section: 'PHYSICS', defaultValue: 1.5 },
        { id: 'neonFactor', label: 'Line Glow', icon: 'Sun', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.05, color: '#fde047', section: 'LIGHT', defaultValue: 1.5 },
        { id: 'bloomStrength', label: 'Color Pulse Amp', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#fde047', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'colorShiftSpeed', label: 'Hue Shift', icon: 'RefreshCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#fbbf24', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'colorDynamics', label: 'Layer Hue Offset', icon: 'Palette', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ec4899', section: 'LIGHT', defaultValue: 0.1 },
        { id: 'saturation', label: 'Saturation', icon: 'Droplet', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#ef4444', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'blendMode', label: 'Blend Mode', type: 'CUSTOM_TOGGLE', section: 'LIGHT', icon: 'Layers', options: ['ADDITIVE', 'NORMAL'], color: 'cyan', defaultValue: 'ADDITIVE' }
    ],

    defaultConfig: {
        fractalDepth: 8, coreSize: 300, vortexPinch: 80, streamFlow: 0.2, quantumSpin: 0.1, neonFactor: 1.5, colorDynamics: 0.1, blendMode: 'ADDITIVE', cameraPitch: 0.4,
        masterOpacity: 1.0, force: 1.5, tunnelTwist: 0.15, harmonicSpacing: 0.5, colorShiftSpeed: 0.0, saturation: 1.0, cameraZoom: 0.45, cameraYaw: 0, cameraRoll: 0, bloomStrength: 0.0, focalLength: 410
    },

    presets: Object.entries(RAW_PRESETS).map(([name, data]: [string, Record<string, unknown>], i) => ({
        id: `factory_torus_${i}`, name, config: { ...(data.config as Record<string, unknown>) }, modulations: data.modulations || {}
    })),

    update: () => {}, 

    render: (context: LensContext, localConfig?: Record<string, unknown>) => {
        const config = localConfig ? { ...context.config, ...localConfig } : context.config;
        const ctx_args = { ...context, config };

        const { ctx, w, h, cx, cy, amplitudes, heartHarmonics, time, memory, dt, coherence, globalBinauralBeat } = ctx_args;

        const safeDt = (typeof dt === 'number' && !isNaN(dt) && dt > 0 && dt < 0.1) ? dt : 0.016;
        const safeTime = (typeof time === 'number' && !isNaN(time)) ? time : 0;
        const safeCoh = (typeof coherence === 'number' && !isNaN(coherence)) ? coherence : 1.0;
        const safeBeat = (typeof globalBinauralBeat === 'number' && !isNaN(globalBinauralBeat) && globalBinauralBeat > 0) ? globalBinauralBeat : 8.0;
        const safeCx = (typeof cx === 'number' && !isNaN(cx)) ? cx : w / 2;
        const safeCy = (typeof cy === 'number' && !isNaN(cy)) ? cy : h / 2;

        // VULNERABILITY FIX 1: Strict Geometry & Rendering Clamps
        const zoom = Math.max(0.1, Number(config.cameraZoom) || 1.0);
        const focalLength = Math.max(10, Number(config.focalLength) || 400);
        const baseMajorR = Math.max(1, Number(config.coreSize) || 200);
        const pinch = Math.max(1, Number(config.vortexPinch) || 60);
        const neonFactor = config.neonFactor !== undefined && !isNaN(Number(config.neonFactor)) ? Math.max(0.1, Number(config.neonFactor)) : 1.5;
        const masterOpacity = Math.max(0, Math.min(1.0, Number(config.masterOpacity) || 1.0));
        const colorDynamics = Number(config.colorDynamics) || 0.1;
        const saturationConfig = Math.max(0, Number(config.saturation) || 1.0);
        const streamFlow = Number(config.streamFlow) || 0.5;
        const quantumSpin = Number(config.quantumSpin) || 0.2;
        const colorShiftSpeed = Number(config.colorShiftSpeed) || 0.0;
        const fractalDepth = Math.max(1, Math.floor(Number(config.fractalDepth) || 8));
        
        const pitch = Number(config.cameraPitch) || 0;
        const yaw = Number(config.cameraYaw) || 0;
        const roll = Number(config.cameraRoll) || 0;

        const bloomAmp = Math.max(0, Number(config.bloomStrength) || 0.0);
        const twistMult = Number(config.tunnelTwist) || 0.0;
        const layerSpacing = Math.max(0.1, Number(config.harmonicSpacing) || 1.0);

        if (!memory.ptX || !memory.ptZ || memory.ptX.length < MAX_BUFFER) {
            memory.ptX = new Float32Array(MAX_BUFFER);
            memory.ptY = new Float32Array(MAX_BUFFER);
            memory.ptZ = new Float32Array(MAX_BUFFER);
        }

        if (!memory.terrainWaves) memory.terrainWaves = new Map<string, Record<string, unknown>>();

        const currentWaves = memory.terrainWaves as Map<string, Record<string, unknown>>;
        const targetVolumes = new Map<string, { amp: number, freq: number }>();
        const forceMult = Math.max(0, Number(config.force) || 1.0);
        let hasActiveAudio = false;

        LATTICE_CHANNELS.forEach(ch => {
            let amp = amplitudes.get(ch.id) || 0;
            if (isNaN(amp)) amp = 0;
            if (amp > 0.005) { targetVolumes.set(ch.id, { amp: amp * forceMult, freq: ch.freq }); hasActiveAudio = true; }
        });

        if (heartHarmonics && heartHarmonics.vols) {
            heartHarmonics.vols.forEach((vol: number, i: number) => {
                let v = Number(vol); if (isNaN(v)) v = 0;
                if (v > 0.005) { targetVolumes.set(`BINAURAL_${i}`, { amp: v * forceMult, freq: 50 * (i+1) }); hasActiveAudio = true; }
            });
        }

        if (!hasActiveAudio) targetVolumes.set('IDLE', { amp: 0.05 * forceMult, freq: 4.0 });

        const lerpRate = 0.15;
        targetVolumes.forEach((data, id) => {
            let hue = 220;
            if (id !== 'IDLE' && !id.startsWith('BINAURAL')) {
                const ch = LATTICE_CHANNELS.find(c => c.id === id);
                const freq = ch ? ch.freq : data.freq;
                if (freq) {
                    hue = Math.round(getFrequencyHSL(freq).h * 360);
                }
            } else if (id.startsWith('BINAURAL')) hue = 340;
            
            if (!currentWaves.has(id)) {
                currentWaves.set(id, { vol: 0, freq: data.freq, hueBase: hue });
            } else {
                currentWaves.get(id).hueBase = hue;
            }
        });

        let dominantHue = 220;
        let maxVol = 0;
        const activeHues: number[] = []; 

        currentWaves.forEach((wave, id) => {
            const targetData = targetVolumes.get(id);
            const targetAmp = targetData ? targetData.amp : 0;
            wave.vol = (wave.vol as number) + (targetAmp - (wave.vol as number)) * lerpRate;
            if ((wave.vol as number) > 0.001) {
                if ((wave.vol as number) > maxVol) { maxVol = wave.vol as number; dominantHue = wave.hueBase as number; }
                activeHues.push(wave.hueBase as number);
            } else {
                currentWaves.delete(id);
            }
        });

        if (isNaN(maxVol)) maxVol = 0;
        if (isNaN(dominantHue)) dominantHue = 220;
        
        const uniqueHues = Array.from(new Set(activeHues));

        const measurePhase = (safeTime * (safeBeat / 4.0)) * Math.PI * 2;
        const harmonicSway = Math.sin(measurePhase) * 20; 
        
        // VULNERABILITY FIX 2: Pulse clamping
        const pulseDepth = Math.max(0, Math.min(1.0, bloomAmp * 0.5)); 
        const colorFadePulse = Math.max(0, Math.min(1.0, (1.0 - pulseDepth) + pulseDepth * Math.cos(measurePhase * 0.5)));

        memory.hueAcc = (typeof memory.hueAcc === 'number' && !isNaN(memory.hueAcc)) ? memory.hueAcc : 0;
        memory.flowAcc = (typeof memory.flowAcc === 'number' && !isNaN(memory.flowAcc)) ? memory.flowAcc : 0;
        memory.spinAcc = (typeof memory.spinAcc === 'number' && !isNaN(memory.spinAcc)) ? memory.spinAcc : 0;

        memory.hueAcc += safeDt * 20 * colorShiftSpeed;
        memory.flowAcc += safeDt * streamFlow;
        memory.spinAcc += safeDt * quantumSpin;

        const globalHueShift = memory.hueAcc + harmonicSway;
        dominantHue = (Math.floor(dominantHue + globalHueShift) % 360 + 360) % 360;

        const implosionOffset = ((memory.flowAcc % 1.0) + 1.0) % 1.0; 

        const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
        const cosY = Math.cos(yaw),   sinY = Math.sin(yaw);
        const cosZ = Math.cos(roll),  sinZ = Math.sin(roll);

        const layers = Math.min(16, Math.max(1, fractalDepth));
        const u_segs = 48; 
        const v_segs = 14; 
        const spiral_segs = 480; 
        
        const torusVerts = (v_segs + 1) * (u_segs + 1);
        const layerVerts = torusVerts + spiral_segs + 1; 

        const dynamicMinorR = Math.max(0.1, pinch * (1.0 + maxVol * 0.5));

        for (let i = 0; i < layers; i++) {
            const continuousI = i + implosionOffset;

            const scale = Math.pow(PHI, -(continuousI * layerSpacing));
            const layerSpin = memory.spinAcc + (twistMult * continuousI * PHI * 0.2);

            const cosSpin = Math.cos(layerSpin);
            const sinSpin = Math.sin(layerSpin);

            const R = baseMajorR * scale;
            const r = dynamicMinorR * scale;
            const layerStartIdx = i * layerVerts;

            // 1. GENERATE TORUS WIREFRAME
            for (let v = 0; v <= v_segs; v++) {
                const angleV = (v / v_segs) * Math.PI * 2;
                const cosV = Math.cos(angleV), sinV = Math.sin(angleV);

                for (let u = 0; u <= u_segs; u++) {
                    const angleU = (u / u_segs) * Math.PI * 2;
                    const cosU = Math.cos(angleU), sinU = Math.sin(angleU);

                    let lx = (R + r * cosV) * cosU;
                    let ly = (R + r * cosV) * sinU;
                    let lz = r * sinV;

                    let tx = lx * cosSpin - ly * sinSpin; let ty = lx * sinSpin + ly * cosSpin; lx = tx; ly = ty;
                    ty = ly * cosX - lz * sinX; let tz = ly * sinX + lz * cosX; ly = ty; lz = tz;
                    tx = lx * cosY + lz * sinY; tz = -lx * sinY + lz * cosY; lx = tx; lz = tz;
                    tx = lx * cosZ - ly * sinZ; ty = lx * sinZ + ly * cosZ; lx = tx; ly = ty;

                    lz += 600; 
                    const dist = Math.max(0.1, lz);
                    const projScale = (focalLength / dist) * zoom;

                    const idx = layerStartIdx + v * (u_segs + 1) + u;
                    if (idx < MAX_BUFFER) {
                        memory.ptX[idx] = safeCx + lx * projScale;
                        memory.ptY[idx] = safeCy + ly * projScale;
                        memory.ptZ[idx] = lz; 
                    }
                }
            }

            // 2. GENERATE FIBONACCI TORUS KNOT
            const spiralStartIdx = layerStartIdx + torusVerts;
            const windsV = 8;
            const windsU = 13; 
            
            for (let s = 0; s <= spiral_segs; s++) {
                const t = s / spiral_segs;
                const angleV = t * Math.PI * 2 * windsV + (safeTime * 0.4);
                const angleU = t * Math.PI * 2 * windsU + (safeTime * 0.4 * PHI);

                const cosV = Math.cos(angleV), sinV = Math.sin(angleV);
                const cosU = Math.cos(angleU), sinU = Math.sin(angleU);

                const spiral_r = r * 1.05; 

                let lx = (R + spiral_r * cosV) * cosU;
                let ly = (R + spiral_r * cosV) * sinU;
                let lz = spiral_r * sinV;

                let tx = lx * cosSpin - ly * sinSpin; let ty = lx * sinSpin + ly * cosSpin; lx = tx; ly = ty;
                ty = ly * cosX - lz * sinX; let tz = ly * sinX + lz * cosX; ly = ty; lz = tz;
                tx = lx * cosY + lz * sinY; tz = -lx * sinY + lz * cosY; lx = tx; lz = tz;
                tx = lx * cosZ - ly * sinZ; ty = lx * sinZ + ly * cosZ; lx = tx; ly = ty;

                lz += 600; 
                const dist = Math.max(0.1, lz);
                const projScale = (focalLength / dist) * zoom;

                const idx = spiralStartIdx + s;
                if (idx < MAX_BUFFER) {
                    memory.ptX[idx] = safeCx + lx * projScale;
                    memory.ptY[idx] = safeCy + ly * projScale;
                    memory.ptZ[idx] = lz; 
                }
            }
        }

        ctx.save();
        ctx.globalCompositeOperation = config.blendMode === 'ADDITIVE' ? 'lighter' : 'source-over';

        // High-Performance Batched 2D Bloom / Ethereal Glow:
        // Batches longitudinal and latitudinal lines into unified paths per layer,
        // reducing canvas stroke and rasterization draw calls by >90% for sustained 60 FPS.
        const glowFactor = Math.max(0.1, neonFactor);
        const u_stride = u_segs + 1;
        
        const baseSat = Math.max(0, Math.min(100, Math.floor(80 * colorFadePulse * saturationConfig)));
        const baseLight = Math.max(0, Math.min(100, Math.floor(60 * colorFadePulse)));

        for (let i = layers - 1; i >= 0; i--) {
            const continuousI = i + implosionOffset;
            const layerHue = (Math.floor(dominantHue + (continuousI * colorDynamics * 60)) % 360 + 360) % 360;
            
            let fadeAlpha = 1.0;
            if (i === 0) fadeAlpha = implosionOffset;
            if (i === layers - 1) fadeAlpha = 1.0 - implosionOffset; 
            
            const depthScale = Math.max(0, 1.0 - (continuousI / layers));
            const layerAlpha = Math.max(0, Math.min(1.0, masterOpacity * fadeAlpha * depthScale)); 
            
            if (layerAlpha < 0.01) continue;

            const coreLineWidth = Math.max(0.6, Math.min(2.0, depthScale * 1.3));
            const layerStartIdx = i * layerVerts;

            // --- A. Batch Torus Wireframe (Longitudinal + Latitudinal in Unified Path) ---
            const wirePath = new Path2D();

            // Longitudinal loops
            for (let v = 0; v <= v_segs; v++) {
                let isDrawing = false;
                for (let u = 0; u <= u_segs; u++) {
                    const idx = layerStartIdx + v * u_stride + u;
                    if (memory.ptZ[idx] < 10) {
                        isDrawing = false;
                    } else {
                        if (!isDrawing) { wirePath.moveTo(memory.ptX[idx], memory.ptY[idx]); isDrawing = true; } 
                        else { wirePath.lineTo(memory.ptX[idx], memory.ptY[idx]); }
                    }
                }
            }

            // Latitudinal rings
            for (let u = 0; u < u_segs; u += 3) { 
                let isDrawing = false;
                for (let v = 0; v <= v_segs; v++) {
                    const idx = layerStartIdx + v * u_stride + u;
                    if (memory.ptZ[idx] < 10) {
                        isDrawing = false;
                    } else {
                        if (!isDrawing) { wirePath.moveTo(memory.ptX[idx], memory.ptY[idx]); isDrawing = true; } 
                        else { wirePath.lineTo(memory.ptX[idx], memory.ptY[idx]); }
                    }
                }
            }

            // Stroke Wireframe (Batched: 2 calls per layer instead of 50+)
            const glowWidth = coreLineWidth * (1.5 + Math.min(2.5, glowFactor) * 1.5);
            const haloAlpha = Math.min(0.25, layerAlpha * 0.09 * Math.min(2.0, glowFactor));

            if (glowFactor > 0.25 && haloAlpha > 0.005) {
                ctx.lineWidth = glowWidth;
                ctx.strokeStyle = `hsla(${layerHue}, 100%, 65%, ${haloAlpha.toFixed(3)})`;
                ctx.stroke(wirePath);
            }

            ctx.lineWidth = coreLineWidth;
            ctx.strokeStyle = `hsla(${layerHue}, ${baseSat}%, ${baseLight}%, ${(layerAlpha * 0.5).toFixed(3)})`;
            ctx.stroke(wirePath);

            // --- B. Draw Fibonacci Knot with Luminous Laser Glow ---
            const spiralStartIdx = layerStartIdx + torusVerts; 
            const spiralLightness = Math.max(0, Math.min(100, Math.floor(75 * colorFadePulse + 15)));
            const spiralHue = (layerHue + 40) % 360;
            
            const spiralPath = new Path2D();
            let isDrawingSpiral = false;
            for (let s = 0; s <= spiral_segs; s++) {
                const idx = spiralStartIdx + s;
                if (memory.ptZ[idx] < 10) {
                    isDrawingSpiral = false;
                } else {
                    if (!isDrawingSpiral) {
                        spiralPath.moveTo(memory.ptX[idx], memory.ptY[idx]);
                        isDrawingSpiral = true;
                    } else {
                        spiralPath.lineTo(memory.ptX[idx], memory.ptY[idx]);
                    }
                }
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Pass 1: Wide Radiant Aurora Bloom
            if (glowFactor > 0.2) {
                const spiralBloomWidth = coreLineWidth * (2.2 + Math.min(3.0, glowFactor) * 2.0);
                const spiralBloomAlpha = Math.min(0.35, layerAlpha * 0.16 * Math.min(2.0, glowFactor));
                ctx.lineWidth = spiralBloomWidth;
                ctx.strokeStyle = `hsla(${spiralHue}, 100%, 65%, ${spiralBloomAlpha.toFixed(3)})`;
                ctx.stroke(spiralPath);
            }

            // Pass 2: Core Luminous Laser Thread
            ctx.lineWidth = coreLineWidth * 1.5; 
            ctx.strokeStyle = `hsla(${spiralHue}, 100%, ${spiralLightness}%, ${(layerAlpha * 0.9).toFixed(3)})`; 
            ctx.stroke(spiralPath);
        }

        ctx.restore();
    },
    cleanup: (context) => {
        const { memory } = context;
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};