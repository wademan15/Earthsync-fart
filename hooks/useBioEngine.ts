import { useState, useRef, useEffect, useCallback } from 'react';

// MAIN THREAD IMPORT (Unified Architecture)
import { analyzeHRV } from '../services/signalProcessing';

import { INITIAL_DIAGNOSTICS } from '../services/initialState'; 
import { 
    HRMData, 
    DiagnosticsMetrics, 
    TuningSystem, 
    SpectralMetrics, 
    AlphaMetrics,
    SensorMode 
} from '../types';

interface BioEngineProps {
    hrmData: HRMData;
    userAge: number;
    tuningSystem: TuningSystem;
    sensorMode: SensorMode | null;
    isSimulating: boolean;
    poweredModules?: Record<string, boolean>; 
}

export const useBioEngine = ({
    hrmData,
    userAge,
    tuningSystem,
    sensorMode,
    isSimulating,
    poweredModules = {} 
}: BioEngineProps) => {

    // --- 1. STATE (Optimized: Only keeping what Planetary Tuner uses) ---
    const [metrics, setMetrics] = useState<DiagnosticsMetrics>(INITIAL_DIAGNOSTICS);
    
    // We only need these two specific metrics for the Tuner
    const [spectralMetrics, setSpectralMetrics] = useState<SpectralMetrics>({ 
        lfHfRatio: 0, totalPower: 0, vlfPower: 0, lfPower: 0, hfPower: 0, 
        lfNu: 0, hfNu: 0, dominantFreq: 0, coherenceScore: 0, 
        spectralState: 'CALIBRATING', stateDescription: 'Buffering...', 
        stateColor: '#64748b', noiseFloor: 0, respRate: 0 
    });
    
    const [alphaMetrics, setAlphaMetrics] = useState<AlphaMetrics>({ 
        schumannScore: 0, isLocked: false, brainState: 'CALIBRATING', 
        voiceMessage: 'Waiting...', bestLockType: 'NONE', bestLockHarmonic: 0, 
        targetFreq: 0, currentFreq: 0, schumannTarget: 0, schumannDeviation: 0 
    });
    
    const [status, setStatus] = useState<'IDLE' | 'CALIBRATING' | 'ACTIVE' | 'ERROR'>('IDLE');

    // --- REFS ---
    const rrBufferRef = useRef<number[]>([]);
    const rawEcgBufferRef = useRef<number[]>([]);
    const accBufferRef = useRef<{t: number, x: number, y: number, z: number}[]>([]);

    const applyResults = useCallback((r: any) => {
        if (!r.diagnostics) return;

        // THE FIX: Clone the diagnostics object to honor Immutability Rules. 
        // Prevents fatal crashes if the DSP layer returns frozen objects.
        const safeDiagnostics = { ...r.diagnostics };

        // In simulation or AETHER mode, label the source safely
        if (isSimulating || sensorMode === 'AETHER') {
            safeDiagnostics.ecgSource = "McSharry-Clifford ODE";
            safeDiagnostics.ecgProtocol = "BIO-SIMULATION";
        }

        // Update core diagnostics with the safe clone
        setMetrics(safeDiagnostics);

        // Update only the metrics needed for Tuner
        if(r.spectral) setSpectralMetrics(r.spectral);
        if(r.alpha) setAlphaMetrics(r.alpha);

        setStatus('ACTIVE');
    }, [isSimulating, sensorMode]);

    const poweredModulesRef = useRef(poweredModules);
    useEffect(() => { poweredModulesRef.current = poweredModules; }, [poweredModules]);
    
    const hrmDataRef = useRef(hrmData);
    useEffect(() => { hrmDataRef.current = hrmData; }, [hrmData]);

    useEffect(() => {
        // MAIN THREAD PROCESSING LOGIC
        // If SensorMode is AETHER, we expect hrmData to come from BioSimEngine, 
        // effectively treating it like a hardware source but labeled as Sim.
        
        const currentHrm = hrmDataRef.current;
        if (!currentHrm.rrIntervals.length) return;
        
        // Convert to standard array if needed (though already number[])
        const rrStandard = currentHrm.rrIntervals;
        
        try {
            // Run Analysis Synchronously (Fast enough for < 1000 points)
            const results = analyzeHRV(
                rrStandard,
                currentHrm.bpm,
                userAge,
                tuningSystem,
                poweredModulesRef.current
            );
            
            applyResults({ 
                ...results,
                mlConfidence: 0,
                zeroPoint: null,
                carrier: null,
                livingStoneMesh: null,
                oracle: { nextBeatMs: 0, confidence: 0 }
            }); 
        } catch (err) {
            console.error("[BioEngine] Analysis Error", err);
            setStatus('ERROR');
        }

    }, [hrmData.timestamp, userAge, tuningSystem, applyResults, sensorMode]); 

    const resetEngine = useCallback(() => {
        setMetrics(INITIAL_DIAGNOSTICS);
        rrBufferRef.current = [];
        rawEcgBufferRef.current = [];
        accBufferRef.current = [];
        setStatus('IDLE');
    }, []);

    // No-op for main thread version
    const processOpticalSample = useCallback((val: number, time: number, redness: number) => {}, []);
    const processEcgSample = useCallback((val: number, time: number) => {}, []);

    return {
        metrics, 
        spectralMetrics, 
        alphaMetrics,
        status,
        resetEngine, 
        processOpticalSample, 
        processEcgSample
    };
};