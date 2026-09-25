import { VisualizerPlugin } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, getFrequencyColor, HEART_HARMONIC_DEFS, getUniversalCymatic } from './shared';
import { drawCymaticCanvas } from './cymaticRenderer';

const MAX_PARTICLES = 12000;
const TWO_PI = Math.PI * 2;

export const WORKER_CODE = `
const SQRT3 = 1.7320508075688772;
const SQRT3_HALF = 0.8660254037844386;
const TWO_PI = Math.PI * 2;
const INV_SQRT2 = 0.7071067811865475;

// High-speed Bessel Approximation J_n(x)
function besselJ(n, x) {
    if (x === 0) return n === 0 ? 1.0 : 0.0;
    const ax = Math.abs(x);
    if (ax < 3.75) {
        const y = (x / 3.75) * (x / 3.75);
        if (n === 0) {
            return 1.0 + y * (-2.2499997 + y * (1.2656208 + y * (-0.3163866 + y * (0.0444479 - y * 0.0039444))));
        } else if (n === 1) {
            return x * (0.5 + y * (-0.56249985 + y * (0.21093573 + y * (-0.03954289 + y * (0.00443319 - y * 0.00031761)))));
        }
    }
    const y = 3.75 / Math.max(0.001, ax);
    const f0 = 0.79788456 + y * (-0.00000077 + y * (-0.00552740 + y * (0.00009512 + y * (0.00137237 - y * 0.00072805))));
    const theta0 = ax - 0.78539816 + y * (-0.04166397 + y * (-0.00003954 + y * (0.00262573 + y * (-0.00054125 - y * 0.00029333))));
    const j0 = (1.0 / Math.sqrt(Math.max(0.001, ax))) * f0 * Math.cos(theta0);
    if (n === 0) return j0;
    const j1 = (1.0 / Math.sqrt(Math.max(0.001, ax))) * f0 * Math.sin(theta0) * (x < 0 ? -1 : 1);
    if (n === 1) return j1;
    // Fast downward / direct recurrence for small integer n
    let jprev = j0, jcurr = j1, jnext = 0;
    for (let k = 1; k < n; k++) {
        jnext = (2 * k / Math.max(0.001, x)) * jcurr - jprev;
        jprev = jcurr;
        jcurr = jnext;
    }
    return Math.max(-1.0, Math.min(1.0, jcurr));
}

self.onmessage = (e) => {
    const { 
        pos, vel, activeModes, maxRadius, 
        activeParticleCount, adhesion, roughness, forceMult, 
        effectiveViscosity, agitationMultiplier, isNebula, plateShape,
        flowFactor, solarWindStrength, centralGravity, vortexStream,
        meshElasticity, turbulence,
        globalPhase, time, sensorMode, breathRadius, aether,
        nodalPolarity, modalFormula, harmonicSymmetry, snapStrength, plateDamping,
        edgeRecycle
    } = e.data;

    const isRepel = nodalPolarity === 'REPEL';
    const sym = Math.max(1, Math.min(8, Math.round(harmonicSymmetry || 1)));
    const snap = Math.max(0.2, Math.min(3.5, snapStrength || 1.2));
    const damping = Math.max(0.05, Math.min(0.95, plateDamping ?? 0.3));
    const shouldRecycle = edgeRecycle === 'ON' || edgeRecycle === true;

    const MAX_SPEED = isNebula ? 12.0 : 6.0;
    const MAX_SPEED_SQ = MAX_SPEED * MAX_SPEED;

    const turbX = Math.sin(time * 0.5) * turbulence * 1.5;
    const turbY = Math.cos(time * 0.3) * turbulence * 1.5;
    const aetherOffset = (sensorMode === 'AETHER' || aether) ? (breathRadius || 0) * Math.PI : 0;

    const limitR = maxRadius * 0.95;
    const numModes = activeModes ? activeModes.length : 0;

    for (let i = 0; i < activeParticleCount; i++) {
        const ix = i * 2;
        const iy = ix + 1;
        let dx = pos[ix]; 
        let dy = pos[iy];
        let vx = vel[ix];
        let vy = vel[iy];
        const r = Math.sqrt(dx*dx + dy*dy);

        // --- 1. BOUNDARY RESTRICTION & CLAMPING / RECYCLING ---
        let atBoundary = false;
        if (plateShape === 'SQUARE') {
            const limit = limitR;
            if (Math.abs(dx) > limit || Math.abs(dy) > limit) {
                atBoundary = true;
                if (!shouldRecycle) {
                    if (dx > limit) { dx = limit; vx = -Math.abs(vx) * damping; }
                    else if (dx < -limit) { dx = -limit; vx = Math.abs(vx) * damping; }
                    if (dy > limit) { dy = limit; vy = -Math.abs(vy) * damping; }
                    else if (dy < -limit) { dy = -limit; vy = Math.abs(vy) * damping; }
                }
            }
        } else if (plateShape === 'HEXAGON') {
            const apothem = limitR * SQRT3_HALF;
            const d1 = Math.abs(dy);
            const d2 = Math.abs(SQRT3_HALF * dx + 0.5 * dy);
            const d3 = Math.abs(-SQRT3_HALF * dx + 0.5 * dy);
            if (d1 > apothem || d2 > apothem || d3 > apothem) {
                atBoundary = true;
                if (!shouldRecycle) {
                    dx *= 0.96; dy *= 0.96;
                    vx *= -damping; vy *= -damping;
                }
            }
        } else if (plateShape === 'OCTAGON') {
            const apothem = limitR * 0.92388;
            const dD1 = Math.abs((dx + dy) * INV_SQRT2);
            const dD2 = Math.abs((dx - dy) * INV_SQRT2);
            if (Math.abs(dx) > apothem || Math.abs(dy) > apothem || dD1 > apothem || dD2 > apothem) {
                atBoundary = true;
                if (!shouldRecycle) {
                    dx *= 0.96; dy *= 0.96;
                    vx *= -damping; vy *= -damping;
                }
            }
        } else if (plateShape === 'TRIANGLE') {
            const yBottom = limitR * 0.5;
            const nxL = -SQRT3_HALF, nyL = -0.5;
            const dotL = dx * nxL + (dy - yBottom) * nyL;
            const nxR = SQRT3_HALF, nyR = -0.5;
            const dotR = dx * nxR + (dy - yBottom) * nyR;
            if (dy > yBottom || dotL < 0 || dotR < 0) {
                atBoundary = true;
                if (!shouldRecycle) {
                    dx *= 0.95; dy *= 0.95;
                    vx *= -damping; vy *= -damping;
                }
            }
        } else if (plateShape === 'PENTAGON') {
            const apothem = limitR * 0.809017;
            for (let j = 0; j < 5; j++) {
                const ang = j * (TWO_PI / 5) - Math.PI * 0.5;
                const dot = dx * Math.cos(ang) + dy * Math.sin(ang);
                if (dot > apothem) {
                    atBoundary = true;
                    if (!shouldRecycle) {
                        dx *= 0.96; dy *= 0.96;
                        vx *= -damping; vy *= -damping;
                    }
                    break;
                }
            }
        } else if (plateShape === 'ELLIPSE') {
            const rEll = Math.sqrt((dx * dx) / 1.3225 + (dy * dy) / 0.7225);
            if (rEll > limitR) {
                atBoundary = true;
                if (!shouldRecycle) {
                    const factor = limitR / rEll;
                    dx *= factor; dy *= factor;
                    vx *= -damping; vy *= -damping;
                }
            }
        } else {
            // CIRCLE
            if (r > limitR && r > 0.001) {
                atBoundary = true;
                if (!shouldRecycle) {
                    dx = (dx / r) * limitR;
                    dy = (dy / r) * limitR;
                    const dot = (vx * dx + vy * dy) / r;
                    if (dot > 0) {
                        vx -= (1.0 + damping) * dot * (dx / r);
                        vy -= (1.0 + damping) * dot * (dy / r);
                    }
                }
            }
        }

        if (atBoundary && shouldRecycle) {
            // Respawn particle gently across plate surface
            const spawnR = Math.sqrt(Math.random()) * limitR * 0.85;
            const spawnTh = Math.random() * TWO_PI;
            dx = spawnR * Math.cos(spawnTh);
            dy = spawnR * Math.sin(spawnTh);
            vx = (Math.random() - 0.5) * 0.2;
            vy = (Math.random() - 0.5) * 0.2;
        }

        const theta = Math.atan2(dy, dx);
        const u_x = r > 0 ? dx/r : 0;
        const u_y = r > 0 ? dy/r : 0;
        
        // --- 2. ENVIRONMENTAL & FLUID FORCES ---
        const rNorm = Math.min(1.0, r / Math.max(1.0, maxRadius));
        const swirlProfile = 1.0 / (0.3 + rNorm * 0.7);
        
        const turbForce = turbulence * 0.25;
        let envX = u_x * solarWindStrength + turbX * turbForce;
        let envY = u_y * solarWindStrength + turbY * turbForce;
        envX -= u_x * centralGravity * (0.5 + (1.0 - rNorm) * 1.5);
        envY -= u_y * centralGravity * (0.5 + (1.0 - rNorm) * 1.5);
        
        envX -= u_y * vortexStream * 0.04 * swirlProfile;
        envY += u_x * vortexStream * 0.04 * swirlProfile;

        // --- 3. WAVE HARMONICS EVALUATION ---
        let geoSum = 0;
        const u = dx / maxRadius;
        const v = dy / maxRadius;

        if (plateShape === 'SQUARE') {
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(1, (mode.n || 2) * sym);
                const effM = Math.max(1, mode.m || 1);
                const entropy = roughness > 0 ? (Math.sin(u * 12) * Math.cos(v * 12)) * roughness * 0.15 : 0;
                const px = Math.PI * u + entropy;
                const py = Math.PI * v + entropy;
                const cNpx = Math.cos(effN * px);
                const cMpy = Math.cos(effM * py);
                const cMpx = Math.cos(effM * px);
                const cNpy = Math.cos(effM * py);

                let modeVal = 0;
                if (modalFormula === 'RITZ_SYMMETRIC') {
                    modeVal = (cNpx * cMpy + cMpx * cNpy) * 0.5;
                } else if (modalFormula === 'DIAGONAL') {
                    modeVal = Math.cos(effN * (px + py) * 0.707) * Math.cos(effM * (px - py) * 0.707);
                } else if (modalFormula === 'RADIAL_CONCENTRIC') {
                    modeVal = Math.cos(rNorm * effN * Math.PI) * Math.cos(theta * effM * sym);
                } else {
                    const sign = (effN + effM) % 2 === 0 ? 1 : -1;
                    modeVal = (cNpx * cMpy - sign * cMpx * cNpy) * 0.5;
                }
                geoSum += modeVal * (mode.volRatio || 1.0);
            }
        } else if (plateShape === 'HEXAGON') {
            const kBase = (3.5 * Math.PI) / maxRadius;
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(1, mode.n || 2);
                const effM = Math.max(1, mode.m || 1);
                const k = kBase * (effN * sym * 0.35 + effM * 0.5 + 0.5);
                const entropy = roughness > 0 ? Math.sin(dx * 0.08) * Math.cos(dy * 0.08) * roughness * 0.2 : 0;
                const hexWave = (Math.cos(k * dx + entropy) + Math.cos((-0.5 * k) * dx + (SQRT3_HALF * k) * dy + entropy) + Math.cos((-0.5 * k) * dx - (SQRT3_HALF * k) * dy + entropy)) / 3.0;
                geoSum += (hexWave * Math.cos(effM * Math.PI * rNorm)) * (mode.volRatio || 1.0);
            }
        } else if (plateShape === 'OCTAGON') {
            const kBase = (3.2 * Math.PI) / maxRadius;
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(1, mode.n || 2);
                const effM = Math.max(1, mode.m || 1);
                const k = kBase * (effN * sym * 0.35 + effM * 0.5 + 0.5);
                const entropy = roughness > 0 ? Math.sin(dx * 0.08) * roughness * 0.15 : 0;
                const octWave = (Math.cos(k * dx + entropy) + Math.cos(k * dy + entropy) + Math.cos(k * (dx + dy) * INV_SQRT2 + entropy) + Math.cos(k * (dx - dy) * INV_SQRT2 + entropy)) * 0.25;
                geoSum += (octWave * Math.cos(effM * Math.PI * rNorm)) * (mode.volRatio || 1.0);
            }
        } else if (plateShape === 'TRIANGLE') {
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(1, mode.n || 2);
                const effM = Math.max(1, mode.m || 1);
                const k1 = (2.0 * Math.PI / SQRT3) * (effN * sym);
                const k2 = (2.0 * Math.PI) * effM;
                const entropy = roughness > 0 ? Math.sin(u * 10) * roughness * 0.15 : 0;
                const triWave = (Math.cos(k1 * u + entropy) * Math.cos(k2 * v + entropy) - Math.cos(k2 * u / SQRT3 + entropy) * Math.cos(k1 * v * SQRT3_HALF + entropy)) * 0.5;
                geoSum += triWave * (mode.volRatio || 1.0);
            }
        } else if (plateShape === 'PENTAGON') {
            const kBase = (3.2 * Math.PI) / maxRadius;
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(1, mode.n || 2);
                const effM = Math.max(1, mode.m || 1);
                const k = kBase * (effN * sym * 0.3 + effM * 0.5 + 0.5);
                let pentSum = 0;
                for (let j = 0; j < 5; j++) {
                    const ang = j * (TWO_PI / 5) - Math.PI * 0.5;
                    pentSum += Math.cos(Math.cos(ang) * k * dx + Math.sin(ang) * k * dy);
                }
                geoSum += ((pentSum / 5.0) * Math.cos(effM * Math.PI * rNorm)) * (mode.volRatio || 1.0);
            }
        } else if (plateShape === 'ELLIPSE') {
            const uEll = dx / (maxRadius * 1.15);
            const vEll = dy / (maxRadius * 0.85);
            const rEll = Math.sqrt(uEll * uEll + vEll * vEll);
            const thEll = Math.atan2(vEll, uEll);
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(1, mode.n || 2);
                const effM = Math.max(1, mode.m || 1);
                geoSum += (Math.cos((effN * sym) * thEll) * Math.cos(effM * Math.PI * Math.min(1.0, rEll))) * (mode.volRatio || 1.0);
            }
        } else {
            // CIRCLE (Bessel)
            for (let mIdx = 0; mIdx < numModes; mIdx++) {
                const mode = activeModes[mIdx];
                const effN = Math.max(0, (mode.n !== undefined ? mode.n : 2));
                const effM = Math.max(1, (mode.m !== undefined ? mode.m : 1));
                const kVal = mode.k || (Math.PI * (effM + 1.5));
                const radialVal = besselJ(effN, rNorm * kVal);
                const plateNoise = roughness > 0 ? (Math.sin(rNorm * 18) * Math.cos(theta * 10)) * roughness * 0.25 : 0;
                const phaseOffset = isNebula ? (time * (mode.speed || 0.3) * 0.2) : 0;
                const rotationPhase = isNebula ? globalPhase : 0;
                const angularVal = Math.cos((effN * sym) * theta + rotationPhase + aetherOffset - phaseOffset) + plateNoise;
                geoSum += (radialVal * angularVal) * (mode.volRatio || 1.0);
            }
        }

        const amp = Math.abs(geoSum);

        // --- 4. CHLADNI TRAPPING AND DISPLACEMENT ---
        const trapWidth = (0.025 + (1.0 - adhesion) * 0.12) / snap;
        let trap = 0;
        let escapeFactor = 0;

        if (isRepel) {
            escapeFactor = Math.max(0.0, 1.0 - Math.min(1.0, amp / trapWidth));
            trap = 1.0 - (escapeFactor * escapeFactor);
        } else {
            escapeFactor = Math.min(1.0, amp / trapWidth);
            trap = 1.0 - (escapeFactor * escapeFactor * escapeFactor);
        }

        // Apply environmental forces (shielded inside nodal lines)
        const envShield = 1.0 - (trap * 0.92);
        vx += envX * envShield;
        vy += envY * envShield;

        // Shape lock
        if (meshElasticity > 0 && amp > 0.08) {
            const elasticForce = meshElasticity * 0.18;
            vx *= (1.0 - elasticForce);
            vy *= (1.0 - elasticForce);
        }

        // Kinetic friction & kick
        let friction = 0;
        let kick = 0;

        if (isNebula) {
            friction = Math.max(0.02, Math.min(0.99, 0.98 - (amp * effectiveViscosity * 0.3))); 
            const nodeGlue = Math.pow(Math.max(0.01, isRepel ? (1.0 - amp) : amp), 1.5 + adhesion * 3.0); 
            kick = agitationMultiplier * nodeGlue * Math.max(0.2, forceMult) * 6.0 * snap; 
        } else {
            const flyingFriction = Math.max(0.82, 0.96 - (effectiveViscosity * 0.18));
            const stuckFriction = 0.05 * (1.0 - adhesion);
            friction = stuckFriction * trap + flyingFriction * (1.0 - trap);
            kick = escapeFactor * agitationMultiplier * Math.max(0.2, forceMult) * 8.0 * snap;
        }

        const thermalNoise = 0.03 * Math.max(0.2, forceMult) * agitationMultiplier;
        
        vx *= friction;
        vy *= friction;
        vx += (Math.random() - 0.5) * kick + (Math.random() - 0.5) * thermalNoise;
        vy += (Math.random() - 0.5) * kick + (Math.random() - 0.5) * thermalNoise;
        
        // Speed limiting
        const speedSq = vx * vx + vy * vy;
        if (speedSq > MAX_SPEED_SQ) {
            const speed = Math.sqrt(speedSq);
            vx = (vx / speed) * MAX_SPEED;
            vy = (vy / speed) * MAX_SPEED;
        }
        
        pos[ix] = dx + vx;
        pos[iy] = dy + vy;
        vel[ix] = vx;
        vel[iy] = vy;
    }

    self.postMessage({ pos, vel }, [pos.buffer, vel.buffer]);
};
`;

export const RAW_PRESETS = {
    "01 Pure Square Sand": { 
        category: "Acoustic Plates", 
        config: { blendMode: 'NORMAL', plateShape: 'SQUARE', modalFormula: 'CHLADNI', harmonicSymmetry: 1, snapStrength: 1.2, plateDamping: 0.3, latticeDensity: 0.85, membraneTension: 0.9, particleSize: 1.1, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.45, agitation: 0.6, streamFlow: 0.0, phaseFluidity: 0.2, chromaticPrism: 'ON',
        cometTrails: 0.0,
        glow: 0.65, minBrightness: 0.8, reactivity: 1.0, masterOpacity: 1.0, colorGain: 2.0 }, 
        modulations: { agitation: { enabled: true, min: 0.2, max: 1.1, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "02 Circular Chladni": { 
        category: "Acoustic Plates", 
        config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', modalFormula: 'CHLADNI', harmonicSymmetry: 1, snapStrength: 1.2, plateDamping: 0.3, latticeDensity: 0.95, membraneTension: 0.92, particleSize: 1.1, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.5, agitation: 0.55, streamFlow: 0.0, phaseFluidity: 0.4, chromaticPrism: 'ON',
        cometTrails: 0.0,
        glow: 0.65, minBrightness: 0.8, reactivity: 1.2, masterOpacity: 1.0, colorGain: 2.0 }, 
        modulations: { membraneTension: { enabled: true, min: 0.6, max: 1.0, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "03 Hexagonal Sacred Lattice": { 
        category: "Acoustic Plates", 
        config: { blendMode: 'NORMAL', plateShape: 'HEXAGON', modalFormula: 'CHLADNI', harmonicSymmetry: 1, snapStrength: 1.3, plateDamping: 0.3, latticeDensity: 0.9, membraneTension: 0.88, particleSize: 1.1, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.48, agitation: 0.58, streamFlow: 0.0, phaseFluidity: 0.3, chromaticPrism: 'ON',
        cometTrails: 0.0,
        glow: 0.65, minBrightness: 0.8, reactivity: 1.1, masterOpacity: 1.0, colorGain: 2.0 }, 
        modulations: { agitation: { enabled: true, min: 0.3, max: 0.9, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "04 Octagonal Mandala": { 
        category: "Acoustic Plates", 
        config: { blendMode: 'NORMAL', plateShape: 'OCTAGON', modalFormula: 'CHLADNI', harmonicSymmetry: 1, snapStrength: 1.3, plateDamping: 0.3, latticeDensity: 0.9, membraneTension: 0.85, particleSize: 1.1, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.48, agitation: 0.6, streamFlow: 0.0, phaseFluidity: 0.3, glow: 0.4, minBrightness: 0.8, reactivity: 1.2, masterOpacity: 1.0, colorGain: 2.0 } 
    },
    "05 Triangular Geometry": { 
        category: "Acoustic Plates", 
        config: { blendMode: 'NORMAL', plateShape: 'TRIANGLE', modalFormula: 'CHLADNI', harmonicSymmetry: 1, snapStrength: 1.25, plateDamping: 0.35, latticeDensity: 0.85, membraneTension: 0.85, particleSize: 1.1, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.45, agitation: 0.55, streamFlow: 0.0, phaseFluidity: 0.3, chromaticPrism: 'ON',
        cometTrails: 0.0,
        glow: 0.65, minBrightness: 0.8, reactivity: 1.1, masterOpacity: 1.0, colorGain: 2.0 } 
    },
    "06 Whirlpool Maelstrom": { 
        category: "Vortices & Fluid Dynamics", 
        config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.95, membraneTension: 0.3, particleSize: 1.2, force: 1.0, gravity: 0.03, solarWind: 0.0, harmonicRoughness: 0.05, viscosity: 0.2, agitation: 0.4, streamFlow: 1.0, phaseFluidity: 0.85, glow: 0.8, minBrightness: 0.7, reactivity: 1.4, masterOpacity: 1.0, colorGain: 2.4, turbulence: 0.15 }, 
        modulations: { streamFlow: { enabled: true, min: 0.4, max: 1.0, amtBinaural: 1.0, curve: 'EASE_IN_OUT', mixMode: 'MULT', amtBreath: 0, amtHr: 0, amtCoh: 0 }, gravity: { enabled: true, min: 0.01, max: 0.05, amtBreath: 1.0, curve: 'LINEAR', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "07 Cosmic Spiral Vortex": { 
        category: "Vortices & Fluid Dynamics", 
        config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.85, membraneTension: 0.45, particleSize: 1.2, force: 1.0, gravity: 0.02, solarWind: 0.12, harmonicRoughness: 0.0, viscosity: 0.25, agitation: 0.5, streamFlow: 0.9, phaseFluidity: 0.7, glow: 0.85, minBrightness: 0.8, reactivity: 1.4, masterOpacity: 1.0, colorGain: 2.5, turbulence: 0.08 }, 
        modulations: { streamFlow: { enabled: true, min: 0.3, max: 1.0, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 }, solarWind: { enabled: true, min: 0.05, max: 0.35, amtBinaural: 1.0, curve: 'LINEAR', mixMode: 'MULT', amtBreath: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "08 Chladni Cyclone": { 
        category: "Vortices & Fluid Dynamics", 
        config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.75, particleSize: 1.1, force: 1.0, gravity: 0.015, solarWind: 0.0, harmonicRoughness: 0.1, viscosity: 0.45, agitation: 0.6, streamFlow: 0.6, phaseFluidity: 0.6, chromaticPrism: 'ON',
        cometTrails: 0.0,
        glow: 0.65, minBrightness: 0.8, reactivity: 1.3, masterOpacity: 1.0, colorGain: 2.0, turbulence: 0.05 }, 
        modulations: { streamFlow: { enabled: true, min: 0.2, max: 0.8, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "09 Nebula Cloud": { 
        category: "Cosmic Nebulae", 
        config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.75, membraneTension: 0.2, particleSize: 1.2, force: 1.0, gravity: 0.0, solarWind: 0.25, harmonicRoughness: 0.0, viscosity: 0.12, agitation: 0.45, streamFlow: 0.8, phaseFluidity: 0.9, glow: 0.85, minBrightness: 0.65, reactivity: 1.0, masterOpacity: 0.95, colorGain: 2.2 }, 
        modulations: { solarWind: { enabled: true, min: 0.0, max: 0.6, amtBreath: 1.0, curve: 'LINEAR', mixMode: 'MULT', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "10 Magnetic Fluid": { 
        category: "Organic Fluids", 
        config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.65, particleSize: 1.1, force: 1.0, gravity: 0.02, solarWind: 0.0, harmonicRoughness: 0.8, viscosity: 0.65, agitation: 0.6, streamFlow: 0.0, phaseFluidity: 0.3, glow: 0.3, minBrightness: 0.75, reactivity: 1.2, masterOpacity: 1.0, colorGain: 2.0 }, 
        modulations: { harmonicRoughness: { enabled: true, min: 0.4, max: 1.2, amtBreath: 1.0, curve: 'EASE_IN_OUT', inertia: 0.4, mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "11 Oceanic Eddy": { 
        category: "Fluid & Ethereal", 
        config: { blendMode: 'ADDITIVE', plateShape: 'CIRCLE', latticeDensity: 0.9, membraneTension: 0.35, particleSize: 1.2, force: 1.0, gravity: 0.02, solarWind: 0.05, harmonicRoughness: 0.08, viscosity: 0.28, agitation: 0.45, streamFlow: 0.75, phaseFluidity: 0.8, glow: 0.75, minBrightness: 0.75, reactivity: 1.2, masterOpacity: 0.95, colorGain: 2.3, turbulence: 0.15 }, 
        modulations: { streamFlow: { enabled: true, min: 0.3, max: 0.9, amtBreath: 1.0, amtBinaural: 0.5, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtHr: 0, amtCoh: 0 } } 
    },
    "12 Superfluid Quantum Vortex": { 
        category: "Vortices & Fluid Dynamics", 
        config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', latticeDensity: 0.95, membraneTension: 0.85, particleSize: 1.1, force: 1.0, gravity: 0.02, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.35, agitation: 0.55, streamFlow: 0.7, phaseFluidity: 0.7, glow: 0.4, minBrightness: 0.8, reactivity: 1.3, masterOpacity: 1.0, colorGain: 2.1, meshElasticity: 0.45, turbulence: 0.06 }, 
        modulations: { streamFlow: { enabled: true, min: 0.3, max: 0.9, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } } 
    },
    "13 Tone Journey Odyssey": {
        category: "Harmonic Journey",
        config: { blendMode: 'NORMAL', plateShape: 'CIRCLE', modalFormula: 'CHLADNI', exclusiveToneSweep: 'ON', toneSweepPos: 0.0, harmonicSymmetry: 1, snapStrength: 1.3, plateDamping: 0.3, latticeDensity: 0.92, membraneTension: 0.9, particleSize: 1.1, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.48, agitation: 0.6, streamFlow: 0.0, phaseFluidity: 0.35, glow: 0.45, minBrightness: 0.85, reactivity: 1.2, masterOpacity: 1.0, colorGain: 2.2 },
        modulations: { toneSweepPos: { enabled: true, min: 0.0, max: 1.0, amtBreath: 1.0, curve: 'EASE_IN_OUT', mixMode: 'ADD', amtBinaural: 0, amtHr: 0, amtCoh: 0 } }
    },
    "14 Binaural Harmonic Ripple": {
        category: "Binaural & Heart Coherence",
        config: { blendMode: "ADDITIVE", plateShape: "CIRCLE", modalFormula: "CHLADNI", harmonicSymmetry: 2, snapStrength: 1.4, plateDamping: 0.25, edgeRecycle: "ON", latticeDensity: 0.92, membraneTension: 0.7, particleSize: 1.15, force: 1.1, gravity: 0.01, solarWind: 0.05, harmonicRoughness: 0.0, viscosity: 0.35, agitation: 0.6, streamFlow: 0.3, phaseFluidity: 0.6, glow: 1.2, minBrightness: 0.8, colorGain: 2.6, cometTrails: 0.4, chromaticPrism: "ON" },
        modulations: {
            agitation: { enabled: true, min: 0.2, max: 1.2, amtBinaural: 1.0, curve: "EASE_IN_OUT", mixMode: "ADD", amtBreath: 0, amtHr: 0, amtCoh: 0 },
            glow: { enabled: true, min: 0.6, max: 2.0, amtBinaural: 0.8, curve: "EASE_IN_OUT", mixMode: "ADD", amtBreath: 0, amtHr: 0, amtCoh: 0 },
            cometTrails: { enabled: true, min: 0.2, max: 0.75, amtBreath: 0.8, curve: "LINEAR", mixMode: "ADD", amtBinaural: 0, amtHr: 0, amtCoh: 0 }
        }
    },
    "15 Bio-Resonance Heartbeat": {
        category: "Binaural & Heart Coherence",
        config: { blendMode: "NORMAL", plateShape: "OCTAGON", modalFormula: "CHLADNI", harmonicSymmetry: 1, snapStrength: 1.3, plateDamping: 0.3, edgeRecycle: "ON", latticeDensity: 0.95, membraneTension: 0.88, particleSize: 1.2, force: 1.0, gravity: 0.0, solarWind: 0.0, harmonicRoughness: 0.0, viscosity: 0.42, agitation: 0.65, streamFlow: 0.1, phaseFluidity: 0.4, glow: 1.0, minBrightness: 0.85, colorGain: 2.5, cometTrails: 0.35, chromaticPrism: "ON" },
        modulations: {
            force: { enabled: true, min: 0.4, max: 1.8, amtHr: 1.0, amtCoh: 0.6, curve: "EASE_IN_OUT", mixMode: "ADD", amtBreath: 0, amtBinaural: 0 },
            glow: { enabled: true, min: 0.5, max: 1.8, amtCoh: 1.0, curve: "EASE_IN_OUT", mixMode: "ADD", amtBreath: 0, amtBinaural: 0, amtHr: 0 },
            agitation: { enabled: true, min: 0.3, max: 1.0, amtHr: 0.8, curve: "EASE_IN_OUT", mixMode: "ADD", amtBreath: 0, amtBinaural: 0, amtCoh: 0 }
        }
    }

};

export const Lens_Cymatic: VisualizerPlugin = {
    id: 'CYMATIC',
    name: 'Cymatic',
    renderType: 'CANVAS_2D',
    
    parameters: [
        // --- GEOMETRY & SHAPE CONTROLS ---
        { id: 'plateShape', label: 'Plate Shape', type: 'CUSTOM_TOGGLE', section: 'GEOMETRY', icon: 'Grid', options: ['CIRCLE', 'SQUARE', 'HEXAGON', 'OCTAGON', 'TRIANGLE', 'PENTAGON', 'ELLIPSE'], color: '#6366f1', defaultValue: 'CIRCLE' },
        { id: 'nodalPolarity', label: 'Nodal Polarity', type: 'CUSTOM_TOGGLE', section: 'GEOMETRY', icon: 'Sun', options: ['ATTRACT', 'REPEL'], color: '#a855f7', defaultValue: 'ATTRACT' },
        { id: 'modalFormula', label: 'Modal Formula', type: 'SELECT', section: 'GEOMETRY', icon: 'Sliders', options: ['CHLADNI', 'RITZ_SYMMETRIC', 'DIAGONAL', 'RADIAL_CONCENTRIC'], color: '#ec4899', defaultValue: 'CHLADNI' },
        { id: 'harmonicSymmetry', label: 'Harmonic Fold', icon: 'Layers', type: 'SLIDER', min: 1, max: 8, step: 1, color: '#38bdf8', section: 'GEOMETRY', defaultValue: 1 },
        { id: 'snapStrength', label: 'Nodal Snap', icon: 'Magnet', type: 'SLIDER', min: 0.2, max: 3.5, step: 0.1, color: '#c084fc', section: 'GEOMETRY', defaultValue: 1.2 },
        { id: 'plateDamping', label: 'Rim Damping', icon: 'Shield', type: 'SLIDER', min: 0.05, max: 0.95, step: 0.05, color: '#10b981', section: 'GEOMETRY', defaultValue: 0.3 },
        { id: 'edgeRecycle', label: 'Edge Sand Recycle', type: 'CUSTOM_TOGGLE', section: 'GEOMETRY', icon: 'RotateCcw', options: ['OFF', 'ON'], color: '#38bdf8', defaultValue: 'OFF' },
        { id: 'latticeDensity', label: 'Particle Count', icon: 'Activity', type: 'SLIDER', min: 0.1, max: 1.0, step: 0.05, color: '#22d3ee', section: 'GEOMETRY', defaultValue: 0.85 },
        { id: 'membraneTension', label: 'Nodal Adhesion', icon: 'Maximize', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#6366f1', section: 'GEOMETRY', defaultValue: 0.9 },
        { id: 'meshElasticity', label: 'Shape Lock', icon: 'Shield', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.05, color: '#c026d3', section: 'GEOMETRY', defaultValue: 0.25 },
        { id: 'highMotionOpacity', label: 'Motion Alpha', icon: 'Ghost', type: 'SLIDER', min: 0.1, max: 1.0, step: 0.05, color: '#fca5a1', section: 'GEOMETRY', defaultValue: 0.75 },
        { id: 'particleSize', label: 'Sand Size', icon: 'Sparkles', type: 'SLIDER', min: 0.5, max: 3.0, step: 0.1, color: '#fbbf24', section: 'GEOMETRY', defaultValue: 1.1 },

        // --- PHYSICS & FORCES ---
        { id: 'force', label: 'Master Force', icon: 'Zap', type: 'SLIDER', min: 0.0, max: 2.5, step: 0.05, color: '#f43f5e', section: 'PHYSICS', defaultValue: 1.0 },
        { id: 'gravity', label: 'Gravity Pull', icon: 'ArrowDown', type: 'SLIDER', min: 0, max: 0.08, step: 0.002, color: '#ef4444', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'solarWind', label: 'Solar Wind', icon: 'Wind', type: 'SLIDER', min: 0, max: 0.8, step: 0.05, color: '#fbbf24', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'turbulence', label: 'Turbulence', icon: 'Shuffle', type: 'SLIDER', min: 0, max: 0.8, step: 0.05, color: '#94a3b8', section: 'PHYSICS', defaultValue: 0.05 },
        { id: 'harmonicRoughness', label: 'Entropy (Noise)', icon: 'Waves', type: 'SLIDER', min: 0, max: 1.5, step: 0.05, color: '#ec4899', section: 'PHYSICS', defaultValue: 0.0 },
        { id: 'viscosity', label: 'Plate Viscosity', icon: 'Droplet', type: 'SLIDER', min: 0.05, max: 0.95, step: 0.02, color: '#34d399', section: 'PHYSICS', defaultValue: 0.48 },
        { id: 'agitation', label: 'Vibration Force', icon: 'Activity', type: 'SLIDER', min: 0.05, max: 1.8, step: 0.05, color: '#f43f5e', section: 'PHYSICS', defaultValue: 0.55 },

        // --- WAVES & HARMONICS ---
        { id: 'exclusiveToneSweep', label: 'Tone Journey (Exclusive)', type: 'CUSTOM_TOGGLE', section: 'WAVES', icon: 'Compass', options: ['OFF', 'ON'], color: '#ec4899', defaultValue: 'OFF' },
        { id: 'toneSweepPos', label: 'Tone Journey Sweep', icon: 'Compass', type: 'SLIDER', min: 0.0, max: 1.0, step: 0.01, color: '#f43f5e', section: 'WAVES', defaultValue: 0.0 },
        { id: 'streamFlow', label: 'Stream Flow', icon: 'Wind', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#22d3ee', section: 'WAVES', defaultValue: 0.0 },
        { id: 'phaseFluidity', label: 'Phase Fluidity', icon: 'Waves', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#2dd4bf', section: 'WAVES', defaultValue: 0.4 },

        // --- LIGHT & APPEARANCE ---
        { id: 'chromaticPrism', label: 'Spectral Color Prism', type: 'CUSTOM_TOGGLE', section: 'LIGHT', icon: 'Palette', options: ['OFF', 'ON'], color: '#a855f7', defaultValue: 'ON' },
        { id: 'cometTrails', label: 'Comet Trails', icon: 'Flame', type: 'SLIDER', min: 0.0, max: 0.9, step: 0.02, color: '#fb923c', section: 'LIGHT', defaultValue: 0.0 },
        { id: 'glow', label: 'Energy Glow', icon: 'Sun', type: 'SLIDER', min: 0, max: 2.5, step: 0.05, color: '#ffffff', section: 'LIGHT', defaultValue: 0.65 },
        { id: 'minBrightness', label: 'Idle Brightness', icon: 'Lightbulb', type: 'SLIDER', min: 0, max: 1.0, step: 0.05, color: '#94a3b8', section: 'LIGHT', defaultValue: 0.8 },
        { id: 'colorGain', label: 'Color Intensity', icon: 'Sparkles', type: 'SLIDER', min: 0.1, max: 4.0, step: 0.1, color: '#e879f9', section: 'LIGHT', defaultValue: 2.2 },
        { id: 'blendMode', label: 'Blend Mode', type: 'CUSTOM_TOGGLE', section: 'LIGHT', icon: 'Layers', options: ['ADDITIVE', 'NORMAL'], color: 'cyan', defaultValue: 'NORMAL' }
    ],

    defaultConfig: {
        plateShape: 'CIRCLE',
        nodalPolarity: 'ATTRACT',
        modalFormula: 'CHLADNI',
        harmonicSymmetry: 1,
        snapStrength: 1.2,
        plateDamping: 0.3,
        edgeRecycle: 'OFF',
        latticeDensity: 0.85,
        membraneTension: 0.9,
        meshElasticity: 0.25,
        highMotionOpacity: 0.75,
        particleSize: 1.1,
        force: 1.0,
        gravity: 0.0,
        solarWind: 0.0,
        turbulence: 0.05,
        harmonicRoughness: 0.0,
        viscosity: 0.48,
        agitation: 0.55,
        exclusiveToneSweep: 'OFF',
        toneSweepPos: 0.0,
        streamFlow: 0.0,
        phaseFluidity: 0.4,
        chromaticPrism: 'ON',
        cometTrails: 0.0,
        glow: 0.65,
        minBrightness: 0.8,
        colorGain: 2.0,
        blendMode: 'NORMAL'
    },

    presets: Object.entries(RAW_PRESETS).map(([name, data]: [string, Record<string, unknown>], i) => ({
        id: `factory_cymatic_${i}`, name, config: { ...(data.config as Record<string, unknown>) }, modulations: data.modulations || {}
    })),

    render: (context: LensContext, localConfig: Record<string, unknown>) => {
        const { ctx, w, h, bpm, amplitudes, theme, time, memory, aether, breathRadius, sensorMode } = context;
        
        const maxRadius = Math.min(w, h) / 2 * 0.95;

        const quality = (memory.qualityMultiplier as number) ?? 1.0;
        const activeParticleCount = Math.min(MAX_PARTICLES, Math.floor(MAX_PARTICLES * ((localConfig.latticeDensity as number) ?? 0.85) * quality));
        const adhesion = (localConfig.membraneTension as number) ?? 0.9; 
        const roughness = (localConfig.harmonicRoughness as number) ?? 0.0;
        const rawForce = localConfig.force !== undefined ? Number(localConfig.force) : 1.0;
        const forceMult = Math.max(0.0, rawForce);
        const reactivity = (localConfig.reactivity as number) ?? 1.0;
        const effectiveViscosity = (localConfig.viscosity as number) ?? 0.48;
        const agitationMultiplier = (localConfig.agitation as number) ?? 0.55;
        
        const isNebula = localConfig.blendMode === 'ADDITIVE'; 
        const plateShape = (localConfig.plateShape as string) || 'CIRCLE';
        const nodalPolarity = (localConfig.nodalPolarity as string) || 'ATTRACT';
        const modalFormula = (localConfig.modalFormula as string) || 'CHLADNI';
        const harmonicSymmetry = (localConfig.harmonicSymmetry as number) || 1;
        const snapStrength = (localConfig.snapStrength as number) || 1.2;
        const plateDamping = (localConfig.plateDamping as number) ?? 0.3;

        // 1. Initial Data Buffer setup - DOUBLE BUFFERING
        const needsInit = !memory.initialized || memory.lastShape !== plateShape;
        
        if (needsInit) {
            if (memory.worker) {
                memory.worker.terminate();
                memory.worker = null;
                memory.workerBusy = false;
            }
            memory.posA = new Float32Array(MAX_PARTICLES * 2); 
            memory.velA = new Float32Array(MAX_PARTICLES * 2); 
            memory.posB = new Float32Array(MAX_PARTICLES * 2); 
            memory.velB = new Float32Array(MAX_PARTICLES * 2); 
            
            memory.renderBufferIdx = 0; // 0 = A, 1 = B
            memory.initialized = true;
            memory.lastShape = plateShape;

            // Initialize sand distribution uniformly over the plate
            for (let i = 0; i < MAX_PARTICLES; i++) {
                const ix = i * 2; const iy = ix + 1;
                let startX = 0, startY = 0;
                if (plateShape === 'SQUARE') {
                    startX = (Math.random() - 0.5) * maxRadius * 1.8;
                    startY = (Math.random() - 0.5) * maxRadius * 1.8;
                } else {
                    const r = Math.sqrt(Math.random()) * maxRadius * 0.92;
                    const th = Math.random() * TWO_PI;
                    startX = r * Math.cos(th);
                    startY = r * Math.sin(th);
                }
                memory.posA[ix] = memory.posB[ix] = startX;
                memory.posA[iy] = memory.posB[iy] = startY;
            }
        }

        // Determine which buffer is for rendering and which is for computing
        const renderPos = memory.renderBufferIdx === 0 ? memory.posA : memory.posB;
        const renderVel = memory.renderBufferIdx === 0 ? memory.velA : memory.velB;
        const computePos = memory.renderBufferIdx === 0 ? memory.posB : memory.posA;
        const computeVel = memory.renderBufferIdx === 0 ? memory.velB : memory.velA;

        // --- OBJECT POOLING FOR MODAL HARMONICS ---
        if (!memory.cymaticWaves) memory.cymaticWaves = new Map<string, Record<string, unknown>>();
        if (!memory.targetVolumes) memory.targetVolumes = new Map<string, number>();
        if (!memory.targetFreqs) memory.targetFreqs = new Map<string, number>();
        if (!memory.activeModes) memory.activeModes = [];

        const currentWaves = memory.cymaticWaves as Map<string, Record<string, unknown>>;
        const targetVolumes = memory.targetVolumes as Map<string, number>;
        const targetFreqs = memory.targetFreqs as Map<string, number>;
        const activeModes = memory.activeModes as Record<string, unknown>[];

        targetVolumes.clear();
        targetFreqs.clear();
        activeModes.length = 0; 

        // --- COLLECT ACTIVE CANDIDATE TONES ---
        interface ToneCandidate {
            id: string;
            freq: number;
            baseVol: number;
        }
        const toneCandidates: ToneCandidate[] = [];

        if (amplitudes) {
            LATTICE_CHANNELS.forEach(ch => {
                const rawAmp = amplitudes.get(ch.id) || 0;
                const amp = rawAmp * reactivity * 8.0; 
                if (amp > 0.005) {
                    const freq = (context as unknown as { customFrequencies?: Record<string, number> }).customFrequencies?.[ch.id] ?? ch.freq;
                    toneCandidates.push({ id: ch.id, freq, baseVol: amp * forceMult });
                }
            });
        }

        if (bpm > 0 && HEART_HARMONIC_DEFS) {
             HEART_HARMONIC_DEFS.forEach((def, i) => {
                const id = `HEART_HARMONIC_${i}`;
                const rawAmp = amplitudes?.get(id) || 0;
                const amp = rawAmp * reactivity * 8.0;
                if (amp > 0.005) {
                    toneCandidates.push({ id, freq: (bpm / 60) * def.mult, baseVol: amp * forceMult });
                }
            });
        }

        // Fallback sacred tones if audio is silent/muted so plate creates geometric standing waves
        if (toneCandidates.length === 0) {
            const fallbackFreqs = [72, 256, 384, 432, 512, 528, 963];
            fallbackFreqs.forEach((freq, idx) => {
                toneCandidates.push({
                    id: `SACRED_${idx}`,
                    freq,
                    baseVol: 0.7 * Math.max(0.4, forceMult)
                });
            });
        }

        // Sort candidate tones ascending by frequency (lowest to highest)
        toneCandidates.sort((a, b) => a.freq - b.freq);

        // --- TONE JOURNEY SWEEP VS SUPERPOSITION ---
        const isExclusiveSweep = localConfig.exclusiveToneSweep === 'ON' || localConfig.exclusiveToneSweep === true;
        const sweepPos = Math.max(0.0, Math.min(1.0, Number(localConfig.toneSweepPos ?? 0.0)));

        if (isExclusiveSweep) {
            const N = toneCandidates.length;
            if (N === 1) {
                targetVolumes.set(toneCandidates[0].id, toneCandidates[0].baseVol);
                targetFreqs.set(toneCandidates[0].id, toneCandidates[0].freq);
            } else if (N > 1) {
                // Map sweepPos [0, 1] across the N active tones
                const sweepCoord = sweepPos * (N - 1);
                toneCandidates.forEach((candidate, idx) => {
                    const dist = Math.abs(sweepCoord - idx);
                    if (dist < 1.0) {
                        // Smooth cosine blend window isolating the current focused tone
                        const weight = 0.5 * (1.0 + Math.cos(Math.PI * dist));
                        const vol = candidate.baseVol * weight;
                        if (vol > 0.002) {
                            targetVolumes.set(candidate.id, vol);
                            targetFreqs.set(candidate.id, candidate.freq);
                        }
                    }
                });
            }
        } else {
            // Standard superposition of all active channels
            toneCandidates.forEach(cand => {
                targetVolumes.set(cand.id, cand.baseVol);
                targetFreqs.set(cand.id, cand.freq);
            });
        }

        const minBrightness = (localConfig.minBrightness as number) ?? 0.8;
        const fluidity = (localConfig.phaseFluidity as number) ?? 0.4;
        const lerpRate = Math.max(0.01, 0.25 - (fluidity * 0.18));

        targetVolumes.forEach((targetAmp, id) => {
            const freq = targetFreqs.get(id) || 100;
            if (!currentWaves.has(id)) {
                const newWave = { n: 0, m: 0, k: 0, speed: 0, vol: 0, color: getFrequencyColor(freq), type: 'HARMONIC' };
                getUniversalCymatic(freq, newWave);
                currentWaves.set(id, newWave);
            } else {
                const wave = currentWaves.get(id);
                getUniversalCymatic(freq, wave);
                if (wave) wave.color = getFrequencyColor(freq);
            }
        });

        let totalVol = 0;

        currentWaves.forEach((wave, id) => {
            const target = targetVolumes.get(id) || 0;
            const currentVol = (wave.vol as number) || 0;
            wave.vol = currentVol + (target - currentVol) * lerpRate; 
            if ((wave.vol as number) > 0.005 || target > 0) {
                activeModes.push(wave);
                totalVol += (wave.vol as number);
            } else {
                currentWaves.delete(id); 
            }
        });

        // Dominant mode sorted first
        activeModes.sort((a, b) => {
            const vA = (a as { vol: number }).vol;
            const vB = (b as { vol: number }).vol;
            return vB - vA;
        });

        const safeTotalVol = Math.max(0.001, totalVol);
        const kineticEnergy = Math.min(2.0, totalVol * forceMult);

        const flowFactor = (localConfig.streamFlow as number) || 0;
        const windModulation = (kineticEnergy * (1 - flowFactor)) + flowFactor;
        const solarWindStrength = (((localConfig.solarWind as number) || 0) * forceMult) * windModulation; 
        const centralGravity = (((localConfig.gravity as number) || 0) * forceMult);   
        const vortexStream = flowFactor * forceMult * 1.5;
        const meshElasticity = (localConfig.meshElasticity as number) ?? 0.25;
        const turbulence = (localConfig.turbulence as number) ?? 0.05;
        const globalPhase = time * (bpm > 0 ? bpm / 60 : 1.0);

        let dominantColor = theme?.secondary || '#ffffff';
        if (activeModes.length > 0) dominantColor = (activeModes[0] as { color: string }).color;

        // --- GRAPHICS RENDERING PHASE ---
        ctx.save();

        const perspectiveTilt = (localConfig.perspectiveTilt as number) || 0;
        if (perspectiveTilt > 0) {
            const scaleY = 1 - (perspectiveTilt / 90);
            ctx.scale(1, scaleY);
        }

        const effectiveGlow = (localConfig.glow as number) ?? 0.65;
        const colorGain = (localConfig.colorGain as number) ?? 2.2;
        const masterOpacity = (localConfig.masterOpacity as number) || 1;
        const rawParticleSize = Number(localConfig.particleSize) || 1.1;
        const cometTrails = Math.max(0.0, Math.min(0.9, Number(localConfig.cometTrails ?? 0.0)));
        const baseParticleSize = rawParticleSize;
        
        const alphaMod = masterOpacity * Math.min(1.0, 0.9 + (colorGain * 0.1)); 
        
        ctx.globalCompositeOperation = isNebula ? 'lighter' : 'source-over';
        
        const alphaFloor = Math.max(0.3, minBrightness * 0.7);
        const intensityAlpha = Math.min(1.0, 0.7 + (colorGain * 0.15));
        const baseAlpha = isNebula ? Math.min(1.0, intensityAlpha * alphaMod * Math.max(alphaFloor, kineticEnergy)) : Math.min(1.0, alphaMod);

        const isChromatic = localConfig.chromaticPrism !== 'OFF';
        const activePalette: string[] = (activeModes.length > 0 && isChromatic)
            ? activeModes.map((m: Record<string, unknown>) => (m.color as string) || dominantColor)
            : [dominantColor];

        const whiteColor = `rgba(255, 255, 255, ${Math.min(1.0, 0.9 + colorGain * 0.05)})`;
        
        if (memory.lastGlow !== effectiveGlow || memory.lastMinBrightness !== minBrightness || memory.lastColorGain !== colorGain) {
            const lBase = Math.floor(180 + (minBrightness * 50));
            const lBoost = Math.floor(Math.min(1.5, effectiveGlow) * 30);
            const lTotal = Math.min(255, Math.max(0, lBase + lBoost));
            memory.idleColor = `rgba(${lTotal}, ${lTotal}, ${lTotal}, 1.0)`;
            memory.lastGlow = effectiveGlow;
            memory.lastMinBrightness = minBrightness;
            memory.lastColorGain = colorGain;
        }
        const idleColor = memory.idleColor as string;

        if (renderPos && renderPos.length > 0) {
            const motionAlphaMod = (localConfig.highMotionOpacity as number) ?? 0.75;
            
            drawCymaticCanvas(
                ctx,
                w,
                h,
                renderPos,
                renderVel,
                activeParticleCount,
                {
                    isNebula,
                    baseParticleSize,
                    baseAlpha,
                    minBrightness,
                    motionAlphaMod,
                    colorGain,
                    effectiveGlow,
                    cometTrails,
                    dominantColor,
                    idleColor,
                    whiteColor,
                    activePalette,
                    isChromatic
                }
            );
            
            // --- KINEMATICS DISPATCH TO WORKER (DOUBLE BUFFERED) ---
            if (!memory.workerBusy && computePos && computePos.length > 0) {
                if (!memory.worker) {
                    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
                    memory.worker = new Worker(URL.createObjectURL(blob));
                    memory.worker.onmessage = (e: MessageEvent) => {
                        if (memory.renderBufferIdx === 0) {
                            memory.posB = e.data.pos;
                            memory.velB = e.data.vel;
                            memory.renderBufferIdx = 1;
                        } else {
                            memory.posA = e.data.pos;
                            memory.velA = e.data.vel;
                            memory.renderBufferIdx = 0;
                        }
                        memory.workerBusy = false;
                    };
                }
 
                memory.workerBusy = true;
                const serializedModes = activeModes.map((m: Record<string, unknown>) => ({
                    type: m.type as string,
                    n: (m.n as number) || 2,
                    m: (m.m as number) || 1,
                    k: (m.k as number) || (Math.PI * 3.5),
                    speed: (m.speed as number) || 0.4,
                    volRatio: ((m.vol as number) || 0) / safeTotalVol
                }));

                const binauralPulse = Number(localConfig.binauralRipple ?? 0.0);
                const heartShockwave = Number(localConfig.heartPulse ?? 0.0);

                memory.worker.postMessage({
                    pos: computePos,
                    vel: computeVel,
                    activeModes: serializedModes,
                    maxRadius,
                    activeParticleCount,
                    adhesion,
                    roughness,
                    forceMult: kineticEnergy,
                    effectiveViscosity,
                    agitationMultiplier,
                    isNebula,
                    plateShape,
                    flowFactor,
                    solarWindStrength,
                    centralGravity,
                    vortexStream,
                    meshElasticity,
                    turbulence,
                    globalPhase,
                    time,
                    sensorMode,
                    breathRadius,
                    aether,
                    binauralPulse,
                    heartShockwave,
                    nodalPolarity,
                    modalFormula,
                    harmonicSymmetry,
                    snapStrength,
                    plateDamping,
                    edgeRecycle: localConfig.edgeRecycle ?? 'OFF'
                }, [computePos.buffer, computeVel.buffer]);
            }
        }
        
        ctx.restore();
    },
    cleanup: (context) => {
        const { memory } = context;
        if (memory.worker) {
            memory.worker.terminate();
        }
        Object.keys(memory).forEach(key => delete memory[key]);
    }
};
