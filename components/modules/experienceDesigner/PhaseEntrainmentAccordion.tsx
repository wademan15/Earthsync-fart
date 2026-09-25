import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { BlockEntrainmentConfig } from '../../../services/audio/experienceDesigner';
import { ENTRAINMENT_MODES } from '../visuals/shared';
import { EntrainmentLayer } from '../../../services/audio/AudioTypes';
import { EntrainmentLayerSelector } from '../designers/EntrainmentLayerSelector';

interface Props {
    config?: BlockEntrainmentConfig;
    onChange: (cfg: BlockEntrainmentConfig) => void;
    globalFreq?: number;
    globalLayers?: EntrainmentLayer[];
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

export const PhaseEntrainmentAccordion: React.FC<Props> = ({
    config,
    onChange,
    globalFreq = 8.0,
    globalLayers = ['binaural'],
    isOpen: controlledOpen,
    onToggleOpen
}) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const handleToggle = () => {
        if (onToggleOpen) onToggleOpen();
        else setInternalOpen(!isOpen);
    };
    const [isFreqDropdownOpen, setIsFreqDropdownOpen] = useState(false);
    const [customInput, setCustomInput] = useState('');

    const isEnabled = config?.enabled ?? false;
    const activeFreq = config?.frequencyHz ?? globalFreq;
    const activeLayers: EntrainmentLayer[] = config?.layers ?? globalLayers;

    const toggleEnabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({
            ...config,
            enabled: !isEnabled,
            frequencyHz: activeFreq,
            layers: activeLayers
        });
    };

    const handleSelectFreq = (freq: number) => {
        onChange({
            ...config,
            enabled: true,
            frequencyHz: freq,
            layers: activeLayers
        });
        setIsFreqDropdownOpen(false);
    };

    const handleApplyCustomFreq = () => {
        const val = parseFloat(customInput);
        if (!isNaN(val) && val > 0 && val <= 1000) {
            handleSelectFreq(val);
            setCustomInput('');
        }
    };

    const handleToggleLayer = (layer: EntrainmentLayer) => {
        let next: EntrainmentLayer[];
        if (activeLayers.includes(layer)) {
            next = activeLayers.filter(l => l !== layer);
        } else {
            next = [...activeLayers, layer];
        }
        onChange({
            ...config,
            enabled: true,
            frequencyHz: activeFreq,
            layers: next
        });
    };

    const getLayerLabel = () => {
        if (activeLayers.length === 3) return 'TRIPLE (ALL)';
        if (activeLayers.length === 2) {
            return activeLayers.map(l => l.substring(0, 3).toUpperCase()).join('+');
        }
        if (activeLayers.length === 1) {
            return activeLayers[0]?.substring(0, 3).toUpperCase();
        }
        return 'PURE';
    };

    const activeModeObj = ENTRAINMENT_MODES.find(m => Math.abs(m.freq - activeFreq) < 0.01);

    return (
        <div className="border border-indigo-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(99,102,241,0.08)]">
            {/* Tinted Accordion Header */}
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-slate-950/90 hover:from-indigo-950/90 hover:via-slate-900 transition-all select-none border-b border-indigo-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className={`w-8 h-8 rounded-lg border transition-colors flex items-center justify-center shrink-0 self-center ${
                        isEnabled
                            ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                            : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                        <Brain size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                                Brainwave Entrainment
                            </span>
                            {isEnabled ? (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                                    {activeFreq.toFixed(2)} Hz · {getLayerLabel()}
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 shrink-0">
                                    Global ({globalFreq.toFixed(2)} Hz)
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] text-indigo-300/85 block leading-normal">
                            {activeModeObj ? `${activeModeObj.name} brainwave target` : 'Custom neural frequency sync'} · {activeLayers.length > 0 ? activeLayers.join(' + ') : 'Pure Tone'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                        type="button"
                        onClick={toggleEnabled}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
                            isEnabled
                                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isEnabled ? "Phase overrides entrainment frequency" : "Inheriting global entrainment"}
                    >
                        {isEnabled ? 'Custom' : 'Inherit'}
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-3.5 bg-black/40 border-t border-white/5">
                    {/* Frequency Selector: Exact same drop down menu as in the entrainment pill */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-indigo-300 tracking-wider flex items-center justify-between">
                            <span>Target Brainwave Frequency</span>
                            <span className="text-indigo-300 font-mono font-bold">{activeFreq.toFixed(2)} Hz</span>
                        </label>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsFreqDropdownOpen(!isFreqDropdownOpen)}
                                className="w-full flex items-center justify-between bg-black/50 border border-white/10 hover:border-indigo-500/40 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-200 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Radio size={12} className="text-indigo-400" />
                                    <span>{activeFreq.toFixed(2)} Hz</span>
                                    <span className="text-[9px] text-indigo-300/80 font-normal uppercase">
                                        ({activeModeObj?.name || 'Custom'})
                                    </span>
                                </div>
                                <ChevronDown size={12} className="text-slate-400" />
                            </button>

                            {/* Dropdown Menu matching TunerBottomPill */}
                            {isFreqDropdownOpen && (
                                <div className="mt-1 w-full bg-slate-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden z-20 flex flex-col">
                                    <div className="p-2.5 border-b border-white/10 bg-white/[0.02]">
                                        <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5 flex items-center justify-between">
                                            <span>Custom Frequency</span>
                                            <span className="font-mono text-[9px] text-slate-400">0.01 – 100 Hz</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max="1000"
                                                value={customInput}
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomFreq()}
                                                placeholder="e.g. 7.83"
                                                className="w-full bg-black/60 border border-indigo-500/40 rounded px-2 py-1 text-xs font-mono font-bold text-indigo-200 focus:outline-none focus:border-indigo-400 text-center"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCustomFreq}
                                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm shrink-0"
                                            >
                                                Set
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-2.5 py-1.5 bg-black/40 border-b border-white/5">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Brainwave Presets</span>
                                    </div>

                                    <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                                        {ENTRAINMENT_MODES.map((mode) => (
                                            <div
                                                key={mode.name}
                                                onClick={() => handleSelectFreq(mode.freq)}
                                                className={`px-3 py-2 text-[10px] font-mono hover:bg-white/10 flex justify-between items-center transition-colors cursor-pointer ${
                                                    Math.abs(activeFreq - mode.freq) < 0.001 ? 'bg-indigo-900/30 text-indigo-300 font-bold' : 'text-slate-300'
                                                }`}
                                            >
                                                <span>{mode.freq.toFixed(3)} Hz</span>
                                                <span className="opacity-70 text-[9px] uppercase tracking-wider">{mode.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Entrainment Mode Layer Selector (Isochronic, Binaural, Monaural, or All) */}
                    <div className="space-y-1.5 pt-1">
                        <label className="text-[9px] font-bold uppercase text-indigo-300 tracking-wider block">
                            Entrainment Architecture (Choose Single, Dual, or All)
                        </label>
                        <EntrainmentLayerSelector
                            activeLayers={activeLayers}
                            onToggleLayer={handleToggleLayer}
                            variant="inline"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
