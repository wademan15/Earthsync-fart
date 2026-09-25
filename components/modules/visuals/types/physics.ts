import { VisualizerTelemetry } from './ui';
import { FeedbackConfig, ImmersionConfig, AetherConfig } from './audio';

export interface LatticeGlobalConfig {
  masterOpacity: number; guideOpacity: number; reactivity: number; force: number; orbitalTrails: number;
  showLabels: boolean; perspectiveTilt: number; connectSpirals: boolean; interferenceMode: boolean;
  particleMode: 'UNIFIED' | 'MULTIVERSE'; 
  solarWind: number; gravity: number; agitation: number; viscosity: number; glow: number; 
  streamFlow?: number; phaseFluidity?: number; harmonicRoughness?: number; membraneTension?: number;
  plateShape?: 'CIRCLE' | 'SQUARE'; macroA?: number; macroB?: number;
  harmonicSpacing?: number; edgeHardness?: number; latticeComplexity?: number; bloomFill?: number; bloomStroke?: number; 
  nucleusSize?: number; plasmaBloom?: number; rotationDrift?: number; latticeDensity?: number; isoThreshold?: number; radarSweep?: number;
  visualScale?: number; flightSpeed?: number; horizonOffset?: number; gridWidthScale?: number; fogDensity?: number; focalLength?: number; gridResolution?: number; neonFactor?: number; 
  terrainSmoothing?: number; freqIsolation?: 'ALL' | 'BASS' | 'MIDS'; terrainPulse?: boolean;
  seedCount?: number; spreadFactor?: number; waveDensity?: number; waveSpeed?: number; rotationSpeed?: number; particleSize?: number; coreSize?: number; colorGain?: number;
  spiralAngle?: number; bloomStrength?: number; contrast?: number; blendMode?: 'ADDITIVE' | 'NORMAL';
  saturation?: number; coreOpacity?: number; minBrightness?: number; colorMix?: number; colorDynamics?: number; prismCorrection?: number;
  growthExponent?: number; angleModulation?: number; petalSymmetry?: number; colorShiftSpeed?: number; vortexPinch?: number;
  surfaceTension?: number; boundaryReflection?: number; fluidTurbulence?: number; causticLighting?: boolean; harmonicOvertones?: number; flowInversion?: boolean;
  fractalDepth?: number; quantumSpin?: number; vortexSpeed?: number; tunnelTwist?: number; coreCollapse?: number; breakthrough?: number; moireControl?: number; dimensionalFolds?: number; entitySymmetry?: number;
  emitterSymmetry?: number;
  
  cameraPitch?: number; cameraYaw?: number; cameraRoll?: number; cameraHeight?: number; cameraZoom?: number; cameraPanY?: number;
  sunOrbit?: number; sunElevation?: number; sunSize?: number; sunIntensity?: number; sunPulsar?: number; sunCorona?: number;
  
  starDensity?: number; nebulaIntensity?: number; auroraIntensity?: number;
  moonSize?: number; moonPosition?: number;

  [key: string]: any; 
}

export interface LensContext {
    ctx: CanvasRenderingContext2D; gl?: WebGL2RenderingContext; w: number; h: number; cx: number; cy: number; time: number; dt: number;
    bpm: number; coherence: number; globalBinauralBeat: number; amplitudes: Map<string, number>;
    heartHarmonics: { vols: number[]; mutes: boolean[]; stackMutes: boolean; };
    stackMutes: Record<string, boolean>; config: LatticeGlobalConfig; feedback: FeedbackConfig;
    immersion: ImmersionConfig; aether?: AetherConfig; breathRadius?: number;
    theme: { primary: string; secondary: string }; memory: any;
    sensorMode?: 'AETHER' | 'TIDAL' | 'CRYSTALLINE' | null; telemetry?: VisualizerTelemetry;
    latticeMode?: 'OVERTONE' | 'UNDERTONE' | 'BOTH' | 'OFF';
}

export interface VisualizerLens { 
    update?: (ctx: LensContext) => void;
    render?: (ctx: LensContext) => void;
    draw?: (ctx: LensContext) => void; 
}

export const DEFAULT_LATTICE_CONFIG: LatticeGlobalConfig = {
    masterOpacity: 1.0, guideOpacity: 0.2, reactivity: 0.5, force: 1.5, orbitalTrails: 0.2, showLabels: false, perspectiveTilt: 0, connectSpirals: false, interferenceMode: true, particleMode: 'UNIFIED', solarWind: 0.02, gravity: 0.005, agitation: 0.5, viscosity: 0.6, glow: 0.5, streamFlow: 0.0, harmonicSpacing: 0.5, edgeHardness: 0.5, phaseFluidity: 0.5, latticeComplexity: 0, bloomFill: 0.1, bloomStroke: 1.5, membraneTension: 0.5, harmonicRoughness: 0.5, nucleusSize: 0.2, plasmaBloom: 0.5, rotationDrift: 0.0, latticeDensity: 0.5, isoThreshold: 0.05, radarSweep: 0.0, visualScale: 1.0, flightSpeed: 70, horizonOffset: 0.68, gridWidthScale: 4.2, fogDensity: 1.4, focalLength: 410, gridResolution: 60, neonFactor: 1.3, terrainSmoothing: 0.28, freqIsolation: 'ALL', terrainPulse: true, seedCount: 1100, spreadFactor: 4.4, waveDensity: 13.4, waveSpeed: 1.7, rotationSpeed: 0.194, particleSize: 0.5, coreSize: 32, colorGain: 2.0, spiralAngle: 0, bloomStrength: 0, contrast: 0.9, blendMode: 'ADDITIVE', saturation: 1.0, coreOpacity: 1.0, minBrightness: 0.5, colorMix: 0.0, colorDynamics: 0.35, prismCorrection: 1.0, growthExponent: 0.5, angleModulation: 0.0, petalSymmetry: 0, colorShiftSpeed: 0.0, vortexPinch: 0.0, surfaceTension: 1.0, boundaryReflection: 0.0, fluidTurbulence: 0.0, causticLighting: false, harmonicOvertones: 0.0, flowInversion: false, fractalDepth: 8, quantumSpin: 1.0, vortexSpeed: 2.0, tunnelTwist: 0.15, coreCollapse: 0.88, breakthrough: 0.5, moireControl: 0.15, dimensionalFolds: 16, entitySymmetry: 1.0, emitterSymmetry: 2, plateShape: 'CIRCLE', macroA: 0, macroB: 0, 
    cameraPitch: -0.35, cameraYaw: 0, cameraRoll: 0, cameraHeight: 80, cameraZoom: 0.45, cameraPanY: -0.1, sunOrbit: 0.5, sunElevation: -0.3, sunSize: 1.2, sunIntensity: 1.0, sunPulsar: 0.2, sunCorona: 0.8,
    starDensity: 0, nebulaIntensity: 0, auroraIntensity: 0, moonSize: 0, moonPosition: 0
};

export const DEFAULT_PHYSICS_PRESETS: Record<string, LatticeGlobalConfig> = {
    LAB: { ...DEFAULT_LATTICE_CONFIG, masterOpacity: 1.0, guideOpacity: 0.2, reactivity: 0.1, force: 1.0, orbitalTrails: 0.0, showLabels: true, perspectiveTilt: 0, connectSpirals: false, interferenceMode: false, particleMode: 'UNIFIED' as const, solarWind: 0.0, gravity: 0.0, agitation: 0.0, viscosity: 0.0, glow: 0.0, streamFlow: 0.0, visualScale: 1.0 },
    CYMATIC: { ...DEFAULT_LATTICE_CONFIG, masterOpacity: 1.0, visualScale: 1.0, force: 5.0, reactivity: 1.0, perspectiveTilt: 0, latticeDensity: 0.8, particleSize: 1.4, membraneTension: 1.0, harmonicRoughness: 0.0, phaseFluidity: 0.5, streamFlow: 1.0, glow: 0.5, solarWind: 0.100, gravity: 0.010, agitation: 0.3, viscosity: 0.55, flowInversion: false, guideOpacity: 0.2, orbitalTrails: 0.5, showLabels: false, connectSpirals: false, interferenceMode: true, particleMode: 'UNIFIED' as const, minBrightness: 0.8, colorGain: 2.4, blendMode: 'NORMAL' },
    BLOOM: { ...DEFAULT_LATTICE_CONFIG, masterOpacity: 1.0, guideOpacity: 0.05, reactivity: 0.5, force: 1.0, orbitalTrails: 0.3, showLabels: false, perspectiveTilt: 0, connectSpirals: false, interferenceMode: false, particleMode: 'UNIFIED' as const, solarWind: 0.0, gravity: 0.0, agitation: 0.0, viscosity: 0.0, glow: 0.2, streamFlow: 0.0, harmonicSpacing: 0.6, edgeHardness: 0.9, phaseFluidity: 0.2, latticeComplexity: 0, bloomFill: 0.05, bloomStroke: 1.5, visualScale: 1.0 },
    HYDRO: { ...DEFAULT_LATTICE_CONFIG, cameraPitch: 0.0, cameraYaw: 0.0, cameraZoom: 1.0, dishRadius: 1.0, glassThickness: 0.05, meniscus: 0.7, surfaceTension: 1.5, viscosity: 0.15, force: 1.4, faradayEffect: 0.45, harmonicOvertones: 0.2, fluidTurbulence: 0.0, lightAngle: 0.85, lightElevation: 1.2, lightIntensity: 2.2, lightWarmth: 0.0, rimLightIntensity: 0.8, rimLightAngle: 0.0, causticIntensity: 2.2, causticDispersion: 0.25, ambientGlow: 0.1, lightSweepSpeed: 0.0, waterTint: 'DEIONIZED_PURE', masterOpacity: 1.0, blendMode: 'NORMAL' },
    AURA: { ...DEFAULT_LATTICE_CONFIG, masterOpacity: 1.0, guideOpacity: 0.0, reactivity: 1.0, force: 1.5, orbitalTrails: 0.4, showLabels: false, perspectiveTilt: 0, connectSpirals: false, interferenceMode: true, particleMode: 'UNIFIED' as const, solarWind: 0.0, gravity: 0.0, agitation: 0.0, viscosity: 0.0, glow: 1.0, streamFlow: 0.0, membraneTension: 0.5, harmonicRoughness: 0.5, nucleusSize: 0.2, plasmaBloom: 0.5, rotationDrift: 0.1, visualScale: 1.0 },
    TERRAIN: { ...DEFAULT_LATTICE_CONFIG, cameraPitch: -0.53, cameraYaw: 0, cameraRoll: 0, cameraHeight: 134, cameraZoom: 0.32, cameraPanY: -0.1, sunOrbit: 0.5, sunElevation: -0.3, sunSize: 1.8, sunIntensity: 1, sunPulsar: 0, sunCorona: 0.35, starDensity: 0.05, nebulaIntensity: 0.05, moonSize: 1.2, moonPosition: -0.4, gridWidthScale: 4.2, flightSpeed: 17, gridResolution: 150, terrainSmoothing: 0.3, neonFactor: 2.4, colorShiftSpeed: 0, agitation: 0.5, blendMode: 'ADDITIVE', fogDensity: 1.4, colorGain: 2, horizonOffset: 0.68, visualScale: 1, force: 0.4, reactivity: 0.45 },
    TORUS: { ...DEFAULT_LATTICE_CONFIG, fractalDepth: 8, coreSize: 300, vortexPinch: 80, streamFlow: 0.2, quantumSpin: 0.1, agitation: 2.0, neonFactor: 1.5, colorDynamics: 0.1, blendMode: 'ADDITIVE', cameraPitch: 0.4 },
    HYPERSPACE: { ...DEFAULT_LATTICE_CONFIG, masterOpacity: 1.0, visualScale: 1.0, force: 1.0, perspectiveTilt: 0, dimensionalFolds: 16, moireControl: 0.15, breakthrough: 0.5, entitySymmetry: 1.0, plasmaBloom: 0.5, membraneTension: 0.5, edgeHardness: 0.5, streamFlow: 0.5, colorDynamics: 0.5, rotationDrift: 0.5, coreCollapse: 0.88, quantumSpin: 1.0, agitation: 0.0 }
};

export interface VisualizerPresetDef { category: string; config: Partial<LatticeGlobalConfig>; modulations?: Record<string, any>; }
export type BioBloomPresetDef = VisualizerPresetDef;

export const CYMATIC_PRESETS: Record<string, VisualizerPresetDef> = {
    "01 Pure Square Sand": { category: "Acoustic Plates", config: { blendMode: 'NORMAL', plateShape: 'SQUARE', latticeDensity: 0.85, membraneTension: 0.9, particleSize: 1.3, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.5, agitation: 0.8, streamFlow: 0.0, phaseFluidity: 0.2, glow: 0.4, minBrightness: 0.8, reactivity: 1.0, masterOpacity: 1.0, colorGain: 2.2 }, modulations: { agitation: { enabled: true, min: 0.2, max: 1.2, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } },
    "02 Circular Chladni": { category: "Acoustic Plates", config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 1.0, membraneTension: 0.95, particleSize: 1.2, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.6, agitation: 0.6, streamFlow: 0.0, phaseFluidity: 0.5, glow: 0.35, minBrightness: 0.75, reactivity: 1.2, masterOpacity: 1.0, colorGain: 2.2 }, modulations: { membraneTension: { enabled: true, min: 0.5, max: 1.0, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } },
    "03 Whirlpool Maelstrom": { category: "Vortices & Fluid Dynamics", config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.95, membraneTension: 0.3, particleSize: 1.5, gravity: 0.07, solarWind: 0.0, harmonicRoughness: 0.1, viscosity: 0.2, agitation: 0.4, streamFlow: 1.0, phaseFluidity: 0.85, glow: 0.9, minBrightness: 0.7, reactivity: 1.4, masterOpacity: 1.0, colorGain: 2.8, turbulence: 0.15 }, modulations: { streamFlow: { enabled: true, min: 0.4, max: 1.0, amtBinaural: 1.0, curve: 'EASE_IN_OUT', mixMode: 'MULT', amtBreath: 0, amtHr: 0, amtCoh: 0 }, gravity: { enabled: true, min: 0.02, max: 0.09, amtBreath: 1.0, curve: 'LINEAR', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } },
    "04 Cosmic Spiral Vortex": { category: "Vortices & Fluid Dynamics", config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.85, membraneTension: 0.45, particleSize: 1.6, gravity: 0.04, solarWind: 0.15, harmonicRoughness: 0.0, viscosity: 0.25, agitation: 0.6, streamFlow: 0.9, phaseFluidity: 0.7, glow: 0.95, minBrightness: 0.85, reactivity: 1.5, masterOpacity: 1.0, colorGain: 3.0, turbulence: 0.08 }, modulations: { streamFlow: { enabled: true, min: 0.3, max: 1.0, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 }, solarWind: { enabled: true, min: 0.05, max: 0.4, amtBinaural: 1.0, curve: 'LINEAR', mixMode: 'MULT', amtBreath: 0, amtHr: 0, amtCoh: 0 } } },
    "05 Chladni Cyclone": { category: "Vortices & Fluid Dynamics", config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.75, particleSize: 1.35, gravity: 0.035, solarWind: 0.0, harmonicRoughness: 0.2, viscosity: 0.45, agitation: 0.7, streamFlow: 0.65, phaseFluidity: 0.6, glow: 0.4, minBrightness: 0.8, reactivity: 1.3, masterOpacity: 1.0, colorGain: 2.3, turbulence: 0.05 }, modulations: { streamFlow: { enabled: true, min: 0.2, max: 0.9, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } },
    "06 Plasma Grid": { category: "Cosmic Nebulae", config: { blendMode: 'ADDITIVE', plateShape: 'SQUARE', latticeDensity: 0.75, membraneTension: 0.74, particleSize: 1.5, gravity: 0.054, solarWind: 0.157, harmonicRoughness: 0.0, viscosity: 0.99, agitation: 0.92, streamFlow: 1.0, phaseFluidity: 0.7, glow: 0.86, minBrightness: 1.0, colorGain: 2.85, reactivity: 1.5, masterOpacity: 1.0 }, modulations: { streamFlow: { enabled: true, min: 0.0, max: 0.6, amtBinaural: 1.0, curve: 'LINEAR', mixMode: 'ADD', amtBreath: 0, amtHr: 0, amtCoh: 0 } } },
    "07 Nebula Cloud": { category: "Cosmic Nebulae", config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.75, membraneTension: 0.2, particleSize: 1.4, gravity: 0.0, solarWind: 0.3, harmonicRoughness: 0.0, viscosity: 0.1, agitation: 0.5, streamFlow: 0.8, phaseFluidity: 0.9, glow: 0.95, minBrightness: 0.5, reactivity: 1.0, masterOpacity: 0.95, colorGain: 2.5 }, modulations: { solarWind: { enabled: true, min: 0.0, max: 0.8, amtBreath: 1.0, curve: 'LINEAR', mixMode: 'MULT', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } },
    "08 Magnetic Fluid": { category: "Organic Fluids", config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.6, particleSize: 1.3, gravity: 0.05, solarWind: 0.0, harmonicRoughness: 1.5, viscosity: 0.8, agitation: 0.7, streamFlow: 0.0, phaseFluidity: 0.3, glow: 0.3, minBrightness: 0.75, reactivity: 1.2, masterOpacity: 1.0, colorGain: 2.2 }, modulations: { harmonicRoughness: { enabled: true, min: 0.8, max: 1.8, amtBreath: 1.0, curve: 'EASE_IN_OUT', inertia: 0.4, mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } },
    "09 Oceanic Eddy": { category: "Fluid & Ethereal", config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.35, particleSize: 1.4, gravity: 0.05, solarWind: 0.05, harmonicRoughness: 0.1, viscosity: 0.3, agitation: 0.5, streamFlow: 0.8, phaseFluidity: 0.8, glow: 0.8, minBrightness: 0.75, reactivity: 1.2, masterOpacity: 0.95, colorGain: 2.6, turbulence: 0.2 }, modulations: { streamFlow: { enabled: true, min: 0.3, max: 1.0, amtBreath: 1.0, amtBinaural: 0.5, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtHr: 0, amtCoh: 0 } } },
    "10 Liquid Gold": { category: "Fluid & Ethereal", config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.6, particleSize: 1.4, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.8, agitation: 0.7, streamFlow: 0.0, phaseFluidity: 0.3, glow: 0.4, minBrightness: 0.85, reactivity: 1.2, masterOpacity: 1.0, contrast: 0.05, saturation: 1.5, colorGain: 2.2, waveDensity: 3.0, waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { membraneTension: { enabled: true, min: 0.5, max: 1.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' }, colorGain: { enabled: true, min: 1.0, max: 2.2, amtBinaural: 1.0, amtBreath: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } }
};

export const BIO_BLOOM_PRESETS: Record<string, VisualizerPresetDef> = {
    "01 Sacred Sunflower": { category: "Hyper-Organic", config: { seedCount: 3000, spreadFactor: 3.8, minBrightness: 0.15, saturation: 1.2, colorGain: 2.5, contrast: 1.2, waveDensity: 8.0, waveSpeed: 0.0, rotationSpeed: 0.0, particleSize: 1.5, coreSize: 80, blendMode: 'ADDITIVE', growthExponent: 0.5, petalSymmetry: 0, angleModulation: 0, vortexPinch: 0, reactivity: 0.5 }, modulations: { visualScale: { enabled: true, min: 0.8, max: 1.3, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' }, agitation: { enabled: true, min: 0.0, max: 0.8, amtBreath: 0.0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "02 Crystal Lotus": { category: "Hyper-Organic", config: { seedCount: 1500, spreadFactor: 6.0, petalSymmetry: 8, contrast: 2.5, waveDensity: 14.0, particleSize: 2.5, blendMode: 'ADDITIVE', minBrightness: 0.0, colorGain: 3.0, waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { rotationSpeed: { enabled: true, min: -0.2, max: 0.2, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.9, max: 1.2, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "03 Alien Spore": { category: "Hyper-Organic", config: { seedCount: 2000, spreadFactor: 4.5, growthExponent: 0.6, petalSymmetry: 5, angleModulation: 1.2, waveDensity: 8.0, contrast: 1.8, particleSize: 2.0, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { colorGain: { enabled: true, min: 1.0, max: 3.5, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, angleModulation: { enabled: true, min: 0.5, max: 2.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "04 Event Horizon": { category: "Cosmic & Tunnels", config: { seedCount: 4000, spreadFactor: 6.0, growthExponent: 0.8, vortexPinch: 0.3, waveDensity: 5.0, contrast: 3.0, particleSize: 2.5, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: -0.05 }, modulations: { vortexPinch: { enabled: true, min: 0.1, max: 0.7, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, colorShiftSpeed: { enabled: true, min: 0.0, max: 2.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "05 Hyperspace Tunnel": { category: "Cosmic & Tunnels", config: { seedCount: 3000, spreadFactor: 10.0, growthExponent: 0.9, vortexPinch: 0.4, petalSymmetry: 0, angleModulation: 1.0, waveDensity: 3.0, particleSize: 4.0, contrast: 2.5, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { waveSpeed: { enabled: true, min: 0.0, max: 8.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.7, max: 1.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "06 Supernova Flare": { category: "Cosmic & Tunnels", config: { seedCount: 2500, spreadFactor: 4.5, growthExponent: 0.6, angleModulation: 3.0, waveDensity: 6.0, contrast: 1.5, particleSize: 2.0, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { colorGain: { enabled: true, min: 2.0, max: 5.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, agitation: { enabled: true, min: 0.0, max: 1.2, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "07 Machine Elf": { category: "Psychedelic / DMT", config: { seedCount: 4000, spreadFactor: 3.5, petalSymmetry: 5, angleModulation: 2.0, waveDensity: 12.0, contrast: 2.5, particleSize: 1.8, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { rotationSpeed: { enabled: true, min: -1.0, max: 1.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, colorGain: { enabled: true, min: 1.5, max: 3.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "08 Alex Grey Net": { category: "Psychedelic / DMT", config: { seedCount: 4500, spreadFactor: 3.2, petalSymmetry: 12, angleModulation: 0.5, contrast: 2.5, waveDensity: 18.0, particleSize: 1.0, minBrightness: 0.1, blendMode: 'NORMAL', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { spreadFactor: { enabled: true, min: 2.5, max: 4.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' }, agitation: { enabled: true, min: 0.0, max: 0.6, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "09 Rainbow Loom": { category: "Psychedelic / DMT", config: { seedCount: 4000, spreadFactor: 3.0, colorShiftSpeed: 0.0, waveDensity: 20.0, saturation: 2.5, minBrightness: 0.4, particleSize: 2.2, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { colorShiftSpeed: { enabled: true, min: 0.0, max: 5.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.8, max: 1.2, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "10 Cymatic Star": { category: "Sacred Geometry", config: { seedCount: 4000, spreadFactor: 3.0, petalSymmetry: 7, waveDensity: 12.0, contrast: 2.0, particleSize: 1.5, minBrightness: 0.0, blendMode: 'NORMAL', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { agitation: { enabled: true, min: 0.0, max: 1.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' }, visualScale: { enabled: true, min: 0.9, max: 1.1, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "11 Liquid Gold": { category: "Fluid & Ethereal", config: { seedCount: 5000, spreadFactor: 2.2, contrast: 0.05, minBrightness: 0.8, saturation: 1.5, colorGain: 1.5, waveDensity: 3.0, particleSize: 2.0, blendMode: 'NORMAL', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { spreadFactor: { enabled: true, min: 1.5, max: 3.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' }, colorGain: { enabled: true, min: 1.0, max: 2.5, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "12 Silk & Smoke": { category: "Fluid & Ethereal", config: { seedCount: 6000, spreadFactor: 5.5, petalSymmetry: 3, contrast: 1.2, minBrightness: 0.6, saturation: 0.8, waveDensity: 4.0, particleSize: 1.2, blendMode: 'ADDITIVE', waveSpeed: 0.0, rotationSpeed: 0.0 }, modulations: { waveDensity: { enabled: true, min: 2.0, max: 8.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' }, colorShiftSpeed: { enabled: true, min: 0.0, max: 1.0, amtBreath: 0, amtBinaural: 1.0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } }
};

export const NDE_PRESETS: Record<string, VisualizerPresetDef> = {
    "01 Astral Tunnel": { category: "Ethereal", config: { dimensionalFolds: 24, entitySymmetry: 1.0, tunnelTwist: 0.15, coreCollapse: 0.88, quantumSpin: 0.5, phaseFluidity: 0.8, streamFlow: 0.5, agitation: 1.0, plasmaBloom: 0.5, colorDynamics: 0.2, saturation: 1.0, edgeHardness: 0.5, visualScale: 1.0 }, modulations: { streamFlow: { enabled: true, min: 0.1, max: 1.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "02 DMT Web": { category: "Psychedelic", config: { dimensionalFolds: 16, entitySymmetry: 2.5, tunnelTwist: 1.2, coreCollapse: 1.2, quantumSpin: 1.5, phaseFluidity: 0.4, streamFlow: 1.2, agitation: 2.5, plasmaBloom: 0.8, colorDynamics: 1.5, saturation: 1.5, edgeHardness: 1.2, visualScale: 0.8 }, modulations: { tunnelTwist: { enabled: true, min: -1.2, max: 1.2, amtBinaural: 1.0, amtBreath: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "03 Cardiac Singularity": { category: "Biometric", config: { dimensionalFolds: 8, entitySymmetry: 0.5, tunnelTwist: 0.0, coreCollapse: 1.8, quantumSpin: 0.1, phaseFluidity: 0.9, streamFlow: 0.2, agitation: 4.0, plasmaBloom: 1.5, colorDynamics: 0.1, saturation: 1.2, edgeHardness: 2.0, visualScale: 1.2 }, modulations: { agitation: { enabled: true, min: 0.5, max: 3.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'MULT' } } },
    "04 Event Horizon": { category: "Cosmic", config: { dimensionalFolds: 64, entitySymmetry: 1.0, tunnelTwist: -0.5, coreCollapse: 0.2, quantumSpin: 0.2, phaseFluidity: 0.5, streamFlow: -1.5, agitation: 0.5, plasmaBloom: 0.2, colorDynamics: 0.8, saturation: 0.5, edgeHardness: 0.2, visualScale: 1.5 }, modulations: { streamFlow: { enabled: true, min: -2.0, max: 0.0, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "05 Quantum Threads": { category: "Ethereal", config: { dimensionalFolds: 32, entitySymmetry: 3.0, tunnelTwist: 0.4, coreCollapse: 1.0, quantumSpin: 2.0, phaseFluidity: 1.0, streamFlow: 0.8, agitation: 1.5, plasmaBloom: 0.4, colorDynamics: 0.5, saturation: 1.2, edgeHardness: 0.1, visualScale: 1.0 }, modulations: { quantumSpin: { enabled: true, min: -2.0, max: 2.0, amtBinaural: 1.0, amtBreath: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } },
    "06 Seraphim Wings": { category: "Sacred", config: { dimensionalFolds: 12, entitySymmetry: 1.5, tunnelTwist: 0.1, coreCollapse: 1.4, quantumSpin: -0.2, phaseFluidity: 0.7, streamFlow: 0.3, agitation: 2.0, plasmaBloom: 1.0, colorDynamics: 0.0, saturation: 2.0, edgeHardness: 0.8, visualScale: 1.1 }, modulations: { plasmaBloom: { enabled: true, min: 0.2, max: 1.5, amtBreath: 1.0, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD' } } }
};

export const TORUS_PRESETS: Record<string, VisualizerPresetDef> = {
    "01 Golden Implosion": { category: "Breath Sync", config: { masterOpacity: 1, guideOpacity: 0.2, reactivity: 0.5, force: 0, blendMode: 'ADDITIVE', streamFlow: 0, harmonicSpacing: 3, bloomStrength: 0, colorDynamics: 0.75, colorShiftSpeed: 2, vortexPinch: 500, coreSize: 1000, fractalDepth: 16, quantumSpin: 2, tunnelTwist: -2, agitation: 0, neonFactor: 0, saturation: 1, cameraPitch: 0.1, cameraYaw: -3.15, cameraRoll: 0, cameraZoom: 2 }, modulations: { streamFlow: { enabled: true, min: 0, max: 2, amtBreath: 1, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD', curve: 'LINEAR', inertia: 0, binauralHarmonic: 1, linkBreathBinaural: false }, bloomStrength: { enabled: true, min: 0, max: 0.15, amtBreath: 1, amtBinaural: 0, amtHr: 0, amtCoh: 0, mixMode: 'ADD', curve: 'LINEAR', inertia: 0, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "02 Spectral Loom": { category: "Audio Reactive", config: { masterOpacity: 1, reactivity: 0.8, force: 1.5, blendMode: 'ADDITIVE', streamFlow: 1.5, harmonicSpacing: 1.2, bloomStrength: 0.5, colorDynamics: 1.0, colorShiftSpeed: 0.5, vortexPinch: 150, coreSize: 400, fractalDepth: 12, quantumSpin: 0.5, tunnelTwist: 0.2, agitation: 0.5, neonFactor: 2.5, saturation: 1.5, cameraPitch: 0.3, cameraYaw: 0, cameraRoll: 0, cameraZoom: 1.2 }, modulations: { vortexPinch: { enabled: true, min: 100, max: 350, amtBreath: 1.0, amtBinaural: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false }, agitation: { enabled: true, min: 0, max: 1.5, amtBinaural: 1.0, amtBreath: 0, mixMode: 'ADD', curve: 'LINEAR', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "03 Quantum Singularity": { category: "Deep Trance", config: { masterOpacity: 0.9, reactivity: 0.3, force: 0, blendMode: 'NORMAL', streamFlow: -0.5, harmonicSpacing: 0.5, bloomStrength: 0, colorDynamics: 0.2, colorShiftSpeed: 0.1, vortexPinch: 30, coreSize: 800, fractalDepth: 16, quantumSpin: -0.1, tunnelTwist: 1.5, agitation: 0, neonFactor: 1.0, saturation: 0.8, cameraPitch: 0, cameraYaw: 0, cameraRoll: 0, cameraZoom: 0.6 }, modulations: { tunnelTwist: { enabled: true, min: 1.5, max: 3.0, amtBinaural: 1.0, amtBreath: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.9, binauralHarmonic: 1, linkBreathBinaural: false }, cameraZoom: { enabled: true, min: 0.6, max: 0.9, amtBreath: 1.0, mixMode: 'ADD', curve: 'LINEAR', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "04 Harmonic Resonator": { category: "Biofeedback", config: { masterOpacity: 1, reactivity: 0.9, force: 2.0, blendMode: 'ADDITIVE', streamFlow: 0.2, harmonicSpacing: 2.0, bloomStrength: 0.8, colorDynamics: 0.5, colorShiftSpeed: -1.0, vortexPinch: 200, coreSize: 300, fractalDepth: 8, quantumSpin: 0.8, tunnelTwist: 0.0, agitation: 0.2, neonFactor: 3.0, saturation: 1.2, cameraPitch: 0.5, cameraYaw: 0.2, cameraRoll: 0, cameraZoom: 1.5 }, modulations: { neonFactor: { enabled: true, min: 1.0, max: 4.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EXPONENTIAL', inertia: 0.7, binauralHarmonic: 1, linkBreathBinaural: false }, quantumSpin: { enabled: true, min: 0.2, max: 2.0, amtCoh: 1.0, mixMode: 'ADD', curve: 'LINEAR', inertia: 0.9, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "05 The Ethereal Knot": { category: "Sacred Geometry", config: { masterOpacity: 0.8, reactivity: 0.4, force: 0, blendMode: 'ADDITIVE', streamFlow: 1.0, harmonicSpacing: 0.8, bloomStrength: 0.3, colorDynamics: 0.9, colorShiftSpeed: 1.2, vortexPinch: 80, coreSize: 600, fractalDepth: 14, quantumSpin: 0.3, tunnelTwist: -0.5, agitation: 0, neonFactor: 0.8, saturation: 1.0, cameraPitch: -0.4, cameraYaw: 0, cameraRoll: 0.1, cameraZoom: 1.0 }, modulations: { harmonicSpacing: { enabled: true, min: 0.8, max: 2.5, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.4, binauralHarmonic: 1, linkBreathBinaural: false }, colorShiftSpeed: { enabled: true, min: 0.5, max: 2.5, amtBinaural: 1.0, mixMode: 'MULT', curve: 'LINEAR', inertia: 0.8, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "06 Hyperspace Drive": { category: "Deep Trance", config: { masterOpacity: 1, reactivity: 0.7, force: 0, blendMode: 'ADDITIVE', streamFlow: 4.0, harmonicSpacing: 1.5, bloomStrength: 1.0, colorDynamics: 0.1, colorShiftSpeed: 0.0, vortexPinch: 400, coreSize: 200, fractalDepth: 16, quantumSpin: 0.0, tunnelTwist: 0.8, agitation: 0, neonFactor: 2.0, saturation: 2.0, cameraPitch: 0, cameraYaw: 0, cameraRoll: 0, cameraZoom: 1.8 }, modulations: { streamFlow: { enabled: true, min: 1.0, max: 4.0, amtBinaural: 1.0, amtBreath: 0, mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false }, bloomStrength: { enabled: true, min: 0.2, max: 1.2, amtBreath: 1.0, mixMode: 'MULT', curve: 'LINEAR', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false } } }
};

export const TERRAIN_PRESETS: Record<string, VisualizerPresetDef> = {
    "01 Lunar Ascent": { category: "Custom", config: { masterOpacity: 1, guideOpacity: 0.2, reactivity: 0.45, force: 0.4, orbitalTrails: 0.2, showLabels: false, perspectiveTilt: 0, connectSpirals: false, interferenceMode: true, particleMode: 'UNIFIED', solarWind: 0.02, gravity: 0.005, agitation: 0.5, viscosity: 0.6, glow: 0.5, streamFlow: 0, harmonicSpacing: 0.5, edgeHardness: 0.5, phaseFluidity: 0.5, latticeComplexity: 0, bloomFill: 0.1, bloomStroke: 1.5, membraneTension: 0.5, harmonicRoughness: 0.5, nucleusSize: 0.2, plasmaBloom: 0.5, rotationDrift: 0, latticeDensity: 0.5, isoThreshold: 0.05, radarSweep: 0, visualScale: 1, flightSpeed: 17, horizonOffset: 0.68, gridWidthScale: 4.2, fogDensity: 1.4, focalLength: 410, gridResolution: 150, neonFactor: 2.4, terrainSmoothing: 0.3, freqIsolation: 'ALL', terrainPulse: true, seedCount: 1100, spreadFactor: 4.4, waveDensity: 13.4, waveSpeed: 1.7, rotationSpeed: 0.194, particleSize: 0.5, coreSize: 32, colorGain: 2, spiralAngle: 0, bloomStrength: 0, contrast: 0.9, blendMode: 'ADDITIVE', saturation: 0, coreOpacity: 1, minBrightness: 0.5, colorMix: 0, colorDynamics: 0.35, prismCorrection: 1, growthExponent: 0.5, angleModulation: 0, petalSymmetry: 0, colorShiftSpeed: 0, vortexPinch: 0, surfaceTension: 1, boundaryReflection: 0, fluidTurbulence: 0, causticLighting: false, harmonicOvertones: 0, flowInversion: false, fractalDepth: 8, quantumSpin: 1, vortexSpeed: 2, tunnelTwist: 0.15, coreCollapse: 0.88, breakthrough: 0.5, moireControl: 0.15, dimensionalFolds: 16, entitySymmetry: 1, plateShape: 'CIRCLE', macroA: 0, macroB: 0, cameraPitch: -0.53, cameraYaw: 0, cameraRoll: 0, cameraHeight: 134, cameraZoom: 0.32, cameraPanY: -0.1, sunOrbit: 0.5, sunElevation: -0.3, sunSize: 1.8, sunIntensity: 1, sunPulsar: 0, sunCorona: 0.35, starDensity: 0.05, nebulaIntensity: 0.05, moonSize: 1.2, moonPosition: -0.4 }, modulations: { cameraZoom: { enabled: true, min: 0.32, max: 0.54, amtBreath: 0.35, mixMode: 'ADD', curve: 'EXPONENTIAL', inertia: 0.99, binauralHarmonic: 1, linkBreathBinaural: false }, sunIntensity: { enabled: true, min: 1, max: 1.2, amtBreath: 1, amtBinaural: 1, mixMode: 'MULT', curve: 'EXPONENTIAL', binauralHarmonic: 1, linkBreathBinaural: true }, neonFactor: { enabled: true, min: 2.4, max: 3, amtBreath: 1, mixMode: 'ADD', curve: 'LINEAR', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false }, saturation: { enabled: true, max: 2, amtBreath: 1, mixMode: 'ADD', curve: 'LINEAR', inertia: 0.5, binauralHarmonic: 1, linkBreathBinaural: false } } },
    "02 Silk Ocean": { category: "Organic", config: { cameraPitch: -0.35, cameraYaw: 0, cameraRoll: 0, cameraHeight: 80, cameraZoom: 0.45, cameraPanY: -0.1, sunOrbit: 0.5, sunElevation: -0.3, sunSize: 1.2, sunIntensity: 1, sunPulsar: 0.2, sunCorona: 0.8, gridWidthScale: 4.5, flightSpeed: 40, gridResolution: 120, terrainSmoothing: 1, neonFactor: 0.8, colorShiftSpeed: 0.6, agitation: 0.8, blendMode: 'NORMAL', fogDensity: 1.5, colorGain: 1.5, horizonOffset: 0.68, starDensity: 0.2, nebulaIntensity: 0.0, moonSize: 0, moonPosition: 0 }, modulations: { force: { enabled: true, min: 0.5, max: 1.2, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD' } } },
    "03 Synthwave Valley": { category: "Retro", config: { cameraPitch: -0.35, cameraHeight: 80, cameraZoom: 0.45, cameraPanY: -0.1, sunOrbit: 0.0, sunElevation: -0.1, sunSize: 3.5, sunIntensity: 1.5, sunPulsar: 0.8, sunCorona: 0.5, gridWidthScale: 5.0, flightSpeed: 70, gridResolution: 100, terrainSmoothing: 0.8, neonFactor: 1.5, colorShiftSpeed: 0.0, agitation: 0.5, blendMode: 'ADDITIVE', fogDensity: 1.0, colorGain: 2.0, horizonOffset: 0.68, starDensity: 0.9, nebulaIntensity: 1.0, moonSize: 0, moonPosition: 0 }, modulations: { agitation: { enabled: true, min: 0.5, max: 1.5, amtBinaural: 1.0, mixMode: 'MULT' } } },
    "04 Audio Glitch": { category: "Cyber", config: { cameraPitch: -0.35, cameraHeight: 90, cameraZoom: 0.35, cameraPanY: -0.1, sunOrbit: 0, sunElevation: 0, sunSize: 0, sunIntensity: 0, sunPulsar: 0, sunCorona: 0, gridWidthScale: 4.5, flightSpeed: 80, gridResolution: 90, terrainSmoothing: 0.2, neonFactor: 2.0, agitation: 2.0, blendMode: 'ADDITIVE', fogDensity: 1.2, colorGain: 3.0, horizonOffset: 0.68, cameraRoll: 0.05, starDensity: 1.0, nebulaIntensity: 0.0, moonSize: 3.0, moonPosition: -0.5 }, modulations: { agitation: { enabled: true, min: 0.5, max: 3.0, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' } } },
    "05 Harmonic Dunes": { category: "Ethereal", config: { cameraPitch: -0.35, cameraYaw: 0.05, cameraHeight: 100, cameraZoom: 0.45, cameraPanY: -0.1, sunOrbit: -0.5, sunElevation: -0.2, sunSize: 1.5, sunIntensity: 0.8, sunPulsar: 0.4, sunCorona: 1.0, gridWidthScale: 5.5, flightSpeed: 35, gridResolution: 120, terrainSmoothing: 1.0, neonFactor: 1.0, blendMode: 'NORMAL', fogDensity: 2.0, colorGain: 1.5, horizonOffset: 0.68, starDensity: 0.3, nebulaIntensity: 0.8, moonSize: 2.0, moonPosition: 0.2 }, modulations: { flightSpeed: { enabled: true, min: 20, max: 80, amtBreath: 1.0, mixMode: 'ADD' } } },
    "06 Quantum Abyss": { category: "Cosmic", config: { cameraPitch: -0.4, cameraHeight: 120, cameraZoom: 0.3, cameraPanY: -0.1, sunOrbit: 0.0, sunElevation: -0.5, sunSize: 0.5, sunIntensity: 2.0, sunPulsar: 1.0, sunCorona: 2.0, gridWidthScale: 6.0, flightSpeed: 90, gridResolution: 100, terrainSmoothing: 0.7, neonFactor: 2.5, colorShiftSpeed: 2.0, blendMode: 'ADDITIVE', fogDensity: 2.5, colorGain: 2.5, horizonOffset: 0.68, starDensity: 1.0, nebulaIntensity: 1.5, moonSize: 0, moonPosition: 0 }, modulations: { neonFactor: { enabled: true, min: 1.0, max: 3.0, amtBinaural: 1.0, mixMode: 'ADD' } } },
    "07 Crystalline Peaks": { category: "Sacred", config: { cameraPitch: -0.35, cameraYaw: -0.05, cameraHeight: 70, cameraZoom: 0.45, cameraPanY: -0.1, sunOrbit: 0.6, sunElevation: -0.2, sunSize: 1.0, sunIntensity: 1.5, sunPulsar: 0.3, sunCorona: 0.4, gridWidthScale: 4.5, flightSpeed: 45, gridResolution: 120, terrainSmoothing: 0.5, force: 2.0, neonFactor: 1.5, blendMode: 'NORMAL', fogDensity: 1.5, colorGain: 2.0, horizonOffset: 0.68, starDensity: 0.6, nebulaIntensity: 0.3, moonSize: 1.2, moonPosition: -0.6 }, modulations: { force: { enabled: true, min: 1.5, max: 3.5, amtBinaural: 1.0, mixMode: 'MULT' } } }
};

export const HYDRO_PRESETS: Record<string, VisualizerPresetDef> = {
    "01 Pure Deionized Water": {
        category: "Laboratory Acoustic",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: 0.0,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.7,
            surfaceTension: 1.5,
            viscosity: 0.15,
            force: 1.4,
            faradayEffect: 0.45,
            harmonicOvertones: 0.2,
            fluidTurbulence: 0.0,
            lightAngle: 0.85,
            lightElevation: 1.2,
            lightIntensity: 2.2,
            lightWarmth: 0.0,
            rimLightIntensity: 0.8,
            rimLightAngle: 0.0,
            causticIntensity: 2.2,
            causticDispersion: 0.25,
            ambientGlow: 0.1,
            lightSweepSpeed: 0.0,
            waterTint: 'DEIONIZED_PURE',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticIntensity: { enabled: true, min: 1.2, max: 3.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 1.6, max: 2.8, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            force: { enabled: true, min: 0.8, max: 2.2, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            surfaceTension: { enabled: true, min: 1.0, max: 2.5, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' }
        }
    },
    "02 Faraday Resonance": {
        category: "Laboratory Acoustic",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: 0.2,
            cameraZoom: 1.05,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.85,
            surfaceTension: 1.2,
            viscosity: 0.08,
            force: 1.8,
            faradayEffect: 0.8,
            harmonicOvertones: 0.5,
            fluidTurbulence: 0.05,
            lightAngle: 1.1,
            lightElevation: 1.0,
            lightIntensity: 2.8,
            lightWarmth: 0.2,
            rimLightIntensity: 1.2,
            rimLightAngle: 0.4,
            causticIntensity: 2.8,
            causticDispersion: 0.4,
            ambientGlow: 0.2,
            lightSweepSpeed: 0.05,
            waterTint: 'SAPPHIRE_CYAN',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            faradayEffect: { enabled: true, min: 0.3, max: 0.9, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 1.8, max: 3.8, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightElevation: { enabled: true, min: 0.7, max: 1.6, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            force: { enabled: true, min: 1.0, max: 2.5, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "03 Golden Solar Caustics": {
        category: "Optics & Sunlight",
        config: {
            visualScale: 0.95,
            cameraPitch: 0.0,
            cameraYaw: -0.15,
            cameraZoom: 1.1,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.65,
            surfaceTension: 2.0,
            viscosity: 0.18,
            force: 1.6,
            faradayEffect: 0.3,
            harmonicOvertones: 0.7,
            fluidTurbulence: 0.0,
            lightAngle: 0.5,
            lightElevation: 1.3,
            lightIntensity: 3.2,
            lightWarmth: 0.85,
            rimLightIntensity: 1.5,
            rimLightAngle: -0.2,
            causticIntensity: 3.4,
            causticDispersion: 0.6,
            ambientGlow: 0.25,
            lightSweepSpeed: 0.02,
            waterTint: 'GOLDEN_AMBER',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticIntensity: { enabled: true, min: 1.8, max: 4.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 0.6, max: 2.2, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            harmonicOvertones: { enabled: true, min: 0.2, max: 1.5, amtBinaural: 1.0, mixMode: 'ADD' },
            force: { enabled: true, min: 1.0, max: 2.8, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "04 Liquid Mercury": {
        category: "Reflective Heavy Fluid",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: 0.35,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.9,
            surfaceTension: 3.5,
            viscosity: 0.05,
            force: 2.0,
            faradayEffect: 0.2,
            harmonicOvertones: 0.4,
            fluidTurbulence: 0.0,
            lightAngle: 0.7,
            lightElevation: 0.9,
            lightIntensity: 4.2,
            lightWarmth: -0.3,
            rimLightIntensity: 2.2,
            rimLightAngle: 0.5,
            causticIntensity: 0.4,
            causticDispersion: 0.1,
            ambientGlow: 0.0,
            lightSweepSpeed: 0.08,
            waterTint: 'MERCURY_SILVER',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            lightIntensity: { enabled: true, min: 2.5, max: 5.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 1.0, max: 3.2, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            force: { enabled: true, min: 1.0, max: 3.0, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' }
        }
    },
    "05 Bioluminescent Abyss": {
        category: "Deep Trance",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: -0.25,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.75,
            surfaceTension: 1.4,
            viscosity: 0.3,
            force: 1.5,
            faradayEffect: 0.5,
            harmonicOvertones: 0.3,
            fluidTurbulence: 0.1,
            lightAngle: 1.2,
            lightElevation: 1.1,
            lightIntensity: 1.8,
            lightWarmth: -0.7,
            rimLightIntensity: 1.8,
            rimLightAngle: 0.8,
            causticIntensity: 3.2,
            causticDispersion: 0.5,
            ambientGlow: 0.85,
            lightSweepSpeed: 0.03,
            waterTint: 'BIOLUMINESCENT_EMERALD',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            ambientGlow: { enabled: true, min: 0.3, max: 1.4, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            causticIntensity: { enabled: true, min: 1.5, max: 4.2, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            force: { enabled: true, min: 0.8, max: 2.4, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    "06 Ultraviolet Resonance": {
        category: "Fluorescent Acoustic",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: 0.1,
            cameraZoom: 1.02,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.8,
            surfaceTension: 1.8,
            viscosity: 0.12,
            force: 1.9,
            faradayEffect: 0.6,
            harmonicOvertones: 0.8,
            fluidTurbulence: 0.02,
            lightAngle: 2.1,
            lightElevation: 1.4,
            lightIntensity: 2.6,
            lightWarmth: -0.9,
            rimLightIntensity: 2.5,
            rimLightAngle: -0.5,
            causticIntensity: 3.5,
            causticDispersion: 0.8,
            ambientGlow: 0.6,
            lightSweepSpeed: 0.06,
            waterTint: 'ULTRAVIOLET_INDIGO',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticDispersion: { enabled: true, min: 0.3, max: 1.0, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 1.2, max: 3.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            ambientGlow: { enabled: true, min: 0.2, max: 0.9, amtBinaural: 1.0, mixMode: 'ADD' }
        }
    },
    "07 Sacred Solfeggio 528": {
        category: "Sacred Geometry",
        config: {
            visualScale: 0.92,
            cameraPitch: 0.0,
            cameraYaw: 0.0,
            cameraZoom: 1.05,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.7,
            surfaceTension: 2.0,
            viscosity: 0.12,
            force: 2.0,
            faradayEffect: 0.6,
            harmonicOvertones: 0.9,
            fluidTurbulence: 0.0,
            lightAngle: 0.9,
            lightElevation: 1.3,
            lightIntensity: 2.8,
            lightWarmth: 0.5,
            rimLightIntensity: 1.4,
            rimLightAngle: 0.2,
            causticIntensity: 3.0,
            causticDispersion: 0.45,
            ambientGlow: 0.3,
            lightSweepSpeed: 0.01,
            waterTint: 'SAPPHIRE_CYAN',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            harmonicOvertones: { enabled: true, min: 0.4, max: 1.8, amtBinaural: 1.0, mixMode: 'ADD' },
            lightWarmth: { enabled: true, min: 0.1, max: 0.9, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            surfaceTension: { enabled: true, min: 1.2, max: 3.0, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "08 Prismatic Dispersion": {
        category: "Optics & Sunlight",
        config: {
            visualScale: 0.92,
            cameraPitch: 0.0,
            cameraYaw: -0.3,
            cameraZoom: 1.05,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.75,
            surfaceTension: 1.6,
            viscosity: 0.14,
            force: 1.7,
            faradayEffect: 0.5,
            harmonicOvertones: 0.6,
            fluidTurbulence: 0.0,
            lightAngle: 1.4,
            lightElevation: 1.2,
            lightIntensity: 3.0,
            lightWarmth: 0.1,
            rimLightIntensity: 1.8,
            rimLightAngle: 0.6,
            causticIntensity: 3.6,
            causticDispersion: 1.0,
            ambientGlow: 0.2,
            lightSweepSpeed: 0.04,
            waterTint: 'PRISMATIC_OPAL',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            causticDispersion: { enabled: true, min: 0.4, max: 1.0, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            causticIntensity: { enabled: true, min: 2.0, max: 4.8, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 1.8, max: 3.8, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    "09 Moonlit Obsidian Basin": {
        category: "Nocturne & Calm",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: 0.45,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.8,
            surfaceTension: 2.2,
            viscosity: 0.25,
            force: 1.3,
            faradayEffect: 0.35,
            harmonicOvertones: 0.4,
            fluidTurbulence: 0.0,
            lightAngle: 3.14,
            lightElevation: 0.8,
            lightIntensity: 2.4,
            lightWarmth: -0.85,
            rimLightIntensity: 2.0,
            rimLightAngle: 0.0,
            causticIntensity: 2.0,
            causticDispersion: 0.2,
            ambientGlow: 0.15,
            lightSweepSpeed: 0.015,
            waterTint: 'DEIONIZED_PURE',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            lightIntensity: { enabled: true, min: 1.2, max: 3.0, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            surfaceTension: { enabled: true, min: 1.5, max: 2.8, amtBreath: 1.0, mixMode: 'ADD' }
        }
    },
    "10 Crimson Elixir": {
        category: "Alchemical Fluid",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: -0.2,
            cameraZoom: 1.0,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.8,
            surfaceTension: 1.9,
            viscosity: 0.22,
            force: 2.2,
            faradayEffect: 0.7,
            harmonicOvertones: 0.85,
            fluidTurbulence: 0.05,
            lightAngle: 0.6,
            lightElevation: 1.1,
            lightIntensity: 3.4,
            lightWarmth: 0.7,
            rimLightIntensity: 2.2,
            rimLightAngle: -0.4,
            causticIntensity: 3.2,
            causticDispersion: 0.35,
            ambientGlow: 0.5,
            lightSweepSpeed: 0.05,
            waterTint: 'ROSE_QUARTZ',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            ambientGlow: { enabled: true, min: 0.2, max: 0.85, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            rimLightIntensity: { enabled: true, min: 1.0, max: 3.0, amtBreath: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            force: { enabled: true, min: 1.2, max: 3.2, amtBreath: 1.0, mixMode: 'MULT' }
        }
    },
    "11 Sonic Plasma Dish": {
        category: "High-Energy Cyma",
        config: {
            visualScale: 0.95,
            cameraPitch: 0.0,
            cameraYaw: 0.3,
            cameraZoom: 1.08,
            dishRadius: 1.0,
            glassThickness: 0.06,
            meniscus: 0.9,
            surfaceTension: 1.1,
            viscosity: 0.06,
            force: 2.6,
            faradayEffect: 0.85,
            harmonicOvertones: 1.2,
            fluidTurbulence: 0.08,
            lightAngle: 1.8,
            lightElevation: 1.5,
            lightIntensity: 3.8,
            lightWarmth: -0.4,
            rimLightIntensity: 2.6,
            rimLightAngle: 0.7,
            causticIntensity: 4.2,
            causticDispersion: 0.7,
            ambientGlow: 0.45,
            lightSweepSpeed: 0.12,
            waterTint: 'SAPPHIRE_CYAN',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            faradayEffect: { enabled: true, min: 0.4, max: 1.0, amtBinaural: 1.0, mixMode: 'ADD', curve: 'EASE_IN_OUT' },
            lightIntensity: { enabled: true, min: 2.2, max: 4.8, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            causticIntensity: { enabled: true, min: 2.0, max: 5.5, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' }
        }
    },
    "12 Ethereal Nectar": {
        category: "Fluid & Ethereal",
        config: {
            visualScale: 0.9,
            cameraPitch: 0.0,
            cameraYaw: 0.0,
            cameraZoom: 1.02,
            dishRadius: 1.0,
            glassThickness: 0.05,
            meniscus: 0.7,
            surfaceTension: 2.5,
            viscosity: 0.35,
            force: 1.3,
            faradayEffect: 0.25,
            harmonicOvertones: 0.5,
            fluidTurbulence: 0.0,
            lightAngle: 0.75,
            lightElevation: 1.4,
            lightIntensity: 2.5,
            lightWarmth: 0.95,
            rimLightIntensity: 1.2,
            rimLightAngle: 0.1,
            causticIntensity: 2.6,
            causticDispersion: 0.3,
            ambientGlow: 0.4,
            lightSweepSpeed: 0.01,
            waterTint: 'GOLDEN_AMBER',
            masterOpacity: 1.0,
            blendMode: 'NORMAL'
        },
        modulations: {
            ambientGlow: { enabled: true, min: 0.15, max: 0.7, amtBreath: 1.0, mixMode: 'MULT', curve: 'EASE_IN_OUT' },
            lightElevation: { enabled: true, min: 0.9, max: 1.8, amtBreath: 1.0, mixMode: 'ADD', curve: 'SINE' },
            surfaceTension: { enabled: true, min: 1.6, max: 3.2, amtBreath: 1.0, mixMode: 'MULT' }
        }
    }
};

