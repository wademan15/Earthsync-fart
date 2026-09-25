import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Palette, Activity, Network, Waves, Link2, Unlink, Gauge } from 'lucide-react';
import { BlockPulseConfig } from '../../../services/audio/experienceDesigner';
import { PULSE_PRESETS } from '../PlanetaryTunerModule';

interface Props {
    config?: BlockPulseConfig;
    onChange: (cfg: BlockPulseConfig) => void;
    globalPulseStyle?: string;
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

export const PhasePulseAccordion: React.FC<Props> = ({
    config,
    onChange,
    globalPulseStyle = 'BLACK_SHUTTER',
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
    const activeStyle = config?.pulseStyle || globalPulseStyle;
    const activePreset = PULSE_PRESETS.find(p => p.id === activeStyle) || PULSE_PRESETS[0];

    const customColor = config?.pulseCustomColor || '#06b6d4';
    const waveform = config?.pulseWaveform || 'SINE';
    const depth = config?.depth ?? 0.85;
    const isTcSync = Boolean(config?.pulseSync === 'TIME_CRYSTAL' || config?.syncWithTimeCrystal);
    const isUncoupled = Boolean(config?.isUncoupled);
    const customRate = typeof config?.customRateHz === 'number' ? config.customRateHz : 7.83;
    const tcTopology = config?.timeCrystalTopology || 'FIBONACCI';

    const toggleEnabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({
            ...config,
            enabled: !isEnabled,
            pulseStyle: activeStyle,
            pulseCustomColor: customColor,
            pulseWaveform: waveform,
            depth: depth,
            pulseSync: isTcSync ? 'TIME_CRYSTAL' : 'BINAURAL',
            syncWithTimeCrystal: isTcSync,
            isUncoupled: isUncoupled,
            customRateHz: customRate,
            timeCrystalTopology: tcTopology
        });
    };

    const handleCouplingChange = (uncouple: boolean) => {
        onChange({
            ...config,
            enabled: true,
            isUncoupled: uncouple,
            customRateHz: customRate,
            timeCrystalTopology: tcTopology
        });
    };

    const handleSyncChange = (mode: 'BINAURAL' | 'TIME_CRYSTAL') => {
        onChange({
            ...config,
            enabled: true,
            pulseSync: mode,
            syncWithTimeCrystal: mode === 'TIME_CRYSTAL'
        });
    };

    const handleTopologyChange = (top: 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE') => {
        onChange({
            ...config,
            enabled: true,
            pulseSync: 'TIME_CRYSTAL',
            syncWithTimeCrystal: true,
            timeCrystalTopology: top
        });
    };

    const handleSelectStyle = (styleId: string) => {
        onChange({
            ...config,
            enabled: true,
            pulseStyle: styleId
        });
    };

    const handleWaveformChange = (w: string) => {
        onChange({
            ...config,
            enabled: true,
            pulseWaveform: w
        });
    };

    const handleDepthChange = (d: number) => {
        onChange({
            ...config,
            enabled: true,
            depth: d
        });
    };

    const handleCustomColorChange = (color: string) => {
        onChange({
            ...config,
            enabled: true,
            pulseStyle: 'CUSTOM_COLOR',
            pulseCustomColor: color
        });
    };

    return (
        <div className="border border-amber-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(245,158,11,0.08)]">
            {/* Tinted Accordion Header */}
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-slate-950/90 hover:from-amber-950/90 hover:via-slate-900 transition-all select-none border-b border-amber-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className={`w-8 h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 self-center ${
                        isEnabled
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                            : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                        <Zap size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                                Visual Pulse & Strobe
                            </span>
                            {isEnabled ? (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                                        style={{ backgroundColor: activeStyle === 'CUSTOM_COLOR' ? customColor : activePreset.color }}
                                    />
                                    <span>{activeStyle === 'CUSTOM_COLOR' ? 'Custom' : activePreset.name}</span>
                                    <span>· {Math.round(depth * 100)}%</span>
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                    Global ({PULSE_PRESETS.find(p => p.id === globalPulseStyle)?.name || 'Black Dim'})
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] text-amber-300/85 block leading-normal">
                            Retinal stroboscopic photostimulation & depth modulation
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                        type="button"
                        onClick={toggleEnabled}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
                            isEnabled
                                ? 'bg-amber-600/30 text-amber-200 border-amber-500/50 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isEnabled ? "Phase overrides pulse style" : "Inheriting global visual pulse"}
                    >
                        {isEnabled ? 'Custom' : 'Inherit'}
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-3.5 bg-black/40 border-t border-white/5">
                    {/* Retinal Strobe & Bloom Preset Grid */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-amber-300 tracking-wider block">
                            Retinal Strobe & Bloom Preset
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {PULSE_PRESETS.map((item) => {
                                const isSelected = activeStyle === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectStyle(item.id)}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                                                : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="min-w-0 mr-1.5">
                                            <span className="font-bold block leading-tight">{item.name}</span>
                                            <span className="text-[7.5px] text-slate-400 block leading-tight">{item.tag}</span>
                                        </div>
                                        <span
                                            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                            style={{
                                                backgroundColor: item.color,
                                                boxShadow: isSelected ? `0 0 8px ${item.iconColor}` : 'none'
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Tint Color */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Palette size={11} className="text-amber-400" />
                                <span>Custom Tint Color</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => handleCustomColorChange(e.target.value)}
                                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                                    title="Pick Custom Color"
                                />
                                <span className="font-mono text-[9px] text-amber-400 font-bold">
                                    {customColor}
                                </span>
                            </div>
                        </div>

                        {/* Audio Coupling Toggle: Coupled vs Uncoupled */}
                        <div className="space-y-1 pt-1 border-t border-white/10">
                            <div className="flex justify-between text-[8.5px] uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1.5 font-semibold">
                                    {isUncoupled ? (
                                        <Unlink size={11} className="text-amber-400" />
                                    ) : (
                                        <Link2 size={11} className="text-cyan-400" />
                                    )}
                                    <span>Audio Coupling</span>
                                </span>
                                <span className={`font-mono font-bold text-[8px] ${isUncoupled ? 'text-amber-400' : 'text-cyan-400'}`}>
                                    {isUncoupled ? 'Uncoupled (Visual Only)' : 'Coupled to Audio'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleCouplingChange(false)}
                                    className={`py-1 px-2 text-[8px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors border ${
                                        !isUncoupled
                                            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/50'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                    }`}
                                >
                                    <Link2 size={10} className={!isUncoupled ? "text-cyan-300" : "text-slate-400"} />
                                    <span>Coupled</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCouplingChange(true)}
                                    className={`py-1 px-2 text-[8px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors border ${
                                        isUncoupled
                                            ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                    }`}
                                >
                                    <Unlink size={10} className={isUncoupled ? "text-amber-300" : "text-slate-400"} />
                                    <span>Uncouple</span>
                                </button>
                            </div>

                            {/* Uncoupled Frequency Slider */}
                            {isUncoupled && (
                                <div className="bg-amber-950/20 p-2 rounded-lg border border-amber-500/20 space-y-1 mt-1">
                                    <div className="flex justify-between text-[7.5px] uppercase tracking-wider text-amber-400">
                                        <span className="flex items-center gap-1">
                                            <Gauge size={10} className="text-amber-400" />
                                            <span>Visual Pulse Frequency</span>
                                        </span>
                                        <span className="font-mono font-bold text-[8px] text-amber-300">
                                            {customRate.toFixed(2)} Hz
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="30"
                                        step="0.1"
                                        value={customRate}
                                        onChange={(e) => onChange({
                                            ...config,
                                            enabled: true,
                                            isUncoupled: true,
                                            customRateHz: parseFloat(e.target.value)
                                        })}
                                        className="w-full accent-amber-400 h-1 bg-white/10 rounded cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[7px] text-slate-400 font-mono pt-0.5">
                                        <button 
                                            type="button"
                                            onClick={() => onChange({ ...config, enabled: true, isUncoupled: true, customRateHz: 4.0 })}
                                            className="hover:text-amber-300"
                                        >
                                            4Hz
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => onChange({ ...config, enabled: true, isUncoupled: true, customRateHz: 7.83 })}
                                            className="hover:text-amber-300"
                                        >
                                            7.83Hz
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => onChange({ ...config, enabled: true, isUncoupled: true, customRateHz: 10.0 })}
                                            className="hover:text-amber-300"
                                        >
                                            10Hz
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => onChange({ ...config, enabled: true, isUncoupled: true, customRateHz: 14.0 })}
                                            className="hover:text-amber-300"
                                        >
                                            14Hz
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rhythm Pattern: Binaural / Continuous vs Time Crystal */}
                        <div className="space-y-1 pt-1 border-t border-white/10">
                            <div className="flex justify-between text-[8.5px] uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Network size={11} className={isTcSync ? "text-emerald-400" : "text-slate-400"} />
                                    <span>Rhythm Pattern</span>
                                </span>
                                <span className={`font-mono font-bold text-[8px] ${isTcSync ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                    {isTcSync ? `Time Crystal (${tcTopology.substring(0, 4)})` : (isUncoupled ? 'Continuous Wave' : 'Binaural Beat')}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleSyncChange('BINAURAL')}
                                    className={`py-1 px-2 text-[8px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors border ${
                                        !isTcSync
                                            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/50'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                    }`}
                                >
                                    <Waves size={10} className={!isTcSync ? "text-cyan-300" : "text-slate-400"} />
                                    <span>{isUncoupled ? 'Continuous Wave' : 'Binaural Beat'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSyncChange('TIME_CRYSTAL')}
                                    className={`py-1 px-2 text-[8px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors border ${
                                        isTcSync
                                            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                    }`}
                                >
                                    <Network size={10} className={isTcSync ? "text-emerald-300" : "text-slate-400"} />
                                    <span>Time Crystal</span>
                                </button>
                            </div>

                            {/* Crystal Topology Selector */}
                            {isTcSync && (
                                <div className="pt-1 space-y-1 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20 mt-1">
                                    <div className="flex justify-between text-[7.5px] uppercase tracking-wider text-emerald-400">
                                        <span>Topology Pattern</span>
                                        <span className="text-emerald-300 font-mono text-[7.5px] font-bold">
                                            {tcTopology}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {(['FIBONACCI', 'PRIME', 'THUE_MORSE', 'PERIOD_DOUBLE'] as const).map((top) => {
                                            const isTopActive = tcTopology === top;
                                            const label = top === 'FIBONACCI' ? 'Fibo' : top === 'PRIME' ? 'Prime' : top === 'THUE_MORSE' ? 'Thue' : '2T';
                                            return (
                                                <button
                                                    key={top}
                                                    type="button"
                                                    onClick={() => handleTopologyChange(top)}
                                                    className={`py-1 text-[8px] font-mono font-bold rounded transition-colors border ${
                                                        isTopActive
                                                            ? 'bg-emerald-500/35 text-emerald-200 border-emerald-500/70 shadow-xs'
                                                            : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Waveform Selector */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[8.5px] uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Activity size={11} className="text-amber-400" />
                                    <span>Waveform Rhythm</span>
                                </span>
                                <span className="text-amber-400 font-mono font-bold">
                                    {waveform}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {['SINE', 'STROBE', 'TRIANGLE', 'HEARTBEAT'].map((w) => {
                                    const isWActive = waveform === w;
                                    return (
                                        <button
                                            key={w}
                                            type="button"
                                            onClick={() => handleWaveformChange(w)}
                                            className={`py-1 text-[8.5px] font-bold rounded transition-colors border ${
                                                isWActive
                                                    ? 'bg-amber-500/30 text-amber-200 border-amber-500/60 shadow-xs'
                                                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                            }`}
                                        >
                                            {w}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pulse Intensity / Depth Fader */}
                        <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[8.5px] uppercase tracking-wider text-slate-400">
                                <span>Pulse Depth / Intensity</span>
                                <span className="text-amber-400 font-mono font-bold">
                                    {Math.round(depth * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0.1}
                                max={1.0}
                                step={0.05}
                                value={depth}
                                onChange={(e) => handleDepthChange(parseFloat(e.target.value))}
                                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
