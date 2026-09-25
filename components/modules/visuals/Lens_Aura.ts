import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyColor } from './shared';

// --- ZEN AURA PHYSICS (Exact V1 Math) ---
const getAuraGeometry = (freq: number, smoothing: number) => {
    const safeFreq = Math.max(0.1, freq);
    
    // As smoothing increases, it forces the number of lobes down, making the blob rounder
    const smoothFactor = 1.0 - (smoothing * 0.75); 
    const n = Math.max(2, Math.round(Math.sqrt(safeFreq) * 0.3 * smoothFactor));
    
    // Slow, meditative fluid rotation
    const speed = 0.5 + (Math.log10(safeFreq) * 0.5);
    return { n, speed };
};

export const Lens_Aura: VisualizerPlugin & { draw: (ctx: LensContext) => void } = {
    id: 'AURA',
    name: 'Aura',
    renderType: 'CANVAS_2D',
    isLegacy: true, 
    
    // EXACT MAP OF CONTROLS_GENERIC from VisualizerRegistry.ts
    // (Aura did not have a dedicated CONTROLS_AURA array in V1)
    parameters: [
        { id: 'masterOpacity', label: 'Master Opacity', icon: 'Layers', type: 'SLIDER', min: 0, max: 1, step: 0.05, color: '#ffffff', section: 'LIGHT', defaultValue: 1.0 },
        { id: 'reactivity', label: 'Reactivity', icon: 'Activity', type: 'SLIDER', min: 0, max: 2.0, step: 0.05, color: '#22d3ee', section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'force', label: 'Force', icon: 'Zap', type: 'SLIDER', min: 0, max: 5.0, step: 0.1, color: '#f43f5e', section: 'PHYSICS', defaultValue: 1.5 },
        { id: 'visualScale', label: 'Scale', icon: 'Maximize', type: 'SLIDER', min: 0.1, max: 4.0, step: 0.05, color: '#ffffff', section: 'GEOMETRY', defaultValue: 1.0 },
    ],

    // EXACT MERGE of DEFAULT_LATTICE_CONFIG and DEFAULT_PHYSICS_PRESETS.AURA
    defaultConfig: {
        masterOpacity: 1.0, guideOpacity: 0.0, reactivity: 1.0, force: 1.5, orbitalTrails: 0.4, showLabels: false, perspectiveTilt: 0, connectSpirals: false, interferenceMode: true, particleMode: 'UNIFIED', solarWind: 0.0, gravity: 0.0, agitation: 0.0, viscosity: 0.0, glow: 1.0, streamFlow: 0.0, membraneTension: 0.5, harmonicRoughness: 0.5, nucleusSize: 0.2, plasmaBloom: 0.5, rotationDrift: 0.1, visualScale: 1.0
    },

    presets: [], // No AURA_PRESETS existed in V1. Kept intentionally empty.

    update: function(context: LensContext, localConfig?: Record<string, unknown>) {
        const config = localConfig ? { ...context.config, ...localConfig } : context.config;
        this.draw({ ...context, config });
    },

    render: function(context: LensContext, localConfig?: Record<string, unknown>) {
        const config = localConfig ? { ...context.config, ...localConfig } : context.config;
        this.draw({ ...context, config });
    },

    // --- EXACT, LITERAL COPY-PASTE OF YOUR UPLOADED DRAW FUNCTION ---
    draw: ({ ctx, w, h, cx, cy, amplitudes, config, theme, time, memory }: LensContext) => {
        ctx.save();
        
        // --- 3D TILT ---
        if ((config.perspectiveTilt || 0) > 0) {
            const scaleY = 1 - (config.perspectiveTilt / 90);
            ctx.translate(cx, cy); ctx.scale(1, scaleY); ctx.translate(-cx, -cy);
        }

        const maxRadius = Math.min(w, h) / 2 * 0.8;

        // --- USER CONTROLS ---
        const tension = config.membraneTension ?? 0.5; 
        const roughness = config.harmonicRoughness ?? 0.5; 
        const nucleus = config.nucleusSize ?? 0.2; 
        const plasma = config.plasmaBloom ?? 0.5; 
        const driftSpeed = config.rotationDrift ?? 0.0; 
        const forceMult = config.force || 1.0;
        
        // Use viscosity as our Spatial Smoothing coefficient
        const smoothing = config.viscosity ?? 0.5; 

        // --- 1. FLUID INERTIA ENGINE (Temporal Smoothing) ---
        if (!memory.auraWaves) memory.auraWaves = new Map<string, Record<string, unknown>>();
        const currentWaves = memory.auraWaves as Map<string, Record<string, unknown>>;
        const targetVolumes = new Map<string, number>();
        let hasActiveAudio = false;

        LATTICE_CHANNELS.forEach(ch => {
            const amp = amplitudes.get(ch.id) || 0;
            if (amp > 0.001) {
                targetVolumes.set(ch.id, amp * forceMult);
                hasActiveAudio = true;
            }
        });

        // Zen Idle State: A perfectly slow breathing circle
        // If Pulse is active, ensure we have a base volume to animate
        if (!hasActiveAudio) {
            targetVolumes.set('IDLE', 0.15 * forceMult);
        }

        const fluidity = config.phaseFluidity ?? 0.5;
        const lerpRate = Math.max(0.01, 0.2 - (fluidity * 0.18));

        targetVolumes.forEach((targetAmp, id) => {
            if (!currentWaves.has(id)) {
                if (id === 'IDLE') {
                    currentWaves.set(id, { n: 2, speed: 0.3, vol: 0, color: theme.primary });
                } else {
                    const ch = LATTICE_CHANNELS.find(c => c.id === id)!;
                    const physics = getAuraGeometry(ch.freq, smoothing);
                    currentWaves.set(id, {
                        n: physics.n, speed: physics.speed, vol: 0, color: getFrequencyColor(ch.freq)
                    });
                }
            } else {
                // Dynamically update geometry if the user moves the smoothing slider or color wheel
                if (id !== 'IDLE') {
                    const ch = LATTICE_CHANNELS.find(c => c.id === id)!;
                    const physics = getAuraGeometry(ch.freq, smoothing);
                    currentWaves.get(id).n = physics.n;
                    currentWaves.get(id).color = getFrequencyColor(ch.freq);
                }
            }
        });

        interface ActiveMode { n: number, speed: number, vol: number, color: string }
        const activeModes: ActiveMode[] = [];

        currentWaves.forEach((wave, id) => {
            const target = targetVolumes.get(id) || 0;
            wave.vol += (target - wave.vol) * lerpRate; 
            
            if (wave.vol > 0.005) {
                activeModes.push(wave);
            } else {
                currentWaves.delete(id); 
            }
        });

        if (activeModes.length === 0) { ctx.restore(); return; }

        // --- 2. RENDER ENGINE (Glowing Liquid Clouds) ---
        // 'screen' mode causes overlapping colored blobs to mix into bright white/psychedelic hues
        ctx.globalCompositeOperation = 'screen';

        const resolution = 180; // Smooth curves
        const cosT = new Float32Array(resolution + 1);
        const sinT = new Float32Array(resolution + 1);
        for (let i = 0; i <= resolution; i++) {
            const theta = (i / resolution) * Math.PI * 2;
            cosT[i] = Math.cos(theta);
            sinT[i] = Math.sin(theta);
        }

        const drawLiquidBlob = (mode: ActiveMode, baseR: number, distortionLimit: number, blur: number, alpha: number, driftOffset: number) => {
            ctx.beginPath();
            
            for (let i = 0; i <= resolution; i++) {
                const theta = (i / resolution) * Math.PI * 2;
                const effectiveTheta = theta + driftOffset;
                
                // Primary Flow
                const flow = Math.sin(mode.n * effectiveTheta - time * mode.speed);
                // Secondary Reverse Flow
                const subLobe = Math.max(1, mode.n - 1);
                const backFlow = Math.cos(subLobe * effectiveTheta + time * mode.speed * 0.6);
                
                // High smoothing mathematically suppresses the roughness jitter
                const actualRoughness = roughness * (1.0 - smoothing);
                const jitter = actualRoughness > 0 ? Math.sin(effectiveTheta * mode.n * 3 + time * 2) * actualRoughness * 0.3 : 0;

                const elasticity = 1.0 - (tension * 0.8); 
                const waveMix = (flow * 0.6) + (backFlow * 0.4) + jitter;
                
                // Prevent snapping inside out
                const drawR = Math.max(1, baseR * (1 + (waveMix * distortionLimit * mode.vol * elasticity)));
                
                const x = cx + cosT[i] * drawR;
                const y = cy + sinT[i] * drawR;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.closePath();
            ctx.fillStyle = mode.color;
            ctx.shadowColor = mode.color;
            ctx.shadowBlur = blur;
            ctx.globalAlpha = config.masterOpacity * alpha;
            ctx.fill();
        };

        activeModes.forEach((mode, index) => {
            const driftOffset = time * driftSpeed * (index % 2 === 0 ? 1 : -1);
            
            // LAYER 1: Massive, faint, highly blurred Outer Aura (Plasma Bloom)
            const outerGlow = 20 + (plasma * 80);
            drawLiquidBlob(mode, maxRadius * 0.7, 0.4, outerGlow, mode.vol * 0.15, driftOffset);
            
            // LAYER 2: Medium, brighter Mid-Aura
            const midGlow = 10 + (plasma * 40);
            drawLiquidBlob(mode, maxRadius * 0.5, 0.3, midGlow, mode.vol * 0.3, driftOffset);

            // LAYER 3: The Nucleus (Solid glowing inner core)
            if (nucleus > 0.05) {
                drawLiquidBlob(mode, maxRadius * 0.25 * nucleus, 0.1, 15, mode.vol * 0.8, driftOffset * 1.5);
            }
        });

        ctx.shadowBlur = 0;
        ctx.restore();
    },
    cleanup: (context) => {
        const { memory } = context;
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};