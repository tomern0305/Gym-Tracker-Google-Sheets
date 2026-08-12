import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ArrowRight, Dumbbell } from 'lucide-react';
import { loginWithPassword } from '../services/storage';

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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#0F1317] p-6 text-[#F4F1EA]">
      {/* Top Branding */}
      <div className="mt-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6B8E78]/15 border border-[#6B8E78]/30 shadow-lg">
          <Dumbbell className="h-8 w-8 text-[#6B8E78]" />
        </div>
        <h1 className="font-serif text-3xl font-medium tracking-wide text-[#F4F1EA]">AURA GYM</h1>
        <p className="mt-1.5 text-xs uppercase tracking-widest text-[#9E9B93]">Personal Performance Vault</p>
      </div>

      {/* Main Password Form */}
      <div className="mx-auto w-full max-w-xs glass-card-elevated p-6 rounded-3xl border border-[#F4F1EA]/15 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-[#9E9B93]">
          <ShieldCheck className="h-4 w-4 text-[#6B8E78]" />
          <span>1-Year Authenticated Access</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9E9B93] mb-2 uppercase tracking-wider text-center">
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
                className={`w-full rounded-xl bg-[#0F1317] border px-4 py-3.5 text-center text-lg font-mono tracking-widest text-[#F4F1EA] placeholder-[#9E9B93]/40 focus:outline-none transition ${
                  error 
                    ? 'border-[#A85454] focus:ring-1 focus:ring-[#A85454]' 
                    : 'border-[#F4F1EA]/15 focus:border-[#6B8E78] focus:ring-1 focus:ring-[#6B8E78]'
                }`}
              />
              <KeyRound className="absolute right-3.5 top-4 h-5 w-5 text-[#9E9B93]/50" />
            </div>
            {error && (
              <p className="mt-2 text-center text-xs text-[#A85454] animate-fade-in">
                Incorrect passcode. Default is <span className="font-mono bg-[#A85454]/15 px-1 py-0.5 rounded">gym123</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6B8E78] py-3.5 font-medium text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink shadow-md font-sans"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-[#9E9B93]/60 leading-relaxed">
          Default passcode: <code className="text-[#6B8E78]">gym123</code><br/>
          (Changeable anytime in Settings)
        </p>
      </div>

      {/* Footer info */}
      <div className="mb-6 text-center text-xs text-[#9E9B93]/50">
        <p>Private & Offline First • Google Sheets Sync</p>
      </div>
    </div>
  );
};
