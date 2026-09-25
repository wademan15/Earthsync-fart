import { ExperienceDef } from './experienceDesigner';

export const STARTER_LONG_FORM_EXPERIENCES: ExperienceDef[] = [
    // 1. THE HYPNAGOGIC DESCENT (18 min Multi-Chapter Twilight Induction)
    {
        id: 'exp_hypnagogic_descent',
        name: 'The Hypnagogic Descent',
        description: 'An evolving 18-minute twilight induction moving through somatic grounding, Schumann gate entrainment, theta hypnagogia, and delta sleep dissolution.',
        category: 'SLEEP & TRANSCENDENCE',
        pitchRef: 432.0,
        temperament: 'JUST_INTONATION',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // Chapter 1: Somatic Grounding (180s = 3 min)
            {
                id: 'hypno_ch1',
                label: 'Chapter 1: Somatic Grounding',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 2, cycles: 13, label: '4-2-6-2 Grounding Flow' },
                soundType: 'CHORD',
                chord: { name: 'Cmaj9', root: 'C', type: 'maj9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 180,
                glideSeconds: 4.0,
                description: 'Gentle diaphragmatic release in 432Hz verdian resonance with 10Hz alpha entrainment.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.35, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.35 }
            },
            // Chapter 2: The Twilight Gate (300s = 5 min)
            {
                id: 'hypno_ch2',
                label: 'Chapter 2: The Twilight Gate',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 4, exhale: 6, holdOut: 1, cycles: 20, label: 'Schumann Theta Sync' },
                soundType: 'TONE_STACK',
                toneStack: [125.28, 250.56, 375.84], // Earth-ionosphere Schumann harmonic ladder
                breathPhase: 'FREE_FLOW',
                durationSeconds: 300,
                glideSeconds: 6.0,
                description: 'Atmospheric 7.83Hz Schumann resonance gate, transitioning sympathetic tone to effortless ease.',
                entrainment: { enabled: true, frequencyHz: 7.83, layers: ['binaural', 'monaural'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.45, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 58, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'RAIN', noiseVolume: 0.25, cueTone: 'TIBETAN', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.4 }
            },
            // Chapter 3: Hypnagogic Drift (360s = 6 min)
            {
                id: 'hypno_ch3',
                label: 'Chapter 3: Hypnagogic Drift',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 7, exhale: 8, holdOut: 1, cycles: 18, label: '4-7-8 Deep Parasympathetic' },
                soundType: 'CHORD',
                chord: { name: 'Fm9', root: 'F', type: 'min9', octave: 2 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 360,
                glideSeconds: 8.0,
                description: 'Deep 4.5Hz Theta dreamwave with sub-bass drone and warm amber retinal bloom.',
                entrainment: { enabled: true, frequencyHz: 4.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'COMPASSION', intensity: 0.55, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 54, volume: 0.2, doubleBeat: true },
                breath: { enabled: true, noiseType: 'CAVE', noiseVolume: 0.35, cueTone: 'OM', colorScheme: 'AMETHYST_COSMOS' },
                matrix: { enabled: true, composerWarp: 'DEBUSSY', composerIntensity: 0.5 },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'FIBONACCI' },
                pulse: { enabled: true, pulseStyle: 'AMETHYST_PULSE', depth: 0.3 }
            },
            // Chapter 4: Delta Dissolution (240s = 4 min)
            {
                id: 'hypno_ch4',
                label: 'Chapter 4: Delta Dissolution',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 8, holdOut: 2, cycles: 15, label: 'Delta Wave Sedation' },
                soundType: 'PURE_TONE',
                pureToneHz: 108.0, // Sacred universal fundamental
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 10.0,
                description: 'Minimal pure sine carrier with 1.8Hz delta binaural beat, cardiovascular pacing at 48 BPM drifting to stillness.',
                entrainment: { enabled: true, frequencyHz: 1.8, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.7 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 48, volume: 0.15, doubleBeat: false },
                breath: { enabled: true, noiseType: 'SILENCE', noiseVolume: 0.0, cueTone: 'NONE' },
                pulse: { enabled: true, pulseStyle: 'BLACK_SHUTTER', depth: 0.15 }
            }
        ]
    },

    // 2. CATHARSIS & EMOTIONAL ALCHEMY (22 min Holotropic Somatic Arc)
    {
        id: 'exp_catharsis_alchemy',
        name: 'Catharsis & Emotional Alchemy',
        description: 'A 22-minute transformative somatic arc moving from inward centering through harmonic tension and 40Hz gamma release into radiant peace.',
        category: 'SOMATIC TRANSFORMATION',
        pitchRef: 432.0,
        temperament: 'PYTHAGOREAN',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // Chapter 1: Inward Centering (240s = 4 min)
            {
                id: 'alch_ch1',
                label: 'Chapter 1: Inward Centering',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, cycles: 20, label: 'Centering Wave (4-2-6)' },
                soundType: 'CHORD',
                chord: { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 3.0,
                description: 'Deep grounding bass drone with 10Hz alpha entrainment establishing somatic safety and baseline stability.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'INTEREST', intensity: 0.3 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 68, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'WIND', noiseVolume: 0.3, cueTone: 'WOOD', colorScheme: 'ICE_AURA' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.3 }
            },
            // Chapter 2: Harmonic Friction & Heat (360s = 6 min)
            {
                id: 'alch_ch2',
                label: 'Chapter 2: Energy Activation & Heat',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, cycles: 30, label: 'Triangle Heat Activation' },
                soundType: 'CHORD',
                chord: { name: 'Fsus4', root: 'F', type: 'sus4', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 360,
                glideSeconds: 4.0,
                description: 'Moving through suspended modal tension, ramping 16Hz beta entrainment and dynamic Sentic Courage curve.',
                entrainment: { enabled: true, frequencyHz: 16.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'COURAGE', intensity: 0.65, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 78, volume: 0.45, doubleBeat: true },
                breath: { enabled: true, noiseType: 'FIRE', noiseVolume: 0.4, cueTone: 'SHAKER', colorScheme: 'SUNSET_BLOOM' },
                pulse: { enabled: true, pulseStyle: 'ROSE_RADIANCE', depth: 0.6 }
            },
            // Chapter 3: Peak Catharsis & Breakthrough (300s = 5 min)
            {
                id: 'alch_ch3',
                label: 'Chapter 3: Peak Catharsis & Breakthrough',
                
                breathPattern: { mode: 'PACED', inhale: 3, holdIn: 1, exhale: 3, holdOut: 0, cycles: 43, label: 'Rapid Cathartic Alchemy' },
                soundType: 'TONE_STACK',
                toneStack: [528.0, 792.0, 1056.0], // 528Hz Transformation harmonics
                breathPhase: 'FREE_FLOW',
                durationSeconds: 300,
                glideSeconds: 3.0,
                description: 'Full 528Hz Solfeggio resonance burst with 40Hz Gamma neural synchrony, stroboscopic photic pulse, and expressive emotional release.',
                entrainment: { enabled: true, frequencyHz: 40.0, layers: ['binaural', 'isochronic', 'monaural'] },
                sentics: { enabled: true, emotion: 'JOY', intensity: 0.85, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 84, volume: 0.5, doubleBeat: true },
                breath: { enabled: true, noiseType: 'BROWN', noiseVolume: 0.3, cueTone: 'GONG', colorScheme: 'SOLAR_AMBER' },
                matrix: { enabled: true, composerWarp: 'BEETHOVEN', composerIntensity: 0.7 },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'PRIME' },
                pulse: { enabled: true, pulseStyle: 'WHITE_BLOOM', depth: 0.75 }
            },
            // Chapter 4: The Stillness After the Storm (240s = 4 min)
            {
                id: 'alch_ch4',
                label: 'Chapter 4: Stillness After the Storm',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 4, exhale: 8, holdOut: 0, cycles: 15, label: 'Vagal Release (4-4-8)' },
                soundType: 'CHORD',
                chord: { name: 'Abmaj7', root: 'Ab', type: 'maj7', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 6.0,
                description: 'Instant plunge into spacious major thirds in Just Intonation, 6Hz theta wave, and deep Sentic Love & Awe.',
                entrainment: { enabled: true, frequencyHz: 6.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'LOVE', intensity: 0.7, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.3, cueTone: 'HARP', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'EMERALD_PULSE', depth: 0.4 }
            },
            // Chapter 5: Re-entry & Grounded Integration (180s = 3 min)
            {
                id: 'alch_ch5',
                label: 'Chapter 5: Grounded Integration',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, cycles: 15, label: 'Earth Day Anchoring' },
                soundType: 'PURE_TONE',
                pureToneHz: 194.18, // Earth Day G
                breathPhase: 'FREE_FLOW',
                durationSeconds: 180,
                glideSeconds: 5.0,
                description: 'Physical circadian re-anchoring in Hans Cousto Earth Day frequency, soft ambient vinyl, returning to grounded lucidity.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.4 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'VINYL', noiseVolume: 0.2, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.3 }
            }
        ]
    },

    // 3. CIRCADIAN SUNRISE AWAKENING (15 min Progressive Morning Arc)
    {
        id: 'exp_circadian_sunrise',
        name: 'Circadian Sunrise Awakening',
        description: 'A 15-minute biological dawn protocol gently elevating brain state from deep twilight theta through warming solar harmonics to 40Hz peak cognitive readiness.',
        category: 'MORNING ENERGETIC',
        pitchRef: 432.0,
        temperament: 'JUST_INTONATION',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // Chapter 1: Dawn Starlight (180s = 3 min)
            {
                id: 'sun_ch1',
                label: 'Chapter 1: Dawn Starlight',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, cycles: 15, label: 'Dawn Awakening (4-2-6)' },
                soundType: 'PURE_TONE',
                pureToneHz: 396.0, // Liberating Root
                breathPhase: 'FREE_FLOW',
                durationSeconds: 180,
                glideSeconds: 4.0,
                description: 'Subtle low-frequency dawn awakening with 4Hz Theta-Delta border entrainment and gentle forest dawn acoustics.',
                entrainment: { enabled: true, frequencyHz: 4.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.3 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 52, volume: 0.25, doubleBeat: false },
                breath: { enabled: true, noiseType: 'FOREST', noiseVolume: 0.3, cueTone: 'WOOD', colorScheme: 'ICE_AURA' },
                pulse: { enabled: true, pulseStyle: 'BLACK_SHUTTER', depth: 0.2 }
            },
            // Chapter 2: First Light (240s = 4 min)
            {
                id: 'sun_ch2',
                label: 'Chapter 2: First Light',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, cycles: 15, label: 'Solar Box Breathing' },
                soundType: 'CHORD',
                chord: { name: 'Gmaj7', root: 'G', type: 'maj7', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 5.0,
                description: 'Golden morning light with 8Hz Alpha frequency, rising heart pacing to 62 BPM, and expanding harmonic warmth.',
                entrainment: { enabled: true, frequencyHz: 8.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.5, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.3, cueTone: 'HARP', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.45 }
            },
            // Chapter 3: Solar Radiance (240s = 4 min)
            {
                id: 'sun_ch3',
                label: 'Chapter 3: Solar Radiance',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 24, label: 'Vitality Pulse (4-2-4)' },
                soundType: 'TONE_STACK',
                toneStack: [126.22, 252.44, 504.88], // Hans Cousto Sun Frequency octaves
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 4.0,
                description: 'Solar Plexus activation with 126.22Hz Sun frequency octaves, 14Hz High-Alpha/Beta entrainment, and energizing breath tide.',
                entrainment: { enabled: true, frequencyHz: 14.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'JOY', intensity: 0.65, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 72, volume: 0.4, doubleBeat: true },
                breath: { enabled: true, noiseType: 'WIND', noiseVolume: 0.35, cueTone: 'TRIANGLE', colorScheme: 'SUNSET_BLOOM' },
                matrix: { enabled: true, composerWarp: 'MOZART', composerIntensity: 0.6 },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'PERIOD_DOUBLE' },
                pulse: { enabled: true, pulseStyle: 'ROSE_RADIANCE', depth: 0.6 }
            },
            // Chapter 4: Peak Clarity & Day Readiness (240s = 4 min)
            {
                id: 'sun_ch4',
                label: 'Chapter 4: Peak Clarity',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 1, exhale: 4, holdOut: 1, cycles: 24, label: 'Gamma Focus Rhythm' },
                soundType: 'CHORD',
                chord: { name: 'D9', root: 'D', type: 'dom9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 3.0,
                description: 'Full 40Hz Gamma neural synchrony, brilliant open acoustic spectrum, and high cognitive vitality for the day.',
                entrainment: { enabled: true, frequencyHz: 40.0, layers: ['binaural', 'isochronic', 'monaural'] },
                sentics: { enabled: true, emotion: 'COURAGE', intensity: 0.75, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 78, volume: 0.45, doubleBeat: true },
                breath: { enabled: true, noiseType: 'PINK', noiseVolume: 0.25, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'WHITE_BLOOM', depth: 0.65 }
            }
        ]
    },

    // 4. DEEP FLOW COGNITIVE IMMERSION (25 min Sustained Flow State Arc)
    {
        id: 'exp_deep_flow',
        name: 'Deep Flow Cognitive Immersion',
        description: 'A 25-minute uninterrupted productivity and creative synthesis suite: mental de-clutter induction, 10Hz/40Hz cross-coupled flow plateau, and crisp mental re-centering.',
        category: 'COGNITIVE FLOW',
        pitchRef: 432.0,
        temperament: 'JUST_INTONATION',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // Induction: Clearing Cognitive Chatter (300s = 5 min)
            {
                id: 'flow_ch1',
                label: 'Phase 1: Mental De-Clutter',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 2, cycles: 25, label: 'Calm Centering (4-2-4-2)' },
                soundType: 'CHORD',
                chord: { name: 'Am9', root: 'A', type: 'min9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 300,
                glideSeconds: 4.0,
                description: 'Smoothing high-beta mental chatter down to 10Hz Alpha with gentle pink noise floor and steady rhythmic acoustic support.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.3 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 64, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'PINK', noiseVolume: 0.35, cueTone: 'PIANO', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.3 }
            },
            // The Sustained Flow Chamber (900s = 15 min)
            {
                id: 'flow_ch2',
                label: 'Phase 2: The Flow Chamber',
                
                breathPattern: { mode: 'PACED', inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0, cycles: 82, label: 'Coherent Flow 0.1Hz' },
                soundType: 'TONE_STACK',
                toneStack: [141.27, 282.54, 423.81], // Mercury frequency (mental speed & communication)
                breathPhase: 'FREE_FLOW',
                durationSeconds: 900,
                glideSeconds: 8.0,
                description: 'Sustained 15-minute cognitive focus chamber. Cousto Mercury harmonics, 10Hz Alpha / 40Hz Gamma coupling, non-distracting steady acoustic flow.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'INTEREST', intensity: 0.5, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 66, volume: 0.2, doubleBeat: true },
                breath: { enabled: true, noiseType: 'RAIN', noiseVolume: 0.25, cueTone: 'NONE', colorScheme: 'ICE_AURA' },
                matrix: { enabled: true, composerWarp: 'BACH', composerIntensity: 0.5 },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'FIBONACCI' },
                pulse: { enabled: true, pulseStyle: 'BLACK_SHUTTER', depth: 0.1 }
            },
            // Cognitive Refresh & Anchor (300s = 5 min)
            {
                id: 'flow_ch3',
                label: 'Phase 3: Cognitive Integration',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 30, label: 'Integration Harmony' },
                soundType: 'CHORD',
                chord: { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 300,
                glideSeconds: 4.0,
                description: 'Bright uplifting chord resolution preventing post-focus cognitive fatigue, sealing memory consolidation.',
                entrainment: { enabled: true, frequencyHz: 12.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'JOY', intensity: 0.4 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 68, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.2, cueTone: 'CELLO', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.3 }
            }
        ]
    },

    // 5. VAGUS NERVE RESET & SOMATIC SAFETY (18 min Clinical De-escalation Arc)
    {
        id: 'exp_vagus_reset',
        name: 'Vagus Nerve Reset & Somatic Safety',
        description: 'An 18-minute polyvagal-informed de-escalation suite. Releases sympathetic lock, restores heart-rate variability resonance, and activates ventral vagal autonomic safety.',
        category: 'AUTONOMIC REPAIR',
        pitchRef: 432.0,
        temperament: 'JUST_INTONATION',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // Chapter 1: Safe Harbor (240s = 4 min)
            {
                id: 'vag_ch1',
                label: 'Chapter 1: Safe Harbor',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, cycles: 20, label: 'Somatic Safety (4-2-6)' },
                soundType: 'PURE_TONE',
                pureToneHz: 174.0, // Solfeggio 174Hz physical security & somatic anaesthesia
                breathPhase: 'FREE_FLOW',
                durationSeconds: 240,
                glideSeconds: 4.0,
                description: 'Low-volume 174Hz pain and muscular tension relief tone, gentle ocean floor acoustics signaling primal safety to the nervous system.',
                entrainment: { enabled: true, frequencyHz: 8.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.35, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 58, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.35, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.25 }
            },
            // Chapter 2: Parasympathetic Down-Regulation (360s = 6 min)
            {
                id: 'vag_ch2',
                label: 'Chapter 2: Down-Regulation',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 8, holdOut: 2, cycles: 22, label: 'Vagus Down-Regulation' },
                soundType: 'CHORD',
                chord: { name: 'Ebmaj9', root: 'Eb', type: 'maj9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 360,
                glideSeconds: 6.0,
                description: 'Deep resonant major ninth chords, 6Hz theta wave, and prolonged sighing breath cues activating the ventral vagal brake.',
                entrainment: { enabled: true, frequencyHz: 6.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'COMPASSION', intensity: 0.6, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 54, volume: 0.2, doubleBeat: true },
                breath: { enabled: true, noiseType: 'CAVE', noiseVolume: 0.25, cueTone: 'CELLO', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'EMERALD_PULSE', depth: 0.3 }
            },
            // Chapter 3: Autonomic Stillness (300s = 5 min)
            {
                id: 'vag_ch3',
                label: 'Chapter 3: Autonomic Stillness',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 7, exhale: 8, holdOut: 1, cycles: 15, label: '4-7-8 Deep Parasympathetic' },
                soundType: 'TONE_STACK',
                toneStack: [136.10, 272.20], // Earth Year Cosmic Om octave
                breathPhase: 'FREE_FLOW',
                durationSeconds: 300,
                glideSeconds: 8.0,
                description: 'Sacred Om frequency fundamental with 4.5Hz Theta brainwave target, zero visual strobe (dark velvet mode), complete somatic quietude.',
                entrainment: { enabled: true, frequencyHz: 4.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.5 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 50, volume: 0.15, doubleBeat: false },
                breath: { enabled: true, noiseType: 'SILENCE', noiseVolume: 0.0, cueTone: 'OM' },
                pulse: { enabled: true, pulseStyle: 'BLACK_SHUTTER', depth: 0.1 }
            },
            // Chapter 4: Gentle Return to Equilibrium (180s = 3 min)
            {
                id: 'vag_ch4',
                label: 'Chapter 4: Gentle Equilibrium',
                
                breathPattern: { mode: 'PACED', inhale: 5, holdIn: 0, exhale: 5, holdOut: 0, cycles: 18, label: 'Equilibrium Respiration' },
                soundType: 'CHORD',
                chord: { name: 'Bbmaj7', root: 'Bb', type: 'maj7', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 180,
                glideSeconds: 4.0,
                description: 'Harmonic return to baseline emotional resilience with healthy heart rate variability and renewed vitality.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'LOVE', intensity: 0.4 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.2, cueTone: 'TIBETAN', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.25 }
            }
        ]
    },

    // 6. CHAKRA ASCENT & DESCENT (13-Phase Kundalini Harmonic Journey)
    {
        id: 'exp_chakra_journey',
        name: 'Kundalini Chakra Ascent & Descent',
        description: 'A 13-phase psychoacoustic journey traversing upward through the 7 biofield energy centers to the Crown summit, followed by a grounded 6-phase descent back to the Root.',
        category: 'SOMATIC TRANSFORMATION',
        pitchRef: 432.0,
        temperament: 'JUST_INTONATION',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // --- ASCENT (Phases 1 to 7) ---
            {
                id: 'chk_asc_1',
                label: 'Phase 1: Root Ascent (Muladhara)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 1, exhale: 5, holdOut: 0, cycles: 12, label: 'Root Kundalini Breath' },
                soundType: 'PURE_TONE',
                pureToneHz: 396.0, // Muladhara Root Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: '396Hz grounding vibration, 7.83Hz Schumann resonance, deep red somatic stability and physical grounding.',
                entrainment: { enabled: true, frequencyHz: 7.83, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.4 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'TIBETAN', colorScheme: 'ROSE_WARM' },
                pulse: { enabled: true, pulseStyle: 'ROSE_RADIANCE', depth: 0.45 }
            },
            {
                id: 'chk_asc_2',
                label: 'Phase 2: Sacral Ascent (Svadhisthana)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 1, exhale: 5, holdOut: 0, cycles: 12, label: 'Sacral Fluid Flow' },
                soundType: 'PURE_TONE',
                pureToneHz: 417.0, // Sacral Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: '417Hz change & creative flow, 8.5Hz Alpha wave, warm amber photic radiance activating fluid emotional energy.',
                entrainment: { enabled: true, frequencyHz: 8.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'INTEREST', intensity: 0.45, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 64, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.3, cueTone: 'HARP', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.45 }
            },
            {
                id: 'chk_asc_3',
                label: 'Phase 3: Solar Plexus Ascent (Manipura)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 12, label: 'Manipura Fire Breath' },
                soundType: 'PURE_TONE',
                pureToneHz: 528.0, // Solar Plexus transformation
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: '528Hz personal power & willpower, 10Hz Alpha peak, golden solar acoustic warmth.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'COURAGE', intensity: 0.6, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 68, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'FIRE', noiseVolume: 0.25, cueTone: 'TRIANGLE', colorScheme: 'SUNSET_BLOOM' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.55 }
            },
            {
                id: 'chk_asc_4',
                label: 'Phase 4: Heart Ascent (Anahata)',
                
                breathPattern: { mode: 'PACED', inhale: 5, holdIn: 2, exhale: 6, holdOut: 2, cycles: 10, label: 'Heart Anahata Coherence' },
                soundType: 'PURE_TONE',
                pureToneHz: 639.0, // Heart Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 150,
                glideSeconds: 5.0,
                description: '639Hz relational connection & compassion, 10.5Hz coherent Alpha, deep emerald heart pulse resonance.',
                entrainment: { enabled: true, frequencyHz: 10.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'LOVE', intensity: 0.7, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'CELLO', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'EMERALD_PULSE', depth: 0.5 }
            },
            {
                id: 'chk_asc_5',
                label: 'Phase 5: Throat Ascent (Vishuddha)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 12, label: 'Vishuddha Resonance' },
                soundType: 'PURE_TONE',
                pureToneHz: 741.0, // Throat Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: '741Hz expression and truth, 12Hz high-Alpha clarity, radiant turquoise acoustic bloom.',
                entrainment: { enabled: true, frequencyHz: 12.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.55 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 64, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'WIND', noiseVolume: 0.25, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.45 }
            },
            {
                id: 'chk_asc_6',
                label: 'Phase 6: Third Eye Ascent (Ajna)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 4, exhale: 4, holdOut: 0, cycles: 10, label: 'Ajna Triangle Sync' },
                soundType: 'PURE_TONE',
                pureToneHz: 852.0, // Third Eye Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: '852Hz intuitive clarity & spiritual vision, 6Hz Theta entrainment, deep indigo-violet resonance.',
                entrainment: { enabled: true, frequencyHz: 6.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'AWE', intensity: 0.75, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.2, doubleBeat: true },
                breath: { enabled: true, noiseType: 'CAVE', noiseVolume: 0.2, cueTone: 'WOOD', colorScheme: 'AMETHYST_COSMOS' },
                pulse: { enabled: true, pulseStyle: 'AMETHYST_PULSE', depth: 0.5 }
            },
            {
                id: 'chk_asc_7',
                label: 'Phase 7: Crown Summit (Sahasrara)',
                
                breathPattern: { mode: 'PACED', inhale: 5, holdIn: 5, exhale: 5, holdOut: 3, cycles: 10, label: 'Sahasrara Stillness' },
                soundType: 'PURE_TONE',
                pureToneHz: 963.0, // Crown Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 180,
                glideSeconds: 6.0,
                description: '963Hz pineal pure consciousness, 40Hz Gamma synchrony, pristine white-violet illumination at the summit of awareness.',
                entrainment: { enabled: true, frequencyHz: 40.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.85 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 58, volume: 0.2, doubleBeat: false },
                breath: { enabled: true, noiseType: 'PINK', noiseVolume: 0.15, cueTone: 'OM', colorScheme: 'ICE_AURA' },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'FIBONACCI' },
                pulse: { enabled: true, pulseStyle: 'WHITE_BLOOM', depth: 0.7 }
            },

            // --- DESCENT (Phases 8 to 13) ---
            {
                id: 'chk_dsc_8',
                label: 'Phase 8: Third Eye Descent (Ajna)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Ajna Light Descent' },
                soundType: 'PURE_TONE',
                pureToneHz: 852.0,
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 5.0,
                description: 'Descending integration: anchoring transcendent vision back through the Ajna center with 7Hz gentle Theta.',
                entrainment: { enabled: true, frequencyHz: 7.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.65 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.22, doubleBeat: true },
                breath: { enabled: true, noiseType: 'CAVE', noiseVolume: 0.2, cueTone: 'WOOD', colorScheme: 'AMETHYST_COSMOS' },
                pulse: { enabled: true, pulseStyle: 'AMETHYST_PULSE', depth: 0.45 }
            },
            {
                id: 'chk_dsc_9',
                label: 'Phase 9: Throat Descent (Vishuddha)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Vishuddha Cool Nectar' },
                soundType: 'PURE_TONE',
                pureToneHz: 741.0,
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Translating intuitive insight into embodied authentic voice and communication.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.5 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'WIND', noiseVolume: 0.2, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.4 }
            },
            {
                id: 'chk_dsc_10',
                label: 'Phase 10: Heart Integration (Anahata)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, cycles: 10, label: 'Heart Emerald Integration' },
                soundType: 'PURE_TONE',
                pureToneHz: 639.0,
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: 'Receiving spiritual awareness into the somatic heart space with 10Hz Alpha coherence and expansive love.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'LOVE', intensity: 0.7, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.25, cueTone: 'CELLO', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'EMERALD_PULSE', depth: 0.45 }
            },
            {
                id: 'chk_dsc_11',
                label: 'Phase 11: Solar Plexus Grounding (Manipura)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Solar Grounding' },
                soundType: 'PURE_TONE',
                pureToneHz: 528.0,
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Grounding high consciousness into bodily vitality, core resilience, and stable life force.',
                entrainment: { enabled: true, frequencyHz: 9.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'COURAGE', intensity: 0.55 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 64, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.25, cueTone: 'TRIANGLE', colorScheme: 'SUNSET_BLOOM' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.4 }
            },
            {
                id: 'chk_dsc_12',
                label: 'Phase 12: Sacral Grounding (Svadhisthana)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Sacral Calm Stream' },
                soundType: 'PURE_TONE',
                pureToneHz: 417.0,
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Re-harmonizing emotional and physical instincts into calm creative equilibrium.',
                entrainment: { enabled: true, frequencyHz: 8.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.5 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'RAIN', noiseVolume: 0.25, cueTone: 'HARP', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.4 }
            },
            {
                id: 'chk_dsc_13',
                label: 'Phase 13: Earth Root Completion (Muladhara)',
                
                breathPattern: { mode: 'PACED', inhale: 5, holdIn: 2, exhale: 6, holdOut: 2, cycles: 10, label: 'Root Earth Completion' },
                soundType: 'PURE_TONE',
                pureToneHz: 396.0,
                breathPhase: 'FREE_FLOW',
                durationSeconds: 150,
                glideSeconds: 5.0,
                description: 'Full earth re-grounding at 396Hz with 7.83Hz Schumann resonance. Integration complete, anchored, and awake.',
                entrainment: { enabled: true, frequencyHz: 7.83, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.6 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'TIBETAN', colorScheme: 'ROSE_WARM' },
                pulse: { enabled: true, pulseStyle: 'ROSE_RADIANCE', depth: 0.35 }
            }
        ]
    },

    // 7. MANTAK CHIA MICROCOSMIC ORBIT (14-Phase Taoist Neidan Circulation)
    {
        id: 'exp_microcosmic_orbit',
        name: 'Microcosmic Orbit (Xiao Zhou Tian)',
        description: 'A 14-phase Taoist internal alchemy transmission grounded in Master Mantak Chia’s classical methodology: organ smiling, Jing activation, 3-gate spinal ascent, Magpie Bridge circuit completion, cooling Yin cascade, and pearl storage at the navel.',
        category: 'SOMATIC TRANSFORMATION',
        pitchRef: 432.0,
        temperament: 'JUST_INTONATION',
        loopMode: 'CYCLE_COUNT',
        targetCycles: 1,
        blocks: [
            // Phase 1: The Inner Smile & Lower Cauldron Warming (Shenque)
            {
                id: 'mco_ph1',
                label: 'Phase 1: Inner Smile & Navel Warming (Shenque)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 12, label: 'Inner Smile Navel Warming' },
                soundType: 'PURE_TONE',
                pureToneHz: 194.18, // Earth Day G fundamental
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 4.0,
                description: 'Smiling into heart and organs, settling fire downward. Warming the Lower Dantian cauldron in 194.18Hz Earth Yin resonance.',
                entrainment: { enabled: true, frequencyHz: 7.83, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.4 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'SINE_BELL', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.4 }
            },
            // Phase 2: Sexual Essence & Ovarian/Sperm Palace (Guanyuan)
            {
                id: 'mco_ph2',
                label: 'Phase 2: Jing Activation (Guanyuan)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 1, exhale: 4, holdOut: 1, cycles: 9, label: 'Jing Essence Activation' },
                soundType: 'PURE_TONE',
                pureToneHz: 210.42, // Synodic Moon / sacral fluid resonance
                breathPhase: 'FREE_FLOW',
                durationSeconds: 90,
                glideSeconds: 4.0,
                description: 'Drawing attention down to the sexual palace 3 inches below the navel, transmuting dense Jing into mobile subtle Qi.',
                entrainment: { enabled: true, frequencyHz: 8.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'INTEREST', intensity: 0.45, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.25, cueTone: 'HARP', colorScheme: 'ROSE_WARM' },
                pulse: { enabled: true, pulseStyle: 'ROSE_RADIANCE', depth: 0.45 }
            },
            // Phase 3: The Pelvic Floor Lock & Root Gate (Huiyin)
            {
                id: 'mco_ph3',
                label: 'Phase 3: Pelvic Floor Pump (Huiyin)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 9, label: 'Huiyin Pelvic Floor Pump' },
                soundType: 'PURE_TONE',
                pureToneHz: 136.10, // Cosmic Om earth fundamental
                breathPhase: 'FREE_FLOW',
                durationSeconds: 90,
                glideSeconds: 4.0,
                description: 'Subtle perineal engagement. Closing the Huiyin gate to seal life-force from leaking downward.',
                entrainment: { enabled: true, frequencyHz: 8.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.5 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 58, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'CAVE', noiseVolume: 0.25, cueTone: 'WOOD', colorScheme: 'ICE_AURA' },
                pulse: { enabled: true, pulseStyle: 'BLACK_SHUTTER', depth: 0.2 }
            },
            // Phase 4: First Gate — Tailbone / Sacral Pump (Wei-Lu / Changqiang)
            {
                id: 'mco_ph4',
                label: 'Phase 4: 1st Gate — Sacral Pump (Wei-Lu)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Wei-Lu 1st Gate Ascent' },
                soundType: 'TONE_STACK',
                toneStack: [105.21, 210.42], // Sacral fluid harmonics
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Activating the coccyx pump. Tilting the pelvis slightly to open the first spinal gateway and drive Qi upward.',
                entrainment: { enabled: true, frequencyHz: 9.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'COURAGE', intensity: 0.55, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 64, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'WIND', noiseVolume: 0.3, cueTone: 'TRIANGLE', colorScheme: 'SUNSET_BLOOM' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.5 }
            },
            // Phase 5: Door of Life & Kidney Furnace (Mingmen)
            {
                id: 'mco_ph5',
                label: 'Phase 5: Door of Life (Mingmen)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Mingmen Door of Life' },
                soundType: 'PURE_TONE',
                pureToneHz: 174.0, // Adrenal tension relief fundamental
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Warming Mingmen between L2/L3 opposite navel. Nourishing adrenal vitality and opening lower back warmth.',
                entrainment: { enabled: true, frequencyHz: 9.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.5 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'FIRE', noiseVolume: 0.25, cueTone: 'CELLO', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.45 }
            },
            // Phase 6: Second Gate — Mid-Spine Wings (Jiaji / T5-T6)
            {
                id: 'mco_ph6',
                label: 'Phase 6: 2nd Gate — Wing Pump (Jiaji)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Jiaji 2nd Gate Pump' },
                soundType: 'CHORD',
                chord: { name: 'Dmaj7', root: 'D', type: 'maj7', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Pumping Qi between the shoulder blades opposite the heart. Uncoiling chest armor and releasing dorsal constriction.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'LOVE', intensity: 0.65, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 66, volume: 0.35, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'HARP', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'EMERALD_PULSE', depth: 0.5 }
            },
            // Phase 7: Yang Nexus at Cervical C7 (Dazhui)
            {
                id: 'mco_ph7',
                label: 'Phase 7: Great Vertebra C7 (Dazhui)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 9, label: 'Dazhui Great Vertebra' },
                soundType: 'PURE_TONE',
                pureToneHz: 256.0, // Scientific C harmonic
                breathPhase: 'FREE_FLOW',
                durationSeconds: 90,
                glideSeconds: 4.0,
                description: 'Meeting point of all Yang meridians at the base of neck. Clearing neck tension to permit unobstructed flow to the head.',
                entrainment: { enabled: true, frequencyHz: 10.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'COURAGE', intensity: 0.6 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 65, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'PINK', noiseVolume: 0.2, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.45 }
            },
            // Phase 8: Third Gate — Jade Pillow Cranial Pump (Yuzhen)
            {
                id: 'mco_ph8',
                label: 'Phase 8: 3rd Gate — Jade Pillow (Yuzhen)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 10, label: 'Yuzhen Jade Pillow Gate' },
                soundType: 'PURE_TONE',
                pureToneHz: 288.0, // D9 harmonic overtone
                breathPhase: 'FREE_FLOW',
                durationSeconds: 100,
                glideSeconds: 4.0,
                description: 'Tucking chin slightly to open the occipital cranial pump. Rhythmic fluid propulsion into the brain chamber.',
                entrainment: { enabled: true, frequencyHz: 11.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'INTEREST', intensity: 0.55 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 62, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'CAVE', noiseVolume: 0.2, cueTone: 'WOOD', colorScheme: 'AMETHYST_COSMOS' },
                pulse: { enabled: true, pulseStyle: 'AMETHYST_PULSE', depth: 0.4 }
            },
            // Phase 9: Crown Summit — Hundred Meetings (Baihui)
            {
                id: 'mco_ph9',
                label: 'Phase 9: Crown Summit (Baihui)',
                
                breathPattern: { mode: 'PACED', inhale: 5, holdIn: 2, exhale: 5, holdOut: 0, cycles: 10, label: 'Baihui Crown Illumination' },
                soundType: 'PURE_TONE',
                pureToneHz: 963.0, // Crown Solfeggio
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 5.0,
                description: 'Culmination of Yang ascent at the apex of skull. Connecting with celestial violet-white light and pineal awakening.',
                entrainment: { enabled: true, frequencyHz: 40.0, layers: ['binaural', 'isochronic'] },
                sentics: { enabled: true, emotion: 'AWE', intensity: 0.8 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 58, volume: 0.2, doubleBeat: false },
                breath: { enabled: true, noiseType: 'PINK', noiseVolume: 0.15, cueTone: 'OM', colorScheme: 'ICE_AURA' },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'FIBONACCI' },
                pulse: { enabled: true, pulseStyle: 'WHITE_BLOOM', depth: 0.65 }
            },
            // Phase 10: The Magpie Bridge — Tongue to Palate (Yintang / Palate)
            {
                id: 'mco_ph10',
                label: 'Phase 10: The Magpie Bridge (Tongue to Palate)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 9, label: 'Magpie Bridge Circuit' },
                soundType: 'CHORD',
                chord: { name: 'Emaj9', root: 'E', type: 'maj9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 90,
                glideSeconds: 4.0,
                description: 'Tongue firmly resting on upper palate behind front teeth, closing the circuit. Downward flow of sweet cooling saliva/nectar.',
                entrainment: { enabled: true, frequencyHz: 12.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'REVERENCE', intensity: 0.6, tideAM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'RAIN', noiseVolume: 0.2, cueTone: 'TIBETAN', colorScheme: 'AMETHYST_COSMOS' },
                pulse: { enabled: true, pulseStyle: 'AMETHYST_PULSE', depth: 0.4 }
            },
            // Phase 11: Throat Center & Heavenly Chimney (Tiantu)
            {
                id: 'mco_ph11',
                label: 'Phase 11: Throat Center (Tiantu)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 9, label: 'Tiantu Throat Cool Descent' },
                soundType: 'PURE_TONE',
                pureToneHz: 384.0, // Pythagorean G fifth
                breathPhase: 'FREE_FLOW',
                durationSeconds: 90,
                glideSeconds: 4.0,
                description: 'Cooling Yin stream descending through the throat. Swallowing nectar, lubricating thyroid and metabolic pathways.',
                entrainment: { enabled: true, frequencyHz: 9.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.5 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.25, cueTone: 'SINE_BELL', colorScheme: 'CYAN_OCEAN' },
                pulse: { enabled: true, pulseStyle: 'CYAN_AURA', depth: 0.35 }
            },
            // Phase 12: Heart Center & Kan-Li Alchemy (Tanzhong)
            {
                id: 'mco_ph12',
                label: 'Phase 12: Heart Ocean (Tanzhong)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0, cycles: 10, label: 'Tanzhong Heart Ocean' },
                soundType: 'CHORD',
                chord: { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 },
                breathPhase: 'FREE_FLOW',
                durationSeconds: 120,
                glideSeconds: 5.0,
                description: 'Cooling descending Yin waters soothe heart fire. Establishing Kan & Li harmonic equilibrium in the middle cauldron.',
                entrainment: { enabled: true, frequencyHz: 10.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'LOVE', intensity: 0.75, tideAM: true, tideFM: true },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 58, volume: 0.3, doubleBeat: true },
                breath: { enabled: true, noiseType: 'OCEAN', noiseVolume: 0.3, cueTone: 'CELLO', colorScheme: 'EMERALD_ZEN' },
                pulse: { enabled: true, pulseStyle: 'EMERALD_PULSE', depth: 0.45 }
            },
            // Phase 13: Solar Plexus & Stomach Valley (Zhongwan)
            {
                id: 'mco_ph13',
                label: 'Phase 13: Solar Valley (Zhongwan)',
                
                breathPattern: { mode: 'PACED', inhale: 4, holdIn: 2, exhale: 4, holdOut: 0, cycles: 9, label: 'Zhongwan Solar Valley' },
                soundType: 'PURE_TONE',
                pureToneHz: 261.63, // Middle C organic grounding
                breathPhase: 'FREE_FLOW',
                durationSeconds: 90,
                glideSeconds: 4.0,
                description: 'Fluid descent past the solar plexus and diaphragm. Smoothing digestion and relaxing somatic gut tension.',
                entrainment: { enabled: true, frequencyHz: 8.0, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.45 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 60, volume: 0.25, doubleBeat: true },
                breath: { enabled: true, noiseType: 'STREAM', noiseVolume: 0.25, cueTone: 'WOOD', colorScheme: 'SOLAR_AMBER' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.35 }
            },
            // Phase 14: Spiraling & Condensing the Pearl into the Lower Dantian
            {
                id: 'mco_ph14',
                label: 'Phase 14: Pearl Storage at Navel (Shenque)',
                
                breathPattern: { mode: 'PACED', inhale: 5, holdIn: 2, exhale: 6, holdOut: 2, cycles: 12, label: 'Pearl Storage at Navel' },
                soundType: 'TONE_STACK',
                toneStack: [108.0, 194.18], // Sacred fundamental & Earth Day foundation
                breathPhase: 'FREE_FLOW',
                durationSeconds: 180,
                glideSeconds: 6.0,
                description: 'Mantak Chia closing seal: Spiraling energy 36 times outward from navel, then 24 times inward. Condensing refined Qi into a warm golden pearl behind the navel.',
                entrainment: { enabled: true, frequencyHz: 4.5, layers: ['binaural'] },
                sentics: { enabled: true, emotion: 'SERENITY', intensity: 0.7 },
                heart: { enabled: true, syncMode: 'STEADY', bpm: 56, volume: 0.3, doubleBeat: false },
                breath: { enabled: true, noiseType: 'SILENCE', noiseVolume: 0.0, cueTone: 'OM' },
                matrix: { enabled: true, composerWarp: 'BACH', composerIntensity: 0.4 },
                crystal: { enabled: true, isTimeCrystal: true, topology: 'FIBONACCI' },
                pulse: { enabled: true, pulseStyle: 'AMBER_WARM', depth: 0.3 }
            }
        ]
    }
];
