import { AudioGraph, ReverbConfig, BreathConfig, DelayConfig, MASTER_EQ_FREQUENCIES } from './AudioTypes';
import { LATTICE_CHANNELS } from '../../components/modules/visuals/shared';
import { getGlottalWarmthCurve } from './PolyvagalSynth';

export const generateImpulseResponse = (ctx: AudioContext, config: ReverbConfig) => {
    const isMobile = typeof navigator !== 'undefined' && (
        /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
    );
    const sampleRate = ctx.sampleRate;
    // Mobile optimization: clamp decay between 1.0s and 2.6s on mobile to reduce convolution FFT partitions while keeping a lush, deep ambient tail
    const maxDecay = isMobile ? 2.6 : 4.5;
    const decay = Math.max(1.0, Math.min(maxDecay, config.decay || 2.5));
    const length = Math.floor(sampleRate * decay);
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i;
        // Natural exponential decay envelope with organic warm diffusion
        const env = Math.pow(1 - n / length, decay * 1.1);
        left[i] = (Math.random() * 2 - 1) * env;
        right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
};

export const buildAudioGraph = async (
    reverbConfig: ReverbConfig, 
    breathConfig: BreathConfig,
    delayConfig: DelayConfig
): Promise<AudioGraph> => {
    try {
        const isMobile = typeof navigator !== 'undefined' && (
            /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
        );
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        // 'playback' latencyHint on mobile grants a generous audio hardware buffer to stop DAC underruns and crackles
        const ctx = new AudioContextClass({
            latencyHint: isMobile ? 'playback' : 'interactive',
        });
        await ctx.resume();

        // 1. MASTER BUS SETUP
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.82;

        const dcBlocker = ctx.createBiquadFilter();
        dcBlocker.type = 'highpass';
        dcBlocker.frequency.value = 20;

        // Brickwall Transparent Peak Limiter:
        // Fast 3ms attack catches transients before mobile DAC hard-clipping occurs,
        // while 18:1 ratio and soft knee keep acoustic dynamics transparent and organic.
        const limiter = ctx.createDynamicsCompressor(); 
        limiter.threshold.value = -4.0;
        limiter.knee.value = 8.0;
        limiter.ratio.value = 18.0;
        limiter.attack.value = 0.003; 
        limiter.release.value = 0.15; 

        // Safe Headroom Ceiling:
        // Enforces true-peak margin (-0.92 dBFS) to guarantee Android hardware DAC never clips or distorts
        const outputCeiling = ctx.createGain();
        outputCeiling.gain.value = 0.90;

        const analyserPreLimit = ctx.createAnalyser();
        const analyserPostLimit = ctx.createAnalyser();
        analyserPreLimit.fftSize = 2048;
        analyserPostLimit.fftSize = 2048;

        const threatRumbleFilter = ctx.createBiquadFilter();
        threatRumbleFilter.type = 'lowshelf';
        threatRumbleFilter.frequency.value = 240;
        threatRumbleFilter.gain.value = 0;

        // Polyvagal Middle-Ear Formant Filter Bank (Serial Master Bus Processing)
        // Broadened Q factors (1.15 to 1.30) match human vocal tract bandwidths and eliminate phase cancellation
        const polyvagalF1 = ctx.createBiquadFilter();
        polyvagalF1.type = 'peaking';
        polyvagalF1.frequency.value = 700;
        polyvagalF1.Q.value = 1.15;
        polyvagalF1.gain.value = 0;

        const polyvagalF2 = ctx.createBiquadFilter();
        polyvagalF2.type = 'peaking';
        polyvagalF2.frequency.value = 1650;
        polyvagalF2.Q.value = 1.25;
        polyvagalF2.gain.value = 0;

        const polyvagalF3 = ctx.createBiquadFilter();
        polyvagalF3.type = 'peaking';
        polyvagalF3.frequency.value = 2850;
        polyvagalF3.Q.value = 1.30;
        polyvagalF3.gain.value = 0;

        const polyvagalHighShelf = ctx.createBiquadFilter();
        polyvagalHighShelf.type = 'highshelf';
        polyvagalHighShelf.frequency.value = 5500;
        polyvagalHighShelf.gain.value = 0;

        // Dynamic Constant-Loudness Makeup Compensation (eliminates jarring volume shifts between phases)
        const polyvagalMakeupGain = ctx.createGain();
        polyvagalMakeupGain.gain.value = 1.0;

        // Laryngeal Warmth Nodes (Click-Free, zero-latency, zero-clipping)
        const polyvagalVocalWarmth = ctx.createWaveShaper();
        polyvagalVocalWarmth.oversample = 'none'; // Zero filter latency / no comb filtering
        polyvagalVocalWarmth.curve = getGlottalWarmthCurve(); 

        const warmthPre = ctx.createGain();
        warmthPre.gain.value = 1.0; // Unity gain (no pre-drive clipping)

        const warmthWet = ctx.createGain();
        warmthWet.gain.value = 0.0;

        const warmthDry = ctx.createGain();
        warmthDry.gain.value = 1.0;

        const warmthOut = ctx.createGain();
        warmthOut.gain.value = 1.0;

        // Pharyngeal Aspiration Air / Breath Shimmer (2.5k - 4k whisper band)
        const aspirationFilter = ctx.createBiquadFilter();
        aspirationFilter.type = 'bandpass';
        aspirationFilter.frequency.value = 3200;
        aspirationFilter.Q.value = 1.6;

        const aspirationGain = ctx.createGain();
        aspirationGain.gain.value = 0; // Inactive by default

        // Generate gentle organic pink-noise buffer for aspiration air
        try {
            const aspirationBufferSize = ctx.sampleRate * 2;
            const aspirationBuffer = ctx.createBuffer(1, aspirationBufferSize, ctx.sampleRate);
            const aspData = aspirationBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < aspirationBufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                aspData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
            }
            const aspirationNoise = ctx.createBufferSource();
            aspirationNoise.buffer = aspirationBuffer;
            aspirationNoise.loop = true;
            aspirationNoise.connect(aspirationFilter);
            aspirationFilter.connect(aspirationGain);
            aspirationGain.connect(dcBlocker);
            aspirationNoise.start();
        } catch (e) {
            console.warn("Aspiration noise initialization skipped:", e);
        }

        // Bilateral Middle-Ear Panner (Alternating Stapedius Acoustic Reflex)
        const bilateralPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (bilateralPanner) {
            bilateralPanner.pan.value = 0.0;
        }

        // Acoustic Sanctuary Ambient Synthesizer (Places of Safety: Forest, Hearth, Shoreline)
        const sanctuaryGain = ctx.createGain();
        sanctuaryGain.gain.value = 0.0;

        const sanctuaryFilter = ctx.createBiquadFilter();
        sanctuaryFilter.type = 'lowpass';
        sanctuaryFilter.frequency.value = 1800;

        const sanctuarySwellGain = ctx.createGain();
        sanctuarySwellGain.gain.value = 1.0;

        try {
            const sanctuaryBufferSize = ctx.sampleRate * 4;
            const sanctuaryBuffer = ctx.createBuffer(2, sanctuaryBufferSize, ctx.sampleRate);
            const chL = sanctuaryBuffer.getChannelData(0);
            const chR = sanctuaryBuffer.getChannelData(1);
            let s0L = 0, s1L = 0, s2L = 0;
            let s0R = 0, s1R = 0, s2R = 0;
            for (let i = 0; i < sanctuaryBufferSize; i++) {
                const whiteL = Math.random() * 2 - 1;
                const whiteR = Math.random() * 2 - 1;
                s0L = 0.99886 * s0L + whiteL * 0.0555;
                s1L = 0.99332 * s1L + whiteL * 0.0750;
                s2L = 0.96900 * s2L + whiteL * 0.1538;
                chL[i] = (s0L + s1L + s2L + whiteL * 0.536) * 0.12;

                s0R = 0.99886 * s0R + whiteR * 0.0555;
                s1R = 0.99332 * s1R + whiteR * 0.0750;
                s2R = 0.96900 * s2R + whiteR * 0.1538;
                chR[i] = (s0R + s1R + s2R + whiteR * 0.536) * 0.12;
            }
            const sanctuaryNoise = ctx.createBufferSource();
            sanctuaryNoise.buffer = sanctuaryBuffer;
            sanctuaryNoise.loop = true;
            sanctuaryNoise.connect(sanctuaryFilter);
            sanctuaryFilter.connect(sanctuarySwellGain);
            sanctuarySwellGain.connect(sanctuaryGain);
            sanctuaryGain.connect(dcBlocker);
            sanctuaryNoise.start();
        } catch (e) {
            console.warn("Sanctuary ambient generator skipped:", e);
        }

        // Pristine Master Insert Routing:
        // masterGain -> threatRumbleFilter -> F1 -> F2 -> F3 -> highShelf -> makeupGain -> warmthOut -> [Bilateral Panner] -> dcBlocker
        // Direct, zero-distortion throughput eliminates WaveShaper clipping, comb filtering, and intermodulation distortion
        masterGain.connect(threatRumbleFilter);
        threatRumbleFilter.connect(polyvagalF1);
        polyvagalF1.connect(polyvagalF2);
        polyvagalF2.connect(polyvagalF3);
        polyvagalF3.connect(polyvagalHighShelf);
        polyvagalHighShelf.connect(polyvagalMakeupGain);

        // Direct pristine throughput to warmthOut (guaranteed artifact-free)
        polyvagalMakeupGain.connect(warmthOut);

        // Terminate auxiliary warmth nodes safely to maintain graph structure without audio degradation
        polyvagalMakeupGain.connect(warmthDry);
        warmthPre.connect(polyvagalVocalWarmth);
        polyvagalVocalWarmth.connect(warmthWet);

        if (bilateralPanner) {
            warmthOut.connect(bilateralPanner);
            bilateralPanner.connect(dcBlocker);
        } else {
            warmthOut.connect(dcBlocker);
        }

        // 12-BAND MASTER EQUALIZER
        const masterEqNodes: BiquadFilterNode[] = [];
        let prevNode: AudioNode = dcBlocker;

        MASTER_EQ_FREQUENCIES.forEach((freq, idx) => {
            const filter = ctx.createBiquadFilter();
            if (idx === 0) {
                filter.type = 'lowshelf';
            } else if (idx === MASTER_EQ_FREQUENCIES.length - 1) {
                filter.type = 'highshelf';
            } else {
                filter.type = 'peaking';
                filter.Q.value = 1.4;
            }
            filter.frequency.value = freq;
            filter.gain.value = 0; // Flat initial 0 dB
            prevNode.connect(filter);
            prevNode = filter;
            masterEqNodes.push(filter);
        });

        prevNode.connect(limiter);
        limiter.connect(analyserPreLimit);
        analyserPreLimit.connect(analyserPostLimit);
        analyserPostLimit.connect(outputCeiling);
        outputCeiling.connect(ctx.destination);

        // 2. DELAY BUS
        const delayNode = ctx.createDelay(5.0);
        delayNode.delayTime.value = delayConfig.time || 0.5;
        
        const delayFeedback = ctx.createGain();
        delayFeedback.gain.value = delayConfig.feedback || 0.3;
        
        const delayGain = ctx.createGain(); 
        delayGain.gain.value = delayConfig.wetness || 0.0;

        const delayFilter = ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = delayConfig.cutoff || 2000;

        delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayFilter.connect(delayGain);
        delayGain.connect(masterGain);

        // 3. REVERB BUS
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = reverbConfig.wetness !== undefined ? reverbConfig.wetness : 0.2;
        
        const reverbFilter = ctx.createBiquadFilter();
        reverbFilter.type = 'highpass';
        reverbFilter.frequency.value = 400; 

        const reverbNode = ctx.createConvolver(); 
        reverbNode.buffer = generateImpulseResponse(ctx, reverbConfig);
        
        reverbGain.connect(reverbFilter);
        reverbFilter.connect(reverbNode);
        reverbNode.connect(masterGain);

        // 4. HEART HARMONICS BUS (Restored Stereo Pairs)
        const heartGains: Record<string, GainNode> = {}; 
        const heartOscs: Record<string, { left: OscillatorNode, right: OscillatorNode }> = {}; 

        for (let i = 0; i < 5; i++) {
            const id = `HEART_HARMONIC_${i}`;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            
            const oscLeft = ctx.createOscillator();
            const oscRight = ctx.createOscillator();
            oscLeft.type = 'sine'; 
            oscRight.type = 'sine';
        
        const pannerLeft = ctx.createStereoPanner(); pannerLeft.pan.value = -1;
        const pannerRight = ctx.createStereoPanner(); pannerRight.pan.value = 1;
        
        oscLeft.connect(pannerLeft); oscRight.connect(pannerRight);
        pannerLeft.connect(gain); pannerRight.connect(gain);
        
        oscLeft.start(); oscRight.start();
        
        gain.connect(masterGain);
        
        heartGains[id] = gain;
        heartOscs[id] = { left: oscLeft, right: oscRight };
    }

    // 5. BREATH PACER BUS
    const noiseGain = ctx.createGain(); 
    noiseGain.gain.value = 0;
    
    const filterNode = ctx.createBiquadFilter(); 
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 400;

    const lfoGain = ctx.createGain(); 
    lfoGain.gain.value = 1.0;

    const noisePanner = ctx.createStereoPanner();
    noisePanner.pan.value = 0;

    filterNode.connect(lfoGain);
    lfoGain.connect(noisePanner);
    noisePanner.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseGain.connect(reverbGain);

    // HEART KICK
    const heartOsc = ctx.createOscillator();
    const heartGain = ctx.createGain();
    heartGain.gain.value = 0;
    heartOsc.type = 'sine';
    heartOsc.frequency.value = 50.0;
    heartOsc.start();

    heartOsc.connect(heartGain);
    heartGain.connect(masterGain);
    // Heartbeat remains 100% dry for crisp baroreflex entrainment punch and zero low-end mud

    // 6. LATTICE SYNTHS (Clean Dynamic Architecture)
    // Channel nodes are instantiated on-demand by LatticeSynth with full clinical entrainment routing
    const latticeGains: Record<string, GainNode> = {};
    const latticeOscs: Record<string, { left: OscillatorNode, right: OscillatorNode }> = {};
    const latticePanners: Record<string, StereoPannerNode> = {};
    const latticeLfos: Record<string, OscillatorNode> = {};

    const graph = {
        ctx,
        masterGain,
        outputCeiling,
        masterEqNodes,
        limiter, 
        analyserPreLimit,
        analyserPostLimit,
        reverbGain,
        reverbNode, 
        delayNode,
        delayFeedback,
        delayGain, 
        delayFilter,
        latticeGains,
        latticeOscs,
        latticePanners,
        latticeLfos,
        heartGains, 
        heartOscs, 
        noiseGain, 
        filterNode, 
        lfoGain, 
        noisePanner,
        heartOsc,
        heartGain,
        threatRumbleFilter,
        polyvagalFormants: {
            f1: polyvagalF1,
            f2: polyvagalF2,
            f3: polyvagalF3,
            highShelf: polyvagalHighShelf,
            makeupGain: polyvagalMakeupGain,
            vocalWarmth: polyvagalVocalWarmth,
            warmthDry: warmthDry,
            warmthWet: warmthWet,
            warmthPre: warmthPre,
            warmthOut: warmthOut,
            aspirationGain: aspirationGain,
            aspirationFilter: aspirationFilter,
            bilateralPanner: bilateralPanner || undefined,
            sanctuaryGain: sanctuaryGain,
            sanctuaryFilter: sanctuaryFilter,
            sanctuarySwellGain: sanctuarySwellGain
        },
        natureSynths: {}
    };

    return graph as AudioGraph;
    } catch (err) {
        console.error("Failed to build AudioGraph:", err);
        throw err;
    }
};

export const closeAudioGraph = (graph: AudioGraph) => {
    if (graph.ctx.state !== 'closed') {
        graph.ctx.close();
    }
};