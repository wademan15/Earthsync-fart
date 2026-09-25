/**
 * Unified Kaleidoscope and Crystalline Prismatic Symmetry Transforms
 * 
 * Supports:
 * 1. Primary N-fold dihedral kaleidoscopic reflection (mirror sectors)
 * 2. Crystalline multi-layered faceted prismatic symmetry (hexagonal/octagonal crystal facets)
 */

/**
 * GLSL helper snippet to insert into WebGL fragment/vertex shaders
 */
export const KALEIDOSCOPE_GLSL_FUNCS = `
// Primary N-fold dihedral reflection
vec2 applyKaleidoscopeFold(vec2 p, float folds) {
    if (folds < 1.5) return p;
    float r = length(p);
    if (r < 0.0001) return p;
    float a = atan(p.y, p.x);
    const float tau = 6.283185307179586;
    float sector = tau / folds;
    float aNorm = mod(a, tau);
    if (aNorm < 0.0) aNorm += tau;
    float sectorIdx = floor(aNorm / sector);
    float subA = aNorm - sectorIdx * sector;
    if (mod(sectorIdx, 2.0) > 0.5) {
        subA = sector - subA; // mirror reflection
    }
    return vec2(cos(subA), sin(subA)) * r;
}

// Crystalline faceted secondary reflection layer (faceted quartz prism distortion)
vec2 applyCrystallineLayer(vec2 p, float crystalFacets) {
    if (crystalFacets < 1.5) return p;
    float r = length(p);
    if (r < 0.0001) return p;
    // 30-degree offset for crystal lattice cleavage plane
    float a = atan(p.y, p.x) + 0.52359877559;
    const float tau = 6.283185307179586;
    float sector = tau / crystalFacets;
    float aNorm = mod(a, tau);
    if (aNorm < 0.0) aNorm += tau;
    float sectorIdx = floor(aNorm / sector);
    float subA = aNorm - sectorIdx * sector;
    if (mod(sectorIdx, 2.0) > 0.5) {
        subA = sector - subA;
    }
    // Prismatic facet refraction scale giving gem/crystal facet depth
    float facetMod = 1.0 + 0.06 * cos(subA * 2.0);
    return vec2(cos(subA), sin(subA)) * (r * facetMod);
}
`;

/**
 * Maps a 2D coordinate through Kaleidoscope (folds) and Crystalline (crystalFacets) symmetry
 */
export function mapKaleidoscope2D(
    x: number,
    y: number,
    cx: number,
    cy: number,
    folds: number,
    crystalFacets: number
): { x: number; y: number } {
    let dx = x - cx;
    let dy = y - cy;

    // 1. Primary Kaleidoscope
    if (folds >= 2) {
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > 0.0001) {
            let a = Math.atan2(dy, dx);
            const tau = Math.PI * 2;
            const sector = tau / folds;
            let aNorm = a % tau;
            if (aNorm < 0) aNorm += tau;
            const sectorIdx = Math.floor(aNorm / sector);
            let subA = aNorm - sectorIdx * sector;
            if (sectorIdx % 2 === 1) {
                subA = sector - subA;
            }
            dx = Math.cos(subA) * r;
            dy = Math.sin(subA) * r;
        }
    }

    // 2. Crystalline Prismatic Layer
    if (crystalFacets >= 2) {
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > 0.0001) {
            let a = Math.atan2(dy, dx) + (Math.PI / 6); // 30 deg facet offset
            const tau = Math.PI * 2;
            const sector = tau / crystalFacets;
            let aNorm = a % tau;
            if (aNorm < 0) aNorm += tau;
            const sectorIdx = Math.floor(aNorm / sector);
            let subA = aNorm - sectorIdx * sector;
            if (sectorIdx % 2 === 1) {
                subA = sector - subA;
            }
            const facetMod = 1.0 + 0.06 * Math.cos(subA * 2.0);
            dx = Math.cos(subA) * (r * facetMod);
            dy = Math.sin(subA) * (r * facetMod);
        }
    }

    return { x: cx + dx, y: cy + dy };
}

/**
 * Composite full-canvas kaleidoscope and crystalline reflection wrapper for 2D Canvas visualizers.
 * Captures rendered geometry and repeats it across radial sectors with mirror symmetry.
 */
export function applyCanvasKaleidoscope(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cx: number,
    cy: number,
    folds: number,
    crystalFacets: number,
    renderFn: () => void
) {
    const f = Math.floor(folds || 0);
    const c = Math.floor(crystalFacets || 0);

    if (f < 2 && c < 2) {
        renderFn();
        return;
    }

    // Render original canvas content into offscreen buffer
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) {
        renderFn();
        return;
    }

    // Render onto offscreen
    renderFn();

    // Copy rendered content to offscreen
    offCtx.drawImage(ctx.canvas, 0, 0);

    // Clear main canvas for kaleidoscope compositing
    ctx.clearRect(0, 0, w, h);

    const radius = Math.max(w, h);

    // Composite primary kaleidoscope fold
    const activeFolds = f >= 2 ? f : 1;
    const sliceAngle = (Math.PI * 2) / activeFolds;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < activeFolds; i++) {
        ctx.save();
        ctx.rotate(i * sliceAngle);

        // Clip pie slice
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius * 1.5, -sliceAngle * 0.5 - 0.005, sliceAngle * 0.5 + 0.005);
        ctx.closePath();
        ctx.clip();

        // Even slices draw normal, odd slices mirror for true dihedral kaleidoscope symmetry
        if (i % 2 === 1) {
            ctx.scale(1, -1);
        }

        ctx.drawImage(offscreen, -cx, -cy);
        ctx.restore();
    }

    // Crystalline multi-layered faceted overlay pass
    if (c >= 2) {
        const cSlice = (Math.PI * 2) / c;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = 'lighter';
        ctx.rotate(Math.PI / (c * 2)); // Offset by half-facet for interlocking crystal effect

        for (let j = 0; j < c; j++) {
            ctx.save();
            ctx.rotate(j * cSlice);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius * 1.5, -cSlice * 0.5 - 0.005, cSlice * 0.5 + 0.005);
            ctx.closePath();
            ctx.clip();

            if (j % 2 === 1) {
                ctx.scale(1, -1);
            }

            ctx.drawImage(offscreen, -cx, -cy);
            ctx.restore();
        }
        ctx.restore();
    }

    ctx.restore();
}
