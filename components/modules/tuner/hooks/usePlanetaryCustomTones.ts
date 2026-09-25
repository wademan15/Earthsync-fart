/* eslint-disable react-hooks/immutability */
import { useState, useMemo, useLayoutEffect, useEffect, useCallback } from 'react';
import {
  HarmonicChannel,
  createChannel,
  ALL_CHANNELS,
  UNIVERSAL_CHANNELS,
  KNOB_CHANNELS,
  CHORD_VOICE_CHANNELS,
  DEFAULT_CUSTOM_CHANNELS,
  PresetType
} from '../../visuals/shared';
import { getCachedStorage, setCachedStorage } from '../tunerStorage';
import { HarmonicPackage } from '../../designers/HarmonicPackageMenu';

export interface UsePlanetaryCustomTonesOptions {
  controller: {
    audio?: {
      mutes?: Record<string, boolean>;
      [key: string]: unknown;
    };
    temporal?: {
      binauralFreqs?: Record<string, number>;
      handleGlobalEntrainmentChange?: (freq: number) => void;
      [key: string]: unknown;
    };
    modulation?: {
      setModulations?: (mods: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
    loopDataRef?: React.MutableRefObject<Record<string, unknown>>;
    [key: string]: unknown;
  };
  physicsEngine?: {
    loadPreset?: (id: string) => { modulations?: Record<string, unknown> } | undefined;
    [key: string]: unknown;
  } | null;
  activeToneArray: PresetType;
  setActiveToneArray: (pkgId: PresetType) => void;
  knobFreq: number;
  musicScaleChannels: HarmonicChannel[];
  isProgressionActive: boolean;
  currentProgressionObj?: {
    chords?: Array<{ root?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  } | null;
  currentChordScaleIds?: Set<string>;
  onShowToast: (message: string, duration?: number) => void;
}

export function usePlanetaryCustomTones({
  controller,
  physicsEngine,
  activeToneArray,
  setActiveToneArray,
  knobFreq,
  musicScaleChannels,
  isProgressionActive,
  currentProgressionObj,
  currentChordScaleIds,
  onShowToast
}: UsePlanetaryCustomTonesOptions) {
  // Phase Conjugate / Harmonic Cascade Custom Frequencies
  const [customFrequencies, setCustomFrequencies] = useState<Record<string, number>>({});

  // Custom Tone Array Management
  const [customChannels, setCustomChannels] = useState<HarmonicChannel[]>(() => {
    try {
      const saved = getCachedStorage('ppl_custom_channels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: Record<string, unknown>, i: number) => ({
            id: (item.id as string) || `UNIVERSAL_${700 + i}`,
            type: 'UNIVERSAL',
            name: (item.name as string) || `Tone ${i + 1}`,
            noteLabel: (item.noteLabel as string) || (item.name as string) || `${item.freq}Hz`,
            freq: Number(item.freq) || (100 * (i + 1)),
            multiplier: (Number(item.freq) || 100) / 256.0,
            binauralBeat: 8.0,
            defaultVol: (item.defaultVol as number) || 0.8
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load custom channels", e);
    }
    return DEFAULT_CUSTOM_CHANNELS;
  });

  const customFreqMap = useMemo(() => {
    const map: Record<string, number> = { ...customFrequencies };
    customChannels.forEach(ch => {
      map[ch.id] = ch.freq;
    });
    musicScaleChannels.forEach(ch => {
      map[ch.id] = ch.freq;
    });
    map['UNIVERSAL_799'] = knobFreq;
    return map;
  }, [customFrequencies, customChannels, musicScaleChannels, knobFreq]);

  useLayoutEffect(() => {
    if (controller.loopDataRef && controller.loopDataRef.current) {
      controller.loopDataRef.current.customFrequencies = {
        ...(controller.loopDataRef.current.customFrequencies || {}),
        ...customFreqMap
      };
    }
  }, [customFreqMap, controller.loopDataRef]);

  const updateCustomChannel = useCallback((index: number, key: 'freq' | 'name' | 'noteLabel', value: string | number) => {
    setCustomChannels(prev => {
      const next = [...prev];
      if (next[index]) {
        const updated = { ...next[index], [key]: value };
        if (key === 'freq') {
          const num = typeof value === 'number' ? value : parseFloat(value) || 100;
          updated.freq = num;
          updated.multiplier = num / 256.0;
        }
        if (key === 'name' && !updated.noteLabel) {
          updated.noteLabel = String(value);
        }
        next[index] = updated;
        setCachedStorage('ppl_custom_channels', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const addCustomChannel = useCallback(() => {
    if (customChannels.length >= 16) {
      onShowToast('Max 16 Custom Tones', 1500);
      return;
    }
    setCustomChannels(prev => {
      const nextIdx = prev.length;
      const newFreq = 432 + (nextIdx * 50);
      const newChannel = createChannel('UNIVERSAL', 700 + nextIdx, newFreq, () => 8.0, 0.8, `Tone ${nextIdx + 1} (${newFreq}Hz)`);
      const next = [...prev, newChannel];
      setCachedStorage('ppl_custom_channels', JSON.stringify(next));
      return next;
    });
  }, [customChannels.length, onShowToast]);

  const removeCustomChannel = useCallback((index: number) => {
    if (customChannels.length <= 1) return;
    setCustomChannels(prev => {
      const next = prev.filter((_, i) => i !== index);
      setCachedStorage('ppl_custom_channels', JSON.stringify(next));
      return next;
    });
  }, [customChannels.length]);

  const resetCustomChannelsToDefault = useCallback(() => {
    setCustomChannels(DEFAULT_CUSTOM_CHANNELS);
    setCachedStorage('ppl_custom_channels', JSON.stringify(DEFAULT_CUSTOM_CHANNELS));
    onShowToast('Custom Tones Reset', 1500);
  }, [onShowToast]);

  const dockMutes = useMemo(() => {
    const m = { ...controller.audio.mutes };
    if (!isProgressionActive || !currentProgressionObj) return m;
    musicScaleChannels.forEach(ch => {
      const isUserActive = controller.audio.mutes[ch.id] === false;
      const isChordTone = currentChordScaleIds.has(ch.id);
      m[ch.id] = !(isUserActive || isChordTone);
    });
    return m;
  }, [isProgressionActive, currentProgressionObj, currentChordScaleIds, musicScaleChannels, controller.audio.mutes]);

  const totalActiveTones = useMemo(() => {
    const activeChs = activeToneArray === 'CUSTOM' ? customChannels : (activeToneArray === 'KNOB' ? KNOB_CHANNELS : (activeToneArray === 'MUSIC_SCALE' ? musicScaleChannels : ALL_CHANNELS));
    return activeChs.filter(ch => !dockMutes[ch.id]).length;
  }, [dockMutes, activeToneArray, customChannels, musicScaleChannels]);

  const clearAllTones = useCallback(() => {
    controller.audio.setMutes((prev: Record<string, boolean>) => {
      const next = { ...prev };
      ALL_CHANNELS.forEach(ch => {
        next[ch.id] = true;
      });
      CHORD_VOICE_CHANNELS.forEach(ch => {
        next[ch.id] = true;
      });
      customChannels.forEach(ch => {
        next[ch.id] = true;
      });
      musicScaleChannels.forEach(ch => {
        next[ch.id] = true;
      });
      return next;
    });
    onShowToast('All Tones Cleared', 1500);
  }, [controller.audio, customChannels, musicScaleChannels, onShowToast]);

  const [customBinauralInput, setCustomBinauralInput] = useState<string>(() => {
    return (controller.temporal.binauralFreqs['UNIVERSAL'] || 8.0).toFixed(2);
  });

  const universalBinaural = controller.temporal?.binauralFreqs?.['UNIVERSAL'];
  useEffect(() => {
    if (universalBinaural !== undefined) {
      setCustomBinauralInput(universalBinaural.toFixed(2));
    }
  }, [universalBinaural]);

  const applyCustomBinauralFreq = useCallback((freqVal?: number) => {
    const val = freqVal !== undefined ? freqVal : parseFloat(customBinauralInput);
    if (!isNaN(val) && val > 0) {
      controller.temporal.handleGlobalEntrainmentChange(val);
      onShowToast(`Entrainment: ${val.toFixed(2)} Hz`, 1500);
    }
  }, [customBinauralInput, controller.temporal, onShowToast]);

  const handlePackageSelect = useCallback((pkg: HarmonicPackage) => {
    if (pkg.stacksToUnmute && pkg.stacksToUnmute.length > 0) {
      const newStackMutes = { ...controller.audio.stackMutes };
      Object.keys(newStackMutes).forEach(k => newStackMutes[k] = true);
      pkg.stacksToUnmute.forEach(key => newStackMutes[key] = false);
      controller.audio.setStackMutes(newStackMutes);
    }
    if (pkg.channelsToUnmute && pkg.channelsToUnmute.length > 0) {
      controller.audio.setMutes((prev: Record<string, boolean>) => {
        const next = { ...prev };
        UNIVERSAL_CHANNELS.forEach(ch => next[ch.id] = true);
        pkg.channelsToUnmute!.forEach(id => next[id] = false);
        return next;
      });
    }
    if (pkg.visualMode && physicsEngine) {
      const preset = physicsEngine.physicsLibrary.find((p: Record<string, unknown>) => p.name === pkg.visualMode || p.id === pkg.visualMode);
      if (preset) {
        const loaded = physicsEngine.loadPreset(preset.id as string);
        if (loaded) controller.modulation.setModulations(loaded.modulations || {});
      } else {
        const newMods = physicsEngine.setMode(pkg.visualMode);
        controller.modulation.setModulations(newMods);
      }
      onShowToast(`${pkg.name} Loaded`, 2000);
    }
    if (pkg.breathConfig) controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, ...pkg.breathConfig }));
    if (pkg.physicsConfig && physicsEngine) physicsEngine.setLatticeConfig((prev: Record<string, unknown>) => ({ ...prev, ...pkg.physicsConfig }));
    if (pkg.immersionConfig) controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, ...pkg.immersionConfig }));
    if (pkg.entrainmentFreq) controller.temporal.handleGlobalEntrainmentChange(pkg.entrainmentFreq);
    if (pkg.customFrequencies) {
      setCustomFrequencies(prev => ({
        ...prev,
        ...pkg.customFrequencies
      }));
      if (controller.loopDataRef && controller.loopDataRef.current) {
        controller.loopDataRef.current.customFrequencies = {
          ...(controller.loopDataRef.current.customFrequencies || {}),
          ...pkg.customFrequencies
        };
      }
    }
    if (pkg.id) setActiveToneArray(pkg.id);
  }, [controller.audio, controller.temporal, controller.atmosphere, controller.modulation, controller.loopDataRef, physicsEngine, setActiveToneArray, onShowToast]);

  return {
    customChannels,
    setCustomChannels,
    customFrequencies,
    setCustomFrequencies,
    updateCustomChannel,
    addCustomChannel,
    removeCustomChannel,
    resetCustomChannelsToDefault,
    dockMutes,
    totalActiveTones,
    clearAllTones,
    customBinauralInput,
    setCustomBinauralInput,
    applyCustomBinauralFreq,
    handlePackageSelect
  };
}
