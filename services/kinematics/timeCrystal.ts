export type TimeCrystalTopology = 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE';

// ------------------------------------------------------------------
// TOPOLOGY 1: FIBONACCI WORD (Quasi-Periodic Golden Ratio)
// ------------------------------------------------------------------
export const generateFibonacciWord = (iterations: number): boolean[] => {
    let a = [true]; let b = [true, false]; 
    if (iterations === 0) return a; if (iterations === 1) return b;
    let current = b;
    for (let i = 2; i <= iterations; i++) {
        const next = [...b, ...a];
        a = b; b = next; current = next;
    }
    return current;
};
export const FIBONACCI_SEQUENCE = generateFibonacciWord(15); 
const rawFibDurs = FIBONACCI_SEQUENCE.map(isA => isA ? 1.6180339887 : 1.0);
const rawFibTotal = rawFibDurs.reduce((sum, val) => sum + val, 0);
const fibScale = FIBONACCI_SEQUENCE.length / rawFibTotal;
const FIB_DURATIONS_1HZ = rawFibDurs.map(d => d * fibScale);
const FIB_TOTAL_DUR = FIB_DURATIONS_1HZ.reduce((sum, val) => sum + val, 0);

// ------------------------------------------------------------------
// TOPOLOGY 2: PRIME METRIC (Biological Clock / Microtubule Model)
// ------------------------------------------------------------------
export const generatePrimeMetric = (length: number): boolean[] => {
    const seq = new Array(length).fill(false);
    const isPrime = (n: number) => {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) return false;
        }
        return true;
    };
    for(let i=0; i<length; i++) {
        seq[i] = isPrime(i);
    }
    return seq;
};
export const PRIME_SEQUENCE = generatePrimeMetric(1024);
const PRIME_DURATIONS_1HZ = PRIME_SEQUENCE.map(() => 1.0);
const PRIME_TOTAL_DUR = 1024.0;

// ------------------------------------------------------------------
// TOPOLOGY 3: THUE-MORSE (Infinite-range interacting Quasi-DTC)
// ------------------------------------------------------------------
export const generateThueMorse = (iterations: number): boolean[] => {
    let current = [true];
    for(let i=0; i<iterations; i++) {
        current = [...current, ...current.map(x => !x)];
    }
    return current;
};
export const THUE_MORSE_SEQUENCE = generateThueMorse(10); 
const TM_DURATIONS_1HZ = THUE_MORSE_SEQUENCE.map(() => 1.0);
const TM_TOTAL_DUR = 1024.0;

// ------------------------------------------------------------------
// TOPOLOGY 4: PERIOD-DOUBLED (Classic Rigid Time Crystal)
// ------------------------------------------------------------------
export const PERIOD_DOUBLE_SEQUENCE = [true, false];
const PD_DURATIONS_1HZ = [1.0, 1.0]; 
const PD_TOTAL_DUR = 2.0;

// ------------------------------------------------------------------
// DATA ROUTER
// ------------------------------------------------------------------
const getTopologyData = (topology: TimeCrystalTopology) => {
    switch(topology) {
        case 'PRIME': return { seq: PRIME_SEQUENCE, durs: PRIME_DURATIONS_1HZ, total: PRIME_TOTAL_DUR };
        case 'THUE_MORSE': return { seq: THUE_MORSE_SEQUENCE, durs: TM_DURATIONS_1HZ, total: TM_TOTAL_DUR };
        case 'PERIOD_DOUBLE': return { seq: PERIOD_DOUBLE_SEQUENCE, durs: PD_DURATIONS_1HZ, total: PD_TOTAL_DUR };
        case 'FIBONACCI':
        default: return { seq: FIBONACCI_SEQUENCE, durs: FIB_DURATIONS_1HZ, total: FIB_TOTAL_DUR };
    }
};

// ------------------------------------------------------------------
// EVALUATORS
// ------------------------------------------------------------------
export const evaluateTimeCrystal = (time: number, frequency: number, topology: TimeCrystalTopology = 'FIBONACCI'): number => {
    const freq = Math.max(0.001, frequency);
    const { seq, durs, total } = getTopologyData(topology);
    let t = (time * freq) % total;

    for (let i = 0; i < seq.length; i++) {
        if (t < durs[i]) return seq[i] ? 1.0 : 0.0;
        t -= durs[i];
    }
    return 0.0;
};

export const evaluateTimeCrystalPulse = (
    time: number,
    frequency: number,
    topology: TimeCrystalTopology = 'FIBONACCI',
    waveform: string = 'SINE'
): number => {
    const freq = Math.max(0.001, frequency);
    const { seq, durs, total } = getTopologyData(topology);
    let t = (time * freq) % total;
    if (t < 0) t += total;

    for (let i = 0; i < seq.length; i++) {
        if (t < durs[i]) {
            if (!seq[i]) return 0.0;
            const progress = Math.max(0, Math.min(1, t / durs[i]));
            if (waveform === 'STROBE') {
                return progress < 0.5 ? 1.0 : 0.0;
            } else if (waveform === 'TRIANGLE') {
                return progress < 0.5 ? progress * 2 : 2 - progress * 2;
            } else if (waveform === 'HEARTBEAT') {
                const p1 = Math.max(0, 1.0 - Math.abs(progress - 0.2) / 0.15);
                const p2 = Math.max(0, 1.0 - Math.abs(progress - 0.45) / 0.15) * 0.7;
                return Math.max(p1, p2);
            } else {
                // SINE: smooth raised bell curve across active duration
                return Math.sin(progress * Math.PI);
            }
        }
        t -= durs[i];
    }
    return 0.0;
};

export const getTimeCrystalEvents = (startTime: number, endTime: number, frequency: number, topology: TimeCrystalTopology = 'FIBONACCI') => {
    const events: { time: number, state: boolean }[] = [];
    const freq = Math.max(0.001, frequency);
    const { seq, durs, total } = getTopologyData(topology);
    const seqDur = total / freq;

    let currentTime = startTime;
    let tInSeq = currentTime % seqDur;
    let currentIndex = 0;

    for (let i = 0; i < seq.length; i++) {
        const dur = durs[i] / freq;
        if (tInSeq < dur) {
            currentIndex = i;
            currentTime += (dur - tInSeq); 
            break;
        }
        tInSeq -= dur;
    }

    while (currentTime < endTime) {
        currentIndex = (currentIndex + 1) % seq.length;
        events.push({ time: currentTime, state: seq[currentIndex] });
        currentTime += (durs[currentIndex] / freq);
    }

    return events;
};