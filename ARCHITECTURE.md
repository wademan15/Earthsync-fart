# Architecture

## Goals

1. Real-time harmonic audio (breath pacer, lattice, heart, polyvagal, chord glide).
2. Synchronized visual entrainment (multiple “lenses”).
3. Optional biofeedback metrics (HRV-style, Schumann lock, somatic).
4. Experience designer for sequenced multi-phase sessions.

## State boundaries

| Concern | Owner | Why |
|---------|--------|-----|
| View mode, immersion, theme | `store/appStore` (Zustand) | Cross-cutting, durable, low frequency |
| Volumes, mutes, reverb, breath config, lattice | `usePlanetaryController` + engine hooks | Owns Web Audio nodes; high-frequency param automation |
| Experience block index / progress | `usePlanetaryExperience` | Session transport |
| Layout profiles | `usePlanetaryLayout` | UI chrome only |

Do **not** push audio sample-rate or rAF state into React. Use refs + imperative engine APIs.

## Audio pipeline (simplified)

```
usePlanetaryController
  ├── useAudioEngine        (master bus, volumes, feedback, heart harmonics)
  ├── useAtmosphereEngine   (reverb, delay, nature beds, immersion)
  ├── useTemporalEngine     (breath phases, kick, binaural, snake)
  ├── useLatticeEngine      (harmonic lattice)
  ├── useModulationEngine   (LFO / aperture maps)
  └── usePlanetaryAudio     (graph wiring + tick scheduler)
```

Each engine exposes config setters and is driven by a shared audio clock / payload (`AudioPayload`).

## Visual pipeline

- `VisualizerRegistry` maps mode IDs → lens modules.
- `VisualizerCanvas` / stage owns the canvas + animation loop.
- Lenses receive amplitude / phase / breath / physics data via a bus (`VisualizerBus` in `shared.ts`).
- Prefer pre-allocated buffers and lens-local memory objects; avoid allocating inside the draw loop.

## Large components (known debt)

These files are still large and should be split further over time:

- `ExperienceDesignerModal.tsx`
- `MusicalProgressionModal.tsx`
- `TuningControlsDeck.tsx`
- `VisualizerCanvas.tsx`
- `PolyvagalModal.tsx`
- `BreathSynth.ts` / `LatticeSynth.ts` / `chordProgressions.ts`

Recommended approach: extract pure presentational panels first, then move local state into focused hooks, then thin the modal to orchestration only.

## Metrics

`DiagnosticsMetrics` is a flat aggregate for convenience with sensor backends. Prefer:

- `TunerDisplayMetrics` for the main player chrome
- Focused interfaces (`SpectralMetrics`, `HarmonicMetrics`, …) inside specialized panels
- `Partial<DiagnosticsMetrics>` when only a subset is available

## Extending

- **New visualizer:** implement the lens contract, register in `VisualizerRegistry`.
- **New synth layer:** add engine hook under `hooks/engine`, wire into controller preset load/save.
- **New experience phase type:** extend `ExperienceBlock` + corresponding accordion in `experienceDesigner/`.
