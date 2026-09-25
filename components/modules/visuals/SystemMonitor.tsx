
import React, { useEffect, useRef } from 'react';
import { AudioTelemetry } from '../../../hooks/usePlanetaryAudio';
import { UIConfig } from '../../system/StyleEditor';

interface Props {
    telemetry: AudioTelemetry | null;
    uiConfig: UIConfig;
    isAudioEnabled: boolean;
}

export const SystemMonitor: React.FC<Props> = ({ telemetry, isAudioEnabled }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef(0);

    // Buffers for Analysis (Pre-allocated)
    const bufferSize = 2048; // Time Domain
    const dataL = useRef(new Float32Array(bufferSize));
    const dataR = useRef(new Float32Array(bufferSize));
    const dataPre = useRef(new Float32Array(bufferSize));
    const dataPost = useRef(new Float32Array(bufferSize));

    const telemetryRef = useRef(telemetry);
    useEffect(() => {
        telemetryRef.current = telemetry;
    }, [telemetry]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = 0;
        let h = 0;

        const updateSize = () => {
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            w = Math.round(rect.width);
            h = Math.round(rect.height);
            if (w <= 0 || h <= 0) return;
            const targetW = Math.floor(w * dpr);
            const targetH = Math.floor(h * dpr);
            if (canvas.width !== targetW || canvas.height !== targetH) {
                canvas.width = targetW;
                canvas.height = targetH;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            }
        };

        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(canvas);

        const draw = () => {
            if (w <= 0 || h <= 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            // CLEAR
            ctx.fillStyle = `rgb(5, 10, 15)`; // Technical Dark
            ctx.fillRect(0, 0, w, h);

            // GRID
            ctx.strokeStyle = `rgba(34, 211, 238, 0.1)`; // Cyan grid
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Vertical lines
            for(let i=0; i<=4; i++) {
                ctx.moveTo((w/4)*i, 0); ctx.lineTo((w/4)*i, h);
            }
            // Horizontal lines
            for(let i=0; i<=4; i++) {
                ctx.moveTo(0, (h/4)*i); ctx.lineTo(w, (h/4)*i);
            }
            ctx.stroke();

            const currentTelemetry = telemetryRef.current;
            if (!currentTelemetry || !isAudioEnabled) {
                // OFFLINE STATE
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.font = '10px monospace';
                ctx.fillText('NO SIGNAL', w/2 - 25, h/2);
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            const { analysers, nodes } = currentTelemetry;

            // 1. FETCH DATA
            analysers.left.getFloatTimeDomainData(dataL.current);
            analysers.right.getFloatTimeDomainData(dataR.current);
            analysers.preLimit.getFloatTimeDomainData(dataPre.current);
            analysers.postLimit.getFloatTimeDomainData(dataPost.current);

            // --- 2. GONIOMETER (Middle) ---
            const gSize = Math.min(w, h) * 0.6;
            const cx = w / 2;
            const cy = h / 2;

            ctx.save();
            ctx.translate(cx, cy);
            
            // Background Circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); ctx.arc(0,0, gSize/2, 0, Math.PI*2); ctx.stroke();

            // Diagonal Axis (L/R)
            ctx.beginPath(); ctx.moveTo(-gSize/2, -gSize/2); ctx.lineTo(gSize/2, gSize/2); ctx.stroke(); // L+R (Mid)
            ctx.beginPath(); ctx.moveTo(gSize/2, -gSize/2); ctx.lineTo(-gSize/2, gSize/2); ctx.stroke(); // L-R (Side)

            // Lissajous Plot
            ctx.strokeStyle = '#22d3ee'; // Cyan
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#22d3ee';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            // Decimate for performance (draw every 4th sample)
            for(let i=0; i<bufferSize; i+=4) {
                const l = dataL.current[i];
                const r = dataR.current[i];
                
                // Rotation 45 degrees:
                // X = (L - R) * 0.707
                // Y = (L + R) * 0.707
                // But simplified mapping: L->X, R->Y is also common. Let's do Standard X/Y mapping first.
                // Actually, standard Goniometer:
                // X = Side (L-R)
                // Y = Mid (L+R)
                const x = (l - r) * (gSize * 0.5);
                const y = -(l + r) * (gSize * 0.5); // Invert Y for screen coords

                if (i===0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();

            // --- 3. LIMITER METER (Right Side) ---
            const meterW = 20;
            const meterH = h * 0.8;
            const meterX = w - 40;
            const meterY = (h - meterH) / 2;

            // RMS Calc
            let sumSqPost = 0;
            for(let i=0; i<bufferSize; i++) sumSqPost += dataPost.current[i] * dataPost.current[i];
            const rmsPost = Math.sqrt(sumSqPost / bufferSize);
            const dbPost = 20 * Math.log10(rmsPost + 0.00001); // Prevent -Infinity
            
            // Map dB (-60 to 0) to height
            const normDb = Math.max(0, (dbPost + 60) / 60); 
            
            // Draw Track
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(meterX, meterY, meterW, meterH);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(meterX, meterY, meterW, meterH);

            // Draw Level
            const levelH = normDb * meterH;
            ctx.fillStyle = normDb > 0.95 ? '#f43f5e' : '#34d399'; // Red clip, Green good
            ctx.fillRect(meterX, meterY + meterH - levelH, meterW, levelH);

            // Draw GR (Gain Reduction) - Inverted from Top
            const reductionDb = nodes.limiter.reduction; // Always negative or 0
            const grHeight = (Math.abs(reductionDb) / 20) * meterH; // Scale: 20dB reduction = full bar (extreme)
            
            if (Math.abs(reductionDb) > 0.1) {
                ctx.fillStyle = 'rgba(251, 113, 133, 0.8)'; // Rose
                ctx.fillRect(meterX, meterY, meterW, Math.min(meterH, grHeight));
                // Label
                ctx.fillStyle = '#f43f5e';
                ctx.fillText(`${reductionDb.toFixed(1)}dB`, meterX - 35, meterY + 10);
            }

            // --- 4. PANNER RADAR (Left Side) ---
            const panX = 40;
            const panY = h - 40;
            const panR = 25;
            
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.arc(panX, panY, panR, Math.PI, 0); ctx.stroke(); // Semi circle
            ctx.beginPath(); ctx.moveTo(panX - panR, panY); ctx.lineTo(panX + panR, panY); ctx.stroke(); // Base

            // Use a default or state-driven value instead of reading AudioParam.value synchronously
            const panVal = 0; // -1 to 1
            const panAngle = (panVal * -1 * Math.PI / 2) - (Math.PI / 2); // 0 is up (-PI/2)
            
            const headX = panX + Math.cos(panAngle) * panR;
            const headY = panY + Math.sin(panAngle) * panR;

            ctx.fillStyle = '#facc15'; // Gold
            ctx.beginPath(); ctx.arc(headX, headY, 4, 0, Math.PI*2); ctx.fill();
            
            // Labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText("PAN", panX - 10, panY + 15);
            ctx.fillText("OUT", meterX, meterY + meterH + 15);
            ctx.fillText("GONIOMETER", cx - 30, cy + gSize/2 + 15);

            rafRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [isAudioEnabled]);

    return (
        <div className="w-full h-32 border border-white/10 rounded-lg overflow-hidden relative bg-black">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-2 left-2 text-[8px] font-bold text-cyan-500 uppercase tracking-widest bg-black/50 px-1 rounded">
                Signal Chain Monitor
            </div>
        </div>
    );
};
