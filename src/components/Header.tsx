import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getSettings, getPendingSyncQueue, processPendingSyncQueue } from '../services/storage';
import { DumbbellLogo } from './DumbbellLogo';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const settings = getSettings();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updatePending = () => {
      setPendingCount(getPendingSyncQueue().length);
    };

    updatePending();
    const interval = setInterval(updatePending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await processPendingSyncQueue();
    setPendingCount(getPendingSyncQueue().length);
    setIsSyncing(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[60] w-full chrome border-b border-line px-4 pt-[var(--safe-top)]">
      <div className="mx-auto flex h-[var(--header-h)] max-w-md items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line">
            <DumbbellLogo className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-[1.35rem] font-bold leading-none tracking-[-0.03em] text-ink">Sessions</h1>
            {/* <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Personal Tracker</p> */}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sync Status Badge */}
          {pendingCount > 0 ? (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-full bg-danger/20 border border-danger/40 px-2.5 py-1 text-xs text-ink touch-shrink"
              title="Click to sync queued workouts"
            >
              <RefreshCw className={`h-3 w-3 text-danger ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-medium">{pendingCount} Queued</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft">
              {isOnline ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3 text-ink-faint" />}
              <span>{settings.googleWebAppUrl ? 'Sheets Connected' : 'Local Only'}</span>
            </div>
          )}

          {/* Settings Toggle */}
          <button
            onClick={onOpenSettings}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition hover:bg-tint hover:text-ink touch-shrink"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
