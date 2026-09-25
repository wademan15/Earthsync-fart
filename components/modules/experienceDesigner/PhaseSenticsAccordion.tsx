import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, Waves, Activity } from 'lucide-react';
import { BlockSenticConfig } from '../../../services/audio/experienceDesigner';
import {
    SenticEmotion,
    SENTIC_STATES,
    SENTIC_EMOTION_META,
    generateSenticSvgPath
} from '../../../services/kinematics/senticForms';

interface Props {
    config?: BlockSenticConfig;
    onChange: (cfg: BlockSenticConfig) => void;
    globalEmotion?: SenticEmotion;
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

export const PhaseSenticsAccordion: React.FC<Props> = ({
    config,
    onChange,
    globalEmotion = 'NO_EMOTION',
    isOpen: controlledOpen,
    onToggleOpen
}) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const handleToggle = () => {
        if (onToggleOpen) onToggleOpen();
        else setInternalOpen(!isOpen);
    };

    const isEnabled = config?.enabled ?? false;
    const activeEmotion: SenticEmotion = config?.emotion || globalEmotion;
    const intensity = config?.intensity ?? 0.35;
    const tideAM = config?.tideAM ?? true;
    const tideFM = config?.tideFM ?? true;

    const activeMeta = SENTIC_EMOTION_META.find(m => m.id === activeEmotion) || SENTIC_EMOTION_META[0];
    const senticData = SENTIC_STATES[activeEmotion] || SENTIC_STATES['NO_EMOTION'];
    const svgPath = generateSenticSvgPath(senticData?.curveLUT, 120, 24);

    const toggleEnabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({
            ...config,
            enabled: !isEnabled,
            emotion: activeEmotion,
            intensity,
            tideAM,
            tideFM
        });
    };

    const handleSelectEmotion = (emotion: SenticEmotion) => {
        onChange({
            ...config,
            enabled: true,
            emotion,
            intensity,
            tideAM,
            tideFM
        });
    };

    const handleIntensityChange = (val: number) => {
        onChange({
            ...config,
            enabled: true,
            intensity: val
        });
    };

    const toggleMod = (key: 'tideAM' | 'tideFM') => {
        onChange({
            ...config,
            enabled: true,
            [key]: key === 'tideAM' ? !tideAM : !tideFM
        });
    };

    return (
        <div className="border border-pink-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(236,72,153,0.08)]">
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-pink-950/70 via-slate-900/90 to-slate-950/90 hover:from-pink-950/90 hover:via-slate-900 transition-all select-none border-b border-pink-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div
                        className="w-8 h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 self-center shadow-[0_0_8px_rgba(236,72,153,0.25)]"
                        style={{
                            backgroundColor: isEnabled ? `${activeMeta.color}25` : 'rgba(236,72,153,0.15)',
                            borderColor: isEnabled ? `${activeMeta.color}50` : 'rgba(236,72,153,0.3)',
                            color: isEnabled ? activeMeta.color : '#f472b6'
                        }}
                    >
                        <Heart size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-pink-200 uppercase tracking-wider">
                                Sentics Emotion
                            </span>
                            {isEnabled ? (
                                <span
                                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0"
                                    style={{
                                        backgroundColor: `${activeMeta.color}20`,
                                        borderColor: `${activeMeta.color}40`,
                                        color: activeMeta.color
                                    }}
                                >
                                    {activeMeta.name} ({Math.round(intensity * 100)}%)
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                    Global ({SENTIC_EMOTION_META.find(m => m.id === globalEmotion)?.name || 'Natural'})
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] text-pink-300/85 block leading-normal">
                            Clynes essentic wave curve & somatic emotional expression
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                        type="button"
                        onClick={toggleEnabled}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
                            isEnabled
                                ? 'bg-pink-600/30 text-pink-200 border-pink-500/50 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isEnabled ? "Phase overrides sentic emotion" : "Inheriting global sentic emotion"}
                    >
                        {isEnabled ? 'Custom' : 'Inherit'}
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-3.5 bg-black/40 border-t border-white/5">
                    {/* Emotion Form Selector Grid */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-pink-300 tracking-wider block">
                            Sentic Dynamic Archetype
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {SENTIC_EMOTION_META.map((item) => {
                                const isSelected = activeEmotion === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectEmotion(item.id)}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                                        }`}
                                        style={{
                                            borderColor: isSelected ? item.color : undefined
                                        }}
                                    >
                                        <div className="min-w-0 mr-1">
                                            <span className="font-bold block leading-tight" style={{ color: isSelected ? item.color : undefined }}>
                                                {item.name}
                                            </span>
                                            <span className="text-[7.5px] text-slate-400 block leading-tight">{item.tag}</span>
                                        </div>
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{
                                                backgroundColor: item.color,
                                                boxShadow: isSelected ? `0 0 8px ${item.color}` : 'none'
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Emotion Wave Curve Preview & Directive */}
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 pr-1 flex-1">
                                <span className="text-[7px] uppercase font-bold tracking-widest text-slate-400 block">Essentic Dynamic Directive</span>
                                <p className="text-[9px] italic text-slate-200 leading-snug" title={senticData.directive}>
                                    "{senticData.directive}"
                                </p>
                            </div>
                            <div className="w-[120px] h-[26px] shrink-0 bg-slate-950/90 rounded border border-white/10 overflow-hidden flex items-center justify-center px-1">
                                <svg width="112" height="24" viewBox="0 0 120 24" className="overflow-visible">
                                    <path
                                        d={svgPath}
                                        fill="none"
                                        stroke={activeMeta.color}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Intensity Fader */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Intensity</span>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={intensity}
                                onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                                className="flex-1 accent-pink-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                            />
                            <span className="text-[8px] font-mono font-bold text-right w-8" style={{ color: activeMeta.color }}>
                                {Math.round(intensity * 100)}%
                            </span>
                        </div>

                        {/* Modulation Toggles */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => toggleMod('tideAM')}
                                className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 border transition-colors ${
                                    tideAM
                                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                                        : 'bg-white/5 text-slate-500 border-white/5'
                                }`}
                            >
                                <Waves size={10} />
                                Tide AM: {tideAM ? 'ON' : 'OFF'}
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleMod('tideFM')}
                                className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 border transition-colors ${
                                    tideFM
                                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                                        : 'bg-white/5 text-slate-500 border-white/5'
                                }`}
                            >
                                <Activity size={10} />
                                Tide FM: {tideFM ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
