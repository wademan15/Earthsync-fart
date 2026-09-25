import React, { useState } from 'react';
import { Network, ChevronDown, ChevronUp, Sparkles, Gem, SlidersHorizontal } from 'lucide-react';
import { BlockMatrixConfig, BlockCrystalConfig } from '../../../services/audio/experienceDesigner';
import { COMPOSER_WARP_PRESETS } from '../PlanetaryTunerModule';

interface Props {
    matrixConfig?: BlockMatrixConfig;
    crystalConfig?: BlockCrystalConfig;
    onMatrixChange: (cfg: BlockMatrixConfig) => void;
    onCrystalChange: (cfg: BlockCrystalConfig) => void;
    globalWarp?: string;
    globalCrystalTopology?: 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE';
    globalCrystalEnabled?: boolean;
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

const CRYSTAL_TOPOLOGIES = [
    { id: 'FIBONACCI', name: 'Fibonacci', tag: 'Golden Ratio 1.618' },
    { id: 'PRIME', name: 'Prime Numbers', tag: 'Aperiodic distribution' },
    { id: 'THUE_MORSE', name: 'Thue-Morse', tag: 'Fractal parity sequence' },
    { id: 'PERIOD_DOUBLE', name: 'Period Doubling', tag: 'Feigenbaum chaos edge' },
] as const;

export const PhaseMatrixCrystalAccordion: React.FC<Props> = ({
    matrixConfig,
    crystalConfig,
    onMatrixChange,
    onCrystalChange,
    globalWarp = 'LINEAR',
    globalCrystalTopology = 'FIBONACCI',
    globalCrystalEnabled = false,
    isOpen: controlledOpen,
    onToggleOpen
}) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const handleToggle = () => {
        if (onToggleOpen) onToggleOpen();
        else setInternalOpen(!isOpen);
    };

    const isMatrixEnabled = matrixConfig?.enabled ?? false;
    const activeWarp = matrixConfig?.composerWarp || globalWarp;
    const activeIntensity = matrixConfig?.intensity ?? 0.7;

    const isCrystalEnabled = crystalConfig?.enabled ?? false;
    const activeTopology = crystalConfig?.topology || globalCrystalTopology;
    const isCrystalActive = crystalConfig?.isTimeCrystal ?? globalCrystalEnabled;

    const toggleMatrixEnabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMatrixChange({
            ...matrixConfig,
            enabled: !isMatrixEnabled,
            composerWarp: activeWarp,
            intensity: activeIntensity
        });
    };

    const handleSelectWarp = (warpId: string) => {
        onMatrixChange({
            ...matrixConfig,
            enabled: true,
            composerWarp: warpId
        });
    };

    const handleIntensityChange = (val: number) => {
        onMatrixChange({
            ...matrixConfig,
            enabled: true,
            intensity: val
        });
    };

    const handleSelectTopology = (topoId: 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE') => {
        onCrystalChange({
            ...crystalConfig,
            enabled: true,
            isTimeCrystal: true,
            topology: topoId
        });
    };

    const toggleCrystalActive = () => {
        onCrystalChange({
            ...crystalConfig,
            enabled: true,
            isTimeCrystal: !isCrystalActive,
            topology: activeTopology
        });
    };

    const isAnyEnabled = isMatrixEnabled || isCrystalEnabled;

    return (
        <div className="border border-fuchsia-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(217,70,239,0.08)]">
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-fuchsia-950/70 via-slate-900/90 to-slate-950/90 hover:from-fuchsia-950/90 hover:via-slate-900 transition-all select-none border-b border-fuchsia-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className={`w-8 h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 self-center ${
                        isAnyEnabled
                            ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.25)]'
                            : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                        <Network size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-fuchsia-200 uppercase tracking-wider">
                                Matrix & Crystal Lattice
                            </span>
                            {isAnyEnabled ? (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shrink-0">
                                    {isMatrixEnabled ? (COMPOSER_WARP_PRESETS.find(p => p.id === activeWarp)?.name || activeWarp) : 'Warp Off'} · {isCrystalEnabled ? 'Crystal' : 'Wave'}
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                    Global ({COMPOSER_WARP_PRESETS.find(p => p.id === globalWarp)?.name || 'Linear'})
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] text-fuchsia-300/85 block leading-normal">
                            Composer micro-timing warp & quantum time-crystal topology
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                        type="button"
                        onClick={toggleMatrixEnabled}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
                            isAnyEnabled
                                ? 'bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-500/50 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isAnyEnabled ? "Phase overrides matrix timing" : "Inheriting global timing matrix"}
                    >
                        {isAnyEnabled ? 'Custom' : 'Inherit'}
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-3.5 bg-black/40 border-t border-white/5">
                    {/* Composer Warp Matrix */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase text-fuchsia-300 tracking-wider flex items-center gap-1">
                                <Sparkles size={11} className="text-fuchsia-400" />
                                <span>Pulse Matrix (Composer Micro-Timing)</span>
                            </label>
                            <span className="text-[9px] font-mono text-fuchsia-300 font-bold">
                                {COMPOSER_WARP_PRESETS.find(p => p.id === activeWarp)?.name || 'Linear'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {COMPOSER_WARP_PRESETS.map((item) => {
                                const isSelected = activeWarp === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectWarp(item.id)}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200 shadow-sm'
                                                : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="font-bold leading-tight">{item.name}</span>
                                        <span className="text-[7.5px] text-slate-400 leading-tight">{item.tag}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sentic Fluidity / Warp Intensity Slider */}
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1 mt-1.5">
                            <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1">
                                    <SlidersHorizontal size={10} className="text-fuchsia-400" />
                                    <span>Micro-Timing Fluidity Intensity</span>
                                </span>
                                <span className="font-mono text-fuchsia-300 font-bold">
                                    {Math.round(activeIntensity * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={activeIntensity}
                                onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                                className="w-full accent-fuchsia-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Time Crystal Topology */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase text-cyan-300 tracking-wider flex items-center gap-1">
                                <Gem size={11} className="text-cyan-400" />
                                <span>Time Crystal Aperiodic Topology</span>
                            </label>
                            <button
                                type="button"
                                onClick={toggleCrystalActive}
                                className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-colors border ${
                                    isCrystalActive
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                                        : 'bg-white/5 text-slate-500 border-white/5'
                                }`}
                            >
                                {isCrystalActive ? 'Lattice Active' : 'Off'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {CRYSTAL_TOPOLOGIES.map((topo) => {
                                const isSelected = activeTopology === topo.id;
                                return (
                                    <button
                                        key={topo.id}
                                        type="button"
                                        onClick={() => handleSelectTopology(topo.id)}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-sm'
                                                : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="font-bold leading-tight">{topo.name}</span>
                                        <span className="text-[7.5px] text-slate-400 leading-tight">{topo.tag}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
