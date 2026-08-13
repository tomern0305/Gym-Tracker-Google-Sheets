import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  RefreshCw,
  Smartphone,
  Share,
  PlusSquare,
  Download
} from 'lucide-react';
import { getSettings, saveSettings, fetchAllFromGoogleSheets, processPendingSyncQueue } from '../services/storage';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/googleAppsScriptCode';

export const SettingsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [settings, setSettingsState] = useState(getSettings());
  const [webAppUrl, setWebAppUrl] = useState(settings.googleWebAppUrl);
  const [copied, setCopied] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA standalone app
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(Boolean(checkStandalone));

    // Listen for PWA install prompt on Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSettings({
      googleWebAppUrl: webAppUrl.trim(),
      passwordHash: settings.passwordHash || 'gym123'
    });
    setSettingsState(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setPingStatus('Please enter a Web App URL first.');
      return;
    }
    setIsTesting(true);
    setPingStatus('Testing connection...');
    try {
      const res = await fetch(`${webAppUrl.trim()}?action=ping`);
      const json = await res.json();
      if (json.success) {
        setPingStatus('✅ Connected successfully to Google Sheets!');
        await fetchAllFromGoogleSheets();
        await processPendingSyncQueue();
      } else {
        setPingStatus('⚠️ Web App responded with error: ' + (json.error || 'Unknown'));
      }
    } catch (err: any) {
      setPingStatus('❌ Connection failed. Verify URL and Web App access settings ("Anyone").');
    }
    setIsTesting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">App Configuration</h2>
          <p className="text-xs text-ink-soft">Google Sheets sync & mobile installation</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl bg-tint px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-accent/20 transition touch-shrink"
        >
          Done
        </button>
      </div>

      {/* Mobile PWA Home Screen Installation Card */}
      <div className="card-raised p-5 rounded-3xl border border-accent/30 bg-accent/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 border border-accent/40">
              <Smartphone className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">Add to Home Screen</h3>
              <p className="text-xs text-ink-soft">Native full-screen mobile experience</p>
            </div>
          </div>
          {isStandalone && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-on-accent px-2 py-1 rounded-md">
              Installed
            </span>
          )}
        </div>

        {deferredPrompt ? (
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-sm font-semibold text-on-accent hover:bg-accent-deep transition touch-shrink shadow-lg font-sans"
          >
            <Download className="h-4 w-4" />
            <span>Install App on Device</span>
          </button>
        ) : (
          <div className="space-y-2 text-xs text-ink-soft leading-relaxed pt-1">
            <div className="flex items-start gap-2.5 bg-raised/60 p-3 rounded-2xl border border-line">
              <Share className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink block mb-0.5">iPhone / iPad (Safari):</strong>
                Tap the <span className="text-accent font-semibold">Share</span> icon in Safari navigation bar, then select <span className="text-ink font-semibold">"Add to Home Screen"</span>.
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-raised/60 p-3 rounded-2xl border border-line">
              <PlusSquare className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink block mb-0.5">Android (Chrome):</strong>
                Tap Chrome menu <span className="text-accent font-semibold">⋮</span>, then tap <span className="text-ink font-semibold">"Install App"</span> or <span className="text-ink font-semibold">"Add to Home screen"</span>.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Sheets Connection Box */}
      <div className="card-raised p-5 rounded-3xl border border-line space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/30">
            <Database className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">Google Sheets Database Endpoint</h3>
            <p className="text-xs text-ink-soft">Zero backend server needed • Free & 100% private</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
              Google Apps Script Web App Deployment URL
            </label>
            <input
              type="url"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full rounded-xl bg-raised border border-line p-3 text-xs font-mono text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-accent font-semibold text-xs text-on-accent hover:bg-accent-deep transition touch-shrink shadow-md font-sans"
            >
              Save Endpoint URL
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrl}
              className="px-4 py-2.5 rounded-xl bg-tint border border-line font-semibold text-xs text-ink hover:bg-accent/20 transition touch-shrink disabled:opacity-40"
            >
              {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </button>
          </div>

          {savedSuccess && (
            <p className="text-xs text-accent font-semibold text-center animate-fade-in">
              ✓ Settings saved successfully!
            </p>
          )}

          {pingStatus && (
            <p className="text-xs font-mono p-2.5 rounded-xl bg-raised border border-line text-center leading-relaxed">
              {pingStatus}
            </p>
          )}
        </form>
      </div>

      {/* Copy-Paste Google Apps Script Code Instructions */}
      <div className="card p-5 rounded-3xl border border-line space-y-3">
        <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">Google Sheets 2-Minute Setup</h3>
        <ol className="text-xs text-ink-soft space-y-2 list-decimal list-inside leading-relaxed">
          <li>Create a new empty <strong className="text-ink">Google Sheet</strong> in your Google Drive.</li>
          <li>Click <strong className="text-ink">Extensions → Apps Script</strong> in the top menu.</li>
          <li>Delete any code there and click below to copy our backend script:</li>
        </ol>

        <button
          onClick={handleCopyCode}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-tint border border-accent/40 py-3 text-xs font-semibold text-accent hover:bg-accent/10 transition touch-shrink font-sans"
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-accent" />}
          <span>{copied ? 'Code Copied to Clipboard!' : 'Copy Google Apps Script Backend Code'}</span>
        </button>

        <ol start={4} className="text-xs text-ink-soft space-y-2 list-decimal list-inside leading-relaxed">
          <li>Paste the code into Apps Script, click <strong className="text-ink">Save</strong> 💾.</li>
          <li>Click <strong className="text-ink">Deploy → New Deployment</strong> → select <strong className="text-ink">Web App</strong>.</li>
          <li>Set <strong className="text-ink">Execute as: Me</strong> and <strong className="text-ink">Who has access: Anyone</strong>.</li>
          <li>Copy the Web App URL and paste it in the box above!</li>
        </ol>
      </div>
    </div>
  );
};
