import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Wifi, WifiOff, LogOut } from 'lucide-react';
import { getSettings, getPendingSyncQueue, processPendingSyncQueue, logout } from '../services/storage';

interface HeaderProps {
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onLogout }) => {
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
    <header className="sticky top-0 z-30 w-full glass-card border-b border-[#F4F1EA]/10 px-4 py-3.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6B8E78]/15 border border-[#6B8E78]/30">
            <span className="text-lg font-bold text-[#6B8E78]">A</span>
          </div>
          <div>
            <h1 className="font-serif text-lg font-medium tracking-wide text-[#F4F1EA]">AURA GYM</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#9E9B93]">Quiet Luxury Tracker</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sync Status Badge */}
          {pendingCount > 0 ? (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-full bg-[#A85454]/20 border border-[#A85454]/40 px-2.5 py-1 text-xs text-[#F4F1EA] touch-shrink"
              title="Click to sync queued workouts"
            >
              <RefreshCw className={`h-3 w-3 text-[#A85454] ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-medium">{pendingCount} Queued</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-[#6B8E78]/10 border border-[#6B8E78]/25 px-2.5 py-1 text-[11px] text-[#6B8E78]">
              {isOnline ? <Wifi className="h-3 w-3 text-[#6B8E78]" /> : <WifiOff className="h-3 w-3 text-[#9E9B93]" />}
              <span>{settings.googleWebAppUrl ? 'Sheets Connected' : 'Local Only'}</span>
            </div>
          )}

          {/* Settings Toggle */}
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171D22] border border-[#F4F1EA]/10 text-[#F4F1EA] transition hover:bg-[#1F272E] touch-shrink"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171D22] border border-[#F4F1EA]/10 text-[#9E9B93] hover:text-[#A85454] transition touch-shrink"
            aria-label="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
