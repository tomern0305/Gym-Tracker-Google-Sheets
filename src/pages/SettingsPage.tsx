import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  RefreshCw 
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
    <div className="space-y-6 pb-24 animate-fade-in text-[#F4F1EA]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#F4F1EA]">App Configuration</h2>
          <p className="text-xs text-[#9E9B93]">Google Sheets sync & device storage</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl bg-[#1F272E] px-3.5 py-1.5 text-xs font-semibold text-[#F4F1EA] hover:bg-[#6B8E78]/20 transition touch-shrink"
        >
          Done
        </button>
      </div>

      {/* Google Sheets Connection Box */}
      <div className="glass-card-elevated p-5 rounded-3xl border border-[#F4F1EA]/15 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B8E78]/15 border border-[#6B8E78]/30">
            <Database className="h-5 w-5 text-[#6B8E78]" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-[#F4F1EA]">Google Sheets Database Endpoint</h3>
            <p className="text-xs text-[#9E9B93]">Zero backend server needed • Free & 100% private</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-1.5">
              Google Apps Script Web App Deployment URL
            </label>
            <input
              type="url"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-xs font-mono text-[#F4F1EA] placeholder-[#9E9B93]/40 focus:outline-none focus:border-[#6B8E78]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#6B8E78] font-semibold text-xs text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink shadow-md font-sans"
            >
              Save Endpoint URL
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrl}
              className="px-4 py-2.5 rounded-xl bg-[#1F272E] border border-[#F4F1EA]/10 font-semibold text-xs text-[#F4F1EA] hover:bg-[#6B8E78]/20 transition touch-shrink disabled:opacity-40"
            >
              {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </button>
          </div>

          {savedSuccess && (
            <p className="text-xs text-[#6B8E78] font-semibold text-center animate-fade-in">
              ✓ Settings saved successfully!
            </p>
          )}

          {pingStatus && (
            <p className="text-xs font-mono p-2.5 rounded-xl bg-[#0F1317] border border-[#F4F1EA]/10 text-center leading-relaxed">
              {pingStatus}
            </p>
          )}
        </form>
      </div>

      {/* Copy-Paste Google Apps Script Code Instructions */}
      <div className="glass-card p-5 rounded-3xl border border-[#F4F1EA]/10 space-y-3">
        <h3 className="font-serif text-lg font-medium text-[#F4F1EA]">Google Sheets 2-Minute Setup</h3>
        <ol className="text-xs text-[#9E9B93] space-y-2 list-decimal list-inside leading-relaxed">
          <li>Create a new empty <strong className="text-[#F4F1EA]">Google Sheet</strong> in your Google Drive.</li>
          <li>Click <strong className="text-[#F4F1EA]">Extensions → Apps Script</strong> in the top menu.</li>
          <li>Delete any code there and click below to copy our backend script:</li>
        </ol>

        <button
          onClick={handleCopyCode}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1F272E] border border-[#6B8E78]/40 py-3 text-xs font-semibold text-[#6B8E78] hover:bg-[#6B8E78]/10 transition touch-shrink font-sans"
        >
          {copied ? <Check className="h-4 w-4 text-[#6B8E78]" /> : <Copy className="h-4 w-4 text-[#6B8E78]" />}
          <span>{copied ? 'Code Copied to Clipboard!' : 'Copy Google Apps Script Backend Code'}</span>
        </button>

        <ol start={4} className="text-xs text-[#9E9B93] space-y-2 list-decimal list-inside leading-relaxed">
          <li>Paste the code into Apps Script, click <strong className="text-[#F4F1EA]">Save</strong> 💾.</li>
          <li>Click <strong className="text-[#F4F1EA]">Deploy → New Deployment</strong> → select <strong className="text-[#F4F1EA]">Web App</strong>.</li>
          <li>Set <strong className="text-[#F4F1EA]">Execute as: Me</strong> and <strong className="text-[#F4F1EA]">Who has access: Anyone</strong>.</li>
          <li>Copy the Web App URL and paste it in the box above!</li>
        </ol>
      </div>
    </div>
  );
};
