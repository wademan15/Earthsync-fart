/* eslint-disable react-hooks/immutability */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ExperienceDef,
  ExperienceBlock,
  STARTER_EXPERIENCES,
  resolveBlockFrequencies,
  BreathPhase
} from '../../../../services/audio/experienceDesigner';
import { TuningTemperament, CHORD_VOICE_CHANNELS, PresetType, HarmonicChannel } from '../../visuals/shared';
import { MasterTransportStatus } from '../MasterTransportControls';
import { setCachedStorage } from '../tunerStorage';

export interface UsePlanetaryExperienceProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controller: any;
  musicPitchRef: number;
  musicTemperament: TuningTemperament;
  isProgressionActive: boolean;
  setIsProgressionActive: (val: boolean) => void;
  totalActiveTones: number;
  isMasterPaused?: boolean;
  setIsMasterPaused?: (val: boolean) => void;
  isMasterPausedRef?: React.MutableRefObject<boolean>;
  masterPauseTimeRef?: React.MutableRefObject<number>;
  toggleVisualizerImmersion: (forced?: boolean) => void;
  setActiveToneArray: (val: PresetType) => void;
  setActiveHarmonicIndex?: (idx: number) => void;
  setMusicScaleChannels?: (channels: HarmonicChannel[]) => void;
  setActiveChordId?: (id: string | null) => void;
  setCurrentChordIndex?: (idx: number) => void;
  setIsPolyvagalModalOpen: (open: boolean) => void;
}

export const usePlanetaryExperience = ({
  controller,
  musicPitchRef,
  musicTemperament,
  isProgressionActive,
  setIsProgressionActive,
  totalActiveTones,
  isMasterPaused: propsIsMasterPaused,
  setIsMasterPaused: propsSetIsMasterPaused,
  isMasterPausedRef: propsIsMasterPausedRef,
  masterPauseTimeRef: propsMasterPauseTimeRef,
  toggleVisualizerImmersion,
  setActiveToneArray,
  setActiveHarmonicIndex,
  setMusicScaleChannels,
  setActiveChordId,
  setCurrentChordIndex,
  setIsPolyvagalModalOpen
}: UsePlanetaryExperienceProps) => {
  // Experience modal and state management
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState<boolean>(false);
  const [isExperienceActive, setIsExperienceActive] = useState<boolean>(false);
  const [isExperiencePaused, setIsExperiencePaused] = useState<boolean>(false);
  const [activeExperience, setActiveExperience] = useState<ExperienceDef | null>(
    () => STARTER_EXPERIENCES[0] || null
  );
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const [currentExpCycle, setCurrentExpCycle] = useState<number>(1);
  const [blockProgress, setBlockProgress] = useState<number>(0);
  const [activeSubPhase, setActiveSubPhase] = useState<BreathPhase>('INHALE');
  const [subCycleInfo, setSubCycleInfo] = useState<{ cycle: number; totalCycles: number } | null>(null);

  // Master Pause coordination (self-managed or synced to parent)
  const [internalMasterPaused, setInternalMasterPaused] = useState<boolean>(false);
  const internalMasterPausedRef = useRef<boolean>(false);
  const internalMasterPauseTimeRef = useRef<number>(0);

  const isMasterPaused = propsIsMasterPaused !== undefined ? propsIsMasterPaused : internalMasterPaused;
  const isMasterPausedRef = propsIsMasterPausedRef || internalMasterPausedRef;
  const masterPauseTimeRef = propsMasterPauseTimeRef || internalMasterPauseTimeRef;

  const setIsMasterPaused = useCallback((val: boolean) => {
    if (propsSetIsMasterPaused) {
      propsSetIsMasterPaused(val);
    } else {
      setInternalMasterPaused(val);
    }
    isMasterPausedRef.current = val;
  }, [propsSetIsMasterPaused, isMasterPausedRef]);

  useEffect(() => {
    isMasterPausedRef.current = isMasterPaused;
  }, [isMasterPaused, isMasterPausedRef]);

  const expAnimFrameRef = useRef<number | null>(null);
  const expStateRef = useRef<{
    exp: ExperienceDef | null;
    blockIndex: number;
    blockStartTime: number;
    cycle: number;
    isActive: boolean;
    isPaused: boolean;
    pausedElapsed: number;
  }>({
    exp: null,
    blockIndex: 0,
    blockStartTime: 0,
    cycle: 1,
    isActive: false,
    isPaused: false,
    pausedElapsed: 0
  });

  const auditionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Snapshot ref for clean state restoration upon stopping an experience
  const experienceStateSnapshotRef = useRef<{
    binauralFreqs: Record<string, number>;
    immersionConfig: Record<string, unknown>;
    breathConfig: Record<string, unknown>;
    kickConfig: Record<string, unknown>;
    feedbackConfig: Record<string, unknown>;
    mutes: Record<string, boolean>;
    entrainmentMode: string;
  } | null>(null);

  // Universal smooth parameter ramp across block boundaries
  const rampExperienceParameter = useCallback(
    (from: number, to: number, durationSec: number, onStep: (val: number) => void) => {
      if (Math.abs(from - to) < 0.001 || durationSec <= 0.04) {
        onStep(to);
        return;
      }
      const startTime = performance.now();
      const step = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(1.0, elapsed / durationSec);
        const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        const currentVal = from + (to - from) * eased;
        onStep(currentVal);
        if (progress < 1.0) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    },
    []
  );

  // Apply acoustic frequencies and voice leads for an experience block
  const applyExperienceBlock = useCallback(
    (block: ExperienceBlock, pitchRef: number, temperament: TuningTemperament, glideSec?: number) => {
      if (!block) return;
      const resolved = resolveBlockFrequencies(block, pitchRef, temperament);
      const voiceFreqMap: Record<string, number> = {};
      const activeVoiceIds = new Set<string>();

      resolved.frequencies.forEach((freq, i) => {
        if (i < CHORD_VOICE_CHANNELS.length) {
          const voiceId = CHORD_VOICE_CHANNELS[i].id;
          voiceFreqMap[voiceId] = freq;
          activeVoiceIds.add(voiceId);
        }
      });

      const loopData = controller.loopDataRef?.current;
      if (loopData) {
        loopData.isMusicMode = true;
        loopData.customFrequencies = {
          ...(loopData.customFrequencies || {}),
          ...voiceFreqMap
        };
        loopData.chordGlideConfig = {
          ...(loopData.chordGlideConfig || {
            enabled: true,
            time: 0.4,
            curve: 'EXPONENTIAL',
            voiceLeading: 'CLOSEST_PITCH'
          }),
          enabled: true,
          time: glideSec ?? block.glideSeconds ?? 0.4
        };

        if (loopData.mutes) {
          CHORD_VOICE_CHANNELS.forEach(ch => {
            loopData.mutes[ch.id] = !activeVoiceIds.has(ch.id);
          });
        }

        if (loopData.volumes) {
          CHORD_VOICE_CHANNELS.forEach(ch => {
            if (!loopData.volumes[ch.id] || loopData.volumes[ch.id] < 0.2) {
              loopData.volumes[ch.id] = 0.8;
            }
          });
        }
      }

      controller.audio.setMutes((prev: Record<string, boolean>) => {
        const next = { ...prev };
        CHORD_VOICE_CHANNELS.forEach(ch => {
          next[ch.id] = !activeVoiceIds.has(ch.id);
        });
        return next;
      });

      const effectiveGlide = typeof glideSec === 'number' ? glideSec : (block.glideSeconds ?? 0.4);

      // 1. Entrainment frequency & layers
      if (block.entrainment?.enabled) {
        if (typeof block.entrainment.frequencyHz === 'number' && block.entrainment.frequencyHz > 0) {
          const targetFreq = block.entrainment.frequencyHz;
          const currentFreq = controller.temporal.binauralFreqs['UNIVERSAL'] || 8.0;
          if (effectiveGlide > 0.06 && Math.abs(currentFreq - targetFreq) > 0.08) {
            rampExperienceParameter(currentFreq, targetFreq, effectiveGlide, f => {
              controller.temporal.handleGlobalEntrainmentChange(f);
            });
          } else {
            controller.temporal.handleGlobalEntrainmentChange(targetFreq);
          }
        }
        if (block.entrainment.layers && block.entrainment.layers.length > 0) {
          const layers = block.entrainment.layers;
          const nextMode =
            layers.length > 1
              ? 'HYBRID'
              : layers[0] === 'isochronic'
              ? 'ISOCHRONIC'
              : layers[0] === 'monaural'
              ? 'MONAURAL'
              : 'BINAURAL';
          controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
            ...prev,
            activeLayers: layers,
            pulseMode: nextMode
          }));
        }
      }

      // 2. Sentics emotion wave & modulation
      if (block.sentics?.enabled && block.sentics.emotion) {
        controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
          ...prev,
          isSenticPacing: true,
          senticState: block.sentics!.emotion!,
          senticVibratoDepth: block.sentics!.intensity ?? 0.35,
          isTideAM: block.sentics!.tideAM ?? true,
          isTideFM: block.sentics!.tideFM ?? true
        }));
      }

      // 2b. Breath Layer custom parameters
      if (block.breath?.enabled) {
        const targetNoiseVol = block.breath.noiseVolume;
        const currentNoiseVol = controller.temporal.breathConfig?.noiseVolume ?? 0.7;
        if (typeof targetNoiseVol === 'number' && effectiveGlide > 0.06 && Math.abs(currentNoiseVol - targetNoiseVol) > 0.05) {
          rampExperienceParameter(currentNoiseVol, targetNoiseVol, effectiveGlide, v => {
            controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
              ...prev,
              breathVolume: v,
              noiseVolume: v
            }));
          });
        }

        const blockPattern = block.breathPattern;
        controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
          ...prev,
          ...(blockPattern
            ? {
                inhale: blockPattern.inhale ?? 4,
                holdIn: blockPattern.holdIn ?? 0,
                exhale: blockPattern.exhale ?? 4,
                holdOut: blockPattern.holdOut ?? 0
              }
            : {}),
          ...(block.breath?.noiseType ? { noiseType: block.breath.noiseType } : {}),
          ...(typeof block.breath?.noiseVolume === 'number' && effectiveGlide <= 0.06
            ? { breathVolume: block.breath.noiseVolume, noiseVolume: block.breath.noiseVolume }
            : {}),
          ...(block.breath?.cueTone !== undefined ? { cueTone: block.breath.cueTone } : {}),
          ...(typeof block.breath?.cueVolume === 'number' ? { cueVolume: block.breath.cueVolume } : {}),
          ...(typeof block.breath?.cueOctave === 'number' ? { cueOctave: block.breath.cueOctave } : {}),
          ...(block.breath?.visualMode ? { pacerStyle: block.breath.visualMode, visualMode: block.breath.visualMode } : {}),
          ...(block.breath?.colorScheme ? { colorScheme: block.breath.colorScheme } : {}),
          ...(block.breath?.entrainmentMode ? { entrainmentMode: block.breath.entrainmentMode } : {})
        }));
      }

      // 3. Heart & Pulse sync
      if (block.heart?.enabled) {
        const targetBpm = block.heart.bpm;
        const currentBpm = controller.temporal.kickConfig?.bpm ?? 60;
        if (typeof targetBpm === 'number' && effectiveGlide > 0.06 && Math.abs(currentBpm - targetBpm) > 2) {
          rampExperienceParameter(currentBpm, targetBpm, effectiveGlide, b => {
            controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
              ...prev,
              bpm: Math.round(b)
            }));
          });
        }

        controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
          ...prev,
          syncMode: block.heart!.syncMode || prev.syncMode,
          ...(typeof targetBpm === 'number' && effectiveGlide <= 0.06 ? { bpm: targetBpm } : {}),
          volume: block.heart!.volume ?? prev.volume,
          ...(block.heart?.doubleBeat !== undefined ? { doubleBeat: block.heart.doubleBeat } : {}),
          ...(typeof block.heart?.baseFreq === 'number' ? { baseFreq: block.heart.baseFreq } : {}),
          ...(typeof block.heart?.lpfCutoff === 'number' ? { lpfCutoff: block.heart.lpfCutoff } : {}),
          ...(block.heart?.kickEnabled !== undefined ? { enabled: block.heart.kickEnabled } : {})
        }));
      }

      // 4. Matrix & Crystal
      if (block.matrix?.enabled) {
        controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
          ...prev,
          ...(block.matrix?.composerWarp ? { composerWarp: block.matrix.composerWarp } : {}),
          ...(typeof block.matrix?.intensity === 'number' ? { composerWarpIntensity: block.matrix.intensity } : {})
        }));
      }
      if (block.crystal?.enabled) {
        controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
          ...prev,
          isTimeCrystal: block.crystal!.isTimeCrystal ?? true,
          timeCrystalTopology: block.crystal!.topology || prev.timeCrystalTopology
        }));
      }

      // 5. Visual Pulse
      if (block.pulse?.enabled) {
        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
          ...prev,
          ...(block.pulse?.pulseStyle ? { pulseStyle: block.pulse.pulseStyle } : {}),
          ...(block.pulse?.pulseWaveform ? { pulseWaveform: block.pulse.pulseWaveform } : {}),
          ...(typeof block.pulse?.depth === 'number' ? { depth: block.pulse.depth } : {}),
          ...(block.pulse?.pulseCustomColor ? { pulseCustomColor: block.pulse.pulseCustomColor } : {}),
          ...(block.pulse?.pulseSync ? { pulseSync: block.pulse.pulseSync } : {}),
          ...(typeof block.pulse?.syncWithTimeCrystal === 'boolean'
            ? { syncWithTimeCrystal: block.pulse.syncWithTimeCrystal }
            : {}),
          ...(block.pulse?.timeCrystalTopology ? { timeCrystalTopology: block.pulse.timeCrystalTopology } : {}),
          ...(typeof block.pulse?.isUncoupled === 'boolean' ? { isUncoupled: block.pulse.isUncoupled } : {}),
          ...(typeof block.pulse?.customRateHz === 'number' ? { customRateHz: block.pulse.customRateHz } : {})
        }));
      }
    },
    [controller.loopDataRef, controller.audio, controller.temporal, controller.atmosphere, rampExperienceParameter]
  );

  // Stop running experience
  const handleStopExperience = useCallback(() => {
    if (expAnimFrameRef.current) {
      cancelAnimationFrame(expAnimFrameRef.current);
      expAnimFrameRef.current = null;
    }
    expStateRef.current.isActive = false;
    expStateRef.current.isPaused = false;
    expStateRef.current.pausedElapsed = 0;
    setIsExperienceActive(false);
    setIsExperiencePaused(false);
    setBlockProgress(0);
    setActiveBlockIndex(0);
    setSubCycleInfo(null);

    // Release chord voice channels
    controller.audio.setMutes((prev: Record<string, boolean>) => {
      const next = { ...prev };
      CHORD_VOICE_CHANNELS.forEach(ch => {
        next[ch.id] = true;
      });
      return next;
    });

    const loopData = controller.loopDataRef?.current;
    if (loopData) {
      loopData.isMusicMode = false;
      if (loopData.mutes) {
        CHORD_VOICE_CHANNELS.forEach(ch => {
          loopData.mutes[ch.id] = true;
        });
      }
    }

    // Restore pre-experience settings if snapshot exists
    if (experienceStateSnapshotRef.current) {
      const snap = experienceStateSnapshotRef.current;
      controller.temporal.binauralFreqs = snap.binauralFreqs;
      controller.atmosphere.setImmersionConfig(snap.immersionConfig);
      controller.temporal.setBreathConfig(snap.breathConfig);
      controller.temporal.setKickConfig(snap.kickConfig);
      controller.audio.setFeedbackConfig(snap.feedbackConfig);
      controller.audio.setMutes(snap.mutes);
      controller.temporal.setEntrainmentMode(snap.entrainmentMode);
      experienceStateSnapshotRef.current = null;
    }
  }, [controller]);

  // Main Play / Pause toggle for experience
  const handleTogglePlayExperience = useCallback(
    (experience?: ExperienceDef, options?: { autoImmerse?: boolean }) => {
      const targetExp = experience || activeExperience;
      if (!targetExp) return;

      if (options?.autoImmerse) {
        toggleVisualizerImmersion(true);
      }

      if (isExperienceActive && !isExperiencePaused) {
        // Pause
        if (expAnimFrameRef.current) {
          cancelAnimationFrame(expAnimFrameRef.current);
          expAnimFrameRef.current = null;
        }
        const now = performance.now() / 1000;
        expStateRef.current.isPaused = true;
        expStateRef.current.pausedElapsed = now - expStateRef.current.blockStartTime;
        setIsExperiencePaused(true);
        isMasterPausedRef.current = true;
        setIsMasterPaused(true);
        const loopData = controller.loopDataRef?.current;
        if (loopData) {
          loopData.isMasterPaused = true;
        }
        return;
      }

      if (isExperienceActive && isExperiencePaused) {
        // Resume
        const now = performance.now() / 1000;
        expStateRef.current.isPaused = false;
        expStateRef.current.blockStartTime = now - expStateRef.current.pausedElapsed;
        setIsExperiencePaused(false);
        isMasterPausedRef.current = false;
        setIsMasterPaused(false);
        const loopData = controller.loopDataRef?.current;
        if (loopData) {
          loopData.isMasterPaused = false;
        }

        if (controller.audioSys.graphRef.current?.ctx?.state === 'suspended') {
          controller.audioSys.graphRef.current.ctx.resume().catch(console.warn);
        }
        if (!controller.audioSys.audioEnabled) {
          controller.toggleAudio();
        }

        const currentBlock = expStateRef.current.exp?.blocks[expStateRef.current.blockIndex];
        if (currentBlock) {
          applyExperienceBlock(
            currentBlock,
            expStateRef.current.exp?.pitchRef || musicPitchRef,
            expStateRef.current.exp?.temperament || musicTemperament,
            0.1
          );
        }

        if (expAnimFrameRef.current) cancelAnimationFrame(expAnimFrameRef.current);

        const resumeTick = () => {
          const state = expStateRef.current;
          if (!state.isActive || state.isPaused || !state.exp || state.exp.blocks.length === 0) return;

          const currentTime = performance.now() / 1000;
          const currentBlock = state.exp.blocks[state.blockIndex];
          if (!currentBlock) return;

          const duration = Math.max(0.2, currentBlock.durationSeconds || 4.0);
          const elapsed = currentTime - state.blockStartTime;
          const progress = Math.min(1.0, elapsed / duration);

          setBlockProgress(progress);

          let radius = 0;
          let currentSubPhase: BreathPhase = currentBlock.breathPhase;

          const bp = currentBlock.breathPattern;
          if (bp && (bp.inhale > 0 || bp.exhale > 0)) {
            const oneLoop = (bp.inhale || 4) + (bp.holdIn || 0) + (bp.exhale || 4) + (bp.holdOut || 0);
            if (oneLoop > 0) {
              const currentCycle = Math.floor(elapsed / oneLoop) + 1;
              const loopTime = elapsed % oneLoop;
              const tIn = bp.inhale || 4;
              const tHoldIn = tIn + (bp.holdIn || 0);
              const tEx = tHoldIn + (bp.exhale || 4);

              if (loopTime < tIn) {
                currentSubPhase = 'INHALE';
                radius = Math.min(1.0, loopTime / Math.max(0.1, tIn));
              } else if (loopTime < tHoldIn) {
                currentSubPhase = 'HOLD_IN';
                radius = 1.0;
              } else if (loopTime < tEx) {
                currentSubPhase = 'EXHALE';
                const exProg = Math.min(1.0, (loopTime - tHoldIn) / Math.max(0.1, bp.exhale || 4));
                radius = 1.0 - exProg;
              } else {
                currentSubPhase = 'HOLD_OUT';
                radius = 0.0;
              }

              setActiveSubPhase(currentSubPhase);
              setSubCycleInfo({ cycle: Math.min(bp.cycles || 1, currentCycle), totalCycles: bp.cycles || 1 });
            }
          } else {
            if (currentBlock.breathPhase === 'INHALE') {
              radius = progress;
            } else if (currentBlock.breathPhase === 'HOLD_IN') {
              radius = 1.0;
            } else if (currentBlock.breathPhase === 'EXHALE') {
              radius = 1.0 - progress;
            } else if (currentBlock.breathPhase === 'HOLD_OUT') {
              radius = 0.0;
            } else {
              radius = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
            }
            setActiveSubPhase(currentBlock.breathPhase);
            setSubCycleInfo(null);
          }

          const loopData = controller.loopDataRef?.current;
          if (loopData) {
            loopData.isBreathActive = true;
            loopData.breathPhase = currentSubPhase;
            loopData.breathRadius = radius;
          }

          if (elapsed >= duration) {
            let nextBlockIdx = state.blockIndex + 1;
            let nextCycle = state.cycle;

            if (nextBlockIdx >= state.exp.blocks.length) {
              if (state.exp.loopMode === 'CYCLE_COUNT' && nextCycle >= state.exp.targetCycles) {
                handleStopExperience();
                return;
              }
              nextBlockIdx = 0;
              nextCycle += 1;
            }

            state.blockIndex = nextBlockIdx;
            state.blockStartTime = currentTime;
            state.cycle = nextCycle;
            setActiveBlockIndex(nextBlockIdx);
            setCurrentExpCycle(nextCycle);

            const nextBlock = state.exp.blocks[nextBlockIdx];
            if (nextBlock) {
              applyExperienceBlock(
                nextBlock,
                state.exp.pitchRef || musicPitchRef,
                state.exp.temperament || musicTemperament,
                nextBlock.glideSeconds
              );
            }
          }

          expAnimFrameRef.current = requestAnimationFrame(resumeTick);
        };

        expAnimFrameRef.current = requestAnimationFrame(resumeTick);
        return;
      }

      // Starting new experience
      if (expAnimFrameRef.current) {
        cancelAnimationFrame(expAnimFrameRef.current);
        expAnimFrameRef.current = null;
      }

      if (isProgressionActive) {
        setIsProgressionActive(false);
      }

      if (controller.audioSys.graphRef.current?.ctx?.state === 'suspended') {
        controller.audioSys.graphRef.current.ctx.resume().catch(console.warn);
      }
      if (!controller.audioSys.audioEnabled) {
        controller.toggleAudio();
      }

      if (!experienceStateSnapshotRef.current) {
        experienceStateSnapshotRef.current = {
          binauralFreqs: { ...(controller.temporal.binauralFreqs || {}) },
          immersionConfig: { ...(controller.atmosphere.immersionConfig || {}) },
          breathConfig: { ...(controller.temporal.breathConfig || {}) },
          kickConfig: { ...(controller.temporal.kickConfig || {}) },
          feedbackConfig: { ...(controller.audio.feedbackConfig || {}) },
          mutes: { ...(controller.audio.mutes || {}) },
          entrainmentMode: controller.temporal.entrainmentMode
        };
      }

      if (controller.temporal.entrainmentMode === 'SILENT') {
        controller.temporal.setEntrainmentMode('SYNCED');
      }
      controller.temporal.setIsBreathActive(true);

      const loopData = controller.loopDataRef?.current;
      if (loopData) {
        loopData.audioEnabled = true;
        loopData.isBreathActive = true;
        loopData.isMusicMode = true;
        if (!loopData.entrainmentMode || loopData.entrainmentMode === 'SILENT') {
          loopData.entrainmentMode = 'SYNCED';
        }
      }

      const now = performance.now() / 1000;
      expStateRef.current = {
        exp: targetExp,
        blockIndex: 0,
        blockStartTime: now,
        cycle: 1,
        isActive: true,
        isPaused: false,
        pausedElapsed: 0
      };

      setActiveExperience(targetExp);
      setActiveBlockIndex(0);
      setCurrentExpCycle(1);
      setBlockProgress(0);
      setIsExperienceActive(true);
      setIsExperiencePaused(false);
      isMasterPausedRef.current = false;
      setIsMasterPaused(false);
      if (loopData) {
        loopData.isMasterPaused = false;
      }

      if (targetExp.blocks && targetExp.blocks.length > 0) {
        applyExperienceBlock(
          targetExp.blocks[0],
          targetExp.pitchRef || musicPitchRef,
          targetExp.temperament || musicTemperament,
          targetExp.blocks[0].glideSeconds
        );
      }

      const tick = () => {
        const state = expStateRef.current;
        if (!state.isActive || state.isPaused || !state.exp || state.exp.blocks.length === 0) return;

        const currentTime = performance.now() / 1000;
        const currentBlock = state.exp.blocks[state.blockIndex];
        if (!currentBlock) return;

        const duration = Math.max(0.2, currentBlock.durationSeconds || 4.0);
        const elapsed = currentTime - state.blockStartTime;
        const progress = Math.min(1.0, elapsed / duration);

        setBlockProgress(progress);

        let radius = 0;
        let currentSubPhase: BreathPhase = currentBlock.breathPhase;

        const bp = currentBlock.breathPattern;
        if (bp && (bp.inhale > 0 || bp.exhale > 0)) {
          const oneLoop = (bp.inhale || 4) + (bp.holdIn || 0) + (bp.exhale || 4) + (bp.holdOut || 0);
          if (oneLoop > 0) {
            const currentCycle = Math.floor(elapsed / oneLoop) + 1;
            const loopTime = elapsed % oneLoop;
            const tIn = bp.inhale || 4;
            const tHoldIn = tIn + (bp.holdIn || 0);
            const tEx = tHoldIn + (bp.exhale || 4);

            if (loopTime < tIn) {
              currentSubPhase = 'INHALE';
              radius = Math.min(1.0, loopTime / Math.max(0.1, tIn));
            } else if (loopTime < tHoldIn) {
              currentSubPhase = 'HOLD_IN';
              radius = 1.0;
            } else if (loopTime < tEx) {
              currentSubPhase = 'EXHALE';
              const exProg = Math.min(1.0, (loopTime - tHoldIn) / Math.max(0.1, bp.exhale || 4));
              radius = 1.0 - exProg;
            } else {
              currentSubPhase = 'HOLD_OUT';
              radius = 0.0;
            }

            setActiveSubPhase(currentSubPhase);
            setSubCycleInfo({ cycle: Math.min(bp.cycles || 1, currentCycle), totalCycles: bp.cycles || 1 });
          }
        } else {
          if (currentBlock.breathPhase === 'INHALE') {
            radius = progress;
          } else if (currentBlock.breathPhase === 'HOLD_IN') {
            radius = 1.0;
          } else if (currentBlock.breathPhase === 'EXHALE') {
            radius = 1.0 - progress;
          } else if (currentBlock.breathPhase === 'HOLD_OUT') {
            radius = 0.0;
          } else {
            radius = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
          }
          setActiveSubPhase(currentBlock.breathPhase);
          setSubCycleInfo(null);
        }

        const loopData = controller.loopDataRef?.current;
        if (loopData) {
          loopData.isBreathActive = true;
          loopData.breathPhase = currentSubPhase;
          loopData.breathRadius = radius;
        }

        if (elapsed >= duration) {
          let nextBlockIdx = state.blockIndex + 1;
          let nextCycle = state.cycle;

          if (nextBlockIdx >= state.exp.blocks.length) {
            if (state.exp.loopMode === 'CYCLE_COUNT' && nextCycle >= state.exp.targetCycles) {
              handleStopExperience();
              return;
            }
            nextBlockIdx = 0;
            nextCycle += 1;
          }

          state.blockIndex = nextBlockIdx;
          state.blockStartTime = currentTime;
          state.cycle = nextCycle;
          setActiveBlockIndex(nextBlockIdx);
          setCurrentExpCycle(nextCycle);

          const nextBlock = state.exp.blocks[nextBlockIdx];
          if (nextBlock) {
            applyExperienceBlock(
              nextBlock,
              state.exp.pitchRef || musicPitchRef,
              state.exp.temperament || musicTemperament,
              nextBlock.glideSeconds
            );
          }
        }

        expAnimFrameRef.current = requestAnimationFrame(tick);
      };

      expAnimFrameRef.current = requestAnimationFrame(tick);
    },
    [
      activeExperience,
      isExperienceActive,
      isExperiencePaused,
      isProgressionActive,
      controller,
      musicPitchRef,
      musicTemperament,
      applyExperienceBlock,
      handleStopExperience,
      toggleVisualizerImmersion,
      isMasterPausedRef,
      setIsMasterPaused,
      setIsProgressionActive
    ]
  );

  // Jump to specific block
  const handleJumpToExperienceBlock = useCallback(
    (targetIdx: number) => {
      if (!isExperienceActive || !activeExperience || targetIdx < 0 || targetIdx >= activeExperience.blocks.length)
        return;
      const now = performance.now() / 1000;
      expStateRef.current.blockIndex = targetIdx;
      expStateRef.current.blockStartTime = now;
      setActiveBlockIndex(targetIdx);
      setBlockProgress(0);

      const targetBlock = activeExperience.blocks[targetIdx];
      applyExperienceBlock(
        targetBlock,
        activeExperience.pitchRef || musicPitchRef,
        activeExperience.temperament || musicTemperament,
        targetBlock.glideSeconds
      );
    },
    [isExperienceActive, activeExperience, musicPitchRef, musicTemperament, applyExperienceBlock]
  );

  // Audition block with automatic timeout cleanup
  const handleAuditionBlock = useCallback(
    (block: ExperienceBlock | null) => {
      if (!block) {
        if (auditionTimerRef.current) clearTimeout(auditionTimerRef.current);
        if (!isExperienceActive) {
          controller.audio.setMutes((prev: Record<string, boolean>) => {
            let hasUnmuted = false;
            for (const ch of CHORD_VOICE_CHANNELS) {
              if (!prev[ch.id]) {
                hasUnmuted = true;
                break;
              }
            }
            if (!hasUnmuted) return prev;
            const next = { ...prev };
            CHORD_VOICE_CHANNELS.forEach(ch => {
              next[ch.id] = true;
            });
            return next;
          });
        }
        return;
      }

      if (!controller.audioSys.audioEnabled) {
        controller.toggleAudio();
      }
      applyExperienceBlock(block, musicPitchRef, musicTemperament, 0.2);

      if (auditionTimerRef.current) clearTimeout(auditionTimerRef.current);
      if (!isExperienceActive) {
        const autoDuration = Math.min(10000, Math.max(2000, (block.durationSeconds || 4) * 1000));
        auditionTimerRef.current = setTimeout(() => {
          handleAuditionBlock(null);
        }, autoDuration);
      }
    },
    [controller, musicPitchRef, musicTemperament, applyExperienceBlock, isExperienceActive]
  );

  // Master Active state
  const isMasterActive = Boolean(
    isExperienceActive ||
      controller.audioSys.audioEnabled ||
      controller.temporal.isBreathActive ||
      isProgressionActive ||
      totalActiveTones > 0
  );

  const masterStatus: MasterTransportStatus = isMasterPaused ? 'PAUSED' : isMasterActive ? 'PLAYING' : 'IDLE';

  // Universal Master Play / Pause handler
  const handleToggleMasterPlay = useCallback(() => {
    if (isMasterActive && !isMasterPaused) {
      controller.audioSys.pauseAudio();
      if (isExperienceActive && !isExperiencePaused) {
        handleTogglePlayExperience();
      }
      masterPauseTimeRef.current = performance.now() / 1000;
      isMasterPausedRef.current = true;
      setIsMasterPaused(true);
      const loopData = controller.loopDataRef?.current;
      if (loopData) {
        loopData.isMasterPaused = true;
      }
    } else if (isMasterPaused) {
      const now = performance.now() / 1000;
      const pauseDuration = masterPauseTimeRef.current > 0 ? now - masterPauseTimeRef.current : 0;
      masterPauseTimeRef.current = 0;

      controller.audioSys.resumeAudio();
      if (controller.temporal.breathStartTime && pauseDuration > 0) {
        controller.temporal.setBreathStartTime((prev: number) => (prev ? prev + pauseDuration : now));
      }

      if (isExperienceActive && isExperiencePaused) {
        handleTogglePlayExperience();
      }

      isMasterPausedRef.current = false;
      setIsMasterPaused(false);
      const loopData = controller.loopDataRef?.current;
      if (loopData) {
        loopData.isMasterPaused = false;
      }
    } else {
      if (activeExperience) {
        handleTogglePlayExperience(activeExperience);
      } else {
        if (!controller.audioSys.audioEnabled) {
          controller.audioSys.initAudio(
            controller.atmosphere.reverbConfig,
            controller.temporal.breathConfig,
            controller.temporal.binauralFreqs,
            controller.atmosphere.delayConfig
          );
          controller.audioSys.setAudioEnabled(true);
        }
        if (!controller.temporal.isBreathActive) {
          controller.temporal.setIsBreathActive(true);
          controller.temporal.setBreathStartTime(performance.now() / 1000);
        }
      }
      isMasterPausedRef.current = false;
      setIsMasterPaused(false);
      const loopData = controller.loopDataRef?.current;
      if (loopData) {
        loopData.isMasterPaused = false;
      }
    }
  }, [
    isMasterActive,
    isMasterPaused,
    isExperienceActive,
    isExperiencePaused,
    activeExperience,
    controller,
    handleTogglePlayExperience,
    isMasterPausedRef,
    setIsMasterPaused,
    masterPauseTimeRef
  ]);

  // Master Stop
  const handleMasterStop = useCallback(() => {
    if (isExperienceActive) {
      handleStopExperience();
    }
    if (isProgressionActive) {
      setIsProgressionActive(false);
      setCachedStorage('ppl_chord_progression_active', 'false');
      const loopData = controller.loopDataRef?.current;
      if (loopData?.mutes) {
        CHORD_VOICE_CHANNELS.forEach(ch => {
          loopData.mutes[ch.id] = true;
        });
      }
      controller.audio.setMutes((prev: Record<string, boolean>) => {
        const next = { ...prev };
        CHORD_VOICE_CHANNELS.forEach(ch => {
          next[ch.id] = true;
        });
        return next;
      });
    }

    if (controller.temporal.isBreathActive) {
      controller.temporal.setIsBreathActive(false);
    }

    if (controller.audioSys.graphRef?.current) {
      const g = controller.audioSys.graphRef.current;
      const ctx = g.ctx;
      const t = ctx.currentTime;
      Object.values(g.latticeGains || {}).forEach((gainNode: unknown) => {
        const gn = gainNode as GainNode;
        if (gn && gn.gain) {
          try {
            gn.gain.cancelScheduledValues(t);
            gn.gain.setValueAtTime(gn.gain.value, t);
            gn.gain.linearRampToValueAtTime(0.0001, t + 0.025);
          } catch {
            /* ignore */
          }
        }
      });
    }

    controller.audioSys.pauseAudio();
    controller.audioSys.setAudioEnabled(false);
    isMasterPausedRef.current = false;
    setIsMasterPaused(false);
    masterPauseTimeRef.current = 0;
    const loopData = controller.loopDataRef?.current;
    if (loopData) {
      loopData.isMasterPaused = false;
    }
  }, [isExperienceActive, isProgressionActive, controller, handleStopExperience, isMasterPausedRef, setIsMasterPaused, setIsProgressionActive, masterPauseTimeRef]);

  // Master Clear
  const handleMasterClear = useCallback(() => {
    handleMasterStop();
    setActiveExperience(null);
    setBlockProgress(0);
    setActiveBlockIndex(0);
    setActiveSubPhase('INHALE');
    setSubCycleInfo(null);
    experienceStateSnapshotRef.current = null;

    if (setCurrentChordIndex) setCurrentChordIndex(0);
    if (setMusicScaleChannels) setMusicScaleChannels([]);
    if (setActiveChordId) setActiveChordId(null);

    if (controller.audio.setCustomFrequencies) {
      controller.audio.setCustomFrequencies({});
    }
    if (controller.audio.setPitchShift) {
      controller.audio.setPitchShift(0);
    }
    const loopData = controller.loopDataRef?.current;
    if (loopData) {
      loopData.customFrequencies = {};
      loopData.isMusicMode = false;
    }

    setActiveToneArray('UNIVERSAL');
    if (setActiveHarmonicIndex) setActiveHarmonicIndex(-1);

    controller.audio.setMutes({});
    controller.audio.setStackMutes({});
    if (loopData) {
      loopData.mutes = {};
      loopData.stackMutes = {};
    }

    setIsPolyvagalModalOpen(false);
    if (controller.temporal.sensorMode !== 'TOUCH') {
      controller.temporal.setSensorMode('TOUCH');
    }
  }, [
    handleMasterStop,
    controller,
    setActiveToneArray,
    setActiveHarmonicIndex,
    setMusicScaleChannels,
    setActiveChordId,
    setCurrentChordIndex,
    setIsPolyvagalModalOpen
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (expAnimFrameRef.current) cancelAnimationFrame(expAnimFrameRef.current);
      const timer = auditionTimerRef.current;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    isExperienceModalOpen,
    setIsExperienceModalOpen,
    isExperienceActive,
    isExperiencePaused,
    activeExperience,
    setActiveExperience,
    activeBlockIndex,
    currentExpCycle,
    blockProgress,
    activeSubPhase,
    subCycleInfo,
    applyExperienceBlock,
    handleStopExperience,
    handleTogglePlayExperience,
    handleJumpToExperienceBlock,
    handleAuditionBlock,
    isMasterActive,
    isMasterPaused,
    setIsMasterPaused,
    isMasterPausedRef,
    masterStatus,
    handleToggleMasterPlay,
    handleMasterStop,
    handleMasterClear
  };
};
