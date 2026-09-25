import { COLOR_WHEEL_PRESETS } from '../../data/colorWheels';
import type { HarmonicColorWheelId } from '../../data/colorWheels';
export { COLOR_WHEEL_PRESETS };
export type { HarmonicColorWheelId };

const COLOR_WHEEL_STORAGE_KEY = 'earthsync_harmonic_color_wheel';

const getInitialColorWheel = (): HarmonicColorWheelId => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem(COLOR_WHEEL_STORAGE_KEY) as HarmonicColorWheelId;
            if (saved && COLOR_WHEEL_PRESETS[saved]) {
                return saved;
            }
        }
    } catch {
        // Safe fallback for SSR or restricted environments
    }
    return 'MERRICK';
};

let activeColorWheelId: HarmonicColorWheelId = getInitialColorWheel();

type ColorWheelListener = (id: HarmonicColorWheelId) => void;
const colorWheelListeners = new Set<ColorWheelListener>();

export const subscribeColorWheel = (listener: ColorWheelListener): (() => void) => {
    colorWheelListeners.add(listener);
    return () => {
        colorWheelListeners.delete(listener);
    };
};

export const getActiveColorWheelId = (): HarmonicColorWheelId => activeColorWheelId;

export const setActiveColorWheelId = (id: HarmonicColorWheelId): void => {
    if (COLOR_WHEEL_PRESETS[id]) {
        activeColorWheelId = id;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(COLOR_WHEEL_STORAGE_KEY, id);
            }
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('harmonic_color_wheel_change', { detail: { id } }));
            }
        } catch {
            // Ignore storage errors
        }
        colorWheelListeners.forEach(listener => {
            try {
                listener(id);
            } catch (err) {
                console.error('Error in color wheel listener:', err);
            }
        });
    }
};

/**
 * Converts a frequency to its nearest 12-tone equal temperament pitch class and octave.
 * @param freq - The target frequency in Hertz.
 * @returns An object containing the noteIndex (0-11) and octave (integer).
 * @warning PURE FUNCTION. Return values must be integers.
 */
export const getPitchClass = (freq: number): { noteIndex: number, octave: number } => {
    if (freq <= 0) return { noteIndex: 0, octave: 0 };
    const midi = 69 + 12 * Math.log2(freq / 440);
    const roundedMidi = Math.round(midi);
    const noteIndex = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    return { noteIndex, octave };
};

/**
 * Custom Hue mapping based on Richard Merrick's Harmonic Interference theory.
 * @warning IMMUTABLE CONSTANT. DO NOT ALTER.
 */
export const MERRICK_HUES = [ 180, 210, 240, 270, 300, 360, 15, 30, 45, 60, 90, 135 ];

/**
 * Maps an acoustic frequency to a specific visual color based on harmonic intervals.
 * Dynamically uses the active color wheel preset (Merrick, Newton, Scriabin, Goethe, Vedic, etc.).
 * @param freq - Frequency in Hertz.
 * @param wheelId - Optional override for color wheel preset.
 * @returns An HSL object where `h`, `s`, and `l` are strictly bounded floats between 0.0 and 1.0.
 */
export const getFrequencyHSL = (freq: number, wheelId?: HarmonicColorWheelId): { h: number, s: number, l: number } => {
    if (freq <= 0) return { h: 0, s: 0, l: 0 };
    const semitones = 12 * Math.log2(freq / 256);
    let pitchClass = semitones % 12;
    if (pitchClass < 0) pitchClass += 12;
    const index = Math.floor(pitchClass);
    const fraction = pitchClass - index;
    const activePreset = COLOR_WHEEL_PRESETS[wheelId || activeColorWheelId] || COLOR_WHEEL_PRESETS.MERRICK;
    const hues = activePreset.hues;
    const hueStart = hues[index];
    let hueEnd = hues[(index + 1) % 12];
    if (hueEnd < hueStart && hueStart > 200) hueEnd += 360;
    else if (hueStart < 50 && hueEnd > 300) hueEnd -= 360; 
    let h = hueStart + (hueEnd - hueStart) * fraction;
    h = h % 360;
    if (h < 0) h += 360;
    const MIN_HZ = 20; const MAX_HZ = 1000;
    const safeFreq = Math.max(MIN_HZ, Math.min(MAX_HZ, freq));
    const spectrumProgress = Math.log2(safeFreq / MIN_HZ) / Math.log2(MAX_HZ / MIN_HZ);
    const s = 0.50 + (spectrumProgress * 0.50); 
    const l = 0.30 + (spectrumProgress * 0.40); 
    return { h: h / 360, s, l }; 
};

/**
 * Gets the active color wheel hex color for an exact frequency.
 * Replaces hardcoded Merrick color wheels across visualizers and controls.
 */
export const getActiveHarmonicColor = (freq: number, wheelId?: HarmonicColorWheelId): string => {
    if (freq <= 0) return '#06b6d4';
    const halfStepsFromC = 12 * Math.log2(freq / 256.0);
    const pitchClass = Math.round(halfStepsFromC + 1200) % 12;
    const activePreset = COLOR_WHEEL_PRESETS[wheelId || activeColorWheelId] || COLOR_WHEEL_PRESETS.MERRICK;
    return activePreset.colors[pitchClass] || '#22d3ee';
};

/**
 * @param freq - Frequency in Hertz.
 * @returns A strictly formatted CSS hsl() string.
 * @warning PURE FUNCTION.
 */
export const getFrequencyColor = (freq: number): string => {
    if (freq <= 0) return 'rgba(0,0,0,0)';
    const { h, s, l } = getFrequencyHSL(freq);
    return `hsl(${(h * 360).toFixed(1)}, ${(s * 100).toFixed(0)}%, ${(l * 100).toFixed(0)}%)`;
};

/**
 * @param hex - A standard hex color string (e.g., "#FFFFFF" or "FFFFFF").
 * @returns An RGB object with integer values 0-255.
 * @warning PURE FUNCTION.
 */
export const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 255, b: 255 };
};

/**
 * Interpolates between two colors.
 * @param c1 - CSS color string (hex or hsl).
 * @param c2 - CSS hex color string.
 * @param t - A float bounded exactly between 0.0 and 1.0.
 * @returns A CSS rgb() string.
 * @warning PURE FUNCTION. Automatically clamps `t` to [0, 1].
 */
export const lerpColor = (c1: string, c2: string, t: number) => {
    const safeT = Math.max(0, Math.min(1, t));
    if (c1.startsWith('hsl')) return c1;
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * safeT);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * safeT);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * safeT);
    return `rgb(${r},${g},${b})`;
};

/**
 * Maps frequency directly to standard 0-255 RGB values using Merrick's Hue table.
 * @param freq - Frequency in Hertz.
 * @returns Object with r, g, b as integers between 0 and 255.
 * @warning PURE FUNCTION.
 */
export const getFrequencyRGB = (freq: number, wheelId?: HarmonicColorWheelId): { r: number, g: number, b: number } => {
    const { h, s, l } = getFrequencyHSL(freq, wheelId);
    let r, g, b;
    if (s === 0) {
        r = g = b = l; 
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};