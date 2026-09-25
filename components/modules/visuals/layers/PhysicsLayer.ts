import { RenderPipelineContext } from './pipelineTypes';
import { VISUALIZER_PLUGINS } from '../VisualizerRegistry';

export const PhysicsLayer = {
    render: (context: RenderPipelineContext) => {
        const { ctx, w, h, layout, state, data, lensContext } = context;
        const { mandala } = layout;
        
        const mCx = (w / 2) + (w * mandala.x); 
        const mCy = (h / 2) - (h * mandala.y);
        
        const activeMode = data.activePhysicsMode || 'BIO-BLOOM';
        const plugin = VISUALIZER_PLUGINS[activeMode];
        
        if (!plugin) return; 
        
        // --- THE WEBGL FIX ---
        // Do not return early! Route the call to the WebGL plugin so it can execute.
        // WebGL visualizers handle their own zooming and panning via GLSL uniforms, 
        // so we bypass the 2D context matrix transformations entirely.
        if (plugin.renderType === 'WEBGL') {
            try {
                plugin.render(lensContext, state.effectiveConfig);
            } catch (e) {
                console.error(`[WebGL Cartridge Crash] ${plugin.id}:`, e);
            }
            return; // Exit after WebGL render so we don't apply 2D transforms below
        }
        
        // --- 2D CANVAS ROUTING ---
        ctx.save();
        
        const userZoom = (lensContext.visualScale as number) ?? 1.0;
        const finalScale = mandala.scale * userZoom;
        ctx.globalAlpha = state.effectiveConfig?.masterOpacity ?? 1.0;
        
        try {
            // Standardizing 2D: We translate the context to the calculated visual center
            // and pass cx: 0, cy: 0 to the plugins. This ensures that any plugin
            // drawing relative to cx/cy will be centered at the universal dot.
            ctx.translate(mCx, mCy);
            ctx.scale(finalScale, finalScale);
            
            const safeLocalContext = { 
                ...lensContext, 
                cx: 0, 
                cy: 0 
            };
            
            // Legacy plugins might have additional internal translations, 
            // so we handle them the same way as modern 2D plugins for consistency.
            plugin.render(safeLocalContext, state.effectiveConfig);
        } catch (e) {
            console.error(`[2D Cartridge Crash] ${plugin.id}:`, e);
        }

        ctx.restore();
    }
};