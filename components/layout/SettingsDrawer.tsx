'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '@/lib/i18n';
import { getStoredTheme, applyTheme, Theme } from '@/lib/store/themeStore';
import { CitySelector } from '@/components/common/CitySelector';
import { Location } from '@/lib/schemas';
import { MapPin, Globe, Moon, Sun, Monitor, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SettingsDrawer({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: SettingsDrawerProps = {}) {
  const {
    isSettingsOpen,
    closeSettings,
    isDemoMode,
    language,
    updateLanguage,
    profile,
    updateLocation,
    toggleDemoMode,
    resetAllData,
  } = useProfile();

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : isSettingsOpen;
  const onClose = controlledOnClose || closeSettings;

  const { t } = useTranslation();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isChangingCity, setIsChangingCity] = useState(false);
  const [cityChangeSuccess, setCityChangeSuccess] = useState(false);

  // Keyboard Escape listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, [isOpen]);

  const handleThemeChange = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const handleCitySelect = (newLoc: Location) => {
    updateLocation(newLoc);
    setIsChangingCity(false);
    setCityChangeSuccess(true);
    setTimeout(() => setCityChangeSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="Close settings backdrop"
      />

      {/* Drawer panel */}
      <div className="relative z-10 w-full max-w-md bg-[var(--surface)] text-[var(--text)] shadow-2xl p-6 flex flex-col justify-between h-full border-l border-[var(--border)] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h2
              id="settings-heading"
              className="text-xl font-bold tracking-tight text-[var(--text)]"
            >
              {t('settings.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              aria-label={t('settings.close_drawer')}
            >
              ✕
            </button>
          </div>

          {/* 1. City & Location Section */}
          <div className="space-y-2.5 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[var(--primary)]" />
                <label className="text-sm font-semibold text-[var(--text)]">
                  {t('settings.location_title')}
                </label>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingCity((prev) => !prev)}
                className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {isChangingCity ? t('common.done') : t('settings.location_change')}
              </button>
            </div>

            {cityChangeSuccess && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Check size={14} /> {t('settings.location_updated')}
              </div>
            )}

            {!isChangingCity ? (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-bold text-sm text-[var(--text)]">
                    {profile?.location.placeName || 'New Delhi, Delhi, India'}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Coordinates:{' '}
                    {(profile?.location.lat ?? 28.6139).toFixed(2)}°N,{' '}
                    {(profile?.location.lon ?? 77.209).toFixed(2)}°E
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingCity(true)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold shadow-xs hover:opacity-90 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <CitySelector
                  currentLocation={profile?.location}
                  onSelect={handleCitySelect}
                  onCancel={() => setIsChangingCity(false)}
                />
              </div>
            )}
          </div>

          {/* 2. Language Preference (Regional Indian Languages) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[var(--primary)]" />
              <label className="text-sm font-semibold text-[var(--text)]">
                {t('settings.language')}
              </label>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {t('settings.language_desc')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_LANGUAGES.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    type="button"
                    onClick={() => updateLanguage(langItem.code as Language)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-xs font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold">{langItem.native}</span>
                      {isSelected && <Check size={14} className="text-[var(--primary)]" />}
                    </div>
                    <span className="text-[11px] text-[var(--muted)] mt-0.5">
                      {langItem.label}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] opacity-80 mt-1 truncate">
                      {langItem.region}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Dark Mode / Theme Selector */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-[var(--text)]">
              {t('settings.theme')}
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  theme === 'system'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Monitor size={16} />
                <span>{t('settings.theme_system')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Sun size={16} />
                <span>{t('settings.theme_light')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-2 px-2 rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Moon size={16} />
                <span>{t('settings.theme_dark')}</span>
              </button>
            </div>
          </div>

          {/* 4. Demo Mode Toggle */}
          <div className="p-4 rounded-xl bg-[var(--primary-soft)]/50 border border-[var(--primary)]/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-[var(--text)]">
                  {t('settings.demo_mode')}
                </span>
                <p className="text-xs text-[var(--muted)]">
                  {t('settings.demo_mode_desc')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => toggleDemoMode(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Reset / Clear Data */}
          <div className="pt-4 border-t border-[var(--border)] space-y-3">
            <h3 className="text-sm font-semibold text-[var(--danger)]">
              {t('settings.data_management')}
            </h3>
            <button
              onClick={() => {
                if (window.confirm(t('settings.reset_confirm'))) {
                  resetAllData();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              {t('settings.reset_data')}
            </button>
          </div>
        </div>

        {/* 6. Privacy Note */}
        <div className="pt-6 border-t border-[var(--border)] text-xs text-[var(--muted)] space-y-1">
          <p className="font-semibold text-[var(--text)]">
            🔒 {t('settings.privacy_title')}
          </p>
          <p>{t('settings.privacy_desc')}</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsDrawer;
