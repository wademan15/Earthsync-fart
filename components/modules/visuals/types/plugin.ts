import { ModulationNode } from '../shared';

// ADDED: 'COLOR' picker type
export type VisualizerUIType = 'SLIDER' | 'TOGGLE' | 'SELECT' | 'CUSTOM_TOGGLE' | 'COLOR';

export interface VisualizerParameter {
    id: string;
    label: string;
    type: VisualizerUIType;
    // CHANGED: Removed the hardcoded literal union. Now accepts any string category dynamically.
    section: string; 
    icon?: string; 
    min?: number; 
    max?: number; 
    step?: number;
    color?: string; 
    options?: string[]; 
    defaultValue: number | boolean | string;
}

export interface VisualizerPreset {
    id: string;
    name: string;
    config: Record<string, unknown>;
    modulations?: Record<string, ModulationNode>;
}

export interface VisualizerPlugin {
    id: string;
    name: string;
    renderType: 'CANVAS_2D' | 'WEBGL';
    isLegacy?: boolean; 
    parameters: VisualizerParameter[];
    defaultConfig: Record<string, unknown>;
    presets: VisualizerPreset[];
    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => void; 
    cleanup?: (context: { gl: WebGL2RenderingContext | WebGLRenderingContext | null, memory: Record<string, unknown> }) => void;
}