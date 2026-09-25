import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Activity, 
  Clock, 
  Sliders, 
  Wind, 
  Volume2, 
  X, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Pause,
  Ear,
  Layers,
  Sparkles,
  Info,
  Flame,
  Feather,
  Compass,
  Headphones,
  Trees,
  Waves,
  Music,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { 
  PolyvagalConfig, 
  PolyvagalTier, 
  AutonomicPathway, 
  AcousticSanctuary, 
  PolyvagalRecoveryPreset 
} from '../../services/audio/AudioTypes';
import { 
  globalPolyvagalTelemetry, 
  POLYVAGAL_PRESETS, 
  SOMATIC_PROMPTS 
} from '../../services/audio/PolyvagalSynth';
import { Fader } from '../ui/Faders';

type PolyvagalModalTab = 'presets' | 'pathways' | 'shaping' | 'bilateral' | 'humming' | 'sanctuary';

interface PolyvagalModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PolyvagalConfig;
  onUpdateConfig: (updates: Partial<PolyvagalConfig>) => void;
  onResetSession: (durationSec?: number) => void;
  isAudioEnabled: boolean;
  onEnableAudio: () => void;
  uiConfig?: Record<string, unknown>;
}

export const PolyvagalModal: React.FC<PolyvagalModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetSession,
  isAudioEnabled,
  onEnableAudio,
  uiConfig
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [telemetry, setTelemetry] = useState(globalPolyvagalTelemetry);
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<PolyvagalModalTab>('presets');

  // High-performance 30fps telemetry polling & canvas oscilloscope rendering
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    let frameCount = 0;

    const renderWave = () => {
      frameCount++;
      // Update telemetry state every 2 frames (~30Hz) for snappy UI responsiveness
      if (frameCount % 2 === 0) {
        setTelemetry({ ...globalPolyvagalTelemetry });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          // Dark acoustic gradient background
          const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
          bgGrad.addColorStop(0, 'rgba(8, 15, 26, 0.95)');
          bgGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
          bgGrad.addColorStop(1, 'rgba(8, 15, 26, 0.95)');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          // Grid guide lines (1,000Hz to 4,000Hz safe vocal zone representation)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          for (let i = 1; i < 4; i++) {
            const x = (width / 4) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }

          // Safety band highlight [1,000 Hz to 4,000 Hz]
          ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
          ctx.fillRect(width * 0.15, 0, width * 0.7, height);

          if (config.enabled && !config.isEmergencyGrounded) {
            const time = performance.now() / 1000;
            const formants = globalPolyvagalTelemetry.formantFrequencies;
            const tension = globalPolyvagalTelemetry.stapediusTensionLevel;
            const isDecomp = globalPolyvagalTelemetry.intervalPhase === 'DECOMPRESSION';
            const pan = globalPolyvagalTelemetry.bilateralPanPosition || 0;

            // Draw real-time acoustic vocal formant resonant spectrum
            ctx.beginPath();
            ctx.moveTo(0, height / 2);

            const numPoints = 120;
            for (let i = 0; i <= numPoints; i++) {
              const xNorm = i / numPoints;
              const px = xNorm * width;

              // Combined formant wave function
              let yDisp = 0;
              for (let fIdx = 0; fIdx < formants.length; fIdx++) {
                const freq = formants[fIdx];
                const speed = freq * 0.002;
                const amp = (height * 0.18) * (fIdx === 0 ? 0.9 : (fIdx === 1 ? 0.7 : 0.5));
                const modulationScale = isDecomp ? 0.25 : (0.4 + tension * 0.6);
                yDisp += Math.sin(xNorm * Math.PI * (fIdx + 2) * 2 + time * speed) * amp * modulationScale * (config.formantVolume ?? 0.45);
              }

              // Apply bilateral pan skew to the visual wave
              const panOffset = (xNorm - 0.5) * pan * (height * 0.15);
              const py = (height / 2) + Math.max(-height * 0.42, Math.min(height * 0.42, yDisp + panOffset));
              if (i === 0) {
                ctx.moveTo(px, py);
              } else {
                ctx.lineTo(px, py);
              }
            }

            // Glowing wave stroke (emerald in active, cyan in decompression, violet when bilateral)
            ctx.shadowBlur = 10;
            ctx.shadowColor = isDecomp ? '#38bdf8' : (config.bilateralPanning ? '#a855f7' : '#10b981');
            ctx.strokeStyle = isDecomp ? '#38bdf8' : (config.bilateralPanning ? '#c084fc' : '#34d399');
            ctx.lineWidth = 2.2;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Secondary ghost harmonic trace
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            for (let i = 0; i <= numPoints; i++) {
              const xNorm = i / numPoints;
              const px = xNorm * width;
              const yDisp = Math.cos(xNorm * Math.PI * 6 - time * 2.5) * (height * 0.1) * (isDecomp ? 0.1 : tension);
              ctx.lineTo(px, (height / 2) + yDisp);
            }
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            // Idle flatline with soft ripple
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, config.enabled, config.isEmergencyGrounded, config.formantVolume, config.bilateralPanning]);

  if (!isOpen) return null;

  const tierDefaultDuration = config.tier === 1 ? 300 : (config.tier === 3 ? 900 : 600);
  const targetDuration = config.sessionDurationSec || tierDefaultDuration;
  const isRunning = !!(config.enabled && !config.isEmergencyGrounded);
  const displaySecs = isRunning 
    ? (telemetry.sessionRemainingSec !== undefined ? telemetry.sessionRemainingSec : targetDuration)
    : targetDuration;
  const remainingMins = Math.floor(displaySecs / 60);
  const remainingSecs = displaySecs % 60;
  const isDecompression = telemetry.intervalPhase === 'DECOMPRESSION';

  const handleToggleActive = () => {
    if (!isAudioEnabled) {
      onEnableAudio();
    }
    const nextEnabled = !config.enabled;
    const duration = config.sessionDurationSec || (config.tier === 1 ? 300 : config.tier === 3 ? 900 : 600);
    onUpdateConfig({ 
      enabled: nextEnabled,
      isEmergencyGrounded: false,
      sessionDurationSec: duration
    });
    if (nextEnabled) {
      onResetSession(duration);
    }
  };

  const handleSelectTier = (tier: PolyvagalTier) => {
    const duration = tier === 1 ? 300 : (tier === 3 ? 900 : 600);
    onUpdateConfig({ 
      tier,
      sessionDurationSec: duration 
    });
    onResetSession(duration);
  };

  const handleSelectPreset = (presetKey: PolyvagalRecoveryPreset) => {
    if (!isAudioEnabled) {
      onEnableAudio();
    }
    const preset = POLYVAGAL_PRESETS[presetKey];
    if (preset) {
      onUpdateConfig({
        ...preset,
        activePreset: presetKey,
        enabled: true,
        isEmergencyGrounded: false
      });
      if (preset.sessionDurationSec) {
        onResetSession(preset.sessionDurationSec);
      }
    }
  };

  const handleEmergencyGrounding = () => {
    onUpdateConfig({
      isEmergencyGrounded: true,
      enabled: false
    });
  };

  const currentPathway = config.autonomicPathway || 'BALANCED';
  const currentSanctuary = config.acousticSanctuary || 'NONE';

  return (
    <>
      <div 
        className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-24px)] max-w-xl max-h-[92vh] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-[90] p-4 sm:p-5 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-white uppercase">Polyvagal Neuromodulation</h2>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Vocal Band
                </span>
                {config.activePreset && config.activePreset !== 'CUSTOM' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {config.activePreset.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Middle-Ear Stapedial Reflex & Social Engagement Priming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1.5 rounded-full transition-colors ${showInfo ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Clinical Polyvagal Guide"
              aria-label="Clinical Polyvagal Guide"
            >
              <Info size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Panel"
              aria-label="Close Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dedicated Engage Bar under the Polyvagal Menu Header */}
        <div 
          id="polyvagal-menu-engage-bar"
          className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 shadow-md shrink-0 ${
            config.enabled && !config.isEmergencyGrounded
              ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-emerald-950/70 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-black/50 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              config.enabled && !config.isEmergencyGrounded
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>
              {config.enabled && !config.isEmergencyGrounded ? (
                <Shield size={16} className="animate-pulse fill-current" />
              ) : (
                <Shield size={16} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Modulation Engine
                </span>
                {config.enabled && !config.isEmergencyGrounded ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-500/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Engaged
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                    Standby
                  </span>
                )}
              </div>
              <p className="text-[9px] text-slate-400 truncate">
                {config.enabled && !config.isEmergencyGrounded
                  ? 'Dynamic stapedius acoustic filtering actively toning Cranial Nerve VII & X'
                  : 'Click Engage to activate Middle-Ear acoustic vocal sweeps & vagal brake'}
              </p>
            </div>
          </div>

          <button
            id="polyvagal-menu-engage-toggle"
            onClick={handleToggleActive}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer shadow-sm active:scale-[0.97] ${
              config.enabled && !config.isEmergencyGrounded
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
            }`}
          >
            {config.enabled && !config.isEmergencyGrounded ? (
              <>
                <Pause size={13} className="fill-current" />
                <span>Engaged</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" />
                <span>Engage</span>
              </>
            )}
          </button>
        </div>

        {/* Somatic Micro-Prompt Banner */}
        {config.somaticPrompts !== false && telemetry.currentSomaticPrompt && (
          <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 text-[10px] animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                <Heart size={12} />
              </span>
              <div>
                <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-400 block font-mono">
                  {telemetry.currentSomaticTarget || 'Somatic Release Cue'}
                </span>
                <p className="text-slate-200 font-medium leading-snug">
                  {telemetry.currentSomaticPrompt}
                </p>
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ somaticPrompts: !config.somaticPrompts })}
              className="text-[8px] text-slate-500 hover:text-slate-300 shrink-0 uppercase tracking-wider"
              title="Toggle Somatic Micro-Prompts"
            >
              Hide
            </button>
          </div>
        )}

        {/* Clinical Info Drawer */}
        {showInfo && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2 text-[10px] text-slate-300 animate-in fade-in duration-150">
            <div className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} /> Middle-Ear Acoustic Conditioning Principles
            </div>
            <p className="leading-relaxed">
              Neurological safety cues travel through Cranial Nerve VII (Facial) and CN VIII (Vestibulocochlear), which innervate the <strong>stapedius muscle</strong> in the middle ear. By dynamically filtering audio to emphasize human vocal formants (1,000–4,000 Hz) and suppressing predatory sub-240Hz rumble, the auditory system is recalibrated from hypervigilance into ventral vagal social engagement without gutting musical chord roots.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px]">
              <div className="bg-black/30 p-2 rounded border border-white/5">
                <span className="text-emerald-400 block font-bold">Modulation Phase:</span> Dynamic vowel sweeps exercising the ossicular chain.
              </div>
              <div className="bg-black/30 p-2 rounded border border-white/5">
                <span className="text-cyan-400 block font-bold">Decompression:</span> Gentle unmodulated drone allowing stapedius relaxation.
              </div>
            </div>
          </div>
        )}

        {/* Real-time Oscilloscope & Acoustic Safety Band Wave */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-slate-400 px-1">
            <span className="flex items-center gap-1 font-bold">
              <Activity size={12} className="text-emerald-400" /> Formant Safety Spectrum (1,000 – 4,000 Hz)
            </span>
            <span className="font-mono text-emerald-300">
              {config.enabled && !config.isEmergencyGrounded ? (
                isDecompression ? 'AEROBIC DECOMPRESSION (REST)' : `${currentPathway.replace('_', ' ')} SWEEP`
              ) : (
                'INACTIVE / BYPASS'
              )}
            </span>
          </div>

          <div className="relative w-full h-20 rounded-xl overflow-hidden border border-emerald-500/30 shadow-inner bg-black/60">
            <canvas 
              ref={canvasRef} 
              width={480} 
              height={80} 
              className="w-full h-full block"
            />
            
            {/* Live Formant Frequency Overlay Pills */}
            <div className="absolute bottom-1.5 left-2 right-2 flex justify-between pointer-events-none">
              {telemetry.formantFrequencies.map((freq, idx) => (
                <div key={idx} className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs border border-white/10 text-[8px] font-mono font-bold text-emerald-300">
                  F{idx + 1}: {Math.round(freq)} Hz
                </div>
              ))}
            </div>

            {/* Emergency Grounding Watermark Overlay */}
            {config.isEmergencyGrounded && (
              <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex items-center justify-center p-3 text-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center justify-center gap-1">
                    <AlertTriangle size={14} className="text-red-400" /> Vagal E-Brake Grounded
                  </span>
                  <p className="text-[9px] text-slate-300">All auditory sweep frequencies silenced. Take 3 deep diaphragmatic breaths.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conditioning Cycle & Session Timer Bar */}
        <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock size={11} className="text-emerald-400" /> Reconditioning Cycle Phase
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${isDecompression ? 'text-cyan-300' : 'text-emerald-400'}`}>
                {isDecompression ? 'Decompress (Rest Drone)' : 'Modulation (Acoustic Sweep)'}
              </span>
              <span className="text-slate-500 font-mono">
                {remainingMins}:{remainingSecs < 10 ? `0${remainingSecs}` : remainingSecs}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-200 ${isDecompression ? 'bg-cyan-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.round(telemetry.cycleProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 text-[9px] uppercase font-bold tracking-wider">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={11} /> Presets
          </button>
          <button
            onClick={() => setActiveTab('pathways')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'pathways'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass size={11} /> Pathways
          </button>
          <button
            onClick={() => setActiveTab('shaping')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'shaping'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders size={11} /> Shaping
          </button>
          <button
            onClick={() => setActiveTab('bilateral')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'bilateral'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Headphones size={11} /> Bilateral Ear
          </button>
          <button
            onClick={() => setActiveTab('humming')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'humming'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wind size={11} /> Vagal Humming
          </button>
          <button
            onClick={() => setActiveTab('sanctuary')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'sanctuary'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trees size={11} /> Sanctuary
          </button>
        </div>

        {/* Tab 1: Recovery Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-slate-400 px-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles size={11} className="text-emerald-400" /> Quick-Access Clinical Recovery Presets
              </span>
              <span className="text-slate-500">One-Tap Configurations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { 
                  id: 'BALANCED_EQUILIBRIUM' as PolyvagalRecoveryPreset,
                  title: 'Balanced Equilibrium', 
                  time: '10 min', 
                  desc: 'Standard clinical Tier 2 conditioning with human vocal prosody and glottal warmth.',
                  tag: 'Baseline'
                },
                { 
                  id: 'SENSORY_OVERLOAD' as PolyvagalRecoveryPreset,
                  title: 'Sensory Overload', 
                  time: '10 min', 
                  desc: 'Sympathetic down-regulation: -12dB rumble cut, soft Q curves, forest canopy wind, gentle bilateral.',
                  tag: 'Overstimulated'
                },
                { 
                  id: 'POST_STRESS_DECOMPRESS' as PolyvagalRecoveryPreset,
                  title: 'Post-Stress Decompress', 
                  time: '5 min', 
                  desc: 'Express parasympathetic release with dynamic tidal wave wash and deep sigh aspiration.',
                  tag: 'Acute Stress'
                },
                { 
                  id: 'SLEEP_DRIFT' as PolyvagalRecoveryPreset,
                  title: 'Sleep Drift', 
                  time: '15 min', 
                  desc: 'Dorsal freeze re-grounding with slow rocking bilateral pacing and warm hearth embers.',
                  tag: 'Night / Rest'
                },
                { 
                  id: 'VOCAL_SOCIAL_PRIMING' as PolyvagalRecoveryPreset,
                  title: 'Vocal Social Priming', 
                  time: '5 min', 
                  desc: 'Ventral vagal activation with singer\'s formants boost, active prosody, and humming resonance guide.',
                  tag: 'Social Prep'
                },
              ].map(preset => {
                const isActive = config.activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          {isActive && <CheckCircle2 size={12} className="text-emerald-400" />}
                          {preset.title}
                        </span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                          {preset.time}
                        </span>
                      </div>
                      <p className="text-[8.5px] text-slate-400 leading-snug">
                        {preset.desc}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/5 flex justify-between items-center text-[7.5px] uppercase font-bold tracking-wider text-slate-500">
                      <span>{preset.tag}</span>
                      <span className="text-emerald-400">Load Preset →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Autonomic State-Targeted Pathways */}
        {activeTab === 'pathways' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-slate-400 px-1">
              <span className="font-bold flex items-center gap-1.5">
                <Compass size={11} className="text-emerald-400" /> Starting State Neuroception Pathway
              </span>
              <span className="text-emerald-300 font-mono font-bold">{currentPathway}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'BALANCED' as AutonomicPathway,
                  name: 'Balanced Equilibrium',
                  subtitle: 'Standard Autonomic Regulation',
                  desc: 'Standard 60-second clinical cycle (38s sweep, 6s rest, 8s crossfades) with balanced Q resonance.',
                  color: 'emerald'
                },
                {
                  id: 'SYMPATHETIC' as AutonomicPathway,
                  name: 'Sympathetic Down-Regulation',
                  subtitle: 'Fight or Flight Hyperarousal',
                  desc: 'Pillowy wide Q filters, -4dB high shelf damping, +3dB threat rumble cut, and extended 12s decompression.',
                  color: 'amber'
                },
                {
                  id: 'DORSAL' as AutonomicPathway,
                  name: 'Dorsal Freeze Re-Activation',
                  subtitle: 'Shutdown / Brain Fog / Numbness',
                  desc: 'Gentle upward formant lift on inhale with chest glottal warmth to safely coax nervous system out of collapse.',
                  color: 'cyan'
                },
                {
                  id: 'VENTRAL_PRIMING' as AutonomicPathway,
                  name: 'Ventral Social Priming',
                  subtitle: 'Social Readiness & Public Speaking',
                  desc: 'Crisp +1.5dB speech formants, +20% prosody lilt sensitivity, and brisk 50s cycle for vocal cord tonus.',
                  color: 'purple'
                }
              ].map(pathway => {
                const isSelected = currentPathway === pathway.id;
                return (
                  <button
                    key={pathway.id}
                    onClick={() => onUpdateConfig({ autonomicPathway: pathway.id, activePreset: 'CUSTOM' })}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-white shadow-sm'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10.5px] font-bold text-white flex items-center gap-1.5">
                        {isSelected && <CheckCircle2 size={12} className="text-emerald-400" />}
                        {pathway.name}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 block mb-1">{pathway.subtitle}</span>
                    <p className="text-[8px] text-slate-400 leading-snug">{pathway.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Shaping Parameters (Core & Nuance) */}
        {activeTab === 'shaping' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Titration Tier */}
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-slate-400">
                <span className="font-bold flex items-center gap-1.5">
                  <Layers size={11} className="text-emerald-400" /> Clinical Titration Tier
                </span>
                <span className="font-mono text-emerald-300 font-bold">
                  {String(remainingMins).padStart(2, '0')}:{String(remainingSecs).padStart(2, '0')} remaining
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { tier: 1 as PolyvagalTier, name: 'Tier 1: Acclimation', dur: '5m' },
                  { tier: 2 as PolyvagalTier, name: 'Tier 2: Conditioning', dur: '10m' },
                  { tier: 3 as PolyvagalTier, name: 'Tier 3: Toning', dur: '15m' },
                ].map(item => {
                  const isSelected = (config.tier || 2) === item.tier;
                  return (
                    <button
                      key={item.tier}
                      onClick={() => handleSelectTier(item.tier)}
                      className={`p-1.5 rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                          : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-white truncate">{item.name.split(':')[0]}</span>
                        <span className="text-[8px] font-mono text-emerald-400">{item.dur}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Faders */}
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl space-y-2.5">
              {/* Formant Resonance */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                  <span>Vocal Formant Resonance Accentuation</span>
                  <span className="text-emerald-300 font-mono">
                    +{((config.formantVolume ?? 0.5) * 8.5).toFixed(1)} dB peak
                  </span>
                </div>
                <Fader
                  value={config.formantVolume ?? 0.5}
                  min={0.05}
                  max={1}
                  step={0.02}
                  onChange={(v: number) => onUpdateConfig({ formantVolume: v, activePreset: 'CUSTOM' })}
                  color="#10b981"
                  uiConfig={uiConfig}
                />
              </div>

              {/* Sweep Depth */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                  <span>Stapedius Muscle Sweep Depth</span>
                  <span className="text-emerald-300 font-mono">
                    {Math.round((config.stapediusDepth ?? 0.6) * 100)}% (±{Math.round((config.stapediusDepth ?? 0.6) * 400)} Hz swing)
                  </span>
                </div>
                <Fader
                  value={config.stapediusDepth ?? 0.6}
                  min={0.05}
                  max={1}
                  step={0.02}
                  onChange={(v: number) => onUpdateConfig({ stapediusDepth: v, activePreset: 'CUSTOM' })}
                  color="#06b6d4"
                  uiConfig={uiConfig}
                />
              </div>

              {/* Threat Rumble Cut */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                  <span>Sub-240 Hz Threat Rumble Attenuation</span>
                  <span className="text-emerald-300 font-mono">
                    -{(3.0 + (config.threatRumbleCut ?? 0.5) * 8.0).toFixed(1)} dB
                  </span>
                </div>
                <Fader
                  value={config.threatRumbleCut ?? 0.5}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v: number) => onUpdateConfig({ threatRumbleCut: v, activePreset: 'CUSTOM' })}
                  color="#a855f7"
                  uiConfig={uiConfig}
                />
              </div>

              {/* Breath Sync */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Wind size={12} className="text-cyan-400" /> Entrain Sweep to Respiration Pacer
                </span>
                <button
                  onClick={() => onUpdateConfig({ breathLinked: !config.breathLinked, activePreset: 'CUSTOM' })}
                  className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase transition-colors ${
                    config.breathLinked
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {config.breathLinked ? 'Breath-Linked' : 'Autonomous Dual-Loop'}
                </button>
              </div>
            </div>

            {/* Vocal Nuance Toggles */}
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Sparkles size={10} /> Human Vocal Acoustic Nuance
                </span>
                <span className="text-[7px] text-slate-500 lowercase">cranial nerve vii / x</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onUpdateConfig({ vocalProsodyLilt: !config.vocalProsodyLilt, activePreset: 'CUSTOM' })}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    config.vocalProsodyLilt
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                      : 'bg-black/20 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-[8px] block uppercase">Prosody Lilt</span>
                  <span className="text-[7px] text-slate-500">{config.vocalProsodyLilt ? '±14c Active' : 'Off'}</span>
                </button>
                <button
                  onClick={() => onUpdateConfig({ laryngealWarmth: !config.laryngealWarmth, activePreset: 'CUSTOM' })}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    config.laryngealWarmth
                      ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                      : 'bg-black/20 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-[8px] block uppercase">Vocal Warmth</span>
                  <span className="text-[7px] text-slate-500">{config.laryngealWarmth ? '48% Glottal' : 'Off'}</span>
                </button>
                <button
                  onClick={() => onUpdateConfig({ aspirationShimmer: !config.aspirationShimmer, activePreset: 'CUSTOM' })}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    config.aspirationShimmer
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                      : 'bg-black/20 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-[8px] block uppercase">Aspiration</span>
                  <span className="text-[7px] text-slate-500">{config.aspirationShimmer ? '38% Whisper' : 'Off'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Bilateral Ear Conditioning */}
        {activeTab === 'bilateral' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Headphones size={13} className="text-purple-400" /> Bilateral Ear Conditioning
                  </span>
                  <p className="text-[8px] text-slate-400">
                    Slow Figure-8 stapedius acoustic panning stimulates alternating auditory pathways
                  </p>
                </div>
                <button
                  onClick={() => onUpdateConfig({ bilateralPanning: !config.bilateralPanning, activePreset: 'CUSTOM' })}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    config.bilateralPanning
                      ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {config.bilateralPanning ? 'Enabled' : 'Bypassed'}
                </button>
              </div>

              {/* Real-time Stereo Panning Indicator */}
              <div className="space-y-1 bg-black/60 p-2.5 rounded-xl border border-purple-500/20">
                <div className="flex justify-between text-[8px] font-mono text-purple-300 uppercase">
                  <span>Left Ear (L)</span>
                  <span className="font-bold">
                    {Math.abs(telemetry.bilateralPanPosition || 0) < 0.05 
                      ? 'CENTER' 
                      : (telemetry.bilateralPanPosition || 0) < 0 
                        ? `L ${Math.round(Math.abs(telemetry.bilateralPanPosition || 0) * 100)}%` 
                        : `R ${Math.round((telemetry.bilateralPanPosition || 0) * 100)}%`}
                  </span>
                  <span>Right Ear (R)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-900 border border-white/10 relative overflow-hidden flex items-center">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
                  {/* Moving Stapedius Panning Orb */}
                  <div 
                    className="absolute w-4 h-4 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] transition-all duration-75 -translate-x-1/2"
                    style={{ 
                      left: `${50 + (telemetry.bilateralPanPosition || 0) * 45}%` 
                    }}
                  />
                </div>
              </div>

              {/* Speed & Depth Faders */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                    <span>Figure-8 Alternation Speed</span>
                    <span className="text-purple-300 font-mono">
                      {(config.bilateralSpeed ?? 0.06).toFixed(2)} Hz (~{Math.round(1 / (config.bilateralSpeed ?? 0.06))}s sweep)
                    </span>
                  </div>
                  <Fader
                    value={config.bilateralSpeed ?? 0.06}
                    min={0.02}
                    max={0.12}
                    step={0.01}
                    onChange={(v: number) => onUpdateConfig({ bilateralSpeed: v, activePreset: 'CUSTOM' })}
                    color="#a855f7"
                    uiConfig={uiConfig}
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                    <span>Bilateral Width & Depth</span>
                    <span className="text-purple-300 font-mono">
                      {Math.round((config.bilateralDepth ?? 0.35) * 100)}%
                    </span>
                  </div>
                  <Fader
                    value={config.bilateralDepth ?? 0.35}
                    min={0.10}
                    max={0.70}
                    step={0.02}
                    onChange={(v: number) => onUpdateConfig({ bilateralDepth: v, activePreset: 'CUSTOM' })}
                    color="#a855f7"
                    uiConfig={uiConfig}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Somatic Vagal Humming Resonance Guide */}
        {activeTab === 'humming' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Wind size={13} className="text-cyan-400" /> Somatic Vagal Humming & Exhale Resonance
                  </span>
                  <p className="text-[8px] text-slate-400">
                    Vocal vibration on exhalation mechanically stimulates the laryngeal and thoracic vagus branches
                  </p>
                </div>
                <button
                  onClick={() => onUpdateConfig({ vagalHummingGuide: !config.vagalHummingGuide, activePreset: 'CUSTOM' })}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    config.vagalHummingGuide
                      ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {config.vagalHummingGuide ? 'Active' : 'Off'}
                </button>
              </div>

              {/* Intuitive Exhale Resonance Breath Prompter */}
              <div className={`p-3.5 rounded-xl border text-center transition-all ${
                telemetry.isExhalePhase
                  ? 'bg-cyan-950/60 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/40 border-white/5'
              }`}>
                <div className="text-[9px] uppercase tracking-wider font-mono text-cyan-300 font-bold mb-1">
                  {telemetry.isExhalePhase ? 'Vagal Activation Phase' : 'Gentle Inflow Phase'}
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  {telemetry.isExhalePhase 
                    ? 'EXHALE • SOFT COMFORTABLE CHEST HUM' 
                    : 'INHALE • EFFORTLESS THROUGH NOSE'}
                </div>
                <p className="text-[9px] text-slate-300 max-w-md mx-auto leading-relaxed">
                  {telemetry.isExhalePhase 
                    ? 'Hum gently with a soft "mmm" or "vooo" at whatever pitch feels natural in your chest. The internal mechanical vibration stimulates the vagal brake—no pitch matching required.' 
                    : 'Allow your belly, diaphragm, and throat to soften completely as calm air fills your lungs.'}
                </p>

                {telemetry.isExhalePhase && (
                  <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-3 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="w-1.5 h-5 rounded-full bg-cyan-300 animate-pulse" />
                    <span className="w-1.5 h-6 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="w-1.5 h-5 rounded-full bg-cyan-300 animate-pulse" />
                    <span className="w-1.5 h-3 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Somatic Benefits Card */}
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-1.5 text-[9px] text-slate-300">
                <div className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1 text-[9px]">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  Effortless Somatic Resonance (No Microphone or Pitch Matching Needed)
                </div>
                <p className="text-slate-400 leading-normal">
                  In polyvagal physiology, the therapeutic benefit of humming is tactile: internal vibration transmits through bone and tissue to cranial nerves X (Vagus) and VII (Facial), stimulating nitric oxide production in nasal cavities and slowing heart rate. Because your body creates the vibration internally, it works effortlessly regardless of musical root or key changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Acoustic Sanctuary Overlays */}
        {activeTab === 'sanctuary' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Trees size={13} className="text-emerald-400" /> Acoustic Sanctuary Environments
                </span>
                <p className="text-[8px] text-slate-400">
                  Organic background soundscape overlays that create an acoustic safe haven for the nervous system
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'NONE' as AcousticSanctuary,
                    name: 'Pure Harmonic Formants',
                    desc: 'Clean vocal sweeps with no background environmental texture.',
                    icon: Shield
                  },
                  {
                    id: 'FOREST' as AcousticSanctuary,
                    name: 'Sunlit Forest Canopy',
                    desc: 'Filtered high-canopy breeze rustle in the 2.1 kHz safe avian acoustic zone.',
                    icon: Trees
                  },
                  {
                    id: 'HEARTH' as AcousticSanctuary,
                    name: 'Warm Hearth Embers',
                    desc: 'Low-frequency soothing wood-fire warmth and gentle soft crackle.',
                    icon: Flame
                  },
                  {
                    id: 'SHORELINE' as AcousticSanctuary,
                    name: 'Tidal Shoreline Surf',
                    desc: 'Deep ocean swell gently entrained to the rhythmic respiratory wave.',
                    icon: Waves
                  }
                ].map(sanct => {
                  const isSelected = currentSanctuary === sanct.id;
                  const Icon = sanct.icon;
                  return (
                    <button
                      key={sanct.id}
                      onClick={() => onUpdateConfig({ acousticSanctuary: sanct.id, activePreset: 'CUSTOM' })}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-white shadow-sm'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[10px] text-white mb-1">
                        <Icon size={12} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                        <span>{sanct.name}</span>
                      </div>
                      <p className="text-[8px] text-slate-400 leading-snug">{sanct.desc}</p>
                    </button>
                  );
                })}
              </div>

              {currentSanctuary !== 'NONE' && (
                <div className="space-y-0.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-slate-400">
                    <span>Sanctuary Environment Volume</span>
                    <span className="text-emerald-300 font-mono">
                      {Math.round((config.sanctuaryVolume ?? 0.30) * 100)}%
                    </span>
                  </div>
                  <Fader
                    value={config.sanctuaryVolume ?? 0.30}
                    min={0.05}
                    max={1.0}
                    step={0.02}
                    onChange={(v: number) => onUpdateConfig({ sanctuaryVolume: v, activePreset: 'CUSTOM' })}
                    color="#10b981"
                    uiConfig={uiConfig}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Somatic Vagal Grounding Quick E-Brake & Session Reset */}
        <div className="flex items-center gap-2 pt-1 shrink-0">
          <button
            onClick={handleEmergencyGrounding}
            className="flex-1 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
            title="Immediately silence formant sweeping and reset nervous system"
          >
            <AlertTriangle size={13} className="text-red-400" /> One-Tap Vagal Grounding (E-Brake)
          </button>

          <button
            onClick={() => {
              onResetSession(config.sessionDurationSec || 600);
              onUpdateConfig({ isEmergencyGrounded: false });
            }}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            title="Restart Session Timer"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

      </div>
    </>
  );
};

