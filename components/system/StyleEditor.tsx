
import React, { createContext, useState, useEffect } from 'react';
import { Sliders, X, RotateCcw, Palette, Save, Trash2, Check, Type, Pipette } from 'lucide-react';

export interface UIConfig {
    borderOpacity: number;
    bgOpacity: number;
    panelOpacity: number; // Explicit panel opacity
    backdropBlur: number;
    shadowOpacity: number;
    borderRadius: number;
    fontTheme: 'SCIENTIFIC' | 'SPIRITUAL' | 'CYBER';
    textScale: number;
    // Colors
    appBgColor: string; 
    textColor: string; 
    primaryColor: string;
    secondaryColor: string;
    cardRgb: string; 
    borderRgb?: string; 
}

export interface UIPreset {
    id: string;
    name: string;
    config: UIConfig;
    isFactory?: boolean;
}

export const DEFAULT_UI_CONFIG: UIConfig = {
    borderOpacity: 0.1, 
    bgOpacity: 0.1, 
    panelOpacity: 0.6, // Lowered for better visibility
    backdropBlur: 0,   // Disabled by default per request
    shadowOpacity: 0.2,
    borderRadius: 24,
    fontTheme: 'SCIENTIFIC',
    textScale: 1.0,
    appBgColor: '#020617', 
    textColor: '#ffffff',
    primaryColor: '#22d3ee', 
    secondaryColor: '#a855f7', 
    cardRgb: '10, 10, 10',
    borderRgb: '255, 255, 255'
};

export const FACTORY_PRESETS: UIPreset[] = [
    {
        id: 'protocol_zero', name: 'Protocol Zero', isFactory: true,
        config: DEFAULT_UI_CONFIG
    },
    {
        id: 'midnight_oil', name: 'Midnight Oil', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#0f172a', textColor: '#e2e8f0', primaryColor: '#38bdf8', secondaryColor: '#818cf8', cardRgb: '30, 41, 59', borderRgb: '51, 65, 85', bgOpacity: 0.3, panelOpacity: 0.7, borderOpacity: 0.5, shadowOpacity: 0.3, backdropBlur: 0 }
    },
    {
        id: 'matrix_reloaded', name: 'The Matrix', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#000000', textColor: '#22c55e', primaryColor: '#22c55e', secondaryColor: '#15803d', cardRgb: '0, 20, 0', borderRgb: '0, 255, 0', bgOpacity: 0.1, panelOpacity: 0.8, borderOpacity: 0.3, shadowOpacity: 0, fontTheme: 'CYBER', borderRadius: 0, backdropBlur: 0 }
    },
    {
        id: 'cherry_blossom', name: 'Cherry Blossom', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#fff1f2', textColor: '#881337', primaryColor: '#fb7185', secondaryColor: '#fda4af', cardRgb: '255, 255, 255', borderRgb: '251, 113, 133', bgOpacity: 0.4, panelOpacity: 0.6, borderOpacity: 0.2, shadowOpacity: 0.1, borderRadius: 24, fontTheme: 'SPIRITUAL', backdropBlur: 4 }
    },
    {
        id: 'deep_space', name: 'Deep Space', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#020617', textColor: '#e2e8f0', primaryColor: '#6366f1', secondaryColor: '#a855f7', cardRgb: '15, 23, 42', borderRgb: '99, 102, 241', bgOpacity: 0.2, panelOpacity: 0.6, borderOpacity: 0.2, shadowOpacity: 0.5, backdropBlur: 0 }
    },
    {
        id: 'carbon_fiber', name: 'Carbon Fiber', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#171717', textColor: '#d4d4d4', primaryColor: '#f59e0b', secondaryColor: '#d97706', cardRgb: '23, 23, 23', borderRgb: '64, 64, 64', bgOpacity: 0.6, panelOpacity: 0.9, borderOpacity: 1, shadowOpacity: 0.2, borderRadius: 4, fontTheme: 'SCIENTIFIC', backdropBlur: 0 }
    },
    {
        id: 'vapor_grid', name: 'Vapor Grid', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#2e0225', textColor: '#fae8ff', primaryColor: '#d946ef', secondaryColor: '#22d3ee', cardRgb: '60, 10, 60', borderRgb: '217, 70, 239', bgOpacity: 0.3, panelOpacity: 0.5, borderOpacity: 0.5, shadowOpacity: 0.4, backdropBlur: 0 }
    },
    {
        id: 'swiss_design', name: 'Swiss Design', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#ffffff', textColor: '#000000', primaryColor: '#ef4444', secondaryColor: '#171717', cardRgb: '245, 245, 245', borderRgb: '0, 0, 0', bgOpacity: 1, panelOpacity: 1.0, borderOpacity: 1, shadowOpacity: 0, borderRadius: 0, fontTheme: 'SCIENTIFIC', backdropBlur: 0 }
    },
    {
        id: 'biolum', name: 'Bioluminescence', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#022c22', textColor: '#ecfdf5', primaryColor: '#34d399', secondaryColor: '#10b981', cardRgb: '6, 78, 59', borderRgb: '52, 211, 153', bgOpacity: 0.2, panelOpacity: 0.5, borderOpacity: 0.3, shadowOpacity: 0.4, backdropBlur: 8 }
    },
    {
        id: 'golden_hour', name: 'Golden Hour', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#292524', textColor: '#fef3c7', primaryColor: '#fbbf24', secondaryColor: '#d97706', cardRgb: '40, 37, 36', borderRgb: '251, 191, 36', bgOpacity: 0.4, panelOpacity: 0.7, borderOpacity: 0.3, shadowOpacity: 0.3, borderRadius: 16, backdropBlur: 0 }
    },
    {
        id: 'royal_amethyst', name: 'Royal Amethyst', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#1e1b4b', textColor: '#ede9fe', primaryColor: '#a855f7', secondaryColor: '#7c3aed', cardRgb: '49, 46, 129', borderRgb: '139, 92, 246', bgOpacity: 0.3, panelOpacity: 0.6, borderOpacity: 0.4, shadowOpacity: 0.4, backdropBlur: 0 }
    },
    {
        id: 'blueprint_tech', name: 'Blueprint Tech', isFactory: true,
        config: { ...DEFAULT_UI_CONFIG, appBgColor: '#1e3a8a', textColor: '#dbeafe', primaryColor: '#60a5fa', secondaryColor: '#93c5fd', cardRgb: '23, 37, 84', borderRgb: '96, 165, 250', bgOpacity: 0.6, panelOpacity: 0.8, borderOpacity: 0.5, shadowOpacity: 0, fontTheme: 'SCIENTIFIC', backdropBlur: 0 }
    }
];

// Pre-defined color combinations that "just work"
const COLOR_SWATCHES = [
    { name: "Cyan Void", bg: "#020617", primary: "#22d3ee", card: "10, 10, 10", border: "255, 255, 255", text: "#ffffff" },
    { name: "Vaporwave", bg: "#2e0225", primary: "#d946ef", card: "40, 0, 40", border: "217, 70, 239", text: "#fdf4ff" },
    { name: "Bio-Hazard", bg: "#022c22", primary: "#34d399", card: "6, 78, 59", border: "52, 211, 153", text: "#ecfdf5" },
    { name: "Red Alert", bg: "#280510", primary: "#f43f5e", card: "60, 10, 30", border: "251, 113, 133", text: "#fff1f2" },
    { name: "Deep Sea", bg: "#082f49", primary: "#38bdf8", card: "12, 74, 110", border: "56, 189, 248", text: "#f0f9ff" },
    { name: "Golden Hour", bg: "#1c1917", primary: "#fbbf24", card: "41, 37, 36", border: "251, 191, 36", text: "#fffbeb" },
    { name: "Vantablack", bg: "#000000", primary: "#525252", card: "20, 20, 20", border: "64, 64, 64", text: "#a3a3a3" },
    { name: "Lab White", bg: "#f8fafc", primary: "#0f172a", card: "255, 255, 255", border: "148, 163, 184", text: "#0f172a" },
    { name: "Royal Blood", bg: "#1e1b4b", primary: "#c084fc", card: "49, 46, 129", border: "192, 132, 252", text: "#faf5ff" },
    { name: "Matrix", bg: "#020402", primary: "#22c55e", card: "0, 20, 0", border: "34, 197, 94", text: "#dcfce7" },
];

const PALETTE_COLORS = [
    // Monochromes
    "#000000", "#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#f1f5f9", "#ffffff",
    // Warm
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#facc15", "#fef08a",
    // Cool
    "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
    // Deep
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#be123c"
];

// Color Slots Definition
const COLOR_SLOTS = [
    { key: 'appBgColor', label: 'Background' },
    { key: 'primaryColor', label: 'Primary' },
    { key: 'secondaryColor', label: 'Secondary' },
    { key: 'textColor', label: 'Text' },
    { key: 'cardRgb', label: 'Card Base', isRgb: true },
    { key: 'borderRgb', label: 'Borders', isRgb: true },
];

export const StyleContext = createContext<UIConfig>(DEFAULT_UI_CONFIG);

interface Props {
    config: UIConfig;
    onChange: (c: UIConfig) => void;
    onClose: () => void;
    onReset: () => void;
}

export const StyleEditor: React.FC<Props> = ({ config, onChange, onClose, onReset }) => {
    const [activeTab, setActiveTab] = useState<'EDIT' | 'PRESETS' | 'MIXER'>('EDIT');
    const [presets, setPresets] = useState<UIPreset[]>(() => {
        const savedPresets = localStorage.getItem('ui_presets');
        let loaded = [...FACTORY_PRESETS];
        if (savedPresets) {
            try {
                const parsed = JSON.parse(savedPresets);
                loaded = [...FACTORY_PRESETS, ...parsed];
            } catch (e) { console.error(e); }
        }
        return loaded;
    });
    const [newPresetName, setNewPresetName] = useState('');
    const [defaultPresetId, setDefaultPresetId] = useState<string | null>(() => {
        return localStorage.getItem('ui_default_id');
    });
    const [activeColorSlot, setActiveColorSlot] = useState<string>('primaryColor');

    const update = (key: keyof UIConfig, val: any) => {
        onChange({ ...config, [key]: val });
    };

    const applySwatch = (s: typeof COLOR_SWATCHES[0]) => {
        onChange({
            ...config,
            appBgColor: s.bg,
            primaryColor: s.primary,
            cardRgb: s.card,
            borderRgb: s.border,
            textColor: s.text
        });
    };

    const hexToRgbString = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
    };

    const handleColorPick = (hex: string) => {
        const slot = COLOR_SLOTS.find(s => s.key === activeColorSlot);
        if (!slot) return;
        
        if (slot.isRgb) {
             update(activeColorSlot as keyof UIConfig, hexToRgbString(hex));
        } else {
             update(activeColorSlot as keyof UIConfig, hex);
        }
    };

    const rgbToHex = (rgbStr: string | undefined) => {
        if (!rgbStr) return '#000000';
        const parts = rgbStr.split(',').map(n => parseInt(n.trim(), 10));
        if (parts.length < 3 || parts.some(isNaN)) return '#000000';
        const [r, g, b] = parts;
        const toHex = (c: number) => {
            const hex = Math.max(0, Math.min(255, c)).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        return "#" + toHex(r) + toHex(g) + toHex(b);
    };

    const savePreset = () => {
        if (!newPresetName.trim()) return;
        const newPreset: UIPreset = { id: Date.now().toString(), name: newPresetName, config: { ...config } };
        const currentCustom = presets.filter(p => !p.isFactory);
        const updatedCustom = [...currentCustom, newPreset];
        localStorage.setItem('ui_presets', JSON.stringify(updatedCustom));
        
        setPresets([...FACTORY_PRESETS, ...updatedCustom]);
        setNewPresetName('');
    };

    const loadPreset = (preset: UIPreset) => onChange(preset.config);

    const deletePreset = (id: string) => {
        const currentCustom = presets.filter(p => !p.isFactory && p.id !== id);
        localStorage.setItem('ui_presets', JSON.stringify(currentCustom));
        setPresets([...FACTORY_PRESETS, ...currentCustom]);
        
        if (defaultPresetId === id) {
            setDefaultPresetId(null);
            localStorage.removeItem('ui_default_id');
        }
    };

    const setAsDefault = (id: string) => {
        const newId = defaultPresetId === id ? null : id;
        setDefaultPresetId(newId);
        if (newId) localStorage.setItem('ui_default_id', newId);
        else localStorage.removeItem('ui_default_id');
    };

    const getSlotColor = (slot: typeof COLOR_SLOTS[0]) => {
        const val = config[slot.key as keyof UIConfig] as string;
        if (slot.isRgb) return rgbToHex(val);
        return val;
    };

    return (
        <div 
            className="fixed bottom-4 right-4 z-[100] w-80 border rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 overflow-hidden flex flex-col max-h-[80vh]"
            style={{
                backgroundColor: `rgba(${config.cardRgb}, ${Math.max(0.1, config.panelOpacity)})`, // Use dynamic opacity
                backdropFilter: `blur(${config.backdropBlur}px)`,
                borderColor: `rgba(${config.borderRgb}, ${config.borderOpacity})`
            }}
        >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
                <div className="flex items-center gap-2" style={{ color: config.primaryColor }}>
                    <Sliders size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">UI Console</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onReset} className="p-1 text-slate-500 hover:text-white transition-colors"><RotateCcw size={14} /></button>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                </div>
            </div>

            <div className="flex border-b border-white/5">
                <button onClick={() => setActiveTab('EDIT')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'EDIT' ? 'bg-white/10' : 'text-slate-500 hover:text-slate-300'}`} style={activeTab === 'EDIT' ? { color: config.primaryColor } : {}}>Controls</button>
                <button onClick={() => setActiveTab('MIXER')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'MIXER' ? 'bg-white/10' : 'text-slate-500 hover:text-slate-300'}`} style={activeTab === 'MIXER' ? { color: config.primaryColor } : {}}>Mixer</button>
                <button onClick={() => setActiveTab('PRESETS')} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'PRESETS' ? 'bg-white/10' : 'text-slate-500 hover:text-slate-300'}`} style={activeTab === 'PRESETS' ? { color: config.primaryColor } : {}}>Presets</button>
            </div>
            
            {activeTab === 'EDIT' && (
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                    
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Palette size={10} /> Quick Themes</span>
                        
                        <div className="grid grid-cols-5 gap-2">
                            {COLOR_SWATCHES.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => applySwatch(s)}
                                    className={`relative w-full aspect-square rounded-full border shadow-sm transition-transform hover:scale-110 active:scale-95 group`}
                                    style={{ 
                                        backgroundColor: s.bg,
                                        borderColor: config.primaryColor === s.primary ? s.primary : 'rgba(255,255,255,0.1)'
                                    }}
                                    title={s.name}
                                >
                                    <div 
                                        className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: s.primary }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Sliders size={10} /> Glass & Surface</span>
                        
                        {/* PANEL OPACITY */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Panel Opacity</span>
                                <span style={{ color: config.primaryColor }}>{(config.panelOpacity * 100).toFixed(0)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={config.panelOpacity} onChange={(e) => update('panelOpacity', parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: config.primaryColor }}/>
                        </div>

                        {/* WIDGET OPACITY (Mapped to bgOpacity) */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Widget Opacity</span>
                                <span style={{ color: config.primaryColor }}>{(config.bgOpacity * 100).toFixed(0)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={config.bgOpacity} onChange={(e) => update('bgOpacity', parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: config.primaryColor }}/>
                        </div>

                        {/* BLUR RADIUS */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Blur Radius</span>
                                <span style={{ color: config.primaryColor }}>{config.backdropBlur}px</span>
                            </div>
                            <input type="range" min="0" max="40" step="1" value={config.backdropBlur} onChange={(e) => update('backdropBlur', parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: config.primaryColor }}/>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Type size={10} /> Typography</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 mb-3">
                                {['SCIENTIFIC', 'SPIRITUAL', 'CYBER'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => update('fontTheme', f as any)} 
                                        className={`h-6 rounded border text-[7px] font-bold ${config.fontTheme === f ? '' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                        style={config.fontTheme === f ? { backgroundColor: `${config.primaryColor}33`, color: config.primaryColor, borderColor: config.primaryColor } : {}}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Text Size</span>
                                    <span style={{ color: config.primaryColor }}>{(config.textScale * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.75" 
                                    max="1.25" 
                                    step="0.05" 
                                    value={config.textScale || 1.0} 
                                    onChange={(e) => update('textScale', parseFloat(e.target.value))} 
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                                    style={{ accentColor: config.primaryColor }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'MIXER' && (
                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Pipette size={10} /> Color Mixer</span>
                    
                    {/* Active Slots */}
                    <div className="grid grid-cols-3 gap-3">
                        {COLOR_SLOTS.map(slot => (
                            <div 
                                key={slot.key}
                                onClick={() => setActiveColorSlot(slot.key)}
                                className={`flex flex-col gap-1 items-center p-2 rounded border cursor-pointer transition-all ${activeColorSlot === slot.key ? 'bg-white/5' : 'border-white/5 hover:bg-white/5'}`}
                                style={{ borderColor: activeColorSlot === slot.key ? config.primaryColor : 'rgba(255,255,255,0.05)' }}
                            >
                                <div className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: getSlotColor(slot) }} />
                                <span className={`text-[8px] font-bold uppercase ${activeColorSlot === slot.key ? '' : 'text-slate-500'}`} style={activeColorSlot === slot.key ? { color: config.primaryColor } : {}}>{slot.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/5 pt-4">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-3">Palette</span>
                        <div className="grid grid-cols-6 gap-2">
                            {PALETTE_COLORS.map((hex, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleColorPick(hex)}
                                    className="w-full aspect-square rounded-md border border-white/10 hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: hex }}
                                    title={hex}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="text-[9px] text-slate-500 text-center pt-2">
                         Editing: <span className="font-bold uppercase" style={{ color: config.primaryColor }}>{COLOR_SLOTS.find(s => s.key === activeColorSlot)?.label}</span>
                    </div>
                </div>
            )}

            {activeTab === 'PRESETS' && (
                <div className="p-4 flex flex-col flex-1 gap-4 overflow-hidden">
                    <div className="flex gap-2">
                        <input type="text" placeholder="New Preset..." value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500" style={{ borderColor: newPresetName ? config.primaryColor : undefined }}/>
                        <button onClick={savePreset} disabled={!newPresetName.trim()} className="p-2 rounded hover:bg-white/10 disabled:opacity-50" style={{ backgroundColor: `${config.primaryColor}33`, color: config.primaryColor }}><Save size={14} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                         {presets.map(p => (
                             <div key={p.id} className="bg-white/5 border border-white/10 rounded p-2 flex items-center justify-between group hover:border-white/20 transition-all">
                                 <div className="flex-1 cursor-pointer" onClick={() => loadPreset(p)}>
                                     <div className="flex flex-col">
                                         <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-200 group-hover:text-white">{p.name}</span>
                                            {defaultPresetId === p.id && <span className="text-[8px] px-1.5 rounded uppercase font-bold" style={{ backgroundColor: `${config.primaryColor}33`, color: config.primaryColor }}>Default</span>}
                                         </div>
                                         {p.isFactory && <span className="text-[8px] text-slate-500 font-mono uppercase">FACTORY</span>}
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <button onClick={() => setAsDefault(p.id)} className={`p-1.5 transition-colors`} style={{ color: defaultPresetId === p.id ? config.primaryColor : '#64748b' }} title="Set as Startup"><Check size={12} /></button>
                                     {!p.isFactory && <button onClick={() => deletePreset(p.id)} className="p-1.5 text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>}
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
            )}
        </div>
    );
};
