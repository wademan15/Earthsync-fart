export interface RenderConfig {
    isNebula: boolean;
    baseParticleSize: number;
    baseAlpha: number;
    minBrightness: number;
    motionAlphaMod: number;
    colorGain: number;
    effectiveGlow: number;
    cometTrails: number;
    dominantColor: string;
    idleColor: string;
    whiteColor: string;
    activePalette: string[];
    isChromatic: boolean;
}

export function drawCymaticCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    pos: Float32Array,
    vel: Float32Array,
    count: number,
    cfg: RenderConfig
) {
    if (cfg.cometTrails > 0.02) {
        ctx.fillStyle = cfg.isNebula ? `rgba(0, 0, 0, ${1.0 - cfg.cometTrails})` : `rgba(8, 8, 12, ${1.0 - cfg.cometTrails})`;
        ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    const glowPx = cfg.effectiveGlow > 0.15 ? Math.round(cfg.effectiveGlow * 12) : 0;
    const pSize = cfg.baseParticleSize;
    const numColors = cfg.activePalette.length;

    // --- PASS 1: Stationary Nodal Sand ---
    ctx.globalAlpha = cfg.isNebula 
        ? Math.min(1.0, cfg.baseAlpha * 1.1) 
        : Math.min(1.0, Math.max(0.85, cfg.baseAlpha * (0.85 + cfg.minBrightness * 0.15)));
    
    ctx.shadowBlur = glowPx;
    ctx.shadowColor = cfg.dominantColor;

    if (cfg.isNebula) {
        ctx.fillStyle = cfg.dominantColor;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const k = i * 2;
            if (vel[k] * vel[k] + vel[k + 1] * vel[k + 1] <= 0.45) {
                ctx.rect(pos[k], pos[k + 1], pSize, pSize);
            }
        }
        ctx.fill();
    } else if (cfg.isChromatic && numColors > 1) {
        for (let c = 0; c < numColors; c++) {
            ctx.fillStyle = cfg.activePalette[c];
            ctx.beginPath();
            for (let i = c; i < count; i += numColors) {
                const k = i * 2;
                if (vel[k] * vel[k] + vel[k + 1] * vel[k + 1] <= 0.45) {
                    ctx.rect(pos[k], pos[k + 1], pSize, pSize);
                }
            }
            ctx.fill();
        }
    } else {
        ctx.fillStyle = cfg.idleColor;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const k = i * 2;
            if (vel[k] * vel[k] + vel[k + 1] * vel[k + 1] <= 0.45) {
                ctx.rect(pos[k], pos[k + 1], pSize, pSize);
            }
        }
        ctx.fill();
    }

    // --- PASS 2: Moving Antinodes ---
    ctx.globalAlpha = Math.min(
        1.0,
        cfg.isNebula
            ? cfg.baseAlpha * cfg.motionAlphaMod * (0.8 + cfg.colorGain * 0.1)
            : Math.max(0.75, cfg.baseAlpha * cfg.motionAlphaMod)
    );

    if (glowPx > 0) {
        ctx.shadowBlur = Math.round(glowPx * 1.5);
        ctx.shadowColor = cfg.isNebula ? '#ffffff' : cfg.dominantColor;
    }

    if (cfg.isNebula) {
        ctx.fillStyle = cfg.whiteColor;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const k = i * 2;
            if (vel[k] * vel[k] + vel[k + 1] * vel[k + 1] > 0.45) {
                ctx.rect(pos[k], pos[k + 1], pSize, pSize);
            }
        }
        ctx.fill();
    } else if (cfg.isChromatic && numColors > 1) {
        for (let c = 0; c < numColors; c++) {
            ctx.fillStyle = cfg.activePalette[(c + 1) % numColors];
            ctx.beginPath();
            for (let i = c; i < count; i += numColors) {
                const k = i * 2;
                if (vel[k] * vel[k] + vel[k + 1] * vel[k + 1] > 0.45) {
                    ctx.rect(pos[k], pos[k + 1], pSize, pSize);
                }
            }
            ctx.fill();
        }
    } else {
        ctx.fillStyle = cfg.dominantColor;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const k = i * 2;
            if (vel[k] * vel[k] + vel[k + 1] * vel[k + 1] > 0.45) {
                ctx.rect(pos[k], pos[k + 1], pSize, pSize);
            }
        }
        ctx.fill();
    }
}
