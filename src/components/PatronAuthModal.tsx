import React, { useState } from 'react';
import { X, Key, ShieldCheck, ShieldAlert, Check, HelpCircle, Lock, Globe } from 'lucide-react';

interface PatronAuthModalProps {
  authCookie: string;
  onSaveAuthCookie: (cookie: string) => void;
  onClose: () => void;
}

export const PatronAuthModal: React.FC<PatronAuthModalProps> = ({
  authCookie,
  onSaveAuthCookie,
  onClose,
}) => {
  const [cookieInput, setCookieInput] = useState(authCookie);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAuthCookie(cookieInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setCookieInput('');
    onSaveAuthCookie('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="patron-auth-modal"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              Patron Authentication & Access Mode
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Explanation banner */}
          <div className="space-y-3 text-xs text-stone-600">
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 space-y-1.5">
              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Public Account Mode (Default)</span>
              </div>
              <p className="leading-relaxed">
                If a patron’s account is set to public (e.g. <code>mekBot</code>), their reading log data is openly accessible via the standard Open Library endpoints with no authentication needed.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
              <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Authenticated Patron Mode</span>
              </div>
              <p className="leading-relaxed text-emerald-900">
                If a patron’s reading log is private or restricted, an authenticated Open Library session cookie allows retrieving their private reading log data through the exact same APIs.
              </p>
            </div>
          </div>

          {/* Cookie Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 block font-mono">
              Open Library Session Cookie (Optional):
            </label>
            <input
              type="text"
              value={cookieInput}
              onChange={(e) => setCookieInput(e.target.value)}
              placeholder="e.g. session=abc123xyz... (or paste cookie string)"
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 font-mono"
            />
            <p className="text-[11px] text-stone-400">
              Only required if querying your own private reading log or an account requiring login. Forwarded securely via the server proxy to openlibrary.org.
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-mono bg-stone-50 border border-stone-200">
            {authCookie ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-800 font-semibold">
                  Authenticated Mode active (Cookie configured)
                </span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-stone-600">
                  Public Mode active (No session cookie)
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            {authCookie ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-800 underline cursor-pointer"
              >
                Clear Saved Cookie
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Apply Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
