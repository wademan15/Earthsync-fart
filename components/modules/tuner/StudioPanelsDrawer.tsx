import React, { useState, useRef } from 'react';
import { 
  GripVertical, Atom, ArrowDown, Grid, RotateCcw, 
  MoveHorizontal, ChevronDown, ChevronRight 
} from 'lucide-react';
import { Fader } from '../../ui/Faders';
import { PhysicsDesigner } from '../designers/PhysicsDesigner';
import { ErrorBoundary } from '../../system/ErrorBoundary';
import type { LayoutProfile, LayoutProfileData, LayoutElement } from '../PlanetaryTunerModule';

interface ControlSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  uiConfig: Record<string, unknown>;
}

const ControlSection: React.FC<ControlSectionProps> = ({ 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  children, 
  headerAction, 
  uiConfig 
}) => (
  <div className="transition-colors bg-opacity-50">
    <div 
      className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer select-none" 
      onClick={onToggle} 
      style={{ backgroundColor: `rgba(${uiConfig.cardRgb}, ${Math.max(0, (uiConfig.bgOpacity as number) - 0.1)})` }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80" style={{ color: uiConfig.textColor as string }}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {headerAction && (
          <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
        )}
        {isExpanded ? (
          <ChevronDown size={12} className="opacity-50" style={{ color: uiConfig.textColor as string }} />
        ) : (
          <ChevronRight size={12} className="opacity-50" style={{ color: uiConfig.textColor as string }} />
        )}
      </div>
    </div>
    {isExpanded && (
      <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
        <div className="mt-2">{children}</div>
      </div>
    )}
  </div>
);

const DEFAULT_PANEL_ORDER = ['LAYOUT', 'TUNING', 'PHYSICS'];

export interface StudioPanelsDrawerProps {
  dockPosition: 'TOP' | 'BOTTOM';
  uiConfig: Record<string, unknown>;
  physicsEngine: unknown;
  controller: unknown;
  hasSensors: boolean;
  layoutDebug: {
    show: boolean;
    activeProfile: LayoutProfile;
    profiles: Record<LayoutProfile, LayoutProfileData>;
  };
  currentLayout: LayoutProfileData;
  onLayoutChange: (target: keyof LayoutProfileData, axis: 'x' | 'y' | 'scale' | 'opacity' | null, value: number) => void;
  onResetLayout: () => void;
  onShowToast?: (message: string) => void;
}

export const StudioPanelsDrawer: React.FC<StudioPanelsDrawerProps> = ({
  dockPosition,
  uiConfig,
  physicsEngine,
  controller,
  hasSensors,
  layoutDebug,
  currentLayout,
  onLayoutChange,
  onResetLayout
}) => {
  const [panelHeight, setPanelHeight] = useState(400);
  const isResizingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  const [panelOrder, setPanelOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ppl_panel_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default panel order on error
    }
    return DEFAULT_PANEL_ORDER;
  });

  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const renderLayoutControl = (label: string, target: keyof LayoutProfileData, color: string, hideXY = false) => {
    const data = currentLayout[target] as LayoutElement;
    if (!data) return null;
    return (
      <div className="space-y-2 pb-2 border-b border-white/5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 block" style={{ color }}>
          {label}
        </span>
        {!hideXY && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] opacity-70" style={{ color: uiConfig.textColor }}>Y-Pos</span>
                <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>{data.y.toFixed(2)}</span>
              </div>
              <div className="w-full">
                <Fader value={data.y} min={-5} max={20} step={0.1} onChange={(v: number) => onLayoutChange(target, 'y', v)} color={color} uiConfig={uiConfig} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] opacity-70" style={{ color: uiConfig.textColor }}>X-Pos</span>
                <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>{data.x.toFixed(2)}</span>
              </div>
              <div className="w-full">
                <Fader value={data.x} min={-10} max={10} step={0.1} onChange={(v: number) => onLayoutChange(target, 'x', v)} color={color} uiConfig={uiConfig} />
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] opacity-70" style={{ color: uiConfig.textColor }}>Scale</span>
              <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>{data.scale.toFixed(2)}x</span>
            </div>
            <div className="w-full">
              <Fader value={data.scale} min={0} max={3.0} step={0.05} onChange={(v: number) => onLayoutChange(target, 'scale', v)} color="#ffffff" uiConfig={uiConfig} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] opacity-70" style={{ color: uiConfig.textColor }}>Opacity</span>
              <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>{(data.opacity * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full">
              <Fader value={data.opacity} min={0} max={1.0} step={0.05} onChange={(v: number) => onLayoutChange(target, 'opacity', v)} color="#94a3b8" uiConfig={uiConfig} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPanelWrapper = (id: string, children: React.ReactNode) => {
    const isDragged = draggedPanelId === id;
    const isDropTarget = dropTargetId === id;
    return (
      <div 
        key={id} 
        className={`relative transition-all duration-200 ${isDragged ? 'opacity-30 scale-[0.98]' : 'opacity-100 scale-100'}`} 
        onDragOver={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          if (draggedPanelId !== id) setDropTargetId(id); 
        }} 
        onDrop={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          const draggedId = draggedPanelId; 
          setDraggedPanelId(null); 
          setDropTargetId(null); 
          if (!draggedId || draggedId === id) return; 
          const newOrder = [...panelOrder]; 
          const fromIndex = newOrder.indexOf(draggedId); 
          const toIndex = newOrder.indexOf(id); 
          if (fromIndex !== -1 && toIndex !== -1) { 
            newOrder.splice(fromIndex, 1); 
            newOrder.splice(toIndex, 0, draggedId); 
            setPanelOrder(newOrder); 
            localStorage.setItem('ppl_panel_order', JSON.stringify(newOrder)); 
          } 
        }}
      >
        {isDropTarget && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500 z-50 shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none" />
        )}
        <div className="flex items-stretch border-b border-white/5">
          <div 
            draggable 
            onDragStart={(e) => { 
              setDraggedPanelId(id); 
              e.dataTransfer.effectAllowed = 'move'; 
              e.dataTransfer.setData('text/plain', id); 
            }} 
            onDragEnd={() => { 
              setDraggedPanelId(null); 
              setDropTargetId(null); 
            }} 
            className="w-10 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 text-slate-600 hover:text-slate-300 touch-none border-r border-white/5 bg-transparent"
          >
            <GripVertical size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <ErrorBoundary moduleName={`Panel: ${id}`}>{children}</ErrorBoundary>
          </div>
        </div>
      </div>
    );
  };

  const renderPanel = (id: string) => {
    switch (id) {
      case 'PHYSICS':
        return renderPanelWrapper(
          id,
          <ControlSection 
            title="Physics & Lattice Geometry" 
            icon={<Atom size={12} className="text-amber-400" />} 
            isExpanded={expanded['PHYSICS']} 
            onToggle={() => setExpanded(p => ({ ...p, PHYSICS: !p.PHYSICS }))} 
            uiConfig={uiConfig}
          >
            <PhysicsDesigner 
              lattice={physicsEngine} 
              modulation={controller.modulation} 
              uiConfig={uiConfig} 
              bus={controller.bus} 
              hasSensors={hasSensors} 
            />
          </ControlSection>
        );

      case 'TUNING':
        return renderPanelWrapper(
          id,
          <ControlSection 
            title="Master Tuning" 
            icon={<ArrowDown size={12} className="text-amber-400" />} 
            isExpanded={expanded['TUNING']} 
            onToggle={() => setExpanded(p => ({ ...p, TUNING: !p.TUNING }))} 
            uiConfig={uiConfig}
          >
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] w-20 text-slate-300">Global Pitch</span>
                <div className="flex-1">
                  <Fader 
                    value={controller.temporal.globalTranspose} 
                    min={-2} 
                    max={0} 
                    step={0.1} 
                    onChange={controller.temporal.handleTransposeChange} 
                    color="#f59e0b" 
                    uiConfig={uiConfig} 
                  />
                </div>
                <span className="text-[10px] font-mono font-bold w-12 text-right" style={{ color: uiConfig.textColor }}>
                  {controller.temporal.globalTranspose.toFixed(1)} Oct
                </span>
              </div>
            </div>
          </ControlSection>
        );

      case 'LAYOUT':
        return renderPanelWrapper(
          id,
          <ControlSection 
            title="Interface Grid" 
            icon={<Grid size={12} className="text-slate-300" />} 
            isExpanded={expanded['LAYOUT']} 
            onToggle={() => setExpanded(p => ({ ...p, LAYOUT: !p.LAYOUT }))} 
            uiConfig={uiConfig}
            headerAction={
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onResetLayout(); 
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Reset Grid Layout to Factory Defaults"
              >
                <RotateCcw size={10} /> Reset
              </button>
            }
          >
            <div className="p-3 border rounded space-y-4" style={{ backgroundColor: `rgba(${uiConfig.cardRgb}, 0.2)`, borderColor: `rgba(${uiConfig.borderRgb}, 0.1)` }}>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">Profile: {layoutDebug.activeProfile}</span>
                <button 
                  onClick={onResetLayout}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition-colors"
                >
                  <RotateCcw size={11} /> Reset to Defaults
                </button>
              </div>
              <div className="space-y-1 pb-2 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MoveHorizontal size={12} /> UI X-Shift
                  </span>
                  <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>
                    {currentLayout.uiX.toFixed(1)}rem
                  </span>
                </div>
                <div className="w-full">
                  <Fader value={currentLayout.uiX} min={-10} max={10} step={0.1} onChange={(v: number) => onLayoutChange('uiX', null, v)} color="#facc15" uiConfig={uiConfig} />
                </div>
              </div>
              
              {/* UNIFIED VISUAL CENTER */}
              <div className="space-y-2 pb-2 border-b border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1 block">Visual Center (Universal)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] opacity-70" style={{ color: uiConfig.textColor }}>Y-Pos</span>
                      <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>{currentLayout.mandala.y.toFixed(3)}</span>
                    </div>
                    <div className="w-full">
                      <Fader value={currentLayout.mandala.y} min={-0.4} max={0.4} step={0.001} onChange={(v: number) => onLayoutChange('mandala', 'y', v)} color="#34d399" uiConfig={uiConfig} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] opacity-70" style={{ color: uiConfig.textColor }}>X-Pos</span>
                      <span className="text-[9px] font-mono opacity-50" style={{ color: uiConfig.textColor }}>{currentLayout.mandala.x.toFixed(3)}</span>
                    </div>
                    <div className="w-full">
                      <Fader value={currentLayout.mandala.x} min={-0.4} max={0.4} step={0.001} onChange={(v: number) => onLayoutChange('mandala', 'x', v)} color="#34d399" uiConfig={uiConfig} />
                    </div>
                  </div>
                </div>
              </div>

              {renderLayoutControl("Mandala (Visuals)", "mandala", "#ffffff", true)}
              {renderLayoutControl("Pacer (Breath)", "pacer", "#fbbf24", true)}
              {renderLayoutControl("Header (Title)", "header", "#cbd5e1")}
              {renderLayoutControl("Top Controls", "topButtons", "#94a3b8")}
              {renderLayoutControl("Entrainment Pill", "pill", "#8b5cf6")}
              {renderLayoutControl("Harmonic Dock", "dock", "#64748b")}
              {renderLayoutControl("Breath Meter", "meter", "#22d3ee")}
              {renderLayoutControl("Menu Button (Dots)", "menuBtn", "#a855f7")}
              {renderLayoutControl("Side Navigation", "sideNav", "#ef4444")}
            </div>
          </ControlSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`absolute left-0 right-0 z-50 flex flex-col shadow-2xl animate-in ${dockPosition === 'BOTTOM' ? 'slide-in-from-bottom-10 bottom-0' : 'slide-in-from-top-10 top-0'}`}>
      {dockPosition === 'BOTTOM' && (
        <div 
          className="h-6 bg-[#0a0a0a] border-t border-white/10 cursor-row-resize hover:bg-cyan-900/20 transition-all flex items-center justify-center group touch-none rounded-t-xl" 
          onPointerDown={(e) => { 
            e.preventDefault(); 
            isResizingRef.current = true; 
            dragStartYRef.current = e.clientY; 
            dragStartHeightRef.current = panelHeight; 
            (e.target as Element).setPointerCapture(e.pointerId); 
          }} 
          onPointerMove={(e) => { 
            if (isResizingRef.current) {
              setPanelHeight(Math.max(100, Math.min(window.innerHeight - 100, dragStartHeightRef.current + (dragStartYRef.current - e.clientY)))); 
            }
          }} 
          onPointerUp={(e) => { 
            isResizingRef.current = false; 
            (e.target as Element).releasePointerCapture(e.pointerId); 
          }}
        >
          <div className="w-16 h-1 rounded-full bg-white/20 group-hover:bg-cyan-400 transition-colors" /> 
        </div>
      )}

      <div 
        style={{ height: panelHeight }} 
        className={`flex flex-col bg-transparent transition-[height] duration-75 ease-out ${dockPosition === 'BOTTOM' ? 'border-t border-white/5' : 'border-b border-white/5'}`}
      >
        <div 
          className="flex-1 overflow-y-auto" 
          style={{ 
            backgroundColor: `rgba(${uiConfig.cardRgb}, ${uiConfig.panelOpacity ?? 0.8})`, 
            backdropFilter: `blur(${uiConfig.backdropBlur}px)` 
          }}
        >
          <div className="pb-8">
            {panelOrder.map(id => renderPanel(id))}
          </div>
        </div>
      </div>

      {dockPosition === 'TOP' && (
        <div 
          className="h-6 bg-[#0a0a0a] border-b border-white/10 cursor-row-resize hover:bg-cyan-900/20 transition-all flex items-center justify-center group touch-none rounded-b-xl" 
          onPointerDown={(e) => { 
            e.preventDefault(); 
            isResizingRef.current = true; 
            dragStartYRef.current = e.clientY; 
            dragStartHeightRef.current = panelHeight; 
            (e.target as Element).setPointerCapture(e.pointerId); 
          }} 
          onPointerMove={(e) => { 
            if (isResizingRef.current) {
              setPanelHeight(Math.max(100, Math.min(window.innerHeight - 100, dragStartHeightRef.current + (e.clientY - dragStartYRef.current)))); 
            }
          }} 
          onPointerUp={(e) => { 
            isResizingRef.current = false; 
            (e.target as Element).releasePointerCapture(e.pointerId); 
          }}
        >
          <div className="w-16 h-1 rounded-full bg-white/20 group-hover:bg-cyan-400 transition-colors" /> 
        </div>
      )}
    </div>
  );
};
