import { LatticeGlobalConfig, LensContext, FeedbackConfig } from '../shared';
import { LayoutConfig } from '../../VisualizerCanvas';

export interface RenderState {
    breathRadius: number;
    breathPhase: string;
    smoothedCoherence: number;
    bpm: number;
    effectiveConfig: LatticeGlobalConfig;
    now: number;
    dt: number;
}

export interface RenderData {
    themeColors: { primary: string; secondary: string; };
    heartHarmonicVols: number[];
    heartHarmonicMutes: boolean[];
    stackMutes: Record<string, boolean>;
    activePhysicsMode: string;
    breathConfig: any;
    isBreathActive: boolean;
    immersionConfig: any;
    aetherConfig: any;
    snakeConfig: any;
    binauralFreqs: Record<string, number>;
    sensorMode: any;
    latticeMode: any;
    isFeedbackActive: boolean;
    feedbackConfig: FeedbackConfig;
}

export interface RenderPipelineContext {
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
    layout: LayoutConfig;
    state: RenderState;
    data: RenderData;
    lensContext: LensContext;
}