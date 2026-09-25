import { useState, useCallback, useRef } from 'react';
import { StackMutes, ChordGlideConfig, DEFAULT_CHORD_GLIDE_CONFIG, PolyvagalConfig, DEFAULT_POLYVAGAL_CONFIG } from '../../services/audio/AudioTypes';
import { LATTICE_CHANNELS } from '../../components/modules/visuals/shared';

export interface FeedbackConfig {
    sensitivity: number;
    threshold: number;
    depth: number;
    isHarmonicBloom: boolean;
    isAngelChord: boolean;
    isCrystallize: boolean;
    pulseStyle: string;
    pulseCustomColor: string;
    pulseWaveform: string;
    pulseDepth: number;
    [key: string]: unknown;
}

export const DEFAULT_FEEDBACK_CONFIG: FeedbackConfig = {
    sensitivity: 0.5,
    threshold: 0.5,
    depth: 0.85,
    isHarmonicBloom: false,
    isAngelChord: false,
    isCrystallize: false,
    pulseStyle: 'BLACK_SHUTTER',
    pulseCustomColor: '#06b6d4',
    pulseWaveform: 'SINE',
    pulseDepth: 0.85
};

export const DEFAULT_REVERB_CONFIG = {
    wetness: 0.2,
    decay: 3.5,
    preDelay: 0.01,
    lowpass: 5000,
    highpass: 100
};

export const DEFAULT_NATURE_CONFIG = {
    rainVolume: 0,
    thunderVolume: 0,
    windVolume: 0,
    birdsVolume: 0,
    cricketsVolume: 0,
    wavesVolume: 0,
    fireVolume: 0,
    isNightMode: false
};

export const createAllActiveMutes = () => {
    const mutes: Record<string, boolean> = {};
    LATTICE_CHANNELS.forEach(ch => {
        mutes[ch.id] = true; 
    });
    mutes['HEART_KICK'] = true;
    return mutes;
};

export const createAllActiveVolumes = () => {
    const vols: Record<string, number> = {};
    LATTICE_CHANNELS.forEach(ch => {
        vols[ch.id] = ch.defaultVol;
    });
    vols['HEART_KICK'] = 0.6;
    return vols;
};

export const useAudioEngine = () => {
    const [mutes, setMutes] = useState<Record<string, boolean>>(createAllActiveMutes());
    const [volumes, setVolumes] = useState<Record<string, number>>(createAllActiveVolumes());
    const [stackMutes, setStackMutes] = useState<StackMutes>({ UNIVERSAL: false, HEART: false });
    
    const [heartHarmonicMutes, setHeartHarmonicMutes] = useState<boolean[]>([true, true, true, true, true]); 
    // FIXED: Renamed to heartHarmonicVols to match the controller
    const [heartHarmonicVols, setHeartHarmonicVols] = useState<number[]>([0.5, 0.8, 0.6, 0.4, 0.2]);

    const [attackTime, setAttackTime] = useState(0.5);
    const [releaseTime, setReleaseTime] = useState(1.5);
    const [baseAperture, setBaseAperture] = useState(100);
    const [isFeedbackActive, setIsFeedbackActive] = useState(false);
    const [feedbackConfig, setFeedbackConfig] = useState<FeedbackConfig>(DEFAULT_FEEDBACK_CONFIG);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const [harmonicMasterVolume, setHarmonicMasterVolume] = useState(1.0);
    const [masterVolume, setMasterVolume] = useState(0.85);
    const [masterEq, setMasterEq] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const [isMasterEqBypassed, setIsMasterEqBypassed] = useState(false);
    const [latticeMode, setLatticeMode] = useState<'OVERTONE' | 'EQUAL'>('OVERTONE');
    const [activeHarmonicIndex, setActiveHarmonicIndex] = useState(-1);
    const [chordGlideConfig, setChordGlideConfig] = useState<ChordGlideConfig>(() => {
        try {
            const saved = localStorage.getItem('ppl_chord_glide_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { 
                    ...DEFAULT_CHORD_GLIDE_CONFIG, 
                    ...parsed,
                    generativeDrift: false // Sequential progression by default
                };
            }
        } catch {}
        return DEFAULT_CHORD_GLIDE_CONFIG;
    });

    const updateChordGlideConfig = useCallback((updates: Partial<ChordGlideConfig>) => {
        setChordGlideConfig(prev => {
            const next = { ...prev, ...updates };
            try { localStorage.setItem('ppl_chord_glide_config', JSON.stringify(next)); } catch {}
            return next;
        });
    }, []);

    const [polyvagalConfig, setPolyvagalConfig] = useState<PolyvagalConfig>(() => {
        try {
            const saved = localStorage.getItem('ppl_polyvagal_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...DEFAULT_POLYVAGAL_CONFIG,
                    ...parsed,
                    laryngealWarmth: false, // Reset legacy warmth flag to prevent any stale distortion state
                    enabled: false, // Always off by default upon application boot
                    isEmergencyGrounded: false
                };
            }
        } catch {}
        return {
            ...DEFAULT_POLYVAGAL_CONFIG,
            enabled: false,
            isEmergencyGrounded: false
        };
    });

    const updatePolyvagalConfig = useCallback((updates: Partial<PolyvagalConfig>) => {
        setPolyvagalConfig(prev => {
            const next = { ...prev, ...updates };
            try { localStorage.setItem('ppl_polyvagal_config', JSON.stringify(next)); } catch {}
            return next;
        });
    }, []);

    const telemetryRef = useRef({
        masterL: 0,
        masterR: 0,
        compressionReduction: 0
    });

    const handleMuteToggle = useCallback((id: string) => {
        setMutes(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleVolumeChange = useCallback((id: string, vol: number) => {
        setVolumes(prev => ({ ...prev, [id]: vol }));
    }, []);

    const handleStackMuteToggle = useCallback((stack: keyof StackMutes) => {
        setStackMutes(prev => ({ ...prev, [stack]: !prev[stack] }));
    }, []);

    const handleHeartHarmonicMuteToggle = useCallback((index: number) => {
        setHeartHarmonicMutes(prev => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    }, []);

    // FIXED: Renamed to handleHeartHarmonicVolChange
    const handleHeartHarmonicVolChange = useCallback((index: number, vol: number) => {
        setHeartHarmonicVols(prev => {
            const next = [...prev];
            next[index] = vol;
            return next;
        });
    }, []);

    const handleMasterEqBandChange = useCallback((index: number, gainDb: number) => {
        setMasterEq(prev => {
            const next = [...prev];
            next[index] = Math.max(-15, Math.min(15, Math.round(gainDb * 10) / 10));
            return next;
        });
    }, []);

    const resetMasterEq = useCallback(() => {
        setMasterEq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }, []);

    return {
        mutes, setMutes, handleMuteToggle,
        volumes, setVolumes, handleVolumeChange,
        stackMutes, setStackMutes, handleStackMuteToggle,
        heartHarmonicMutes, setHeartHarmonicMutes, handleHeartHarmonicMuteToggle,
        // FIXED: Exporting the correct variable names
        heartHarmonicVols, setHeartHarmonicVols, handleHeartHarmonicVolChange,
        attackTime, setAttackTime,
        releaseTime, setReleaseTime,
        baseAperture, setBaseAperture,
        isFeedbackActive, setIsFeedbackActive,
        feedbackConfig, setFeedbackConfig,
        audioEnabled, setAudioEnabled,
        
        harmonicMasterVolume, setHarmonicMasterVolume,
        masterVolume, setMasterVolume,
        masterEq, setMasterEq, handleMasterEqBandChange, resetMasterEq,
        isMasterEqBypassed, setIsMasterEqBypassed,
        latticeMode, setLatticeMode,
        activeHarmonicIndex, setActiveHarmonicIndex,
        chordGlideConfig, setChordGlideConfig, updateChordGlideConfig,
        polyvagalConfig, setPolyvagalConfig, updatePolyvagalConfig,

        telemetryRef
    };
};