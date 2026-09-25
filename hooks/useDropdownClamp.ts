import { useEffect, useRef } from 'react';

/**
 * Ensures floating popovers/menus never overflow the viewport boundaries on mobile or desktop,
 * especially when parent containers shift (e.g. bottom pill expanding when tones are active).
 */
export const useDropdownClamp = (isOpen: boolean, padding = 10) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const clamp = () => {
      const el = ref.current;
      if (!el) return;

      // Reset shift to measure unshifted layout rect
      el.style.marginLeft = '0px';
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;

      if (rect.left < padding) {
        el.style.marginLeft = `${padding - rect.left}px`;
      } else if (rect.right > vw - padding) {
        el.style.marginLeft = `-${rect.right - (vw - padding)}px`;
      }
    };

    clamp();
    const raf1 = requestAnimationFrame(clamp);
    const raf2 = setTimeout(clamp, 50);
    const raf3 = setTimeout(clamp, 320); // covers 300ms pill animation/expansion

    window.addEventListener('resize', clamp);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(raf2);
      clearTimeout(raf3);
      window.removeEventListener('resize', clamp);
    };
  }, [isOpen, padding]);

  return ref;
};
