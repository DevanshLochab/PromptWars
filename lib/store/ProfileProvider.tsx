'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { HouseholdProfile } from '@/lib/schemas';
import {
  getStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
  isDemoModeEnabled,
  setDemoModeEnabled,
  getDefaultDemoProfile,
} from './profileStore';

interface ProfileContextType {
  profile: HouseholdProfile | null;
  isDemoMode: boolean;
  language: 'en' | 'hi';
  isLoaded: boolean;
  setProfile: (profile: HouseholdProfile) => void;
  updateLanguage: (lang: 'en' | 'hi') => void;
  toggleDemoMode: (enabled?: boolean) => void;
  resetAllData: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<HouseholdProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const demo = isDemoModeEnabled();
    setIsDemoMode(demo);
    const loaded = getStoredProfile();
    setProfileState(loaded);
    if (loaded?.language) {
      setLanguage(loaded.language);
    }
    setIsLoaded(true);
  }, []);

  const setProfile = (newProfile: HouseholdProfile) => {
    setProfileState(newProfile);
    saveStoredProfile(newProfile);
    if (newProfile.language) {
      setLanguage(newProfile.language);
    }
  };

  const updateLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    if (profile) {
      const updated = { ...profile, language: lang };
      setProfile(updated);
    }
  };

  const toggleDemoMode = (enabled?: boolean) => {
    const next = enabled !== undefined ? enabled : !isDemoMode;
    setIsDemoMode(next);
    setDemoModeEnabled(next);
    if (next) {
      const demo = getDefaultDemoProfile();
      setProfileState(demo);
      saveStoredProfile(demo);
    } else {
      clearStoredProfile();
      setProfileState(null);
    }
  };

  const resetAllData = () => {
    clearStoredProfile();
    setDemoModeEnabled(false);
    setIsDemoMode(false);
    setProfileState(null);
    setLanguage('en');
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isDemoMode,
        language,
        isLoaded,
        setProfile,
        updateLanguage,
        toggleDemoMode,
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
