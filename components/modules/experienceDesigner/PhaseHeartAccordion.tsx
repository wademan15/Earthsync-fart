import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Heart, Wind, Timer, Music2, SlidersHorizontal, Volume2 } from 'lucide-react';
import { BlockHeartConfig } from '../../../services/audio/experienceDesigner';
import { HEARTBEAT_PRESET_OPTIONS, HeartbeatPresetOption } from '../../../services/audio/heartStyles';

interface Props {
    config?: BlockHeartConfig;
    onChange: (cfg: BlockHeartConfig) => void;
    globalSyncMode?: 'BREATH' | 'BREATH_COUNT' | 'STEADY' | 'BINAURAL';
    globalBpm?: number;
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

export const PhaseHeartAccordion: React.FC<Props> = ({
    config,
    onChange,
    globalSyncMode = 'BREATH',
    globalBpm = 60,
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
    const syncMode = config?.syncMode || globalSyncMode;
    const bpm = config?.bpm ?? globalBpm;
    const volume = config?.volume ?? 0.6;
    const kickEnabled = config?.kickEnabled !== false;
    const doubleBeat = config?.doubleBeat !== false;
    const baseFreq = config?.baseFreq ?? 48;
    const lpfCutoff = config?.lpfCutoff ?? 180;

    const toggleEnabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({
            ...config,
            enabled: !isEnabled,
            syncMode,
            bpm,
            volume,
            kickEnabled,
            doubleBeat,
            baseFreq,
            lpfCutoff
        });
    };

    const handleSelectPreset = (preset: HeartbeatPresetOption) => {
        onChange({
            ...config,
            enabled: true,
            syncMode: preset.syncMode,
            doubleBeat: preset.doubleBeat,
            baseFreq: preset.baseFreq,
            ...(preset.syncMode === 'STEADY' && preset.bpm ? { bpm: preset.bpm } : {})
        });
    };

    const handleSelectSyncMode = (mode: 'BREATH' | 'BREATH_COUNT' | 'STEADY' | 'BINAURAL') => {
        onChange({
            ...config,
            enabled: true,
            syncMode: mode
        });
    };

    const getSyncModeLabel = () => {
        switch (syncMode) {
            case 'BREATH': return 'Breath RSA';
            case 'BREATH_COUNT': return '1s Count';
            case 'STEADY': return `${bpm} BPM`;
            case 'BINAURAL': return 'Brainwave Sync';
            default: return 'Breath RSA';
        }
    };

    const currentPreset = HEARTBEAT_PRESET_OPTIONS.find(
        p => p.syncMode === syncMode && p.doubleBeat === doubleBeat && (p.syncMode !== 'STEADY' || (p.bpm || 60) === bpm)
    );

    return (
        <div className="border border-rose-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(244,63,94,0.08)]">
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-slate-950/90 hover:from-rose-950/90 hover:via-slate-900 transition-all select-none border-b border-rose-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className={`w-8 h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 self-center ${
                        isEnabled
                            ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                            : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                        <Activity size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                                Heart & Pulse Sync
                            </span>
                            {isEnabled ? (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                                    {getSyncModeLabel()} · {Math.round(volume * 100)}%
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                    Global ({globalSyncMode === 'STEADY' ? `${globalBpm} BPM` : 'Breath RSA'})
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] text-rose-300/85 block leading-normal">
                            Cardiovascular pacing, RSA sync & somatic lub-dub acoustics
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                        type="button"
                        onClick={toggleEnabled}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
                            isEnabled
                                ? 'bg-rose-600/30 text-rose-200 border-rose-500/50 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isEnabled ? "Phase overrides heartbeat config" : "Inheriting global heartbeat"}
                    >
                        {isEnabled ? 'Custom' : 'Inherit'}
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-3.5 bg-black/40 border-t border-white/5">
                    {/* Mode Presets */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[8.5px] uppercase tracking-wider text-slate-400">
                            <span>Cardiorespiratory Sync Presets</span>
                            <span className="text-rose-400 font-mono text-[8.5px] font-bold">
                                {currentPreset?.name || 'Custom Configuration'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {HEARTBEAT_PRESET_OPTIONS.map((preset) => {
                                const isSelected = syncMode === preset.syncMode &&
                                                   doubleBeat === preset.doubleBeat &&
                                                   (preset.syncMode !== 'STEADY' || (preset.bpm || 60) === bpm);
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-sm'
                                                : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="min-w-0 mr-1">
                                            <span className="font-bold block leading-tight">{preset.name}</span>
                                            <span className="text-[7.5px] text-slate-400 block leading-tight">{preset.tag}</span>
                                        </div>
                                        <span className="text-rose-400 shrink-0">
                                            {preset.syncMode === 'BREATH' ? <Wind size={11} /> : preset.syncMode === 'BINAURAL' ? <Music2 size={11} /> : <Heart size={11} />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Rate / Sync Driver Mode Segment Selector */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                        <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-slate-400">
                            <span>Sync Driver Mode</span>
                            <span className="text-rose-400 font-mono text-[8.5px] font-bold">
                                {syncMode}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                            {[
                                { id: "BREATH" as const, label: "Breath RSA", icon: Wind },
                                { id: "BREATH_COUNT" as const, label: "1s Count", icon: Timer },
                                { id: "STEADY" as const, label: "Steady", icon: Heart },
                                { id: "BINAURAL" as const, label: "Brainwave", icon: Music2 },
                            ].map((m) => {
                                const isCurrent = syncMode === m.id;
                                const MIcon = m.icon;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => handleSelectSyncMode(m.id)}
                                        className={`py-1 px-1 rounded text-[8.5px] font-bold transition-colors flex items-center justify-center gap-1 border ${
                                            isCurrent
                                                ? "bg-rose-500/30 text-rose-200 border-rose-500/50 shadow-xs"
                                                : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                                        }`}
                                    >
                                        <MIcon size={10} />
                                        <span>{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dedicated Turnaround 1s Sync Quick Switch Button */}
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    const isAlready1s = syncMode === "BREATH_COUNT";
                                    handleSelectSyncMode(isAlready1s ? "BREATH" : "BREATH_COUNT");
                                }}
                                className={`w-full py-1 px-2 rounded-md text-[8.5px] font-semibold transition-all flex items-center justify-between border cursor-pointer ${
                                    syncMode === "BREATH_COUNT"
                                        ? "bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-xs"
                                        : "bg-white/[0.04] text-slate-300 hover:text-white border-white/10 hover:bg-white/[0.08]"
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Timer size={11} className={syncMode === "BREATH_COUNT" ? "text-rose-400" : "text-slate-400"} />
                                    <span>5s In / 5s Out Turnaround 1s Sync</span>
                                </span>
                                <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                    syncMode === "BREATH_COUNT"
                                        ? "bg-rose-500/40 text-rose-100"
                                        : "bg-white/10 text-slate-400"
                                }`}>
                                    {syncMode === "BREATH_COUNT" ? "LOCKED" : "OFF"}
                                </span>
                            </button>
                        </div>

                        {/* Mode Explainer Info Box */}
                        <div className="mt-1 p-2 rounded-md bg-white/[0.03] border border-white/5 text-[8px] leading-relaxed text-slate-300">
                            {syncMode === "BREATH_COUNT" && (
                                <div className="flex items-start gap-1.5">
                                    <span className="text-rose-400 shrink-0 mt-0.5"><Timer size={11} /></span>
                                    <div>
                                        <strong className="text-rose-300 font-medium">Turnaround 1s Count: </strong>
                                        Syncs 1 beat per second of your breath cycle and strikes precisely on turnarounds.
                                    </div>
                                </div>
                            )}
                            {syncMode === "BREATH" && (
                                <div className="flex items-start gap-1.5">
                                    <span className="text-rose-400 shrink-0 mt-0.5"><Wind size={11} /></span>
                                    <div>
                                        <strong className="text-rose-300 font-medium">Breath RSA (Respiratory Sinus Arrhythmia): </strong>
                                        Accelerates heartbeat on inhale, slows on exhale to train vagal tone and HRV.
                                    </div>
                                </div>
                            )}
                            {syncMode === "STEADY" && (
                                <div className="flex items-start gap-1.5">
                                    <span className="text-rose-400 shrink-0 mt-0.5"><Heart size={11} /></span>
                                    <div>
                                        <strong className="text-rose-300 font-medium">Steady (Fixed Tempo): </strong>
                                        Locks pulse to an unwavering metronomic tempo at {bpm} BPM.
                                    </div>
                                </div>
                            )}
                            {syncMode === "BINAURAL" && (
                                <div className="flex items-start gap-1.5">
                                    <span className="text-rose-400 shrink-0 mt-0.5"><Music2 size={11} /></span>
                                    <div>
                                        <strong className="text-rose-300 font-medium">Brainwave (Binaural Lock): </strong>
                                        Clocks heartbeat interval to exact subharmonics of active binaural frequency.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Double Beat Toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px]">
                        <span className="text-slate-400 text-[8.5px] uppercase tracking-wider">Lub-Dub Valve Physics</span>
                        <button
                            type="button"
                            onClick={() => onChange({ ...config, enabled: true, doubleBeat: !doubleBeat })}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors border ${
                                doubleBeat
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
                            }`}
                        >
                            {doubleBeat ? 'Lub-Dub (Dual Stroke)' : 'Single Stroke'}
                        </button>
                    </div>

                    {/* Kick EQ & Tone Tuning Sliders */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-slate-400">
                            <span className="flex items-center gap-1">
                                <SlidersHorizontal size={10} className="text-rose-400" />
                                <span>Acoustic Kick EQ & Pitch</span>
                            </span>
                            <span className="text-[7.5px] text-rose-300/80 font-mono font-bold">
                                {Math.round(baseFreq)}Hz · {Math.round(lpfCutoff)}Hz
                            </span>
                        </div>

                        <div className="space-y-2 p-2 rounded-lg bg-black/40 border border-white/5">
                            {/* Pulse Rate / Tempo (BPM) */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                                    <span className="flex items-center gap-1"><Heart size={9} className="text-rose-400" /> Pulse Rate / Tempo (BPM)</span>
                                    <span className="text-rose-300 font-mono font-bold">
                                        {syncMode === 'BREATH_COUNT'
                                            ? '1 Beat / Sec (Turnaround Synced)'
                                            : syncMode === 'BREATH'
                                                ? 'Breath-Locked (RSA Inhale/Exhale)'
                                                : `${Math.round(bpm)} BPM`}
                                    </span>
                                </div>
                                <div className={`transition-opacity ${(syncMode === 'BREATH_COUNT' || syncMode === 'BREATH') ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <input
                                        type="range"
                                        min={40}
                                        max={140}
                                        step={1}
                                        disabled={syncMode === 'BREATH_COUNT' || syncMode === 'BREATH'}
                                        value={bpm}
                                        onChange={(e) => onChange({ ...config, enabled: true, bpm: parseInt(e.target.value, 10) })}
                                        className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Pitch / Sub Fundamental */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                                    <span>Sub Fundamental / Pitch</span>
                                    <span className="text-rose-300 font-mono font-bold">{Math.round(baseFreq)} Hz</span>
                                </div>
                                <input
                                    type="range"
                                    min={30}
                                    max={120}
                                    step={1}
                                    value={baseFreq}
                                    onChange={(e) => onChange({ ...config, enabled: true, baseFreq: parseInt(e.target.value, 10) })}
                                    className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* Low Pass Cutoff / Muffle */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                                    <span>LPF Cutoff (Muffle vs Click)</span>
                                    <span className="text-rose-300 font-mono font-bold">{Math.round(lpfCutoff)} Hz</span>
                                </div>
                                <input
                                    type="range"
                                    min={60}
                                    max={400}
                                    step={10}
                                    value={lpfCutoff}
                                    onChange={(e) => onChange({ ...config, enabled: true, lpfCutoff: parseInt(e.target.value, 10) })}
                                    className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Volume and Kick Audio Controls */}
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Volume2 size={11} className="text-rose-400" />
                                <span>Heart Sound Volume</span>
                            </span>
                            <span className="text-[9px] font-mono font-bold text-rose-300">{Math.round(volume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={(e) => onChange({ ...config, enabled: true, volume: parseFloat(e.target.value) })}
                            className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />

                        <div className="pt-1 flex items-center justify-between border-t border-white/5">
                            <span className="text-[8.5px] text-slate-300">Acoustic Thud Resonance</span>
                            <button
                                type="button"
                                onClick={() => onChange({ ...config, enabled: true, kickEnabled: !kickEnabled })}
                                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors border ${
                                    kickEnabled
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                        : 'bg-white/5 text-slate-500 border-white/5'
                                }`}
                            >
                                {kickEnabled ? 'Audible' : 'Silent Pulse'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
