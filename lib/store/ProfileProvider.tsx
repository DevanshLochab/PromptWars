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
  isOnboardingComplete,
  setOnboardingComplete as setOnboardingCompleteInStore,
} from './profileStore';

interface ProfileContextType {
  profile: HouseholdProfile | null;
  isDemoMode: boolean;
  language: 'en' | 'hi';
  isLoaded: boolean;
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  setProfile: (profile: HouseholdProfile) => void;
  updateLanguage: (lang: 'en' | 'hi') => void;
  toggleDemoMode: (enabled?: boolean) => void;
  setDemoMode: (enabled: boolean) => void;
  resetAllData: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<HouseholdProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(false);

  useEffect(() => {
    const demo = isDemoModeEnabled();
    setIsDemoMode(demo);
    const loaded = getStoredProfile();
    setProfileState(loaded);
    const complete = isOnboardingComplete();
    setOnboardingCompleteState(complete);
    if (loaded?.language) {
      setLanguage(loaded.language);
    }
    setIsLoaded(true);
  }, []);

  const setOnboardingComplete = (complete: boolean) => {
    setOnboardingCompleteState(complete);
    setOnboardingCompleteInStore(complete);
  };

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
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isDemoMode,
        language,
        isLoaded,
        onboardingComplete,
        setOnboardingComplete,
        setProfile,
        updateLanguage,
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
