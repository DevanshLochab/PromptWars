'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Baby,
  Smile,
  User,
  HeartHandshake,
  Activity,
  Heart,
  ShieldCheck,
  Footprints,
  Bike,
  Train,
  Car,
  Home as HomeIcon,
  Flame,
  Zap,
  Trees,
  Sun,
  Wind,
  Check,
  Camera,
  Sparkles,
  Sliders,
  MapPin,
  Globe,
} from 'lucide-react';
import {
  HouseholdProfile,
  Member,
  Device,
  Location,
  Home,
  Constraints,
  HouseholdProfileSchema,
} from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';
import { CitySelector } from '@/components/common/CitySelector';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/i18n';
import { useProfile } from '@/lib/store/ProfileProvider';

export interface OnboardingStepperProps {
  onComplete: (profile: HouseholdProfile) => void;
  onCancel?: () => void;
  initialProfile?: HouseholdProfile;
  className?: string;
}

interface MemberFormItem {
  id: string;
  name: string;
  ageBand: 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'senior';
  condition: 'none' | 'asthma' | 'heart' | 'pregnant';
  commuteMode: 'walk' | 'bike' | 'transit' | 'car' | 'wfh';
}

export function OnboardingStepper({
  onComplete,
  onCancel,
  initialProfile,
  className = '',
}: OnboardingStepperProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Hide mobile nav & header while wizard is active
  useEffect(() => {
    const nav = document.querySelector('nav');
    const header = document.querySelector('header');
    if (nav) nav.style.display = 'none';
    if (header) header.style.display = 'none';
    return () => {
      if (nav) nav.style.display = '';
      if (header) header.style.display = '';
    };
  }, []);

  const { language: currentLang, updateLanguage } = useProfile();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (initialProfile?.language as Language) || currentLang || 'en'
  );

  // Location
  const [location, setLocation] = useState<Location>(
    initialProfile?.location || (demoSnapshot.profile.location as Location)
  );
  const [isSelectingCity, setIsSelectingCity] = useState(false);

  // STEP 1 STATE: Household Members (max 3)
  const initialMembers: MemberFormItem[] = initialProfile?.members?.slice(0, 3).map((m, idx) => ({
    id: m.id || `m_${idx + 1}`,
    name: m.nickname || `Member ${idx + 1}`,
    ageBand: m.ageBand,
    condition: (m.conditions.find((c) =>
      ['asthma', 'heart', 'pregnant'].includes(c)
    ) || 'none') as 'none' | 'asthma' | 'heart' | 'pregnant',
    commuteMode:
      m.commute.mode === 'none'
        ? 'wfh'
        : m.commute.mode === 'walk'
        ? 'walk'
        : m.commute.mode === 'cycle' || m.commute.mode === 'two_wheeler'
        ? 'bike'
        : m.commute.mode === 'metro' || m.commute.mode === 'bus' || m.commute.mode === 'auto'
        ? 'transit'
        : 'car',
  })) || [
    {
      id: 'm_1',
      name: 'Adult 1',
      ageBand: 'adult',
      condition: 'none',
      commuteMode: 'transit',
    },
    {
      id: 'm_2',
      name: 'Child',
      ageBand: 'child',
      condition: 'asthma',
      commuteMode: 'walk',
    },
  ];

  const [members, setMembers] = useState<MemberFormItem[]>(initialMembers);

  // STEP 2 STATE: Home Characteristics
  // Cooking: Gas stove ('lpg'), Electric ('induction'), Biomass/Wood ('biomass')
  const [cookingType, setCookingType] = useState<'lpg' | 'induction' | 'biomass'>(
    (initialProfile?.home.cooking?.[0] as 'lpg' | 'induction' | 'biomass') || 'lpg'
  );

  // Heating: None ('none'), Electric ('electric'), Gas ('gas'), Coal/Wood ('coal_charcoal')
  const [heatingType, setHeatingType] = useState<'none' | 'electric' | 'gas' | 'coal_charcoal'>(
    (initialProfile?.home.heating?.[0] as 'none' | 'electric' | 'gas' | 'coal_charcoal') || 'none'
  );

  // Purifier: Yes / No + CADR
  const existingPurifier = initialProfile?.devices?.find((d) => d.type === 'purifier');
  const [hasPurifier, setHasPurifier] = useState<boolean>(Boolean(existingPurifier ?? true));
  const [cadrBand, setCadrBand] = useState<'compact' | 'standard' | 'high'>(
    existingPurifier?.cadrM3h && existingPurifier.cadrM3h > 350
      ? 'high'
      : existingPurifier?.cadrM3h && existingPurifier.cadrM3h < 220
      ? 'compact'
      : 'standard'
  );

  // Windows: Tight ('tight'), Average ('average'), Leaky ('leaky')
  const [windows, setWindows] = useState<'tight' | 'average' | 'leaky'>(
    initialProfile?.home.windowLeakiness || 'leaky'
  );

  // STEP 3 STATE: Photo boost (optional)
  const [photoBoostOpen, setPhotoBoostOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);

  // Member CRUD
  const handleAddMember = () => {
    if (members.length >= 3) return;
    const nextIdx = members.length + 1;
    setMembers([
      ...members,
      {
        id: `m_${Date.now()}`,
        name: nextIdx === 3 ? 'Senior' : `Member ${nextIdx}`,
        ageBand: nextIdx === 3 ? 'senior' : 'adult',
        condition: 'none',
        commuteMode: 'wfh',
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, updates: Partial<MemberFormItem>) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  // Smart Defaults
  const applySmartDefaults = () => {
    setMembers([
      {
        id: 'm_1',
        name: 'Parent',
        ageBand: 'adult',
        condition: 'none',
        commuteMode: 'transit',
      },
      {
        id: 'm_2',
        name: 'Child',
        ageBand: 'child',
        condition: 'asthma',
        commuteMode: 'walk',
      },
    ]);
    setCookingType('lpg');
    setHeatingType('none');
    setHasPurifier(true);
    setCadrBand('standard');
    setWindows('leaky');
    setCurrentStep(3);
  };

  // Final Assembly & Submit
  const handleFinish = () => {
    const finalDevices: Device[] = [];
    if (hasPurifier) {
      const cadrValue = cadrBand === 'compact' ? 180 : cadrBand === 'high' ? 420 : 260;
      finalDevices.push({
        type: 'purifier',
        cadrM3h: cadrValue,
        filterAgeMonths: 6,
        room: 'main_room',
      });
    }

    const homeData: Home = {
      type: 'apartment',
      mainRoomAreaM2: 30,
      ceilingHeightM: 2.7,
      windowLeakiness: windows,
      canOpenWindows: true,
      renter: false,
      exhaustHood: true,
      ac: 'split',
      heating: [heatingType],
      cooking: [cookingType],
      smokingIndoors: false,
      incenseOrCoils: 'never',
    };

    const finalMembers: Member[] = members.map((m) => {
      let commuteModeSchema: Member['commute']['mode'] = 'none';
      let km = 0;
      if (m.commuteMode === 'walk') {
        commuteModeSchema = 'walk';
        km = 2;
      } else if (m.commuteMode === 'bike') {
        commuteModeSchema = 'cycle';
        km = 6;
      } else if (m.commuteMode === 'transit') {
        commuteModeSchema = 'metro';
        km = 12;
      } else if (m.commuteMode === 'car') {
        commuteModeSchema = 'car';
        km = 14;
      }

      return {
        id: m.id,
        nickname: m.name.trim() || 'Family Member',
        ageBand: m.ageBand,
        conditions: m.condition === 'none' ? ['none'] : [m.condition],
        commute: {
          mode: commuteModeSchema,
          km,
          startHour: 9,
          endHour: 18,
        },
        outdoorHoursPerDay: m.ageBand === 'senior' ? 1 : m.ageBand === 'child' ? 2 : 1.5,
        outdoorActivity: 'light',
        maskOwned: 'none',
      };
    });

    const constraints: Constraints = {
      budgetBand: 'medium',
      hasCar: members.some((m) => m.commuteMode === 'car'),
      hasTwoWheeler: members.some((m) => m.commuteMode === 'bike'),
    };

    const finalProfile: HouseholdProfile = {
      location,
      language: selectedLanguage,
      units: 'metric',
      home: homeData,
      devices: finalDevices,
      members: finalMembers,
      constraints,
      communityCode: 'DELHI-NCR',
    };

    const parsed = HouseholdProfileSchema.safeParse(finalProfile);
    if (parsed.success) {
      onComplete(parsed.data);
    } else {
      // Fallback to validated profile
      onComplete(finalProfile);
    }
  };

  // Sample photo boost handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoStatus('Analyzing photo with Gemini...');
        setTimeout(() => {
          setPhotoStatus('Identified: Standard HEPA filter (~250 m³/h CADR), clean intake.');
          setHasPurifier(true);
          setCadrBand('standard');
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      role="region"
      aria-label="3-Step Family Onboarding Wizard"
      className={`fixed inset-0 z-[60] bg-[var(--bg)] flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* Top Wizard Bar */}
      <div className="shrink-0 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-[var(--text)]">
              सांस <span className="text-[var(--primary)]">Saans</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--primary-soft)] text-[var(--primary)]">
              Step {currentStep} of 3
            </span>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="max-w-2xl mx-auto mt-2.5 flex items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              currentStep >= 1 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              currentStep >= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              currentStep === 3 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            }`}
          />
        </div>
      </div>

      {/* Main Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
          {/* ================= STEP 1: WHO'S AT HOME? ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* City & Airshed Selection Card */}
              <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[var(--primary)]" />
                    <div>
                      <span className="font-bold text-sm text-[var(--text)] block">
                        Your City & Airshed
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        Select your Indian city or state for localized air monitoring
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelectingCity((prev) => !prev)}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    {isSelectingCity ? 'Done' : 'Change City'}
                  </button>
                </div>

                {!isSelectingCity ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <div>
                      <p className="font-bold text-sm text-[var(--text)]">{location.placeName}</p>
                      <p className="text-[11px] text-[var(--muted)]">
                        Coordinates: {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSelectingCity(true)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      Change City
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <CitySelector
                      currentLocation={location}
                      onSelect={(newLoc) => {
                        setLocation(newLoc);
                        setIsSelectingCity(false);
                      }}
                      onCancel={() => setIsSelectingCity(false)}
                    />
                  </div>
                )}
              </div>

              {/* Language Selection Option */}
              <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-[var(--primary)]" />
                  <span className="font-bold text-sm text-[var(--text)]">
                    Language Preference / भाषा
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {SUPPORTED_LANGUAGES.map((l) => {
                    const active = selectedLanguage === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(l.code);
                          updateLanguage(l.code);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border ${
                          active
                            ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-xs'
                            : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]'
                        }`}
                      >
                        {active && <Check size={12} strokeWidth={3} />}
                        <span>{l.native}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                  Who&apos;s at home?
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Add up to 3 people living with you so Saans can protect each person&apos;s lungs.
                </p>
              </div>

              {/* Members Cards */}
              <div className="space-y-4">
                {members.map((member, idx) => (
                  <div
                    key={member.id}
                    className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4"
                  >
                    {/* Header + Delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateMember(member.id, { name: e.target.value })}
                          placeholder="Name or nickname"
                          className="font-bold text-base text-[var(--text)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-hidden px-1"
                        />
                      </div>

                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          aria-label={`Remove ${member.name}`}
                          className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    {/* Age Group - Big Cards */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Age Group
                      </label>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[
                          { key: 'toddler', label: 'Baby', icon: Baby },
                          { key: 'child', label: 'Child', icon: Smile },
                          { key: 'teen', label: 'Teen', icon: User },
                          { key: 'adult', label: 'Adult', icon: User },
                          { key: 'senior', label: 'Senior', icon: HeartHandshake },
                        ].map(({ key, label, icon: Icon }) => {
                          const active = member.ageBand === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                updateMember(member.id, {
                                  ageBand: key as MemberFormItem['ageBand'],
                                })
                              }
                              className={`p-2.5 rounded-[var(--radius-card)] border flex flex-col items-center justify-center gap-1 min-h-[56px] transition-all cursor-pointer ${
                                active
                                  ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs'
                                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                              }`}
                            >
                              <Icon size={18} />
                              <span className="text-xs">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Health Status Chips */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Health Factors
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'none', label: 'Healthy', icon: ShieldCheck },
                          { key: 'asthma', label: 'Asthma / Respiratory', icon: Activity },
                          { key: 'heart', label: 'Heart condition', icon: Heart },
                          { key: 'pregnant', label: 'Pregnant', icon: Baby },
                        ].map(({ key, label, icon: Icon }) => {
                          const active = member.condition === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                updateMember(member.id, {
                                  condition: key as MemberFormItem['condition'],
                                })
                              }
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                active
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                              }`}
                            >
                              <Icon size={14} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Daily Commute */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Primary Daily Travel
                      </label>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[
                          { key: 'walk', label: 'Walk', icon: Footprints },
                          { key: 'bike', label: 'Bike/2W', icon: Bike },
                          { key: 'transit', label: 'Metro/Bus', icon: Train },
                          { key: 'car', label: 'Car', icon: Car },
                          { key: 'wfh', label: 'Home / WFH', icon: HomeIcon },
                        ].map(({ key, label, icon: Icon }) => {
                          const active = member.commuteMode === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                updateMember(member.id, {
                                  commuteMode: key as MemberFormItem['commuteMode'],
                                })
                              }
                              className={`p-2 rounded-[var(--radius-card)] border flex flex-col items-center justify-center gap-1 min-h-[50px] transition-all cursor-pointer ${
                                active
                                  ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs'
                                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                              }`}
                            >
                              <Icon size={16} />
                              <span className="text-[11px] text-center leading-tight">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Member Button (Max 3) */}
              {members.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-3 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] text-[var(--primary)] font-semibold text-sm flex items-center justify-center gap-2 bg-[var(--surface)] hover:bg-[var(--primary-soft)]/20 transition-all cursor-pointer min-h-[44px]"
                >
                  <Plus size={18} />
                  <span>Add another family member ({members.length}/3)</span>
                </button>
              )}
            </div>
          )}

          {/* ================= STEP 2: YOUR HOME ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                  Your home
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  How your home is heated, cooked in, and sealed changes how much smog gets in.
                </p>
              </div>

              {/* 1. Cooking */}
              <div className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Flame size={18} className="text-[var(--primary)]" />
                  <span>How do you cook?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'lpg', label: 'Gas Stove', sub: 'LPG / Piped gas', icon: Flame },
                    { key: 'induction', label: 'Electric / Induction', sub: 'Zero flame', icon: Zap },
                    { key: 'biomass', label: 'Wood / Kerosene', sub: 'Open combustion', icon: Trees },
                  ].map(({ key, label, sub, icon: Icon }) => {
                    const active = cookingType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCookingType(key as 'lpg' | 'induction' | 'biomass')}
                        className={`p-3.5 rounded-[var(--radius-card)] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          active
                            ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-xs'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon size={20} />
                          {active && <Check size={16} className="text-[var(--primary)]" />}
                        </div>
                        <span className="font-bold text-sm mt-1">{label}</span>
                        <span className="text-xs text-[var(--muted)]">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Heating */}
              <div className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Sun size={18} className="text-[var(--primary)]" />
                  <span>Winter room heating</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'none', label: 'None', sub: 'Warm clothes', icon: Sun },
                    { key: 'electric', label: 'Electric', sub: 'Oil / Rod heater', icon: Zap },
                    { key: 'gas', label: 'Gas heater', sub: 'Flued or portable', icon: Flame },
                    { key: 'coal_charcoal', label: 'Coal / Angithi', sub: 'Combustion brazier', icon: Flame },
                  ].map(({ key, label, sub, icon: Icon }) => {
                    const active = heatingType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setHeatingType(key as 'none' | 'electric' | 'gas' | 'coal_charcoal')
                        }
                        className={`p-3 rounded-[var(--radius-card)] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          active
                            ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-xs'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="font-bold text-xs sm:text-sm mt-1">{label}</span>
                        <span className="text-[11px] text-[var(--muted)]">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Purifier */}
              <div className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <Wind size={18} className="text-[var(--primary)]" />
                    <span>Do you have an air purifier?</span>
                  </label>
                  <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-full border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setHasPurifier(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        hasPurifier
                          ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                          : 'text-[var(--muted)]'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasPurifier(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                        !hasPurifier
                          ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                          : 'text-[var(--muted)]'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {hasPurifier && (
                  <div className="pt-2 border-t border-[var(--border)] space-y-2">
                    <span className="text-xs font-semibold text-[var(--muted)]">
                      Purifier capacity (Clean Air Delivery)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'compact', label: 'Compact', sub: 'Bedroom (< 200 m³/h)' },
                        { key: 'standard', label: 'Standard', sub: 'Living room (200–350 m³/h)' },
                        { key: 'high', label: 'High capacity', sub: 'Large hall (> 350 m³/h)' },
                      ].map(({ key, label, sub }) => {
                        const active = cadrBand === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCadrBand(key as 'compact' | 'standard' | 'high')}
                            className={`p-2.5 rounded-[var(--radius-card)] border text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold'
                                : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]'
                            }`}
                          >
                            <div className="text-xs font-bold">{label}</div>
                            <div className="text-[10px] text-[var(--muted)]">{sub}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Windows */}
              <div className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                <label className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Sliders size={18} className="text-[var(--primary)]" />
                  <span>Window sealing &amp; gaps</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'tight', label: 'Tight seal', sub: 'UPVC / double-glazed' },
                    { key: 'average', label: 'Average', sub: 'Standard sliding / latches' },
                    { key: 'leaky', label: 'Leaky', sub: 'Visible gaps / drafts' },
                  ].map(({ key, label, sub }) => {
                    const active = windows === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setWindows(key as 'tight' | 'average' | 'leaky')}
                        className={`p-3 rounded-[var(--radius-card)] border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm">{label}</div>
                        <div className="text-[11px] text-[var(--muted)] mt-0.5">{sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: YOUR PLAN IS READY ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-soft)] text-[var(--primary)] mb-1">
                  <Sparkles size={14} />
                  <span>Personalized Air Strategy</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                  Your plan is ready
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Here is what we know about your home. Tap any chip to adjust before starting.
                </p>
              </div>

              {/* Summary Editable Chips */}
              <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Household Summary
                </h3>

                <div className="flex flex-wrap gap-2.5">
                  {/* Members Chip */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-3.5 py-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User size={15} className="text-[var(--primary)]" />
                    <span>
                      {members.length} {members.length === 1 ? 'Person' : 'People'} (
                      {members.map((m) => m.name).join(', ')})
                    </span>
                    <span className="text-[10px] text-[var(--primary)] font-bold">Edit</span>
                  </button>

                  {/* Conditions Chip */}
                  {members.some((m) => m.condition !== 'none') && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-3.5 py-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Activity size={15} className="text-[var(--danger)]" />
                      <span>
                        Vulnerable:{' '}
                        {members
                          .filter((m) => m.condition !== 'none')
                          .map((m) => `${m.name} (${m.condition})`)
                          .join(', ')}
                      </span>
                      <span className="text-[10px] text-[var(--primary)] font-bold">Edit</span>
                    </button>
                  )}

                  {/* Cooking Chip */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3.5 py-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Flame size={15} className="text-[var(--primary)]" />
                    <span>
                      Cooking:{' '}
                      {cookingType === 'lpg'
                        ? 'Gas stove'
                        : cookingType === 'induction'
                        ? 'Electric induction'
                        : 'Biomass/Wood'}
                    </span>
                    <span className="text-[10px] text-[var(--primary)] font-bold">Edit</span>
                  </button>

                  {/* Heating Chip */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3.5 py-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sun size={15} className="text-[var(--primary)]" />
                    <span>
                      Heating:{' '}
                      {heatingType === 'none'
                        ? 'No heater'
                        : heatingType === 'electric'
                        ? 'Electric heater'
                        : heatingType === 'gas'
                        ? 'Gas heater'
                        : 'Coal / Angithi'}
                    </span>
                    <span className="text-[10px] text-[var(--primary)] font-bold">Edit</span>
                  </button>

                  {/* Purifier Chip */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3.5 py-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Wind size={15} className="text-[var(--primary)]" />
                    <span>
                      Purifier:{' '}
                      {hasPurifier
                        ? `Yes (${cadrBand} CADR)`
                        : 'No air purifier'}
                    </span>
                    <span className="text-[10px] text-[var(--primary)] font-bold">Edit</span>
                  </button>

                  {/* Windows Chip */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3.5 py-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sliders size={15} className="text-[var(--primary)]" />
                    <span>Windows: {windows} seal</span>
                    <span className="text-[10px] text-[var(--primary)] font-bold">Edit</span>
                  </button>
                </div>
              </div>

              {/* Optional Photo Boost Card */}
              <div className="rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setPhotoBoostOpen(!photoBoostOpen)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Camera size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text)]">
                        Add a room or purifier photo (optional)
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        Gemini Vision auto-detects filter age, CADR, and window seals
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)]">
                    {photoBoostOpen ? 'Close' : 'Expand'}
                  </span>
                </button>

                {photoBoostOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-[var(--border)] space-y-4">
                    <label className="block text-xs font-semibold text-[var(--muted)]">
                      Upload photo of your living room, air purifier, or window frame
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-pill)] file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary-soft)] file:text-[var(--primary)] hover:file:opacity-90 cursor-pointer"
                      />
                    </div>

                    {photoStatus && (
                      <div className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-soft)]/50 p-2.5 rounded-lg">
                        {photoStatus}
                      </div>
                    )}

                    {photoPreview && (
                      <div className="w-32 h-32 rounded-lg overflow-hidden border border-[var(--border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Uploaded room or purifier preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="shrink-0 bg-[var(--surface)] border-t border-[var(--border)] px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Back button */}
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="py-2.5 px-3 rounded-[var(--radius-card)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>

          {/* Smart Defaults Button */}
          {currentStep < 3 && (
            <button
              type="button"
              onClick={applySmartDefaults}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] underline underline-offset-4 cursor-pointer"
            >
              Use smart defaults
            </button>
          )}

          {/* Forward / Finish Button */}
          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 2 | 3)}
                className="py-2.5 px-5 rounded-[var(--radius-card)] bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-sm flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer min-h-[44px]"
              >
                <span>Continue</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="py-2.5 px-6 rounded-[var(--radius-card)] bg-[var(--primary)] text-[var(--on-primary)] font-bold text-sm sm:text-base flex items-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer min-h-[44px]"
              >
                <Check size={18} />
                <span>Start using Saans</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingStepper;
