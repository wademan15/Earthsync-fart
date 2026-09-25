import { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import { useAudioEngine, createAllActiveVolumes, createAllActiveMutes, DEFAULT_FEEDBACK_CONFIG } from './engine/useAudioEngine';
import { useAtmosphereEngine, DEFAULT_REVERB_CONFIG, DEFAULT_DELAY_CONFIG, DEFAULT_NATURE_CONFIG } from './engine/useAtmosphereEngine';
import { useTemporalEngine, DEFAULT_BREATH_CONFIG, DEFAULT_KICK_CONFIG, DEFAULT_SNAKE_CONFIG } from './engine/useTemporalEngine';
import { useLatticeEngine } from './engine/useLatticeEngine';
import { useModulationEngine } from './engine/useModulationEngine';
import { usePlanetaryAudio } from './usePlanetaryAudio';
import { DEFAULT_LATTICE_CONFIG, VisualizerBus, DEFAULT_IMMERSION_CONFIG } from '../components/modules/visuals/shared';
import { getActiveColorWheelId, setActiveColorWheelId } from '../services/kinematics/color';

export interface Preset {
    id: string;
    name: string;
    category?: string;
    volumes: Record<string, number>;
    mutes: Record<string, boolean>;
    reverbConfig?: any;
    delayConfig?: any;
    attackTime?: number;
    releaseTime?: number;
    timestamp?: number;
    binauralFreqs?: Record<string, number>;
    kickConfig?: any;
    modulationMap?: Record<string, boolean>;
    stackMutes?: Record<string, boolean>;
    latticeConfig?: any;
    heartHarmonicVols?: number[];
    heartHarmonicMutes?: boolean[];
    breathConfig?: any;
    globalTranspose?: number;
    snakeConfig?: any;
    modulations?: Record<string, any>;
    feedbackConfig?: any;
    baseAperture?: number;
    immersionConfig?: any;
}

export const UNIVERSAL_DEFAULT_PRESET: Preset = {
    id: 'default_universal', name: 'Universal Default', category: 'AETHER',
    volumes: createAllActiveVolumes(), mutes: createAllActiveMutes(),
    reverbConfig: DEFAULT_REVERB_CONFIG, delayConfig: DEFAULT_DELAY_CONFIG,
    attackTime: 0.1, releaseTime: 0.5, timestamp: 0,
    binauralFreqs: { UNIVERSAL: 8.0, HEART: 0.1 }, kickConfig: DEFAULT_KICK_CONFIG,
    modulationMap: { 'filter': true }, stackMutes: { UNIVERSAL: false, HEART: false },
    latticeConfig: DEFAULT_LATTICE_CONFIG, heartHarmonicVols: [0.0, 0.0, 0.0, 0.0, 0.0],
    heartHarmonicMutes: [false, false, false, false, false], breathConfig: DEFAULT_BREATH_CONFIG,
    globalTranspose: 0, snakeConfig: DEFAULT_SNAKE_CONFIG,
    modulations: { 'aperture': { enabled: true, min: 20, max: 100, amtBinaural: 0, amtCoh: 1.0, amtBreath: 0, amtAudio: 0, mixMode: 'ADD' } },
    feedbackConfig: DEFAULT_FEEDBACK_CONFIG, baseAperture: 100, immersionConfig: DEFAULT_IMMERSION_CONFIG
};

const FACTORY_PRESETS: Preset[] = [
    UNIVERSAL_DEFAULT_PRESET,
];

export const usePlanetaryController = (props: any) => {
    const audio = useAudioEngine();
    const atmosphere = useAtmosphereEngine();
    const temporal = useTemporalEngine();
    const lattice = useLatticeEngine();
    const modulation = useModulationEngine();
    
    const audioSys = usePlanetaryAudio(false); 
    const bus = useMemo(() => new VisualizerBus(), []);

    const [presets, setPresets] = useState<Preset[]>(FACTORY_PRESETS);
    const [activePresetId, setActivePresetId] = useState<string>('default_universal');

    const loopDataRef = useRef<any>({});

    useLayoutEffect(() => {
        loopDataRef.current = {
            ...loopDataRef.current,
            isSimulating: props.isSimulating, localBpm: temporal.localBpm, externalBpm: props.bpm,
            mutes: { ...audio.mutes }, stackMutes: { ...audio.stackMutes }, volumes: { ...audio.volumes }, attackTime: audio.attackTime, releaseTime: audio.releaseTime,
            coherence: props.coherence, modMap: { ...modulation.modMap }, reverbConfig: { ...atmosphere.reverbConfig }, kickConfig: { ...temporal.kickConfig },
            isApertureActive: false, latticeConfig: { ...lattice.latticeConfig }, lastBeatTime: props.lastBeatTime,
            heartHarmonicVols: [...audio.heartHarmonicVols], heartHarmonicMutes: [...audio.heartHarmonicMutes], breathConfig: { ...temporal.breathConfig },
            isBreathActive: temporal.isBreathActive, themeColors: { primary: props.theme?.primaryColor || '#fff', secondary: props.theme?.secondaryColor || '#000' },
            binauralFreqs: { ...temporal.binauralFreqs }, activePhysicsMode: lattice.activePhysicsMode, globalTranspose: temporal.globalTranspose,
            snakeConfig: { ...temporal.snakeConfig }, modulations: { ...modulation.modulations }, feedbackConfig: { ...audio.feedbackConfig }, baseAperture: audio.baseAperture,
            audioCtx: audioSys.audioCtx, immersionConfig: { ...atmosphere.immersionConfig }, breathStartTime: temporal.breathStartTime,
            aetherConfig: { ...atmosphere.aetherConfig }, sensorMode: props.sensorMode, harmonicMasterVolume: audio.harmonicMasterVolume,
            latticeMode: audio.latticeMode, entrainmentMode: temporal.entrainmentMode, activeHarmonicIndex: audio.activeHarmonicIndex,
            isFeedbackActive: audio.isFeedbackActive, delayConfig: { ...atmosphere.delayConfig }, natureConfig: { ...atmosphere.natureConfig },
            macroA: modulation.macroA, macroB: modulation.macroB,
            masterVolume: audio.masterVolume, masterEq: [...audio.masterEq], isMasterEqBypassed: audio.isMasterEqBypassed,
            chordGlideConfig: audio.chordGlideConfig,
            polyvagalConfig: audio.polyvagalConfig,
            customFrequencies: loopDataRef.current?.customFrequencies ? { ...loopDataRef.current.customFrequencies } : {},
            chordVoiceSourceFreqs: loopDataRef.current?.chordVoiceSourceFreqs ? { ...loopDataRef.current.chordVoiceSourceFreqs } : {}
        };
    });

    const loadPreset = useCallback((p: Preset) => {
        audio.setVolumes(prev => ({...prev, ...p.volumes}));
        const nextMutes = { ...audio.mutes };
        Object.keys(nextMutes).forEach(k => { if (p.mutes && p.mutes[k] !== undefined) nextMutes[k] = p.mutes[k]; });
        if (p.mutes?.['HEART_KICK'] !== undefined) nextMutes['HEART_KICK'] = p.mutes['HEART_KICK'];
        audio.setMutes(nextMutes);

        if (p.stackMutes) audio.setStackMutes(p.stackMutes);
        if (p.reverbConfig) atmosphere.setReverbConfig(p.reverbConfig);
        if (p.delayConfig) atmosphere.setDelayConfig(p.delayConfig);
        if (p.attackTime !== undefined) audio.setAttackTime(p.attackTime);
        if (p.releaseTime !== undefined) audio.setReleaseTime(p.releaseTime);
        if (p.binauralFreqs) temporal.setBinauralFreqs(p.binauralFreqs);
        if (p.kickConfig) temporal.setKickConfig(p.kickConfig);
        if (p.heartHarmonicVols) audio.setHeartHarmonicVols(p.heartHarmonicVols);
        if (p.heartHarmonicMutes) audio.setHeartHarmonicMutes(p.heartHarmonicMutes);
        if (p.breathConfig) temporal.setBreathConfig({ ...DEFAULT_BREATH_CONFIG, ...p.breathConfig });
        if (p.globalTranspose !== undefined) temporal.setGlobalTranspose(p.globalTranspose);
        if (p.snakeConfig) temporal.setSnakeConfig({ ...DEFAULT_SNAKE_CONFIG, ...p.snakeConfig });
        if (p.feedbackConfig) audio.setFeedbackConfig(p.feedbackConfig); else audio.setFeedbackConfig(DEFAULT_FEEDBACK_CONFIG);
        if (p.baseAperture !== undefined) audio.setBaseAperture(p.baseAperture);
        if (p.immersionConfig) atmosphere.setImmersionConfig(p.immersionConfig); else atmosphere.setImmersionConfig(DEFAULT_IMMERSION_CONFIG);

        if (p.latticeConfig) lattice.setLatticeConfig({ ...DEFAULT_LATTICE_CONFIG, ...p.latticeConfig });
        if (p.modulations) modulation.setModulations(p.modulations); else modulation.setModulations({});
        if (p.modulationMap) modulation.setModMap(p.modulationMap);
        if (p.colorWheelId) setActiveColorWheelId(p.colorWheelId);

        setActivePresetId(p.id);
    }, [audio, atmosphere, temporal, lattice, modulation]);

    const savePreset = useCallback((newPresetName: string, isSaveDefault: boolean) => {
        if (!newPresetName) return;
        const newPreset: Preset = {
            id: Date.now().toString(), name: newPresetName, category: 'USER',
            volumes: { ...audio.volumes }, mutes: { ...audio.mutes },
            reverbConfig: atmosphere.reverbConfig, delayConfig: atmosphere.delayConfig,
            attackTime: audio.attackTime, releaseTime: audio.releaseTime, timestamp: Date.now(),
            binauralFreqs: { ...temporal.binauralFreqs }, kickConfig: temporal.kickConfig,
            stackMutes: audio.stackMutes, heartHarmonicVols: audio.heartHarmonicVols,
            heartHarmonicMutes: audio.heartHarmonicMutes, breathConfig: temporal.breathConfig,
            globalTranspose: temporal.globalTranspose, snakeConfig: temporal.snakeConfig,
            feedbackConfig: audio.feedbackConfig, baseAperture: audio.baseAperture,
            immersionConfig: atmosphere.immersionConfig, latticeConfig: lattice.latticeConfig,
            modulations: modulation.modulations, modulationMap: modulation.modMap,
            colorWheelId: getActiveColorWheelId()
        };
        setPresets(prev => {
            const updated = [...prev, newPreset];
            localStorage.setItem('ppl_presets', JSON.stringify(updated));
            return updated;
        });
        if (isSaveDefault) localStorage.setItem('ppl_default_id', newPreset.id);
        setActivePresetId(newPreset.id);
    }, [audio, atmosphere, temporal, lattice, modulation]);

    const deletePreset = useCallback((presetId: string) => {
        if (presetId === 'default_universal') return;
        setPresets(prev => {
            const updated = prev.filter(p => p.id !== presetId);
            localStorage.setItem('ppl_presets', JSON.stringify(updated));
            return updated;
        });
        if (activePresetId === presetId) loadPreset(UNIVERSAL_DEFAULT_PRESET);
    }, [activePresetId, loadPreset]);

    const toggleBreathPacer = useCallback(() => { 
        const newState = !temporal.isBreathActive; 
        temporal.setIsBreathActive(newState); 
        if (newState) { 
            if (!audioSys.audioEnabled) { 
                audioSys.setAudioEnabled(true); 
                audioSys.initAudio(atmosphere.reverbConfig, temporal.breathConfig, temporal.binauralFreqs, atmosphere.delayConfig); 
            } 
            temporal.setBreathStartTime(performance.now() / 1000); 
        } else { 
            temporal.setBreathStartTime(0); 
        } 
    }, [temporal, audioSys, atmosphere]);

    const toggleAudio = useCallback(() => { 
        if (!audioSys.audioEnabled) { 
            audioSys.initAudio(atmosphere.reverbConfig, temporal.breathConfig, temporal.binauralFreqs, atmosphere.delayConfig); 
            audioSys.setAudioEnabled(true); 
        } else { 
            audioSys.closeAudio(); 
            audioSys.setAudioEnabled(false); 
            temporal.setIsBreathActive(false); 
        } 
    }, [audioSys, atmosphere, temporal]);

    const cycleEntrainmentMode = useCallback(() => {
        let nextMode: 'SILENT' | 'SYNCED' | 'DRONE' = 'SILENT';
        if (temporal.entrainmentMode === 'SYNCED') nextMode = 'DRONE';
        else if (temporal.entrainmentMode === 'DRONE') nextMode = 'SILENT';
        else nextMode = 'SYNCED';
        temporal.setEntrainmentMode(nextMode);

        if (nextMode === 'SYNCED' && !temporal.isBreathActive) {
            temporal.setIsBreathActive(true);
            temporal.setBreathStartTime(performance.now() / 1000);
        }

        if (nextMode !== 'SILENT' && !audioSys.audioEnabled) {
            audioSys.setAudioEnabled(true);
            audioSys.initAudio(atmosphere.reverbConfig, temporal.breathConfig, temporal.binauralFreqs, atmosphere.delayConfig);
        }
    }, [temporal, audioSys, atmosphere]);

    return {
        audio, atmosphere, temporal, lattice, modulation, audioSys,
        presets, setPresets, activePresetId, setActivePresetId,
        loadPreset, savePreset, deletePreset,
        loopDataRef, bus, toggleBreathPacer, toggleAudio, cycleEntrainmentMode
    };
};