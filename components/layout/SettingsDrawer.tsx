'use client';

import React from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { isDemoMode, language, updateLanguage, toggleDemoMode, resetAllData } = useProfile();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-label="Close settings backdrop" />

      {/* Drawer panel */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between h-full border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-55">
              Settings & Preferences
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          {/* Language Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Language / भाषा
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => updateLanguage('en')}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => updateLanguage('hi')}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-sky-900 dark:text-sky-200">
                  Demo Mode (Delhi Smog Jan 15)
                </span>
                <p className="text-xs text-sky-700 dark:text-sky-400">
                  Loads prototype Delhi 4-member profile and severe smog hourly timeline
                </p>
              </div>
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => toggleDemoMode(e.target.checked)}
                className="w-5 h-5 accent-sky-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Reset / Clear Data */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Data Management
            </h3>
            <button
              onClick={() => {
                if (window.confirm('Clear all stored local data and restore defaults?')) {
                  resetAllData();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-4 text-sm font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Reset All Saved Household Data
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            🔒 Privacy First Architecture
          </p>
          <p>
            Saans stores all household health parameters exclusively on your local device. No
            identifiable health records are transmitted to third-party ad networks.
          </p>
        </div>
      </div>
    </div>
  );
}
