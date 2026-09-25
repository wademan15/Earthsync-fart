import React, { useState } from 'react';
import { X, Play, Anchor, Eye, Activity, Sparkles, Globe, Music2, Network, Atom, Heart, Code, Check, Radio, Disc } from 'lucide-react';
import { UIConfig } from '../../system/StyleEditor';
import { LatticeGlobalConfig, ImmersionConfig } from '../visuals/shared';
import { BreathConfig } from '../../../hooks/usePlanetaryAudio';

export interface HarmonicPackage {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    
    // AUDIO & TEMPORAL SETTINGS
    channelsToUnmute?: string[]; 
    stacksToUnmute?: string[];   
    entrainmentFreq?: number;    
    breathConfig?: Partial<BreathConfig>; 
    customFrequencies?: Record<string, number>;
    
    // IMMERSION & PHYSICS
    immersionConfig?: Partial<ImmersionConfig>;
    physicsConfig?: Partial<LatticeGlobalConfig>;
    visualMode?: string; 
}

const PACKAGES: HarmonicPackage[] = [
    // --- 0. DIRECT CONSCIOUSNESS & BLINDFOLD VISION PROTOCOLS ---
    {
        id: 'FLAME_IN_MIND_OUTERVISION',
        name: 'OuterVision (Flame in Mind)',
        description: 'Phase-conjugate blindfold trance matrix based on Dan Winter & Patrick Botte EEG spectra. Pure Golden Ratio cascade without octave dissociation, anchored to 8.0Hz Alpha, 0.1Hz HRV Mayer wave, and 180° bilateral phase inversion.',
        icon: Eye,
        color: '#38bdf8',
        channelsToUnmute: [
            'UNIVERSAL_840', // 256.00 Hz (Center Carrier Reference Node)
            'UNIVERSAL_841', // 260.94 Hz (4.94 Hz Theta Gateway: 8.0 * phi^-1)
            'UNIVERSAL_842', // 264.00 Hz (8.00 Hz Alpha Fundamental: 8.0 * phi^0)
            'UNIVERSAL_843', // 268.94 Hz (12.94 Hz Low Beta: 8.0 * phi^1)
            'UNIVERSAL_844', // 276.94 Hz (20.94 Hz High Beta: 8.0 * phi^2)
            'UNIVERSAL_845', // 289.89 Hz (33.88 Hz Gamma Direct Vision: 8.0 * phi^3)
            'UNIVERSAL_846', // 310.83 Hz (54.83 Hz Implosion Tip: 8.0 * phi^4)
            'UNIVERSAL_847'  // 414.21 Hz (Optical Transverse Projection: 256 * phi)
        ],
        customFrequencies: {
            'UNIVERSAL_840': 256.00,
            'UNIVERSAL_841': 260.94,
            'UNIVERSAL_842': 264.00,
            'UNIVERSAL_843': 268.94,
            'UNIVERSAL_844': 276.94,
            'UNIVERSAL_845': 289.89,
            'UNIVERSAL_846': 310.83,
            'UNIVERSAL_847': 414.21
        },
        entrainmentFreq: 8.0,
        breathConfig: {
            inhale: 5.0,
            holdIn: 0.0,
            exhale: 5.0,
            holdOut: 0.0,
            isBreathActive: true,
            cueBase: 'SCHUMANN',
            cueHarmonic: 16,
            visualMode: 'RING',
            colorScheme: 'CYAN'
        },
        immersionConfig: {
            pulseMode: 'BINAURAL',
            activeLayers: ['binaural'],
            isConjugatePhase: true,         // Enforces 180° Anti-Phase polarity
            isTimeCrystal: true,
            timeCrystalTopology: 'FIBONACCI',
            isPhoticStrobe: true,
            strobeOpacity: 0.45,
            isGoldenPanner: true,
            isCarrierDrift: false,
            isochronicHardEdge: false,       // Enforces soft sine envelope to quiet frontal lobes
            isPACGated: true,                // Enforces Alpha-gated Gamma bursts
            composerWarp: 'LINEAR'
        },
        visualMode: 'INTERFERENCE',
        physicsConfig: {
            geometryMode: 'CONJUGATE_VORTEX',
            waveDensity: 1.618,
            masterOpacity: 0.85
        }
    },

    // --- 1. CORE GROUNDING PROTOCOLS ---
    {
        id: 'DEEP_REST',
        name: 'Deep Rest',
        description: 'Delta waves combined with a slow 4-7-8 breathing pattern to induce profound physical relaxation and sleep preparation.',
        icon: Anchor,
        color: '#34d399', 
        channelsToUnmute: ['UNIVERSAL_0', 'UNIVERSAL_6'], 
        entrainmentFreq: 1.5, 
        breathConfig: { inhale: 4.0, holdIn: 7.0, exhale: 8.0, holdOut: 0.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isTimeCrystal: false, composerWarp: 'LINEAR' },
        visualMode: 'GLOW'
    },
    {
        id: 'FLOW_STATE',
        name: 'Flow State',
        description: 'Alpha frequencies and balanced box breathing to cultivate a calm, centered, and highly focused mind.',
        icon: Activity,
        color: '#22d3ee', 
        channelsToUnmute: ['UNIVERSAL_1', 'UNIVERSAL_3'], 
        entrainmentFreq: 10.0, 
        breathConfig: { inhale: 4.0, holdIn: 4.0, exhale: 4.0, holdOut: 4.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'ISOCHRONIC', isTimeCrystal: false, composerWarp: 'LINEAR' },
        visualMode: 'RING'
    },
    {
        id: 'HEART_COHERENCE',
        name: 'Heart Coherence',
        description: 'Synchronizes breathing with the 0.1Hz Mayer Wave to optimize heart rate variability and emotional balance.',
        icon: Heart, 
        color: '#fb7185', 
        channelsToUnmute: ['UNIVERSAL_2', 'UNIVERSAL_5'], 
        entrainmentFreq: 0.1, 
        breathConfig: { inhale: 5.5, holdIn: 0.0, exhale: 5.5, holdOut: 0.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isTimeCrystal: false, composerWarp: 'LINEAR' },
        visualMode: 'HORIZON'
    },

    // --- 2. ADVANCED ESOTERIC & QUANTUM PROTOCOLS ---
    {
        id: 'NANOBRAIN_LATTICE',
        name: 'Microtubule Resonance',
        description: 'Inspired by Anirban Bandyopadhyay. Uses Thue-Morse time crystals to create polyatomic, non-repeating gamma structures.',
        icon: Network,
        color: '#d946ef', 
        channelsToUnmute: ['UNIVERSAL_501', 'UNIVERSAL_503', 'UNIVERSAL_504'], 
        entrainmentFreq: 40.0, 
        breathConfig: { inhale: 4.0, holdIn: 2.0, exhale: 4.0, holdOut: 2.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'ISOCHRONIC', isTimeCrystal: true, timeCrystalTopology: 'THUE_MORSE', composerWarp: 'LINEAR' },
        visualMode: 'DOT' 
    },
    {
        id: 'CLYNES_MOZART',
        name: 'Sentic Joy (Mozart)',
        description: 'Applies Manfred Clynes\' "Mozart Pulse" to the amplitude envelope, warping timing to induce spatial lightness and joy.',
        icon: Music2,
        color: '#fbbf24', 
        channelsToUnmute: ['UNIVERSAL_100', 'UNIVERSAL_104', 'UNIVERSAL_107'], 
        entrainmentFreq: 12.0, 
        breathConfig: { inhale: 3.0, holdIn: 1.0, exhale: 4.0, holdOut: 1.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'ISOCHRONIC', isTimeCrystal: false, composerWarp: 'MOZART' },
        visualMode: 'CHEVRON'
    },
    {
        id: 'CLYNES_BEETHOVEN',
        name: 'Sentic Will (Beethoven)',
        description: 'Applies the "Beethoven Pulse"—a heavy, forward-driving micro-timing matrix—anchored to the Schumann resonance.',
        icon: Music2,
        color: '#ea580c', 
        channelsToUnmute: ['UNIVERSAL_202', 'UNIVERSAL_204'], 
        entrainmentFreq: 7.83, 
        breathConfig: { inhale: 5.0, holdIn: 2.0, exhale: 6.0, holdOut: 0.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isTimeCrystal: false, composerWarp: 'BEETHOVEN' },
        visualMode: 'VIGNETTE'
    },
    {
        id: 'WINTER_IMPLOSION',
        name: 'Fractal Implosion',
        description: 'Phase conjugate pump waves based on Dan Winter’s Golden Ratio exponents. Utilizes a Fibonacci time crystal rhythm.',
        icon: Sparkles,
        color: '#facc15', 
        channelsToUnmute: ['UNIVERSAL_400', 'UNIVERSAL_401', 'UNIVERSAL_402'], 
        entrainmentFreq: 1.618, 
        breathConfig: { inhale: 5.5, holdIn: 2.0, exhale: 5.5, holdOut: 2.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'ISOCHRONIC', isTimeCrystal: true, timeCrystalTopology: 'FIBONACCI', isFractalSync: true },
        visualMode: 'GLOW'
    },
    {
        id: 'MERRICK_MATRIX',
        name: 'The Merrick Matrix',
        description: 'Utilizes Just Intonation and Perfect Fifths to create stable Fibonacci damping wells for consciousness mapping.',
        icon: Anchor,
        color: '#06b6d4', 
        channelsToUnmute: ['UNIVERSAL_500', 'UNIVERSAL_501'], 
        entrainmentFreq: 8.0, 
        breathConfig: { inhale: 5.0, holdIn: 0.0, exhale: 5.0, holdOut: 0.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isPerfectFifth: true, composerWarp: 'LINEAR' },
        visualMode: 'HORIZON'
    },
    {
        id: 'PUHARICH_GATE',
        name: 'Shamanic Trance Gate',
        description: 'Locks into the 4.0Hz neural gating frequency observed by Puharich in indigenous drumming. Prime number topology.',
        icon: Eye,
        color: '#8b5cf6', 
        channelsToUnmute: ['UNIVERSAL_300', 'UNIVERSAL_302'], 
        entrainmentFreq: 4.0, 
        breathConfig: { inhale: 3.0, holdIn: 0.0, exhale: 3.0, holdOut: 0.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'ISOCHRONIC', isTimeCrystal: true, timeCrystalTopology: 'PRIME', composerWarp: 'LINEAR' },
        visualMode: 'CHEVRON'
    },
    {
        id: 'BENTOV_AORTA',
        name: 'The Bentov Protocol',
        description: 'Induces the 7.0Hz aortic standing wave and planetary resonance described in Stalking the Wild Pendulum.',
        icon: Atom,
        color: '#f43f5e', 
        channelsToUnmute: ['UNIVERSAL_200', 'UNIVERSAL_201'], 
        entrainmentFreq: 7.0, 
        breathConfig: { inhale: 4.0, holdIn: 0.0, exhale: 4.0, holdOut: 0.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isTimeCrystal: false, composerWarp: 'LINEAR' },
        visualMode: 'RING' 
    },
    {
        id: 'WELL_TEMPERED_BACH',
        name: 'Well-Tempered Harmony',
        description: 'Historic Werckmeister circular temperament tuned to natural 432Hz. Unmutes a pure C-major triad (C, E, G) for contemplation.',
        icon: Music2,
        color: '#06b6d4',
        channelsToUnmute: ['UNIVERSAL_800', 'UNIVERSAL_804', 'UNIVERSAL_807'],
        entrainmentFreq: 8.0,
        breathConfig: { inhale: 4.0, holdIn: 2.0, exhale: 4.0, holdOut: 2.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isTimeCrystal: false, composerWarp: 'LINEAR' },
        visualMode: 'CYMATIC'
    },
    {
        id: 'THE_KNOB_SWEEP',
        name: 'The Knob (Live Sweep)',
        description: 'Engages the continuous rotary frequency dial for live harmonic sweeping, glissando pitch sweeps, and interactive cymatic visualizer nodal shifts.',
        icon: Radio,
        color: '#06b6d4',
        channelsToUnmute: ['UNIVERSAL_799'],
        entrainmentFreq: 8.0,
        breathConfig: { inhale: 4.0, holdIn: 2.0, exhale: 4.0, holdOut: 2.0, isBreathActive: true },
        immersionConfig: { pulseMode: 'BINAURAL', isTimeCrystal: false, composerWarp: 'LINEAR' },
        visualMode: 'CYMATIC'
    }
];

interface MenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pkg: HarmonicPackage) => void;
    uiConfig: UIConfig;
    activeBank: string;
    controller?: Record<string, unknown>; // Added Controller Prop
}

export const HarmonicPackageMenu: React.FC<MenuProps> = ({ isOpen, onClose, onSelect, controller }) => {
    const [previewId, setPreviewId] = useState<string>(PACKAGES[0].id);
    const [copied, setCopied] = useState(false);

    // THE EXPORTER: Maps live state to HarmonicPackage format
    const handleCopyPresetJSON = () => {
        if (!controller?.loopDataRef?.current) return;
        const state = controller.loopDataRef.current;
        
        // Find which channels are unmuted
        const channelsToUnmute = Object.entries(state.mutes || {})
            .filter(([, isMuted]) => !isMuted)
            .map(([id]) => id);

        const stacksToUnmute = Object.entries(state.stackMutes || {})
            .filter(([, isMuted]) => !isMuted)
            .map(([id]) => id);

        const exportedPackage = {
            id: `CUSTOM_${Date.now()}`,
            name: "My Custom Preset",
            description: "Exported from live session state.",
            icon: "Activity", // Reminder: In code, change string "Activity" to actual Component Activity
            color: "#06b6d4",
            channelsToUnmute,
            stacksToUnmute,
            entrainmentFreq: state.binauralFreqs?.['UNIVERSAL'] || 8.0,
            breathConfig: state.breathConfig,
            immersionConfig: state.immersionConfig,
            physicsConfig: state.latticeConfig,
            visualMode: state.activePhysicsMode
        };

        const jsonString = JSON.stringify(exportedPackage, null, 4);
        navigator.clipboard.writeText(jsonString).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (!isOpen) return null;

    const previewPkg = PACKAGES.find(p => p.id === previewId) || PACKAGES[0];

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200 pointer-events-auto">
            <div className="flex-1 flex flex-col max-w-md w-full mx-auto bg-slate-950 border-x border-white/10 shadow-2xl relative overflow-hidden">
                
                <div className="p-6 shrink-0 relative bg-gradient-to-b from-cyan-900/40 to-slate-950">
                    
                    {/* NEW: Developer Copy JSON Button */}
                    {controller && (
                        <button 
                            onClick={handleCopyPresetJSON}
                            className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${copied ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20'}`}
                            title="Developer: Copy Current State as JSON"
                        >
                            {copied ? <Check size={12} className="stroke-[3]" /> : <Code size={12} />}
                            <span className="text-[9px] font-bold uppercase tracking-widest">{copied ? 'JSON COPIED' : 'COPY JSON'}</span>
                        </button>
                    )}

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                    
                    <div className="flex justify-center mt-8 mb-4">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                            <Globe size={12} /> Harmonic Protocol
                        </span>
                    </div>
                    
                    <h2 className="text-2xl font-light text-center text-white mb-2 tracking-wide">{previewPkg.name}</h2>
                    <p className="text-xs text-center text-slate-300 leading-relaxed mb-6 px-2 font-medium">{previewPkg.description}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {previewPkg.entrainmentFreq && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-slate-200 px-2 py-1 rounded border border-white/10">
                                    Beat: {previewPkg.entrainmentFreq}Hz
                                </span>
                            )}
                            {previewPkg.immersionConfig?.pulseMode && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-slate-200 px-2 py-1 rounded border border-white/10">
                                    Mode: {previewPkg.immersionConfig.pulseMode}
                                </span>
                            )}
                            {previewPkg.immersionConfig?.isTimeCrystal && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-fuchsia-300 px-2 py-1 rounded border border-fuchsia-500/30">
                                    Crystal: {previewPkg.immersionConfig.timeCrystalTopology}
                                </span>
                            )}
                            {previewPkg.immersionConfig?.composerWarp && previewPkg.immersionConfig.composerWarp !== 'LINEAR' && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-amber-300 px-2 py-1 rounded border border-amber-500/30">
                                    Pulse: {previewPkg.immersionConfig.composerWarp}
                                </span>
                            )}
                            {previewPkg.breathConfig && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-slate-200 px-2 py-1 rounded border border-white/10">
                                    Breath: {previewPkg.breathConfig.inhale}-{previewPkg.breathConfig.holdIn}-{previewPkg.breathConfig.exhale}-{previewPkg.breathConfig.holdOut}
                                </span>
                            )}
                    </div>

                    <button 
                        onClick={() => { onSelect(previewPkg); onClose(); }} 
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-widest text-sm rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Play size={16} fill="currentColor" /> Activate Protocol
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4 space-y-2">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 border-l-2 border-white/10 ml-1 mb-2">Available Protocols</div>
                    <div className="grid grid-cols-1 gap-2">
                        {PACKAGES.map(p => {
                            const isPreview = previewId === p.id;
                            const Icon = p.icon;
                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => setPreviewId(p.id)}
                                    onDoubleClick={() => { onSelect(p); onClose(); }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center justify-between group ${isPreview ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-md bg-black/50 border border-white/5" style={{ color: p.color }}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold transition-colors ${isPreview ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{p.name}</span>
                                            <span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-500">{p.entrainmentFreq ? `${p.entrainmentFreq}Hz Target` : 'Custom Target'}</span>
                                        </div>
                                    </div>
                                    {isPreview && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_currentColor]" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};