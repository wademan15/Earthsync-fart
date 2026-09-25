/**
 * ChordGlideEngine.ts
 * 
 * Provides voice-leading optimization and frequency ramp scheduling (portamento)
 * for smooth chord transitions in Musical Mode while preserving clinical binaural entrainment.
 */

import { ResolvedChordNote, ChordGlideConfig } from './chordProgressions';

export interface VoiceAssignment {
    voiceIndex: number;
    sourceFreq: number;
    targetFreq: number;
    sourceNote?: string;
    targetNote?: string;
    isHeld?: boolean;
    isNewVoice?: boolean;
    isDroppedVoice?: boolean;
    semitoneDistance: number;
}

export interface VoiceLeadingPlan {
    assignments: VoiceAssignment[];
    maxSemitoneDistance: number;
    averageSemitoneDistance: number;
}

/**
 * Calculates semitone distance between two frequencies.
 * 12 * log2(f2 / f1)
 */
export function calculateSemitoneDistance(f1: number, f2: number): number {
    if (f1 <= 0 || f2 <= 0) return 0;
    return Math.abs(12 * Math.log2(f2 / f1));
}

export interface ActiveVoiceInput {
    voiceIndex: number;
    freq: number;
    note?: string;
}

/**
 * Computes optimal individual voice leading between active voices and target chord notes.
 * 
 * Guarantees:
 * 1. Held notes (common tones) are preserved with priority - they do not glide, drop, or restart.
 * 2. Moving voices glide individually from their exact current pitch to their target pitch.
 * 3. Dropped voices (when chord polyphony decreases) fade out cleanly without affecting held/moving notes.
 * 4. Entering voices (when chord polyphony increases) enter cleanly without phantom pitch jumps.
 */
export function computeVoiceLeading(
    sourceVoicesOrNotes: (ActiveVoiceInput | ResolvedChordNote | number | null | undefined)[],
    targetNotes: ResolvedChordNote[],
    mode: 'CLOSEST_PITCH' | 'STRICT_VOICING' | 'CONTRARY_MOTION' = 'CLOSEST_PITCH'
): VoiceLeadingPlan {
    if (!targetNotes || targetNotes.length === 0) {
        return { assignments: [], maxSemitoneDistance: 0, averageSemitoneDistance: 0 };
    }

    // Parse active source voices with their voiceIndex
    const activeVoices: ActiveVoiceInput[] = [];
    sourceVoicesOrNotes.forEach((item, idx) => {
        if (item === null || item === undefined) return;
        if (typeof item === 'number') {
            if (!isNaN(item) && item > 20 && item < 20000) {
                activeVoices.push({ voiceIndex: idx, freq: item });
            }
        } else if ('freq' in item && typeof item.freq === 'number' && !isNaN(item.freq) && item.freq > 20 && item.freq < 20000) {
            const vIdx = ('voiceIndex' in item && typeof item.voiceIndex === 'number') ? item.voiceIndex : idx;
            activeVoices.push({ voiceIndex: vIdx, freq: item.freq, note: item.note });
        }
    });

    // If no active voices exist (entering from silence), initialize voices directly on target pitches
    if (activeVoices.length === 0) {
        const sortedTargets = [...targetNotes].sort((a, b) => a.freq - b.freq);
        const assignments: VoiceAssignment[] = sortedTargets.map((target, idx) => ({
            voiceIndex: idx,
            sourceFreq: target.freq,
            targetFreq: target.freq,
            targetNote: target.note,
            isNewVoice: true,
            isHeld: false,
            semitoneDistance: 0
        }));
        return { assignments, maxSemitoneDistance: 0, averageSemitoneDistance: 0 };
    }

    const assignments: VoiceAssignment[] = [];
    const usedVoiceIndices = new Set<number>();
    const usedTargetIndices = new Set<number>();

    // STEP 1: Detect Held Notes (Common Tones).
    // If an active voice is already playing a pitch virtually identical to a target note (< 0.25 semitones),
    // lock that voice as a held note so it continues uninterrupted without gliding or dropping!
    targetNotes.forEach((target, tIdx) => {
        let bestVoiceIdx = -1;
        let minDiff = 0.25; // within 1/4 semitone threshold

        activeVoices.forEach(voice => {
            if (usedVoiceIndices.has(voice.voiceIndex)) return;
            const dist = calculateSemitoneDistance(voice.freq, target.freq);
            if (dist < minDiff) {
                minDiff = dist;
                bestVoiceIdx = voice.voiceIndex;
            }
        });

        if (bestVoiceIdx !== -1) {
            const matchingVoice = activeVoices.find(v => v.voiceIndex === bestVoiceIdx)!;
            usedVoiceIndices.add(bestVoiceIdx);
            usedTargetIndices.add(tIdx);

            assignments.push({
                voiceIndex: bestVoiceIdx,
                sourceFreq: matchingVoice.freq,
                targetFreq: target.freq,
                sourceNote: matchingVoice.note,
                targetNote: target.note,
                isHeld: true,
                isNewVoice: false,
                semitoneDistance: minDiff
            });
        }
    });

    // Remaining targets and voices that must be matched
    const remainingTargets: { target: ResolvedChordNote; originalIndex: number }[] = [];
    targetNotes.forEach((t, idx) => {
        if (!usedTargetIndices.has(idx)) {
            remainingTargets.push({ target: t, originalIndex: idx });
        }
    });

    const remainingVoices: ActiveVoiceInput[] = activeVoices.filter(v => !usedVoiceIndices.has(v.voiceIndex));

    let totalDist = 0;
    let maxDist = 0;

    // STEP 2: Match Remaining Moving Voices
    if (mode === 'STRICT_VOICING') {
        const sortedRemVoices = [...remainingVoices].sort((a, b) => a.freq - b.freq);
        const sortedRemTargets = [...remainingTargets].sort((a, b) => a.target.freq - b.target.freq);
        const matchCount = Math.min(sortedRemVoices.length, sortedRemTargets.length);

        for (let i = 0; i < matchCount; i++) {
            const v = sortedRemVoices[i];
            const t = sortedRemTargets[i].target;
            const dist = calculateSemitoneDistance(v.freq, t.freq);
            totalDist += dist;
            maxDist = Math.max(maxDist, dist);

            usedVoiceIndices.add(v.voiceIndex);
            usedTargetIndices.add(sortedRemTargets[i].originalIndex);

            assignments.push({
                voiceIndex: v.voiceIndex,
                sourceFreq: v.freq,
                targetFreq: t.freq,
                sourceNote: v.note,
                targetNote: t.note,
                isHeld: false,
                isNewVoice: false,
                semitoneDistance: dist
            });
        }
    } else {
        // CLOSEST_PITCH or CONTRARY_MOTION:
        // Find optimal assignment between available voices and targets minimizing semitone movement
        // When CONTRARY_MOTION is selected, counterpoint logic rewards contrary/oblique motion relative to the highest voice (soprano)
        const matchCount = Math.min(remainingVoices.length, remainingTargets.length);
        if (matchCount > 0) {
            let bestCost = Infinity;
            let bestVoiceMapping: number[] = []; // maps target index in remainingTargets -> remainingVoices index

            // Identify highest source voice and highest target note to detect soprano contour
            const highestSource = remainingVoices.reduce((max, v) => v.freq > max.freq ? v : max, remainingVoices[0]);
            const highestTarget = remainingTargets.reduce((max, t) => t.target.freq > max.target.freq ? t : max, remainingTargets[0]);
            const sopranoDelta = highestTarget.target.freq - highestSource.freq;
            const sopranoDir = sopranoDelta > 0.5 ? 1 : (sopranoDelta < -0.5 ? -1 : 0);

            const findOptimalMapping = (targetIdx: number, currentMapping: number[], currentCost: number, usedV: boolean[]) => {
                if (currentCost >= bestCost) return;
                if (targetIdx === matchCount) {
                    bestCost = currentCost;
                    bestVoiceMapping = [...currentMapping];
                    return;
                }

                for (let v = 0; v < remainingVoices.length; v++) {
                    if (!usedV[v]) {
                        usedV[v] = true;
                        currentMapping.push(v);
                        const vFreq = remainingVoices[v].freq;
                        const tFreq = remainingTargets[targetIdx].target.freq;
                        let dist = calculateSemitoneDistance(vFreq, tFreq);

                        if (mode === 'CONTRARY_MOTION' && sopranoDir !== 0 && remainingVoices[v].voiceIndex !== highestSource.voiceIndex) {
                            const voiceDelta = tFreq - vFreq;
                            const voiceDir = voiceDelta > 0.5 ? 1 : (voiceDelta < -0.5 ? -1 : 0);
                            // If inner/bass voice moves in the exact same parallel direction as the soprano, apply a gentle penalty
                            if (voiceDir === sopranoDir && Math.abs(voiceDelta) > 1.0) {
                                dist += 2.0; // gentle penalty to encourage contrary or stationary counterpoint
                            } else if (voiceDir === -sopranoDir || voiceDir === 0) {
                                dist = Math.max(0, dist - 0.5); // bonus for contrary motion or common tone
                            }
                        }

                        findOptimalMapping(targetIdx + 1, currentMapping, currentCost + dist, usedV);
                        currentMapping.pop();
                        usedV[v] = false;
                    }
                }
            };

            findOptimalMapping(0, [], 0, new Array(remainingVoices.length).fill(false));

            for (let t = 0; t < matchCount; t++) {
                const vIdx = bestVoiceMapping[t];
                const voice = remainingVoices[vIdx];
                const targetObj = remainingTargets[t];
                const dist = calculateSemitoneDistance(voice.freq, targetObj.target.freq);
                totalDist += dist;
                maxDist = Math.max(maxDist, dist);

                usedVoiceIndices.add(voice.voiceIndex);
                usedTargetIndices.add(targetObj.originalIndex);

                assignments.push({
                    voiceIndex: voice.voiceIndex,
                    sourceFreq: voice.freq,
                    targetFreq: targetObj.target.freq,
                    sourceNote: voice.note,
                    targetNote: targetObj.target.note,
                    isHeld: false,
                    isNewVoice: false,
                    semitoneDistance: dist
                });
            }
        }
    }

    // STEP 3: Handle Unmatched Targets (Entering Voices)
    // When the new chord has more notes than active voices, allocate unused voice channels
    const stillUnusedTargets = targetNotes.filter((_, idx) => !usedTargetIndices.has(idx));
    if (stillUnusedTargets.length > 0) {
        // Find available voice indices (0 to 7) not currently used
        const allPossibleVoiceIndices = [0, 1, 2, 3, 4, 5, 6, 7];
        const availableIndices = allPossibleVoiceIndices.filter(idx => !usedVoiceIndices.has(idx));

        stillUnusedTargets.forEach((target, i) => {
            const voiceIdx = i < availableIndices.length ? availableIndices[i] : (8 + i);
            usedVoiceIndices.add(voiceIdx);

            // Determine optimal source frequency to glide from:
            // Find the closest active voice from the previous chord so the new voice blooms/glides seamlessly into its target pitch (e.g. F4 -> F5)
            let sourcePitch = target.freq;
            if (activeVoices.length > 0) {
                let minDiff = Infinity;
                let closestVoiceFreq = activeVoices[0].freq;
                activeVoices.forEach(v => {
                    const diff = calculateSemitoneDistance(v.freq, target.freq);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestVoiceFreq = v.freq;
                    }
                });
                sourcePitch = closestVoiceFreq;
            }

            const dist = calculateSemitoneDistance(sourcePitch, target.freq);
            totalDist += dist;
            maxDist = Math.max(maxDist, dist);

            assignments.push({
                voiceIndex: voiceIdx,
                sourceFreq: sourcePitch,
                targetFreq: target.freq,
                targetNote: target.note,
                isNewVoice: true,
                isHeld: false,
                semitoneDistance: dist
            });
        });
    }

    // STEP 4: Handle Unmatched Active Voices (Dropped Voices)
    // When the new chord has fewer notes than previous chord, mark excess voices so they fade out cleanly
    const droppedVoices = activeVoices.filter(v => !usedVoiceIndices.has(v.voiceIndex));
    droppedVoices.forEach(v => {
        assignments.push({
            voiceIndex: v.voiceIndex,
            sourceFreq: v.freq,
            targetFreq: v.freq,
            sourceNote: v.note,
            isDroppedVoice: true,
            isHeld: false,
            semitoneDistance: 0
        });
    });

    return {
        assignments,
        maxSemitoneDistance: maxDist,
        averageSemitoneDistance: targetNotes.length > 0 ? totalDist / targetNotes.length : 0
    };
}

/**
 * Safely schedules a frequency glide on an AudioParam,
 * using exponential or linear slewing while strictly avoiding zero/negative values.
 * If fromFreq is provided and targetFreq is identical to fromFreq (held note),
 * the param is held completely stable without interruption or cancel clicks.
 */
export function scheduleVoiceGlide(
    param: AudioParam,
    targetFreq: number,
    startTime: number,
    duration: number,
    fromFreq?: number,
    curve: 'EXPONENTIAL' | 'LINEAR' = 'EXPONENTIAL'
): void {
    const safeTarget = Math.max(20, Math.min(20000, targetFreq));
    const safeDuration = Math.max(0.01, duration);
    const currentVal = Math.max(20, Math.min(20000, fromFreq && fromFreq > 20 ? fromFreq : (param.value || safeTarget)));

    // Held note optimization: if the frequency difference is below 0.5 Hz, do not interrupt the oscillator!
    if (Math.abs(safeTarget - currentVal) < 0.5) {
        return;
    }

    try {
        const paramWithHold = param as AudioParam & { cancelAndHoldAtTime?: (cancelTime: number) => AudioParam };
        if (typeof paramWithHold.cancelAndHoldAtTime === 'function') {
            paramWithHold.cancelAndHoldAtTime(startTime);
        } else {
            param.cancelScheduledValues(startTime);
        }
    } catch {
        try {
            param.cancelScheduledValues(startTime);
        } catch {
            // AudioParam cancel fallback
        }
    }

    try {
        param.setValueAtTime(currentVal, startTime);
        if (curve === 'EXPONENTIAL') {
            param.exponentialRampToValueAtTime(safeTarget, startTime + safeDuration);
        } else {
            param.linearRampToValueAtTime(safeTarget, startTime + safeDuration);
        }
    } catch {
        try {
            param.linearRampToValueAtTime(safeTarget, startTime + safeDuration);
        } catch {
            try {
                param.setTargetAtTime(safeTarget, startTime, safeDuration / 3);
            } catch {
                // AudioParam setTarget fallback
            }
        }
    }
}

/**
 * Schedules a stereo binaural glide, locking the exact interaural beat delta.
 * Ensures the binaural brainwave entrainment frequency (e.g. 10 Hz Alpha)
 * remains mathematically fixed throughout the portamento sweep.
 */
export function scheduleBinauralVoiceGlide(
    leftFreqParam: AudioParam,
    rightFreqParam: AudioParam,
    targetBaseFreq: number,
    binauralBeatDelta: number,
    startTime: number,
    glideConfig: ChordGlideConfig
): void {
    if (!glideConfig.enabled || glideConfig.time <= 0.01) {
        // Instant shift
        const halfDelta = binauralBeatDelta / 2;
        const targetL = Math.max(20, targetBaseFreq - halfDelta);
        const targetR = Math.max(20, targetBaseFreq + halfDelta);

        try {
            leftFreqParam.cancelScheduledValues(startTime);
            rightFreqParam.cancelScheduledValues(startTime);
        } catch {
            // AudioParam cancel fallback
        }

        leftFreqParam.setValueAtTime(targetL, startTime);
        rightFreqParam.setValueAtTime(targetR, startTime);
        return;
    }

    const halfDelta = binauralBeatDelta / 2;
    const targetL = Math.max(20, targetBaseFreq - halfDelta);
    const targetR = Math.max(20, targetBaseFreq + halfDelta);

    scheduleVoiceGlide(leftFreqParam, targetL, startTime, glideConfig.time, glideConfig.curve);
    scheduleVoiceGlide(rightFreqParam, targetR, startTime, glideConfig.time, glideConfig.curve);
}
