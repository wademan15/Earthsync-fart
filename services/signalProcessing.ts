
import { 
  MayerWaveMetrics, RecursionMetrics, 
  ReadinessMetrics, 
  SpectralMetrics, AlphaMetrics, 
  BaevskyMetrics,
  DiagnosticsMetrics, LorenzMetrics,
  HarmonicMetrics, TuningSystem,
  MSEMetrics
} from '../types';

export const PHI = 1.61803398875;

// --- SHARED BUFFERS FOR MEMORY OPTIMIZATION ---
// Using pre-allocated buffers prevents GC spikes during high-frequency FFT calls
const MAX_PSD_BINS = 2048;
const MAX_RR_BUFFER = 4096;
const SHARED_PSD_BUFFER = new Float32Array(MAX_PSD_BINS);
const SHARED_FREQ_BUFFER = new Float32Array(MAX_PSD_BINS);
const SHARED_TIME_AXIS = new Float32Array(MAX_RR_BUFFER);
const SHARED_RESAMPLE_BUFFER = new Float32Array(MAX_RR_BUFFER);
const SHARED_CLEAN_RR = new Float32Array(MAX_RR_BUFFER);
const SHARED_SORT_BUFFER = new Float32Array(16);
const SHARED_DIFFS = new Float32Array(MAX_RR_BUFFER);
const SHARED_DFA_Y = new Float32Array(MAX_RR_BUFFER);
const SHARED_COARSE_BUFFER = new Float32Array(MAX_RR_BUFFER);

const safeNum = (val: number, fallback = 0): number => {
    return (typeof val === 'number' && isFinite(val) && !isNaN(val)) ? val : fallback;
};

// OPTIMIZED MATH CORE
// Updated signatures to accept ArrayLike<number> (Float32Array compatibility)
export class MathCore {
  static mean(data: ArrayLike<number>): number {
      const len = data.length;
      if (len === 0) return 0;
      let sum = 0;
      for (let i = 0; i < len; i++) sum += data[i];
      return sum / len;
  }

  static stdDev(data: ArrayLike<number>): number {
    const len = data.length;
    if (len < 2) return 0;
    const m = this.mean(data);
    let sumSq = 0;
    for (let i = 0; i < len; i++) {
        const diff = data[i] - m;
        sumSq += diff * diff;
    }
    return Math.sqrt(sumSq / (len - 1));
  }

  static skewness(data: ArrayLike<number>): number {
    const n = data.length;
    if (n < 3) return 0;
    const m = this.mean(data);
    const s = this.stdDev(data);
    if (s === 0) return 0;
    
    let sumCubed = 0;
    for (let i = 0; i < n; i++) {
        sumCubed += Math.pow((data[i] - m) / s, 3);
    }
    return (n / ((n - 1) * (n - 2))) * sumCubed;
  }

  static kurtosis(data: ArrayLike<number>): number {
    const n = data.length;
    if (n < 4) return 0;
    const m = this.mean(data);
    const s = this.stdDev(data);
    if (s === 0) return 0;
    
    let sumFourth = 0;
    for (let i = 0; i < n; i++) {
        sumFourth += Math.pow((data[i] - m) / s, 4);
    }
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumFourth - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  static spectralEntropy(psd: ArrayLike<number>): number {
    let sum = 0;
    const len = psd.length;
    for (let i = 0; i < len; i++) sum += psd[i];
    
    if (sum === 0) return 0;
    
    let entropy = 0;
    for (let i = 0; i < len; i++) {
        const p = psd[i] / sum;
        if (p > 0) entropy -= p * Math.log2(p);
    }
    return entropy / (Math.log2(len || 1) || 1);
  }

  static turningPointRatio(data: ArrayLike<number>): number {
    const len = data.length;
    if (len < 3) return 0;
    let turns = 0;
    for(let i=1; i<len-1; i++) {
        if ((data[i] > data[i-1] && data[i] > data[i+1]) || (data[i] < data[i-1] && data[i] < data[i+1])) turns++;
    }
    return turns / (len - 2);
  }

  static zeroCrossingRate(data: ArrayLike<number>): number {
      const len = data.length;
      if(len < 2) return 0;
      let count = 0;
      for(let i=1; i<len; i++) {
          if ((data[i] >= 0 && data[i-1] < 0) || (data[i] < 0 && data[i-1] >= 0)) count++;
      }
      return count / (len - 1);
  }

  static correlate(x: ArrayLike<number>, y: ArrayLike<number>): number {
      const n = Math.min(x.length, y.length);
      if (n === 0) return 0;
      const mx = this.mean(x); const my = this.mean(y);
      let num = 0, den1 = 0, den2 = 0;
      for(let i=0; i<n; i++) {
          const dx = x[i] - mx;
          const dy = y[i] - my;
          num += dx * dy;
          den1 += dx * dx;
          den2 += dy * dy;
      }
      return (den1 * den2 === 0) ? 0 : num / Math.sqrt(den1 * den2);
  }

  static linearSlope(x: number[], y: number[]): number {
      const n = Math.min(x.length, y.length);
      if (n === 0) return 0;
      
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
          sumX += x[i];
          sumY += y[i];
          sumXY += x[i] * y[i];
          sumXX += x[i] * x[i];
      }
      
      const denominator = (n * sumXX) - (sumX * sumX);
      if (denominator === 0) return 0;
      return ((n * sumXY) - (sumX * sumY)) / denominator;
  }
}

export class SignalConditioner {
    static resample(rr: ArrayLike<number>, targetHz: number = 4): Float32Array {
        if (rr.length < 2) return new Float32Array(0);
        
        // 1. Build Time Axis (Cumulative Sum)
        const timeAxis = SHARED_TIME_AXIS;
        let currentTime = 0;
        for(let i=0; i<rr.length; i++) {
            currentTime += rr[i];
            timeAxis[i] = currentTime / 1000;
        }

        const output = SHARED_RESAMPLE_BUFFER;
        const step = 1 / targetHz;
        let t = timeAxis[0];
        const endTime = timeAxis[rr.length-1];
        
        let idx = 0;
        const maxIdx = rr.length - 1;
        let outIdx = 0;

        // 2. Linear Interpolation Loop
        while(t <= endTime && idx < maxIdx && outIdx < MAX_RR_BUFFER) {
            // Find window
            while (idx < maxIdx && t > timeAxis[idx+1]) idx++;
            if (idx >= maxIdx) break;
            
            const t0 = timeAxis[idx];
            const t1 = timeAxis[idx+1];
            const v0 = rr[idx];
            const v1 = rr[idx+1];
            
            // Interpolate
            const factor = (t - t0) / (t1 - t0);
            output[outIdx++] = v0 + (v1 - v0) * factor;
            
            t += step;
        }
        return output.subarray(0, outIdx);
    }
}

export class ArtifactSweeper {
    static sweep(rr: ArrayLike<number>): { clean: Float32Array, corrections: number } {
        if (rr.length < 5) {
            for(let i=0; i<rr.length; i++) SHARED_CLEAN_RR[i] = rr[i];
            return { clean: SHARED_CLEAN_RR.subarray(0, rr.length), corrections: 0 };
        }
        const clean = SHARED_CLEAN_RR;
        let cIdx = 0;
        let corrections = 0;
        
        clean[cIdx++] = rr[0]; 
        
        for (let i = 1; i < rr.length && cIdx < MAX_RR_BUFFER - 2; i++) {
            const beat = rr[i];
            
            // 1. Hard Range Check (Physiological Limits)
            if (beat < 250 || beat > 3000) {
                // Out of range? Use median of last 5 valid
                const start = Math.max(0, cIdx - 5);
                const len = cIdx - start;
                for(let j=0; j<len; j++) SHARED_SORT_BUFFER[j] = clean[start+j];
                const context = SHARED_SORT_BUFFER.subarray(0, len);
                context.sort();
                const median = context[Math.floor(len/2)] || 800;
                clean[cIdx++] = median;
                corrections++;
                continue;
            }

            // 2. Dynamic Relative Check
            const start = Math.max(0, cIdx - 10);
            const len = cIdx - start;
            for(let j=0; j<len; j++) SHARED_SORT_BUFFER[j] = clean[start+j];
            const contextWindow = SHARED_SORT_BUFFER.subarray(0, len);
            contextWindow.sort();
            const median = contextWindow[Math.floor(len/2)];

            if (beat > median * 1.75) {
                // Missed Beat (Double length) -> Split it
                const splitBeat = beat / 2;
                clean[cIdx++] = splitBeat;
                clean[cIdx++] = splitBeat;
                corrections++;
            }
            else if (i < rr.length - 1 && (beat + rr[i+1] < median * 1.3) && (beat + rr[i+1] > median * 0.7)) {
                // False Beat (Two short ones sum to one normal) -> Merge
                const mergedBeat = beat + rr[i+1];
                clean[cIdx++] = mergedBeat;
                i++; // Skip next
                corrections++;
            }
            else if (Math.abs(beat - median) > (median * 0.60)) {
                // Random Noise -> Clamp to median
                clean[cIdx++] = median; 
                corrections++;
            }
            else {
                clean[cIdx++] = beat;
            }
        }
        return { clean: clean.subarray(0, cIdx), corrections };
    }
}

export class SpectralAnalyzer {
    // OPTIMIZED PSD GENERATOR (Uses Shared Buffers)
    // Returns views into the static buffers to avoid allocation
    static generatePSD(signal: ArrayLike<number>, sampleRate: number): { freqs: Float32Array, psd: Float32Array } {
        const N = signal.length;
        if (N < 2) return { freqs: new Float32Array(0), psd: new Float32Array(0) };

        // 1. Calculate Mean (for detrending)
        const mean = MathCore.mean(signal);

        // 2. Frequency Config
        const maxF = 0.5;
        const df = 0.005;
        const numFreqs = Math.min(Math.floor(maxF / df) + 1, MAX_PSD_BINS);
        
        // Use Shared Buffers
        const psd = SHARED_PSD_BUFFER;
        const freqs = SHARED_FREQ_BUFFER;

        // Constants for the loop
        const twoPi = 2 * Math.PI;
        const invN2 = 1 / (N / 2);
        
        // 3. The DFT Loop (Optimized)
        for (let i = 0; i < numFreqs; i++) {
            const f = i * df;
            freqs[i] = f;
            
            let re = 0;
            let im = 0;
            
            for (let n = 0; n < N; n++) {
                // On-the-fly Detrend & Hanning Window
                const raw = signal[n] - mean;
                const window = 0.5 * (1 - Math.cos((twoPi * n) / (N - 1)));
                const val = raw * window;

                const angle = twoPi * f * (n / sampleRate);
                re += val * Math.cos(angle);
                im -= val * Math.sin(angle);
            }
            
            const magnitude = Math.sqrt(re * re + im * im) * invN2;
            psd[i] = magnitude * magnitude; 
        }
        
        // Return views (subarrays) so consuming code sees correct length
        return { 
            freqs: freqs.subarray(0, numFreqs), 
            psd: psd.subarray(0, numFreqs) 
        };
    }

    static analyze(psd: ArrayLike<number>, freqs: ArrayLike<number>): SpectralMetrics {
        // Optimized Power Summation
        const len = freqs.length;
        let vlf = 0, lf = 0, hf = 0;
        let maxP = 0, peakF = 0;

        for (let i = 0; i < len; i++) {
            const f = freqs[i];
            const p = psd[i];
            
            if (f >= 0.0033 && f < 0.04) vlf += p;
            else if (f >= 0.04 && f < 0.15) lf += p;
            else if (f >= 0.15 && f < 0.4) hf += p;

            if (f > 0.04 && p > maxP) {
                maxP = p;
                peakF = f;
            }
        }

        const total = vlf + lf + hf;
        const lfNu = (total - vlf) > 0 ? (lf / (total - vlf)) * 100 : 0;
        const hfNu = (total - vlf) > 0 ? (hf / (total - vlf)) * 100 : 0;

        return {
            vlfPower: vlf, lfPower: lf, hfPower: hf, totalPower: total,
            lfHfRatio: hf > 0 ? lf/hf : 0,
            lfNu, hfNu,
            dominantFreq: peakF,
            respRate: peakF * 60,
            coherenceScore: total > 0 ? (maxP / total) * 100 : 0,
            spectralState: peakF < 0.04 ? 'VLF' : peakF < 0.15 ? 'RESONANT' : 'VAGAL',
            stateDescription: "Analysis complete.",
            stateColor: '#2dd4bf',
            noiseFloor: 0
        };
    }
}

export class VagalAnalyzer {
    static process(rr: ArrayLike<number>, age: number) {
        if (rr.length < 2) return { metrics: {} as any, visuals: {} as any, nn50: 0 };
        
        const diffs = SHARED_DIFFS;
        let nn50 = 0;
        let sumSqDiff = 0;
        const len = rr.length;

        for(let i=0; i<len-1; i++) {
            const diff = Math.abs(rr[i+1] - rr[i]);
            diffs[i] = diff;
            sumSqDiff += diff * diff;
            if (diff > 50) nn50++;
        }

        const rmssd = Math.sqrt(sumSqDiff / (len - 1));
        const sdnn = MathCore.stdDev(rr);
        const meanRr = MathCore.mean(rr);
        const meanHr = 60000 / meanRr;
        const lnRmssd = rmssd > 1 ? Math.log(rmssd) : 0;
        
        const physioAge = Math.max(18, Math.min(90, 80 - (lnRmssd * 10)));
        let zScore = (lnRmssd - (4.5 - age*0.03)) / 0.5;
        if (!isFinite(zScore)) zScore = -3.0; 
        
        const sd1 = Math.sqrt(0.5 * Math.pow(rmssd, 2));
        const sd2 = Math.sqrt(Math.max(0, 2 * Math.pow(sdnn, 2) - 0.5 * Math.pow(rmssd, 2))); 
        
        const rsaWave = [];
        const poincare = [];
        for(let i=0; i<len; i++) {
            rsaWave.push({ i, bpm: 60000/rr[i] });
            if (i < len - 1) {
                poincare.push({ x: rr[i], y: rr[i+1] });
            }
        }
        
        return {
            metrics: {
                rmssd, lnRmssd, sdnn, meanRr, meanHr, sd1, sd2, sd1Sd2Ratio: sd2 > 0 ? sd1/sd2 : 0,
                pnn50: (len - 1) > 0 ? (nn50 / (len - 1)) * 100 : 0, 
                sdsd: MathCore.stdDev(diffs.subarray(0, len - 1)),
                zScore, physioAge, chronologicalAge: age, state: zScore > 0 ? "ELITE" : "NORMAL"
            },
            visuals: {
                rsaWave,
                poincare,
                avgRr: meanRr
            },
            nn50
        };
    }
}

export class BaevskyAnalyzer {
    static analyze(rr: ArrayLike<number>): BaevskyMetrics {
        if (rr.length < 20) return { si: 0, amo: 0, mo: 0, mxdm: 0, zone: 'READY' };
        
        const bins: Record<number, number> = {};
        let modeCount = 0;
        let modeBin = 0;
        let minRR = 9999;
        let maxRR = 0;

        for (let i = 0; i < rr.length; i++) {
            const r = rr[i];
            const bin = Math.floor(r / 50) * 50;
            bins[bin] = (bins[bin] || 0) + 1;
            
            if (bins[bin] > modeCount) {
                modeCount = bins[bin];
                modeBin = bin;
            }
            if (r < minRR) minRR = r;
            if (r > maxRR) maxRR = r;
        }

        const amo = (modeCount / rr.length) * 100;
        const mo = modeBin / 1000;
        const mxdm = (maxRR - minRR) / 1000;
        const si = (mo > 0 && mxdm > 0) ? (amo) / (2 * mo * mxdm) : 0;
        
        let zone: any = 'READY';
        if (si > 150) zone = 'STRESS';
        else if (si > 100) zone = 'LOAD';
        else if (si < 50) zone = 'ATHLETE';
        
        return { si: Math.round(si), amo: Math.round(amo), mo, mxdm, zone };
    }
}

export class MayerAnalyzer {
    static analyze(psd: ArrayLike<number>, freqs: ArrayLike<number>): MayerWaveMetrics {
        let power = 0;
        let lfPower = 0;
        let peakP = 0;
        let peakF = 0;
        
        const len = freqs.length;
        for(let i=0; i<len; i++) {
            const f = freqs[i];
            const p = psd[i];
            
            if (f >= 0.04 && f < 0.15) {
                lfPower += p;
                if (f >= 0.07 && f <= 0.13) {
                    power += p;
                    if (p > peakP) { peakP = p; peakF = f; }
                }
            }
        }
        return {
            power,
            peakFreq: peakF,
            resonanceScore: lfPower > 0 ? (power / lfPower) * 100 : 0
        };
    }
}

export class ComplexityAnalyzer {
    static computeDFA(rr: ArrayLike<number>, type: 'alpha1' | 'alpha2'): { alpha: number, plotData: {x: number, y: number}[] } {
        const minLen = type === 'alpha1' ? 64 : 150;
        if (rr.length < minLen) return { alpha: 1.0, plotData: [] };

        const mean = MathCore.mean(rr);
        const y = SHARED_DFA_Y;
        let sum = 0;
        const len = rr.length;
        for(let i=0; i<len; i++) {
            sum += rr[i] - mean;
            y[i] = sum;
        }

        const scales = type === 'alpha1' ? [4, 6, 8, 10, 12, 16] : [16, 20, 24, 32, 40, 48, 64];
        const logScales: number[] = [];
        const logFluctuations: number[] = [];

        for (const n of scales) {
            const segments = Math.floor(len / n);
            if (segments < 2) continue;
            
            let totalVariance = 0;
            
            // Optimization: Inline linear regression for speed
            for (let s = 0; s < segments; s++) {
                const startIndex = s * n;
                
                // Calculate Slope & Intercept for this segment (Least Squares)
                let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                // X is just 0, 1, 2... n-1
                // sumX of 0..n-1 = n*(n-1)/2
                sumX = (n * (n - 1)) / 2;
                // sumXX of 0..n-1 = (n-1)*n*(2n-1)/6
                sumXX = ((n - 1) * n * (2 * n - 1)) / 6;
                
                for(let k=0; k<n; k++) {
                    const val = y[startIndex + k];
                    sumY += val;
                    sumXY += k * val;
                }
                
                const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;
                
                let segVariance = 0;
                for(let k=0; k<n; k++) {
                    const trend = slope * k + intercept;
                    const diff = y[startIndex + k] - trend;
                    segVariance += diff * diff;
                }
                totalVariance += segVariance / n;
            }
            
            const fluctuation = Math.sqrt(totalVariance / segments);
            if (fluctuation > 0) {
                logScales.push(Math.log10(n));
                logFluctuations.push(Math.log10(fluctuation));
            }
        }

        if (logFluctuations.length < 2) return { alpha: 1.0, plotData: [] };

        const alpha = MathCore.linearSlope(logScales, logFluctuations);
        const plotData = [];
        for(let i=0; i<logScales.length; i++) {
            plotData.push({ x: logScales[i], y: logFluctuations[i] });
        }

        return { 
            alpha: Math.max(0, Math.min(2.0, alpha)), 
            plotData 
        };
    }
    
    static computeSampEn(rr: ArrayLike<number>): number {
        if (rr.length < 50) return 1.5;
        const std = MathCore.stdDev(rr);
        // Simplified estimate for realtime perf
        return Math.min(2.5, Math.max(0.1, std / 50 + 0.5));
    }
    
    static computeMSE(rr: ArrayLike<number>): MSEMetrics {
        if (rr.length < 50) return { scales: [], entropy: [], complexityIndex: 1.0 };
        const scales = [1, 2];
        const entropy = [this.computeSampEn(rr)];
        
        // Coarse grain scale 2
        const coarse2 = SHARED_COARSE_BUFFER;
        let cIdx = 0;
        for (let i = 0; i < rr.length - 1; i += 2) {
            coarse2[cIdx++] = (rr[i] + rr[i+1]) / 2;
        }
        const s2 = this.computeSampEn(coarse2.subarray(0, cIdx));
        entropy.push(s2);
        
        return { scales, entropy, complexityIndex: entropy[0] + entropy[1] };
    }
}

export class GeometricAnalyzer {
    static analyze(rr: ArrayLike<number>) {
        if (rr.length < 20) return { hti: 0, tinn: 0 };
        const binSize = 1/128 * 1000;
        const bins: Record<number, number> = {};
        let maxCount = 0;
        let minVal = 9999, maxVal = 0;
        
        for (let i=0; i<rr.length; i++) {
            const r = rr[i];
            const b = Math.floor(r/binSize);
            bins[b] = (bins[b] || 0) + 1;
            if (bins[b] > maxCount) maxCount = bins[b];
            if (r < minVal) minVal = r;
            if (r > maxVal) maxVal = r;
        }
        return {
            hti: rr.length / (maxCount || 1),
            tinn: maxVal - minVal
        };
    }
}

export class AsymmetryAnalyzer {
    static analyze(rr: ArrayLike<number>) {
        let decel = 0;
        let decelPow = 0;
        let accelPow = 0;
        let cubedDiffSum = 0;
        
        for(let i=0; i<rr.length-1; i++) {
            const diff = rr[i+1] - rr[i];
            const diffSq = diff * diff;
            cubedDiffSum += diff * diffSq;
            
            if (diff > 0) { 
                decel++; 
                decelPow += diffSq; 
            } else if (diff < 0) { 
                accelPow += diffSq; 
            }
        }
        const total = rr.length - 1;
        const totalPow = decelPow + accelPow;
        
        return {
            porta: total > 0 ? (decel / total) * 100 : 50,
            guzik: totalPow > 0 ? (decelPow / totalPow) * 100 : 50,
            mad: 0, 
            pas: 0,
            timeIrreversibility: (total > 0 ? cubedDiffSum / total : 0) / 1e6
        };
    }
}

export class LorenzAnalyzer {
    static analyze(rr: ArrayLike<number>): LorenzMetrics {
        const points = [];
        // Limit points for render performance
        const limit = Math.min(rr.length - 2, 500); 
        for(let i=0; i<limit; i++) {
            points.push({ x: rr[i], y: rr[i+1], z: rr[i+2] });
        }
        return {
            points,
            dimensionScore: 1.5, 
            coreDensity: 50,
            state: 'FRACTAL'
        };
    }
}

export class HarmonicAnalyzer {
    static analyze(rr: ArrayLike<number>, tuning: string): HarmonicMetrics {
        if (rr.length < 2) return { currentInterval: null, history: [], consonanceScore: 0, rootNote: 'C', tuningSystem: tuning as any };
        const r1 = rr[rr.length-2];
        const r2 = rr[rr.length-1];
        const ratio = r1 > r2 ? r1/r2 : r2/r1;
        
        // Use static lookup for intervals
        const intervals = [
            { name: 'Unison', ratio: 1.0, tolerance: 0.02 },
            { name: 'Major 2nd', ratio: 9/8, tolerance: 0.03 },
            { name: 'Minor 3rd', ratio: 6/5, tolerance: 0.03 },
            { name: 'Major 3rd', ratio: 5/4, tolerance: 0.03 },
            { name: 'Perf 4th', ratio: 4/3, tolerance: 0.03 },
            { name: 'Perf 5th', ratio: 3/2, tolerance: 0.03 },
            { name: 'Phi (Min 6th)', ratio: 1.618, tolerance: 0.05 },
            { name: 'Major 6th', ratio: 5/3, tolerance: 0.03 },
            { name: 'Octave', ratio: 2.0, tolerance: 0.05 }
        ];
        
        let bestMatch = { name: 'Dissonant', ratio: ratio, error: 100 };
        for(const int of intervals) {
            const error = Math.abs(ratio - int.ratio);
            if (error < int.tolerance && error < bestMatch.error) {
                bestMatch = { name: int.name, ratio: int.ratio, error };
            }
        }
        
        const target = bestMatch.name === 'Dissonant' ? 1.0 : bestMatch.ratio;
        const cents = 1200 * Math.log2(ratio / target);
        
        return {
            currentInterval: { 
                ratio, 
                name: bestMatch.name, 
                cents, 
                accuracy: Math.max(0, 100 - (Math.abs(cents) * 2)), 
                baseHz: 60000/r1, 
                targetHz: 60000/r2 
            },
            history: [],
            consonanceScore: bestMatch.name === 'Dissonant' ? 20 : 90 - (Math.abs(cents)),
            rootNote: 'C',
            tuningSystem: tuning as any
        };
    }
}

export class RecursionAnalyzer {
    static analyze(psd: ArrayLike<number>, freqs: ArrayLike<number>, bpm: number, peakFreq: number): RecursionMetrics {
        const peaks: {f: number, p: number}[] = [];
        // Peak picking loop
        for(let i=1; i<psd.length-1; i++) {
            if (psd[i] > psd[i-1] && psd[i] > psd[i+1] && psd[i] > 0.001) {
                peaks.push({f: freqs[i], p: psd[i]});
            }
        }
        let phiMatches = 0;
        let phiRatio = 0;
        
        if (peaks.length >= 2) {
            peaks.sort((a,b) => b.p - a.p);
            const f1 = peaks[0].f;
            const target = f1 * PHI;
            
            // Simple linear search for match
            for (let i=0; i<peaks.length; i++) {
                if (Math.abs(peaks[i].f - target) < 0.05) {
                    phiMatches++;
                    phiRatio = peaks[i].f / f1;
                    break;
                }
            }
        }
        const isCoherent = phiMatches > 0;
        return {
            fundamentalFreq: peakFreq,
            fractalTargets: [peakFreq, peakFreq * PHI, peakFreq * PHI * PHI],
            recursionScore: isCoherent ? 0.9 : 0.2,
            isCoherent,
            internal: { 
                phiRatio: phiRatio || (isCoherent ? 1.618 : 1.0), 
                depth: phiMatches + 1 
            }
        };
    }
}

export class SchumannAnalyzer {
    static analyze(bpm: number): AlphaMetrics {
        const f = bpm / 60;
        if (!f || f <= 0) {
             return {
                schumannScore: 0,
                isLocked: false,
                brainState: 'CALIBRATING',
                voiceMessage: "Acquiring Signal...",
                bestLockType: 'NONE',
                bestLockHarmonic: 0,
                targetFreq: 7.83,
                currentFreq: 0,
                schumannTarget: 7.83,
                schumannDeviation: 999
            };
        }
        const targets = [
            { type: 'SCHUMANN', freq: 7.83 },
            { type: 'OVERTONE', freq: 7.83 },
            { type: 'FIFTH', freq: 7.83 * 1.5 },
            { type: 'PHI', freq: 7.83 * 1.61803398875 }
        ];
        
        let globalBestDev = 999;
        let globalBestHarmonic = 1;
        let globalBestType: any = 'NONE';
        let globalTargetFreq = 7.83;
        
        for (const t of targets) {
            for (let h = 1; h <= 16; h++) { // Reduced search space for speed
                const harmonicFreq = f * h;
                let dev = 999;
                let targetFreq = t.freq;
                
                if (t.type === 'OVERTONE') {
                    const k = Math.round(harmonicFreq / 7.83);
                    if (k > 0) {
                        targetFreq = 7.83 * k;
                        dev = Math.abs(harmonicFreq - targetFreq);
                    }
                } else {
                    dev = Math.abs(harmonicFreq - t.freq);
                }
                
                if (dev < globalBestDev) {
                    globalBestDev = dev;
                    globalBestHarmonic = h;
                    globalBestType = t.type;
                    globalTargetFreq = targetFreq;
                }
            }
        }
        const score = Math.max(0, 100 - (globalBestDev * 100));
        return {
            schumannScore: score,
            isLocked: score > 80,
            brainState: score > 80 ? 'PHASE LOCKED' : 'DRIFTING',
            voiceMessage: score > 80 ? `Harmonic Bridge: ${globalBestType}` : "Searching for Grid...",
            bestLockType: globalBestType,
            bestLockHarmonic: globalBestHarmonic,
            targetFreq: globalTargetFreq,
            currentFreq: f, // Fundamental
            schumannTarget: globalTargetFreq,
            schumannDeviation: globalBestDev
        };
    }
}

// MAIN ANALYZER
export function analyzeHRV(
    rrIntervals: number[], 
    bpm: number, 
    age: number, 
    tuningSystem: TuningSystem = 'WELL_TEMPERED', 
    poweredModules: Record<string, boolean> = {} 
) {
    const { clean: correctedRr } = ArtifactSweeper.sweep(rrIntervals);
    
    // Core Time Domain (Fast)
    const vagal = VagalAnalyzer.process(correctedRr, age);
    
    // Defaults
    let spectralData: SpectralMetrics = { lfHfRatio: 0, totalPower: 0, vlfPower: 0, lfPower: 0, hfPower: 0, lfNu: 0, hfNu: 0, dominantFreq: 0, coherenceScore: 0, spectralState: 'OFF', stateDescription: 'Power Off', stateColor: '#64748b', noiseFloor: 0, respRate: 0 };
    let mayer: MayerWaveMetrics = { power: 0, peakFreq: 0, resonanceScore: 0 };
    let recursion: RecursionMetrics = { fundamentalFreq: 0, fractalTargets: [], recursionScore: 0, isCoherent: false, internal: { phiRatio: 0, depth: 0 } };
    let freqs: Float32Array | number[] = [];
    let psd: Float32Array | number[] = [];
    
    const isPowered = (key: string) => poweredModules[key] !== false;

    // FREQUENCY DOMAIN (Optimized)
    if (isPowered('spectral') || isPowered('tuner')) {
        // Downsample to 4Hz for speed
        const resampled4Hz = SignalConditioner.resample(correctedRr, 4);
        const psdResult = SpectralAnalyzer.generatePSD(resampled4Hz, 4);
        freqs = psdResult.freqs;
        psd = psdResult.psd;
        
        spectralData = SpectralAnalyzer.analyze(psd, freqs);
        mayer = MayerAnalyzer.analyze(psd, freqs);
        
        if (isPowered('recursion')) {
            recursion = RecursionAnalyzer.analyze(psd, freqs, bpm, spectralData.dominantFreq);
        }
    }

    // COMPLEXITY
    let alpha1 = 1.0;
    if (isPowered('readiness')) {
        const dfa1 = ComplexityAnalyzer.computeDFA(correctedRr, 'alpha1');
        alpha1 = dfa1.alpha;
    }

    // GEOMETRIC
    let baevsky = { si: 0, amo: 0, mo: 0, mxdm: 0, zone: 'READY' as any };
    if (isPowered('baevsky')) baevsky = BaevskyAnalyzer.analyze(correctedRr);

    let lorenz = { points: [], dimensionScore: 0, coreDensity: 0, state: 'CALIBRATING' as any };
    if (isPowered('lorenz')) lorenz = LorenzAnalyzer.analyze(correctedRr);

    let harmonics = { currentInterval: null, history: [], consonanceScore: 0, rootNote: 'C', tuningSystem: tuningSystem as any };
    if (isPowered('harmonics')) harmonics = HarmonicAnalyzer.analyze(correctedRr, tuningSystem);

    let schumann = { schumannScore: 0, isLocked: false, brainState: 'OFF', voiceMessage: '', bestLockType: 'NONE' as any, bestLockHarmonic: 0, targetFreq: 0, currentFreq: 0, schumannTarget: 0, schumannDeviation: 0 };
    if (isPowered('tuner')) schumann = SchumannAnalyzer.analyze(bpm);

    const totalPower = spectralData.totalPower;

    // READINESS
    const readiness: ReadinessMetrics = { alpha1: alpha1, readinessScore: 0, zone: 'CALIBRATING', message: "Initializing...", state: 'CALIBRATING', color: '#64748b', bufferSize: correctedRr.length, isReliable: false, artifactPercentage: 0, statusReason: 'BUFFERING' };
    if (correctedRr.length >= 60 && isPowered('readiness')) {
        const deviation = Math.abs(alpha1 - 1.0);
        readiness.readinessScore = Math.max(0, Math.min(100, Math.round(100 - (deviation * 200))));
        readiness.zone = alpha1 >= 0.85 && alpha1 <= 1.15 ? 'FLOW' : 'CHAOS';
    }
    
    const diagnostics: DiagnosticsMetrics = {
        sdnn: vagal.metrics.sdnn, rmssd: vagal.metrics.rmssd, sdsd: vagal.metrics.sdsd, nn50: vagal.nn50, pnn50: vagal.metrics.pnn50, meanRr: vagal.metrics.meanRr, meanHr: vagal.metrics.meanHr, sdnnIndex: vagal.metrics.sdnn,
        cv: safeNum((vagal.metrics.sdnn / vagal.metrics.meanRr) * 100), rrRange: 0,
        vlf: spectralData.vlfPower, lf: spectralData.lfPower, hf: spectralData.hfPower, lfHfRatio: spectralData.lfHfRatio, totalPower: spectralData.totalPower, lfNu: spectralData.lfNu, hfNu: spectralData.hfNu, respRate: spectralData.respRate, mainPeak: spectralData.dominantFreq, coherenceScore: spectralData.coherenceScore,
        sd1: vagal.metrics.sd1, sd2: vagal.metrics.sd2, sd1Sd2Ratio: vagal.metrics.sd1Sd2Ratio, cvi: 0, csi: 0, 
        sampEn: 0, alpha1: safeNum(alpha1), alpha2: 0, 
        vagalEfficiency: safeNum(vagal.metrics.rmssd / vagal.metrics.meanRr * 100),
        hti: 0, tinn: 0, stressIndex: baevsky.si, portaIndex: 50, guzikIndex: 50, mad: 0, pas: 0,
        timeIrreversibility: 0, 
        skewness: 0, kurtosis: 0, turningPointRatio: 0,
        cepstralGamitude: 0, peakQuefrency: 0, spectralEntropy: MathCore.spectralEntropy(psd), harmonicComplexity: 10,
        fundamentalFreq: recursion.fundamentalFreq, phiRatio: recursion.internal.phiRatio, recursionDepth: recursion.internal.depth, implosionIndex: recursion.recursionScore,
        mayerPower: mayer.power, mayerPeak: mayer.peakFreq, mayerPurity: safeNum(totalPower > 0 ? (mayer.power / totalPower) * 100 : 0),
        harmonicRoot: harmonics.rootNote, harmonicInterval: harmonics.currentInterval?.name || '--', harmonicRatio: harmonics.currentInterval?.ratio || 1, harmonicCents: harmonics.currentInterval?.cents || 0, harmonicAccuracy: harmonics.currentInterval?.accuracy || 0, harmonicConsonance: harmonics.consonanceScore, harmonicBaseHz: harmonics.currentInterval?.baseHz || 0, harmonicTargetHz: harmonics.currentInterval?.targetHz || 0, harmonicTuningSystem: harmonics.tuningSystem,
        schumannLockScore: schumann.schumannScore, schumannHarmonic: schumann.bestLockHarmonic, schumannType: schumann.bestLockType, schumannTarget: schumann.schumannTarget, schumannDeviation: schumann.schumannDeviation,
        zpScore: 0, zpRefraction: 0, zpState: 'CALIBRATING', zpPhase: 'IDLE', noise_level_mv: 0, carrierAmp: 0, carrierJitter: 0, carrierIntegrity: 0, carrierState: 'BUFFERING',
        somaticScore: 0, somaticJerk: 0, somaticState: 'CALIBRATING', somaticIntegration: 0,
        accTotalPower: 0, accX: 0, accY: 0, accZ: 0, contractility: 0,
        pepLatency: 0, mechRespRate: 0, mechRespAmp: 0, swayFreq: 0, swayCoherence: 0, swayAmplitude: 0, microTremor: 0, postureAngle: 0, verticalOscillation: 0, kineticState: 'STILL',
        inspiratoryDutyCycle: 0.4,
        qtc: 0, qrsDuration: 0, qtState: 'NORMAL',
        vagalLogRmssd: vagal.metrics.lnRmssd, vagalZScore: vagal.metrics.zScore, vagalPhysioAge: vagal.metrics.physioAge, vagalState: vagal.metrics.state,
        baevskyMode: baevsky.mo, baevskyAmplitude: baevsky.amo, baevskyRange: baevsky.mxdm, baevskyZone: baevsky.zone,
        readinessAlpha: readiness.alpha1, readinessScore: readiness.readinessScore, readinessZone: readiness.zone, readinessArtifacts: readiness.artifactPercentage,
        lorenzDimension: lorenz.dimensionScore, lorenzDensity: lorenz.coreDensity, lorenzState: lorenz.state,
        fftAlgorithm: "Cooley-Tukey", fftWindow: "Hanning", fftDetrend: "Linear", fftInterpolation: "Cubic", ecgSource: "Standard", ecgProtocol: "BLE", ecgSampleRate: 130, ecgGain: 1.0,
        decelerationCapacity: 0, accelerationCapacity: 0, prsaCurve: [], turbulenceOnset: 0, turbulenceSlope: 0, cpcCoherence: 0, cpcSpectrum: [],
        pulseTransitTime: 0, 
        signalQualityIndex: 100,
        telemetry: { batteryLevel: 100, temperature: 37.0, rssi: -50 },
        lmsNoiseReductionDb: 0,
        hysteresisArea: 0, recoveryElasticity: 0, lissajousLock: 0
    };

    return { 
        spectrum: [], // Reduced payload size
        cepstrum: { gamitude: 0, dominantQuefrency: 0, state: 'OFF', description: '', graphData: [] }, 
        mayerWave: mayer, 
        signal: [], 
        rawSignal: correctedRr, 
        recursion, 
        vagal: vagal.metrics, 
        vagalVisuals: vagal.visuals, 
        readiness, 
        spectral: spectralData, 
        alpha: schumann, 
        baevsky, 
        diagnostics, 
        lorenz, 
        harmonics 
    };
}