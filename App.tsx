import React, { useEffect, useMemo, useCallback } from 'react';
import type { BreathConfig } from './services/audio/AudioTypes';
import {
  DEFAULT_UI_CONFIG,
  StyleContext,
  StyleEditor,
} from './components/system/StyleEditor';
import { PlanetaryTunerModule } from './components/modules/PlanetaryTunerModule';
import { ErrorBoundary } from './components/system/ErrorBoundary';
import {
  useAppStore,
  selectViewMode,
  selectUiConfig,
  selectIsImmersion,
  selectShowStyleEditor,
} from './store/appStore';

/**
 * Demo / placeholder metrics when no live sensor feed is connected.
 * Replace with real DiagnosticsMetrics once a sensor backend is wired.
 */
const STATIC_METRICS: Record<string, unknown> = {
  coherenceScore: 0.85,
  dominantFreq: 0.1,
  lfHfRatio: 1.0,
  spectralState: 'HARMONIC_LOCKED',
  stateDescription: 'Pure Harmonic Aether Resonance',
  stateColor: '#06b6d4',
  vagalTone: 0.8,
  stressIndex: 12,
  alphaPower: 0.75,
  thetaPower: 0.65,
  entropy: 0.15,
};

export const App: React.FC = () => {
  const viewMode = useAppStore(selectViewMode);
  const uiConfig = useAppStore(selectUiConfig);
  const isVisualizerImmersion = useAppStore(selectIsImmersion);
  const showStyleEditor = useAppStore(selectShowStyleEditor);

  const toggleViewMode = useAppStore((s) => s.toggleViewMode);
  const toggleVisualizerImmersion = useAppStore((s) => s.toggleVisualizerImmersion);
  const toggleStyleEditor = useAppStore((s) => s.toggleStyleEditor);
  const setShowStyleEditor = useAppStore((s) => s.setShowStyleEditor);
  const setUiConfig = useAppStore((s) => s.setUiConfig);
  const resetUiConfig = useAppStore((s) => s.resetUiConfig);

  // Apply text scale globally
  useEffect(() => {
    document.documentElement.style.fontSize = `${(uiConfig.textScale || 1.0) * 100}%`;
  }, [uiConfig.textScale]);

  // Stable theme tokens derived from UI config
  const mode = useMemo(
    () => ({
      card: 'bg-[#0b0e14]/80',
      text: 'text-slate-200',
      heading: 'text-white',
      subtext: 'text-slate-400',
      muted: 'text-slate-500',
      iconBg: 'bg-white/5',
      modalBg: 'bg-slate-950',
      modalBorder: 'border-white/10',
      dockBar: 'bg-slate-900/90 border-t border-slate-800',
      bg: 'bg-[#020617]',
    }),
    []
  );

  const theme = useMemo(
    () => ({
      primary: `text-[${uiConfig.primaryColor}]`,
      bg: `bg-[${uiConfig.primaryColor}]`,
      border: `border-[${uiConfig.primaryColor}]`,
      hex: uiConfig.primaryColor,
    }),
    [uiConfig.primaryColor]
  );

  // Breath config changes are handled inside the planetary controller /
  // temporal engine. This callback exists so the module can notify App
  // (or future analytics) without prop-drilling deeper.
  const handleBreathConfigChange = useCallback((_config: BreathConfig) => {
    // Intentionally left as a no-op extension point.
    // Wire to analytics, persistence, or a secondary store if needed.
  }, []);

  const fontFamily =
    uiConfig.fontTheme === 'SPIRITUAL'
      ? 'Cinzel, serif'
      : uiConfig.fontTheme === 'CYBER'
        ? 'Share Tech Mono, monospace'
        : 'Space Grotesk, sans-serif';

  return (
    <StyleContext.Provider value={uiConfig}>
      <ErrorBoundary moduleName="EarthSync Core">
        <div
          className="absolute inset-0 w-full h-full overflow-hidden flex flex-col overscroll-none"
          style={{
            backgroundColor: uiConfig.appBgColor,
            fontFamily,
          }}
        >
          <div className="flex-1 relative overflow-hidden min-h-0 w-full flex flex-col">
            <PlanetaryTunerModule
              id="tuner"
              index={0}
              metrics={STATIC_METRICS}
              bpm={60}
              coherence={0.88}
              lastBeatTime={0}
              mode={mode}
              theme={theme}
              isDarkMode={true}
              viewMode={viewMode}
              sensorMode="AETHER"
              standalone={true}
              isMinimized={false}
              onBreathConfigChange={handleBreathConfigChange}
              isVisualizerImmersion={isVisualizerImmersion}
              onToggleVisualizerImmersion={toggleVisualizerImmersion}
              onToggleViewMode={toggleViewMode}
              onOpenStyleEditor={toggleStyleEditor}
              showStyleEditor={showStyleEditor}
            />
          </div>

          {showStyleEditor && (
            <StyleEditor
              config={uiConfig}
              onChange={setUiConfig}
              onClose={() => setShowStyleEditor(false)}
              onReset={resetUiConfig}
            />
          )}
        </div>
      </ErrorBoundary>
    </StyleContext.Provider>
  );
};
