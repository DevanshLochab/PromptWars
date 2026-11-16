'use client';

import React, { useState } from 'react';
import {
  HouseholdProfile,
  Member,
  Device,
  Location,
  Home,
  Constraints,
  AgeBandEnum,
  HealthConditionEnum,
  CommuteModeEnum,
} from '@/lib/schemas';
import { searchPlaces } from '@/lib/data/openMeteo';
import { ConfirmChip } from '@/components/common/ConfirmChip';
import demoSnapshot from '@/data/demo_snapshot.json';

export interface OnboardingStepperProps {
  onComplete: (profile: HouseholdProfile) => void;
  initialProfile?: HouseholdProfile;
  className?: string;
}

const PRESET_CITIES = [
  { name: 'New Delhi (Delhi)', lat: 28.6139, lon: 77.209, timezone: 'Asia/Kolkata' },
  { name: 'Mumbai (Maharashtra)', lat: 19.076, lon: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Bengaluru (Karnataka)', lat: 12.9716, lon: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'Kolkata (West Bengal)', lat: 22.5726, lon: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'Lucknow (Uttar Pradesh)', lat: 26.8467, lon: 80.9462, timezone: 'Asia/Kolkata' },
];

export function OnboardingStepper({
  onComplete,
  initialProfile,
  className = '',
}: OnboardingStepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Step 1: Location
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState<Location>(
    initialProfile?.location || (demoSnapshot.profile.location as Location)
  );

  // Step 2: Household Basics
  const [homeType, setHomeType] = useState<Home['type']>(
    initialProfile?.home.type || 'apartment'
  );
  const [roomArea, setRoomArea] = useState<number>(
    initialProfile?.home.mainRoomAreaM2 || 30
  );
  const [windowLeakiness, setWindowLeakiness] = useState<Home['windowLeakiness']>(
    initialProfile?.home.windowLeakiness || 'leaky'
  );
  const [canOpenWindows, setCanOpenWindows] = useState<boolean>(
    initialProfile?.home.canOpenWindows ?? true
  );
  const [exhaustHood, setExhaustHood] = useState<boolean>(
    initialProfile?.home.exhaustHood ?? true
  );
  const [cooking, setCooking] = useState<Home['cooking']>(
    initialProfile?.home.cooking || ['lpg']
  );
  const [heating, setHeating] = useState<Home['heating']>(
    initialProfile?.home.heating || ['electric']
  );
  const [incense, setIncense] = useState<Home['incenseOrCoils']>(
    initialProfile?.home.incenseOrCoils || 'sometimes'
  );

  // Step 3: Family Members
  const [members, setMembers] = useState<Member[]>(
    initialProfile?.members || (demoSnapshot.profile.members as Member[])
  );
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState<Member['ageBand']>('adult');
  const [newMemberHasAsthma, setNewMemberHasAsthma] = useState(false);
  const [newMemberCommuteMode, setNewMemberCommuteMode] =
    useState<Member['commute']['mode']>('metro');

  // Step 4: Devices
  const [hasPurifier, setHasPurifier] = useState<boolean>(true);
  const [purifierCadr, setPurifierCadr] = useState<number>(250);
  const [filterAgeMonths, setFilterAgeMonths] = useState<number>(14);
  const [hasDiyFilter, setHasDiyFilter] = useState<boolean>(false);
  const [hasCoAlarm, setHasCoAlarm] = useState<boolean>(false);

  // Step 5: Optional Photos
  const [photoUploaded, setPhotoUploaded] = useState<Record<string, boolean>>({
    room: false,
    purifier: false,
    mask: false,
    heater: false,
  });

  // Step 6: Confirmation of low-confidence estimates
  const [confirmedFields, setConfirmedFields] = useState<Record<string, boolean>>({
    roomArea: false,
    windowLeakiness: false,
    purifierCadr: false,
    filterAge: false,
  });

  // Search Location handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const res = await searchPlaces(query);
      setSearchResults(res);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPlace = (place: any) => {
    setLocation({
      lat: place.latitude || place.lat,
      lon: place.longitude || place.lon,
      placeName: `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}`,
      timezone: place.timezone || 'Asia/Kolkata',
    });
    setSearchResults([]);
    setSearchQuery(place.name);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newId = `m_${Date.now()}`;
    const newMem: Member = {
      id: newId,
      nickname: newMemberName.trim(),
      ageBand: newMemberAge,
      conditions: newMemberHasAsthma ? ['asthma'] : ['none'],
      commute: {
        mode: newMemberCommuteMode,
        km: 8,
        startHour: 9,
        endHour: 18,
      },
      outdoorHoursPerDay: 1.5,
      outdoorActivity: 'light',
      maskOwned: 'none',
    };
    setMembers([...members, newMem]);
    setNewMemberName('');
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleFinish = () => {
    const devices: Device[] = [];
    if (hasPurifier) {
      devices.push({
        type: 'purifier',
        cadrM3h: purifierCadr,
        filterAgeMonths: filterAgeMonths,
        room: 'main_room',
      });
    }
    if (hasDiyFilter) {
      devices.push({
        type: 'diy_filter',
        cadrM3h: 300,
        room: 'living_room',
      });
    }
    if (hasCoAlarm) {
      devices.push({
        type: 'co_alarm',
      });
    }

    const homeData: Home = {
      type: homeType,
      mainRoomAreaM2: roomArea,
      ceilingHeightM: 2.7,
      windowLeakiness: windowLeakiness,
      canOpenWindows: canOpenWindows,
      renter: false,
      exhaustHood: exhaustHood,
      ac: 'split',
      heating: heating,
      cooking: cooking,
      smokingIndoors: false,
      incenseOrCoils: incense,
    };

    const constraints: Constraints = {
      budgetBand: 'medium',
      hasCar: false,
      hasTwoWheeler: true,
    };

    const finalProfile: HouseholdProfile = {
      location: location,
      language: 'en',
      units: 'metric',
      home: homeData,
      devices: devices,
      members: members,
      constraints: constraints,
      communityCode: 'DELHI-CENTRAL',
    };

    onComplete(finalProfile);
  };

  return (
    <div
      role="region"
      aria-label="Household Onboarding Wizard"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-4 sm:p-6 space-y-6 ${className}`}
    >
      {/* Progress Bar & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            Step {currentStep} of {totalSteps}:{' '}
            {currentStep === 1 && 'Location & Micro-climate'}
            {currentStep === 2 && 'Home Characteristics'}
            {currentStep === 3 && 'Family Members & Commute'}
            {currentStep === 4 && 'Air Cleaning Devices'}
            {currentStep === 5 && 'Optional Room Photos (AI Audit)'}
            {currentStep === 6 && 'Review & Calibrate Estimates'}
            {currentStep === 7 && 'Ready to Breathe Cleaner!'}
          </span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Location */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              📍 Where does your family live?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We fetch hourly local outdoor PM2.5, wind dispersion, and diurnal inversion patterns.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Search City, District or Pincode
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g. Anand Vihar, Connaught Place, Indiranagar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            />
            {isSearching && (
              <p className="text-xs text-slate-400">Searching global weather stations...</p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md divide-y divide-slate-100 dark:divide-slate-700">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlace(p)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.name}
                    </span>
                    <span className="text-slate-400">
                      {p.admin1 ? `${p.admin1}, ` : ''}
                      {p.country || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-500">Popular presets:</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_CITIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() =>
                    setLocation({
                      lat: c.lat,
                      lon: c.lon,
                      placeName: c.name,
                      timezone: c.timezone,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer min-h-[36px] ${
                    location.placeName.includes(c.name.split(' ')[0])
                      ? 'bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950/60 dark:border-sky-700 dark:text-sky-300 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Selected Location:
            </span>{' '}
            <span className="font-bold text-sky-600 dark:text-sky-400">
              {location.placeName} ({location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E)
            </span>
          </div>
        </div>
      )}

      {/* STEP 2: Home Basics */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              🏠 Home & Indoor Environment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Infiltration physics depends heavily on room volume, window seals, and combustion sources.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Home Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Dwelling Type
              </label>
              <select
                value={homeType}
                onChange={(e) => setHomeType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
              >
                <option value="apartment">Apartment / Flat</option>
                <option value="house">Independent House / Villa</option>
                <option value="studio">Studio</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Room Area */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Main Room Area ({roomArea} m² / ~{Math.round(roomArea * 10.76)} sq ft)
              </label>
              <input
                type="range"
                min="10"
                max="80"
                value={roomArea}
                onChange={(e) => setRoomArea(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Window Leakiness */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Window Sealing & Infiltration
              </label>
              <select
                value={windowLeakiness}
                onChange={(e) => setWindowLeakiness(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
              >
                <option value="tight">Tight (UPVC / Double glazed / Weatherstripped)</option>
                <option value="average">Average (Standard aluminum/wood sliding)</option>
                <option value="leaky">Leaky (Gaps around wooden frames / wire mesh)</option>
              </select>
            </div>

            {/* Cooking Fuel */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Primary Cooking Method
              </label>
              <select
                value={cooking[0] || 'lpg'}
                onChange={(e) => setCooking([e.target.value as any])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
              >
                <option value="induction">Induction / Electric (Zero combustion)</option>
                <option value="lpg">LPG Cylinder / Piped Gas</option>
                <option value="biomass">Biomass / Chulha (High PM2.5 + CO)</option>
              </select>
            </div>

            {/* Winter Heating */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Space Heating in Winter
              </label>
              <select
                value={heating[0] || 'electric'}
                onChange={(e) => setHeating([e.target.value as any])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
              >
                <option value="electric">Electric (Oil radiator / Blower - safe)</option>
                <option value="gas">Unvented Gas Heater (⚠️ CO Hazard)</option>
                <option value="coal_charcoal">Angithi / Charcoal (⚠️ Lethal CO Hazard)</option>
                <option value="none">None / Blankets</option>
              </select>
            </div>

            {/* Incense / Coils */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Agarbatti / Mosquito Coils
              </label>
              <select
                value={incense}
                onChange={(e) => setIncense(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
              >
                <option value="never">Never</option>
                <option value="sometimes">Sometimes (1-2 weekly)</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Family Members */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              👨‍👩‍👧‍👦 Family Members & Commute Exposure
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vulnerability multipliers adjust for asthma, developing child lungs, and senior cardiovascular load.
            </p>
          </div>

          {/* Member List */}
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {m.nickname}
                  </span>{' '}
                  <span className="text-slate-500">
                    ({m.ageBand}, Commute: {m.commute.mode})
                  </span>
                  {m.conditions.includes('asthma') && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      🫁 Asthma
                    </span>
                  )}
                  {m.conditions.includes('heart') && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                      ❤️ Heart
                    </span>
                  )}
                </div>

                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer font-bold px-2 py-1"
                    aria-label={`Remove ${m.nickname}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Member Form */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/20 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              + Add Family Member
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nickname / Role (e.g. Didi)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 min-h-[44px]"
              />
              <select
                value={newMemberAge}
                onChange={(e) => setNewMemberAge(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 min-h-[44px]"
              >
                <option value="child">Child (3-12 yrs)</option>
                <option value="teen">Teenager (13-18 yrs)</option>
                <option value="adult">Adult</option>
                <option value="senior">Senior (65+ yrs)</option>
                <option value="infant">Infant (0-1 yr)</option>
                <option value="toddler">Toddler (1-3 yrs)</option>
              </select>
              <select
                value={newMemberCommuteMode}
                onChange={(e) => setNewMemberCommuteMode(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 min-h-[44px]"
              >
                <option value="metro">Metro Transit</option>
                <option value="bus">Public Bus</option>
                <option value="two_wheeler">Two-Wheeler (Motorcycle/Scooter)</option>
                <option value="car">Car (Closed Cab)</option>
                <option value="auto">Auto-rickshaw</option>
                <option value="walk">Walk / Cycle</option>
                <option value="none">Works from Home / None</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newMemberHasAsthma}
                  onChange={(e) => setNewMemberHasAsthma(e.target.checked)}
                  className="rounded text-sky-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Has Asthma or Respiratory Condition
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold min-h-[40px] cursor-pointer"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Devices */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              🔌 Air Cleaning Devices & Alarms
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Allows the indoor model to predict clean air delivery rate (CADR) and filter saturation.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Commercial Purifier */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPurifier}
                    onChange={(e) => setHasPurifier(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                  <span>HEPA Air Purifier</span>
                </label>
                <span className="text-slate-500 text-[11px]">e.g. Philips, Xiaomi, Coway</span>
              </div>

              {hasPurifier && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400">
                      Rated CADR: {purifierCadr} m³/h
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="600"
                      step="25"
                      value={purifierCadr}
                      onChange={(e) => setPurifierCadr(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400">
                      Filter Age: {filterAgeMonths} months
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={filterAgeMonths}
                      onChange={(e) => setFilterAgeMonths(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DIY Filter */}
            <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasDiyFilter}
                  onChange={(e) => setHasDiyFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500"
                />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    DIY Box Fan / Corsi-Rosenthal Box
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Fan paired with MERV-13 filter sheets
                  </div>
                </div>
              </div>
              <span className="text-emerald-600 font-bold text-xs">High CADR</span>
            </label>

            {/* CO Alarm */}
            <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasCoAlarm}
                  onChange={(e) => setHasCoAlarm(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500"
                />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Audible Carbon Monoxide (CO) Detector
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Essential for gas, biomass, or angithi heated homes
                  </div>
                </div>
              </div>
              <span className="text-sky-600 font-bold text-xs">Life Safety</span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 5: Photo Upload Audit (Optional) */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                📷 Optional: Photo Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snap photos to automatically detect room size, filter model, and mask fit.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
              Optional
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { id: 'room', label: 'Room & Windows', desc: 'Infers volume & seals' },
              { id: 'purifier', label: 'Purifier Label', desc: 'Infers CADR & filter type' },
              { id: 'mask', label: 'Commute Mask', desc: 'Checks N95 seal / valve' },
              { id: 'heater', label: 'Winter Heater', desc: 'Detects CO hazard' },
            ].map((slot) => (
              <div
                key={slot.id}
                className={`p-3 rounded-xl border border-dashed text-center space-y-1.5 transition-colors ${
                  photoUploaded[slot.id]
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30'
                }`}
              >
                <div className="text-xl">📸</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {slot.label}
                </div>
                <div className="text-[10px] text-slate-400">{slot.desc}</div>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoUploaded((prev) => ({ ...prev, [slot.id]: !prev[slot.id] }))
                  }
                  className={`mt-1 px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer min-h-[36px] w-full ${
                    photoUploaded[slot.id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {photoUploaded[slot.id] ? '✓ Analyzed' : 'Upload photo'}
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-center italic">
            Photos are processed locally in your session and never stored permanently.
          </p>
        </div>
      )}

      {/* STEP 6: Confirm Low Confidence Fields */}
      {currentStep === 6 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              🔍 Calibrate Parameter Estimates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We estimated several baseline physical variables. Tap "Confirm" to verify them.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <ConfirmChip
                field="Room Area"
                value={`${roomArea} m²`}
                isConfirmed={confirmedFields.roomArea}
                onConfirm={() =>
                  setConfirmedFields((p) => ({ ...p, roomArea: true }))
                }
              />
              <ConfirmChip
                field="Window Seal"
                value={windowLeakiness}
                isConfirmed={confirmedFields.windowLeakiness}
                onConfirm={() =>
                  setConfirmedFields((p) => ({ ...p, windowLeakiness: true }))
                }
              />
              <ConfirmChip
                field="Purifier CADR"
                value={`${purifierCadr} m³/h`}
                isConfirmed={confirmedFields.purifierCadr}
                onConfirm={() =>
                  setConfirmedFields((p) => ({ ...p, purifierCadr: true }))
                }
              />
              <ConfirmChip
                field="Filter Age"
                value={`${filterAgeMonths} months`}
                isConfirmed={confirmedFields.filterAge}
                onConfirm={() =>
                  setConfirmedFields((p) => ({ ...p, filterAge: true }))
                }
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Summary Profile:
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                • Location: {location.placeName}
                <br />
                • Members: {members.map((m) => m.nickname).join(', ')}
                <br />
                • Devices: {hasPurifier ? `Purifier (${purifierCadr} CADR)` : 'None'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: Done! */}
      {currentStep === 7 && (
        <div className="text-center py-6 space-y-3">
          <div className="text-5xl select-none">🎉</div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Household Profile Configured!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Saans has calibrated your indoor infiltration models, member exposure vulnerabilities, and ventilation timings.
          </p>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          {currentStep > 1 && currentStep < 7 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep < 6 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer min-h-[44px]"
            >
              Skip
            </button>
          )}

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs cursor-pointer min-h-[44px]"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer min-h-[44px]"
            >
              View My Clean Air Dashboard →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingStepper;
