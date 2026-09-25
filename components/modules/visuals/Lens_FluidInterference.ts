import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyRGB } from './shared';
import { FluidEngineGL } from '../../../services/kinematics/FluidEngineGL';

// ── Color & Utility Helpers ───────────────────────────────────────────────────
const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const getInt = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? Math.floor(v) : parseInt(String(v), 10);
    return isNaN(num) ? fallback : num;
};

const getBool = (v: unknown, fallback: boolean): boolean => {
    if (v === undefined || v === null) return fallback;
    if (typeof v === 'boolean') return v;
    if (v === 'ON' || v === 'true' || v === 1) return true;
    if (v === 'OFF' || v === 'false' || v === 0) return false;
    return fallback;
};

const getStr = (v: unknown, fallback: string): string => {
    if (v === undefined || v === null || v === '') return fallback;
    return String(v);
};

interface RGB {
    r: number;
    g: number;
    b: number;
}

const hexToRgb = (hex: string): RGB => {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
        const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
        const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
        return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
    }
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
};

const rgbToCss = (rgb: RGB, alpha: number = 1.0): string => {
    const r = Math.max(0, Math.min(255, Math.round(rgb.r * 255)));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g * 255)));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b * 255)));
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
};

const hsvToRgb = (h: number, s: number, v: number): RGB => {
    const safeH = ((h % 1) + 1) % 1;
    const i = Math.floor(safeH * 6);
    const f = safeH * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    const c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]];
    const rgb = c[i % 6] || [v, v, v];
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
};

// Map of all known harmonic acoustic channels to their true frequencies
const CHANNEL_FREQ_MAP: Map<string, number> = new Map();
LATTICE_CHANNELS.forEach(ch => {
    if (ch.id && ch.freq) {
        CHANNEL_FREQ_MAP.set(ch.id, ch.freq);
    }
});

const resolveChannelFreq = (channelId: string, indexFallback: number): number => {
    if (CHANNEL_FREQ_MAP.has(channelId)) {
        return CHANNEL_FREQ_MAP.get(channelId)!;
    }
    const match = channelId.match(/\d+/);
    if (match) {
        const num = parseInt(match[0], 10);
        if (num >= 20 && num <= 2000) return num;
    }
    const solfeggio = [256, 384, 432, 528, 639, 741, 852, 963, 512, 72];
    return solfeggio[indexFallback % solfeggio.length];
};

const PHI = 1.618033988749895;

// ── Sacred Geometry Mandala Canvas Drawing Function ───────────────────────────
// Renders the glowing vector lines, concentric harmonic rings, and Platonic solid projections
// onto the transparent 2D canvas that floats over the WebGL fluid simulation.
const drawSacredGeometryMandala = (
    ctx: CanvasRenderingContext2D,
    logicalW: number,
    logicalH: number,
    normCx: number,
    normCy: number,
    dynamicR: number,
    totalRot: number,
    geometryMode: string,
    mandalaGlow: number,
    mandalaComplexity: number,
    c1: RGB,
    c2: RGB,
    c3: RGB,
    activeTones: Array<{ r: number; g: number; b: number; amp: number }>,
    userZoom: number,
    pulseEnergy: number
) => {
    if (mandalaGlow <= 0.001) return;

    const ctxCx = normCx * logicalW;
    const ctxCy = (1.0 - normCy) * logicalH;
    const baseDim = Math.min(logicalW, logicalH);
    const R = Math.max(12, dynamicR * baseDim);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(ctxCx, ctxCy);
    ctx.rotate(totalRot);

    // Primary & highlight vector colors modulated with active acoustic tones
    let mainColor = c1;
    let accentColor = c2;
    let coreColor = c3;

    if (activeTones.length > 0) {
        const topTone = activeTones[0];
        mainColor = {
            r: (c1.r * 0.4 + topTone.r * 0.6),
            g: (c1.g * 0.4 + topTone.g * 0.6),
            b: (c1.b * 0.4 + topTone.b * 0.6)
        };
        if (activeTones.length > 1) {
            const secondTone = activeTones[1];
            accentColor = {
                r: (c2.r * 0.4 + secondTone.r * 0.6),
                g: (c2.g * 0.4 + secondTone.g * 0.6),
                b: (c2.b * 0.4 + secondTone.b * 0.6)
            };
        }
    }

    const baseAlpha = Math.min(1.0, mandalaGlow * 0.82);
    const lineW = Math.max(0.8, 1.25 * userZoom);
    ctx.lineWidth = lineW;

    ctx.shadowBlur = Math.min(24, 10 * mandalaGlow * (1.0 + pulseEnergy * 0.3));
    ctx.shadowColor = rgbToCss(mainColor, baseAlpha * 0.9);

    const drawNodeDot = (x: number, y: number, radius: number = 3.0, color: RGB = coreColor) => {
        ctx.beginPath();
        ctx.arc(x, y, radius * (1.0 + pulseEnergy * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = rgbToCss(color, baseAlpha * 0.95);
        ctx.fill();
    };

    switch (geometryMode) {
        case 'SEED': {
            // Seed of Life (7 overlapping focal circles, 6 sacred Vesica Piscis petals, outer ring)
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.85);

            // Central circle
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.stroke();

            // 6 perimeter circles passing through center
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const px = Math.cos(a) * R;
                const py = Math.sin(a) * R;
                ctx.beginPath();
                ctx.arc(px, py, R, 0, Math.PI * 2);
                ctx.stroke();
                drawNodeDot(px, py, 2.5 * userZoom, accentColor);
            }

            // Outer enclosing concentric rings
            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, R * 2, 0, Math.PI * 2);
            ctx.stroke();

            if (mandalaComplexity >= 2) {
                ctx.beginPath();
                ctx.arc(0, 0, R * 2 + 4 * userZoom, 0, Math.PI * 2);
                ctx.stroke();

                // Hexagonal perimeter connecting the 6 petal centers
                ctx.beginPath();
                for (let i = 0; i <= 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const px = Math.cos(a) * R;
                    const py = Math.sin(a) * R;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            drawNodeDot(0, 0, 3.5 * userZoom, coreColor);
            break;
        }

        case 'FLOWER_OF_LIFE': {
            // Full Flower of Life (19 intersecting circles + double outer ring)
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.8);

            // Center circle
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.stroke();

            // Inner 6 (distance R)
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const px = Math.cos(a) * R;
                const py = Math.sin(a) * R;
                ctx.beginPath();
                ctx.arc(px, py, R, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Outer 12 circles of the 19-circle lattice
            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.65);
            const rSqrt3 = R * Math.sqrt(3);
            for (let i = 0; i < 6; i++) {
                // 6 circles at distance R*sqrt(3), offset by 30 deg
                const a1 = (i / 6) * Math.PI * 2 + Math.PI / 6;
                ctx.beginPath();
                ctx.arc(Math.cos(a1) * rSqrt3, Math.sin(a1) * rSqrt3, R, 0, Math.PI * 2);
                ctx.stroke();

                // 6 circles at distance 2R, aligned with inner 6
                const a2 = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(a2) * (2 * R), Math.sin(a2) * (2 * R), R, 0, Math.PI * 2);
                ctx.stroke();

                drawNodeDot(Math.cos(a2) * (2 * R), Math.sin(a2) * (2 * R), 2.2 * userZoom, coreColor);
            }

            // Double outer protective rings
            ctx.strokeStyle = rgbToCss(coreColor, baseAlpha * 0.6);
            ctx.beginPath();
            ctx.arc(0, 0, R * 2.85, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, R * 3.0, 0, Math.PI * 2);
            ctx.stroke();

            drawNodeDot(0, 0, 3.5 * userZoom, coreColor);
            break;
        }

        case 'METATRON': {
            // Metatron's Cube (13 Fruit of Life spheres + all 78 interconnecting vector lines)
            const pts: Array<[number, number]> = [[0, 0]];

            // 6 inner points (radius R)
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                pts.push([Math.cos(a) * R, Math.sin(a) * R]);
            }

            // 6 outer points (radius 2R)
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                pts.push([Math.cos(a) * (2 * R), Math.sin(a) * (2 * R)]);
            }

            // Interconnecting lines between all 13 points (Platonic solid vector lattice)
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.45);
            ctx.lineWidth = lineW * 0.85;
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    ctx.beginPath();
                    ctx.moveTo(pts[i][0], pts[i][1]);
                    ctx.lineTo(pts[j][0], pts[j][1]);
                    ctx.stroke();
                }
            }

            // Fruit of life spheres at each of the 13 centers
            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.85);
            ctx.lineWidth = lineW * 1.1;
            const sphereR = R * 0.32;
            pts.forEach(([px, py], idx) => {
                ctx.beginPath();
                ctx.arc(px, py, sphereR, 0, Math.PI * 2);
                ctx.stroke();
                drawNodeDot(px, py, idx === 0 ? 3.5 * userZoom : 2.5 * userZoom, coreColor);
            });

            // Outer boundary hexagon
            ctx.strokeStyle = rgbToCss(coreColor, baseAlpha * 0.6);
            ctx.beginPath();
            for (let i = 0; i <= 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const px = Math.cos(a) * (2 * R + sphereR);
                const py = Math.sin(a) * (2 * R + sphereR);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            break;
        }

        case 'SRI_YANTRA': {
            // Sri Yantra (9 interlocking Shiva & Shakti triangles + Lotus rings + Bindu point)
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.75);

            // 4 Upward Triangles (Shiva)
            const upHeights = [1.8 * R, 1.45 * R, 1.1 * R, 0.75 * R];
            const upWidths = [1.8 * R, 1.5 * R, 1.15 * R, 0.8 * R];
            upHeights.forEach((h, idx) => {
                const yTop = -h * 0.65;
                const yBottom = h * 0.35;
                const hw = upWidths[idx] * 0.5;
                ctx.beginPath();
                ctx.moveTo(0, yTop);
                ctx.lineTo(hw, yBottom);
                ctx.lineTo(-hw, yBottom);
                ctx.closePath();
                ctx.stroke();
            });

            // 5 Downward Triangles (Shakti)
            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.75);
            const downHeights = [1.9 * R, 1.6 * R, 1.3 * R, 0.95 * R, 0.6 * R];
            const downWidths = [1.85 * R, 1.55 * R, 1.25 * R, 0.9 * R, 0.55 * R];
            downHeights.forEach((h, idx) => {
                const yBottom = h * 0.65;
                const yTop = -h * 0.35;
                const hw = downWidths[idx] * 0.5;
                ctx.beginPath();
                ctx.moveTo(0, yBottom);
                ctx.lineTo(hw, yTop);
                ctx.lineTo(-hw, yTop);
                ctx.closePath();
                ctx.stroke();
            });

            // Concentric boundary rings
            ctx.strokeStyle = rgbToCss(coreColor, baseAlpha * 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, R * 1.85, 0, Math.PI * 2);
            ctx.stroke();

            // 8-Petal Lotus arcs around perimeter
            if (mandalaComplexity >= 2) {
                const lotusR = R * 1.85;
                ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.45);
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    const tipX = Math.cos(a) * (lotusR * 1.18);
                    const tipY = Math.sin(a) * (lotusR * 1.18);
                    const baseA1 = a - Math.PI / 16;
                    const baseA2 = a + Math.PI / 16;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(baseA1) * lotusR, Math.sin(baseA1) * lotusR);
                    ctx.quadraticCurveTo(tipX, tipY, Math.cos(baseA2) * lotusR, Math.sin(baseA2) * lotusR);
                    ctx.stroke();
                    drawNodeDot(tipX, tipY, 2.0 * userZoom, accentColor);
                }
            }

            // Central Golden Bindu Singularity
            drawNodeDot(0, 0, 4.0 * userZoom, coreColor);
            break;
        }

        case 'GOLDEN_SPIRAL': {
            // Dan Winter Phase Conjugate Golden Ratio (Phi) Vortex Implosion Cone
            // Counter-rotating logarithmic spirals meeting at the center zero point
            const numArms = 4;
            const b = 0.30635; // ln(Phi) / (pi / 2) -> Golden Spiral constant

            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.8);
            ctx.lineWidth = lineW * 1.1;

            for (let arm = 0; arm < numArms; arm++) {
                const baseA = (arm / numArms) * Math.PI * 2;

                // Clockwise inward spiral
                ctx.beginPath();
                const steps = 90;
                for (let s = 0; s <= steps; s++) {
                    const theta = (s / steps) * (Math.PI * 3.5);
                    const r = (R * 0.08) * Math.exp(b * theta);
                    if (r > R * 2.2) break;
                    const px = Math.cos(baseA + theta) * r;
                    const py = Math.sin(baseA + theta) * r;
                    if (s === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();

                // Counter-clockwise phase-conjugate opposing spiral
                ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.7);
                ctx.beginPath();
                for (let s = 0; s <= steps; s++) {
                    const theta = (s / steps) * (Math.PI * 3.5);
                    const r = (R * 0.08) * Math.exp(b * theta);
                    if (r > R * 2.2) break;
                    const px = Math.cos(baseA - theta) * r;
                    const py = Math.sin(baseA - theta) * r;
                    if (s === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            // Concentric Golden Ratio circles: R / Phi, R, R * Phi
            ctx.strokeStyle = rgbToCss(coreColor, baseAlpha * 0.4);
            const phiRadii = [R / PHI, R, R * PHI];
            phiRadii.forEach(pr => {
                ctx.beginPath();
                ctx.arc(0, 0, pr, 0, Math.PI * 2);
                ctx.stroke();
            });

            // Golden angle radial rays (137.5 deg)
            for (let i = 0; i < 8; i++) {
                const a = i * (137.5 * Math.PI / 180);
                const px = Math.cos(a) * (R * PHI);
                const py = Math.sin(a) * (R * PHI);
                drawNodeDot(px, py, 2.5 * userZoom, coreColor);
            }

            drawNodeDot(0, 0, 4.0 * userZoom, coreColor);
            break;
        }

        case 'TORUS_IMPLOSION': {
            // Nested Toroidal Vortex Cross-Sections & Magnetic Dipole Flux Streams
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.75);

            // Concentric throat, equator, and outer rim circles
            const throatR = R * 0.35;
            const equatorR = R * 1.0;
            const rimR = R * 1.75;

            ctx.beginPath();
            ctx.arc(0, 0, throatR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.65);
            ctx.beginPath();
            ctx.arc(0, 0, equatorR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = rgbToCss(coreColor, baseAlpha * 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, rimR, 0, Math.PI * 2);
            ctx.stroke();

            // 12 Toroidal magnetic flux loops (nested cardioid field lines)
            const loops = 12;
            for (let i = 0; i < loops; i++) {
                const rotA = (i / loops) * Math.PI * 2;
                ctx.save();
                ctx.rotate(rotA);
                ctx.strokeStyle = rgbToCss(i % 2 === 0 ? mainColor : accentColor, baseAlpha * 0.45);
                ctx.beginPath();
                // Cardioid loop from throat through rim and back
                ctx.ellipse(equatorR * 0.75, 0, equatorR * 0.65, throatR * 1.2, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                const rx = Math.cos(rotA) * equatorR;
                const ry = Math.sin(rotA) * equatorR;
                drawNodeDot(rx, ry, 2.2 * userZoom, coreColor);
            }

            drawNodeDot(0, 0, 3.5 * userZoom, coreColor);
            break;
        }

        case 'PENTAGRAM': {
            // Sacred Venus Pentagram (Phi Golden Ratio 5-Fold Symmetry)
            const pts: Array<[number, number]> = [];
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                pts.push([Math.cos(a) * R, Math.sin(a) * R]);
            }

            // Outer circumscribed pentagon
            ctx.strokeStyle = rgbToCss(coreColor, baseAlpha * 0.5);
            ctx.beginPath();
            for (let i = 0; i <= 5; i++) {
                const pt = pts[i % 5];
                if (i === 0) ctx.moveTo(pt[0], pt[1]);
                else ctx.lineTo(pt[0], pt[1]);
            }
            ctx.stroke();

            // Golden Pentagram star (connecting vertices 2 apart)
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.85);
            ctx.lineWidth = lineW * 1.2;
            ctx.beginPath();
            let curr = 0;
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let step = 1; step <= 5; step++) {
                curr = (curr + 2) % 5;
                ctx.lineTo(pts[curr][0], pts[curr][1]);
            }
            ctx.stroke();

            // Inner inverted golden pentagram (ratio 1 / Phi^2)
            const innerR = R / (PHI * PHI);
            const innerPts: Array<[number, number]> = [];
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI;
                innerPts.push([Math.cos(a) * innerR, Math.sin(a) * innerR]);
            }
            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.7);
            ctx.beginPath();
            let inCurr = 0;
            ctx.moveTo(innerPts[0][0], innerPts[0][1]);
            for (let step = 1; step <= 5; step++) {
                inCurr = (inCurr + 2) % 5;
                ctx.lineTo(innerPts[inCurr][0], innerPts[inCurr][1]);
            }
            ctx.stroke();

            // Venus Rose 10-petal floral boundary: r = R * (1 + 0.3 * cos(5 theta))
            if (mandalaComplexity >= 2) {
                ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.4);
                ctx.beginPath();
                const vSteps = 100;
                for (let s = 0; s <= vSteps; s++) {
                    const theta = (s / vSteps) * Math.PI * 2;
                    const r = (R * 1.35) * (1.0 + 0.28 * Math.cos(5 * theta));
                    const px = Math.cos(theta) * r;
                    const py = Math.sin(theta) * r;
                    if (s === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            pts.forEach(([px, py]) => drawNodeDot(px, py, 3.0 * userZoom, coreColor));
            drawNodeDot(0, 0, 3.5 * userZoom, coreColor);
            break;
        }

        default: {
            // N-Fold Concentric Harmonic Lattice
            const folds = Math.max(3, Math.min(24, Math.round(dynamicR * 40)));
            ctx.strokeStyle = rgbToCss(mainColor, baseAlpha * 0.7);
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = rgbToCss(accentColor, baseAlpha * 0.5);
            for (let i = 0; i < folds; i++) {
                const a = (i / folds) * Math.PI * 2;
                const px = Math.cos(a) * R;
                const py = Math.sin(a) * R;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(px, py);
                ctx.stroke();
                drawNodeDot(px, py, 2.2 * userZoom, coreColor);
            }
            drawNodeDot(0, 0, 3.5 * userZoom, coreColor);
            break;
        }
    }

    ctx.restore();
};

// ── Curated Presets with Full Modulation Matrix Integration ───────────────────
// Rules strictly followed:
// - Sliders represent static baseline values (min, max, step, defaultValue)
// - Sliders are animated dynamically using the Modulation Matrix (modulations object)
// - Binaural pulse animates glowIntensity (Sacred Glow / Bloom)
// - Heartbeat animates tailTrail (Trippy Tail Trails / Dye Persistence)
// - Respiration animates emitterSpread (Mandala Expansion / Contraction)
// - Coherence animates mandalaGlow (Sacred Geometry Lattice Luminance)
// - Coherence & Heart animates phaseConjugation (Centripetal Implosion Suction)
const PRESETS: VisualizerPreset[] = [
    {
        id: 'fluid_zen_phase_conjugate_implosion',
        name: '01. Phase Conjugate Implosion (Dan Winter Φ-Cone)',
        config: {
            kaleidoscope: 8,
            geometryMode: 'GOLDEN_SPIRAL',
            mandalaGlow: 0.85,
            mandalaComplexity: 3,
            emitterSpread: 0.16,
            vortexRotationSpeed: 0.003,
            phaseConjugation: 1.10,
            tailTrail: 0.990,
            stirForce: 7.0,
            curl: 1.4,
            velocityDissipation: 0.05,
            pressure: 0.92,
            glowIntensity: 0.65,
            bloom: 'ON',
            bloomThreshold: 0.55,
            bloomSoftKnee: 0.80,
            toneReactivity: 1.0,
            colorMode: 'Tone Harmonic',
            color1: '#00f5d4',
            color2: '#7928ca',
            color3: '#4361ee',
            backColor: '#02040a',
            dyeLuminosity: 0.10,
            saturation: 1.30,
            splatRadius: 0.16,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.25, max: 1.05, amtBinaural: 0.80, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.94, max: 0.997, amtHeart: 0.85, mixMode: 'ADD' },
            emitterSpread: { enabled: true, min: 0.08, max: 0.28, amtBreath: 1.25, mixMode: 'ADD' },
            mandalaGlow: { enabled: true, min: 0.35, max: 1.25, amtCoh: 0.90, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 0.40, max: 1.70, amtHeart: 0.60, amtCoh: 0.50, mixMode: 'ADD' }
        }
    },
    {
        id: 'fluid_zen_metatron_crystal_star',
        name: '02. Metatron\'s Crystal Star (13-Circle Matrix)',
        config: {
            kaleidoscope: 12,
            geometryMode: 'METATRON',
            mandalaGlow: 0.95,
            mandalaComplexity: 4,
            emitterSpread: 0.17,
            vortexRotationSpeed: 0.0025,
            phaseConjugation: 0.90,
            tailTrail: 0.988,
            stirForce: 6.5,
            curl: 1.2,
            velocityDissipation: 0.05,
            pressure: 0.92,
            glowIntensity: 0.60,
            bloom: 'ON',
            bloomThreshold: 0.56,
            bloomSoftKnee: 0.80,
            toneReactivity: 1.0,
            colorMode: 'Tone Harmonic',
            color1: '#ffb703',
            color2: '#fb5607',
            color3: '#ff006e',
            backColor: '#0a0208',
            dyeLuminosity: 0.10,
            saturation: 1.35,
            splatRadius: 0.15,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.20, max: 0.95, amtBinaural: 0.75, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.93, max: 0.995, amtHeart: 0.80, mixMode: 'ADD' },
            emitterSpread: { enabled: true, min: 0.09, max: 0.29, amtBreath: 1.20, mixMode: 'ADD' },
            mandalaGlow: { enabled: true, min: 0.45, max: 1.35, amtCoh: 0.85, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 0.30, max: 1.50, amtPulse: 0.70, mixMode: 'ADD' }
        }
    },
    {
        id: 'fluid_zen_sri_yantra_hologram',
        name: '03. Sri Yantra Hologram (Cosmic Nine Pyramids)',
        config: {
            kaleidoscope: 6,
            geometryMode: 'SRI_YANTRA',
            mandalaGlow: 0.90,
            mandalaComplexity: 3,
            emitterSpread: 0.15,
            vortexRotationSpeed: 0.0035,
            phaseConjugation: 1.05,
            tailTrail: 0.992,
            stirForce: 7.5,
            curl: 1.5,
            velocityDissipation: 0.05,
            pressure: 0.90,
            glowIntensity: 0.55,
            bloom: 'ON',
            bloomThreshold: 0.58,
            bloomSoftKnee: 0.78,
            toneReactivity: 1.1,
            colorMode: 'Tone Harmonic',
            color1: '#38bdf8',
            color2: '#a855f7',
            color3: '#ec4899',
            backColor: '#020617',
            dyeLuminosity: 0.11,
            saturation: 1.25,
            splatRadius: 0.16,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.20, max: 0.90, amtBinaural: 0.70, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.94, max: 0.997, amtHeart: 0.85, amtPulse: 0.75, mixMode: 'ADD' },
            emitterSpread: { enabled: true, min: 0.07, max: 0.26, amtBreath: 1.35, mixMode: 'ADD' },
            mandalaGlow: { enabled: true, min: 0.40, max: 1.30, amtCoh: 0.90, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 0.35, max: 1.65, amtCoh: 0.80, mixMode: 'ADD' }
        }
    },
    {
        id: 'fluid_zen_flower_of_life_genesis',
        name: '04. Flower of Life Genesis (Hexagonal Resonator)',
        config: {
            kaleidoscope: 6,
            geometryMode: 'FLOWER_OF_LIFE',
            mandalaGlow: 0.80,
            mandalaComplexity: 3,
            emitterSpread: 0.16,
            vortexRotationSpeed: 0.0028,
            phaseConjugation: 0.80,
            tailTrail: 0.985,
            stirForce: 6.0,
            curl: 1.1,
            velocityDissipation: 0.05,
            pressure: 0.92,
            glowIntensity: 0.50,
            bloom: 'ON',
            bloomThreshold: 0.60,
            bloomSoftKnee: 0.80,
            toneReactivity: 0.95,
            colorMode: 'Tone Harmonic',
            color1: '#10b981',
            color2: '#06b6d4',
            color3: '#3b82f6',
            backColor: '#010f0b',
            dyeLuminosity: 0.10,
            saturation: 1.25,
            splatRadius: 0.16,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.18, max: 0.85, amtBinaural: 0.65, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.92, max: 0.992, amtHeart: 0.75, mixMode: 'ADD' },
            emitterSpread: { enabled: true, min: 0.09, max: 0.27, amtBreath: 1.15, mixMode: 'ADD' },
            mandalaGlow: { enabled: true, min: 0.30, max: 1.20, amtCoh: 0.75, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 0.30, max: 1.40, amtPulse: 0.65, mixMode: 'ADD' }
        }
    },
    {
        id: 'fluid_zen_venus_pentagram_rose',
        name: '05. Venus Pentagram Rose (Phi-Ratio Harmonic)',
        config: {
            kaleidoscope: 10,
            geometryMode: 'PENTAGRAM',
            mandalaGlow: 1.00,
            mandalaComplexity: 3,
            emitterSpread: 0.17,
            vortexRotationSpeed: 0.0022,
            phaseConjugation: 1.25,
            tailTrail: 0.994,
            stirForce: 7.2,
            curl: 1.3,
            velocityDissipation: 0.05,
            pressure: 0.92,
            glowIntensity: 0.70,
            bloom: 'ON',
            bloomThreshold: 0.54,
            bloomSoftKnee: 0.80,
            toneReactivity: 1.05,
            colorMode: 'Tone Harmonic',
            color1: '#f43f5e',
            color2: '#8b5cf6',
            color3: '#06b6d4',
            backColor: '#08010d',
            dyeLuminosity: 0.11,
            saturation: 1.35,
            splatRadius: 0.16,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.30, max: 1.10, amtBinaural: 0.85, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.95, max: 0.998, amtHeart: 0.90, mixMode: 'ADD' },
            emitterSpread: { enabled: true, min: 0.08, max: 0.30, amtBreath: 1.30, mixMode: 'ADD' },
            mandalaGlow: { enabled: true, min: 0.50, max: 1.45, amtCoh: 0.95, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 0.45, max: 1.85, amtHeart: 0.75, mixMode: 'ADD' }
        }
    },
    {
        id: 'fluid_zen_torus_implosion_singularity',
        name: '06. Torus Implosion Singularity (Zero-Point Dynamo)',
        config: {
            kaleidoscope: 16,
            geometryMode: 'TORUS_IMPLOSION',
            mandalaGlow: 0.85,
            mandalaComplexity: 4,
            emitterSpread: 0.15,
            vortexRotationSpeed: 0.0032,
            phaseConjugation: 1.50,
            tailTrail: 0.995,
            stirForce: 8.5,
            curl: 1.8,
            velocityDissipation: 0.04,
            pressure: 0.94,
            glowIntensity: 0.75,
            bloom: 'ON',
            bloomThreshold: 0.52,
            bloomSoftKnee: 0.82,
            toneReactivity: 1.15,
            colorMode: 'Tone Harmonic',
            color1: '#a855f7',
            color2: '#06b6d4',
            color3: '#facc15',
            backColor: '#020008',
            dyeLuminosity: 0.12,
            saturation: 1.40,
            splatRadius: 0.15,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.35, max: 1.20, amtBinaural: 0.90, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.95, max: 0.998, amtHeart: 0.90, mixMode: 'ADD' },
            emitterSpread: { enabled: true, min: 0.07, max: 0.28, amtBreath: 1.25, mixMode: 'ADD' },
            mandalaGlow: { enabled: true, min: 0.35, max: 1.25, amtCoh: 0.80, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 0.50, max: 2.00, amtHeart: 0.80, amtCoh: 0.70, mixMode: 'ADD' }
        }
    },
    {
        name: "07. Sonoluminescence Cavitation Singularity",
        category: "Laboratory Acoustic",
        config: {
            kaleidoscope: 0,
            geometryMode: 'SEED',
            mandalaGlow: 0.40,
            emitterSpread: 0.10,
            mandalaComplexity: 2,
            vortexRotationSpeed: 0.001,
            phaseConjugation: 1.80,
            tailTrail: 0.985,
            stirForce: 8.5,
            curl: 2.2,
            velocityDissipation: 0.04,
            pressure: 0.96,
            glowIntensity: 1.10,
            bloom: 'ON',
            bloomThreshold: 0.40,
            bloomSoftKnee: 0.75,
            toneReactivity: 1.4,
            colorMode: 'Custom',
            color1: '#38bdf8',
            color2: '#818cf8',
            color3: '#ffffff',
            backColor: '#010206',
            dyeLuminosity: 0.12,
            saturation: 1.25,
            splatRadius: 0.12,
            shading: 'ON',
            simRes: '128',
            dyeRes: '512',
            paused: 'OFF',
            masterOpacity: 1.0,
            vanDerWaalsCore: 0.12,
            bremsstrahlungGlow: 2.8
        },
        modulations: {
            glowIntensity: { enabled: true, min: 0.5, max: 1.5, amtBinaural: 1.0, mixMode: 'ADD' },
            phaseConjugation: { enabled: true, min: 1.0, max: 2.5, amtHeart: 0.9, mixMode: 'ADD' },
            tailTrail: { enabled: true, min: 0.96, max: 0.995, amtBreath: 0.8, mixMode: 'ADD' }
        }
    }
];

// ── Plugin Definition ─────────────────────────────────────────────────────────
export const Lens_FluidInterference: VisualizerPlugin = {
    id: 'FLUID_INTERFERENCE',
    name: 'Fluid Dynamic Mandala',
    renderType: 'WEBGL',

    parameters: [
        // ── KALEIDOSCOPE & SACRED GEOMETRY ────────────────────────────────────
        { id: 'kaleidoscope',        label: 'Mandala Symmetry Folds', icon: 'Compass',   type: 'SLIDER', min: 0,     max: 24,   step: 2,      color: '#c084fc', section: 'KALEIDOSCOPE', defaultValue: 8 },
        { id: 'geometryMode',        label: 'Sacred Geometry Lattice',icon: 'Layers',    type: 'SELECT', options: ['SEED', 'FLOWER_OF_LIFE', 'METATRON', 'SRI_YANTRA', 'GOLDEN_SPIRAL', 'TORUS_IMPLOSION', 'PENTAGRAM'], section: 'KALEIDOSCOPE', defaultValue: 'GOLDEN_SPIRAL' },
        { id: 'mandalaGlow',         label: 'Mandala Line Luminance', icon: 'Sparkles',  type: 'SLIDER', min: 0.0,   max: 1.50, step: 0.02,   color: '#38bdf8', section: 'KALEIDOSCOPE', defaultValue: 0.85 },
        { id: 'emitterSpread',       label: 'Mandala Base Radius',    icon: 'Maximize',  type: 'SLIDER', min: 0.05,  max: 0.40, step: 0.01,   color: '#22d3ee', section: 'KALEIDOSCOPE', defaultValue: 0.16 },
        { id: 'mandalaComplexity',   label: 'Lattice Ring Detail',    icon: 'Target',    type: 'SLIDER', min: 1,     max: 5,    step: 1,      color: '#67e8f9', section: 'KALEIDOSCOPE', defaultValue: 3 },
        { id: 'vortexRotationSpeed', label: 'Vortex Spin Rate',       icon: 'RotateCw',  type: 'SLIDER', min: -0.01, max: 0.01, step: 0.0005, color: '#34d399', section: 'KALEIDOSCOPE', defaultValue: 0.003 },

        // ── NAVIER-STOKES & PHASE CONJUGATE DYNAMICS ──────────────────────────
        { id: 'phaseConjugation',    label: 'Phase Conjugate Implosion', icon: 'Minimize', type: 'SLIDER', min: 0.0, max: 2.0, step: 0.05, color: '#a855f7', section: 'FLUID DYNAMICS', defaultValue: 1.10 },
        { id: 'tailTrail',           label: 'Trippy Tail Trail',      icon: 'Droplet',   type: 'SLIDER', min: 0.85,  max: 0.998,step: 0.001,color: '#ec4899', section: 'FLUID DYNAMICS', defaultValue: 0.990 },
        { id: 'stirForce',           label: 'Vortex Current Force',   icon: 'Activity',  type: 'SLIDER', min: 1,     max: 25,   step: 0.5,   color: '#06b6d4', section: 'FLUID DYNAMICS', defaultValue: 7.0 },
        { id: 'curl',                label: 'Silk Vorticity Swirl',   icon: 'Wind',      type: 'SLIDER', min: 0.0,   max: 5.0,  step: 0.1,   color: '#f43f5e', section: 'FLUID DYNAMICS', defaultValue: 1.4 },
        { id: 'velocityDissipation', label: 'Viscosity Dampening',    icon: 'Minimize',  type: 'SLIDER', min: 0.01,  max: 0.30, step: 0.005, color: '#6366f1', section: 'FLUID DYNAMICS', defaultValue: 0.05 },
        { id: 'pressure',            label: 'Fluid Incompressibility',icon: 'Minimize',  type: 'SLIDER', min: 0.6,   max: 1.0,  step: 0.01,  color: '#fbbf24', section: 'FLUID DYNAMICS', defaultValue: 0.92 },

        // ── BLOOM & SACRED AURA ───────────────────────────────────────────────
        { id: 'glowIntensity',       label: 'Sacred Glow Intensity',  icon: 'Sun',       type: 'SLIDER', min: 0.10,  max: 1.50, step: 0.02,  color: '#facc15', section: 'BLOOM', defaultValue: 0.65 },
        { id: 'bloom',               label: 'Luminous Bloom Glow',                       type: 'CUSTOM_TOGGLE', options: ['ON','OFF'], color: 'amber', section: 'BLOOM', defaultValue: 'ON' },
        { id: 'bloomThreshold',      label: 'Bloom Threshold',        icon: 'Target',    type: 'SLIDER', min: 0.2,   max: 0.9,  step: 0.01,  color: '#fef08a', section: 'BLOOM', defaultValue: 0.55 },
        { id: 'bloomSoftKnee',       label: 'Bloom Soft Knee',        icon: 'Spline',    type: 'SLIDER', min: 0.1,   max: 1.0,  step: 0.01,  color: '#fef08a', section: 'BLOOM', defaultValue: 0.80 },

        // ── ENTRAINMENT & TONES ───────────────────────────────────────────────
        { id: 'toneReactivity',      label: 'Acoustic Tone Coupling', icon: 'Zap',       type: 'SLIDER', min: 0.0,   max: 2.5,  step: 0.05,  color: '#f43f5e', section: 'ENTRAINMENT', defaultValue: 1.0 },

        // ── SONOLUMINESCENCE (ACOUSTIC CAVITATION) ───────────────────────────
        { id: 'bremsstrahlungGlow',  label: 'Thermal Bremsstrahlung Flash', icon: 'Sun',    type: 'SLIDER', min: 0.0, max: 5.0, step: 0.1,   color: '#ffffff', section: 'SONOLUMINESCENCE', defaultValue: 0.0 },
        { id: 'vanDerWaalsCore',     label: 'van der Waals Core Limit',     icon: 'Minimize', type: 'SLIDER', min: 0.05, max: 0.5, step: 0.01, color: '#38bdf8', section: 'SONOLUMINESCENCE', defaultValue: 0.12 },

        // ── APPEARANCE & CHROMATIC PALETTE ────────────────────────────────────
        { id: 'colorMode',           label: 'Color Mode',                                type: 'SELECT', options: ['Tone Harmonic', 'Custom', 'Harmonic Prism'], section: 'APPEARANCE', defaultValue: 'Tone Harmonic' },
        { id: 'color1',              label: 'Primary Mandala Color',                     type: 'COLOR',                                                              section: 'APPEARANCE', defaultValue: '#00f5d4' },
        { id: 'color2',              label: 'Secondary Vortex Color',                   type: 'COLOR',                                                              section: 'APPEARANCE', defaultValue: '#7928ca' },
        { id: 'color3',              label: 'Luminous Core Color',                      type: 'COLOR',                                                              section: 'APPEARANCE', defaultValue: '#4361ee' },
        { id: 'backColor',           label: 'Deep Void Background',                     type: 'COLOR',                                                              section: 'APPEARANCE', defaultValue: '#02040a' },
        { id: 'dyeLuminosity',       label: 'Dye Luminosity',         icon: 'Sun',       type: 'SLIDER', min: 0.02,  max: 0.30, step: 0.01,  color: '#fde68a', section: 'APPEARANCE', defaultValue: 0.10 },
        { id: 'saturation',          label: 'Color Saturation',       icon: 'Sparkles',  type: 'SLIDER', min: 0.2,   max: 2.5,  step: 0.05,  color: '#a78bfa', section: 'APPEARANCE', defaultValue: 1.30 },
        { id: 'splatRadius',         label: 'Dye Stream Radius',      icon: 'Circle',    type: 'SLIDER', min: 0.04,  max: 0.35, step: 0.01,  color: '#2dd4bf', section: 'APPEARANCE', defaultValue: 0.16 },
        { id: 'shading',             label: 'Surface Liquid Shading',                    type: 'CUSTOM_TOGGLE', options: ['ON','OFF'], color: 'cyan',               section: 'APPEARANCE', defaultValue: 'ON' },

        // ── SIMULATION & MASTER ───────────────────────────────────────────────
        { id: 'masterOpacity',       label: 'Master Opacity',                            type: 'SLIDER', min: 0.0,   max: 1.0,  step: 0.01,                           section: 'GLOBAL', defaultValue: 1.0 },
        { id: 'simRes',              label: 'Sim Resolution',                            type: 'SELECT', options: ['64','128','256'],                               section: 'SIMULATION', defaultValue: '128' },
        { id: 'dyeRes',              label: 'Dye Resolution',                            type: 'SELECT', options: ['256','512','1024'],                              section: 'SIMULATION', defaultValue: '512' },
        { id: 'paused',              label: 'Simulation Paused',                         type: 'CUSTOM_TOGGLE', options: ['ON','OFF'], color: 'red',                section: 'SIMULATION', defaultValue: 'OFF' }
    ],

    defaultConfig: PRESETS[0].config,
    presets: PRESETS,

    cleanup: (context) => {
        const { memory } = context;
        if (memory.fluidEngine) {
            (memory.fluidEngine as FluidEngineGL).destroy();
            memory.fluidEngine = null;
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    },

    render: (context: LensContext, localConfig: Record<string, unknown>) => {
        const {
            gl, ctx, w, h, logicalW, logicalH, dt, amplitudes, memory,
            coherence, cx, cy, breathRadius, heartHarmonics
        } = context;
        if (!gl) return;

        // ── One-time initialization ───────────────────────────────────────────
        if (!memory.fluidEngine) memory.fluidEngine = new FluidEngineGL(gl);
        if (memory.colorPhase === undefined) memory.colorPhase = 0.0;
        if (memory.stirAngle === undefined) memory.stirAngle = 0.0;
        if (memory.vortexRotation === undefined) memory.vortexRotation = 0.0;
        if (memory.smoothedAmpsMap === undefined) memory.smoothedAmpsMap = new Map<string, number>();
        if (!memory.emitters) memory.emitters = [];

        const engine  = memory.fluidEngine as FluidEngineGL;
        const canvasW = gl.drawingBufferWidth;
        const canvasH = gl.drawingBufferHeight;
        if (canvasW <= 0 || canvasH <= 0) return;

        const frameDt = Math.min(dt ?? 0.016, 0.033);
        const coh     = Math.max(0, Math.min(1, (coherence ?? 0) / 100 || 0));

        // Exact interface grid mandala center alignment (normalized 0..1 for WebGL)
        const normCx = typeof cx === 'number' && typeof w === 'number' && w > 0 ? cx / w : 0.5;
        const normCy = typeof cy === 'number' && typeof h === 'number' && h > 0 ? 1.0 - cy / h : 0.5;

        // ── 1. Slow Meditative Kaleidoscope Rotation Drift ────────────────────
        const rotSpeed = getVal(localConfig.vortexRotationSpeed, 0.003);
        memory.vortexRotation = (memory.vortexRotation + rotSpeed * frameDt * 0.12) % (Math.PI * 2);

        // Map modulated parameters to fluid engine configuration
        const tailTrailVal = getVal(localConfig.tailTrail, 0.990);
        const glowVal = getVal(localConfig.glowIntensity, 0.65);

        // ── Navier-Stokes Shader Configuration ────────────────────────────────
        const shaderConfig = {
            simRes:              getInt(localConfig.simRes, 128),
            dyeRes:              getInt(localConfig.dyeRes, 512),
            densityDissipation:  tailTrailVal,
            tailTrail:           tailTrailVal,
            velocityDissipation: getVal(localConfig.velocityDissipation, 0.05),
            pressure:            getVal(localConfig.pressure, 0.92),
            pressureIterations:  24,
            curl:                getVal(localConfig.curl, 1.4),
            shading:             getBool(localConfig.shading, true),
            transparent:         false,
            paused:              getBool(localConfig.paused, false),
            bloom:               getBool(localConfig.bloom, true),
            bloomIterations:     8,
            bloomResolution:     256,
            bloomIntensity:      glowVal,
            glowIntensity:       glowVal,
            bloomThreshold:      getVal(localConfig.bloomThreshold, 0.55),
            bloomSoftKnee:       getVal(localConfig.bloomSoftKnee, 0.80),
            sunrays:             false,
            sunraysResolution:   128,
            sunraysWeight:       0.2,
            backColor:           hexToRgb(getStr(localConfig.backColor, '#02040a')),
            kaleidoscope:        getVal(localConfig.kaleidoscope, 8),
            centerX:             normCx,
            centerY:             normCy,
            vortexRotation:      memory.vortexRotation,
            saturation:          getVal(localConfig.saturation, 1.30),
            masterOpacity:       getVal(localConfig.masterOpacity, 1.0)
        };

        if (shaderConfig.paused) {
            engine.step(frameDt, shaderConfig, canvasW, canvasH);
            return;
        }

        // ── 2. Tone Audio Harmonic Frequency & Color Extraction ───────────────
        const toneReactivity = getVal(localConfig.toneReactivity, 1.0);
        const smoothedAmps: Map<string, number> = memory.smoothedAmpsMap;
        
        const activeTones: Array<{ channelId: string; freq: number; amp: number; r: number; g: number; b: number }> = [];
        let totalActiveAmp = 0;

        if (amplitudes && amplitudes.size > 0) {
            let toneIdx = 0;
            for (const [chId, rawAmp] of amplitudes.entries()) {
                const prev = smoothedAmps.get(chId) ?? 0;
                const next = prev + (rawAmp - prev) * Math.min(1.0, frameDt * 4.0);
                smoothedAmps.set(chId, next);

                if (next > 0.02) {
                    const freq = resolveChannelFreq(chId, toneIdx);
                    const rgb255 = getFrequencyRGB(freq);
                    activeTones.push({
                        channelId: chId,
                        freq,
                        amp: next,
                        r: rgb255.r / 255,
                        g: rgb255.g / 255,
                        b: rgb255.b / 255
                    });
                    totalActiveAmp += next;
                }
                toneIdx++;
            }
        }

        activeTones.sort((a, b) => b.amp - a.amp);

        // ── Sonoluminescence (Acoustic Cavitation & Bremsstrahlung) Frequency-Dependent Mapping
        // Physical mapping directly to active entrainment frequency (Rayleigh-Plesset equation of state):
        // Low Freq (Delta/Theta): Huge bubbles, slow deep implosions with massive blinding white strobe flashes.
        // High Freq (Gamma): Tiny, tight bubbles, fast strobe-light plasma beam effect.
        const rawFreq = (context.binauralHz as number) || (context.effectiveBinauralBeat as number) || (context.globalBinauralBeat as number) || 7.83;
        const activeFreq = typeof rawFreq === 'number' && rawFreq > 0 ? rawFreq : 7.83;
        const vanDerWaalsCore = getVal(localConfig.vanDerWaalsCore, 0.12);
        const bremsstrahlungG = getVal(localConfig.bremsstrahlungGlow, 0.0);
        const currentTime = typeof context.time === 'number' ? context.time : performance.now() * 0.001;

        // Populate shaderConfig with Sonoluminescence uniforms
        (shaderConfig as any).binauralHz            = activeFreq;
        (shaderConfig as any).vanDerWaalsCore       = vanDerWaalsCore;
        (shaderConfig as any).bremsstrahlungGlow    = bremsstrahlungG;
        (shaderConfig as any).audioEnergy           = totalActiveAmp;
        (shaderConfig as any).time                  = currentTime;
        if (activeTones.length > 0) {
            (shaderConfig as any).coreColor = { r: activeTones[0].r, g: activeTones[0].g, b: activeTones[0].b };
            (shaderConfig as any).rimColor  = activeTones[1] ? { r: activeTones[1].r, g: activeTones[1].g, b: activeTones[1].b } : { r: activeTones[0].r * 0.8, g: activeTones[0].g * 0.9, b: activeTones[0].b };
            (shaderConfig as any).glowColor = activeTones[2] ? { r: activeTones[2].r, g: activeTones[2].g, b: activeTones[2].b } : (shaderConfig as any).rimColor;
        }

        // ── 3. Color Palette & Harmonic Tone Blending ─────────────────────────
        const colorMode   = getStr(localConfig.colorMode, 'Tone Harmonic');
        const c1Rgb       = hexToRgb(getStr(localConfig.color1, '#00f5d4'));
        const c2Rgb       = hexToRgb(getStr(localConfig.color2, '#7928ca'));
        const c3Rgb       = hexToRgb(getStr(localConfig.color3, '#4361ee'));
        const baseBright  = getVal(localConfig.dyeLuminosity, 0.10);
        const baseStir    = getVal(localConfig.stirForce, 7.0);

        // Fluid agitation modulation based on frequency:
        // Low Freq (Delta) = Heavy, deep viscous stirring; High Freq (Gamma) = Fast, light agitation
        const freqStirMod = 0.65 + 16.0 / (activeFreq + 10.0);
        const stirForce   = baseStir * freqStirMod;
        const baseSplatR  = getVal(localConfig.splatRadius, 0.16);
        const phaseConjugation = getVal(localConfig.phaseConjugation, 1.10);

        // Slow background chromatic phase drift
        memory.colorPhase = (memory.colorPhase + 0.005 * frameDt) % 1.0;

        // Current orbital stir angle synchronized with vortex rotation
        memory.stirAngle = (memory.stirAngle + (rotSpeed * 2.0 + 0.006) * Math.PI * 2 * frameDt) % (Math.PI * 2);
        const currentStirAngle = memory.stirAngle;

        // ── 4. Sacred Geometry Emitter Placement ──────────────────────────────
        const geometryMode = getStr(localConfig.geometryMode, 'GOLDEN_SPIRAL');
        const baseR        = getVal(localConfig.emitterSpread, 0.16);
        const userZoom     = (context.visualScale as number) ?? 1.0;
        const dynamicR     = baseR * userZoom;
        const dynamicSplatRadius = baseSplatR * userZoom;

        memory.emitters.length = 0;
        const addEmitter = (x: number, y: number, orbitAngle: number, index: number) => {
            if (memory.emitters.length < 36) {
                memory.emitters.push({ x, y, orbitAngle, index });
            }
        };

        const totalRot = currentStirAngle;

        switch (geometryMode) {
            case 'SEED': {
                addEmitter(normCx, normCy, 0, 0);
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + totalRot;
                    addEmitter(normCx + Math.cos(a) * dynamicR, normCy + Math.sin(a) * dynamicR, a, i + 1);
                }
                break;
            }
            case 'FLOWER_OF_LIFE': {
                addEmitter(normCx, normCy, 0, 0);
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + totalRot;
                    addEmitter(normCx + Math.cos(a) * dynamicR, normCy + Math.sin(a) * dynamicR, a, i + 1);
                }
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + totalRot + Math.PI / 6;
                    addEmitter(normCx + Math.cos(a) * dynamicR * 1.732, normCy + Math.sin(a) * dynamicR * 1.732, a, i + 7);
                }
                break;
            }
            case 'METATRON': {
                addEmitter(normCx, normCy, 0, 0);
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + totalRot;
                    addEmitter(normCx + Math.cos(a) * dynamicR, normCy + Math.sin(a) * dynamicR, a, i + 1);
                    addEmitter(normCx + Math.cos(a) * dynamicR * 2.0, normCy + Math.sin(a) * dynamicR * 2.0, a, i + 7);
                }
                break;
            }
            case 'SRI_YANTRA': {
                addEmitter(normCx, normCy, 0, 0);
                const scales = [0.75, 1.15, 1.55];
                let idx = 1;
                for (let layer = 0; layer < 3; layer++) {
                    for (let i = 0; i < 3; i++) {
                        const a = (i / 3) * Math.PI * 2 + (layer % 2 === 0 ? 0 : Math.PI) + totalRot;
                        addEmitter(normCx + Math.cos(a) * dynamicR * scales[layer], normCy + Math.sin(a) * dynamicR * scales[layer], a, idx++);
                    }
                }
                break;
            }
            case 'GOLDEN_SPIRAL': {
                addEmitter(normCx, normCy, 0, 0);
                for (let arm = 0; arm < 4; arm++) {
                    const armA = (arm / 4) * Math.PI * 2 + totalRot;
                    // Inward points along the golden spiral
                    const r1 = dynamicR * 0.6;
                    const r2 = dynamicR * 1.2;
                    const r3 = dynamicR * 1.8;
                    addEmitter(normCx + Math.cos(armA + 0.5) * r1, normCy + Math.sin(armA + 0.5) * r1, armA, arm * 3 + 1);
                    addEmitter(normCx + Math.cos(armA + 1.2) * r2, normCy + Math.sin(armA + 1.2) * r2, armA, arm * 3 + 2);
                    addEmitter(normCx + Math.cos(armA + 2.0) * r3, normCy + Math.sin(armA + 2.0) * r3, armA, arm * 3 + 3);
                }
                break;
            }
            case 'TORUS_IMPLOSION': {
                addEmitter(normCx, normCy, 0, 0);
                const throatR = dynamicR * 0.45;
                const rimR = dynamicR * 1.35;
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 + totalRot;
                    addEmitter(normCx + Math.cos(a) * throatR, normCy + Math.sin(a) * throatR, a, i + 1);
                    addEmitter(normCx + Math.cos(a + Math.PI / 6) * rimR, normCy + Math.sin(a + Math.PI / 6) * rimR, a, i + 7);
                }
                break;
            }
            case 'PENTAGRAM': {
                addEmitter(normCx, normCy, 0, 0);
                for (let i = 0; i < 5; i++) {
                    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + totalRot;
                    addEmitter(normCx + Math.cos(a) * dynamicR, normCy + Math.sin(a) * dynamicR, a, i + 1);
                    const inA = a + Math.PI / 5;
                    addEmitter(normCx + Math.cos(inA) * (dynamicR * 0.45), normCy + Math.sin(inA) * (dynamicR * 0.45), inA, i + 6);
                }
                break;
            }
            default: {
                addEmitter(normCx, normCy, 0, 0);
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + totalRot;
                    addEmitter(normCx + Math.cos(a) * dynamicR, normCy + Math.sin(a) * dynamicR, a, i + 1);
                }
                break;
            }
        }

        const N = memory.emitters.length;
        if (N === 0) {
            engine.step(frameDt, shaderConfig, canvasW, canvasH);
            return;
        }

        // ── 5. Navier-Stokes Phase Conjugate Fluid Injection ──────────────────
        // Heartbeat / breath harmonic pulse calculation
        let heartPulse = 0;
        if (heartHarmonics && heartHarmonics.vols && heartHarmonics.vols.length > 0) {
            heartPulse = heartHarmonics.vols.reduce((acc, v, idx) => acc + (heartHarmonics.mutes?.[idx] ? 0 : v), 0) / heartHarmonics.vols.length;
        }
        const breathPulse = typeof breathRadius === 'number' ? Math.sin(breathRadius * Math.PI) : 0;
        const totalPulse = Math.max(0, Math.min(1.0, heartPulse * 0.6 + breathPulse * 0.4));

        const continuousDyeFeed = (baseBright * 0.055 * (0.8 + totalPulse * 0.4)) / Math.max(1, Math.sqrt(N));

        for (let i = 0; i < N; i++) {
            const em = memory.emitters[i];
            const rdx = em.x - normCx;
            const rdy = em.y - normCy;
            const rlen = Math.sqrt(rdx * rdx + rdy * rdy);

            let dyeR = 0, dyeG = 0, dyeB = 0;

            if (activeTones.length > 0 && (colorMode === 'Tone Harmonic' || toneReactivity > 0.1)) {
                const tone = activeTones[i % activeTones.length];
                const toneWeight = Math.min(1.0, tone.amp * toneReactivity * 1.3);

                const t = (i / Math.max(1, N - 1));
                const midT = Math.sin(t * Math.PI);
                const edgeT = Math.cos(t * Math.PI * 0.5);
                const baseR = (c1Rgb.r * edgeT + c2Rgb.r * midT + c3Rgb.r * (1.0 - edgeT)) * 0.5;
                const baseG = (c1Rgb.g * edgeT + c2Rgb.g * midT + c3Rgb.g * (1.0 - edgeT)) * 0.5;
                const baseB = (c1Rgb.b * edgeT + c2Rgb.b * midT + c3Rgb.b * (1.0 - edgeT)) * 0.5;

                dyeR = (baseR * (1.0 - toneWeight) + tone.r * toneWeight * 1.6) * continuousDyeFeed * 1.8;
                dyeG = (baseG * (1.0 - toneWeight) + tone.g * toneWeight * 1.6) * continuousDyeFeed * 1.8;
                dyeB = (baseB * (1.0 - toneWeight) + tone.b * toneWeight * 1.6) * continuousDyeFeed * 1.8;
            } else if (colorMode === 'Harmonic Prism') {
                const hue = (memory.colorPhase + (i / N) * 0.70 + (i % 3) * 0.10) % 1.0;
                const rgb = hsvToRgb(hue, 0.85 + coh * 0.15, 1.0);
                dyeR = rgb.r * continuousDyeFeed * 1.5;
                dyeG = rgb.g * continuousDyeFeed * 1.5;
                dyeB = rgb.b * continuousDyeFeed * 1.5;
            } else {
                const t = (i / Math.max(1, N - 1));
                const midT = Math.sin(t * Math.PI);
                const edgeT = Math.cos(t * Math.PI * 0.5);

                const r = (c1Rgb.r * edgeT + c2Rgb.r * midT + c3Rgb.r * (1.0 - edgeT)) * 0.5;
                const g = (c1Rgb.g * edgeT + c2Rgb.g * midT + c3Rgb.g * (1.0 - edgeT)) * 0.5;
                const b = (c1Rgb.b * edgeT + c2Rgb.b * midT + c3Rgb.b * (1.0 - edgeT)) * 0.5;

                dyeR = r * continuousDyeFeed * 1.8;
                dyeG = g * continuousDyeFeed * 1.8;
                dyeB = b * continuousDyeFeed * 1.8;
            }

            // Phase Conjugate Velocities:
            // Counter-rotating tangential vortex swirl (alternating signs across adjacent nodes)
            // PLUS centripetal inward suction vector pulling dye into the center singularity
            let vx = 0, vy = 0;
            if (rlen > 0.005) {
                const tangentX = -rdy / rlen;
                const tangentY =  rdx / rlen;
                const inwardX  = -rdx / rlen;
                const inwardY  = -rdy / rlen;

                // Alternate counter-rotating vortex pairs (Dan Winter phase conjugate gear mesh)
                const nodeSign = (i % 2 === 0 ? 1.0 : -0.9);
                const orbitalVel = stirForce * 0.38 * nodeSign;
                const implosiveVel = stirForce * 0.28 * phaseConjugation;

                vx = tangentX * orbitalVel + inwardX * implosiveVel;
                vy = tangentY * orbitalVel + inwardY * implosiveVel;
            } else {
                // Center core fountain
                const a = currentStirAngle * 1.5;
                vx = Math.cos(a) * stirForce * 0.3;
                vy = Math.sin(a) * stirForce * 0.3;
            }

            // Acoustic tone velocity coupling
            if (activeTones.length > 0) {
                const tone = activeTones[i % activeTones.length];
                const toneAmpBoost = 1.0 + tone.amp * toneReactivity * 1.3;
                dyeR *= toneAmpBoost;
                dyeG *= toneAmpBoost;
                dyeB *= toneAmpBoost;
                vx *= (1.0 + tone.amp * 0.25);
                vy *= (1.0 + tone.amp * 0.25);
            }

            engine.splat(
                Math.max(0.02, Math.min(0.98, em.x)),
                Math.max(0.02, Math.min(0.98, em.y)),
                vx, vy,
                { r: dyeR, g: dyeG, b: dyeB },
                dynamicSplatRadius,
                canvasW, canvasH
            );
        }

        // ── 6. Step WebGL Navier-Stokes Solver & Render to GPU Surface ────────
        engine.step(frameDt, shaderConfig, canvasW, canvasH);

        // ── 7. Render Luminous Sacred Geometry Mandala on Overlay Canvas ──────
        const mandalaGlow = getVal(localConfig.mandalaGlow, 0.85);
        const mandalaComplexity = getInt(localConfig.mandalaComplexity, 3);

        if (ctx && mandalaGlow > 0.005) {
            drawSacredGeometryMandala(
                ctx as CanvasRenderingContext2D,
                logicalW || (canvasW / (window.devicePixelRatio || 1)),
                logicalH || (canvasH / (window.devicePixelRatio || 1)),
                normCx,
                normCy,
                dynamicR,
                totalRot,
                geometryMode,
                mandalaGlow,
                mandalaComplexity,
                c1Rgb,
                c2Rgb,
                c3Rgb,
                activeTones,
                userZoom,
                totalPulse
            );
        }
    }
};
