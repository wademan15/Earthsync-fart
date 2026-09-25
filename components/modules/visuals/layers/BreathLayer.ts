import { RenderPipelineContext } from './pipelineTypes';
import { getPacerColors } from '../../../../services/audio/pacerStyles';

export const BreathLayer = {
    render: ({ ctx, w, h, layout, state, data }: RenderPipelineContext) => {
        if (!data.isBreathActive || !data.breathConfig || data.breathConfig.visualMode === 'NONE') return;

        const { pacer } = layout;
        const { breathPhase, breathRadius, now } = state;
        const mode = data.breathConfig.visualMode;
        
        const pacerColors = getPacerColors(data.breathConfig?.colorScheme, data.breathConfig?.customColor);
        let color = pacerColors.accent || data.themeColors?.primary || '#ffffff';
        if (breathPhase === 'INHALE') color = pacerColors.inhale; 
        else if (breathPhase === 'HOLD_IN') color = pacerColors.holdIn; 
        else if (breathPhase === 'EXHALE') color = pacerColors.exhale; 
        else if (breathPhase === 'HOLD_OUT') color = pacerColors.holdOut; 

        ctx.save();

        if (mode === 'HORIZON') {
            const level = h - (h * breathRadius);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, level, w, h - level);
            ctx.beginPath(); 
            ctx.moveTo(0, level); 
            ctx.lineTo(w, level);
            ctx.strokeStyle = color; 
            ctx.lineWidth = 2; 
            ctx.globalAlpha = 0.8; 
            ctx.stroke();
        } else if (mode === 'VIGNETTE') {
            const ringMaxR = Math.max(w, h) * 0.6;
            const innerR = ringMaxR * (1.0 - (breathRadius * 0.3)); 
            const grad = ctx.createRadialGradient(w/2, h/2, innerR * 0.5, w/2, h/2, innerR);
            grad.addColorStop(0, 'rgba(0,0,0,0)'); 
            grad.addColorStop(0.8, color); 
            grad.addColorStop(1, 'rgba(0,0,0,0)'); 
            ctx.fillStyle = grad; 
            ctx.globalAlpha = 0.4 * breathRadius; 
            ctx.fillRect(0, 0, w, h);
        } else {
            const pCx = (w / 2) + (w * pacer.x);
            const pCy = (h / 2) - (h * pacer.y);
            ctx.translate(pCx, pCy);
            ctx.scale(pacer.scale, pacer.scale);
            
            const baseDimension = Math.min(w, h);
            const isSmallScreen = w < 600;
            const ringMaxR = (baseDimension / 2) * (isSmallScreen ? 0.95 : 0.85);
            const minR = isSmallScreen ? 38 : 50;
            const currentR = minR + (breathRadius * (ringMaxR - minR));

            if (mode === 'RING') {
                ctx.beginPath(); 
                ctx.arc(0, 0, currentR, 0, Math.PI * 2); 
                ctx.strokeStyle = color; 
                ctx.lineWidth = 2 + (breathRadius * 4); 
                ctx.shadowBlur = 10 * breathRadius; 
                ctx.shadowColor = color; 
                ctx.stroke();
            } else if (mode === 'GLOW') {
                const glowR = currentR * 1.2;
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
                grad.addColorStop(0, color); 
                grad.addColorStop(0.4, 'rgba(0,0,0,0.5)'); 
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad; 
                ctx.globalAlpha = 0.6 * breathRadius;
                ctx.beginPath(); 
                ctx.arc(0, 0, glowR, 0, Math.PI * 2); 
                ctx.fill();
            } else if (mode === 'DOT') {
                const dotSize = 10 + (breathRadius * 5); 
                ctx.fillStyle = color; 
                ctx.shadowBlur = 15 * breathRadius; 
                ctx.shadowColor = color;
                ctx.globalAlpha = 0.8 + (breathRadius * 0.2);
                ctx.beginPath(); 
                ctx.arc(0, 0, dotSize, 0, Math.PI * 2); 
                ctx.fill();
            } else if (mode === 'CHEVRON') {
                const size = 40 + (breathRadius * 20);
                const yOff = size * 0.5;
                ctx.beginPath(); 
                ctx.lineWidth = 4; 
                ctx.lineCap = 'round'; 
                ctx.strokeStyle = color; 
                ctx.shadowBlur = 10; 
                ctx.shadowColor = color;
                if (breathPhase === 'INHALE' || breathPhase === 'HOLD_IN') { 
                    ctx.moveTo(-size, yOff); ctx.lineTo(0, -yOff); ctx.lineTo(size, yOff); 
                } else { 
                    ctx.moveTo(-size, -yOff); ctx.lineTo(0, yOff); ctx.lineTo(size, -yOff); 
                }
                const isHold = breathPhase.includes('HOLD');
                ctx.globalAlpha = isHold ? 0.5 + (Math.sin(now * 10) * 0.2) : 1.0;
                ctx.stroke();
            }
        }
        ctx.restore();
    }
};