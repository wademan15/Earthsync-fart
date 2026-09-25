import { useState, useCallback } from 'react';
import { ReverbConfig, DelayConfig, NatureConfig } from '../usePlanetaryAudio';
import { ImmersionConfig, AetherConfig, DEFAULT_IMMERSION_CONFIG, DEFAULT_AETHER_CONFIG } from '../../components/modules/visuals/shared';
import { DEFAULT_REVERB_PRESETS, ReverbPreset } from '../../components/modules/designers/ReverbDesigner';

export const DEFAULT_REVERB_CONFIG: ReverbConfig = { decay: 2.2, preDelay: 20, diffusion: 0.85, damping: 3500, modulation: 0.1, wetness: 0.25, isEntrainmentSync: false };
// Zen calibrated delay defaults
export const DEFAULT_DELAY_CONFIG: DelayConfig = { time: 0.40, feedback: 0.20, cutoff: 2000, wetness: 0.15, isPingPong: true };
export const DEFAULT_NATURE_CONFIG: NatureConfig = { biome: 'TEMPERATE', timeMode: 'AUTO', rainVol: 0, streamVol: 0, fireVol: 0, windVol: 0, birdVol: 0, birdDensity: 0.5, birdDiversity: 0.5 };

export const useAtmosphereEngine = () => {
    const [reverbConfig, setReverbConfig] = useState<ReverbConfig>(DEFAULT_REVERB_CONFIG);
    const [delayConfig, setDelayConfig] = useState<DelayConfig>(DEFAULT_DELAY_CONFIG);
    const [immersionConfig, setImmersionConfig] = useState<ImmersionConfig>(DEFAULT_IMMERSION_CONFIG);
    const [aetherConfig, setAetherConfig] = useState<AetherConfig>(DEFAULT_AETHER_CONFIG);
    const [natureConfig, setNatureConfig] = useState<NatureConfig>(DEFAULT_NATURE_CONFIG);
    
    const [reverbPresets, setReverbPresets] = useState<ReverbPreset[]>(DEFAULT_REVERB_PRESETS);
    const [activeReverbPresetId, setActiveReverbPresetId] = useState<string>('zen_temple');

    const handleSelectReverbPreset = useCallback((preset: ReverbPreset) => { 
        setReverbConfig(preset.config); 
        setActiveReverbPresetId(preset.id); 
    }, []);

    const handleSaveReverbPreset = useCallback((name: string, config: ReverbConfig, isDefault: boolean) => {
        const newPreset: ReverbPreset = { id: `reverb_${Date.now()}`, name, config: { ...config } }; 
        setReverbPresets(prev => {
            const updated = [...prev, newPreset];
            localStorage.setItem('ppl_reverb_presets', JSON.stringify(updated)); 
            return updated;
        });
        setActiveReverbPresetId(newPreset.id); 
        if (isDefault) localStorage.setItem('ppl_reverb_default_id', newPreset.id); 
    }, []);

    const handleDeleteReverbPreset = useCallback((id: string) => {
        setReverbPresets(prev => {
            const updated = prev.filter(p => p.id !== id);
            localStorage.setItem('ppl_reverb_presets', JSON.stringify(updated)); 
            if (activeReverbPresetId === id) { 
                const fallback = updated[0] || DEFAULT_REVERB_PRESETS[0]; 
                setActiveReverbPresetId(fallback.id); 
                setReverbConfig(fallback.config); 
            }
            return updated;
        });
    }, [activeReverbPresetId]);

    return { 
        reverbConfig, setReverbConfig, delayConfig, setDelayConfig, 
        immersionConfig, setImmersionConfig, aetherConfig, setAetherConfig, 
        natureConfig, setNatureConfig, reverbPresets, setReverbPresets, 
        activeReverbPresetId, setActiveReverbPresetId, handleSelectReverbPreset,
        handleSaveReverbPreset, handleDeleteReverbPreset
    };
};