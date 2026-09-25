import { useState, useEffect, useCallback, useMemo } from 'react';
import { LatticeGlobalConfig, ModulationNode } from '../../components/modules/visuals/shared';
import { VISUALIZER_PLUGINS } from '../../components/modules/visuals/VisualizerRegistry';
import { PhysicsPreset } from '../../components/modules/designers/PhysicsDesigner';

export const useLatticeEngine = () => {
    // 1. Build the global library dynamically from the new Plugin Registry
    const factoryPresets = useMemo(() => {
        const presets: PhysicsPreset[] = [];
        Object.values(VISUALIZER_PLUGINS).forEach(plugin => {
            plugin.presets.forEach(p => {
                presets.push({ id: p.id, name: p.name, mode: plugin.id, config: p.config, modulations: p.modulations || {} });
            });
        });
        return presets;
    }, []);

    const [physicsLibrary, setPhysicsLibrary] = useState<PhysicsPreset[]>(() => {
        let userPresets: PhysicsPreset[] = [];
        try { const saved = localStorage.getItem('ppl_physics_library'); if (saved) userPresets = JSON.parse(saved); } catch(e) {}
        return [...factoryPresets, ...userPresets];
    });

    const getSavedActiveMode = () => { 
        try { 
            const saved = localStorage.getItem('ppl_active_visualizer'); 
            if (saved === '3D_INTERFERENCE') return 'INTERFERENCE';
            if (saved && VISUALIZER_PLUGINS[saved]) return saved; 
        } catch (e) {} 
        return 'BIO-BLOOM'; 
    };
    
    const [activePhysicsMode, setActivePhysicsMode] = useState<string>(getSavedActiveMode);
    
    const [activePhysicsPresetId, setActivePhysicsPresetId] = useState<string>(() => { 
        const mode = getSavedActiveMode(); 
        const defaultPreset = VISUALIZER_PLUGINS[mode]?.presets[0];
        return defaultPreset ? defaultPreset.id : `factory_${mode}_0`;
    });

    // FIX 1: Ensure initial boot loads the first preset's config, not just the raw default
    const [latticeConfig, setLatticeConfig] = useState<LatticeGlobalConfig>(() => {
        const mode = getSavedActiveMode();
        const plugin = VISUALIZER_PLUGINS[mode];
        const defaultPreset = plugin?.presets[0];

        const baseDefaults = {
            visualScale: 1.0, masterOpacity: 1.0, reactivity: 0.5, force: 1.0,
            ...(plugin?.defaultConfig || {}),
            ...(defaultPreset?.config || {}) // Overwrite raw defaults with Preset 01
        };
        
        try { 
            const saved = localStorage.getItem('ppl_last_physics_config'); 
            if (saved) return { ...baseDefaults, ...JSON.parse(saved) }; 
        } catch(e) {}

        return baseDefaults;
    });

    useEffect(() => { localStorage.setItem('ppl_last_physics_config', JSON.stringify(latticeConfig)); }, [latticeConfig]);
    useEffect(() => { localStorage.setItem('ppl_active_visualizer', activePhysicsMode); }, [activePhysicsMode]);

    // FIX 2: Correctly pull config and modulations from Preset 01 on swipe
    const setMode = useCallback((mode: string): Record<string, ModulationNode> => {
        setActivePhysicsMode(mode);
        const plugin = VISUALIZER_PLUGINS[mode];
        
        if (plugin) {
            const defaultPreset = plugin.presets[0];
            
            setLatticeConfig(prev => {
                const safeGlobals = {
                    visualScale: prev.visualScale ?? 1.0,
                    masterOpacity: prev.masterOpacity ?? 1.0,
                    reactivity: prev.reactivity ?? 0.5,
                    force: prev.force ?? 1.0
                };
                
                if (defaultPreset) {
                    return { ...plugin.defaultConfig, ...safeGlobals, ...defaultPreset.config };
                }
                
                return { ...safeGlobals, ...plugin.defaultConfig };
            });
            
            if (defaultPreset) {
                setActivePhysicsPresetId(defaultPreset.id);
                return defaultPreset.modulations || {}; // Return exact modulations for this preset
            }
        }
        return {}; 
    }, []);

    const loadPreset = useCallback((presetId: string) => {
        const preset = physicsLibrary.find(p => p.id === presetId);
        if (preset) {
            setActivePhysicsPresetId(presetId);
            setActivePhysicsMode(preset.mode);
            const plugin = VISUALIZER_PLUGINS[preset.mode];
            
            if (plugin) {
                setLatticeConfig(prev => {
                    const safeGlobals = {
                        visualScale: preset.config.visualScale ?? prev.visualScale ?? 1.0,
                        masterOpacity: preset.config.masterOpacity ?? prev.masterOpacity ?? 1.0,
                        reactivity: preset.config.reactivity ?? prev.reactivity ?? 0.5,
                        force: preset.config.force ?? prev.force ?? 1.0
                    };
                    return { ...plugin.defaultConfig, ...safeGlobals, ...preset.config };
                });
            }
            return preset;
        }
        return null;
    }, [physicsLibrary]);

    const savePreset = useCallback((name: string, currentConfig: LatticeGlobalConfig, currentModulations: Record<string, ModulationNode>) => {
        const newPreset: PhysicsPreset = { id: `user_${Date.now()}`, name, mode: activePhysicsMode, config: currentConfig, modulations: currentModulations };
        setPhysicsLibrary(prev => { const next = [...prev, newPreset]; localStorage.setItem('ppl_physics_library', JSON.stringify(next.filter(p => p.id.startsWith('user_')))); return next; });
        setActivePhysicsPresetId(newPreset.id);
    }, [activePhysicsMode]);

    const deletePreset = useCallback((id: string) => {
        setPhysicsLibrary(prev => { const next = prev.filter(p => p.id !== id); localStorage.setItem('ppl_physics_library', JSON.stringify(next.filter(p => p.id.startsWith('user_')))); return next; });
        const plugin = VISUALIZER_PLUGINS[activePhysicsMode];
        if (activePhysicsPresetId === id && plugin && plugin.presets[0]) setActivePhysicsPresetId(plugin.presets[0].id);
    }, [activePhysicsPresetId, activePhysicsMode]);

    return {
        latticeConfig, activePhysicsMode, activePhysicsPresetId, physicsLibrary,
        setLatticeConfig, setMode, setActivePhysicsPresetId, loadPreset, savePreset, deletePreset
    };
};