import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { loginWithPassword } from '../services/storage';
import { DumbbellLogo } from '../components/DumbbellLogo';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginWithPassword(password)) {
      setError(false);
      onLoginSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between bg-page p-6 text-ink">
      {/* Top Branding */}
      <div className="mt-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface border border-line shadow-lg">
          <DumbbellLogo className="h-12 w-12" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ink">Sessions</h1>
        <p className="mt-1.5 text-xs uppercase tracking-widest font-semibold text-accent">Personal Performance Vault</p>
      </div>

      {/* Main Password Form */}
      <div className="mx-auto w-full max-w-xs card-raised p-6 rounded-3xl border border-line shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-ink-soft">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>1-Year Authenticated Access</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-2 uppercase tracking-wider text-center">
              Enter Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="••••••••"
                autoFocus
                className={`w-full rounded-xl bg-raised border px-4 py-3.5 text-center text-lg font-mono tracking-widest text-ink placeholder-ink-faint focus:outline-none transition ${error
                    ? 'border-danger focus:ring-1 focus:ring-danger'
                    : 'border-line focus:border-accent focus:ring-1 focus:ring-accent'
                  }`}
              />
              <KeyRound className="absolute right-3.5 top-4 h-5 w-5 text-ink-faint" />
            </div>
            {error && (
              <p className="mt-2 text-center text-xs text-danger animate-fade-in">
                Incorrect passcode. Default is <span className="font-mono bg-danger/15 px-1 py-0.5 rounded">gym123</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-medium text-on-accent hover:bg-accent-deep transition touch-shrink shadow-md font-sans"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-ink-faint leading-relaxed">
          Default passcode: <code className="text-accent">gym123</code><br />
          (Changeable anytime in Settings)
        </p>
      </div>

      {/* Footer info */}
      <div className="mb-6 text-center text-xs text-ink-faint">
        <p>Private & Offline First • Google Sheets Sync</p>
      </div>
    </div>
  );
};
