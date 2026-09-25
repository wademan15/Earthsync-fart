import { BESSEL_ZEROS } from './bessel';

/**
 * Maps any frequency (including high audio tones like A3 and above) to its
 * resonant octave subharmonic / undertone in the optimal physical standing-wave band (20Hz - 90Hz).
 */
export const getStandingWaveUndertone = (freq: number, maxResonantFreq = 90): number => {
    if (!freq || isNaN(freq) || freq <= 0) return 43.2;
    let f = freq;
    while (f > maxResonantFreq) {
        f /= 2.0;
    }
    while (f < 20.0 && f > 0) {
        f *= 2.0;
    }
    return f;
};

/**
 * Deterministically maps an acoustic frequency to a 2D Chladni plate geometric mode.
 * Automatically applies subharmonic undertone folding so all keys (including A3 and higher octaves)
 * produce visible, stable, beautiful nodal standing waveforms.
 * @param freq - The frequency in Hertz.
 * @param out - Optional target object for zero-allocation mutation.
 */
export const getUniversalCymatic = (freq: number, out?: { n: number, m: number, k: number, speed: number, [key: string]: unknown }) => {
    const visualFreq = getStandingWaveUndertone(freq, 90);
    
    let n = 0;
    let m = 0;

    // Harmonic signature modes based on fundamental undertones
    if (Math.abs(visualFreq - 72) < 1.5) { n = 2; m = 1; }
    else if (Math.abs(visualFreq - 64) < 1.5) { n = 4; m = 1; } // C octaves (256, 512, 1024)
    else if (Math.abs(visualFreq - 48) < 1.5) { n = 3; m = 1; } // G octaves (384)
    else if (Math.abs(visualFreq - 54) < 1.5) { n = 5; m = 1; } // A octaves (432, 864)
    else if (Math.abs(visualFreq - 66) < 1.5) { n = 6; m = 1; } // 528 Hz
    else if (Math.abs(visualFreq - 60) < 1.5) { n = 5; m = 2; } // 963 Hz
    else {
        // Algorithmic mapping for all continuous frequencies
        const logF = Math.max(0, Math.log2(visualFreq / 20.0));
        n = (Math.floor(logF * 3.2) % 7) + 2; // Maps to 2-8
        m = (Math.floor(logF * 1.8) % 2) + 1; // Maps to 1-2
    }

    // Prevent flat / singular modes
    if (n <= 0) n = 2;
    if (m <= 0) m = 1;
    if (n === m) {
        n = (n % 8) + 1;
        if (n <= 1) n = 3;
    }

    // Fetch true Bessel root to perfectly anchor the wave to the circular boundary
    let k = Math.PI * (m + 1); 
    if (BESSEL_ZEROS && BESSEL_ZEROS[n] && BESSEL_ZEROS[n][m]) {
        k = BESSEL_ZEROS[n][m];
    }
    
    const speed = 0.4 + Math.log2(Math.max(1, visualFreq) / 20.0) * 0.15;
    
    // ZERO-ALLOCATION MUTATION
    if (out) {
        out.n = n;
        out.m = m;
        out.k = k;
        out.speed = speed;
        return out;
    }

    return { n, m, k, speed };
};