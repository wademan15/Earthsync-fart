import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, Activity, Settings2, Sparkles, Wind } from 'lucide-react';
import { UIConfig } from '../system/StyleEditor';
import { ModulationNode, VisualizerBus } from '../modules/visuals/shared';

export type { ModulationNode };

// --- STANDARD FADER ---
export const Fader = ({ value, onChange, min = 0, max = 1, step = 0.01, color, disabled = false, uiConfig, canLink, isLinked, onToggleLink }: any) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const stateRef = useRef({ value, onChange, min, max, step });
  useEffect(() => { stateRef.current = { value, onChange, min, max, step }; });

  const percent = Math.min(1, Math.max(0, (value - min) / (max - min)));

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!trackRef.current || disabled) return;
      e.preventDefault();
      
      const { min, max, step, onChange } = stateRef.current;
      const rect = trackRef.current.getBoundingClientRect();
      const width = rect.width; if (width === 0) return;
      
      let rawP = (e.clientX - rect.left) / width;
      if (rawP < 0) rawP = 0; if (rawP > 1) rawP = 1;
      
      let newVal = min + (rawP * (max - min));
      
      const actualStep = typeof step === 'number' && step > 0 ? step : 0.01;
      newVal = Math.round(newVal / actualStep) * actualStep;
      
      const stepStr = actualStep.toString();
      const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
      newVal = Number(newVal.toFixed(decimals));
      
      onChange(Math.min(max, Math.max(min, newVal)));
    };

    const handlePointerUp = () => { setIsDragging(false); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    if (isDragging) { document.body.style.userSelect = 'none'; document.body.style.cursor = 'grabbing'; window.addEventListener('pointermove', handlePointerMove, { passive: false }); window.addEventListener('pointerup', handlePointerUp); }
    return () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', handlePointerUp); };
  }, [isDragging, disabled]); 

  return (
    <div className={`h-8 flex items-center gap-2 relative w-full select-none touch-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex-1 relative h-8 flex items-center">
          <div ref={trackRef} className="absolute left-0 right-0 h-2 overflow-hidden cursor-pointer group" style={{ backgroundColor: `rgba(${uiConfig.borderRgb}, 0.2)`, borderRadius: 8 }} onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setIsDragging(true); }}>
            <div className={`h-full transition-all duration-75 ease-out`} style={{ width: `${percent * 100}%`, backgroundColor: color }} />
          </div>
          <div className="absolute h-5 w-5 -ml-2.5 bg-white rounded-full shadow-lg z-10 cursor-grab active:cursor-grabbing pointer-events-none transition-transform transform hover:scale-110" 
            style={{ left: `${percent * 100}%` }} />
      </div>
      {canLink && onToggleLink && ( <button onClick={onToggleLink} className={`p-1.5 rounded transition-all ${isLinked ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-600 hover:text-slate-400'}`}><LinkIcon size={10} /></button> )}
    </div>
  );
};

export const BiDirectionalSlider = ({ value, onChange, color, icon: Icon, label, uiConfig }: any) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const stateRef = useRef({ value, onChange });
    useEffect(() => { stateRef.current = { value, onChange }; });

    const percent = (value + 1) / 2; 
    const widthPercent = Math.abs(value) * 50; 
    const leftPercent = value < 0 ? 50 - widthPercent : 50;

    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!trackRef.current) return;
            e.preventDefault();
            const rect = trackRef.current.getBoundingClientRect();
            const w = rect.width; if (w === 0) return;
            const raw = (e.clientX - rect.left) / w;
            let val = (raw * 2) - 1;
            val = Math.max(-1, Math.min(1, val));
            if (Math.abs(val) < 0.05) val = 0;
            stateRef.current.onChange(val);
        };
        const up = () => { setIsDragging(false); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
        if (isDragging) { document.body.style.userSelect = 'none'; document.body.style.cursor = 'ew-resize'; window.addEventListener('pointermove', handleMove); window.addEventListener('pointerup', up); }
        return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', up); };
    }, [isDragging]);

    return (
        <div className="flex items-center gap-2 h-7">
            <div className="w-16 shrink-0 flex items-center gap-1.5 opacity-80" style={{ color: value !== 0 ? color : 'rgb(100, 116, 139)' }}>
                <Icon size={10} />
                <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex-1 relative h-6 flex items-center cursor-ew-resize touch-none" ref={trackRef} onPointerDown={(e) => { e.preventDefault(); setIsDragging(true); }}>
                <div className="absolute left-0 right-0 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
                    <div className="absolute top-0 bottom-0 transition-all duration-75" style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, backgroundColor: value === 0 ? 'transparent' : (value > 0 ? color : '#ef4444') }} />
                </div>
                <div className="absolute h-4 w-1 bg-white rounded-full shadow-md z-10 transition-transform hover:scale-125" style={{ left: `${percent * 100}%`, transform: 'translateX(-50%)' }} />
            </div>
            <span className={`w-8 text-right font-mono text-[9px] ${value > 0 ? 'text-white' : value < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}%
            </span>
        </div>
    );
};

interface ModFaderProps {
    value: number; min: number; max: number; step?: number;
    color: string; uiConfig: UIConfig;
    modNode?: ModulationNode;
    onModChange: (newNode: ModulationNode) => void;
    onStaticChange: (val: number) => void;
    bus?: VisualizerBus;
    paramKey?: string;
    hasSensors?: boolean;
}

export const ModulationFader: React.FC<ModFaderProps> = ({ value, min, max, step = 0.01, color, uiConfig, modNode, onModChange, onStaticChange, bus, paramKey, hasSensors = true }) => {
    
    const safeMod: ModulationNode = modNode || { 
        enabled: false, min: min, max: max, 
        amtBreath: 0, amtBinaural: 0, amtPulse: 0, amtCoh: 0, amtHeart: 0,
        mixMode: 'ADD', curve: 'EASE_IN_OUT', inertia: 0.5,
        binauralHarmonic: 1.0, linkBreathBinaural: false
    };

    const isModulated = safeMod.enabled;
    const [showMatrix, setShowMatrix] = useState(false);
    const [draggingHandle, setDraggingHandle] = useState<'MIN' | 'MAX' | 'STATIC' | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const ghostThumbRef = useRef<HTMLDivElement>(null); 
    const stateRef = useRef({ safeMod, min, max, step, onModChange, onStaticChange });

    useEffect(() => { stateRef.current = { safeMod, min, max, step, onModChange, onStaticChange }; });

    useEffect(() => {
        if (!bus || !paramKey || !isModulated) return;
        const unsubscribe = bus.subscribe((telemetry: any) => {
            if (ghostThumbRef.current && typeof telemetry[paramKey] === 'number') {
                const liveVal = telemetry[paramKey];
                const p = Math.max(0, Math.min(1, (liveVal - min) / (max - min)));
                ghostThumbRef.current.style.left = `${p * 100}%`;
                ghostThumbRef.current.style.opacity = '1';
            }
        });
        return () => unsubscribe();
    }, [bus, paramKey, isModulated, min, max]);

    const pStatic = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const pMin = Math.max(0, Math.min(1, (safeMod.min - min) / (max - min)));
    const pMax = Math.max(0, Math.min(1, (safeMod.max - min) / (max - min)));

    let activeBarColor = color;
    if (isModulated) {
        const maxInf = Math.max(
            Math.abs(safeMod.amtBreath || 0), 
            Math.abs(safeMod.amtBinaural || 0), 
            Math.abs(safeMod.amtPulse || 0), 
            Math.abs(safeMod.amtCoh || 0),
            Math.abs(safeMod.amtHeart || 0)
        );
        if (maxInf > 0) {
            if (Math.abs(safeMod.amtCoh || 0) === maxInf) activeBarColor = '#fcd34d'; 
            else if (Math.abs(safeMod.amtPulse || 0) === maxInf) activeBarColor = '#ef4444'; 
            else if (Math.abs(safeMod.amtHeart || 0) === maxInf) activeBarColor = '#f43f5e'; 
            else if (Math.abs(safeMod.amtBreath || 0) === maxInf) activeBarColor = '#22d3ee'; 
            else if (Math.abs(safeMod.amtBinaural || 0) === maxInf) activeBarColor = '#facc15'; 
        }
    }

    const rollTheDice = () => {
        const next = { ...safeMod };
        next.amtBreath = 0; next.amtBinaural = 0; next.amtPulse = 0; next.amtCoh = 0; next.amtHeart = 0;
        
        const r = Math.random();
        
        if (r > 0.70) {
            next.amtBreath = Math.random() > 0.5 ? 1.0 : -1.0;
        } else if (r > 0.45) {
            next.amtHeart = Math.random() > 0.5 ? 1.0 : -0.8;
        } else if (hasSensors && r > 0.20) {
            if (Math.random() > 0.5) next.amtPulse = Math.random() > 0.5 ? 0.8 : -0.8;
            else next.amtCoh = 0.9;
        } else {
            next.amtBinaural = Math.random() > 0.5 ? 1.0 : -1.0;
            const ratios = [0.25, 0.5, 1.0];
            next.binauralHarmonic = ratios[Math.floor(Math.random() * ratios.length)];
        }

        next.curve = 'EASE_IN_OUT';
        next.mixMode = 'ADD';
        next.inertia = 0.35 + (Math.random() * 0.3); 
        onModChange(next);
    };

    const renderCurveIcon = (curveType: string) => {
        if (curveType === 'EXPONENTIAL') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20 Q 20 20, 20 4"/></svg>;
        if (curveType === 'EASE_IN_OUT') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20 C 12 20, 12 4, 20 4"/></svg>;
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="20" x2="20" y2="4"/></svg>;
    };

    useEffect(() => {
        const handleDrag = (e: PointerEvent) => {
            if (!draggingHandle || !trackRef.current) return;
            e.preventDefault();
            const { safeMod, min, max, step, onModChange, onStaticChange } = stateRef.current;
            const rect = trackRef.current.getBoundingClientRect();
            let rawP = (e.clientX - rect.left) / rect.width;
            if (rawP < 0) rawP = 0; if (rawP > 1) rawP = 1;
            
            let newVal = min + (rawP * (max - min));
            
            const actualStep = typeof step === 'number' && step > 0 ? Math.min(step, 0.001) : 0.001;
            newVal = Math.round(newVal / actualStep) * actualStep;

            if (draggingHandle === 'STATIC') {
                onStaticChange(newVal);
            } else if (draggingHandle === 'MIN') {
                const safeVal = Math.min(newVal, safeMod.max);
                onModChange({ ...safeMod, min: safeVal });
            } else if (draggingHandle === 'MAX') {
                const safeVal = Math.max(newVal, safeMod.min);
                onModChange({ ...safeMod, max: safeVal });
            }
        };

        const up = () => { setDraggingHandle(null); document.body.style.cursor = ''; document.body.style.userSelect = ''; };

        if (draggingHandle) {
            document.body.style.userSelect = 'none'; document.body.style.cursor = 'grabbing';
            window.addEventListener('pointermove', handleDrag);
            window.addEventListener('pointerup', up);
        }
        return () => { window.removeEventListener('pointermove', handleDrag); window.removeEventListener('pointerup', up); };
    }, [draggingHandle]);

    const BINAURAL_RATES = [
        { v: 0.25, l: '1/4' },
        { v: 0.5, l: '1/2' },
        { v: 1.0, l: '1x' },
        { v: 2.0, l: '2x' }
    ];

    return (
        <div className="flex flex-col gap-1 w-full relative">
            <div className="h-8 flex items-center gap-2 relative w-full touch-none select-none">
                <div className="flex-1 relative h-6 flex items-center group cursor-pointer"
                     ref={trackRef}
                     onPointerDown={(e) => { if (!isModulated) { e.stopPropagation(); setDraggingHandle('STATIC'); } }}>
                    
                    <div className="absolute left-0 right-0 h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                        {!isModulated && (<div className="h-full transition-all duration-75" style={{ width: `${pStatic * 100}%`, backgroundColor: color }} />)}
                        {isModulated && (<div className="absolute top-0 bottom-0 h-full opacity-60 rounded-full" style={{ left: `${pMin * 100}%`, width: `${(pMax - pMin) * 100}%`, backgroundColor: activeBarColor }} />)}
                    </div>

                    {!isModulated && (<div className="absolute h-5 w-5 -ml-2.5 bg-white rounded-full shadow-lg z-10 transition-transform transform group-hover:scale-110 pointer-events-none" style={{ left: `${pStatic * 100}%` }} />)}
                    
                    {isModulated && (
                        <div 
                            ref={ghostThumbRef}
                            className="absolute h-4 w-4 -ml-2 rounded-full z-20 pointer-events-none shadow-[0_0_10px_white]"
                            style={{ left: `${pStatic * 100}%`, backgroundColor: activeBarColor, border: '2px solid white', transition: 'opacity 0.2s', opacity: 0.5 }} 
                        />
                    )}

                    {isModulated && (
                        <>
                            <div className="absolute h-5 w-3 -ml-1.5 bg-white rounded-l shadow-lg z-10 cursor-e-resize" style={{ left: `${pMin * 100}%` }} onPointerDown={(e) => { e.stopPropagation(); setDraggingHandle('MIN'); }} />
                            <div className="absolute h-5 w-3 -ml-1.5 bg-white rounded-r shadow-lg z-10 cursor-e-resize" style={{ left: `${pMax * 100}%` }} onPointerDown={(e) => { e.stopPropagation(); setDraggingHandle('MAX'); }} />
                        </>
                    )}
                </div>
                
                <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button 
                        onClick={() => {
                            if (!isModulated) {
                                onModChange({ 
                                    ...safeMod, enabled: true, amtBreath: 0, amtBinaural: 0, amtPulse: 0, amtCoh: 0, amtHeart: 0,
                                    min: value, max: value, curve: 'LINEAR', mixMode: 'ADD', inertia: 0.5 
                                });
                                setShowMatrix(true);
                            } else {
                                setShowMatrix(!showMatrix);
                            }
                        }}
                        className={`p-1.5 rounded-lg transition-all border shrink-0 ${isModulated ? (showMatrix ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10 text-cyan-400 border-white/20 hover:bg-white/20') : 'text-slate-600 border-transparent hover:text-slate-300 hover:bg-white/5'}`}
                        title="Modulation Matrix"
                    >
                        <Activity size={14} />
                    </button>
                </div>
            </div>
            
            {isModulated && !showMatrix && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {Math.abs(safeMod.amtBreath || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">🌬️ Wind</span>}
                    {Math.abs(safeMod.amtHeart || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">🫀 Heart</span>}
                    {hasSensors && Math.abs(safeMod.amtPulse || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30">💓 Pulse</span>}
                    {hasSensors && Math.abs(safeMod.amtCoh || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-amber-200/10 text-amber-200 border border-amber-300/30">✨ Coh</span>}
                    {Math.abs(safeMod.amtBinaural || 0) > 0 && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">🎧 Bin {(safeMod.binauralHarmonic || 1) !== 1 ? `${BINAURAL_RATES.find(r => r.v === safeMod.binauralHarmonic)?.l || safeMod.binauralHarmonic}` : ''}</span>}
                </div>
            )}

            {isModulated && showMatrix && (
                <div className="mt-2 p-3 bg-black rounded-xl border border-slate-700 shadow-2xl space-y-4 animate-in slide-in-from-top-2">
                    
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2"><Settings2 size={12}/> Matrix</span>
                            <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
                                <button onClick={() => onModChange({...safeMod, mixMode: 'ADD'})} className={`px-2 py-0.5 text-[7px] font-bold rounded ${safeMod.mixMode !== 'MULT' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>ADD</button>
                                <button onClick={() => onModChange({...safeMod, mixMode: 'MULT'})} className={`px-2 py-0.5 text-[7px] font-bold rounded ${safeMod.mixMode === 'MULT' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>MULT</button>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button onClick={rollTheDice} className="hover:text-amber-400 text-slate-400 transition-colors" title="Happy Accident (Randomize)"><Sparkles size={10} /></button>
                            <button onClick={() => { onModChange({...safeMod, enabled: false}); setShowMatrix(false); }} className="text-[9px] uppercase tracking-wider text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors">Disable</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase"><span>Min Bound</span><span className="text-white">{safeMod.min.toFixed(2)}</span></div><input type="range" min={min} max={max} step="any" value={safeMod.min} onChange={(e)=>onModChange({...safeMod, min: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-slate-300" /></div>
                        <div className="space-y-1"><div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase"><span>Max Bound</span><span className="text-white">{safeMod.max.toFixed(2)}</span></div><input type="range" min={min} max={max} step="any" value={safeMod.max} onChange={(e)=>onModChange({...safeMod, max: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-slate-300" /></div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="space-y-4">
                        
                        {/* BREATH MOD */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                                <span>🌬️ Breath Mod</span>
                                <div className="flex gap-1 bg-slate-900 rounded p-0.5">
                                     {['DEFAULT', 'INVERT', 'HOLD', 'EXHALE'].map(m => {
                                         const modeVal = m === 'DEFAULT' ? undefined : (m === 'HOLD' ? 'ONLY_HOLD' : (m === 'EXHALE' ? 'ONLY_EXHALE' : 'INVERT'));
                                         const isActive = safeMod.breathMode === modeVal;
                                         return (
                                             <button key={m} onClick={() => onModChange({...safeMod, breathMode: modeVal as any})} 
                                             className={`px-1 rounded text-[6px] ${isActive ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-cyan-300'}`}>
                                             {m}
                                             </button>
                                         );
                                     })}
                                </div>
                                <span>{Math.round((safeMod.amtBreath || 0) * 100)}%</span>
                            </div>
                            <input type="range" min="-1" max="1" step="any" value={safeMod.amtBreath || 0} onChange={(e)=>onModChange({...safeMod, amtBreath: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-cyan-400" />
                        </div>

                        {/* HEARTBEAT MOD */}
                        <div className="space-y-1 pt-2 border-t border-slate-800">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-rose-400">
                                <span className="flex items-center gap-1.5">🫀 Heartbeat Mod</span>
                                <span>{Math.round((safeMod.amtHeart || 0) * 100)}%</span>
                            </div>
                            <input type="range" min="-1" max="1" step="any" value={safeMod.amtHeart || 0} onChange={(e)=>onModChange({...safeMod, amtHeart: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-rose-500" />
                        </div>
                        
                        {/* BIO SENSORS */}
                        {hasSensors && (
                            <div className="space-y-3 pt-2 border-t border-slate-800">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-red-400"><span>💓 Sensor Pulse</span><span>{Math.round((safeMod.amtPulse || 0) * 100)}%</span></div>
                                    <input type="range" min="-1" max="1" step="any" value={safeMod.amtPulse || 0} onChange={(e)=>onModChange({...safeMod, amtPulse: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-red-500" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-amber-200"><span>✨ Coherence</span><span>{Math.round((safeMod.amtCoh || 0) * 100)}%</span></div>
                                    <input type="range" min="-1" max="1" step="any" value={safeMod.amtCoh || 0} onChange={(e)=>onModChange({...safeMod, amtCoh: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-amber-200" />
                                </div>
                            </div>
                        )}
                        
                        {/* AUDIO PHYSICS */}
                        <div className="space-y-1 pt-2 border-t border-slate-800">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-amber-500">
                                <div className="flex items-center gap-1.5">
                                    <span>🎧 Binaural Mod</span>
                                    <button 
                                        onClick={() => onModChange({...safeMod, linkBreathBinaural: !safeMod.linkBreathBinaural})}
                                        className={`p-1 rounded transition-colors ${safeMod.linkBreathBinaural ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_5px_rgba(245,158,11,0.3)]' : 'bg-transparent text-slate-600 border border-transparent hover:text-amber-400'}`}
                                        title="Link Amplitude to Breath Envelope"
                                    >
                                        <LinkIcon size={10} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1 bg-slate-900 rounded p-0.5">
                                        {BINAURAL_RATES.map(rate => (
                                            <button key={rate.v} onClick={() => onModChange({...safeMod, binauralHarmonic: rate.v})} className={`px-1.5 rounded text-[7px] font-bold ${safeMod.binauralHarmonic === rate.v ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>{rate.l}</button>
                                        ))}
                                    </div>
                                    <span>{Math.round((safeMod.amtBinaural || 0) * 100)}%</span>
                                </div>
                            </div>
                            <input type="range" min="-1" max="1" step="any" value={safeMod.amtBinaural || 0} onChange={(e)=>onModChange({...safeMod, amtBinaural: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-amber-500" />
                        </div>

                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><span className="text-[9px] text-slate-400 font-bold uppercase">Curve</span><div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">{['LINEAR', 'EASE_IN_OUT', 'EXPONENTIAL'].map(c => (<button key={c} onClick={() => onModChange({...safeMod, curve: c as any})} className={`flex-1 flex justify-center py-1 rounded transition-colors ${safeMod.curve === c || (!safeMod.curve && c === 'LINEAR') ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-300'}`} title={c}>{renderCurveIcon(c)}</button>))}</div></div>
                        <div className="space-y-1"><div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase"><span>Inertia (Glide)</span><span>{Math.round((safeMod.inertia || 0)*100)}%</span></div><input type="range" min="0" max="0.99" step="any" value={safeMod.inertia || 0} onChange={(e)=>onModChange({...safeMod, inertia: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-slate-300 mt-1" /></div>
                    </div>
                </div>
            )}
        </div>
    );
};