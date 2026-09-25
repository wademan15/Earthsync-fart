import React, { useState, useCallback } from 'react';
import { 
  Sliders, SlidersHorizontal, X, Wind, Music2, Heart, 
  Volume2, VolumeX, Bell, Play, Radio, RotateCcw, 
  Activity, Sparkles, Volume1, Waves, ArrowRightLeft, 
  ShieldCheck, ChevronDown, Shield
} from 'lucide-react';
import { Master12BandEq } from './Master12BandEq';
import { triggerHeartPulse } from '../../services/audio/HeartSynth';
import { DEFAULT_REVERB_PRESETS, ReverbPreset } from './designers/ReverbDesigner';

interface AudioMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  controller: any;
  onOpenBreathArchitect: () => void;
}

const CUE_TONE_PRESETS = [
  { id: 'SINE_BELL', name: 'Sine Bell' },
  { id: 'TIBETAN', name: 'Tibetan Chime' },
  { id: 'SINGING_BOWL', name: 'Singing Bowl' },
  { id: 'CRYSTAL', name: 'Crystal Bowl' },
  { id: 'CHIME', name: 'Wind Chime' },
  { id: 'WOODBLOCK', name: 'Temple Wood' },
  { id: 'WATER', name: 'Water Droplet' },
  { id: 'GONG', name: 'Zen Gong' },
];

export const AudioMixerModal: React.FC<AudioMixerModalProps> = ({
  isOpen,
  onClose,
  controller,
  onOpenBreathArchitect
}) => {
  const [activeTab, setActiveTab] = useState<'volumes' | 'eq'>('volumes');

  const { audio, temporal, atmosphere, audioSys } = controller;
  const breathConfig = temporal.breathConfig;

  // Real-time Audition Callbacks
  const handleAuditionTurnaround = useCallback(() => {
    if (audioSys?.previewCue) {
      audioSys.previewCue(breathConfig, 'HOLD_IN', temporal.localBpm || 60);
    }
  }, [audioSys, breathConfig, temporal.localBpm]);

  const handleAuditionBell = useCallback(() => {
    if (audioSys?.previewCue) {
      audioSys.previewCue(breathConfig, 'TEST', temporal.localBpm || 60);
    }
  }, [audioSys, breathConfig, temporal.localBpm]);

  const handleAuditionHeart = useCallback(() => {
    if (audioSys?.graphRef?.current) {
      triggerHeartPulse(audioSys.graphRef.current, audioSys.graphRef.current.ctx.currentTime, {
        syncMode: temporal.kickConfig?.syncMode || 'BREATH',
        doubleBeat: temporal.kickConfig?.doubleBeat !== false,
        bpm: temporal.localBpm || 60
      });
    }
  }, [audioSys, temporal.kickConfig, temporal.localBpm]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:bg-black/40" 
        onClick={onClose} 
      />
      <div 
        className="fixed sm:absolute top-12 sm:top-full left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 bg-slate-950/95 backdrop-blur-3xl border border-white/15 rounded-2xl p-4 md:p-5 flex flex-col shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200 w-[96vw] sm:w-[88vw] max-w-2xl max-h-[85vh] overflow-y-auto z-50 custom-scrollbar text-white"
      >
        {/* Header with Title and Segmented Tabs */}
        <div className="flex flex-col gap-3 pb-3 mb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                <Sliders size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Audio & Mixer Controls</h3>
                <span className="text-[8px] text-slate-400">Master Volumes • Bell Sound • Heartbeat • 12-Band EQ</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close Audio Mixer"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Segmented Mode Switch: Volumes vs 12-Band EQ */}
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setActiveTab('volumes')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'volumes'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Sliders size={13} />
              <span>Volume Sliders</span>
            </button>
            <button
              onClick={() => setActiveTab('eq')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'eq'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Master 12-Band EQ</span>
              {audio.isMasterEqBypassed && (
                <span className="text-[7.5px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">Bypassed</span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: ALL CHANNEL VOLUME SLIDERS */}
        {activeTab === 'volumes' && (
          <div className="space-y-3 mb-4">

            {/* MASTER OUTPUT BUS VOLUME */}
            <div className="p-3 rounded-xl bg-white/[0.05] border border-cyan-500/30 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Volume2 size={14} className="text-cyan-400" /> Master Output Volume
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-cyan-200">
                    {Math.round((audio.masterVolume ?? 0.85) * 100)}%
                  </span>
                  <button 
                    onClick={() => {
                      const cur = audio.masterVolume ?? 0.85;
                      const next = cur > 0 ? 0 : 0.85;
                      audio.setMasterVolume(next);
                      audioSys?.setMasterVolume?.(next);
                    }}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      (audio.masterVolume ?? 0.85) === 0 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40'
                    }`}
                  >
                    {(audio.masterVolume ?? 0.85) === 0 ? 'Muted' : 'Active'}
                  </button>
                </div>
              </div>
              <div 
                className="w-full h-8 bg-black/70 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  const rect = e.currentTarget.getBoundingClientRect(); 
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                  audio.setMasterVolume(x);
                  audioSys?.setMasterVolume?.(x);
                }} 
                onPointerMove={(e) => { 
                  if (e.buttons === 1) { 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    audio.setMasterVolume(x);
                    audioSys?.setMasterVolume?.(x);
                  }
                }}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-cyan-600 via-sky-500 to-emerald-400 shadow-[0_0_15px_#06b6d4]" 
                  style={{ width: `${(audio.masterVolume ?? 0.85) * 100}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-mono text-white/50 pointer-events-none">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* BELL SOUND VOLUME */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                    <Bell size={13} className="text-amber-400" /> Bell Sound
                  </span>
                  {/* Tone selector dropdown cycle */}
                  <button
                    onClick={() => {
                      const cur = (breathConfig.cueTone || 'SINE_BELL').toUpperCase();
                      const idx = CUE_TONE_PRESETS.findIndex(p => p.id === cur);
                      const nextIdx = (idx + 1) % CUE_TONE_PRESETS.length;
                      temporal.setBreathConfig(prev => ({ ...prev, cueTone: CUE_TONE_PRESETS[nextIdx].id }));
                    }}
                    title="Click to cycle chime timbre"
                    className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[8px] font-mono font-bold uppercase tracking-wider hover:bg-amber-500/25 transition-colors cursor-pointer"
                  >
                    {CUE_TONE_PRESETS.find(p => p.id === (breathConfig.cueTone || 'SINE_BELL').toUpperCase())?.name || 'Bell'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    {Math.round((breathConfig.cueVolume ?? 0.5) * 100)}%
                  </span>
                  {/* Audition Bell Button */}
                  <button
                    onClick={handleAuditionBell}
                    title="Audition Bell Sound"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <Play size={9} />
                    <span>Test</span>
                  </button>
                  {/* Mute Toggle */}
                  <button 
                    onClick={() => temporal.setBreathConfig(prev => ({
                      ...prev, 
                      cueTone: (prev.cueTone || 'SINE_BELL') === 'NONE' ? 'SINE_BELL' : 'NONE'
                    }))}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      breathConfig.cueTone === 'NONE' 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-amber-500/40 text-amber-300 bg-amber-950/40'
                    }`}
                  >
                    {breathConfig.cueTone === 'NONE' ? 'Muted' : 'Active'}
                  </button>
                </div>
              </div>
              <div 
                className="w-full h-8 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  const rect = e.currentTarget.getBoundingClientRect(); 
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                  temporal.setBreathConfig(prev => ({ ...prev, cueVolume: x, bellVol: x, turnaroundVol: x })); 
                }} 
                onPointerMove={(e) => { 
                  if (e.buttons === 1) { 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    temporal.setBreathConfig(prev => ({ ...prev, cueVolume: x, bellVol: x, turnaroundVol: x })); 
                  }
                }}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 shadow-[0_0_15px_#f59e0b]" 
                  style={{ width: `${(breathConfig.cueVolume ?? 0.5) * 100}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-mono text-white/50 pointer-events-none">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* 4. BREATH OCEAN SOUND VOLUME */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                    <Wind size={13}/> Breath Ocean Sound
                  </span>
                  <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300/80 font-mono">
                    {breathConfig.noiseType || 'PINK'} NOISE
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-300">
                    {Math.round(breathConfig.oceanVol * 100)}%
                  </span>
                  <button 
                    onClick={() => temporal.setBreathConfig(prev => ({
                      ...prev, 
                      oceanVol: prev.oceanVol > 0 ? 0 : 0.7
                    }))}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      breathConfig.oceanVol === 0 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40'
                    }`}
                  >
                    {breathConfig.oceanVol === 0 ? 'Muted' : 'Active'}
                  </button>
                </div>
              </div>
              <div 
                className="w-full h-8 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  const rect = e.currentTarget.getBoundingClientRect(); 
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                  temporal.setBreathConfig(prev => ({ ...prev, oceanVol: x })); 
                }} 
                onPointerMove={(e) => { 
                  if (e.buttons === 1) { 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    temporal.setBreathConfig(prev => ({ ...prev, oceanVol: x })); 
                  }
                }}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_#06b6d4]" 
                  style={{ width: `${breathConfig.oceanVol * 100}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-mono text-white/50 pointer-events-none">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* 5. TONES & BINAURAL HARMONIC MASTER */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                  <Music2 size={13}/> Tones & Binaural Master
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-300">
                    {Math.round(audio.harmonicMasterVolume * 100)}%
                  </span>
                  <button 
                    onClick={() => {
                      const cur = temporal.entrainmentMode;
                      if (cur === 'SILENT') {
                        temporal.setEntrainmentMode('SYNCED');
                      } else {
                        temporal.setEntrainmentMode('SILENT');
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      temporal.entrainmentMode === 'SILENT' 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-purple-500/40 text-purple-300 bg-purple-950/40'
                    }`}
                  >
                    {temporal.entrainmentMode === 'SILENT' ? 'Muted' : temporal.entrainmentMode}
                  </button>
                </div>
              </div>
              <div 
                className="w-full h-8 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  const rect = e.currentTarget.getBoundingClientRect(); 
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                  audio.setHarmonicMasterVolume(x); 
                }} 
                onPointerMove={(e) => { 
                  if (e.buttons === 1) { 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    audio.setHarmonicMasterVolume(x); 
                  }
                }}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_15px_#a855f7]" 
                  style={{ width: `${audio.harmonicMasterVolume * 100}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-mono text-white/50 pointer-events-none">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* HEARTBEAT */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                  <Heart size={13}/> Heartbeat
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-rose-300">
                    {Math.round((audio.volumes['HEART_KICK'] ?? 0.6) * 100)}%
                  </span>
                  {/* Test Pulse Button */}
                  <button
                    onClick={handleAuditionHeart}
                    title="Audition Heartbeat Pulse"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
                  >
                    <Play size={9} />
                    <span>Thump</span>
                  </button>
                  {/* Mute Button */}
                  <button 
                    onClick={() => audio.handleMuteToggle('HEART_KICK')}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      audio.mutes['HEART_KICK'] 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-rose-500/40 text-rose-300 bg-rose-950/40'
                    }`}
                  >
                    {temporal.kickConfig?.syncMode || 'BREATH'}
                  </button>
                </div>
              </div>
              <div 
                className="w-full h-8 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  const rect = e.currentTarget.getBoundingClientRect(); 
                  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                  audio.handleVolumeChange('HEART_KICK', x); 
                }} 
                onPointerMove={(e) => { 
                  if (e.buttons === 1) { 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    audio.handleVolumeChange('HEART_KICK', x); 
                  }
                }}
              >
                <div 
                  className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_#f43f5e]" 
                  style={{ width: `${(audio.volumes['HEART_KICK'] ?? 0.6) * 100}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-mono text-white/50 pointer-events-none">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* 8. ZEN SPACE & REVERB ACOUSTICS */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/30 to-black/40 border border-indigo-500/20 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Waves size={14} className="text-indigo-400" /> Space & Reverb (Zen Diffusion)
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono border border-indigo-500/20">
                    {(atmosphere.reverbConfig.decay ?? 2.2).toFixed(1)}s DECAY
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-indigo-300">
                    {Math.round((atmosphere.reverbConfig.wetness ?? 0.25) * 100)}%
                  </span>
                  <button 
                    onClick={() => atmosphere.setReverbConfig((prev: any) => ({
                      ...prev, 
                      wetness: (prev.wetness ?? 0) > 0 ? 0 : 0.25
                    }))}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      (atmosphere.reverbConfig.wetness ?? 0) === 0 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-indigo-500/40 text-indigo-300 bg-indigo-950/40'
                    }`}
                  >
                    {(atmosphere.reverbConfig.wetness ?? 0) === 0 ? 'Mute Tail' : 'Active'}
                  </button>
                </div>
              </div>

              {/* Zen Acoustic Presets */}
              <div className="space-y-1">
                <div className="text-[8.5px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                  <span>Zen Acoustic Spaces</span>
                  <span className="text-[7.5px] text-slate-500">Non-extreme diffusion</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {DEFAULT_REVERB_PRESETS.map((p) => {
                    const isActive = atmosphere.activeReverbPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (atmosphere.handleSelectReverbPreset) {
                            atmosphere.handleSelectReverbPreset(p);
                          } else {
                            atmosphere.setReverbConfig(p.config);
                          }
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[9px] font-medium text-left border transition-all cursor-pointer truncate ${
                          isActive
                            ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="font-semibold truncate">{p.name.replace(/ \(Default\)/, '')}</div>
                        <div className="text-[7.5px] text-slate-500 font-mono">{(p.config as any).decay}s • {Math.round((p.config as any).wetness * 100)}% wet</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reverb Wetness Slider (Zen Ceiling: 50% max) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Reverb Wetness (Zen Max 50%)</span>
                  <span className="text-indigo-300 font-mono font-bold">{Math.round((atmosphere.reverbConfig.wetness ?? 0.25) * 100)}%</span>
                </div>
                <div 
                  className="w-full h-7 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-indigo-500/20" 
                  onPointerDown={(e) => { 
                    e.currentTarget.setPointerCapture(e.pointerId); 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    // Zen clamp: 0.0 to 0.50
                    atmosphere.setReverbConfig((prev: any) => ({ ...prev, wetness: x * 0.50 })); 
                  }} 
                  onPointerMove={(e) => { 
                    if (e.buttons === 1) { 
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                      atmosphere.setReverbConfig((prev: any) => ({ ...prev, wetness: x * 0.50 })); 
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-indigo-700 via-indigo-500 to-blue-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
                    style={{ width: `${((atmosphere.reverbConfig.wetness ?? 0.25) / 0.50) * 100}%` }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-[8.5px] font-mono text-white/60 pointer-events-none">
                    <span>Dry (0%)</span>
                    <span>Gentle (25%)</span>
                    <span>Max Zen (50%)</span>
                  </div>
                </div>
              </div>

              {/* Reverb Decay Time (Zen Range: 1.0s - 4.5s) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Decay Time (Zen Envelope: 1.0s – 4.5s)</span>
                  <span className="text-indigo-300 font-mono font-bold">{(atmosphere.reverbConfig.decay ?? 2.2).toFixed(1)}s</span>
                </div>
                <div 
                  className="w-full h-6 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                  onPointerDown={(e) => { 
                    e.currentTarget.setPointerCapture(e.pointerId); 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    const decay = 1.0 + x * (4.5 - 1.0);
                    atmosphere.setReverbConfig((prev: any) => ({ ...prev, decay })); 
                  }} 
                  onPointerMove={(e) => { 
                    if (e.buttons === 1) { 
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                      const decay = 1.0 + x * (4.5 - 1.0);
                      atmosphere.setReverbConfig((prev: any) => ({ ...prev, decay })); 
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-indigo-500/60" 
                    style={{ width: `${(((atmosphere.reverbConfig.decay ?? 2.2) - 1.0) / (4.5 - 1.0)) * 100}%` }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-[8px] font-mono text-white/50 pointer-events-none">
                    <span>1.0s Intimate</span>
                    <span>2.5s Sanctuary</span>
                    <span>4.5s Cosmic</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[
                    { label: '1.4s Still', val: 1.4 },
                    { label: '2.2s Temple', val: 2.2 },
                    { label: '3.0s Cave', val: 3.0 },
                    { label: '3.8s Lotus', val: 3.8 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => atmosphere.setReverbConfig((prev: any) => ({ ...prev, decay: preset.val }))}
                      className={`flex-1 py-1 rounded text-[8px] font-mono border transition-colors cursor-pointer ${
                        Math.abs((atmosphere.reverbConfig.decay ?? 2.2) - preset.val) < 0.1
                          ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                          : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 9. ZEN STEREO DELAY & ECHO ACOUSTICS */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-fuchsia-950/30 to-black/40 border border-fuchsia-500/20 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                    <Activity size={14} className="text-fuchsia-400" /> Stereo Delay & Echo (Zen Reflections)
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 font-mono border border-fuchsia-500/20">
                    {Math.round((atmosphere.delayConfig.time ?? 0.4) * 1000)}ms TIME
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-fuchsia-300">
                    {Math.round((atmosphere.delayConfig.wetness ?? 0.15) * 100)}%
                  </span>
                  <button 
                    onClick={() => atmosphere.setDelayConfig((prev: any) => ({
                      ...prev, 
                      wetness: (prev.wetness ?? 0) > 0 ? 0 : 0.15
                    }))}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      (atmosphere.delayConfig.wetness ?? 0) === 0 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-950/40' 
                        : 'border-fuchsia-500/40 text-fuchsia-300 bg-fuchsia-950/40'
                    }`}
                  >
                    {(atmosphere.delayConfig.wetness ?? 0) === 0 ? 'Mute Echo' : 'Active'}
                  </button>
                </div>
              </div>

              {/* Echo Wetness Slider (Zen Ceiling: 35% max) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Echo Wetness (Zen Max 35%)</span>
                  <span className="text-fuchsia-300 font-mono font-bold">{Math.round((atmosphere.delayConfig.wetness ?? 0.15) * 100)}%</span>
                </div>
                <div 
                  className="w-full h-7 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-fuchsia-500/20" 
                  onPointerDown={(e) => { 
                    e.currentTarget.setPointerCapture(e.pointerId); 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    // Zen clamp: 0.0 to 0.35
                    atmosphere.setDelayConfig((prev: any) => ({ ...prev, wetness: x * 0.35 })); 
                  }} 
                  onPointerMove={(e) => { 
                    if (e.buttons === 1) { 
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                      atmosphere.setDelayConfig((prev: any) => ({ ...prev, wetness: x * 0.35 })); 
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-fuchsia-700 via-fuchsia-500 to-pink-400 shadow-[0_0_12px_rgba(217,70,239,0.5)]" 
                    style={{ width: `${((atmosphere.delayConfig.wetness ?? 0.15) / 0.35) * 100}%` }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-[8.5px] font-mono text-white/60 pointer-events-none">
                    <span>Dry (0%)</span>
                    <span>Subtle (18%)</span>
                    <span>Max Zen (35%)</span>
                  </div>
                </div>
              </div>

              {/* Delay Time Slider (Zen Range: 150ms - 750ms) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Delay Time (Zen Tempo: 150ms – 750ms)</span>
                  <span className="text-fuchsia-300 font-mono font-bold">{Math.round((atmosphere.delayConfig.time ?? 0.4) * 1000)}ms</span>
                </div>
                <div 
                  className="w-full h-6 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-white/10" 
                  onPointerDown={(e) => { 
                    e.currentTarget.setPointerCapture(e.pointerId); 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    const time = 0.15 + x * (0.75 - 0.15);
                    atmosphere.setDelayConfig((prev: any) => ({ ...prev, time })); 
                  }} 
                  onPointerMove={(e) => { 
                    if (e.buttons === 1) { 
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                      const time = 0.15 + x * (0.75 - 0.15);
                      atmosphere.setDelayConfig((prev: any) => ({ ...prev, time })); 
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-fuchsia-500/60" 
                    style={{ width: `${(((atmosphere.delayConfig.time ?? 0.4) - 0.15) / (0.75 - 0.15)) * 100}%` }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-[8px] font-mono text-white/50 pointer-events-none">
                    <span>150ms Flutter</span>
                    <span>400ms Breath</span>
                    <span>750ms Floating</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[
                    { label: '250ms Pulse', val: 0.25 },
                    { label: '400ms Breath', val: 0.40 },
                    { label: '550ms Shimmer', val: 0.55 },
                    { label: '700ms Space', val: 0.70 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => atmosphere.setDelayConfig((prev: any) => ({ ...prev, time: preset.val }))}
                      className={`flex-1 py-1 rounded text-[8px] font-mono border transition-colors cursor-pointer ${
                        Math.abs((atmosphere.delayConfig.time ?? 0.4) - preset.val) < 0.05
                          ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300'
                          : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Tail & Ping-Pong Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[8.5px] text-slate-400">
                    <span>Feedback Tail (Zen Max 45%)</span>
                    <span className="text-fuchsia-300 font-mono">{Math.round((atmosphere.delayConfig.feedback ?? 0.2) * 100)}%</span>
                  </div>
                  <div 
                    className="w-full h-5 bg-black/60 rounded relative overflow-hidden cursor-ew-resize border border-white/10"
                    onPointerDown={(e) => { 
                      e.currentTarget.setPointerCapture(e.pointerId); 
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                      atmosphere.setDelayConfig((prev: any) => ({ ...prev, feedback: x * 0.45 })); 
                    }}
                    onPointerMove={(e) => { 
                      if (e.buttons === 1) { 
                        const rect = e.currentTarget.getBoundingClientRect(); 
                        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                        atmosphere.setDelayConfig((prev: any) => ({ ...prev, feedback: x * 0.45 })); 
                      }
                    }}
                  >
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-fuchsia-500/70"
                      style={{ width: `${((atmosphere.delayConfig.feedback ?? 0.2) / 0.45) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-[7.5px] font-mono text-white/50 pointer-events-none">
                      <span>Soft</span>
                      <span>Gentle</span>
                      <span>Max Tail</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[9px] font-medium text-slate-300 flex items-center gap-1.5">
                    <ArrowRightLeft size={11} className="text-fuchsia-400" />
                    Stereo Ping-Pong
                  </span>
                  <button 
                    onClick={() => atmosphere.setDelayConfig((prev: any) => ({ 
                      ...prev, 
                      isPingPong: !prev.isPingPong 
                    }))} 
                    className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors cursor-pointer ${
                      atmosphere.delayConfig.isPingPong ? 'bg-fuchsia-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
                      atmosphere.delayConfig.isPingPong ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 10. POLYVAGAL NEUROMODULATION BUS */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/30 to-black/40 border border-emerald-500/30 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-400" />
                    Polyvagal Vocal Formants
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    1kHz–4kHz
                  </span>
                </div>
                <button
                  onClick={() => audio.updatePolyvagalConfig({
                    enabled: !audio.polyvagalConfig?.enabled,
                    isEmergencyGrounded: false
                  })}
                  className={`px-2 py-0.5 rounded text-[8.5px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                    audio.polyvagalConfig?.enabled && !audio.polyvagalConfig?.isEmergencyGrounded
                      ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
                      : 'border-white/10 text-slate-400 bg-white/5'
                  }`}
                >
                  {audio.polyvagalConfig?.enabled && !audio.polyvagalConfig?.isEmergencyGrounded ? 'Active' : 'Off'}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Formant Sweep Volume</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    {Math.round((audio.polyvagalConfig?.formantVolume ?? 0.45) * 100)}%
                  </span>
                </div>
                <div 
                  className="w-full h-7 bg-black/60 rounded-lg relative overflow-hidden cursor-ew-resize group shadow-inner touch-none border border-emerald-500/20" 
                  onPointerDown={(e) => { 
                    e.currentTarget.setPointerCapture(e.pointerId); 
                    const rect = e.currentTarget.getBoundingClientRect(); 
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                    audio.updatePolyvagalConfig({ formantVolume: x }); 
                  }} 
                  onPointerMove={(e) => { 
                    if (e.buttons === 1) { 
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); 
                      audio.updatePolyvagalConfig({ formantVolume: x }); 
                    }
                  }}
                >
                  <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-75 bg-gradient-to-r from-emerald-700 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${(audio.polyvagalConfig?.formantVolume ?? 0.45) * 100}%` }} 
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-[8.5px] font-mono text-white/60 pointer-events-none">
                    <span>Silent</span>
                    <span>Gentle (45%)</span>
                    <span>Max Resonance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CLINICAL ENTRAINMENT SAFEGUARD STATUS CARD */}
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex items-start gap-2.5 shadow-sm">
              <div className="p-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
                <ShieldCheck size={14} />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-[9.5px] font-bold text-cyan-200 tracking-wide flex items-center gap-1.5">
                  Clinical Entrainment Shield Active
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                </div>
                <div className="text-[8px] text-cyan-300/80 leading-relaxed font-mono">
                  Heartbeat pacing and Binaural Beat carriers are routed 100% dry directly to the master output. Spatial reverb and stereo delay only diffuse atmospheric breath layers, strictly preserving phase alignment for brainstem frequency-following response (FFR).
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MASTER 12-BAND EQUALIZER */}
        {activeTab === 'eq' && (
          <div className="mb-4">
            <Master12BandEq
              masterEq={audio.masterEq}
              onBandChange={(index, gainDb) => {
                audio.handleMasterEqBandChange(index, gainDb);
                const next = [...audio.masterEq];
                next[index] = gainDb;
                audioSys?.setMasterEq?.(next, audio.isMasterEqBypassed);
              }}
              onResetEq={() => {
                audio.resetMasterEq();
                audioSys?.setMasterEq?.([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], audio.isMasterEqBypassed);
              }}
              onApplyPreset={(gains) => {
                audio.setMasterEq(gains);
                audioSys?.setMasterEq?.(gains, audio.isMasterEqBypassed);
              }}
              isBypassed={audio.isMasterEqBypassed}
              onToggleBypass={() => {
                const next = !audio.isMasterEqBypassed;
                audio.setIsMasterEqBypassed(next);
                audioSys?.setMasterEq?.(audio.masterEq, next);
              }}
            />
          </div>
        )}

        {/* FOOTER ACTION: BREATH ARCHITECT LINK */}
        <div className="pt-3 border-t border-white/10 flex justify-between items-center shrink-0">
          <span className="text-[9px] text-slate-400">Need to adjust breath timing intervals?</span>
          <button
            onClick={() => {
              onClose();
              onOpenBreathArchitect();
            }}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders size={12} /> Open Breath Architect
          </button>
        </div>
      </div>
    </>
  );
};
