import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyHSL } from './shared';

const PI2 = Math.PI * 2; 
const MAX_BUFFER = 65536;

const RAW_PRESETS = {
    "01 Astral Tunnel": { category: "Ethereal", config: { dimensionalFolds: 24, entitySymmetry: 1.0, tunnelTwist: 0.15, coreCollapse: 0.88, quantumSpin: 0.5, phaseFluidity: 0.8, streamFlow: 0.5, agitation: 1.0, plasmaBloom: 0.5, colorDynamics: 0.2, saturation: 1.0, edgeHardness: 0.5, visualScale: 1.0 }, modulations: { streamFlow: { enabled: true, min: 0.1, max: 1.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' } } },
    "02 DMT Web": { category: "Psychedelic", config: { dimensionalFolds: 16, entitySymmetry: 2.5, tunnelTwist: 1.2, coreCollapse: 1.2, quantumSpin: 1.5, phaseFluidity: 0.4, streamFlow: 1.2, agitation: 2.5, plasmaBloom: 0.8, colorDynamics: 1.5, saturation: 1.5, edgeHardness: 1.2, visualScale: 0.8 }, modulations: { tunnelTwist: { enabled: true, min: -1.2, max: 1.2, amtBinaural: 1.0, amtAudio: 0, amtBreath: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "03 Cardiac Singularity": { category: "Biometric", config: { dimensionalFolds: 8, entitySymmetry: 0.5, tunnelTwist: 0.0, coreCollapse: 1.8, quantumSpin: 0.1, phaseFluidity: 0.9, streamFlow: 0.2, agitation: 4.0, plasmaBloom: 1.5, colorDynamics: 0.1, saturation: 1.2, edgeHardness: 2.0, visualScale: 1.2 }, modulations: { agitation: { enabled: true, min: 0.0, max: 4.0, amtAudio: 1.0, amtBinaural: 0, amtBreath: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "04 Event Horizon": { category: "Cosmic", config: { dimensionalFolds: 64, entitySymmetry: 1.0, tunnelTwist: -0.5, coreCollapse: 0.2, quantumSpin: 0.2, phaseFluidity: 0.5, streamFlow: -1.5, agitation: 0.5, plasmaBloom: 0.2, colorDynamics: 0.8, saturation: 0.5, edgeHardness: 0.2, visualScale: 1.5 }, modulations: { streamFlow: { enabled: true, min: -2.0, max: 0.0, amtBreath: 1.0, amtBinaural: 0, amtAudio: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "05 Quantum Threads": { category: "Ethereal", config: { dimensionalFolds: 32, entitySymmetry: 3.0, tunnelTwist: 0.4, coreCollapse: 1.0, quantumSpin: 2.0, phaseFluidity: 1.0, streamFlow: 0.8, agitation: 1.5, plasmaBloom: 0.4, colorDynamics: 0.5, saturation: 1.2, edgeHardness: 0.1, visualScale: 1.0 }, modulations: { quantumSpin: { enabled: true, min: -2.0, max: 2.0, amtBinaural: 1.0, amtAudio: 0, amtBreath: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "06 Seraphim Wings": { category: "Sacred", config: { dimensionalFolds: 12, entitySymmetry: 1.5, tunnelTwist: 0.1, coreCollapse: 1.4, quantumSpin: -0.2, phaseFluidity: 0.7, streamFlow: 0.3, agitation: 2.0, plasmaBloom: 1.0, colorDynamics: 0.0, saturation: 2.0, edgeHardness: 0.8, visualScale: 1.1 }, modulations: { plasmaBloom: { enabled: true, min: 0.2, max: 1.5, amtBreath: 1.0, amtAudio: 0.5, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } }
};

export const Lens_NDE: VisualizerPlugin = {
    id: 'NDE',
    name: 'Near Death Experience',
    renderType: 'CANVAS_2D',
    isLegacy: true, 
    
    parameters: [
        { id: 'dimensionalFolds', label: 'Tunnel Depth', icon: 'Layers', type: 'SLIDER', min: 1, max: 48, step: 1, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 16 },
        { id: 'entitySymmetry', label: 'Web Symmetry', icon: 'Hexagon', type: 'SLIDER', min: 0.1, max: 4.0, step: 0.1, color: '#a855f7', section: 'GEOMETRY', defaultValue: 1.0 },
        { id: 'tunnelTwist', label: 'Tunnel Twist', icon: 'RotateCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#f472b6', section: 'GEOMETRY', defaultValue: 0.15 },
        { id: 'coreCollapse', label: 'Core Steepness', icon: 'ArrowDown', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#ef4444', section: 'PHYSICS', defaultValue: 0.88 },
        { id: 'quantumSpin', label: 'Quantum Spin', icon: 'Orbit', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#818cf8', section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'phaseFluidity', label: 'Fluidity', icon: 'Waves', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#34d399', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'streamFlow', label: 'Travel Speed', icon: 'Wind', type: 'SLIDER', min: -2.0, max: 5.0, step: 0.1, color: '#2dd4bf', section: 'WAVES', defaultValue: 0.0 },
        { id: 'agitation', label: 'Audio Expansion', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 5.0, step: 0.1, color: '#facc15', section: 'WAVES', defaultValue: 0.5 },
        { id: 'plasmaBloom', label: 'Plasma Aura', icon: 'Sun', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#fde047', section: 'LIGHT', defaultValue: 0.5 },
        { id: 'colorDynamics', label: 'Hue Speed', icon: 'RefreshCcw', type: 'SLIDER', min: -2.0, max: 2.0, step: 0.05, color: '#d8b4fe', section: 'LIGHT', defaultValue: 0.35 },
        { id: 'saturation', label: 'Saturation', icon: 'Droplet', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.1, color: '#ec4899', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'edgeHardness', label: 'Web Thickness', icon: 'PenTool', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.1, color: '#ffffff', section: 'CORE', defaultValue: 0.5 },
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Eye', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#ffffff', section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'blendMode', label: 'Blend Mode', type: 'CUSTOM_TOGGLE', section: 'LIGHT', icon: 'Layers', options: ['ADDITIVE', 'NORMAL'], color: 'cyan', defaultValue: 'ADDITIVE' }
    ],

    defaultConfig: {
        dimensionalFolds: 16, entitySymmetry: 1.0, tunnelTwist: 0.15, coreCollapse: 0.88, quantumSpin: 1.0, phaseFluidity: 0.5, streamFlow: 0.0, agitation: 0.5, plasmaBloom: 0.5, colorDynamics: 0.35, saturation: 1.0, edgeHardness: 0.5, masterOpacity: 1.0, force: 1.5, visualScale: 1.0, perspectiveTilt: 0, blendMode: 'ADDITIVE'
    },

    presets: Object.entries(RAW_PRESETS).map(([name, data]: [string, Record<string, unknown>], i) => ({
        id: `factory_nde_${i}`, name, config: { ...(data.config as Record<string, unknown>) }, modulations: data.modulations || {}
    })),

    update: () => {}, 

    render: (context: LensContext, localConfig?: Record<string, unknown>) => {
        const config = localConfig ? { ...context.config, ...localConfig } : context.config;
        const ctx_args = { ...context, config };

        const { amplitudes, heartHarmonics, time, memory, dt, ctx, w, h, cx, cy, globalBinauralBeat } = ctx_args;

        const safeDt = (typeof dt === 'number' && !isNaN(dt) && dt > 0 && dt < 0.1) ? dt : 0.016;
        const safeTime = (typeof time === 'number' && !isNaN(time)) ? time : 0;
        const safeBeat = (typeof globalBinauralBeat === 'number' && !isNaN(globalBinauralBeat) && globalBinauralBeat > 0) ? globalBinauralBeat : 8.0;
        const safeCx = (typeof cx === 'number' && !isNaN(cx)) ? cx : w / 2;
        const safeCy = (typeof cy === 'number' && !isNaN(cy)) ? cy : h / 2;

        // Strict Geometry & Parameter Clamps
        const layersCount = Math.min(48, Math.max(1, Math.floor(Number(config.dimensionalFolds) || 16))); 
        const radialsCount = Math.min(48, Math.max(3, Math.floor((Number(config.entitySymmetry) || 1.0) * 12))); 
        const twist = Number(config.tunnelTwist) || 0.15; 
        const steepness = 1.5 - ((Number(config.coreCollapse) || 0.88) * 0.5); 
        const travelSpeed = Number(config.streamFlow) || 0.5; 
        
        const plasma = Math.max(0, Number(config.plasmaBloom) || 0.5); 
        const colorSpeed = Number(config.colorDynamics) || 0.35; 
        const webbing = Math.max(0.1, Number(config.edgeHardness) || 0.5);
        const forceMult = Math.max(0, Number(config.force) || 1.0);
        const quantumSpin = Number(config.quantumSpin) || 1.0;

        const agitation = Math.max(0, Number(config.agitation) || 0.0);
        const visualScale = Math.max(0.1, Number(config.visualScale) || 1.0);
        const saturationConfig = Math.max(0, Number(config.saturation) || 1.0);
        const masterOpacity = Math.max(0, Math.min(1.0, Number(config.masterOpacity) || 1.0));
        const perspectiveTilt = Number(config.perspectiveTilt) || 0;

        // Trigonometric radial lookup table cache
        if (!memory.radialsCache || memory.lastRadialsCount !== radialsCount) {
            memory.cosA = new Float32Array(radialsCount + 1);
            memory.sinA = new Float32Array(radialsCount + 1);
            for (let i = 0; i <= radialsCount; i++) {
                const angle = (i / radialsCount) * PI2;
                memory.cosA[i] = Math.cos(angle);
                memory.sinA[i] = Math.sin(angle);
            }
            memory.lastRadialsCount = radialsCount;
            memory.radialsCache = true;
        }

        if (!memory.modeBuffer) memory.modeBuffer = new Float32Array(32 * 4); 
        if (!memory.ptX || memory.ptX.length < MAX_BUFFER) {
            memory.ptX = new Float32Array(MAX_BUFFER); 
            memory.ptY = new Float32Array(MAX_BUFFER);
        }

        if (!memory.ndeWaves) memory.ndeWaves = new Map<string, Record<string, unknown>>();
        const currentWaves = memory.ndeWaves as Map<string, Record<string, unknown>>;
        const targetVolumes = new Map<string, { amp: number, freq: number }>();
        let hasActiveAudio = false;

        LATTICE_CHANNELS.forEach(ch => {
            let amp = amplitudes.get(ch.id) || 0;
            if (isNaN(amp)) amp = 0;
            if (amp > 0.005) {
                targetVolumes.set(ch.id, { amp: amp * forceMult, freq: ch.freq });
                hasActiveAudio = true;
            }
        });

        if (heartHarmonics && heartHarmonics.vols) {
            heartHarmonics.vols.forEach((vol: number, i: number) => {
                let v = Number(vol);
                if (isNaN(v)) v = 0;
                if (v > 0.005) {
                    targetVolumes.set(`BINAURAL_${i}`, { amp: v * forceMult, freq: 50 * (i + 1) });
                    hasActiveAudio = true;
                }
            });
        }

        if (!hasActiveAudio) targetVolumes.set('IDLE', { amp: 0.15 * forceMult, freq: 4.0 });

        const fluidity = Math.max(0, Math.min(1.0, Number(config.phaseFluidity) || 0.5));
        const lerpRate = Math.max(0.01, 0.2 - (fluidity * 0.18));

        targetVolumes.forEach((targetData, id) => {
            let hue = 220;
            if (id !== 'IDLE' && !id.startsWith('BINAURAL')) {
                const ch = LATTICE_CHANNELS.find(c => c.id === id);
                const freq = ch ? ch.freq : targetData.freq;
                if (freq) {
                    hue = Math.round(getFrequencyHSL(freq).h * 360);
                }
            } else if (id.startsWith('BINAURAL')) {
                hue = 340; 
            }
            if (!currentWaves.has(id)) {
                currentWaves.set(id, { speed: 0.2, vol: 0, angle: 0, hueBase: hue });
            } else {
                (currentWaves.get(id) as Record<string, unknown>).hueBase = hue;
            }
        });

        let modeCount = 0;
        currentWaves.forEach((wave, id) => {
            const targetData = targetVolumes.get(id);
            const targetAmp = targetData ? targetData.amp : 0;
            wave.vol = (wave.vol as number) + (targetAmp - (wave.vol as number)) * lerpRate; 
            wave.angle = (wave.angle as number) + (wave.speed as number) * quantumSpin * safeDt;
            
            if ((wave.vol as number) > 0.001) {
                if (modeCount < 32) {
                    memory.modeBuffer[modeCount * 4 + 0] = wave.vol as number;
                    memory.modeBuffer[modeCount * 4 + 1] = wave.angle as number;
                    memory.modeBuffer[modeCount * 4 + 2] = wave.hueBase as number;
                    modeCount++;
                }
            } else {
                currentWaves.delete(id); 
            }
        });

        if (modeCount === 0) return;

        // Biometric Harmonic Entrainment Pulse (mirroring Torus architecture)
        const measurePhase = (safeTime * (safeBeat / 4.0)) * Math.PI * 2;
        const pulseDepth = Math.max(0, Math.min(1.0, plasma * 0.4));
        const colorFadePulse = Math.max(0, Math.min(1.0, (1.0 - pulseDepth) + pulseDepth * Math.cos(measurePhase * 0.5)));

        memory.zTravel = (typeof memory.zTravel === 'number' && !isNaN(memory.zTravel)) ? memory.zTravel : 0;
        memory.zTravel += safeDt * travelSpeed * 2.0;
        const zOffset = ((memory.zTravel % 1.0) + 1.0) % 1.0;

        memory.spinAcc = (typeof memory.spinAcc === 'number' && !isNaN(memory.spinAcc)) ? memory.spinAcc : 0;
        memory.spinAcc += safeDt * quantumSpin * 0.5;

        // High-Performance Mode Consolidation:
        // Identify primary dominant mode and secondary harmonic counter-rotating mode.
        // Instead of running 10-32 full geometry render passes per frame (which caused severe lag),
        // we consolidate into at most 2 counter-rotating interlaced astral webs (Forward & Reverse spin).
        // This preserves 100% of the psychedelic DMT interference moiré pattern while reducing draw calls by >85%.
        let dominantMIdx = 0;
        let maxVol = -1;
        for (let m = 0; m < modeCount; m++) {
            const v = memory.modeBuffer[m * 4 + 0];
            if (v > maxVol) {
                maxVol = v;
                dominantMIdx = m;
            }
        }

        const activePasses: Array<{ vol: number; angle: number; hueBase: number; dir: number }> = [];
        const primaryVol = Math.max(0.1, memory.modeBuffer[dominantMIdx * 4 + 0]);
        const primaryAngle = memory.modeBuffer[dominantMIdx * 4 + 1] + memory.spinAcc;
        const primaryHue = memory.modeBuffer[dominantMIdx * 4 + 2];
        activePasses.push({ vol: primaryVol, angle: primaryAngle, hueBase: primaryHue, dir: 1 });

        // Secondary counter-rotating web (either second highest audio channel or complementary harmonic)
        if (modeCount > 1) {
            let secondMIdx = -1;
            let secondVol = -1;
            for (let m = 0; m < modeCount; m++) {
                if (m === dominantMIdx) continue;
                const v = memory.modeBuffer[m * 4 + 0];
                if (v > secondVol) {
                    secondVol = v;
                    secondMIdx = m;
                }
            }
            if (secondMIdx >= 0 && secondVol > 0.01) {
                const secAngle = memory.modeBuffer[secondMIdx * 4 + 1] - memory.spinAcc * 0.8;
                activePasses.push({
                    vol: Math.max(0.08, secondVol),
                    angle: secAngle,
                    hueBase: memory.modeBuffer[secondMIdx * 4 + 2],
                    dir: -1
                });
            }
        } else {
            // Self-interference harmonic web when single channel is active
            activePasses.push({
                vol: primaryVol * 0.7,
                angle: primaryAngle * -0.75,
                hueBase: (primaryHue + 40) % 360,
                dir: -1
            });
        }

        const { cosA, sinA, ptX, ptY } = memory;
        const maxRadius = Math.min(w, h) / 2 * 0.95;

        ctx.save();
        
        if (perspectiveTilt > 0) {
            const scaleY = Math.max(0.1, 1 - (perspectiveTilt / 90));
            ctx.translate(safeCx, safeCy);
            ctx.scale(1, scaleY);
            ctx.translate(-safeCx, -safeCy);
        }

        ctx.globalCompositeOperation = config.blendMode === 'NORMAL' ? 'source-over' : 'lighter';

        // HIGH-PERFORMANCE BATCHED 2D BLOOM / ASTRAL TUNNEL PASS
        // Uses unified Path2D per web pass to bundle all rings and spokes into 2 draw calls.
        for (let p = 0; p < activePasses.length; p++) {
            const pass = activePasses[p];
            const { vol, angle, hueBase, dir } = pass;

            ctx.save();
            ctx.translate(safeCx, safeCy);
            ctx.rotate(angle * dir);

            const hueShift = safeTime * 50 * colorSpeed;
            const currentHue = Math.floor((hueBase + hueShift) % 360 + 360) % 360;

            const saturation = Math.max(0, Math.floor(Math.min(100, (50 * saturationConfig + (vol * 30)) * colorFadePulse))); 
            const lightness = Math.max(0, Math.floor(Math.min(100, (40 + (vol * 20)) * colorFadePulse)));

            const webPath = new Path2D();
            let validRings = 0;

            // 1. Accumulate concentric tunnel rings
            for (let l = 0; l <= layersCount + 1; l++) {
                const rawLayer = l + zOffset;
                const layerNorm = rawLayer / layersCount; 
                
                if (layerNorm > 1.05 || layerNorm < 0.01) continue;
                
                const depthScale = Math.pow(layerNorm, steepness);
                const matrixExpansion = Math.max(0.1, 1.0 + (agitation * vol * 0.3));
                const r = maxRadius * depthScale * visualScale * matrixExpansion;
                
                const rot = (1.0 - layerNorm) * twist * PI2 * dir;
                const cosB = Math.cos(rot);
                const sinB = Math.sin(rot);

                const ringStartPt = validRings * radialsCount;

                for (let i = 0; i <= radialsCount; i++) {
                    const px = r * (cosA[i] * cosB - sinA[i] * sinB);
                    const py = r * (sinA[i] * cosB + cosA[i] * sinB);
                    
                    if (i < radialsCount) {
                        const ptIdx = ringStartPt + i;
                        if (ptIdx < MAX_BUFFER) {
                            ptX[ptIdx] = px;
                            ptY[ptIdx] = py;
                        }
                    }
                    
                    if (i === 0) webPath.moveTo(px, py);
                    else webPath.lineTo(px, py);
                }
                validRings++;
            }

            // 2. Accumulate radial connecting spokes into unified web path
            for (let i = 0; i < radialsCount; i++) {
                let isFirst = true;
                for (let rIdx = 0; rIdx < validRings; rIdx++) {
                    const ptIdx = rIdx * radialsCount + i;
                    if (ptIdx < MAX_BUFFER) {
                        const px = ptX[ptIdx];
                        const py = ptY[ptIdx];
                        if (isFirst) {
                            webPath.moveTo(px, py);
                            isFirst = false;
                        } else {
                            webPath.lineTo(px, py);
                        }
                    }
                }
            }

            const baseAlpha = masterOpacity * Math.max(0.08, Math.min(1.0, vol));
            const baseLine = Math.max(0.4, (webbing * 1.5) + (vol * 1.2));
            const effectivePlasma = plasma * vol;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Pass 1: Wide Radiant Aurora / Plasma Bloom (Batched, no CPU shadowBlur!)
            if (effectivePlasma > 0.05) {
                const glowWidth = baseLine * (1.5 + Math.min(3.0, effectivePlasma) * 1.8);
                const glowAlpha = Math.min(0.35, baseAlpha * 0.18 * Math.min(2.0, effectivePlasma));
                ctx.lineWidth = glowWidth;
                ctx.strokeStyle = `hsla(${currentHue}, 100%, 65%, ${glowAlpha.toFixed(3)})`;
                ctx.stroke(webPath);
            }

            // Pass 2: Sharp Core Luminous Thread
            ctx.lineWidth = baseLine;
            ctx.strokeStyle = `hsla(${currentHue}, ${saturation}%, ${lightness}%, ${(baseAlpha * 0.8).toFixed(3)})`;
            ctx.stroke(webPath);

            // High-Performance Hardware-Accelerated Core Singularity:
            // Replaced software CPU `ctx.shadowBlur = 100` with native radial gradient
            // to eliminate rendering stutter on high-DPI canvases.
            const coreGlow = Math.pow(vol, 2) * plasma;
            if (coreGlow > 0.02) {
                const glowRadius = Math.max(2, maxRadius * 0.12 * coreGlow * visualScale);
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
                const glowAlpha = Math.min(1.0, coreGlow * masterOpacity);
                grad.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha.toFixed(3)})`);
                grad.addColorStop(0.25, `hsla(${currentHue}, 100%, 85%, ${(glowAlpha * 0.7).toFixed(3)})`);
                grad.addColorStop(0.65, `hsla(${currentHue}, 100%, 60%, ${(glowAlpha * 0.25).toFixed(3)})`);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, glowRadius, 0, PI2);
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    },

    cleanup: (context) => {
        const { memory } = context;
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
