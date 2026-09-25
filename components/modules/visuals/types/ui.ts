export interface ModulationNode {
  enabled: boolean; 
  min: number; 
  max: number;
  amtBreath: number; 
  amtBinaural: number; 
  amtPulse?: number; 
  amtHr?: number; 
  amtCoh: number;
  amtHeart?: number;
  mixMode?: 'ADD' | 'MULT'; 
  linkBreathBinaural?: boolean;
  curve?: 'LINEAR' | 'EXPONENTIAL' | 'EASE_IN_OUT'; 
  inertia?: number;
  breathMode?: 'DEFAULT' | 'INVERT' | 'ONLY_HOLD' | 'ONLY_EXHALE' | 'INVERT_ON_HOLD' | 'PULSE_ON_HOLD';
  binauralHarmonic?: number; 
}

export class VisualizerBus {
    listeners: Set<(config: any) => void> = new Set();
    emit(config: any) { this.listeners.forEach(cb => cb(config)); }
    subscribe(cb: (config: any) => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
}

export interface VisualizerTelemetry { 
    analysers: { left: AnalyserNode; right: AnalyserNode; }; 
}