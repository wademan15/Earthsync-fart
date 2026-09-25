import { useState, useCallback } from 'react';
import { ModulationNode } from '../../components/modules/visuals/shared';
import { getVisualizerPresets } from '../../components/modules/visuals/VisualizerRegistry';

const getBootModulations = (): Record<string, ModulationNode> => {
    try {
        const mode = localStorage.getItem('ppl_active_visualizer') || 'BIO-BLOOM';
        const presets = getVisualizerPresets(mode);
        if (presets && presets.length > 0) {
            return presets[0].modulations || {};
        }
    } catch (e) {
        console.error(e);
    }
    return {};
};

export const useModulationEngine = () => {
    // Initialize with the exact modulations of the boot preset instead of an empty object
    const [modulations, setModulations] = useState<Record<string, ModulationNode>>(getBootModulations);
    
    const [modMap, setModMap] = useState<Record<string, boolean>>({ 'filter': true });
    const [macroA, setMacroA] = useState(0);
    const [macroB, setMacroB] = useState(0);

    const handleModulationChange = useCallback((key: string, node: ModulationNode) => {
        setModulations(prev => ({ ...prev, [key]: node }));
    }, []);

    const handleMacroChange = useCallback((a: number, b: number) => {
        setMacroA(a);
        setMacroB(b);
    }, []);

    const toggleMod = useCallback((key: string) => {
        setModMap(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    return {
        modulations, setModulations,
        modMap, setModMap,
        macroA, setMacroA,
        macroB, setMacroB,
        handleModulationChange, handleMacroChange, toggleMod
    };
};