import { RenderPipelineContext } from './pipelineTypes';
import { evaluateTimeCrystalPulse, TimeCrystalTopology } from '../../../../services/kinematics/timeCrystal';

function hexToRgb(hex: string, defaultRgb = { r: 6, g: 182, b: 212 }): { r: number; g: number; b: number } {
    if (!hex || typeof hex !== 'string') return defaultRgb;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        return {
            r: parseInt(cleanHex[0] + cleanHex[0], 16),
            g: parseInt(cleanHex[1] + cleanHex[1], 16),
            b: parseInt(cleanHex[2] + cleanHex[2], 16)
        };
    }
    if (cleanHex.length >= 6) {
        return {
            r: parseInt(cleanHex.substring(0, 2), 16),
            g: parseInt(cleanHex.substring(2, 4), 16),
            b: parseInt(cleanHex.substring(4, 6), 16)
        };
    }
    return defaultRgb;
}

export const PostProcessLayer = {
    render: (context: RenderPipelineContext) => {
        const { ctx, w, h, data, state } = context;
        
        // Visual photic pulsing is strictly driven by the dedicated visual Pulse toggle (isFeedbackActive)
        const isPulseActive = Boolean(data.isFeedbackActive);
        
        if (!isPulseActive) return;

        const audioBeatFreq = (data.binauralFreqs && data.binauralFreqs['UNIVERSAL']) ? data.binauralFreqs['UNIVERSAL'] : 7.83;
        const time = state.now;
        const feedback = data.feedbackConfig || {};
        const pulseStyle = feedback.pulseStyle || 'BLACK_SHUTTER';
        const waveform = feedback.pulseWaveform || (pulseStyle === 'STROBE_FLASH' ? 'STROBE' : 'SINE');
        const depth = typeof feedback.depth === 'number' ? feedback.depth : (feedback.pulseDepth ?? 0.85);

        // Calculate active frequency: if uncoupled, use customRateHz (defaults to 7.83 if not set), otherwise track audio beat frequency
        const isUncoupled = Boolean(feedback.isUncoupled);
        const beatFreq = isUncoupled 
            ? (typeof feedback.customRateHz === 'number' ? Math.max(0.1, feedback.customRateHz) : 7.83)
            : audioBeatFreq;

        // Calculate wave modulation normalized from 0.0 to 1.0
        // Check if Time Crystal synchronization is active
        const isTimeCrystalSync = Boolean(
            feedback.pulseSync === 'TIME_CRYSTAL' || 
            feedback.syncWithTimeCrystal
        );

        let normalizedPulse = 0;

        if (isTimeCrystalSync) {
            // When uncoupled or custom topology is provided in visual feedbackConfig, use that distinct topology;
            // otherwise fallback to immersionConfig's topology or FIBONACCI
            const tcTopology = (feedback.timeCrystalTopology || (isUncoupled ? 'FIBONACCI' : (data.immersionConfig?.timeCrystalTopology || 'FIBONACCI'))) as TimeCrystalTopology;
            normalizedPulse = evaluateTimeCrystalPulse(time, beatFreq, tcTopology, waveform);
        } else {
            const phase = (time * beatFreq) % 1.0;

            if (waveform === 'STROBE') {
                normalizedPulse = phase < 0.5 ? 1.0 : 0.0;
            } else if (waveform === 'TRIANGLE') {
                normalizedPulse = phase < 0.5 ? phase * 2 : 2 - phase * 2;
            } else if (waveform === 'HEARTBEAT') {
                const p1 = Math.max(0, 1.0 - Math.abs(phase - 0.15) / 0.12);
                const p2 = Math.max(0, 1.0 - Math.abs(phase - 0.38) / 0.12) * 0.7;
                normalizedPulse = Math.max(p1, p2);
            } else {
                // SINE
                const pulsePhase = Math.sin(time * Math.PI * 2 * beatFreq);
                normalizedPulse = (pulsePhase + 1) / 2;
            }
        }

        ctx.save();

        switch (pulseStyle) {
            case 'WHITE_BLOOM': {
                const bloomOpacity = normalizedPulse * depth * 0.9;
                if (bloomOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(255, 255, 255, ${bloomOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'INVERT_NEGATIVE': {
                const invertOpacity = (pulseStyle === 'STROBE_FLASH' ? normalizedPulse : normalizedPulse) * depth;
                if (invertOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'difference';
                    ctx.fillStyle = `rgba(255, 255, 255, ${invertOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'CYAN_AURA': {
                const cyanOpacity = normalizedPulse * depth * 0.85;
                if (cyanOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(6, 182, 212, ${cyanOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'SOLAR_GOLD': {
                const goldOpacity = normalizedPulse * depth * 0.85;
                if (goldOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(234, 179, 8, ${goldOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'VIOLET_CROWN': {
                const violetOpacity = normalizedPulse * depth * 0.85;
                if (violetOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(168, 85, 247, ${violetOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'ROSE_HEART': {
                const roseOpacity = normalizedPulse * depth * 0.85;
                if (roseOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(244, 63, 94, ${roseOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'EMERALD_LIFE': {
                const emeraldOpacity = normalizedPulse * depth * 0.85;
                if (emeraldOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(16, 185, 129, ${emeraldOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'RAINBOW_CHROMA': {
                const chromaOpacity = normalizedPulse * depth * 0.8;
                if (chromaOpacity > 0.01) {
                    const hue = Math.floor((time * beatFreq * 50 + normalizedPulse * 90) % 360);
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${chromaOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'RADIAL_IRIS': {
                const maxR = Math.hypot(w, h) / 2;
                const irisRadius = maxR * (0.25 + 0.65 * normalizedPulse);
                const irisGrad = ctx.createRadialGradient(w / 2, h / 2, irisRadius * 0.35, w / 2, h / 2, maxR);
                irisGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                irisGrad.addColorStop(0.7, `rgba(0, 0, 0, ${(depth * (1.0 - normalizedPulse * 0.6)).toFixed(3)})`);
                irisGrad.addColorStop(1, `rgba(0, 0, 0, ${depth.toFixed(3)})`);
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = irisGrad;
                ctx.fillRect(0, 0, w, h);
                break;
            }

            case 'CUSTOM_COLOR': {
                const customHex = feedback.pulseCustomColor || '#06b6d4';
                const rgb = hexToRgb(customHex);
                const customOpacity = normalizedPulse * depth * 0.85;
                if (customOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${customOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }

            case 'BLACK_SHUTTER':
            default: {
                // Attenuation depth: black out/dim the frame at the trough of each beat pulse
                const dimOpacity = (1.0 - normalizedPulse) * depth;
                if (dimOpacity > 0.01) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = `rgba(0, 0, 0, ${dimOpacity.toFixed(3)})`;
                    ctx.fillRect(0, 0, w, h);
                }
                break;
            }
        }

        ctx.restore();
    }
};
