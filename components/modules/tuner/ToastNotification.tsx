import React from 'react';
import { Check } from 'lucide-react';

export interface ToastNotificationProps {
  message: string;
  visible: boolean;
  style?: React.CSSProperties;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, visible, style }) => (
  <div 
    className={`absolute z-[60] pointer-events-none transition-all duration-300 ease-out ${
      visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
    }`}
    style={style}
  >
    <div className="bg-black/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2">
      <Check size={12} className="text-cyan-400" />
      <span>{message}</span>
    </div>
  </div>
);
