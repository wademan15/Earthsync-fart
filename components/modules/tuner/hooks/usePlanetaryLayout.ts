import { useState, useEffect, useCallback } from 'react';

export type LayoutProfile = 'MOBILE_PORTRAIT' | 'MOBILE_LANDSCAPE' | 'DESKTOP';
export interface LayoutElement { x: number; y: number; scale: number; opacity: number; }
export interface LayoutProfileData { 
  mandala: LayoutElement; 
  pacer: LayoutElement; 
  header: LayoutElement; 
  topButtons: LayoutElement; 
  pill: LayoutElement; 
  dock: LayoutElement; 
  meter: LayoutElement; 
  menuBtn: LayoutElement; 
  sideNav: LayoutElement; 
  uiX: number; 
  footerY: number; 
  meterScale: number; 
}

const elem = (y: number, x: number = 0, scale: number = 1, opacity: number = 1): LayoutElement => ({ x, y, scale, opacity });

export const LAYOUT_DEFAULTS: Record<LayoutProfile, LayoutProfileData> = {
  MOBILE_PORTRAIT: { mandala: elem(0.046, 0.00, 1.40, 1.0), pacer: elem(0.046, 0.00, 1.15, 1.0), header: elem(-5.00, 0.00, 1.00, 1.0), topButtons: elem(1.10, 0.00, 1.00, 1.0), pill: elem(8.40, 0.00, 1.00, 1.0), dock: elem(4.20, 0.00, 1.00, 1.0), meter: elem(0.00, 0.00, 1.00, 1.0), menuBtn: elem(1.10, 1.00, 1.00, 1.0), sideNav: elem(-1.40, 0.50, 0.70, 0.60), uiX: 0, footerY: 0, meterScale: 1.0 },
  MOBILE_LANDSCAPE: { mandala: elem(0.046, 0, 1.15), pacer: elem(0.046, 0, 1.00), header: elem(1.0), topButtons: elem(2.5), pill: elem(8.40), dock: elem(4.20), meter: elem(0), menuBtn: elem(1.0, 1.0), sideNav: elem(0, 1.0), uiX: 0, footerY: 0, meterScale: 1.0 },
  DESKTOP: { mandala: elem(0.046, 0, 1.0), pacer: elem(0.046, 0, 0.75), header: elem(1.0), topButtons: elem(2.5), pill: elem(8.40), dock: elem(4.20), meter: elem(0), menuBtn: elem(2.0, 2.0), sideNav: elem(0, 2.0), uiX: 0, footerY: 0, meterScale: 1.0 }
};

export function usePlanetaryLayout() {
  const [layoutDebug, setLayoutDebug] = useState<{ 
    show: boolean; 
    activeProfile: LayoutProfile; 
    profiles: Record<LayoutProfile, LayoutProfileData>; 
  }>({ 
    show: false, 
    activeProfile: 'DESKTOP', 
    profiles: LAYOUT_DEFAULTS 
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      const landscape = w > h;
      const targetProfile: LayoutProfile = mobile ? (landscape ? 'MOBILE_LANDSCAPE' : 'MOBILE_PORTRAIT') : 'DESKTOP';
      setLayoutDebug(prev => { 
        if (prev.show || prev.activeProfile === targetProfile) return prev; 
        return { ...prev, activeProfile: targetProfile }; 
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentLayout = layoutDebug.profiles[layoutDebug.activeProfile];

  const handleLayoutChange = useCallback((target: keyof LayoutProfileData, axis: 'x' | 'y' | 'scale' | 'opacity' | null, value: number) => { 
    setLayoutDebug(prev => { 
      const profile = prev.activeProfile; 
      const currentData = prev.profiles[profile]; 
      const newProfiles = { ...prev.profiles };
      const data = { ...currentData };

      if (axis && (target === 'mandala' || target === 'pacer')) {
        if (axis === 'x' || axis === 'y') {
          // Unified behavior: X/Y move together
          data.mandala = { ...(data.mandala as LayoutElement), [axis]: value };
          data.pacer = { ...(data.pacer as LayoutElement), [axis]: value };
        } else {
          // Scale and Opacity remain unique to the element
          data[target] = { ...(data[target] as LayoutElement), [axis]: value };
        }
      } else if (axis && typeof data[target] === 'object') { 
        data[target] = { ...(data[target] as LayoutElement), [axis]: value }; 
      } else if (typeof data[target] === 'object' && 'y' in (data[target] as LayoutElement)) { 
        data[target] = { ...(data[target] as LayoutElement), y: value }; 
      } else { 
        (data as Record<string, unknown>)[target] = value; 
      }

      newProfiles[profile] = data;
      return { ...prev, profiles: newProfiles };
    }); 
  }, []);

  return {
    layoutDebug,
    setLayoutDebug,
    currentLayout,
    handleLayoutChange
  };
}
