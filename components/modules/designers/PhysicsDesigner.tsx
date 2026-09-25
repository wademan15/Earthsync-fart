import React, { useState } from 'react';
import { 
    Hexagon, Wind, Orbit, Maximize, Layers, RotateCcw, ArrowDown, 
    Lightbulb, Waves, Activity, Palette, PenTool, Grid, Sparkles,
    Save, ChevronDown, Trash2, Atom, Sun, Spline, Paintbrush, 
    Droplet, Zap, RefreshCcw, Code, CheckCheck, MoveVertical, 
    MoveHorizontal, ArrowUp, Circle, Target, Cloud, Sliders, Minus,
    Clock, Eye, Maximize2
} from 'lucide-react';
import { LatticeGlobalConfig, ModulationNode, VisualizerBus } from '../visuals/shared';
import { UIConfig } from '../../system/StyleEditor';
// UPDATED IMPORT HERE:
import { VISUALIZER_MODES, VISUALIZER_PLUGINS } from '../visuals/VisualizerRegistry';
import { ModulationFader } from '../../ui/Faders';

export interface PhysicsPreset { 
    id: string; 
    name: string; 
    mode: string; 
    config: LatticeGlobalConfig; 
    modulations?: Record<string, ModulationNode>; 
}

export interface LatticeController { 
    latticeConfig: LatticeGlobalConfig; 
    activePhysicsMode: string; 
    activePhysicsPresetId: string; 
    physicsLibrary: PhysicsPreset[]; 
    setLatticeConfig: React.Dispatch<React.SetStateAction<LatticeGlobalConfig>>; 
    setMode: (mode: string) => Record<string, ModulationNode>; 
    setActivePhysicsPresetId: React.Dispatch<React.SetStateAction<string>>; 
    loadPreset: (id: string) => PhysicsPreset | null; 
    savePreset: (name: string, config: LatticeGlobalConfig, mods: Record<string, ModulationNode>) => void; 
    deletePreset: (id: string) => void; 
}

export interface ModulationController { 
    modulations: Record<string, ModulationNode>; 
    modMap: Record<string, boolean>; 
    setModulations: React.Dispatch<React.SetStateAction<Record<string, ModulationNode>>>; 
    handleModulationChange: (key: string, node: ModulationNode) => void; 
    toggleMod: (key: string) => void; 
}

interface Props { 
    lattice: LatticeController; 
    modulation: ModulationController; 
    uiConfig: UIConfig; 
    bus?: VisualizerBus;
    hasSensors?: boolean; 
}

const ICON_MAP: Record<string, React.ElementType> = { Hexagon, Wind, Orbit, Maximize, Maximize2, Layers, RotateCcw, ArrowDown, Lightbulb, Waves, Activity, Palette, PenTool, Grid, Sparkles, Atom, Sun, Spline, Paintbrush, Droplet, Zap, RefreshCcw, MoveVertical, MoveHorizontal, ArrowUp, Circle, Target, Cloud, Sliders, Minus, Clock, Eye };
const SECTION_ICONS: Record<string, React.ElementType> = { GEOMETRY: Hexagon, PHYSICS: Atom, WAVES: Waves, LIGHT: Palette, CORE: Sparkles, COLOR: Palette, EQUATION: Code, PROJECTION: Target, TEXTURE: Grid };

export const PhysicsDesigner: React.FC<Props> = ({ lattice, modulation, uiConfig, bus, hasSensors = true }) => {
    const { latticeConfig, activePhysicsMode, physicsLibrary, activePhysicsPresetId } = lattice;
    const { modulations, handleModulationChange } = modulation;

    const update = (key: string, val: string | number | boolean) => lattice.setLatticeConfig(prev => ({ ...prev, [key]: val }));
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');

    const activePlugin = VISUALIZER_PLUGINS[activePhysicsMode];
    const filteredPresets = physicsLibrary.filter(p => p.mode === activePhysicsMode);
    const activePreset = physicsLibrary.find(p => p.id === activePhysicsPresetId);
    const displayPresetName = activePreset ? activePreset.name : 'Custom';
    const isFactory = (id: string) => !id.startsWith('user_');

    if (!activePlugin) {
        return <div className="p-4 text-slate-400 text-xs uppercase tracking-widest font-bold">Visualizer Cartridge Not Found</div>;
    }

    const handleSelectPreset = (p: PhysicsPreset) => {
        const loaded = lattice.loadPreset(p.id);
        if (loaded) modulation.setModulations(loaded.modulations || {});
        setIsMenuOpen(false);
    };

    const handleSetMode = (mode: string) => {
        const newMods = lattice.setMode(mode);
        modulation.setModulations(newMods);
    };

    const executeSave = () => {
        if (!saveName) return;
        lattice.savePreset(saveName, { ...latticeConfig }, modulations);
        setShowSaveModal(false);
        setSaveName('');
    };

    const handleCopyCode = () => {
        const formatValue = (v: unknown) => { 
            if (typeof v === 'string') return `'${v}'`; 
            if (typeof v === 'number') return Number(v.toFixed(3)).toString(); 
            return v; 
        };
        const fullConfig = { ...latticeConfig };
        const cleanConfig = Object.entries(fullConfig)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ');
        
        const cleanMods = Object.entries(modulations)
            .filter(([, v]) => v && v.enabled)
            .map(([k, v]) => { 
                const modProps = Object.entries(v)
                    .filter(([mk, mv]) => mv !== undefined && mv !== null && mk !== 'enabled')
                    .map(([mk, mv]) => `${mk}: ${formatValue(mv)}`)
                    .join(', '); 
                return `${k}: { enabled: true, ${modProps} }`; 
            }).join(',\n            ');
            
        const modsBlock = cleanMods.length > 0 ? `,\n        modulations: {\n            ${cleanMods}\n        }` : '';
        const codeStr = `    "${displayPresetName.replace(/^[0-9]{2}\s/, '')}": { category: "Custom", config: { ${cleanConfig} }${modsBlock} },`;
        
        navigator.clipboard.writeText(codeStr);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const renderControl = (param: Record<string, unknown>) => {
        const val = (latticeConfig as Record<string, unknown>)[param.id as string] ?? param.defaultValue;
        const ControlIcon = ICON_MAP[param.icon || 'Activity'] || Activity;

        if (param.type === 'CUSTOM_TOGGLE') {
            const options = (param.options as string[]) || ['ON', 'OFF'];

            // If there are more than 2 options, display a selector dropdown so the user can directly choose any option
            if (options.length > 2) {
                return (
                    <div key={param.id} className="flex justify-between items-center pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <ControlIcon size={12} className="text-slate-400" />
                            <span className="text-[10px] opacity-70" style={{ color: uiConfig.textColor }}>{param.label}</span>
                        </div>
                        <select 
                            value={val as string} 
                            onChange={(e) => update(param.id, e.target.value)} 
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[8px] uppercase text-slate-300 focus:outline-none focus:border-amber-500"
                        >
                            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                );
            }

            const opt1 = options[0] || 'ON';
            const opt2 = options[1] || 'OFF';
            
            const isOpt1 = (typeof val === 'boolean') ? val === true : val === opt1;
            const displayStr = (typeof val === 'boolean') ? (val ? opt1 : opt2) : String(val);

            const colorMap: Record<string, string> = {
                cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
                indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
                purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
            };
            const activeClass = colorMap[param.color as string || 'cyan'] || colorMap.cyan;

            return (
                <div key={param.id} className="flex justify-between items-center pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <ControlIcon size={12} className="text-slate-400" />
                        <span className="text-[10px] opacity-70" style={{ color: uiConfig.textColor }}>{param.label}</span>
                    </div>
                    <button 
                        onClick={() => update(param.id, typeof val === 'boolean' ? !val : (isOpt1 ? opt2 : opt1))} 
                        className={`px-2 py-1 rounded text-[8px] font-bold uppercase border transition-all ${isOpt1 ? activeClass : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                    >
                        {displayStr}
                    </button>
                </div>
            );
        }

        if (param.type === 'SELECT') {
            return (
                <div key={param.id} className="flex justify-between items-center pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <ControlIcon size={12} className="text-slate-400" />
                        <span className="text-[10px] opacity-70" style={{ color: uiConfig.textColor }}>{param.label}</span>
                    </div>
                    <select 
                        value={val as string} 
                        onChange={(e) => update(param.id, e.target.value)} 
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[8px] uppercase text-slate-300 focus:outline-none focus:border-amber-500"
                    >
                        {param.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            );
        }

        if (param.type === 'COLOR') {
            return (
                <div key={param.id} className="flex justify-between items-center pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <ControlIcon size={12} className="text-slate-400" />
                        <span className="text-[10px] opacity-70" style={{ color: uiConfig.textColor }}>{param.label}</span>
                    </div>
                    <input 
                        type="color" 
                        value={val as string} 
                        onChange={(e) => update(param.id, e.target.value)} 
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" 
                    />
                </div>
            );
        }

        if (param.type === 'COLOR_PALETTE') {
            return (
                <div key={param.id} className="flex justify-start items-center gap-2 pt-3 pb-2 border-t border-white/5">
                    {param.options?.map((colorId: string) => {
                        const cVal = (latticeConfig as Record<string, unknown>)[colorId] ?? '#ffffff';
                        return (
                            <div key={colorId} className="w-12 h-6 bg-white p-[2px] rounded-sm">
                                <input 
                                    type="color" 
                                    value={cVal as string} 
                                    onChange={(e) => update(colorId, e.target.value)} 
                                    className="w-full h-full cursor-pointer border-0 p-0 block" 
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (param.type === 'EQUATION_TEXT') {
            return (
                <div key={param.id} className="pt-3 pb-2 border-t border-white/5">
                    <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                        {param.label}
                    </div>
                </div>
            );
        }

        const displayVal = param.max <= 1.0 ? `${(Number(val) * 100).toFixed(0)}%` : Number(val).toFixed(2);
        
        return (
            <div key={param.id} className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                        <ControlIcon size={10} className="text-slate-500"/> {param.label}
                    </span>
                    <span style={{color: uiConfig.primaryColor}}>{displayVal}</span>
                </div>
                <ModulationFader 
                    value={Number(val)} 
                    min={param.min!} 
                    max={param.max!} 
                    step={param.step!} 
                    onStaticChange={(v: number) => update(param.id, v)} 
                    color={param.color || '#94a3b8'} 
                    uiConfig={uiConfig} 
                    modNode={modulations[param.id]} 
                    onModChange={(n: ModulationNode) => handleModulationChange(param.id, n)} 
                    bus={bus} 
                    paramKey={param.id}
                    hasSensors={hasSensors}
                />
            </div>
        );
    };

    return (
        <div className="p-3 border rounded space-y-4" style={{ backgroundColor: `rgba(${uiConfig.cardRgb}, 0.2)`, borderColor: `rgba(${uiConfig.borderRgb}, 0.1)` }}>
            <div className="pb-2 border-b border-white/5 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">1. Select Visual Engine</span>
                <div className="relative">
                    <select 
                        value={activePhysicsMode} 
                        onChange={(e) => handleSetMode(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] appearance-none focus:outline-none focus:border-amber-500 uppercase font-bold tracking-wider" 
                        style={{ color: uiConfig.textColor }}
                    >
                        {VISUALIZER_MODES.map(m => <option key={m} value={m} className="bg-slate-950 text-slate-200">{VISUALIZER_PLUGINS[m].name}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: uiConfig.textColor }}/>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-2 border-b border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block shrink-0">2. Load Preset</span>
                <div className="relative flex-1">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="w-full flex items-center justify-between rounded-md px-2 py-1 border hover:opacity-100 opacity-80 text-[10px] font-mono transition-all" 
                        style={{ backgroundColor: `rgba(${uiConfig.borderRgb}, 0.1)`, borderColor: `rgba(${uiConfig.borderRgb}, 0.2)`, color: uiConfig.textColor }}
                    >
                        <span className="truncate">{displayPresetName.replace(/^[0-9]{2}\s/, '')}</span>
                        <ChevronDown size={10} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-1 border rounded-md shadow-xl z-40 max-h-64 overflow-y-auto" style={{ backgroundColor: `rgb(${uiConfig.cardRgb})`, borderColor: `rgba(${uiConfig.borderRgb}, 0.5)` }}>
                                {filteredPresets.length === 0 ? (
                                    <div className="px-2 py-1 text-[9px] text-slate-500 italic">No presets saved.</div>
                                ) : (
                                    filteredPresets.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between hover:bg-white/5 group px-1 border-b border-white/5 last:border-0">
                                            <button 
                                                onClick={() => handleSelectPreset(p)} 
                                                className="flex-1 text-left py-2 px-2 text-[10px] font-mono hover:opacity-100 opacity-70 truncate" 
                                                style={{ color: uiConfig.textColor }}
                                            >
                                                {p.name.replace(/^[0-9]{2}\s/, '')}
                                            </button>
                                            {!isFactory(p.id) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); lattice.deletePreset(p.id); }} 
                                                    className="p-1 opacity-50 hover:opacity-100 hover:text-red-400 transition-colors" 
                                                    style={{ color: uiConfig.textColor }}
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
                <button 
                    onClick={handleCopyCode} 
                    className={`p-1 rounded border transition-all ${copySuccess ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}`} 
                    title="Copy TypeScript Code"
                >
                    <div className="flex items-center gap-1">{copySuccess ? <CheckCheck size={12} /> : <Code size={12} />}</div>
                </button>
                <button 
                    onClick={() => setShowSaveModal(true)} 
                    className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20" 
                    title="Save Preset"
                >
                    <Save size={12} />
                </button>
            </div>
            
            <div className="space-y-4">
                 {Array.from(new Set(activePlugin.parameters.map(p => p.section))).map(sectionKey => {
                     const sectionParams = activePlugin.parameters.filter(p => p.section === sectionKey);
                     if (sectionParams.length === 0) return null;
                     
                     // Look for a predefined icon, otherwise default to Activity
                     const SectionIcon = SECTION_ICONS[sectionKey as keyof typeof SECTION_ICONS] || Activity;
                     
                     return (
                         <div key={sectionKey} className="pt-2 space-y-2 pb-3 border-b border-white/5 last:border-0">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-2 pt-2">
                                 <SectionIcon size={10} /> {sectionKey.charAt(0) + sectionKey.slice(1).toLowerCase()}
                             </span>
                             {sectionParams.map(renderControl)}
                         </div>
                     );
                 })}
            </div>

            {showSaveModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100]">
                    <div className="bg-[#1a1a1e] p-6 rounded-2xl border border-white/10 w-72 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-white text-xs font-bold mb-4 uppercase tracking-wider flex items-center gap-2 justify-center">
                            <Atom size={14} className="text-amber-400"/> Save Visual Preset
                        </h3>
                        <input 
                            type="text" 
                            placeholder="e.g. Golden Helix" 
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white text-xs mb-4 focus:outline-none focus:border-amber-400 transition-colors" 
                            value={saveName} 
                            onChange={(e) => setSaveName(e.target.value)} 
                            autoFocus 
                        />
                        <div className="text-[9px] text-slate-500 mb-4 text-center">
                            Saves current parameters for <strong>{activePlugin?.name || activePhysicsMode.replace(/_/g, ' ')}</strong> mode.
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-[10px] uppercase font-bold transition-colors">Cancel</button>
                            <button onClick={executeSave} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] uppercase font-bold transition-colors shadow-lg shadow-amber-900/20">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};