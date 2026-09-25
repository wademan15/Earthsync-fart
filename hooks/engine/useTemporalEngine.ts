import { useState, useCallback } from 'react';
import { BreathConfig, KickConfig, SnakeConfig, MetronomeConfig } from '../usePlanetaryAudio';
import { KickPreset, DEFAULT_KICK_PRESETS } from '../../services/audio/heartStyles';

export const DEFAULT_KICK_CONFIG: KickConfig = { 
    freq: 48, decay: 0.35, attack: 0.01, drive: 1.0, type: 'SINE', waveType: 'sine',
    baseFreq: 48, pitchStart: 110, pitchDecay: 0.07, ampAttack: 0.01, ampDecay: 0.35,
    clickLevel: 0.08, lpfCutoff: 160, saturation: 15, syncMode: 'BREATH', doubleBeat: true, bpm: 60
};
export const DEFAULT_METRONOME_CONFIG: MetronomeConfig = { enabled: false, sound: 'BAMBOO', bpm: 60, syncToBreath: true, foam: 0.5, vol: 0.5, subdivision: 4, phaseMask: { inhale: true, holdIn: true, exhale: true, holdOut: true }, countdownBeats: 0 };
export const DEFAULT_BREATH_CONFIG: BreathConfig = { inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, oceanVol: 0.3, noiseType: 'PINK', toneType: 'SINE_BELL', cueBase: 'SCHUMANN', cueHarmonic: 16, cueVolume: 0.5, cuePhaseMask: { inhale: true, holdIn: false, exhale: true, holdOut: false }, entrainTide: false, tideEntrainMode: 'ISOCHRONIC', tideEntrainDepth: 0.4, visualMode: 'RING', tideEq: [0,0,0,0,0,0,0,0,0,0,0,0], metronome: DEFAULT_METRONOME_CONFIG, holdBehavior: 'SHIMMER', waitBehavior: 'UNDERWATER' };
export const DEFAULT_SNAKE_CONFIG: SnakeConfig = { mode: 'HARMONIC', transpose: 4, glide: 0.5, vol: 0.8, isBinaural: false };

export const useTemporalEngine = () => {
    const [localBpm, setLocalBpm] = useState(60);
    const [binauralFreqs, setBinauralFreqs] = useState<Record<string, number>>({ UNIVERSAL: 8.0, HEART: 0.1 });
    const [binauralLocks, setBinauralLocks] = useState<Record<string, boolean>>({});
    const [globalTranspose, setGlobalTranspose] = useState(0);
    const [isCoherenceLocked, setIsCoherenceLocked] = useState(false);
    const [entrainmentMode, setEntrainmentMode] = useState<'SILENT' | 'SYNCED' | 'DRONE'>('SILENT');
    
    const [breathConfig, setBreathConfig] = useState<BreathConfig>(DEFAULT_BREATH_CONFIG);
    const [isBreathActive, setIsBreathActive] = useState(false);
    const [breathStartTime, setBreathStartTime] = useState<number>(0);

    const [kickConfig, setKickConfig] = useState<KickConfig>(DEFAULT_KICK_CONFIG);
    const [kickPresets, setKickPresets] = useState<KickPreset[]>(DEFAULT_KICK_PRESETS);
    const [activeKickPresetId, setActiveKickPresetId] = useState<string>('default_kick');

    const [snakeConfig, setSnakeConfig] = useState<SnakeConfig>(DEFAULT_SNAKE_CONFIG);

    const handleBinauralChange = useCallback((type: string, val: number) => setBinauralFreqs(prev => ({ ...prev, [type]: val })), []);
    const handleGlobalEntrainmentChange = useCallback((freq: number) => { setBinauralFreqs(prev => { const next = { ...prev }; (Object.keys(next) as Array<keyof typeof next>).forEach(key => { next[key] = freq; }); return next; }); }, []);
    const handleTransposeChange = useCallback((val: number) => { if (isCoherenceLocked) { const snapped = Math.round(val * 2) / 2; setGlobalTranspose(snapped); } else { setGlobalTranspose(val); } }, [isCoherenceLocked]);
    const handleSnakeConfigChange = useCallback((key: keyof SnakeConfig, val: any) => { setSnakeConfig(prev => ({ ...prev, [key]: val })); }, []);
    
    const handleSelectKickPreset = useCallback((preset: KickPreset) => { setKickConfig(preset.config); setActiveKickPresetId(preset.id); }, []);
    const handleSaveKickPreset = useCallback((name: string, config: KickConfig, isDefault: boolean) => {
        const newPreset: KickPreset = { id: `kick_${Date.now()}`, name, config: { ...config } }; 
        setKickPresets(prev => {
            const updated = [...prev, newPreset];
            localStorage.setItem('ppl_kick_presets', JSON.stringify(updated)); 
            return updated;
        });
        setActiveKickPresetId(newPreset.id); 
        if (isDefault) localStorage.setItem('ppl_kick_default_id', newPreset.id); 
    }, []);
    const handleDeleteKickPreset = useCallback((id: string) => {
        setKickPresets(prev => {
            const updated = prev.filter(p => p.id !== id);
            localStorage.setItem('ppl_kick_presets', JSON.stringify(updated)); 
            if (activeKickPresetId === id) { 
                const fallback = updated[0] || DEFAULT_KICK_PRESETS[0]; 
                setActiveKickPresetId(fallback.id); 
                setKickConfig(fallback.config); 
            }
            return updated;
        });
    }, [activeKickPresetId]);

    return { 
        localBpm, setLocalBpm, binauralFreqs, setBinauralFreqs, binauralLocks, setBinauralLocks, 
        globalTranspose, setGlobalTranspose, isCoherenceLocked, setIsCoherenceLocked, 
        entrainmentMode, setEntrainmentMode, breathConfig, setBreathConfig, 
        isBreathActive, setIsBreathActive, breathStartTime, setBreathStartTime, 
        kickConfig, setKickConfig, kickPresets, setKickPresets, activeKickPresetId, setActiveKickPresetId, 
        snakeConfig, setSnakeConfig, handleBinauralChange, handleGlobalEntrainmentChange, 
        handleTransposeChange, handleSnakeConfigChange, handleSelectKickPreset, handleSaveKickPreset, handleDeleteKickPreset
    };
};