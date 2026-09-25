import React from 'react';
import { Headphones, Zap, Radio, Check, Waves, Activity, SlidersHorizontal } from 'lucide-react';
import { EntrainmentLayer } from '../../../services/audio/AudioTypes';

export interface EntrainmentLayerSelectorProps {
  activeLayers: EntrainmentLayer[];
  onToggleLayer: (layer: EntrainmentLayer) => void;
  onSelectPreset?: (layers: EntrainmentLayer[]) => void;
  variant?: 'popover' | 'inline';
  
  // Phase Conjugate & PAC Controls
  isConjugatePhase?: boolean;
  onToggleConjugatePhase?: (val: boolean) => void;
  isochronicHardEdge?: boolean;
  onToggleIsochronicHardEdge?: (val: boolean) => void;
  isPACGated?: boolean;
  onTogglePACGated?: (val: boolean) => void;
}

interface LayerItem {
  id: EntrainmentLayer;
  name: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeColor: string;
  checkColor: string;
  badgeActiveColor: string;
}

const LAYERS: LayerItem[] = [
  {
    id: 'binaural',
    name: 'Binaural Beats',
    sub: 'Stereo frequency offset (headphones)',
    icon: Headphones,
    activeColor: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200',
    checkColor: 'bg-cyan-500 border-cyan-400 text-black',
    badgeActiveColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'isochronic',
    name: 'Isochronic Tones',
    sub: 'Rhythmic volume pulses (speakers & headphones)',
    icon: Zap,
    activeColor: 'bg-rose-500/15 border-rose-500/40 text-rose-200',
    checkColor: 'bg-rose-500 border-rose-400 text-black',
    badgeActiveColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    id: 'monaural',
    name: 'Monaural Beats',
    sub: 'Acoustic interference (speakers & headphones)',
    icon: Radio,
    activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-200',
    checkColor: 'bg-amber-500 border-amber-400 text-black',
    badgeActiveColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];

export const EntrainmentLayerSelector: React.FC<EntrainmentLayerSelectorProps> = ({
  activeLayers,
  onToggleLayer,
  variant = 'popover',
  isConjugatePhase = false,
  onToggleConjugatePhase,
  isochronicHardEdge = false,
  onToggleIsochronicHardEdge,
  isPACGated = true,
  onTogglePACGated,
}) => {
  const isLayerActive = (layer: EntrainmentLayer) => activeLayers.includes(layer);
  const showPhaseControls = Boolean(onToggleConjugatePhase || onToggleIsochronicHardEdge || onTogglePACGated);

  return (
    <div className={`flex flex-col select-none ${variant === 'popover' ? 'p-2.5 gap-2 w-[85vw] sm:w-72 max-w-[300px]' : 'gap-2 w-full'}`}>
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Entrainment Architecture
        </span>
        {LAYERS.map(item => {
          const Icon = item.icon;
          const active = isLayerActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleLayer(item.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                active
                  ? item.activeColor
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    active ? item.checkColor : 'border-white/20 bg-black/40'
                  }`}
                >
                  {active && <Check size={11} strokeWidth={3} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-100">
                    <Icon size={12} className={active ? '' : 'text-slate-500'} />
                    {item.name}
                  </span>
                  <span className="text-[7.5px] text-slate-400 leading-tight mt-0.5">
                    {item.sub}
                  </span>
                </div>
              </div>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${
                  active ? item.badgeActiveColor : 'bg-white/5 text-slate-500 border-white/10'
                }`}
              >
                {active ? 'ON' : 'OFF'}
              </span>
            </button>
          );
        })}
      </div>

      {showPhaseControls && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10 mt-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <SlidersHorizontal size={11} className="text-sky-400" />
            Phase Dynamics & Envelopes
          </span>

          {/* 1. 180° Anti-Phase Inversion Toggle */}
          {onToggleConjugatePhase && (
            <button
              type="button"
              onClick={() => onToggleConjugatePhase(!isConjugatePhase)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                isConjugatePhase
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    isConjugatePhase ? 'bg-sky-500 border-sky-400 text-black' : 'border-white/20 bg-black/40'
                  }`}
                >
                  {isConjugatePhase && <Check size={11} strokeWidth={3} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-100">
                    <Waves size={12} className={isConjugatePhase ? 'text-sky-300' : 'text-slate-500'} />
                    180° Conjugate Phase
                  </span>
                  <span className="text-[7.5px] text-slate-400 leading-tight mt-0.5">
                    Cancels transverse vectors for longitudinal compression
                  </span>
                </div>
              </div>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${
                  isConjugatePhase ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-white/5 text-slate-500 border-white/10'
                }`}
              >
                {isConjugatePhase ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* 2. Pulse Window Envelope: Sharp Square vs Soft Sine */}
          {onToggleIsochronicHardEdge && (
            <button
              type="button"
              onClick={() => onToggleIsochronicHardEdge(!isochronicHardEdge)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                isochronicHardEdge
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    isochronicHardEdge ? 'bg-violet-500 border-violet-400 text-black' : 'border-white/20 bg-black/40'
                  }`}
                >
                  {isochronicHardEdge && <Check size={11} strokeWidth={3} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-100">
                    <Zap size={12} className={isochronicHardEdge ? 'text-violet-300' : 'text-slate-500'} />
                    Sharp Square Envelope
                  </span>
                  <span className="text-[7.5px] text-slate-400 leading-tight mt-0.5">
                    Clinical band-limited square wave (Off: Soft Sine)
                  </span>
                </div>
              </div>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${
                  isochronicHardEdge ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-white/5 text-slate-500 border-white/10'
                }`}
              >
                {isochronicHardEdge ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* 3. Phase-Amplitude Coupling (PAC) Gating */}
          {onTogglePACGated && (
            <button
              type="button"
              onClick={() => onTogglePACGated(!isPACGated)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                isPACGated
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    isPACGated ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 bg-black/40'
                  }`}
                >
                  {isPACGated && <Check size={11} strokeWidth={3} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wide flex items-center gap-1.5 text-slate-100">
                    <Activity size={12} className={isPACGated ? 'text-emerald-300' : 'text-slate-500'} />
                    Alpha-Gated Gamma Bursts (PAC)
                  </span>
                  <span className="text-[7.5px] text-slate-400 leading-tight mt-0.5">
                    8Hz Schumann crests modulate 33.88Hz Gamma amplitude
                  </span>
                </div>
              </div>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ml-2 ${
                  isPACGated ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/10'
                }`}
              >
                {isPACGated ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
