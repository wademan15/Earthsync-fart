# Earth Sync Treedom (Remix Vol 1)

Harmonic breath pacer and photic visualizer. Synchronize breath pacing rhythms with harmonic soundscapes, Just-Intonation / planetary tuning, and visual entrainment.

## Quick start

**Prerequisites:** Node.js 20+

```bash
npm install
# optional: set GEMINI_API_KEY in .env.local if you use AI features
npm run dev
```

Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## Architecture overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deeper map of audio engines, state, and visualizers.

High-level layout:

```
App.tsx                    → thin shell + StyleContext + ErrorBoundary
store/appStore.ts          → Zustand store for view mode, immersion, UI theme
hooks/
  usePlanetaryController   → composes audio / atmosphere / temporal / lattice / modulation
  usePlanetaryAudio        → Web Audio graph orchestration
  engine/*                 → focused engine hooks
components/modules/
  PlanetaryTunerModule     → main orchestrator UI
  tuner/                   → dock, transport, modals, layout hooks
  visuals/                 → lens registry + WebGL / canvas renderers
services/audio/            → synths, chord progressions, experience designer
services/kinematics/       → color, fluid, sentic, modulation math
services/signalProcessing  → HRV / spectral math (shared buffers)
```

## Key design notes

- **Audio & physics stay outside React render.** Engines own `AudioContext` nodes and `requestAnimationFrame` loops; React only holds configuration and transport state.
- **Zustand** holds cross-cutting UI state (view mode, immersion, theme). Engine state remains in dedicated hooks to avoid forcing high-frequency updates through React.
- **Metrics** are modeled as a large `DiagnosticsMetrics` aggregate for sensor backends; UI components should prefer `TunerDisplayMetrics` or `Partial<DiagnosticsMetrics>`.

## License / origin

Originally scaffolded from Google AI Studio. Domain logic, audio graph, and visualizers are the core of this remix.
