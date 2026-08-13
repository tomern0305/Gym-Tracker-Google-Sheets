import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

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
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  /* Rendered into <body> so the sheet is positioned against the viewport,
     never against a page container that happens to be transformed. */
  return createPortal(
    /* Backdrop. Its top padding reserves the fixed header's strip, so the
       sheet's max-h-full can never resolve tall enough to reach the header. */
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-ink/50 pt-[var(--header-total)] backdrop-blur-sm sm:justify-center sm:px-4 sm:pb-4 sm:pt-[calc(var(--header-total)+1rem)] animate-fade-in">
      {/* Backdrop tap to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer / Modal Card — same height whatever the content, min-h-0 so a
          tall child can never push the sheet past its cap. */}
      <div className="relative z-10 mx-auto flex h-[85dvh] max-h-full min-h-0 w-full max-w-md flex-col rounded-t-3xl border border-line bg-raised p-5 pb-[calc(1.25rem+var(--safe-bottom))] shadow-lg sm:h-[580px] sm:rounded-3xl sm:pb-5 animate-slide-up">
        {/* Handle pill (visible on mobile) */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line-strong shrink-0 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-ink">{title}</h2>
            {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-ink-soft hover:text-ink touch-shrink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 scrollbar-none">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
