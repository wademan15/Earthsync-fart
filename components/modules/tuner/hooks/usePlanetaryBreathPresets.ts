import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_BREATH_PRESETS, BreathPreset } from '../../designers/BreathDesigner';
import { getCachedStorage, setCachedStorage } from '../tunerStorage';

export interface UsePlanetaryBreathPresetsOptions {
  controller: {
    temporal: {
      breathConfig: {
        inhale?: number;
        holdIn?: number;
        exhale?: number;
        holdOut?: number;
        title?: string;
        [key: string]: unknown;
      };
      setBreathConfig: (config: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
    activePresetId?: string;
    [key: string]: unknown;
  };
  onBreathConfigChange?: (config: Record<string, unknown>) => void;
  onShowToast: (message: string, duration?: number) => void;
}

export function usePlanetaryBreathPresets({
  controller,
  onBreathConfigChange,
  onShowToast
}: UsePlanetaryBreathPresetsOptions) {
  const [showBreathSheet, setShowBreathSheet] = useState(false);
  const [breathSheetTab, setBreathSheetTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  const [customInhale, setCustomInhale] = useState<number>(() => controller.temporal.breathConfig.inhale ?? 4.0);
  const [customHoldIn, setCustomHoldIn] = useState<number>(() => controller.temporal.breathConfig.holdIn ?? 2.0);
  const [customExhale, setCustomExhale] = useState<number>(() => controller.temporal.breathConfig.exhale ?? 6.0);
  const [customHoldOut, setCustomHoldOut] = useState<number>(() => controller.temporal.breathConfig.holdOut ?? 0.0);
  const [customPresetTitle, setCustomPresetTitle] = useState<string>('');
  const [deckPreviewId, setDeckPreviewId] = useState<string | null>(null);

  const breathInhale = controller.temporal.breathConfig.inhale;
  const breathHoldIn = controller.temporal.breathConfig.holdIn;
  const breathExhale = controller.temporal.breathConfig.exhale;
  const breathHoldOut = controller.temporal.breathConfig.holdOut;

  useEffect(() => {
    if (onBreathConfigChange) {
      onBreathConfigChange(controller.temporal.breathConfig);
    }
  }, [breathInhale, breathHoldIn, breathExhale, breathHoldOut, onBreathConfigChange, controller.temporal.breathConfig]);

  const [breathPresetsList, setBreathPresetsList] = useState<BreathPreset[]>(() => {
    try {
      const saved = getCachedStorage('breath_presets');
      if (saved) {
        return [...DEFAULT_BREATH_PRESETS, ...JSON.parse(saved)];
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BREATH_PRESETS;
  });

  const allBreathPresets = breathPresetsList;
  const previewPreset = allBreathPresets.find(p => p.id === deckPreviewId) || allBreathPresets[0];
  const groupedPresets = {
    RELAX: allBreathPresets.filter(p => p.category === 'RELAX'),
    BALANCE: allBreathPresets.filter(p => p.category === 'BALANCE'),
    ENERGY: allBreathPresets.filter(p => p.category === 'ENERGY'),
    PERFORMANCE: allBreathPresets.filter(p => p.category === 'PERFORMANCE'),
  };

  const saveCustomBreathPreset = useCallback(() => {
    if (!customPresetTitle.trim()) {
      onShowToast('Enter a preset name', 1500);
      return;
    }
    const newPreset: BreathPreset = {
      id: `custom_${Date.now()}`,
      name: customPresetTitle.trim(),
      category: 'BALANCE',
      description: 'User-designed custom breath pattern.',
      benefits: ['✨ Custom Pattern', '🌬️ Paced Cycle'],
      config: {
        inhale: customInhale,
        holdIn: customHoldIn,
        exhale: customExhale,
        holdOut: customHoldOut
      }
    };
    const customOnly = breathPresetsList.filter(p => !DEFAULT_BREATH_PRESETS.some(dp => dp.id === p.id));
    const updated = [...customOnly, newPreset];
    setCachedStorage('breath_presets', JSON.stringify(updated));
    const fullList = [...DEFAULT_BREATH_PRESETS, ...updated];
    setBreathPresetsList(fullList);
    setDeckPreviewId(newPreset.id);
    setCustomPresetTitle('');
    onShowToast(`Saved "${newPreset.name}"`, 1500);
  }, [customPresetTitle, customInhale, customHoldIn, customExhale, customHoldOut, breathPresetsList, onShowToast]);

  const deleteCustomBreathPreset = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const customOnly = breathPresetsList
      .filter(p => !DEFAULT_BREATH_PRESETS.some(dp => dp.id === p.id))
      .filter(p => p.id !== id);
    setCachedStorage('breath_presets', JSON.stringify(customOnly));
    const fullList = [...DEFAULT_BREATH_PRESETS, ...customOnly];
    setBreathPresetsList(fullList);
    if (deckPreviewId === id) {
      setDeckPreviewId(fullList[0].id);
    }
    onShowToast('Preset Deleted', 1500);
  }, [breathPresetsList, deckPreviewId, onShowToast]);

  const getCurrentBreathPresetName = useCallback(() => {
    const match = DEFAULT_BREATH_PRESETS.find(p => 
      Math.abs(p.config.inhale - controller.temporal.breathConfig.inhale) < 0.1 && 
      Math.abs(p.config.holdIn - controller.temporal.breathConfig.holdIn) < 0.1 && 
      Math.abs(p.config.exhale - controller.temporal.breathConfig.exhale) < 0.1 && 
      Math.abs(p.config.holdOut - controller.temporal.breathConfig.holdOut) < 0.1
    );
    return match ? match.name : "Custom Cycle";
  }, [controller.temporal.breathConfig]);

  return {
    showBreathSheet,
    setShowBreathSheet,
    breathSheetTab,
    setBreathSheetTab,
    customInhale,
    setCustomInhale,
    customHoldIn,
    setCustomHoldIn,
    customExhale,
    setCustomExhale,
    customHoldOut,
    setCustomHoldOut,
    customPresetTitle,
    setCustomPresetTitle,
    deckPreviewId,
    setDeckPreviewId,
    allBreathPresets,
    previewPreset,
    groupedPresets,
    saveCustomBreathPreset,
    deleteCustomBreathPreset,
    getCurrentBreathPresetName
  };
}
