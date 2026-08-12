import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ModalDrawer: React.FC<ModalDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop tap to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer / Modal Card */}
      <div className="relative z-10 w-full max-w-md mx-auto max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#F4F1EA]/15 bg-[#171D22] p-5 shadow-2xl animate-slide-up overflow-hidden">
        {/* Handle pill (visible on mobile) */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#F4F1EA]/20 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F4F1EA]/10 shrink-0">
          <div>
            <h2 className="font-serif text-xl font-medium tracking-wide text-[#F4F1EA]">{title}</h2>
            {subtitle && <p className="text-xs text-[#9E9B93] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F272E] text-[#9E9B93] hover:text-[#F4F1EA] touch-shrink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-2 scrollbar-none">
          {children}
        </div>
      </div>
    </div>
  );
};
