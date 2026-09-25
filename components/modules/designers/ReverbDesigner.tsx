import React, { useState } from 'react';
import { Save, Trash2, ChevronDown, Waves, Brain, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { UIConfig } from '../../system/StyleEditor';
import { Fader, ModulationFader } from '../../ui/Faders';

export interface ReverbPreset { id: string; name: string; config: Record<string, unknown>; }

export const DEFAULT_REVERB_PRESETS: ReverbPreset[] = [
    { id: 'zen_temple', name: 'Zen Temple Hall (Default)', config: { decay: 2.2, preDelay: 20, diffusion: 0.85, damping: 3500, modulation: 0.1, wetness: 0.25 } },
    { id: 'himalayan_cave', name: 'Himalayan Stone Cave', config: { decay: 3.0, preDelay: 30, diffusion: 0.75, damping: 2800, modulation: 0.15, wetness: 0.30 } },
    { id: 'celestial_lotus', name: 'Celestial Lotus Sphere', config: { decay: 3.8, preDelay: 25, diffusion: 0.80, damping: 4000, modulation: 0.2, wetness: 0.35 } },
    { id: 'bamboo_sanctuary', name: 'Bamboo Forest Sanctuary', config: { decay: 1.8, preDelay: 15, diffusion: 0.90, damping: 5000, modulation: 0.05, wetness: 0.20 } },
    { id: 'still_water', name: 'Still Water Chamber', config: { decay: 1.4, preDelay: 10, diffusion: 0.92, damping: 4500, modulation: 0.0, wetness: 0.15 } },
];

interface Props {
    atmosphere: Record<string, unknown>; // AtmosphereController
    modulation: Record<string, unknown>; // ModulationController
    temporal: Record<string, unknown>;   // TemporalController
    uiConfig: UIConfig;
}

export const ReverbDesigner: React.FC<Props> = ({ 
    atmosphere, modulation, temporal, uiConfig 
}) => {
    // Destructure controllers
    const { reverbConfig: config, delayConfig, setReverbConfig, setDelayConfig, reverbPresets: presets, activeReverbPresetId: activePresetId, handleSelectReverbPreset: onSelectPreset, handleSaveReverbPreset: onSavePreset, handleDeleteReverbPreset: onDeletePreset } = atmosphere;
    const { modulations, handleModulationChange: onModulationChange } = modulation;
    const entrainmentFreq = temporal.binauralFreqs['UNIVERSAL'];

    const update = (key: string, val: string | number | boolean) => setReverbConfig({ ...config, [key]: val });
    const updateDelay = (key: string, val: string | number | boolean) => { if(setDelayConfig && delayConfig) setDelayConfig({ ...delayConfig, [key]: val }); };
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'DIFFUSION' | 'REFLECTION'>('DIFFUSION');
    const activePreset = presets.find((p: ReverbPreset) => p.id === activePresetId) || presets[0];

    return (
        <div className="p-3 border space-y-4" style={{ backgroundColor: `rgba(${uiConfig.cardRgb}, 0.2)`, borderColor: `rgba(${uiConfig.borderRgb}, 0.1)`, borderRadius: uiConfig.borderRadius }}>
            
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: `rgba(${uiConfig.borderRgb}, 0.2)` }}>
                <span className="text-[10px] font-bold uppercase px-1 shrink-0 opacity-60" style={{ color: uiConfig.textColor }}>Space</span>
                <div className="relative flex-1">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-full flex items-center justify-between rounded-md px-2 py-1 border hover:opacity-100 opacity-80 text-[10px] font-mono transition-all" style={{ backgroundColor: `rgba(${uiConfig.borderRgb}, 0.1)`, borderColor: `rgba(${uiConfig.borderRgb}, 0.2)`, color: uiConfig.textColor as string }}>
                        <span className="truncate">{activePreset ? activePreset.name : 'Custom'}</span>
                        <ChevronDown size={10} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-1 border rounded-md shadow-xl z-40 max-h-48 overflow-y-auto" style={{ backgroundColor: `rgb(${uiConfig.cardRgb})`, borderColor: `rgba(${uiConfig.borderRgb}, 0.5)` }}>
                                {presets.map((p: ReverbPreset) => (
                                    <div key={p.id} className="flex items-center justify-between hover:bg-white/5 group px-1 border-b border-white/5 last:border-0">
                                        <button onClick={() => { onSelectPreset(p); setIsMenuOpen(false); }} className="flex-1 text-left py-1.5 px-2 text-[10px] font-mono hover:opacity-100 opacity-70 truncate" style={{ color: uiConfig.textColor as string }}>{p.name}</button>
                                        {!DEFAULT_REVERB_PRESETS.find(dp => dp.id === p.id) && (
                                            <button onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id); }} className="p-1 opacity-50 hover:opacity-100 hover:text-red-400 transition-colors" style={{ color: uiConfig.textColor as string }}><Trash2 size={10} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <button onClick={onSavePreset} className="p-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20"><Save size={12} /></button>
            </div>

            <div className="flex gap-2 p-1 rounded bg-black/20">
                <button onClick={() => setActiveTab('DIFFUSION')} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-colors ${activeTab === 'DIFFUSION' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Diffusion (Verb)</button>
                <button onClick={() => setActiveTab('REFLECTION')} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-colors ${activeTab === 'REFLECTION' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Reflection (Delay)</button>
            </div>

            <div className="flex flex-col gap-4 animate-in slide-in-from-right-2 duration-300">
                
                {activeTab === 'DIFFUSION' && (
                    <>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Decay Time (Zen 1.0 - 4.5s)</span>
                                <span style={{color: uiConfig.primaryColor}}>{config.decay.toFixed(1)}s</span>
                            </div>
                            <ModulationFader value={config.decay} min={1.0} max={4.5} step={0.1} onStaticChange={(v) => update('decay', v)} color="#22d3ee" uiConfig={uiConfig} modNode={modulations['reverbDecay']} onModChange={(n) => onModulationChange('reverbDecay', n)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Reverb Mix (Zen Max 50%)</span>
                                <span style={{color: uiConfig.primaryColor}}>{(config.wetness * 100).toFixed(0)}%</span>
                            </div>
                            <ModulationFader value={config.wetness} min={0} max={0.50} step={0.01} onStaticChange={(v) => update('wetness', v)} color="#a855f7" uiConfig={uiConfig} modNode={modulations['reverbWetness']} onModChange={(n) => onModulationChange('reverbWetness', n)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Diffusion Density</span>
                                <span style={{color: uiConfig.primaryColor}}>{(config.diffusion * 100).toFixed(0)}%</span>
                            </div>
                            <Fader value={config.diffusion} min={0.3} max={1} step={0.05} onChange={(v:number) => update('diffusion', v)} color="#10b981" uiConfig={uiConfig} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span className="flex items-center gap-2">
                                    {config.isEntrainmentSync ? (
                                        <span className="text-cyan-400 font-bold flex items-center gap-1 animate-pulse"><Brain size={10} /> LOCKED: {entrainmentFreq?.toFixed(2) || '---'} Hz</span>
                                    ) : ("LFO Modulation")}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span style={{color: uiConfig.primaryColor}}>{(config.modulation * 100).toFixed(0)}%</span>
                                    <button onClick={() => update('isEntrainmentSync', !config.isEntrainmentSync)} className={`p-1 rounded border transition-all flex items-center justify-center ${config.isEntrainmentSync ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`} title="Sync Reverb LFO to Global Entrainment Frequency"><Waves size={10} /></button>
                                </div>
                            </div>
                            <Fader value={config.modulation} min={0} max={0.5} step={0.05} onChange={(v:number) => update('modulation', v)} color={config.isEntrainmentSync ? "#22d3ee" : "#f43f5e"} uiConfig={uiConfig} />
                        </div>
                    </>
                )}

                {activeTab === 'REFLECTION' && delayConfig && (
                    <>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Delay Time (Zen 150 - 750ms)</span>
                                <span style={{color: uiConfig.primaryColor}}>{Math.round(delayConfig.time * 1000)}ms</span>
                            </div>
                            <ModulationFader value={delayConfig.time} min={0.15} max={0.75} step={0.01} onStaticChange={(v) => updateDelay('time', v)} color="#fbbf24" uiConfig={uiConfig} modNode={modulations['delayTime']} onModChange={(n) => onModulationChange('delayTime', n)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Feedback Tail (Zen Max 45%)</span>
                                <span style={{color: uiConfig.primaryColor}}>{(delayConfig.feedback * 100).toFixed(0)}%</span>
                            </div>
                            <ModulationFader value={delayConfig.feedback} min={0} max={0.45} step={0.01} onStaticChange={(v) => updateDelay('feedback', v)} color="#f97316" uiConfig={uiConfig} modNode={modulations['delayFeedback']} onModChange={(n) => onModulationChange('delayFeedback', n)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Bloom Mix (Zen Max 35%)</span>
                                <span style={{color: uiConfig.primaryColor}}>{(delayConfig.wetness * 100).toFixed(0)}%</span>
                            </div>
                            <ModulationFader value={delayConfig.wetness} min={0} max={0.35} step={0.01} onStaticChange={(v) => updateDelay('wetness', v)} color="#a855f7" uiConfig={uiConfig} modNode={modulations['delayWetness']} onModChange={(n) => onModulationChange('delayWetness', n)} />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><ArrowRightLeft size={12} className="text-cyan-400"/> Ping Pong Stereo Mode</span>
                            <button onClick={() => updateDelay('isPingPong', !delayConfig.isPingPong)} className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${delayConfig.isPingPong ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${delayConfig.isPingPong ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </>
                )}

                {/* CLINICAL ENTRAINMENT SAFEGUARD STATUS */}
                <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center gap-2 text-[8px] text-cyan-300/90 font-mono">
                    <ShieldCheck size={13} className="text-cyan-400 shrink-0" />
                    <span>Clinical Entrainment Safeguard: Heartbeat & Binaural Beat carriers bypass reverb/delay 100% dry.</span>
                </div>
            </div>
        </div>
    );
};