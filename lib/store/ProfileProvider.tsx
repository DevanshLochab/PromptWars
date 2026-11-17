'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HouseholdProfile, Location, Language } from '@/lib/schemas';
import {
  getStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
  isDemoModeEnabled,
  setDemoModeEnabled,
  getDefaultDemoProfile,
  isOnboardingComplete,
  setOnboardingComplete as setOnboardingCompleteInStore,
} from './profileStore';

interface ProfileContextType {
  profile: HouseholdProfile | null;
  isDemoMode: boolean;
  language: Language;
  isLoaded: boolean;
  onboardingComplete: boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  setOnboardingComplete: (complete: boolean) => void;
  setProfile: (profile: HouseholdProfile) => void;
  updateLanguage: (lang: Language) => void;
  updateLocation: (location: Location) => void;
  toggleDemoMode: (enabled?: boolean) => void;
  setDemoMode: (enabled: boolean) => void;
  resetAllData: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<HouseholdProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const demo = isDemoModeEnabled();
    setIsDemoMode(demo);
    const loaded = getStoredProfile();
    setProfileState(loaded);
    const complete = isOnboardingComplete();
    setOnboardingCompleteState(complete);
    if (loaded?.language) {
      setLanguage(loaded.language as Language);
    }
    setIsLoaded(true);

    const handleOpenSettingsEvent = () => setIsSettingsOpen(true);
    const checkHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#settings') {
        setIsSettingsOpen(true);
      }
    };

    checkHash();
    window.addEventListener('saans_open_settings', handleOpenSettingsEvent);
    window.addEventListener('hashchange', checkHash);

    return () => {
      window.removeEventListener('saans_open_settings', handleOpenSettingsEvent);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#settings') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const setOnboardingComplete = (complete: boolean) => {
    setOnboardingCompleteState(complete);
    setOnboardingCompleteInStore(complete);
  };

  const setProfile = (newProfile: HouseholdProfile) => {
    setProfileState(newProfile);
    saveStoredProfile(newProfile);
    if (newProfile.language) {
      setLanguage(newProfile.language as Language);
    }
  };

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    if (profile) {
      const updated = { ...profile, language: lang };
      setProfile(updated);
    }
  };

  const updateLocation = (location: Location) => {
    if (profile) {
      const updated: HouseholdProfile = { ...profile, location };
      setProfile(updated);
    } else {
      const demo = getDefaultDemoProfile();
      const updated: HouseholdProfile = { ...demo, location };
      setProfile(updated);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saans_location_updated', { detail: location }));
    }
  };

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    setDemoModeEnabled(enabled);
    if (enabled && !profile) {
      const demo = getDefaultDemoProfile();
      setProfileState(demo);
      saveStoredProfile(demo);
    }
  };

  const toggleDemoMode = (enabled?: boolean) => {
    const next = enabled !== undefined ? enabled : !isDemoMode;
    setDemoMode(next);
  };

  const resetAllData = () => {
    clearStoredProfile();
    setDemoModeEnabled(false);
    setIsDemoMode(false);
    setProfileState(null);
    setLanguage('en');
    setOnboardingCompleteState(false);
    closeSettings();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isDemoMode,
        language,
        isLoaded,
        onboardingComplete,
        isSettingsOpen,
        openSettings,
        closeSettings,
        toggleSettings,
        setOnboardingComplete,
        setProfile,
        updateLanguage,
        updateLocation,
        toggleDemoMode,
        setDemoMode,
        resetAllData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

export const useProfileStore = useProfile;
