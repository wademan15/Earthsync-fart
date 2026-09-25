/**
 * Central application store (Zustand).
 * Holds cross-cutting UI and session state that was previously
 * scattered across App.tsx and prop-drilled into PlanetaryTunerModule.
 *
 * Audio engines, lattice, breath, etc. remain in their dedicated hooks
 * (usePlanetaryController / useAudioEngine / …) because they own
 * Web Audio nodes and animation loops that should stay outside React.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ViewMode } from '../types';
import {
  DEFAULT_UI_CONFIG,
  type UIConfig,
} from '../components/system/StyleEditor';

export interface AppState {
  // --- View / layout ---
  viewMode: ViewMode;
  isVisualizerImmersion: boolean;
  showStyleEditor: boolean;

  // --- Theme ---
  uiConfig: UIConfig;

  // --- Actions ---
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setVisualizerImmersion: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleVisualizerImmersion: (forced?: boolean) => void;
  setShowStyleEditor: (value: boolean) => void;
  toggleStyleEditor: () => void;
  setUiConfig: (config: UIConfig | ((prev: UIConfig) => UIConfig)) => void;
  resetUiConfig: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      viewMode: 'PLAYER',
      isVisualizerImmersion: false,
      showStyleEditor: false,
      uiConfig: DEFAULT_UI_CONFIG,

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleViewMode: () =>
        set((s) => ({
          viewMode: s.viewMode === 'PLAYER' ? 'STUDIO' : 'PLAYER',
        })),

      setVisualizerImmersion: (value) =>
        set((s) => ({
          isVisualizerImmersion:
            typeof value === 'function' ? value(s.isVisualizerImmersion) : value,
        })),

      toggleVisualizerImmersion: (forced) =>
        set((s) => ({
          isVisualizerImmersion:
            typeof forced === 'boolean' ? forced : !s.isVisualizerImmersion,
        })),

      setShowStyleEditor: (value) => set({ showStyleEditor: value }),

      toggleStyleEditor: () =>
        set((s) => ({ showStyleEditor: !s.showStyleEditor })),

      setUiConfig: (config) =>
        set((s) => ({
          uiConfig: typeof config === 'function' ? config(s.uiConfig) : config,
        })),

      resetUiConfig: () => set({ uiConfig: DEFAULT_UI_CONFIG }),
    }),
    {
      name: 'earth-sync-app',
      storage: createJSONStorage(() => localStorage),
      // Only persist durable preferences; ephemeral UI flags stay in memory
      partialize: (state) => ({
        uiConfig: state.uiConfig,
        viewMode: state.viewMode,
      }),
    }
  )
);

/** Convenience selectors to avoid unnecessary re-renders */
export const selectViewMode = (s: AppState) => s.viewMode;
export const selectUiConfig = (s: AppState) => s.uiConfig;
export const selectIsImmersion = (s: AppState) => s.isVisualizerImmersion;
export const selectShowStyleEditor = (s: AppState) => s.showStyleEditor;
