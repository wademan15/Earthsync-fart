import { VisualizerPlugin } from './types/plugin';

// --- PLUGIN IMPORTS ---
import { Lens_Phyllotaxis } from './Lens_Phyllotaxis';
import { Lens_Cymatic } from './Lens_Cymatic';
import { Lens_Hydro } from './Lens_Hydro';
import { Lens_Aura } from './Lens_Aura';
import { Lens_3DTerrain } from './Lens_3DTerrain';
import { Lens_Stairway } from './Lens_Stairway';
import { Lens_NDE } from './Lens_NDE';
import { Lens_Torus } from './Lens_Torus';
import { Lens_FractalTree } from './Lens_FractalTree';
import { Lens_Ethereal } from './Lens_Ethereal';
import { Lens_LivingWind } from './Lens_LivingWind';
import { Lens_Holocymatic } from './Lens_Holocymatic';
import { Lens_VenusPentagram } from './Lens_VenusPentagram';
import { Lens_HarmonicLattice } from './Lens_HarmonicLattice';
import { Lens_GoldenSpiral } from './Lens_GoldenSpiral';
import { Lens_BinauralRipple } from './Lens_BinauralRipple';
import { Lens_FluidInterference } from './Lens_FluidInterference';
import { Lens_3DInterference } from './Lens_3DInterference';
import { Lens_Waveform } from './Lens_Waveform';
import { Lens_Sonoluminescence } from './Lens_Sonoluminescence';
import { Lens_Cymatic_WebGL } from './Lens_Cymatic_WebGL';
import { Lens_Phyllotaxis_WebGL } from './Lens_Phyllotaxis_WebGL';
import { Lens_Torus_WebGL } from './Lens_Torus_WebGL';
import { Lens_Aura_WebGL } from './Lens_Aura_WebGL';
import { Lens_NDE_WebGL } from './Lens_NDE_WebGL';
import { Lens_Waveform_WebGL } from './Lens_Waveform_WebGL';

export interface ControlDef {
    key: string; 
    label: string; 
    icon: string; 
    type?: string;
    options?: string[];
    min: number; 
    max: number; 
    step: number; 
    color: string;
    section: string;
}

// --- PLUGIN AGGREGATION ---
export const VISUALIZER_PLUGINS: Record<string, VisualizerPlugin> = {
    'TORUS': Lens_Torus,
    'PHYLLOTAXIS': Lens_Phyllotaxis,
    'CYMATIC': Lens_Cymatic,
    'GOLDEN_SPIRAL': Lens_GoldenSpiral,
    '3D_TERRAIN': Lens_3DTerrain,
    'STAIRWAY': Lens_Stairway,
    'HARMONIC_LATTICE': Lens_HarmonicLattice,
    'VENUS_PENTAGRAM': Lens_VenusPentagram,
    'HYDRO': Lens_Hydro,
    'AURA': Lens_Aura,
    'BINAURAL_RIPPLE': Lens_BinauralRipple,
    'HOLOCYMATIC': Lens_Holocymatic,
    'ETHEREAL': Lens_Ethereal,
    'LIVING_WIND': Lens_LivingWind,
    'FRACTAL_TREE': Lens_FractalTree,
    'NDE': Lens_NDE,
    'INTERFERENCE': Lens_3DInterference,
    'FLUID_INTERFERENCE': Lens_FluidInterference,
    'WAVEFORM': Lens_Waveform,
    'SONOLUMINESCENCE': Lens_Sonoluminescence,
    'CYMATIC_WEBGL': Lens_Cymatic_WebGL,
    'PHYLLOTAXIS_WEBGL': Lens_Phyllotaxis_WebGL,
    'TORUS_WEBGL': Lens_Torus_WebGL,
    'AURA_WEBGL': Lens_Aura_WebGL,
    'NDE_WEBGL': Lens_NDE_WebGL,
    'WAVEFORM_WEBGL': Lens_Waveform_WebGL,
};

// Backward compatibility alias for legacy presets/saved state without duplicating in VISUALIZER_MODES
Object.defineProperty(VISUALIZER_PLUGINS, '3D_INTERFERENCE', {
    value: Lens_3DInterference,
    enumerable: false,
    writable: true,
    configurable: true
});

export const VISUALIZER_MODES = Object.keys(VISUALIZER_PLUGINS);

export const getVisualizer = (mode: string): VisualizerPlugin => {
    if (mode === '3D_INTERFERENCE') return Lens_3DInterference;
    const plugin = VISUALIZER_PLUGINS[mode];
    if (!plugin) return Lens_Torus;
    return plugin;
};

export const getVisualizerControls = (mode: string): ControlDef[] => {
    const plugin = mode === '3D_INTERFERENCE' ? Lens_3DInterference : VISUALIZER_PLUGINS[mode];
    if (!plugin) return [];

    return plugin.parameters.map(p => ({
        key: p.id,
        label: p.label,
        icon: (p as any).icon || 'Activity',
        type: p.type,
        options: p.options,
        min: p.min ?? 0,
        max: p.max ?? 1,
        step: p.step ?? 0.01,
        color: p.color || '#fff',
        section: p.section as ControlDef['section']
    }));
};

export const getVisualizerPresets = (mode: string) => {
    const plugin = mode === '3D_INTERFERENCE' ? Lens_3DInterference : VISUALIZER_PLUGINS[mode];
    return plugin?.presets || [];
};
