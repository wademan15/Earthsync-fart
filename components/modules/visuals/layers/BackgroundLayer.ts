import { RenderPipelineContext } from './pipelineTypes';

export const BackgroundLayer = {
    render: ({ ctx, w, h, state, lensContext }: RenderPipelineContext) => {
        // THE WEBGL FIX:
        // If the bottom GL canvas is running, we MUST NOT paint a black box 
        // on the top 2D canvas, or it will completely occlude the visualizer.
        if (lensContext?.isWebGL) return;

        ctx.save();
        
        // Remove any rogue setTransform matrices that might break DPR
        const trails = state.effectiveConfig?.orbitalTrails ?? 0.2;
        const fadeOpacity = 1.0 - (trails * 0.9);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = isNaN(fadeOpacity) ? 'rgba(0,0,0,0.8)' : `rgba(0, 0, 0, ${fadeOpacity})`; 
        
        // THE OFF-SCREEN FIX:
        // By starting off-screen (-w, -h) and drawing a massive box (w*3, h*3), 
        // we guarantee the entire physical canvas is cleared even on DPR=3 retina screens
        // if a rogue matrix transform occurs, preventing the "Quadrant of Death" color inversion.
        ctx.fillRect(-w, -h, w * 3, h * 3); 
        
        ctx.restore();
    }
};