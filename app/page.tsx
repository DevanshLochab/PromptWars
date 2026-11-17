'use client';

import React, { useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/store/profileStore';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { getAirQuality } from '@/lib/data/openMeteo';
import { HourlyAir } from '@/lib/schemas';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import { TodayScreen } from '@/components/today/TodayScreen';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export default function TodayPage() {
  const {
    profile,
    isDemoMode,
    isLoaded,
    onboardingComplete,
    setProfile,
    setDemoMode,
    setOnboardingComplete,
  } = useProfileStore();

  const [hourlyData, setHourlyData] = useState<HourlyAir[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
  const [showRecalibrate, setShowRecalibrate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      const lat = profile?.location.lat ?? 28.6139;
      const lon = profile?.location.lon ?? 77.209;
      const data = await getAirQuality(lat, lon, !isDemoMode);
      if (isMounted) {
        setHourlyData(data);
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [profile?.location.lat, profile?.location.lon, isDemoMode]);

  // Loading state while checking stored session on first mount
  if (!isLoaded) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <LoadingSkeleton type="ring" />
        <LoadingSkeleton type="receipt" />
      </div>
    );
  }

  // Welcome / Onboarding Gate: If onboarding is not complete, show Welcome or Stepper
  if (!onboardingComplete) {
    if (isStartingOnboarding) {
      return (
        <OnboardingStepper
          onComplete={(newProfile) => {
            setProfile(newProfile);
            setOnboardingComplete(true);
            setIsStartingOnboarding(false);
          }}
          onCancel={() => setIsStartingOnboarding(false)}
        />
      );
    }

    return (
      <WelcomeScreen
        onStartSetup={() => setIsStartingOnboarding(true)}
        onTryDemo={() => {
          const demoProfile = getDefaultDemoProfile();
          setProfile(demoProfile);
          setDemoMode(true);
          setOnboardingComplete(true);
        }}
      />
    );
  }

  // Once onboarding is complete: Render Today screen
  return (
    <div className="relative">
      {/* Drawer / Re-calibration stepper modal if triggered */}
      {showRecalibrate && (
        <OnboardingStepper
          initialProfile={profile || getDefaultDemoProfile()}
          onComplete={(newProfile) => {
            setProfile(newProfile);
            setShowRecalibrate(false);
          }}
          onCancel={() => setShowRecalibrate(false)}
        />
      )}

      {loading && !hourlyData ? (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
          <LoadingSkeleton type="ring" />
          <LoadingSkeleton type="receipt" />
          <LoadingSkeleton type="timeline" />
        </div>
      ) : (
        <TodayScreen
          profile={profile}
          hourlyData={hourlyData}
        />
      )}
    </div>
  );
}
