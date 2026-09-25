/* eslint-disable react-hooks/immutability */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TuningTemperament,
  TEMPERAMENTS,
  calculateMusicalScaleFreqs,
  createChannel,
  ALL_CHANNELS,
  CHORD_VOICE_CHANNELS,
  PresetType
} from '../../visuals/shared';
import {
  MOOD_CATEGORIES,
  MusicalMood,
  ProgressionDef,
  ChordDef,
  getChordFrequencies,
  getNextGenerativeChordIndex,
  getAllMoodCategories,
  loadCustomProgressions
} from '../../../../services/audio/chordProgressions';
import { computeVoiceLeading } from '../../../../services/audio/ChordGlideEngine';
import { getCachedStorage, setCachedStorage } from '../tunerStorage';

export interface UsePlanetaryProgressionProps {
  controller: {
    audio?: {
      mutes?: Record<string, boolean>;
      chordGlideConfig?: Record<string, unknown>;
      [key: string]: unknown;
    };
    loopDataRef?: React.MutableRefObject<Record<string, unknown>>;
    [key: string]: unknown;
  };
  isMasterPausedRef: React.MutableRefObject<boolean>;
  onShowToast: (message: string, duration?: number) => void;
  setActiveToneArray: (type: PresetType) => void;
}

export const usePlanetaryProgression = ({
  controller,
  isMasterPausedRef,
  onShowToast,
  setActiveToneArray
}: UsePlanetaryProgressionProps) => {
  // Musical Keyboard Scale State (Concert Pitch & Temperament)
  const [musicPitchRef, setMusicPitchRef] = useState<number>(() => {
    const saved = getCachedStorage('ppl_music_pitch');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 380 && parsed <= 480) return parsed;
    }
    return 440.0;
  });

  const [musicTemperament, setMusicTemperament] = useState<TuningTemperament>(() => {
    const saved = getCachedStorage('ppl_music_temperament') as TuningTemperament;
    if (saved && saved !== '12TET' && TEMPERAMENTS.some(t => t.id === saved)) return saved;
    return 'JUST_INTONATION';
  });

  const [musicOctaveShift, setMusicOctaveShift] = useState<number>(() => {
    const saved = getCachedStorage('ppl_music_octave_shift');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= -2 && parsed <= 2) return parsed;
    }
    return 0;
  });

  // Musical Mode: Mood & Chord Progressions State (OFF by default upon boot)
  const [isProgressionActive, setIsProgressionActive] = useState<boolean>(false);

  // Load custom user progressions from localStorage
  const [customProgressions, setCustomProgressions] = useState<ProgressionDef[]>(() => {
    return loadCustomProgressions();
  });

  const reloadCustomProgressions = useCallback(() => {
    setCustomProgressions(loadCustomProgressions());
  }, []);

  const allMoodCategories = useMemo(() => {
    return getAllMoodCategories(customProgressions);
  }, [customProgressions]);

  const [activeMood, setActiveMood] = useState<MusicalMood>(() => {
    const saved = getCachedStorage('ppl_active_mood') as MusicalMood;
    if (saved && MOOD_CATEGORIES.some(m => m.mood === saved)) return saved;
    return 'SERENITY';
  });

  const [activeProgressionId, setActiveProgressionId] = useState<string>(() => {
    const saved = getCachedStorage('ppl_active_progression_id');
    if (saved) return saved;
    return 'serenity_ocean';
  });

  const [currentChordIndex, setCurrentChordIndex] = useState<number>(0);
  const [progressionAdvanceMode, setProgressionAdvanceMode] = useState<
    'BREATH_CYCLE' | 'BREATH_PHASE' | 'BREATH_EXHALE' | 'MANUAL'
  >('BREATH_PHASE');

  const progressionAnimFrameRef = useRef<number | null>(null);

  // Active mood category object
  const currentMoodObj = useMemo(() => {
    return allMoodCategories.find(m => m.mood === activeMood) || allMoodCategories[0];
  }, [allMoodCategories, activeMood]);

  // Active progression object
  const currentProgressionObj = useMemo(() => {
    return (
      currentMoodObj.progressions.find(p => p.id === activeProgressionId) ||
      allMoodCategories.flatMap(m => m.progressions).find(p => p.id === activeProgressionId) ||
      currentMoodObj.progressions[0] ||
      allMoodCategories[0].progressions[0]
    );
  }, [currentMoodObj, allMoodCategories, activeProgressionId]);

  // Automatically switch to preferred tuning when a progression is selected
  const applyProgressionTuning = useCallback((prog: ProgressionDef) => {
    if (prog.recommendedTemperament) {
      setMusicTemperament(prog.recommendedTemperament);
      setCachedStorage('ppl_music_temperament', prog.recommendedTemperament);
    }
    if (prog.recommendedPitch) {
      setMusicPitchRef(prog.recommendedPitch);
      setCachedStorage('ppl_music_pitch', prog.recommendedPitch.toString());
    }
  }, []);

  const handleSelectMood = useCallback(
    (mood: MusicalMood) => {
      setActiveMood(mood);
      setCachedStorage('ppl_active_mood', mood);
      const categories = getAllMoodCategories(loadCustomProgressions());
      const newMoodObj = categories.find(m => m.mood === mood) || categories[0];
      if (newMoodObj && newMoodObj.progressions.length > 0) {
        const firstProg = newMoodObj.progressions[0];
        setActiveProgressionId(firstProg.id);
        setCachedStorage('ppl_active_progression_id', firstProg.id);
        applyProgressionTuning(firstProg);
      }
      setCurrentChordIndex(0);
    },
    [applyProgressionTuning]
  );

  const handleSelectProgression = useCallback(
    (progId: string) => {
      setActiveProgressionId(progId);
      setCachedStorage('ppl_active_progression_id', progId);
      const allProgs = getAllMoodCategories(loadCustomProgressions()).flatMap(m => m.progressions);
      const prog = allProgs.find(p => p.id === progId);
      if (prog) {
        applyProgressionTuning(prog);
      }
      setCurrentChordIndex(0);
    },
    [applyProgressionTuning]
  );

  const handleMusicPitchChange = useCallback((newPitch: number) => {
    setMusicPitchRef(newPitch);
    setCachedStorage('ppl_music_pitch', newPitch.toString());
  }, []);

  const handleMusicTemperamentChange = useCallback((newTemp: TuningTemperament) => {
    setMusicTemperament(newTemp);
    setCachedStorage('ppl_music_temperament', newTemp);
  }, []);

  const handleMusicOctaveShiftChange = useCallback((newShift: number) => {
    setMusicOctaveShift(newShift);
    setCachedStorage('ppl_music_octave_shift', newShift.toString());
  }, []);

  // Compute music scale channels for the active scale
  const musicScaleChannels = useMemo(() => {
    const freqs = calculateMusicalScaleFreqs(musicPitchRef, musicTemperament, 3 + musicOctaveShift, 3);
    return freqs.map((item, idx) =>
      createChannel(
        'UNIVERSAL',
        800 + idx,
        item.freq,
        () => 8.0,
        0.8,
        item.note,
        item.octave
      )
    );
  }, [musicPitchRef, musicTemperament, musicOctaveShift]);

  const handleAdvanceChord = useCallback(
    (dir: 1 | -1) => {
      if (!currentProgressionObj || currentProgressionObj.chords.length === 0) return;
      const len = currentProgressionObj.chords.length;
      if (dir === 1 && controller.audio.chordGlideConfig?.generativeDrift) {
        setCurrentChordIndex(prev => getNextGenerativeChordIndex(prev, len, currentProgressionObj.mood));
      } else {
        setCurrentChordIndex(prev => (prev + dir + len) % len);
      }
    },
    [currentProgressionObj, controller.audio?.chordGlideConfig?.generativeDrift]
  );

  const handleSaveAndActivateProgression = useCallback(
    (prog: ProgressionDef) => {
      const updatedCustom = loadCustomProgressions();
      setCustomProgressions(updatedCustom);
      setActiveMood(prog.mood);
      setCachedStorage('ppl_active_mood', prog.mood);
      setActiveProgressionId(prog.id);
      setCachedStorage('ppl_active_progression_id', prog.id);
      applyProgressionTuning(prog);
      setIsProgressionActive(true);
      setCachedStorage('ppl_chord_progression_active', 'true');
      setActiveToneArray('MUSIC_SCALE');
      setCurrentChordIndex(0);
      if (controller.temporal.entrainmentMode === 'SILENT') {
        controller.temporal.setEntrainmentMode('SYNCED');
      }
      if (
        (controller.temporal.entrainmentMode === 'SYNCED' || controller.temporal.entrainmentMode === 'SILENT') &&
        !controller.temporal.isBreathActive
      ) {
        controller.temporal.setIsBreathActive(true);
        controller.temporal.setBreathStartTime(performance.now() / 1000);
      }
      if (!controller.audioSys.audioEnabled) {
        controller.audioSys.setAudioEnabled(true);
        controller.audioSys.initAudio(
          controller.atmosphere.reverbConfig,
          controller.temporal.breathConfig,
          controller.temporal.binauralFreqs,
          controller.atmosphere.delayConfig
        );
      }
      onShowToast(`Activated "${prog.name}" with preferred tuning`, 2000);
    },
    [applyProgressionTuning, controller, setActiveToneArray, onShowToast]
  );

  const handleToggleProgression = useCallback(() => {
    setIsProgressionActive(prev => {
      const next = !prev;
      setCachedStorage('ppl_chord_progression_active', next.toString());
      if (next) {
        setActiveToneArray('MUSIC_SCALE');
        if (currentProgressionObj) {
          applyProgressionTuning(currentProgressionObj);
        }
        if (controller.temporal.entrainmentMode === 'SILENT') {
          controller.temporal.setEntrainmentMode('SYNCED');
        }
        if (
          (controller.temporal.entrainmentMode === 'SYNCED' || controller.temporal.entrainmentMode === 'SILENT') &&
          !controller.temporal.isBreathActive
        ) {
          controller.temporal.setIsBreathActive(true);
          controller.temporal.setBreathStartTime(performance.now() / 1000);
        }
        if (!controller.audioSys.audioEnabled) {
          controller.audioSys.setAudioEnabled(true);
          controller.audioSys.initAudio(
            controller.atmosphere.reverbConfig,
            controller.temporal.breathConfig,
            controller.temporal.binauralFreqs,
            controller.atmosphere.delayConfig
          );
        }
      }
      return next;
    });
  }, [currentProgressionObj, applyProgressionTuning, controller, setActiveToneArray]);

  // Breath Pacer Chord Progression Synchronizer: advances on INHALE / EXHALE
  const prevBreathPhaseRef = useRef<string>('IDLE');

  useEffect(() => {
    if (!isProgressionActive) {
      prevBreathPhaseRef.current = 'IDLE';
      if (progressionAnimFrameRef.current) {
        cancelAnimationFrame(progressionAnimFrameRef.current);
        progressionAnimFrameRef.current = null;
      }
      return;
    }

    const checkBreathProgression = () => {
      if (isMasterPausedRef.current) {
        progressionAnimFrameRef.current = requestAnimationFrame(checkBreathProgression);
        return;
      }

      const isBreathActive = controller.temporal.isBreathActive;
      const breathStartTime = controller.temporal.breathStartTime;
      const breathConfig = controller.temporal.breathConfig;

      if (!isBreathActive || !breathStartTime) {
        prevBreathPhaseRef.current = 'IDLE';
        progressionAnimFrameRef.current = requestAnimationFrame(checkBreathProgression);
        return;
      }

      const inhale = breathConfig?.inhale !== undefined ? Number(breathConfig.inhale) : 4;
      const holdIn = breathConfig?.holdIn !== undefined ? Number(breathConfig.holdIn) : 0;
      const exhale = breathConfig?.exhale !== undefined ? Number(breathConfig.exhale) : 6;
      const holdOut = breathConfig?.holdOut !== undefined ? Number(breathConfig.holdOut) : 0;
      const cycleDuration = Math.max(0.5, inhale + holdIn + exhale + holdOut);

      const now = performance.now() / 1000;
      const elapsed = Math.max(0, now - breathStartTime);
      const cycleProgress = elapsed % cycleDuration;

      let phase: 'INHALE' | 'HOLD_IN' | 'EXHALE' | 'HOLD_OUT' = 'INHALE';
      if (cycleProgress < inhale) {
        phase = 'INHALE';
      } else if (holdIn > 0 && cycleProgress < inhale + holdIn) {
        phase = 'HOLD_IN';
      } else if (cycleProgress < inhale + holdIn + exhale) {
        phase = 'EXHALE';
      } else {
        phase = 'HOLD_OUT';
      }

      if (prevBreathPhaseRef.current === 'IDLE') {
        prevBreathPhaseRef.current = phase;
      } else if (phase !== prevBreathPhaseRef.current) {
        prevBreathPhaseRef.current = phase;
        if (progressionAdvanceMode === 'BREATH_PHASE') {
          if (phase === 'INHALE' || phase === 'EXHALE') {
            handleAdvanceChord(1);
          }
        } else if (progressionAdvanceMode === 'BREATH_CYCLE') {
          if (phase === 'INHALE') {
            handleAdvanceChord(1);
          }
        } else if ((progressionAdvanceMode as string) === 'BREATH_EXHALE') {
          if (phase === 'EXHALE') {
            handleAdvanceChord(1);
          }
        }
      }

      progressionAnimFrameRef.current = requestAnimationFrame(checkBreathProgression);
    };

    if (progressionAnimFrameRef.current) {
      cancelAnimationFrame(progressionAnimFrameRef.current);
    }
    progressionAnimFrameRef.current = requestAnimationFrame(checkBreathProgression);

    return () => {
      if (progressionAnimFrameRef.current) {
        cancelAnimationFrame(progressionAnimFrameRef.current);
        progressionAnimFrameRef.current = null;
      }
    };
  }, [
    isProgressionActive,
    progressionAdvanceMode,
    controller.temporal.isBreathActive,
    controller.temporal.breathStartTime,
    controller.temporal.breathConfig,
    handleAdvanceChord,
    isMasterPausedRef
  ]);

  const setAudioMutesRef = useRef(controller.audio.setMutes);
  useEffect(() => {
    setAudioMutesRef.current = controller.audio.setMutes;
  });

  const wasProgressionActiveRef = useRef(isProgressionActive);
  const currentVoicePitchesRef = useRef<(number | null)[]>([]);

  // Apply active chord frequencies to the audio engine using persistent voice channels with voice leading
  useEffect(() => {
    if (!isProgressionActive) {
      if (controller.loopDataRef && controller.loopDataRef.current) {
        controller.loopDataRef.current.isMusicMode = false;
        controller.loopDataRef.current.currentChordRootNote = undefined;
        controller.loopDataRef.current.currentChordRootFreq = undefined;
      }
      return;
    }

    if (!currentProgressionObj || currentProgressionObj.chords.length === 0) return;

    const activeChord = currentProgressionObj.chords[currentChordIndex % currentProgressionObj.chords.length];
    if (!activeChord) return;

    const chordInfo = getChordFrequencies(activeChord, musicPitchRef, musicTemperament, musicOctaveShift, {
      adaptiveJustIntonation: controller.audio.chordGlideConfig?.adaptiveJustIntonation,
      voicingStyle: controller.audio.chordGlideConfig?.voicingStyle,
      lowIntervalLimit: controller.audio.chordGlideConfig?.lowIntervalLimit,
      abComparisonMode: controller.audio.chordGlideConfig?.abComparisonMode
    });
    const currentNotes = chordInfo.notes;

    const voiceLeadingMode = controller.audio.chordGlideConfig?.voiceLeading || 'CLOSEST_PITCH';
    const plan = computeVoiceLeading(currentVoicePitchesRef.current, currentNotes, voiceLeadingMode);

    const voiceFreqMap: Record<string, number> = {};
    const voiceSourceFreqMap: Record<string, number> = {};
    const activeVoiceIds = new Set<string>();
    const nextVoicePitches: (number | null)[] = [...currentVoicePitchesRef.current];

    plan.assignments.forEach(asgn => {
      if (asgn.voiceIndex < CHORD_VOICE_CHANNELS.length) {
        const voiceId = CHORD_VOICE_CHANNELS[asgn.voiceIndex].id;
        if (asgn.isDroppedVoice) {
          nextVoicePitches[asgn.voiceIndex] = null;
        } else {
          voiceFreqMap[voiceId] = asgn.targetFreq;
          if (asgn.sourceFreq) {
            voiceSourceFreqMap[voiceId] = asgn.sourceFreq;
          }
          activeVoiceIds.add(voiceId);
          nextVoicePitches[asgn.voiceIndex] = asgn.targetFreq;
        }
      }
    });

    currentVoicePitchesRef.current = nextVoicePitches;

    if (controller.loopDataRef && controller.loopDataRef.current) {
      const rootNoteFreq = chordInfo.notes.find(n => n.isRoot)?.freq || chordInfo.notes[0]?.freq;
      controller.loopDataRef.current.isMusicMode = true;
      controller.loopDataRef.current.currentChordRootNote = activeChord.root;
      controller.loopDataRef.current.currentChordRootFreq = rootNoteFreq;
      controller.loopDataRef.current.customFrequencies = {
        ...(controller.loopDataRef.current.customFrequencies || {}),
        ...voiceFreqMap
      };
      controller.loopDataRef.current.chordVoiceSourceFreqs = {
        ...(controller.loopDataRef.current.chordVoiceSourceFreqs || {}),
        ...voiceSourceFreqMap
      };
    }

    setAudioMutesRef.current((prev: Record<string, boolean>) => {
      let isIdentical = true;
      for (const id of activeVoiceIds) {
        if (prev[id] !== false) {
          isIdentical = false;
          break;
        }
      }
      if (isIdentical) {
        for (const ch of CHORD_VOICE_CHANNELS) {
          if (!activeVoiceIds.has(ch.id) && prev[ch.id] !== true) {
            isIdentical = false;
            break;
          }
        }
      }
      if (isIdentical) return prev;

      const next = { ...prev };
      if (!wasProgressionActiveRef.current) {
        ALL_CHANNELS.forEach(ch => {
          next[ch.id] = true;
        });
        musicScaleChannels.forEach(ch => {
          next[ch.id] = true;
        });
      }
      CHORD_VOICE_CHANNELS.forEach(ch => {
        next[ch.id] = !activeVoiceIds.has(ch.id);
      });
      return next;
    });
  }, [
    isProgressionActive,
    currentChordIndex,
    currentProgressionObj,
    musicPitchRef,
    musicTemperament,
    musicOctaveShift,
    musicScaleChannels,
    controller.audio.chordGlideConfig,
    controller.loopDataRef
  ]);

  // Clean up and release chord voices & scale channels ONLY when progression is turned OFF
  useEffect(() => {
    if (wasProgressionActiveRef.current && !isProgressionActive) {
      currentVoicePitchesRef.current = [];
      setAudioMutesRef.current((prev: Record<string, boolean>) => {
        let changed = false;
        const next = { ...prev };
        CHORD_VOICE_CHANNELS.forEach(ch => {
          if (next[ch.id] === false) {
            next[ch.id] = true;
            changed = true;
          }
        });
        musicScaleChannels.forEach(ch => {
          if (next[ch.id] === false) {
            next[ch.id] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
    wasProgressionActiveRef.current = isProgressionActive;
  }, [isProgressionActive, musicScaleChannels]);

  const handleSelectChordIndex = useCallback((index: number) => {
    setCurrentChordIndex(index);
    setIsProgressionActive(true);
  }, []);

  const handlePlaySingleChord = useCallback(
    (chord: ChordDef) => {
      if (currentProgressionObj && currentProgressionObj.chords.length > 0) {
        const foundIdx = currentProgressionObj.chords.findIndex(c => c.name === chord.name);
        if (foundIdx !== -1) {
          handleSelectChordIndex(foundIdx);
          return;
        }
      }

      const chordInfo = getChordFrequencies(chord, musicPitchRef, musicTemperament, musicOctaveShift, {
        adaptiveJustIntonation: controller.audio.chordGlideConfig?.adaptiveJustIntonation,
        voicingStyle: controller.audio.chordGlideConfig?.voicingStyle,
        lowIntervalLimit: controller.audio.chordGlideConfig?.lowIntervalLimit,
        abComparisonMode: controller.audio.chordGlideConfig?.abComparisonMode
      });
      const currentNotes = chordInfo.notes;

      const voiceLeadingMode = controller.audio.chordGlideConfig?.voiceLeading || 'CLOSEST_PITCH';
      const plan = computeVoiceLeading(currentVoicePitchesRef.current, currentNotes, voiceLeadingMode);

      const voiceFreqMap: Record<string, number> = {};
      const activeVoiceIds = new Set<string>();
      const nextVoicePitches: (number | null)[] = [...currentVoicePitchesRef.current];

      plan.assignments.forEach(asgn => {
        if (asgn.voiceIndex < CHORD_VOICE_CHANNELS.length) {
          const voiceId = CHORD_VOICE_CHANNELS[asgn.voiceIndex].id;
          if (asgn.isDroppedVoice) {
            nextVoicePitches[asgn.voiceIndex] = null;
          } else {
            voiceFreqMap[voiceId] = asgn.targetFreq;
            activeVoiceIds.add(voiceId);
            nextVoicePitches[asgn.voiceIndex] = asgn.targetFreq;
          }
        }
      });

      currentVoicePitchesRef.current = nextVoicePitches;

      if (controller.loopDataRef && controller.loopDataRef.current) {
        controller.loopDataRef.current.customFrequencies = {
          ...(controller.loopDataRef.current.customFrequencies || {}),
          ...voiceFreqMap
        };
      }

      controller.audio.setMutes((prev: Record<string, boolean>) => {
        const next = { ...prev };
        ALL_CHANNELS.forEach(ch => {
          next[ch.id] = true;
        });
        musicScaleChannels.forEach(ch => {
          next[ch.id] = true;
        });
        CHORD_VOICE_CHANNELS.forEach(ch => {
          next[ch.id] = !activeVoiceIds.has(ch.id);
        });
        return next;
      });
    },
    [
      currentProgressionObj,
      handleSelectChordIndex,
      musicPitchRef,
      musicTemperament,
      musicOctaveShift,
      musicScaleChannels,
      controller.audio,
      controller.loopDataRef
    ]
  );

  // Active chord tones represented on the piano keyboard
  const currentChordScaleIds = useMemo(() => {
    if (!isProgressionActive || !currentProgressionObj) return new Set<string>();
    const activeChord = currentProgressionObj.chords[currentChordIndex % currentProgressionObj.chords.length];
    if (!activeChord) return new Set<string>();
    const chordInfo = getChordFrequencies(activeChord, musicPitchRef, musicTemperament, musicOctaveShift);
    return new Set(chordInfo.notes.map(n => n.channelId));
  }, [isProgressionActive, currentProgressionObj, currentChordIndex, musicPitchRef, musicTemperament, musicOctaveShift]);

  return {
    musicPitchRef,
    setMusicPitchRef,
    handleMusicPitchChange,
    musicTemperament,
    setMusicTemperament,
    handleMusicTemperamentChange,
    musicOctaveShift,
    setMusicOctaveShift,
    handleMusicOctaveShiftChange,
    musicScaleChannels,
    isProgressionActive,
    setIsProgressionActive,
    handleToggleProgression,
    customProgressions,
    setCustomProgressions,
    reloadCustomProgressions,
    allMoodCategories,
    activeMood,
    handleSelectMood,
    activeProgressionId,
    handleSelectProgression,
    currentMoodObj,
    currentProgressionObj,
    currentChordIndex,
    setCurrentChordIndex,
    handleSelectChordIndex,
    handleAdvanceChord,
    handlePlaySingleChord,
    progressionAdvanceMode,
    setProgressionAdvanceMode,
    handleSaveAndActivateProgression,
    currentChordScaleIds,
    applyProgressionTuning
  };
};
