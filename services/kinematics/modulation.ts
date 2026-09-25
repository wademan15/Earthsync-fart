import { ModulationNode } from '../../components/modules/visuals/types/ui';
import { evaluateTimeCrystal } from './timeCrystal';

/**
 * The Core Fluid Router / LFO Engine. Resolves a target parameter based on the user's modulation matrix.
 * Strictly calculates only visible modulations present in the user interface (Breath, Binaural, Pulse/HR, Coherence).
 */
export const resolveModulation = (
    key: string,
    baseVal: number,
    mod: ModulationNode | undefined,
    ctx: {
        now: number;
        dt: number;
        breathRadius: number;
        breathPhase: string;
        sigBinaural: number;
        sigHR: number;
        smoothedCoh: number;
        sigAudio: number;
        sigHeart?: number;
        macroA: number;
        macroB: number;
        visualBeat: number;
        binauralBreathLinked: boolean;
        isFeedbackActive: boolean;
        timeCrystalMode?: string;
    },
    memory: Record<string, unknown>
): number => {
    if (!mod || !mod.enabled) return baseVal;

    const mem = memory as Record<string, Record<string, { currentVal: number }>>;
    if (!mem.modState) mem.modState = {};
    if (!mem.modState[key]) mem.modState[key] = { currentVal: baseVal };
    const state = mem.modState[key];

    // 1. Breath Hold / Phase Logic
    let effectiveBreath = ctx.breathRadius;
    if (mod.breathMode === 'INVERT' || mod.breathMode === 'INVERT_ON_HOLD') {
        if (ctx.breathPhase && ctx.breathPhase.includes('HOLD')) {
            effectiveBreath = 1.0 - effectiveBreath;
        } else if (mod.breathMode === 'INVERT') {
            effectiveBreath = 1.0 - effectiveBreath;
        }
    } else if (mod.breathMode === 'ONLY_HOLD' && ctx.breathPhase) {
        effectiveBreath = ctx.breathPhase.includes('HOLD') ? 1.0 : 0.0;
    } else if (mod.breathMode === 'ONLY_EXHALE' && ctx.breathPhase) {
        effectiveBreath = ctx.breathPhase.includes('EXHALE') ? effectiveBreath : 0.0;
    } else if (mod.breathMode === 'PULSE_ON_HOLD' && ctx.breathPhase && ctx.breathPhase.includes('HOLD')) {
        effectiveBreath = (Math.sin(ctx.now * Math.PI * 8) + 1) / 2;
    }

    // 2. Binaural Signal (Phase-Locked Carrier)
    const harmonic = mod.binauralHarmonic || 1.0;
    let modBinSignal = 0;
    
    if (ctx.timeCrystalMode && ctx.timeCrystalMode !== 'NONE') {
        // Evaluate Fibonacci Sequence instantly scaled to the user's harmonic selection
        modBinSignal = evaluateTimeCrystal(ctx.now, ctx.visualBeat * harmonic);
    } else {
        // Standard Pure Phase-Locked Binaural Sine Wave with smooth cosine windowing
        const rawPhase = ctx.now * ctx.visualBeat * harmonic * Math.PI * 2;
        modBinSignal = (Math.sin(rawPhase) + 1) * 0.5;
    }

    if (mod.linkBreathBinaural) {
        modBinSignal *= effectiveBreath;
    }

    // 3. Matrix Weights strictly from visible UI: Breath, Binaural, Pulse (HR), Coherence, Heartbeat
    const aBreath = mod.amtBreath || 0;
    const aBin = mod.amtBinaural || 0;
    const aHr = (mod.amtPulse !== undefined ? mod.amtPulse : mod.amtHr) || 0;
    const aCoh = mod.amtCoh || 0;
    const aHeart = mod.amtHeart || 0;
    const sigHeart = ctx.sigHeart || 0;

    const getBipolar = (sig: number, amt: number) => amt < 0 ? (1.0 - sig) : sig;

    let driver = 0;
    let totalWeights = 0;

    // 4. Mix Mode Enforcement
    if (mod.mixMode === 'MULT') {
        let mult = 1.0;
        if (aBreath !== 0) mult *= (1.0 - Math.abs(aBreath)) + (getBipolar(effectiveBreath, aBreath) * Math.abs(aBreath));
        if (aBin !== 0) mult *= (1.0 - Math.abs(aBin)) + (getBipolar(modBinSignal, aBin) * Math.abs(aBin));
        if (aHr !== 0) mult *= (1.0 - Math.abs(aHr)) + (getBipolar(ctx.sigHR, aHr) * Math.abs(aHr));
        if (aCoh !== 0) mult *= (1.0 - Math.abs(aCoh)) + (getBipolar(ctx.smoothedCoh, aCoh) * Math.abs(aCoh));
        if (aHeart !== 0) mult *= (1.0 - Math.abs(aHeart)) + (getBipolar(sigHeart, aHeart) * Math.abs(aHeart));
        driver = mult;
    } else {
        if (aBreath !== 0) { driver += getBipolar(effectiveBreath, aBreath) * Math.abs(aBreath); totalWeights += Math.abs(aBreath); }
        if (aBin !== 0) { driver += getBipolar(modBinSignal, aBin) * Math.abs(aBin); totalWeights += Math.abs(aBin); }
        if (aHr !== 0) { driver += getBipolar(ctx.sigHR, aHr) * Math.abs(aHr); totalWeights += Math.abs(aHr); }
        if (aCoh !== 0) { driver += getBipolar(ctx.smoothedCoh, aCoh) * Math.abs(aCoh); totalWeights += Math.abs(aCoh); }
        if (aHeart !== 0) { driver += getBipolar(sigHeart, aHeart) * Math.abs(aHeart); totalWeights += Math.abs(aHeart); }

        if (totalWeights > 0) driver = driver / totalWeights;
    }

    driver = Math.max(0, Math.min(1, driver));

    // 5. Output Curve (Expressive & Musical, avoids hair-trigger spazzing)
    let shapedDriver = driver;
    if (mod.curve === 'EXPONENTIAL') {
        shapedDriver = Math.pow(driver, 1.8);
    } else if (mod.curve === 'EASE_IN_OUT') {
        shapedDriver = driver * driver * (3.0 - 2.0 * driver);
    }

    const targetVal = mod.min + (mod.max - mod.min) * shapedDriver;

    // 6. Output Inertia (Glide)
    const inertia = mod.inertia !== undefined ? Math.max(0, Math.min(1, mod.inertia)) : 0.4;
    if (inertia > 0.01) {
        const isRising = targetVal > state.currentVal;
        const baseTau = 0.015 + inertia * 0.265;
        const tau = isRising ? baseTau * 0.8 : baseTau * 1.2;
        const alpha = 1.0 - Math.exp(-ctx.dt / Math.max(0.005, tau));
        state.currentVal += (targetVal - state.currentVal) * alpha;
        return state.currentVal;
    }

    state.currentVal = targetVal;
    return targetVal;
};