import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, BASE_FREQ, getFrequencyHSL } from './shared';

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
const TWO_PI = Math.PI * 2;

// --- OPTIMIZATION: Hoist Helper Function ---
// Defines hue2rgb ONCE at module scope instead of 4000x per frame
const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
};

// Optimized HSL to RGB (returns numbers directly to avoid object allocation)
function hslToRgbVals(h: number, s: number, l: number, out: {r:number, g:number, b:number}) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; 
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    out.r = r * 255;
    out.g = g * 255;
    out.b = b * 255;
}

// EXACT PRESETS FROM YOUR ORIGINAL VisualizerRegistry.ts
const RAW_PRESETS = {
    "01 Sacred Sunflower": { category: "Hyper-Organic", config: { seedCount: 3000, spreadFactor: 3.8, minBrightness: 0.15, saturation: 1.2, colorGain: 2.5, contrast: 1.2, waveDensity: 8.0, waveSpeed: 0.0, rotationSpeed: 0.0, particleSize: 1.5, coreSize: 80, blendMode: 'ADDITIVE', growthExponent: 0.5, petalSymmetry: 0, angleModulation: 0, vortexPinch: 0, reactivity: 0.5 }, modulations: { visualScale: { enabled: true, min: 0.8, max: 1.3, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' }, agitation: { enabled: true, min: 0.0, max: 0.8, amtBreath: 0.0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' } } },
    "02 Crystal Lotus": { category: "Hyper-Organic", config: { seedCount: 1500, spreadFactor: 6.0, petalSymmetry: 8, contrast: 2.5, waveDensity: 14.0, particleSize: 2.5, blendMode: 'ADDITIVE', minBrightness: 0.0, colorGain: 3.0, waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { rotationSpeed: { enabled: true, min: -0.2, max: 0.2, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.9, max: 1.2, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "03 Alien Spore": { category: "Hyper-Organic", config: { seedCount: 2000, spreadFactor: 4.5, growthExponent: 0.6, petalSymmetry: 5, angleModulation: 1.2, waveDensity: 8.0, contrast: 1.8, particleSize: 2.0, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { colorGain: { enabled: true, min: 1.0, max: 4.0, amtBreath: 0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 1.0, mixMode: 'ADD' }, angleModulation: { enabled: true, min: 0.5, max: 2.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "04 Event Horizon": { category: "Cosmic & Tunnels", config: { seedCount: 4000, spreadFactor: 6.0, growthExponent: 0.8, vortexPinch: 0.3, waveDensity: 5.0, contrast: 3.0, particleSize: 2.5, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: -0.05 }, modulations: { vortexPinch: { enabled: true, min: 0.1, max: 0.7, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' }, colorShiftSpeed: { enabled: true, min: 0.0, max: 2.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "05 Hyperspace Tunnel": { category: "Cosmic & Tunnels", config: { seedCount: 3000, spreadFactor: 10.0, growthExponent: 0.9, vortexPinch: 0.4, petalSymmetry: 0, angleModulation: 1.0, waveDensity: 3.0, particleSize: 4.0, contrast: 2.5, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { waveSpeed: { enabled: true, min: 0.0, max: 8.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.7, max: 1.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "06 Supernova Flare": { category: "Cosmic & Tunnels", config: { seedCount: 2500, spreadFactor: 4.5, growthExponent: 0.6, angleModulation: 3.0, waveDensity: 6.0, contrast: 1.5, particleSize: 2.0, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { colorGain: { enabled: true, min: 2.0, max: 6.0, amtBreath: 0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 1.0, mixMode: 'ADD' }, agitation: { enabled: true, min: 0.0, max: 1.5, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' } } },
    "07 Machine Elf": { category: "Psychedelic / DMT", config: { seedCount: 4000, spreadFactor: 3.5, petalSymmetry: 5, angleModulation: 2.0, waveDensity: 12.0, contrast: 2.5, particleSize: 1.8, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { rotationSpeed: { enabled: true, min: -1.0, max: 1.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' }, colorGain: { enabled: true, min: 1.5, max: 3.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "08 Alex Grey Net": { category: "Psychedelic / DMT", config: { seedCount: 4500, spreadFactor: 3.2, petalSymmetry: 12, angleModulation: 0.5, contrast: 2.5, waveDensity: 18.0, particleSize: 1.0, minBrightness: 0.1, blendMode: 'NORMAL', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { spreadFactor: { enabled: true, min: 2.5, max: 4.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' }, agitation: { enabled: true, min: 0.0, max: 0.6, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' } } },
    "09 Rainbow Loom": { category: "Psychedelic / DMT", config: { seedCount: 4000, spreadFactor: 3.0, colorShiftSpeed: 0.0, waveDensity: 20.0, saturation: 2.5, minBrightness: 0.4, particleSize: 2.2, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { colorShiftSpeed: { enabled: true, min: 0.0, max: 5.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.8, max: 1.2, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "10 Cymatic Star": { category: "Sacred Geometry", config: { seedCount: 4000, spreadFactor: 3.0, petalSymmetry: 7, waveDensity: 12.0, contrast: 2.0, particleSize: 1.5, minBrightness: 0.0, blendMode: 'NORMAL', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { agitation: { enabled: true, min: 0.0, max: 2.0, amtBreath: 0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 1.0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.9, max: 1.1, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' } } },
    "11 Liquid Gold": { category: "Fluid & Ethereal", config: { seedCount: 5000, spreadFactor: 2.2, contrast: 0.05, minBrightness: 0.8, saturation: 1.5, colorGain: 1.5, waveDensity: 3.0, particleSize: 2.0, blendMode: 'NORMAL', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { spreadFactor: { enabled: true, min: 1.5, max: 3.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' }, colorGain: { enabled: true, min: 1.0, max: 2.5, amtBreath: 0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 1.0, mixMode: 'ADD' } } },
    "12 Silk & Smoke": { category: "Fluid & Ethereal", config: { seedCount: 6000, spreadFactor: 5.5, petalSymmetry: 3, contrast: 1.2, minBrightness: 0.6, saturation: 0.8, waveDensity: 4.0, particleSize: 1.2, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { waveDensity: { enabled: true, min: 2.0, max: 8.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'MULT' }, colorShiftSpeed: { enabled: true, min: 0.0, max: 1.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, amtAudio: 0, mixMode: 'ADD' } } }
};

export const Lens_Phyllotaxis: VisualizerPlugin & { draw: (ctx: LensContext) => void } = {
    id: 'BIO-BLOOM',
    name: 'Bio-Bloom',
    renderType: 'CANVAS_2D',
    isLegacy: true, 
    
    // EXACT COPY of CONTROLS_BIO_BLOOM from your original app.
    parameters: [
        { id: 'seedCount', label: 'Seed Count', icon: 'Grid', type: 'SLIDER', min: 100, max: 5000, step: 100, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 1100 },
        { id: 'spreadFactor', label: 'Spread (c)', icon: 'Maximize', type: 'SLIDER', min: 0.5, max: 20.0, step: 0.1, color: '#6366f1', section: 'GEOMETRY', defaultValue: 4.4 },
        { id: 'spiralAngle', label: 'Spiral Angle', icon: 'RotateCcw', type: 'SLIDER', min: -10, max: 10, step: 0.1, color: '#e879f9', section: 'GEOMETRY', defaultValue: 0 },
        { id: 'growthExponent', label: 'Growth Exp', icon: 'ArrowDown', type: 'SLIDER', min: 0.1, max: 1.5, step: 0.05, color: '#818cf8', section: 'PHYSICS', defaultValue: 0.5 },
        { id: 'petalSymmetry', label: 'Symmetry', icon: 'Hexagon', type: 'SLIDER', min: 0, max: 24, step: 1, color: '#a855f7', section: 'PHYSICS', defaultValue: 0 },
        { id: 'angleModulation', label: 'Angle Mod', icon: 'Waves', type: 'SLIDER', min: 0, max: 5.0, step: 0.1, color: '#ec4899', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'vortexPinch', label: 'Vortex Pinch', icon: 'Orbit', type: 'SLIDER', min: 0, max: 0.9, step: 0.05, color: '#ef4444', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'minBrightness', label: 'Min Brightness', icon: 'Sun', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#94a3b8', section: 'LIGHT', defaultValue: 0.5 },
        { id: 'colorShiftSpeed', label: 'Color Shift', icon: 'RefreshCcw', type: 'SLIDER', min: -5.0, max: 5.0, step: 0.1, color: '#fbbf24', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'colorDynamics', label: 'Dyn Chroma', icon: 'Paintbrush', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#818cf8', section: 'LIGHT', defaultValue: 0.35 },
        { id: 'colorMix', label: 'Static Mix', icon: 'Paintbrush', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#d8b4fe', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'colorGain', label: 'Exposure', icon: 'Zap', type: 'SLIDER', min: 0.1, max: 5.0, step: 0.1, color: '#fbbf24', section: 'LIGHT', defaultValue: 2.0 },
        { id: 'saturation', label: 'Saturation', icon: 'Droplet', type: 'SLIDER', min: 0, max: 3.0, step: 0.1, color: '#f472b6', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'contrast', label: 'Contrast', icon: 'Spline', type: 'SLIDER', min: 0, max: 4.0, step: 0.05, color: '#ffffff', section: 'LIGHT', defaultValue: 0.9 },
        { id: 'waveDensity', label: 'Wave Density', icon: 'Waves', type: 'SLIDER', min: 0, max: 30.0, step: 0.1, color: '#34d399', section: 'WAVES', defaultValue: 13.4 },
        { id: 'waveSpeed', label: 'Wave Speed', icon: 'Wind', type: 'SLIDER', min: 0, max: 10.0, step: 0.1, color: '#2dd4bf', section: 'WAVES', defaultValue: 1.7 },
        { id: 'rotationSpeed', label: 'Galaxy Spin', icon: 'RotateCcw', type: 'SLIDER', min: -1.0, max: 1.0, step: 0.01, color: '#a855f7', section: 'WAVES', defaultValue: 0.194 },
        { id: 'agitation', label: 'Agitation', icon: 'Sparkles', type: 'SLIDER', min: 0, max: 2.0, step: 0.05, color: '#f472b6', section: 'WAVES', defaultValue: 0.5 },
        { id: 'particleSize', label: 'Particle Size', icon: 'Sparkles', type: 'SLIDER', min: 0.05, max: 10.0, step: 0.05, color: '#fbbf24', section: 'CORE', defaultValue: 0.5 },
        { id: 'coreSize', label: 'Core Radius', icon: 'Sun', type: 'SLIDER', min: 0, max: 300, step: 1, color: '#ffffff', section: 'CORE', defaultValue: 32 },
        { id: 'coreOpacity', label: 'Core Brightness', icon: 'Lightbulb', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#ffffff', section: 'CORE', defaultValue: 1.0 }
    ],

    // STRICT MATCH to DEFAULT_LATTICE_CONFIG from physics.ts so the pure colors are properly restored.
    defaultConfig: {
        seedCount: 1100, spreadFactor: 4.4, spiralAngle: 0, growthExponent: 0.5, petalSymmetry: 0, angleModulation: 0.0, vortexPinch: 0.0, minBrightness: 0.5, colorShiftSpeed: 0.0, colorDynamics: 0.35, colorMix: 0.0, colorGain: 2.0, saturation: 1.0, contrast: 0.9, prismCorrection: 1.0, waveDensity: 13.4, waveSpeed: 1.7, rotationSpeed: 0.194, agitation: 0.5, particleSize: 0.5, coreSize: 32, coreOpacity: 1.0, blendMode: 'ADDITIVE', masterOpacity: 1.0, visualScale: 1.0, force: 1.5, reactivity: 0.5
    },

    presets: Object.entries(RAW_PRESETS).map(([name, data]: [string, Record<string, unknown>], i) => ({
        id: `factory_bio-bloom_${i}`, name, config: { ...(data.config as Record<string, unknown>) }, modulations: data.modulations || {}
    })),

    // Phase 2 safely wraps the exact Phase 1 math
    render: function(context: LensContext, localConfig: Record<string, unknown>) {
        const mergedConfig = { ...context.config, ...localConfig };
        this.draw({ ...context, config: mergedConfig });
    },

    // --- EXACT, LITERAL COPY-PASTE OF YOUR UPLOADED FILE'S DRAW FUNCTION ---
    draw: ({ ctx, w, h, cx, cy, amplitudes, config, dt, memory, globalBinauralBeat }: LensContext) => {
        ctx.save();
        
        const seedCount = config.seedCount ?? 2000;
        const spreadFactor = config.spreadFactor ?? 5.0;
        const waveDensity = config.waveDensity ?? 10.0;
        const waveSpeed = config.waveSpeed ?? 2.0;
        const rotationSpeed = config.rotationSpeed ?? 0.02;
        const baseParticleSize = config.particleSize ?? 1.8;
        const coreSize = config.coreSize ?? 50;
        const colorGain = config.colorGain ?? 2.0; 
        const spiralAngleOffset = (config.spiralAngle ?? 0) * (Math.PI / 180);
        const bloomStrength = config.bloomStrength ?? 0;
        const blendMode = config.blendMode ?? 'ADDITIVE';
        const saturation = config.saturation ?? 1.0;
        const coreOpacity = config.coreOpacity ?? 1.0;
        const contrast = config.contrast ?? 1.0; 
        const minBrightness = config.minBrightness ?? 0.2; 
        const agitation = config.agitation ?? 0.5;
        const colorDynamics = config.colorDynamics ?? 1.0;
        const staticColorMix = config.colorMix ?? 0.0; 
        const prismCorrection = config.prismCorrection ?? 0.0;
        const growthExponent = config.growthExponent ?? 0.5;
        const petalSymmetry = config.petalSymmetry ?? 0;
        const angleModulation = config.angleModulation ?? 0.0;
        const colorShiftSpeed = config.colorShiftSpeed ?? 0.0;
        const vortexPinch = config.vortexPinch ?? 0.0;
        const masterOpacity = config.masterOpacity ?? 1.0;
        const visualScale = config.visualScale ?? 1.0;
        const forceMult = config.force ?? 1.0;
        const reactivity = config.reactivity ?? 0.5; 

        if ((config.perspectiveTilt || 0) > 0) {
            const scaleY = 1 - (config.perspectiveTilt / 90);
            ctx.translate(cx, cy); ctx.scale(1, scaleY); ctx.translate(-cx, -cy);
        }

        const maxRadius = Math.min(w, h) / 2 * 0.95;
        const effectiveAngle = GOLDEN_ANGLE + spiralAngleOffset;
        
        const activeChannels: { h: number, s: number, l: number, amp: number, offset: number }[] = [];
        let rawTotalAmp = 0;
        
        if (amplitudes && amplitudes.size > 0) {
            let idx = 0;
            for (const [key, amp] of amplitudes.entries()) {
                rawTotalAmp += amp;
                const freqNum = typeof key === 'number' ? key : parseFloat(key as string);
                const freq = !isNaN(freqNum) && freqNum > 0
                    ? freqNum
                    : LATTICE_CHANNELS.find(c => c.id === key)?.freq;
                if (freq) {
                    const hsl = getFrequencyHSL(freq);
                    activeChannels.push({ h: hsl.h, s: hsl.s, l: hsl.l, amp: amp, offset: idx * 0.52 });
                    idx++;
                }
            }
        }
        
        if (activeChannels.length === 0 && LATTICE_CHANNELS && LATTICE_CHANNELS.length > 0) {
            LATTICE_CHANNELS.forEach((ch, index) => {
                const hsl = getFrequencyHSL(ch.freq);
                activeChannels.push({ h: hsl.h, s: hsl.s, l: hsl.l, amp: 0, offset: index * 0.52 });
            });
        }
        if (activeChannels.length === 0) activeChannels.push({ h: 0, s: 0, l: 0.5, amp: 0.5, offset: 0 });

        if (typeof memory.smoothTotalAmp === 'undefined') memory.smoothTotalAmp = 0;
        memory.smoothTotalAmp += (Math.min(3.0, rawTotalAmp) - memory.smoothTotalAmp) * (10.0 * dt);
        if (typeof memory.currentRotation === 'undefined') memory.currentRotation = 0;
        if (typeof memory.wavePhaseOffset === 'undefined') memory.wavePhaseOffset = 0;
        if (typeof memory.colorPhaseOffset === 'undefined') memory.colorPhaseOffset = 0;

        const syncFactor = (globalBinauralBeat > 0 ? globalBinauralBeat : 8.0) / BASE_FREQ;
        const kineticSpeedMult = 1.0 + (memory.smoothTotalAmp * reactivity);
        
        memory.currentRotation += rotationSpeed * kineticSpeedMult * dt * syncFactor;
        memory.wavePhaseOffset += waveSpeed * kineticSpeedMult * dt * syncFactor;
        memory.colorPhaseOffset += colorShiftSpeed * dt * syncFactor;

        const dynamicSpread = spreadFactor * (1.0 + (memory.smoothTotalAmp * reactivity * 0.3));
        const c = dynamicSpread * visualScale;
        const audioKick = (memory.smoothTotalAmp * reactivity * forceMult);
        const colorOut = {r:0, g:0, b:0};

        if (coreSize > 0) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = bloomStrength;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            const limit = Math.min(seedCount, coreSize);
            for (let i = 0; i < limit; i++) {
                const r = c * Math.pow(i, growthExponent) + (maxRadius * vortexPinch);
                if (r > maxRadius) continue;
                const theta = i * effectiveAngle + memory.currentRotation;
                const x = cx + r * Math.cos(theta);
                const y = cy + r * Math.sin(theta);
                const size = (baseParticleSize * 2) * visualScale;
                const alpha = Math.min(1, coreOpacity * masterOpacity);
                if (alpha < 0.01) continue;
                ctx.beginPath(); ctx.arc(x, y, size, 0, TWO_PI); ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; ctx.fill();
            }
        }

        ctx.shadowBlur = 0; 
        ctx.shadowColor = 'transparent';
        ctx.globalCompositeOperation = blendMode === 'ADDITIVE' ? 'lighter' : 'source-over';

        for (let i = coreSize; i < seedCount; i++) {
            const n = i; 
            let r = c * Math.pow(n, growthExponent);
            r += maxRadius * vortexPinch;
            if (r > maxRadius) continue;

            const distNorm = r / maxRadius;
            const angleWarp = angleModulation > 0 ? Math.sin(distNorm * 10 - memory.wavePhaseOffset) * angleModulation : 0;
            const theta = n * effectiveAngle + memory.currentRotation + angleWarp; 
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);

            const physicalPhase = (distNorm * waveDensity) - memory.wavePhaseOffset;
            let ripple = (Math.sin(physicalPhase) + 1.0) / 2.0; 
            if (contrast !== 1.0) ripple = Math.pow(ripple, contrast);
            
            let size = baseParticleSize * (1.0 + (distNorm * 2.0));
            size += ripple * (agitation * 5.0 * baseParticleSize) * (0.2 + audioKick);
            if (petalSymmetry >= 1) {
                const symmetryMod = 0.5 + 0.5 * Math.cos(theta * Math.floor(petalSymmetry));
                size *= (0.2 + 0.8 * symmetryMod);
            }
            size *= visualScale;
            if (size < 0.5) continue;

            let channelR = 0, channelG = 0, channelB = 0;
            let waveEnergy = 0;
            const len = activeChannels.length;

            for(let j = 0; j < len; j++) {
                const ch = activeChannels[j];
                let chVal = (Math.sin(physicalPhase + ch.offset) + 1.0) / 2.0; 
                if (contrast !== 1.0) chVal = Math.pow(chVal, contrast);
                
                let shiftedH = (ch.h + memory.colorPhaseOffset + (distNorm * colorShiftSpeed)) % 1.0;
                if (shiftedH < 0) shiftedH += 1.0;
                
                hslToRgbVals(shiftedH, ch.s, ch.l, colorOut);

                const base = minBrightness + (chVal * (1.0 - minBrightness));
                const audio = ch.amp * forceMult * reactivity; 
                const finalIntensity = (base + audio) * colorGain;

                channelR += colorOut.r * finalIntensity;
                channelG += colorOut.g * finalIntensity;
                channelB += colorOut.b * finalIntensity;
                waveEnergy += finalIntensity;
            }

            const chroma = Math.min(1, staticColorMix + (Math.min(1, waveEnergy * 2.0) * colorDynamics));
            const greyLevel = 255 * waveEnergy; 
            
            let finalR = (greyLevel * (1-chroma)) + ((channelR * saturation) * chroma);
            let finalG = (greyLevel * (1-chroma)) + ((channelG * saturation) * chroma);
            let finalB = (greyLevel * (1-chroma)) + ((channelB * saturation) * chroma);

            if (prismCorrection > 0) {
                const white = Math.min(finalR, Math.min(finalG, finalB));
                const removal = white * prismCorrection;
                finalR -= removal; finalG -= removal; finalB -= removal;
            }

            finalR = finalR > 255 ? 255 : (finalR < 0 ? 0 : finalR);
            finalG = finalG > 255 ? 255 : (finalG < 0 ? 0 : finalG);
            finalB = finalB > 255 ? 255 : (finalB < 0 ? 0 : finalB);

            const totalAlpha = waveEnergy * 0.5; 
            const edgeFade = Math.min(1, (1 - distNorm) * 8); 
            const finalAlpha = Math.min(1, totalAlpha * edgeFade * masterOpacity);

            if (finalAlpha > 0.01) {
                ctx.beginPath(); ctx.arc(x, y, size, 0, TWO_PI);
                ctx.fillStyle = `rgba(${finalR|0}, ${finalG|0}, ${finalB|0}, ${finalAlpha})`;
                ctx.fill();
            }
        }
        ctx.restore();
    },
    cleanup: (context) => {
        const { memory } = context;
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};