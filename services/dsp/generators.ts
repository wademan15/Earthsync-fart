// ITU-R BS.1770 / K-Weighting Perceptual Loudness Filter for Audio Normalization
const computeKWeightingLoudness = (samples: Float32Array, sampleRate: number): number => {
    // Stage 1: High-shelf filter (+4dB gain @ ~1680 Hz to model acoustic head effect)
    const f0_hs = 1680.0;
    const gain_db = 3.9998438;
    const v_hs = Math.pow(10, gain_db / 20.0);
    const k_hs = Math.tan((Math.PI * f0_hs) / sampleRate);
    const vh = Math.sqrt(v_hs);
    const a0_hs = 1.0 + Math.SQRT2 * k_hs + k_hs * k_hs;
    const b0_hs = (v_hs + Math.SQRT2 * vh * k_hs + k_hs * k_hs) / a0_hs;
    const b1_hs = (2.0 * (k_hs * k_hs - v_hs)) / a0_hs;
    const b2_hs = (v_hs - Math.SQRT2 * vh * k_hs + k_hs * k_hs) / a0_hs;
    const a1_hs = (2.0 * (k_hs * k_hs - 1.0)) / a0_hs;
    const a2_hs = (1.0 - Math.SQRT2 * k_hs + k_hs * k_hs) / a0_hs;

    // Stage 2: High-pass filter (2nd order Butterworth @ ~38 Hz to model human low-freq ear sensitivity)
    const f0_hp = 38.13547087602444;
    const k_hp = Math.tan((Math.PI * f0_hp) / sampleRate);
    const q_hp = 0.7071067811865475;
    const a0_hp = 1.0 + k_hp / q_hp + k_hp * k_hp;
    const b0_hp = 1.0 / a0_hp;
    const b1_hp = -2.0 / a0_hp;
    const b2_hp = 1.0 / a0_hp;
    const a1_hp = (2.0 * (k_hp * k_hp - 1.0)) / a0_hp;
    const a2_hp = (1.0 - k_hp / q_hp + k_hp * k_hp) / a0_hp;

    let x1_hs = 0, x2_hs = 0, y1_hs = 0, y2_hs = 0;
    let x1_hp = 0, x2_hp = 0, y1_hp = 0, y2_hp = 0;
    let sumSq = 0;

    const len = samples.length;
    for (let i = 0; i < len; i++) {
        const x0 = samples[i];

        // Apply Stage 1 High-Shelf
        const y_hs = b0_hs * x0 + b1_hs * x1_hs + b2_hs * x2_hs - a1_hs * y1_hs - a2_hs * y2_hs;
        x2_hs = x1_hs; x1_hs = x0;
        y2_hs = y1_hs; y1_hs = y_hs;

        // Apply Stage 2 High-Pass
        const y_hp = b0_hp * y_hs + b1_hp * x1_hp + b2_hp * x2_hp - a1_hp * y1_hp - a2_hp * y2_hp;
        x2_hp = x1_hp; x1_hp = y_hs;
        y2_hp = y1_hp; y1_hp = y_hp;

        sumSq += y_hp * y_hp;
    }

    return Math.sqrt(sumSq / Math.max(1, len));
};

const noiseBufferCache = new Map<string, AudioBuffer>();

export const createNoiseBuffer = (ctx: AudioContext, type: string) => {
    const cacheKey = `${ctx.sampleRate}_${type}`;
    const cached = noiseBufferCache.get(cacheKey);
    if (cached) return cached;

    // 3.0 second buffer for rich, natural textural loop variation
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
    let brownAccum = 0.0;

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        let val = 0;

        // True 1/f Pink Noise (Kellet 7-pole filter)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;

        // True 1/f^2 Brown Noise with gentle DC-leak integration
        brownAccum = brownAccum * 0.996 + white * 0.035;
        if (brownAccum > 1.0) brownAccum = 1.0;
        else if (brownAccum < -1.0) brownAccum = -1.0;
        const brown = brownAccum;

        // Texture Synthesis - Pure, organic, smooth noise textures with NO artificial periodic LFO modulations
        if (type === 'WHITE') {
            val = white * 0.4; // Softened full spectrum
        } else if (type === 'PINK') {
            val = pink * 1.5; // Natural 1/f balanced pink noise
        } else if (type === 'BROWN') {
            val = brown * 1.8; // Deep resonant 1/f^2 brown noise
        } else if (type === 'OCEAN') {
            // Smooth oceanic wash: deep brown body + airy pink crest
            val = brown * 0.85 + pink * 0.45;
        } else if (type === 'WIND') {
            // Breathable airy aerodynamic breeze
            val = brown * 0.5 + pink * 0.7;
        } else if (type === 'RAIN') {
            // Gentle precipitation bed with soft water droplets
            val = pink * 1.1;
            if (Math.random() > 0.995) {
                val += (Math.random() * 2 - 1) * 0.2;
            }
        } else if (type === 'STREAM') {
            // Forest brook liquid flux
            val = pink * 0.85 + white * 0.15;
        } else if (type === 'FOREST') {
            // Night forest atmosphere with gentle woodland rustle
            val = pink * 0.85 + brown * 0.35;
        } else if (type === 'CAVE') {
            // Subterranean cavern warmth
            val = brown * 1.4 + pink * 0.2;
        } else if (type === 'FIRE') {
            // Warm hearth ember crackle
            val = brown * 0.6 + pink * 0.5;
            if (Math.random() > 0.996) {
                val += (Math.random() * 2 - 1) * 0.3;
            }
        } else if (type === 'VINYL') {
            // Warm analog turntable floor
            val = pink * 0.7 + brown * 0.4;
            if (Math.random() > 0.998) {
                val += (Math.random() * 2 - 1) * 0.2;
            }
        } else if (type === 'DRONE') {
            // Grounding harmonic meditative bed
            val = brown * 1.2 + pink * 0.3;
        } else {
            val = pink * 1.4;
        }

        output[i] = val;
    }

    // High-pass filter at ~15Hz to remove any accumulated DC bias
    let prevX = 0, prevY = 0;
    const hpAlpha = 0.998;
    for (let i = 0; i < bufferSize; i++) {
        const x = output[i];
        const y = hpAlpha * (prevY + x - prevX);
        prevX = x;
        prevY = y;
        output[i] = y;
    }

    // Seamless Boundary Crossfade (last 2048 samples smoothly fade into first 2048 samples)
    const fadeLen = Math.min(2048, Math.floor(bufferSize * 0.05));
    for (let i = 0; i < fadeLen; i++) {
        const factor = i / fadeLen;
        const outIdx = bufferSize - fadeLen + i;
        const inIdx = i;
        // Equal-power crossfade between start and end
        const gainOut = Math.cos(factor * 0.5 * Math.PI);
        const gainIn = Math.sin(factor * 0.5 * Math.PI);
        const blended = output[outIdx] * gainOut + output[inIdx] * gainIn;
        output[outIdx] = blended;
    }

    // PERCEPTUAL LOUDNESS NORMALIZATION (ITU-R BS.1770 / K-Weighting)
    // Every texture is calibrated to the exact same perceived loudness target (0.16)
    const measuredPerceivedLoudness = computeKWeightingLoudness(output, ctx.sampleRate);
    const TARGET_PERCEIVED_LOUDNESS = 0.16;
    const normGain = TARGET_PERCEIVED_LOUDNESS / Math.max(0.0001, measuredPerceivedLoudness);

    for (let i = 0; i < bufferSize; i++) {
        let sample = output[i] * normGain;
        // Transparent soft ceiling limiter to avoid any possibility of digital clipping
        if (sample > 0.95) sample = 0.95 + 0.05 * Math.tanh((sample - 0.95) / 0.05);
        else if (sample < -0.95) sample = -0.95 + 0.05 * Math.tanh((sample + 0.95) / 0.05);
        output[i] = sample;
    }

    noiseBufferCache.set(cacheKey, buffer);
    return buffer;
};

export const createReverbImpulse = (ctx: AudioContext, duration: number, decay: number) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    for (let i = 0; i < 2; i++) {
        const channel = impulse.getChannelData(i);
        for (let j = 0; j < length; j++) {
            channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
        }
    }
    return impulse;
};