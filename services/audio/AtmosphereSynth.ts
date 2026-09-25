import { AudioGraph, AudioPayload } from './AudioTypes';
import { generateImpulseResponse } from './AudioGraphBuilder';

export const tickAtmosphere = (graph: AudioGraph, payload: AudioPayload, t: number, resolveParam: Function, memory: any = {}) => {
    memory.atmos = memory.atmos || {};
    const mem = memory.atmos;

    // =========================================================================
    // 1. ZEN SPACE REVERB (Calibrated safe non-extreme ambient diffusion)
    // =========================================================================
    if (graph.reverbGain && payload.reverbConfig) {
        // Enforce Zen-promoting wetness ceiling (0.0 to 0.50 max) so direct signal is never submerged
        const rawWet = typeof payload.reverbConfig.wetness === 'number' ? payload.reverbConfig.wetness : 0.2;
        const safeWet = Math.max(0, Math.min(0.50, rawWet));
        const fWet = resolveParam('reverbWetness', safeWet);

        if (Math.abs(fWet - (mem.fWet || -1)) > 0.005) {
            graph.reverbGain.gain.setTargetAtTime(fWet, t, 0.1);
            mem.fWet = fWet;
        }

        // Live Reverb Impulse Update on Decay Time Change (Zen range: 1.0s - 4.5s)
        const targetDecay = Math.max(1.0, Math.min(4.5, payload.reverbConfig.decay || 2.5));
        if (graph.reverbNode && Math.abs(targetDecay - (mem.decay || -1)) > 0.15) {
            try {
                graph.reverbNode.buffer = generateImpulseResponse(graph.ctx, { ...payload.reverbConfig, decay: targetDecay });
                mem.decay = targetDecay;
            } catch {
                // Buffer reassignment guard
            }
        }
    }

    // =========================================================================
    // 2. ZEN STEREO DELAY & ECHO (Calibrated safe reflections, zero runaway feedback)
    // =========================================================================
    if (graph.delayGain && graph.delayNode && graph.delayFeedback && payload.delayConfig) {
        // Zen delay time range: 150ms to 750ms (prevents metallic comb flutter <100ms and arrhythmic drag >1.2s)
        const rawTime = typeof payload.delayConfig.time === 'number' ? payload.delayConfig.time : 0.4;
        const safeTime = Math.max(0.15, Math.min(0.75, rawTime));
        const dTime = resolveParam('delayTime', safeTime);

        // Zen feedback ceiling: max 0.45 (physically guarantees zero runaway oscillation / screech)
        const rawFeed = typeof payload.delayConfig.feedback === 'number' ? payload.delayConfig.feedback : 0.2;
        const safeFeed = Math.max(0, Math.min(0.45, rawFeed));
        const dFeed = resolveParam('delayFeedback', safeFeed);

        // Zen echo wetness ceiling: max 0.35 (keeps echoes gentle and atmospheric)
        const rawWet = typeof payload.delayConfig.wetness === 'number' ? payload.delayConfig.wetness : 0.0;
        const safeWet = Math.max(0, Math.min(0.35, rawWet));
        const dWet = resolveParam('delayWetness', safeWet);
        
        if (Math.abs(dTime - (mem.dTime || -1)) > 0.005) {
            graph.delayNode.delayTime.setTargetAtTime(dTime, t, 0.1);
            mem.dTime = dTime;
        }

        if (Math.abs(dFeed - (mem.dFeed || -1)) > 0.005) {
            graph.delayFeedback.gain.setTargetAtTime(dFeed, t, 0.1);
            mem.dFeed = dFeed;
        }

        if (Math.abs(dWet - (mem.dWet || -1)) > 0.005) {
            graph.delayGain.gain.setTargetAtTime(dWet, t, 0.1);
            mem.dWet = dWet;
        }
    }
};