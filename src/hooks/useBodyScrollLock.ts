import { useEffect } from 'react';

/**
 * Freezes the page behind an open sheet so the content underneath cannot
 * scroll out from under it while the user interacts with the sheet.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isLocked]);
}
