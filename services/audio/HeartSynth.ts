import { AudioGraph, AudioPayload, KickConfig, ChannelMemory } from './AudioTypes';

interface HeartPacerMemory {
    nextBeatTime: number;
    beatIndex: number;
    isRunning: boolean;
    lastSyncMode?: string;
    lastScheduledAudioTime?: number;
    scheduledBeatKeys?: Set<string>;
}

const LOOKAHEAD = 0.150; // 150ms lookahead

export const renderCardiacStroke = (
    graph: AudioGraph,
    time: number,
    vol: number,
    kickCfg: KickConfig,
    phase: string = 'IDLE',
    isSecondary: boolean = false
) => {
    const ctx = graph.ctx;
    if (!ctx || vol <= 0.001) return;

    try {
        const baseFreq = kickCfg.baseFreq ?? kickCfg.freq ?? 52;
        const pitchStart = kickCfg.pitchStart ?? (isSecondary ? 95 : 145);
        const pitchDecay = Math.max(0.02, kickCfg.pitchDecay ?? 0.07);
        const ampAttack = Math.max(0.004, kickCfg.ampAttack ?? 0.008);
        const ampDecay = Math.max(0.12, (kickCfg.ampDecay ?? kickCfg.decay ?? 0.38) * (isSecondary ? 0.65 : 1.0));
        const clickLevel = kickCfg.clickLevel ?? 0.25;
        const saturation = kickCfg.saturation ?? 30;
        
        // Parasympathetic Respiratory Filter Tuning:
        // Exhale and hold phases deepen the low-pass filter to sound darker and warmer
        let lpfBase = kickCfg.lpfCutoff ?? (isSecondary ? 280 : 220);
        if (phase === 'EXHALE' || phase === 'HOLD_OUT') {
            lpfBase = Math.max(120, lpfBase * 0.85);
        } else if (phase === 'INHALE') {
            lpfBase = lpfBase * 1.2;
        }

        // 1. Primary Low-Frequency Chest Resonance (Deep Body)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(lpfBase, time);
        filter.Q.setValueAtTime(1.5, time);

        osc.type = (kickCfg.waveType === 'triangle' || kickCfg.type === 'TRIANGLE') ? 'triangle' : 'sine';

        const startPitch = isSecondary ? startPitchSecondary(baseFreq) : Math.max(baseFreq * 1.8, pitchStart);
        const targetPitch = isSecondary ? baseFreq * 0.88 : baseFreq;

        osc.frequency.setValueAtTime(startPitch, time);
        osc.frequency.exponentialRampToValueAtTime(Math.max(25, targetPitch), time + pitchDecay);

        const strokeGain = vol * (isSecondary ? 0.45 : 1.0) * (1.0 + saturation / 100);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(Math.max(0.001, strokeGain), time + ampAttack);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + ampDecay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(graph.masterGain);

        // 2. Mid-Frequency Punch Oscillator (Ensures high acoustic presence across laptop & phone speakers)
        const midOsc = ctx.createOscillator();
        const midGain = ctx.createGain();
        const midFilter = ctx.createBiquadFilter();
        
        midFilter.type = 'bandpass';
        midFilter.frequency.setValueAtTime(isSecondary ? 140 : 180, time);
        midFilter.Q.setValueAtTime(1.2, time);

        midOsc.type = 'triangle';
        midOsc.frequency.setValueAtTime(isSecondary ? 120 : 160, time);
        midOsc.frequency.exponentialRampToValueAtTime(isSecondary ? 65 : 85, time + 0.06);

        const midStrokeGain = strokeGain * 0.90;
        midGain.gain.setValueAtTime(0.0001, time);
        midGain.gain.linearRampToValueAtTime(Math.max(0.001, midStrokeGain), time + 0.006);
        midGain.gain.exponentialRampToValueAtTime(0.0001, time + ampDecay * 0.7);

        midOsc.connect(midFilter);
        midFilter.connect(midGain);
        midGain.connect(graph.masterGain);

        // 3. Subtle Organic Valve Transient Click / Tap for anatomical realism
        if (clickLevel > 0.01) {
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            clickOsc.type = 'triangle';
            clickOsc.frequency.setValueAtTime(isSecondary ? 280 : 380, time);
            clickOsc.frequency.exponentialRampToValueAtTime(50, time + 0.02);
            
            const clickGainVal = strokeGain * clickLevel * (isSecondary ? 0.35 : 0.6);
            clickGain.gain.setValueAtTime(0.0001, time);
            clickGain.gain.linearRampToValueAtTime(Math.max(0.001, clickGainVal), time + 0.002);
            clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
            
            clickOsc.connect(clickGain);
            clickGain.connect(graph.masterGain);
            clickOsc.start(time);
            clickOsc.stop(time + 0.03);
        }

        osc.start(time);
        osc.stop(time + ampDecay + 0.05);

        midOsc.start(time);
        midOsc.stop(time + ampDecay + 0.05);
    } catch {
        // Safe fallback for context scheduling edge-cases
    }
};

const startPitchSecondary = (base: number) => Math.max(35, base * 1.3);

export const getCardiacInterval = (
    kickCfg: KickConfig | undefined,
    payload: {
        bpm?: number;
        binauralFreqs?: Record<string, number>;
        isBreathActive?: boolean;
        breathPhase?: string;
        heartSyncMode?: 'BREATH' | 'BREATH_COUNT' | 'BINAURAL' | 'STEADY';
    }
): number => {
    const config = kickCfg || { syncMode: 'BREATH', doubleBeat: true, bpm: 60 };
    const syncMode = config.syncMode || payload.heartSyncMode || 'BREATH';
    
    // Exact 1-second breath cadence sync mode
    if (syncMode === 'BREATH_COUNT' || Boolean(config.syncToSeconds)) {
        return 1.0; // 1 beat per second
    }

    const baseBpm = Math.max(30, Math.min(180, config.bpm || payload.bpm || 60));
    const baseInterval = 60 / baseBpm;

    if (syncMode === 'BINAURAL') {
        const bFreq = Math.max(0.1, payload.binauralFreqs?.['UNIVERSAL'] ?? payload.binauralFreqs?.['HEART'] ?? 8.0);
        // Frequency-coupled physiological intervals:
        // Delta (0.1 - 3.5 Hz): 1 beat every 1 cycle (e.g. 1.0Hz -> 1.0s / 60 BPM, 1.25Hz -> 0.8s / 75 BPM)
        // Theta (3.5 - 7.5 Hz): Subharmonic 4:1 (e.g. 4.0Hz -> 1.0s / 60 BPM, 5.0Hz -> 0.8s / 75 BPM, 6.0Hz -> 0.67s / 90 BPM)
        // Alpha / Schumann (7.5 - 14 Hz): Subharmonic 8:1 (e.g. 7.83Hz -> 1.02s / 58.7 BPM, 8.0Hz -> 1.0s / 60 BPM, 10.0Hz -> 0.8s / 75 BPM)
        // Beta / Gamma (14 - 50 Hz): Subharmonic 16:1 or 32:1
        let divisor = 1;
        if (bFreq < 3.5) {
            divisor = 1;
        } else if (bFreq < 7.5) {
            divisor = 4;
        } else if (bFreq < 14) {
            divisor = 8;
        } else if (bFreq < 28) {
            divisor = 16;
        } else {
            divisor = 32;
        }
        const candidateInterval = divisor / bFreq;
        return Math.max(0.45, Math.min(1.6, candidateInterval));
    }

    if (syncMode === 'BREATH' && payload.isBreathActive) {
        const phase = payload.breathPhase || 'IDLE';
        // Respiratory Sinus Arrhythmia (RSA):
        // Inhale: vagal withdrawal -> heart rate accelerates (shorter interval)
        // Hold In: elevated plateau
        // Exhale: vagal activation -> heart rate decelerates (longer interval)
        // Hold Out: rest baseline
        if (phase === 'INHALE') {
            return baseInterval * 0.80; // 25% faster
        } else if (phase === 'HOLD_IN') {
            return baseInterval * 0.88; // 13% faster
        } else if (phase === 'EXHALE') {
            return baseInterval * 1.25; // 25% slower
        } else if (phase === 'HOLD_OUT') {
            return baseInterval * 1.15; // 15% slower
        }
        return baseInterval;
    }

    // STEADY Mode or default: Metronomic pulse based on baseBpm
    return baseInterval;
};

export const tickHeart = (graph: AudioGraph, payload: AudioPayload, t: number, memory: Record<string, unknown> = {}) => {
    memory.heart = memory.heart || {};

    // 1. STEREO HARMONIC DRONES (Legacy / Optional Harmonics)
    const baseFreq = payload.bpm > 0 ? payload.bpm / 60 : 1.0;
    const isSnake = payload.snakeConfig?.mode === 'SNAKE';
    
    const heartMem = memory.heart as Record<string, ChannelMemory>;

    [0, 1, 2, 3, 4].forEach(i => {
        const id = `HEART_HARMONIC_${i}`;
        const gainNode = graph.heartGains?.[id];
        const oscs = graph.heartOscs?.[id];
        if (!gainNode || !oscs) return;

        heartMem[id] = heartMem[id] || {};
        const mem = heartMem[id];

        let targetGain = 0;
        let finalFreq = baseFreq;
        let bBeat = 0;
        const glideTime = 0.1;

        if (payload.bpm > 0 && payload.entrainmentMode !== 'SILENT') {
            if (isSnake) {
                if (i === 1) { 
                    const snakeVol = payload.snakeConfig.vol ?? 0;
                    const snakeTrans = Math.pow(2, payload.snakeConfig.transpose ?? 0);
                    targetGain = snakeVol * (payload.harmonicMasterVolume ?? 1.0) * 0.2;
                    finalFreq = baseFreq * snakeTrans;
                    if (payload.snakeConfig.isBinaural) bBeat = payload.binauralFreqs['HEART'] || payload.binauralFreqs['UNIVERSAL'] || 7.83;
                }
            } else {
                const mutesArray = payload.heartHarmonicMutes || [];
                const volsArray = payload.heartHarmonicVols || [];
                const isMuted = mutesArray[i] || payload.stackMutes?.['HEART'];
                const vol = volsArray[i] || 0;
                targetGain = isMuted ? 0 : vol * (payload.harmonicMasterVolume ?? 1.0) * 0.2;
                const mults = [0.5, 1.0, 2.0, 3.0, 4.0];
                finalFreq = baseFreq * mults[i];
                if (payload.immersionConfig?.isTrueBinaural) bBeat = payload.binauralFreqs['HEART'] || 0;
            }
        }

        if (Math.abs(targetGain - (mem.appliedGain || -1)) > 0.005) {
            try { 
                if (typeof (gainNode.gain as any).cancelAndHoldAtTime === 'function') {
                    (gainNode.gain as any).cancelAndHoldAtTime(t);
                } else {
                    gainNode.gain.cancelScheduledValues(t);
                }
            } catch { /* Ignore node state */ }
            gainNode.gain.setTargetAtTime(targetGain, t + 0.01, 0.1);
            mem.appliedGain = targetGain;
        }

        const leftTarg = finalFreq - (bBeat/2);
        if (Math.abs(leftTarg - (mem.appliedLeft || -1)) > 0.05) {
            try { 
                if (typeof (oscs.left.frequency as any).cancelAndHoldAtTime === 'function') {
                    (oscs.left.frequency as any).cancelAndHoldAtTime(t);
                } else {
                    oscs.left.frequency.cancelScheduledValues(t);
                }
            } catch { /* Ignore node state */ }
            oscs.left.frequency.setTargetAtTime(leftTarg, t + 0.01, glideTime);
            mem.appliedLeft = leftTarg;
        }

        const rightTarg = finalFreq + (bBeat/2);
        if (Math.abs(rightTarg - (mem.appliedRight || -1)) > 0.05) {
            try { 
                if (typeof (oscs.right.frequency as any).cancelAndHoldAtTime === 'function') {
                    (oscs.right.frequency as any).cancelAndHoldAtTime(t);
                } else {
                    oscs.right.frequency.cancelScheduledValues(t);
                }
            } catch { /* Ignore node state */ }
            oscs.right.frequency.setTargetAtTime(rightTarg, t + 0.01, glideTime);
            mem.appliedRight = rightTarg;
        }
    });

    // 2. BIO-ACOUSTIC CARDIAC PULSE OVERLAY SCHEDULER
    const isMuted = payload.mutes?.['HEART_KICK'] ?? false;
    const masterVol = payload.harmonicMasterVolume ?? 1.0;
    const kickVol = (payload.volumes?.['HEART_KICK'] ?? 0.0) * masterVol;
    
    if (!memory.heartPacer) {
        memory.heartPacer = { nextBeatTime: t, beatIndex: 0, isRunning: false } as HeartPacerMemory;
    }
    const pacer = memory.heartPacer as HeartPacerMemory;

    if (isMuted || kickVol <= 0.001) {
        pacer.isRunning = false;
        pacer.nextBeatTime = t + 0.1;
        return;
    }

    if (!pacer.isRunning || pacer.nextBeatTime < t - 0.1 || pacer.nextBeatTime > t + 2.5) {
        pacer.nextBeatTime = t + 0.02;
        pacer.isRunning = true;
    }

    const kickCfg: KickConfig = payload.kickConfig || {
        freq: 50, decay: 0.4, attack: 0.01, drive: 1.0, type: 'SINE',
        syncMode: 'BREATH', doubleBeat: true, bpm: 60
    };
    const syncMode = kickCfg.syncMode || payload.heartSyncMode || 'BREATH';
    const isSecondSync = syncMode === 'BREATH_COUNT' || Boolean(kickCfg.syncToSeconds);

    if (pacer.lastSyncMode !== syncMode) {
        pacer.lastSyncMode = syncMode;
        pacer.lastScheduledAudioTime = undefined;
        pacer.scheduledBeatKeys = undefined;
        pacer.nextBeatTime = t + 0.01;
    }

    // 2A. TURNAROUND-ACCURATE 1-SECOND CADENCE BREATH SYNC MODE
    if (isSecondSync && payload.isBreathActive && payload.breathStartTime) {
        const wallNow = payload.now || performance.now() / 1000;
        const breathStartWall = payload.breathStartTime;
        // Map wall-clock breath pacer start into the Web Audio clock time domain
        const audioBreathStart = t - (wallNow - breathStartWall);

        const bCfg = payload.breathConfig;
        const inhale = Math.max(0.5, bCfg?.inhale ?? 5.0);
        const holdIn = Math.max(0, bCfg?.holdIn ?? 0);
        const exhale = Math.max(0.5, bCfg?.exhale ?? 5.0);
        const holdOut = Math.max(0, bCfg?.holdOut ?? 0);
        const totalCycle = Math.max(1.0, inhale + holdIn + exhale + holdOut);

        // Precalculate phase intervals and beat offsets in 1 complete cycle
        // Every phase turnaround has its primary beat at k = 0 (exact turnaround!)
        const phases: { name: string; start: number; dur: number }[] = [];
        let currOffset = 0;
        
        phases.push({ name: 'INHALE', start: currOffset, dur: inhale });
        currOffset += inhale;
        
        if (holdIn > 0.05) {
            phases.push({ name: 'HOLD_IN', start: currOffset, dur: holdIn });
            currOffset += holdIn;
        }
        
        phases.push({ name: 'EXHALE', start: currOffset, dur: exhale });
        currOffset += exhale;
        
        if (holdOut > 0.05) {
            phases.push({ name: 'HOLD_OUT', start: currOffset, dur: holdOut });
            currOffset += holdOut;
        }

        interface CycleBeat {
            offset: number;
            phase: string;
            isTurnaround: boolean;
            beatIndexInPhase: number;
        }
        const cycleBeats: CycleBeat[] = [];
        for (const p of phases) {
            const numBeats = Math.max(1, Math.round(p.dur));
            const step = p.dur / numBeats;
            for (let k = 0; k < numBeats; k++) {
                cycleBeats.push({
                    offset: p.start + (k * step),
                    phase: p.name,
                    isTurnaround: k === 0,
                    beatIndexInPhase: k + 1
                });
            }
        }

        const elapsed = t - audioBreathStart;
        const startCycle = Math.floor((elapsed - 0.1) / totalCycle);
        const endCycle = Math.floor((elapsed + LOOKAHEAD + 0.5) / totalCycle);

        if (!pacer.scheduledBeatKeys) {
            pacer.scheduledBeatKeys = new Set<string>();
        }

        for (let c = startCycle; c <= endCycle; c++) {
            const cycleAudioStart = audioBreathStart + (c * totalCycle);
            for (const b of cycleBeats) {
                const beatAudioTime = cycleAudioStart + b.offset;
                const beatKey = `${c}_${b.phase}_${b.beatIndexInPhase}`;

                if (beatAudioTime >= t - 0.02 && beatAudioTime < t + LOOKAHEAD) {
                    if (!pacer.scheduledBeatKeys.has(beatKey)) {
                        pacer.scheduledBeatKeys.add(beatKey);
                        if (pacer.scheduledBeatKeys.size > 250) {
                            pacer.scheduledBeatKeys.clear();
                            pacer.scheduledBeatKeys.add(beatKey);
                        }

                        const safeScheduleTime = Math.max(t + 0.003, beatAudioTime);
                        renderCardiacStroke(graph, safeScheduleTime, kickVol, kickCfg, b.phase, false);
                        if (kickCfg.doubleBeat !== false) {
                            renderCardiacStroke(graph, safeScheduleTime + 0.13, kickVol, kickCfg, b.phase, true);
                        }
                    }
                }
            }
        }
        return;
    }

    // 2B. STANDARD PACE SCHEDULER (RSA, BINAURAL, STEADY)
    const breathPhase = payload.breathPhase || 'IDLE';

    let loopSafety = 0;
    while (pacer.nextBeatTime < t + LOOKAHEAD && loopSafety < 10) {
        loopSafety++;
        const safeScheduleTime = Math.max(t + 0.005, pacer.nextBeatTime);

        // Determine cardiac interval dynamically according to selected sync mode & parameters
        const currentInterval = getCardiacInterval(kickCfg, payload);

        // Render Primary Cardiac Stroke (Lub)
        renderCardiacStroke(graph, safeScheduleTime, kickVol, kickCfg, breathPhase, false);

        // Render Secondary Subtle Cardiac Stroke (Dub) ~130ms later for physiological realism
        if (kickCfg.doubleBeat !== false) {
            const dubTime = safeScheduleTime + 0.13;
            renderCardiacStroke(graph, dubTime, kickVol, kickCfg, breathPhase, true);
        }

        pacer.nextBeatTime += currentInterval;
        pacer.beatIndex++;
    }
};

export const triggerHeartPulse = (graph: AudioGraph, time: number, data: { kickConfig?: KickConfig; volumes?: Record<string, number>; mutes?: Record<string, boolean>; stackMutes?: Record<string, boolean> }) => {
    const ctx = graph.ctx;
    if (!ctx) return;
    const kickCfg: KickConfig = data.kickConfig || {
        freq: 50, decay: 0.4, attack: 0.01, drive: 1.0, type: 'SINE',
        syncMode: 'BREATH', doubleBeat: true
    };
    const baseVol = data.volumes?.['HEART_KICK'] ?? 0.8;
    const vol = baseVol * 0.7;
    renderCardiacStroke(graph, time, vol, kickCfg, 'IDLE', false);
    if (kickCfg.doubleBeat !== false) {
        renderCardiacStroke(graph, time + 0.13, vol, kickCfg, 'IDLE', true);
    }
};
