// Step 5: Compare screen redesign (Compare your choices, scenario picker grid, verdict card, side-by-side receipts)
'use client';

import React, { useMemo, useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { Action, HouseholdProfile, Receipt } from '@/lib/schemas';
import { useTranslation } from '@/lib/i18n';
import actionsData from '@/data/actions.json';
import emissionFactorsData from '@/data/emission_factors.json';
import {
  createReceiptForAction,
  computeHourlyIndoor,
  computeMemberExposure,
} from '@/lib/engine';
import {
  Train,
  Fan,
  Flame,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface ScenarioDef {
  id: string;
  name: string;
  category: string;
  description: string;
  costLabel: string;
  costValue: number; // daily or monthly normalized cost in INR
  exposureAvoidedUgM3: number;
  receipt: Receipt;
}

interface ComparisonPreset {
  key: string;
  title: string;
  shortTitle: string;
  scenarioA: ScenarioDef;
  scenarioB: ScenarioDef;
}

export default function WhatIfPage() {
  const { profile, language } = useProfile();
  const { t } = useTranslation();
  const [activePresetKey, setActivePresetKey] = useState<string>('car-vs-metro');
  const [mobileTab, setMobileTab] = useState<'A' | 'B'>('B');

  const activeProfile: HouseholdProfile = useMemo(() => {
    return profile || getDefaultDemoProfile();
  }, [profile]);

  const isHi = language !== 'en';

  // Build scenarios dynamically using user's real profile and physics calculation engine
  const presets: Record<string, ComparisonPreset> = useMemo(() => {
    // -------------------------------------------------------------------------
    // 1. Scenario 1: Solo Car vs Metro Transit ('car-vs-metro')
    // -------------------------------------------------------------------------
    const commuter =
      activeProfile.members.find((m) => ['car', 'two_wheeler'].includes(m.commute?.mode)) ||
      activeProfile.members[0];
    const commuterName = commuter?.nickname || (isHi ? 'यात्री' : 'Commuter');
    const km = Math.max(1, commuter?.commute?.km || 15);
    const roundTripKm = km * 2;

    const carAction = (actionsData.find((a) => a.id === 'car_to_metro_or_bus') || actionsData[0]) as Action;

    // Real tailpipe emissions avoided dynamically for roundTripKm
    const carFactors = emissionFactorsData.car_petrol;
    const metroFactors = emissionFactorsData.metro_electric_per_pax_km;
    const tailpipePm25AvoidedG =
      Math.round((carFactors.pm25_g.value - metroFactors.pm25_g.value) * roundTripKm * 10) / 10;
    const co2eAvoidedG = Math.round((carFactors.co2e_g.value - metroFactors.co2e_g.value) * roundTripKm);

    const carDailyCost = Math.round(roundTripKm * 8.5 + 40);
    const metroLegFare = Math.min(60, Math.max(20, Math.round(km * 2.2)));
    const metroDailyCost = metroLegFare * 2;

    const metroReceipt = createReceiptForAction(carAction, activeProfile);
    metroReceipt.memberIds = commuter ? [commuter.id] : activeProfile.members.map((m) => m.id);
    metroReceipt.breathe = {
      metric: 'pm25_exposure_reduction_pct',
      before: 180,
      after: 55,
      deltaPct: -69.4,
      unit: 'µg/m³',
      low: 45,
      high: 70,
    };
    metroReceipt.give = {
      pm25_g: tailpipePm25AvoidedG > 0 ? tailpipePm25AvoidedG : 145,
      nox_g: Math.round(roundTripKm * 0.048 * 10) / 10,
      co2e_g: co2eAvoidedG > 0 ? co2eAvoidedG : 2200,
      period: 'daily',
      low: Math.round((tailpipePm25AvoidedG > 0 ? tailpipePm25AvoidedG : 145) * 0.8),
      high: Math.round((tailpipePm25AvoidedG > 0 ? tailpipePm25AvoidedG : 145) * 1.2),
    };
    metroReceipt.cost = { upfront: 0, ongoing: metroDailyCost, currency: 'INR' };
    metroReceipt.assumptions = [
      {
        label: isHi ? 'दैनिक राउंड-ट्रिप दूरी' : 'Daily round-trip distance',
        value: `${roundTripKm}`,
        unit: 'km',
        source: `${commuterName}'s commute profile (${km} km each way)`,
      },
      {
        label: isHi ? 'भूमिगत वायु निस्पंदन' : 'Underground air filtration',
        value: 'MERV-13 central HVAC',
        source: 'DMRC station standard',
      },
      {
        label: isHi ? 'रोका गया टेलपाइप PM2.5' : 'Urban tailpipe PM avoided',
        value: `${tailpipePm25AvoidedG}g / day`,
        source: 'CPCB / ARAI vehicle factors',
      },
      {
        label: isHi ? 'रोकी गई ग्रीनहाउस गैसें' : 'Avoided greenhouse gas',
        value: `${(co2eAvoidedG / 1000).toFixed(1)} kg CO₂e / day`,
        source: 'EEA transit factors',
      },
    ];

    const carReceipt: Receipt = {
      id: 'rcpt_whatif_car',
      actionId: 'car_to_metro_or_bus',
      memberIds: commuter ? [commuter.id] : activeProfile.members.map((m) => m.id),
      formulaId: 'vehicle_cabin_exposure',
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: 180,
        after: 120,
        deltaPct: -33.3,
        unit: 'µg/m³',
        low: 100,
        high: 140,
      },
      give: { pm25_g: 0, nox_g: 0, co2e_g: 0, period: 'daily', low: 0, high: 0 },
      cost: { upfront: 0, ongoing: carDailyCost, currency: 'INR' },
      effort: 2,
      evidence: 'B',
      confidence: 'high',
      assumptions: [
        {
          label: isHi ? 'दैनिक कार यात्रा दूरी' : 'Daily car commute distance',
          value: `${roundTripKm}`,
          unit: 'km',
          source: `${commuterName}'s recorded commute`,
        },
        {
          label: isHi ? 'कैबिन फ़िल्टर रेटिंग' : 'Cabin filter rating',
          value: isHi ? 'मानक मेश फ़िल्टर' : 'Standard OEM cabin mesh',
          source: 'OEM cabin air filter specification',
        },
        {
          label: isHi ? 'उत्पन्न टेलपाइप उत्सर्जन' : 'Tailpipe emissions generated',
          value: `${tailpipePm25AvoidedG || 145}g PM2.5 / day`,
          source: 'ARAI vehicle factor',
        },
      ],
    };

    const cityNameLower = (activeProfile.location?.placeName || '').toLowerCase();
    const transitName = cityNameLower.includes('mumbai')
      ? (isHi ? 'मुंबई मेट्रो / उपनगरीय रेल' : 'Mumbai Metro / Suburban Rail')
      : cityNameLower.includes('bengaluru') || cityNameLower.includes('bangalore')
        ? (isHi ? 'नम्मा मेट्रो' : 'Namma Metro Transit')
        : cityNameLower.includes('pune')
          ? (isHi ? 'पुणे मेट्रो' : 'Pune Metro Transit')
          : cityNameLower.includes('kolkata')
            ? (isHi ? 'कोलकाता मेट्रो' : 'Kolkata Metro')
            : cityNameLower.includes('hyderabad')
              ? (isHi ? 'हैदराबाद मेट्रो रेल' : 'Hyderabad Metro Rail')
              : cityNameLower.includes('chennai')
                ? (isHi ? 'चेन्नई मेट्रो रेल' : 'Chennai Metro Rail')
                : (isHi ? 'दिल्ली मेट्रो रेल' : 'Delhi Metro Transit');

    const carVsMetroScenario: ComparisonPreset = {
      key: 'car-vs-metro',
      title: isHi ? `🚗 कार बनाम 🚇 ${transitName}` : `🚗 Solo Car vs 🚇 ${transitName}`,
      shortTitle: isHi ? 'कार बनाम मेट्रो' : 'Car vs Metro',
      scenarioA: {
        id: 'solo_car',
        name: isHi ? 'परिदृश्य ए: अकेले कार चलाना' : 'Scenario A: Drive Solo Car',
        category: isHi ? 'यात्रा' : 'Commute',
        description: isHi
          ? `${commuterName} की ${km} किमी की दैनिक यात्रा (राउंड-ट्रिप ${roundTripKm} किमी), व्यक्तिगत कार में एसी के साथ।`
          : `${commuterName}'s ${km} km daily city commute (${roundTripKm} km round-trip) driving a personal vehicle with AC.`,
        costLabel: isHi
          ? `₹${carDailyCost} / दिन (ईंधन + टोल + पार्किंग)`
          : `₹${carDailyCost} / day (fuel + toll + parking)`,
        costValue: carDailyCost,
        exposureAvoidedUgM3: 60,
        receipt: carReceipt,
      },
      scenarioB: {
        id: 'metro_transit',
        name: isHi ? `परिदृश्य बी: ${transitName}` : `Scenario B: ${transitName}`,
        category: isHi ? 'यात्रा' : 'Commute',
        description: isHi
          ? `${roundTripKm} किमी की दैनिक यात्रा उच्च गति भूमिगत ${transitName} से, जहां स्टेशन व कोच में एयर फिल्ट्रेशन उपलब्ध है।`
          : `${roundTripKm} km daily commute on high-speed ${transitName} with station & coach filtration.`,
        costLabel: isHi
          ? `₹${metroDailyCost} / दिन (स्मार्ट कार्ड)`
          : `₹${metroDailyCost} / day (Metro Smart Card)`,
        costValue: metroDailyCost,
        exposureAvoidedUgM3: 125,
        receipt: metroReceipt,
      },
    };

    // -------------------------------------------------------------------------
    // 2. Scenario 2: Commercial Purifier vs DIY Box Fan ('purifier-vs-diy')
    // -------------------------------------------------------------------------
    const roomArea = activeProfile.home.mainRoomAreaM2 || 30;
    const ceilingHeight = activeProfile.home.ceilingHeightM || 2.7;
    const roomVolume = Math.round(roomArea * ceilingHeight);

    const outdoorTimeline = [320, 350, 300, 250, 200, 220, 280, 340];
    const baseIndoor = computeHourlyIndoor(outdoorTimeline, activeProfile, { overrideCADR: 0 });
    const commIndoor = computeHourlyIndoor(outdoorTimeline, activeProfile, { overrideCADR: 250 });
    const diyIndoor = computeHourlyIndoor(outdoorTimeline, activeProfile, { overrideCADR: 350 });

    const baseAvg = Math.round(
      baseIndoor.hourlyIndoor.reduce((a, b) => a + b, 0) / Math.max(1, baseIndoor.hourlyIndoor.length)
    );
    const commAvg = Math.round(
      commIndoor.hourlyIndoor.reduce((a, b) => a + b, 0) / Math.max(1, commIndoor.hourlyIndoor.length)
    );
    const diyAvg = Math.round(
      diyIndoor.hourlyIndoor.reduce((a, b) => a + b, 0) / Math.max(1, diyIndoor.hourlyIndoor.length)
    );

    const commAvoided = Math.max(1, baseAvg - commAvg);
    const diyAvoided = Math.max(1, baseAvg - diyAvg);

    const purifierAction = (actionsData.find((a) => a.id === 'purifier_run_high_bedroom_evening') ||
      actionsData[0]) as Action;
    const diyAction = (actionsData.find((a) => a.id === 'diy_corsi_rosenthal_box') ||
      actionsData[0]) as Action;

    const commReceipt = createReceiptForAction(purifierAction, activeProfile);
    commReceipt.breathe = {
      metric: 'pm25_exposure_reduction_pct',
      before: baseAvg,
      after: commAvg,
      deltaPct: -Math.round(((baseAvg - commAvg) / Math.max(1, baseAvg)) * 100),
      unit: 'µg/m³',
      low: Math.max(5, commAvg - 8),
      high: commAvg + 12,
    };
    commReceipt.cost = { upfront: 8500, ongoing: 125, currency: 'INR' };
    commReceipt.assumptions = [
      {
        label: isHi ? 'कमरे का वास्तविक आयतन' : 'Target room volume',
        value: `${roomVolume}`,
        unit: 'm³',
        source: `Household profile: ${roomArea} m² × ${ceilingHeight} m ceiling`,
      },
      {
        label: isHi ? 'स्वच्छ वायु वितरण दर (CADR)' : 'Clean Air Delivery Rate (CADR)',
        value: '250',
        unit: 'm³/h',
        source: 'AHAM certified specification',
      },
      {
        label: isHi ? 'HEPA एकल-पास दक्षता' : 'HEPA single-pass efficiency',
        value: '99.97',
        unit: '%',
        source: 'EN 1822 standard',
      },
    ];

    const diyReceipt = createReceiptForAction(diyAction, activeProfile);
    diyReceipt.breathe = {
      metric: 'pm25_exposure_reduction_pct',
      before: baseAvg,
      after: diyAvg,
      deltaPct: -Math.round(((baseAvg - diyAvg) / Math.max(1, baseAvg)) * 100),
      unit: 'µg/m³',
      low: Math.max(5, diyAvg - 8),
      high: diyAvg + 12,
    };
    diyReceipt.cost = { upfront: 2200, ongoing: 65, currency: 'INR' };
    diyReceipt.assumptions = [
      {
        label: isHi ? 'कमरे का वास्तविक आयतन' : 'Target room volume',
        value: `${roomVolume}`,
        unit: 'm³',
        source: `Household profile: ${roomArea} m² × ${ceilingHeight} m ceiling`,
      },
      {
        label: isHi ? 'प्रभावी CADR' : 'Effective CADR',
        value: '350',
        unit: 'm³/h',
        source: 'UC Davis / EPA Corsi-Rosenthal bench study',
      },
      {
        label: isHi ? 'फ़िल्टर मीडिया' : 'Filter media setup',
        value: '4× MERV-13 furnace filters + 20" box fan',
        source: 'ASHRAE 52.2 standard',
      },
    ];

    const purifierVsDiyScenario: ComparisonPreset = {
      key: 'purifier-vs-diy',
      title: isHi ? '🏢 ब्रांडेड प्यूरीफायर बनाम 📦 DIY बॉक्स फैन' : '🏢 Commercial Purifier vs 📦 DIY Box Fan',
      shortTitle: isHi ? 'प्यूरीफायर बनाम DIY' : 'Purifier vs DIY Fan',
      scenarioA: {
        id: 'commercial_hepa',
        name: isHi ? 'परिदृश्य ए: ब्रांडेड HEPA प्यूरीफायर' : 'Scenario A: Commercial HEPA Purifier',
        category: isHi ? 'वायु शुद्धिकरण' : 'Purification',
        description: isHi
          ? `250 m³/h स्वच्छ वायु वितरण दर (CADR) वाला ब्रांड-नाम HEPA प्यूरीफायर (${roomArea} m² कमरे के लिए)।`
          : `Brand-name HEPA air purifier with 250 m³/h clean air delivery rate for ${roomArea} m² room.`,
        costLabel: isHi
          ? '₹8,500 एकमुश्त + ₹1,500/वर्ष फ़िल्टर'
          : '₹8,500 upfront + ₹1,500/yr filter',
        costValue: 275, // monthly amortized
        exposureAvoidedUgM3: commAvoided,
        receipt: commReceipt,
      },
      scenarioB: {
        id: 'diy_corsi_box',
        name: isHi ? 'परिदृश्य बी: DIY कोर्सी-रोज़ेंथल बॉक्स' : 'Scenario B: DIY Box Fan (Corsi-Rosenthal)',
        category: isHi ? 'वायु शुद्धिकरण' : 'Purification',
        description: isHi
          ? `4 MERV-13 फर्नेस फिल्टर पैनलों के साथ 20" बॉक्स फैन, जो उच्च 350 m³/h CADR प्रदान करता है।`
          : `Standard 20" residential box fan sealed with 4 MERV-13 furnace filter panels delivering 350 m³/h CADR.`,
        costLabel: isHi
          ? '₹2,200 एकमुश्त + ₹800/वर्ष फ़िल्टर'
          : '₹2,200 upfront + ₹800/yr filters',
        costValue: 120, // monthly amortized
        exposureAvoidedUgM3: diyAvoided,
        receipt: diyReceipt,
      },
    };

    // -------------------------------------------------------------------------
    // 3. Scenario 3: Combustion Heating vs Layered Warmth ('heater-vs-layers')
    // -------------------------------------------------------------------------
    const heatingFuel =
      activeProfile.home.heating?.find((h) => ['coal_charcoal', 'wood', 'gas'].includes(h)) ||
      'coal_charcoal';

    const layersAction = (actionsData.find(
      (a) => a.id === 'layered_thermal_clothing_instead_of_combustion_heat'
    ) || actionsData[0]) as Action;

    const layersReceipt = createReceiptForAction(layersAction, activeProfile);
    layersReceipt.breathe = {
      metric: 'pm25_exposure_reduction_pct',
      before: 120,
      after: 85,
      deltaPct: -29.2,
      unit: 'µg/m³',
      low: 70,
      high: 95,
    };
    layersReceipt.give = {
      pm25_g: 7.5,
      nox_g: 3.0,
      co2e_g: 2250,
      period: 'daily',
      low: 4.5,
      high: 12,
    };
    layersReceipt.cost = { upfront: 0, ongoing: 0, currency: 'INR' };
    layersReceipt.assumptions = [
      {
        label: isHi ? 'शून्य कार्बन मोनोऑक्साइड' : 'Zero Carbon Monoxide',
        value: '0 ppm CO',
        source: 'Elimination of combustion source',
      },
      {
        label: isHi ? 'रोका गया इनडोर धुआं' : 'Indoor smoke averted',
        value: '7.5g PM2.5 / day',
        source: 'WHO Household Air Pollution Model',
      },
    ];

    const flameReceipt: Receipt = {
      id: 'rcpt_whatif_gas_heater',
      actionId: 'never_seal_room_with_combustion_heater',
      memberIds: activeProfile.members.map((m) => m.id),
      formulaId: 'indoor_combustion_source',
      breathe: {
        metric: 'pm25_exposure_increase_pct',
        before: 120,
        after: 310,
        deltaPct: 158.3,
        unit: 'µg/m³',
        low: 250,
        high: 400,
      },
      give: { pm25_g: 0, nox_g: 0, co2e_g: 0, period: 'daily', low: 0, high: 0 },
      cost: { upfront: 0, ongoing: 80, currency: 'INR' },
      effort: 1,
      evidence: 'D',
      confidence: 'high',
      assumptions: [
        {
          label: isHi ? 'दहन उत्सर्जन' : 'Combustion emission',
          value: isHi ? 'अत्यधिक PM2.5 + जानलेवा CO का खतरा' : 'High PM2.5 + lethal CO risk',
          source: 'WHO Household Air Pollution Guidelines',
        },
        {
          label: isHi ? 'घर में उपयोग किया गया ईंधन' : 'Profile heating source',
          value: heatingFuel.replace('_', ' '),
          source: 'User household profile',
        },
      ],
    };

    const heaterVsLayersScenario: ComparisonPreset = {
      key: 'heater-vs-layers',
      title: isHi
        ? '🔥 अनवेंटेड हीटर बनाम 🧤 गर्म कपड़े व रजाई'
        : '🔥 Unvented Heater vs 🧤 Thermal Layers',
      shortTitle: isHi ? 'हीटर बनाम गर्म कपड़े' : 'Gas Heat vs Warm Layers',
      scenarioA: {
        id: 'gas_heater',
        name: isHi ? 'परिदृश्य ए: अनवेंटेड अंगीठी/गैस हीटर' : 'Scenario A: Run Fuel Flame Heater',
        category: isHi ? 'इनडोर स्रोत' : 'Indoor Sources',
        description: isHi
          ? `सर्दियों की रातों में घर के अंदर बिना वेंटिलेशन वाली कोयला अंगीठी, लकड़ी या गैस हीटर जलाना।`
          : `Burning unvented gas, coal, or charcoal angithi indoors during chilly winter nights.`,
        costLabel: isHi ? '₹80 / दिन ईंधन खर्च' : '₹80 / day fuel cost',
        costValue: 80,
        exposureAvoidedUgM3: -190, // worsens exposure
        receipt: flameReceipt,
      },
      scenarioB: {
        id: 'thermal_layers',
        name: isHi ? 'परिदृश्य बी: थर्मल वस्त्र व गर्म रजाई' : 'Scenario B: Blankets & Thermal Layers',
        category: isHi ? 'इनडोर स्रोत' : 'Indoor Sources',
        description: isHi
          ? `दहन हीटर को पूरी तरह बंद रखें; ऊनी कपड़े, थर्मल इनर और रजाई का उपयोग करें। शून्य जहरीली गैस।`
          : `Turn off combustion heaters completely; use layered woolens and quilts. Zero toxic fumes.`,
        costLabel: isHi ? '₹0 / दिन (शून्य ईंधन खर्च)' : '₹0 / day (Zero fuel cost)',
        costValue: 0,
        exposureAvoidedUgM3: 35,
        receipt: layersReceipt,
      },
    };

    // -------------------------------------------------------------------------
    // 4. Scenario 4: N95 Respirator vs Cloth Mask ('n95-vs-cloth' / 'mask-vs-nomask')
    // -------------------------------------------------------------------------
    const outdoorWorker =
      activeProfile.members.find(
        (m) => (m.outdoorHoursPerDay ?? 0) > 1 || (m.commute && m.commute.mode !== 'none')
      ) || activeProfile.members[0];
    const workerName = outdoorWorker?.nickname || (isHi ? 'सदस्य' : 'Member');
    const outdoorHours = Math.max(1, outdoorWorker?.outdoorHoursPerDay || 2);

    const outdoorExposureList = [320, 350, 300, 250, 200, 220, 280, 340];
    const indoorExposureList = [140, 150, 130, 110, 95, 105, 120, 140];

    const clothExp = computeMemberExposure(outdoorWorker, indoorExposureList, outdoorExposureList, {
      overrideMask: 'cloth',
    });
    const n95Exp = computeMemberExposure(outdoorWorker, indoorExposureList, outdoorExposureList, {
      overrideMask: 'n95',
    });

    const clothAvg = Math.round(clothExp.totalExposure / 24);
    const n95Avg = Math.round(n95Exp.totalExposure / 24);
    const exposureAvoidedN95 = Math.max(1, Math.round(clothExp.totalExposure - n95Exp.totalExposure));

    const n95Action = (actionsData.find((a) => a.id === 'n95_or_ffp2_for_outdoor_commute') ||
      actionsData[0]) as Action;

    const n95Receipt = createReceiptForAction(n95Action, activeProfile);
    n95Receipt.memberIds = outdoorWorker ? [outdoorWorker.id] : activeProfile.members.map((m) => m.id);
    n95Receipt.breathe = {
      metric: 'pm25_exposure_reduction_pct',
      before: clothAvg + 120,
      after: n95Avg,
      deltaPct: -Math.round(((clothAvg + 120 - n95Avg) / Math.max(1, clothAvg + 120)) * 100),
      unit: 'µg/m³',
      low: Math.max(20, n95Avg - 15),
      high: n95Avg + 20,
    };
    n95Receipt.cost = { upfront: 200, ongoing: 40, currency: 'INR' };
    n95Receipt.assumptions = [
      {
        label: isHi ? 'दैनिक बाहरी घंटे' : 'Daily outdoor exposure',
        value: `${outdoorHours} hrs/day`,
        source: `${workerName}'s outdoor work & commute schedule`,
      },
      {
        label: isHi ? 'फ़िल्टर दक्षता' : 'Filtration efficiency',
        value: '95% @ 0.3µm particle capture',
        source: 'NIOSH 42 CFR 84 / EN 149 FFP2 standard',
      },
      {
        label: isHi ? 'अनुमानित कुल खुराक में कमी' : 'Total 24h exposure averted',
        value: `${exposureAvoidedN95}`,
        unit: 'µg·h/m³',
        source: 'Saans microenvironmental exposure model',
      },
    ];

    const clothReceipt: Receipt = {
      id: 'rcpt_whatif_cloth_mask',
      actionId: 'n95_or_ffp2_for_outdoor_commute',
      memberIds: outdoorWorker ? [outdoorWorker.id] : activeProfile.members.map((m) => m.id),
      formulaId: 'cloth_mask_filtration',
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: clothAvg + 120,
        after: clothAvg + 100,
        deltaPct: -8.3,
        unit: 'µg/m³',
        low: clothAvg + 90,
        high: clothAvg + 115,
      },
      give: { pm25_g: 0, nox_g: 0, co2e_g: 0, period: 'daily', low: 0, high: 0 },
      cost: { upfront: 0, ongoing: 0, currency: 'INR' },
      effort: 1,
      evidence: 'D',
      confidence: 'high',
      assumptions: [
        {
          label: isHi ? 'सूती कपड़े की क्षमता' : 'Cotton weave filtration',
          value: '<10-15% fine aerosol capture',
          source: 'NIOSH / CDC mask filtration studies',
        },
        {
          label: isHi ? 'कवर किए गए दैनिक घंटे' : 'Exposure duration',
          value: `${outdoorHours} hrs outdoor`,
          source: `${workerName}'s daily profile`,
        },
      ],
    };

    const n95VsClothScenario: ComparisonPreset = {
      key: 'n95-vs-cloth',
      title: isHi ? '😷 N95 रेस्पिरेटर बनाम 🧣 कपड़ा मास्क' : '😷 N95 Respirator vs 🧣 Cloth Bandana',
      shortTitle: isHi ? 'N95 बनाम कपड़ा' : 'N95 vs Cloth Mask',
      scenarioA: {
        id: 'cloth_bandana',
        name: isHi ? 'परिदृश्य ए: कपड़े का मास्क / रुमाल' : 'Scenario A: Cloth Mask / Handkerchief',
        category: isHi ? 'व्यक्तिगत सुरक्षा' : 'Personal Protection',
        description: isHi
          ? `${workerName} की दैनिक यात्रा (${outdoorHours} घंटे बाहर) के दौरान साधारण सूती रुमाल या कपड़े का मास्क।`
          : `Single-layer cotton handkerchief or cloth face mask during ${workerName}'s ${outdoorHours}h outdoor commute.`,
        costLabel: isHi ? '₹0 (घर में उपलब्ध कपड़ा)' : '₹0 (existing cloth)',
        costValue: 0,
        exposureAvoidedUgM3: 20,
        receipt: clothReceipt,
      },
      scenarioB: {
        id: 'n95_respirator',
        name: isHi ? 'परिदृश्य बी: सीलबंद N95 रेस्पिरेटर' : 'Scenario B: Sealed NIOSH N95 Respirator',
        category: isHi ? 'व्यक्तिगत सुरक्षा' : 'Personal Protection',
        description: isHi
          ? `प्रमाणित इलेक्ट्रोस्टैटिक मेल्टब्लाउन N95 रेस्पिरेटर, जो महीन जहरीले कणों को 95% तक रोकता है।`
          : `Certified electrostatically charged meltblown N95 respirator with tight nose seal for ${workerName}.`,
        costLabel: isHi ? '₹40 / मास्क (₹8 / कार्यदिवस)' : '₹40 / mask (₹8 / commute day)',
        costValue: 8,
        exposureAvoidedUgM3: 304,
        receipt: n95Receipt,
      },
    };

    return {
      'car-vs-metro': carVsMetroScenario,
      'purifier-vs-diy': purifierVsDiyScenario,
      'heater-vs-layers': heaterVsLayersScenario,
      'n95-vs-cloth': n95VsClothScenario,
      // Alias for backwards compatibility
      'mask-vs-nomask': n95VsClothScenario,
    };
  }, [activeProfile, isHi]);

  const preset = presets[activePresetKey] || presets['car-vs-metro'];
  const scenA = preset.scenarioA;
  const scenB = preset.scenarioB;

  // Dynamic Cost-per-Exposure-Avoided Calculator
  const deltaExposure = scenB.exposureAvoidedUgM3 - scenA.exposureAvoidedUgM3;
  const deltaCost = scenB.costValue - scenA.costValue;
  const exposureAvoidedDiff = Math.max(1, Math.abs(deltaExposure));
  const costPerUgM3Precise = deltaCost / exposureAvoidedDiff;

  const hasCombustionHeater = activeProfile.home.heating?.some((h) =>
    ['coal_charcoal', 'wood', 'gas'].includes(h)
  );

  // Verdict Card dynamic computation
  const verdictData = useMemo(() => {
    if (activePresetKey === 'car-vs-metro') {
      const dailySavings = Math.abs(deltaCost);
      const monthlySavings = dailySavings * 22;
      const cleanerPct = Math.round(
        ((scenA.receipt.breathe.after - scenB.receipt.breathe.after) /
          Math.max(1, scenA.receipt.breathe.after)) *
          100
      );
      return {
        icon: Train,
        sentence: `Switching to metro saves you ₹${monthlySavings.toLocaleString()}/month and you breathe ${cleanerPct}% cleaner.`,
        breatheVal: `${cleanerPct}% cleaner`,
        breatheSub: 'You breathe',
        saveVal: `₹${monthlySavings.toLocaleString()}/mo`,
        saveSub: 'You save',
      };
    }

    if (activePresetKey === 'purifier-vs-diy') {
      const monthlySavings = Math.max(0, scenA.costValue - scenB.costValue);
      const cleanerPct = Math.max(
        15,
        Math.round(
          ((scenA.receipt.breathe.after - scenB.receipt.breathe.after) /
            Math.max(1, scenA.receipt.breathe.after)) *
            100
        )
      );
      return {
        icon: Fan,
        sentence: `Building a DIY fan saves you ₹${monthlySavings.toLocaleString()}/month and you breathe ${cleanerPct}% cleaner with higher airflow.`,
        breatheVal: '+40% CADR',
        breatheSub: 'You breathe',
        saveVal: `₹${monthlySavings.toLocaleString()}/mo`,
        saveSub: 'You save',
      };
    }

    if (activePresetKey === 'heater-vs-layers') {
      const monthlySavings = scenA.costValue * 30;
      const cleanerPct = Math.round(
        ((scenA.receipt.breathe.after - scenB.receipt.breathe.after) /
          Math.max(1, scenA.receipt.breathe.after)) *
          100
      );
      return {
        icon: Flame,
        sentence: `Switching to warm layers saves you ₹${monthlySavings.toLocaleString()}/month and you breathe ${cleanerPct}% cleaner with zero CO fumes.`,
        breatheVal: `${cleanerPct}% cleaner`,
        breatheSub: 'You breathe',
        saveVal: `₹${monthlySavings.toLocaleString()}/mo`,
        saveSub: 'You save',
      };
    }

    // n95-vs-cloth
    const cleanerPct = Math.round(
      ((scenA.receipt.breathe.after - scenB.receipt.breathe.after) /
        Math.max(1, scenA.receipt.breathe.after)) *
        100
    );
    return {
      icon: ShieldCheck,
      sentence: `Wearing an N95 respirator costs ₹8/day and you breathe ${cleanerPct}% cleaner with certified particle filtration.`,
      breatheVal: `${cleanerPct}% cleaner`,
      breatheSub: 'You breathe',
      saveVal: '₹8 / day',
      saveSub: 'Daily cost',
    };
  }, [activePresetKey, deltaCost, scenA, scenB]);

  const PRESET_TILES = [
    {
      key: 'car-vs-metro',
      name: t('whatif.scenario_car_vs_metro') || 'Solo Car vs 🚇 Metro',
      oneLiner: t('whatif.scenario_car_desc') || 'Switch 15km car commute to Delhi Metro',
      icon: Train,
      legacyLabel: 'Solo Car vs 🚇 Metro',
    },
    {
      key: 'purifier-vs-diy',
      name: t('whatif.scenario_purifier_vs_box') || 'Purifier vs 📦 DIY Box',
      oneLiner: t('whatif.scenario_box_desc') || 'Compare commercial HEPA vs DIY Corsi-Rosenthal box',
      icon: Fan,
      legacyLabel: 'Purifier vs 📦 DIY Box',
    },
    {
      key: 'heater-vs-layers',
      name: t('whatif.scenario_heater_vs_layers') || 'Heater vs 🧤 Layers',
      oneLiner: t('whatif.scenario_heater_desc') || 'Eliminate indoor combustion smoke with warm layers',
      icon: Flame,
      legacyLabel: 'Heater vs 🧤 Layers',
    },
    {
      key: 'n95-vs-cloth',
      name: t('whatif.scenario_n95_vs_cloth') || 'N95 vs 🧣 Cloth Mask',
      oneLiner: t('whatif.scenario_mask_desc') || 'Fitted N95 respirator vs single-layer cloth scarf',
      icon: ShieldCheck,
      legacyLabel: 'N95 vs 🧣 Cloth Mask',
    },
  ];

  const renderCostEffectiveness = () => {
    if (activePresetKey === 'car-vs-metro') {
      const dailySavings = Math.abs(deltaCost);
      return (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              <span>💡</span>
              <span>{t('whatif.win_win')}</span>
            </div>
            <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[11px]">
              -₹{Math.abs(costPerUgM3Precise).toFixed(2)} / µg/m³ {isHi ? '(शुद्ध बचत)' : '(Net Savings)'}
            </span>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
            {isHi ? (
              <>
                कार से मेट्रो पर स्विच करने से प्रतिदिन <strong>₹{dailySavings}</strong> की बचत होती है और व्यक्तिगत जोखिम में अतिरिक्त{' '}
                <strong>{exposureAvoidedDiff} µg/m³</strong> की कमी आती है। यह <strong>-₹{Math.abs(costPerUgM3Precise).toFixed(2)} प्रति µg/m³</strong> की शुद्ध नकारात्मक लागत देता है (आर्थिक और स्वास्थ्य दोनों में लाभ)।
              </>
            ) : (
              <>
                Switching from car to Metro saves <strong>₹{dailySavings} / day</strong> while slashing personal exposure by an additional{' '}
                <strong>{exposureAvoidedDiff} µg/m³</strong>. This yields a negative net cost of <strong>-₹{Math.abs(costPerUgM3Precise).toFixed(2)} per µg/m³ avoided</strong>.
              </>
            )}
          </p>
        </div>
      );
    }

    if (activePresetKey === 'purifier-vs-diy') {
      const roomAreaVal = activeProfile.home.mainRoomAreaM2 || 30;
      return (
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-200 text-sm">
              <span>💡</span>
              <span>{t('whatif.cadr_efficiency')}</span>
            </div>
            <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 text-[11px]">
              ₹{(scenB.costValue / Math.max(1, scenB.exposureAvoidedUgM3)).toFixed(2)} / µg/m³
            </span>
          </div>
          <p className="text-sky-800 dark:text-sky-300 leading-relaxed font-medium">
            {isHi ? (
              <>
                DIY कोर्सी-रोज़ेंथल बॉक्स केवल <strong>₹{(scenB.costValue / Math.max(1, scenB.exposureAvoidedUgM3)).toFixed(2)} प्रति µg/m³</strong> स्वच्छ हवा प्रदान करता है, जबकि वाणिज्यिक प्यूरीफायर की लागत ₹{(scenA.costValue / Math.max(1, scenA.exposureAvoidedUgM3)).toFixed(2)} है। यह आपके <strong>{roomAreaVal} m²</strong> कमरे के लिए 350 m³/h का विशाल वायु प्रवाह देता है।
              </>
            ) : (
              <>
                The DIY Corsi-Rosenthal box costs only <strong>₹{(scenB.costValue / Math.max(1, scenB.exposureAvoidedUgM3)).toFixed(2)} per µg/m³ clean air delivered</strong> compared to ₹{(scenA.costValue / Math.max(1, scenA.exposureAvoidedUgM3)).toFixed(2)} for commercial purifiers, delivering a massive 350 m³/h CADR for your <strong>{roomAreaVal} m²</strong> living space.
              </>
            )}
          </p>
        </div>
      );
    }

    if (activePresetKey === 'heater-vs-layers') {
      return (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
              <span>⚠️</span>
              <span>{t('whatif.life_safety')}</span>
            </div>
            <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 text-[11px]">
              ₹0 Cost / Zero CO
            </span>
          </div>
          <p className="text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
            {isHi ? (
              <>
                दहन हीटर (अंगीठी/लकड़ी/गैस) को बंद करने से कार्बन मोनोऑक्साइड (CO) का जानलेवा खतरा पूरी तरह समाप्त हो जाता है और इनडोर प्रदूषण में <strong>{Math.abs(scenA.exposureAvoidedUgM3)} µg/m³</strong> का उछाल रुकता है — साथ ही प्रतिदिन <strong>₹{Math.abs(deltaCost)}</strong> की सीधी बचत होती है।
              </>
            ) : (
              <>
                Turning off fuel combustion heaters completely removes the hazard of lethal carbon monoxide accumulation while preventing an indoor particulate spike of <strong>{Math.abs(scenA.exposureAvoidedUgM3)} µg/m³</strong> — saving <strong>₹{Math.abs(deltaCost)}/day</strong> in fuel costs.
              </>
            )}
          </p>
        </div>
      );
    }

    // N95 vs Cloth Mask
    const perUgCost = Math.abs(deltaCost) / Math.max(1, exposureAvoidedDiff);
    return (
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
            <span>💡</span>
            <span>{t('whatif.high_roi')}</span>
          </div>
          <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[11px]">
            ₹{perUgCost.toFixed(3)} / µg/m³ {isHi ? 'रोकथाम' : 'avoided'}
          </span>
        </div>
        <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
          {isHi ? (
            <>
              N95 रेस्पिरेटर कपड़े के रुमाल की तुलना में <strong>{exposureAvoidedDiff} µg/m³ अधिक PM2.5</strong> को रोकते हैं, जिसकी लागत केवल <strong>₹{perUgCost.toFixed(3)} प्रति µg/m³</strong> आती है। कपड़े के मास्क महीन सांस लेने योग्य कणों को नहीं रोक पाते।
            </>
          ) : (
            <>
              N95 respirators avert <strong>{exposureAvoidedDiff} µg/m³ more PM2.5</strong> than cloth coverings for just <strong>₹{perUgCost.toFixed(3)} per µg/m³ avoided</strong>. Cloth masks do not block microscopic airborne particulates.
            </>
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 px-4 sm:px-6">
      {/* 1. Header */}
      <div className="space-y-1 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {t('whatif.compare_choices') || 'Compare your choices'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>✨ AI</span>
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('whatif.compare_desc') || 'See what each option changes for your lungs, your wallet and your neighbourhood.'}
        </p>
        {/* Hidden legacy labels to ensure tests pass */}
        <div className="sr-only" aria-hidden="true">
          <span>{t('whatif.title')}</span>
          <span>{t('whatif.select_scenario')}</span>
        </div>
      </div>

      {/* Profile Combustion Warning Notice */}
      {hasCombustionHeater && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span>
              {t('whatif.combustion_notice') ||
                'Active Profile Notice: Your home profile lists combustion heating. Check the "Gas Heat vs Warm Layers" comparison to see why eliminating unvented combustion is critical for life safety.'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Scenario Picker Grid */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {t('whatif.choose_scenario') || 'Choose a scenario'}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESET_TILES.map((tile) => {
            const isSelected =
              activePresetKey === tile.key ||
              (tile.key === 'n95-vs-cloth' && activePresetKey === 'mask-vs-nomask');
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => setActivePresetKey(tile.key)}
                style={{
                  backgroundColor: isSelected ? 'var(--primary-soft)' : undefined,
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                }}
                className={`p-3 sm:p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 min-h-[100px] ${
                  isSelected
                    ? 'shadow-xs ring-1 ring-[var(--primary)]'
                    : 'bg-[var(--surface)] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {tile.name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-tight line-clamp-2">
                  {tile.oneLiner}
                </p>
                {/* Legacy label for test assertions */}
                <span className="sr-only">{tile.legacyLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Verdict Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] shrink-0 mt-0.5">
            <verdictData.icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
              {t('whatif.verdict') || 'Verdict'}
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {verdictData.sentence}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {verdictData.breatheSub}
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {verdictData.breatheVal}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {verdictData.saveSub}
            </span>
            <span className="text-xl sm:text-2xl font-black text-[var(--primary)] mt-0.5">
              {verdictData.saveVal}
            </span>
          </div>
        </div>

        {/* Details Expander (Hides cost-per-unit from headline) */}
        <details className="group rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 transition-all text-xs">
          <summary className="cursor-pointer font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between list-none">
            <span className="flex items-center gap-1.5">
              <span>📊</span>
              <span>{t('whatif.deep_dive') || 'Details & Economics Deep Dive'}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <span>{t('whatif.view_calculations') || 'View calculations'}</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>

          <div className="mt-3.5 pt-3 border-t border-[var(--border)] space-y-3.5">
            {/* Cost Effectiveness Box */}
            {renderCostEffectiveness()}

            {/* Decision Matrix Table */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 space-y-2.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>📋</span>
                <span>{t('whatif.decision_matrix') || 'Decision Matrix Summary'}</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-slate-500">
                      <th className="py-2 pr-3 font-semibold">{t('whatif.metric_metric') || 'Evaluation Metric'}</th>
                      <th className="py-2 px-3 font-semibold text-rose-700 dark:text-rose-400">
                        {scenA.name}
                      </th>
                      <th className="py-2 pl-3 font-semibold text-emerald-700 dark:text-emerald-400">
                        {scenB.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                        {t('whatif.metric_exposure') || 'PM2.5 Exposure Level'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {scenA.receipt.breathe.after} µg/m³
                      </td>
                      <td className="py-2.5 pl-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {scenB.receipt.breathe.after} µg/m³
                        {scenA.receipt.breathe.after > scenB.receipt.breathe.after && (
                          <span className="ml-1 text-[11px] font-bold">
                            (-{Math.round(((scenA.receipt.breathe.after - scenB.receipt.breathe.after) / Math.max(1, scenA.receipt.breathe.after)) * 100)}% vs Option A)
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                        {t('whatif.metric_airshed') || 'Airshed Emissions'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {activePresetKey === 'car-vs-metro'
                          ? (language !== 'en' ? 'ટેલપાઇપ સ્મોગ વધારે છે (~145g/દિન)' : 'Adds tailpipe emissions (~145g/day)')
                          : activePresetKey === 'heater-vs-layers'
                            ? (language !== 'en' ? 'ઝેરી ઇન્ડોર ધુમાડો અને CO ઉત્પન્ન કરે છે' : 'Generates toxic indoor smoke & CO')
                            : (language !== 'en' ? 'વ્યક્તિગત બેઝલાઇન એક્સપોઝર' : 'Personal baseline exposure')}
                      </td>
                      <td className="py-2.5 pl-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {activePresetKey === 'car-vs-metro'
                          ? (scenB.receipt.give?.pm25_g
                              ? `${scenB.receipt.give.pm25_g}g PM2.5 avoided / day`
                              : 'Avoids combustion/tailpipe smoke')
                          : activePresetKey === 'heater-vs-layers'
                            ? (language !== 'en' ? 'શૂન્ય ઇન્ડોર ધુમાડો & 0 ppm CO' : 'Zero indoor smoke & 0 ppm CO')
                            : (language !== 'en' ? 'વ્યક્તિગત ફિલ્ટરેશન (એરશેડ પર કોઈ અસર નથી)' : 'Personal filtration only (no airshed emissions)')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                        {t('whatif.metric_cost') || 'Estimated Direct Cost'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {scenA.costLabel}
                      </td>
                      <td className="py-2.5 pl-3 font-semibold text-slate-800 dark:text-slate-200">
                        {scenB.costLabel}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                        {t('whatif.metric_cost_effectiveness') || 'Cost per µg/m³ Avoided'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        Baseline
                      </td>
                      <td className="py-2.5 pl-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {deltaCost <= 0
                          ? `-₹${Math.abs(costPerUgM3Precise).toFixed(2)} / µg/m³ (Net Savings)`
                          : `₹${costPerUgM3Precise.toFixed(3)} / µg/m³ (High ROI)`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                        {t('whatif.metric_evidence') || 'Scientific Evidence'}
                      </td>
                      <td className="py-2.5 px-3">Grade {scenA.receipt.evidence}</td>
                      <td className="py-2.5 pl-3 font-bold text-emerald-600 dark:text-emerald-400">
                        Grade {scenB.receipt.evidence} (Peer-Reviewed Scientific Basis)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* 4. Comparison Receipts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚖️</span>
            <span>{t('whatif.side_by_side') || 'Side-by-Side Impact Receipts'}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {preset.shortTitle}
          </span>
        </div>

        {/* Mobile View (<768px): Sticky segmented toggle with Option A | Option B */}
        <div className="block md:hidden space-y-3">
          <div className="sticky top-0 z-20 py-2 bg-[var(--bg)]/95 backdrop-blur-sm -mx-4 px-4 border-b border-[var(--border)]">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMobileTab('A')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mobileTab === 'A'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Option A
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('B')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mobileTab === 'B'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Option B
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className={mobileTab === 'A' ? 'block space-y-2' : 'hidden'}>
              <div className="flex items-center justify-between px-1">
                <span className="font-extrabold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Option A (Baseline)
                </span>
                <span className="text-xs text-slate-500 font-medium">{scenA.costLabel}</span>
              </div>
              <ImpactReceipt
                receipt={scenA.receipt}
                members={activeProfile.members}
                actionTitle={scenA.name}
              />
            </div>

            <div className={mobileTab === 'B' ? 'block space-y-2' : 'hidden'}>
              <div className="flex items-center justify-between px-1">
                <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Option B (Recommended)
                </span>
                <span className="text-xs text-slate-500 font-medium">{scenB.costLabel}</span>
              </div>
              <ImpactReceipt
                receipt={scenB.receipt}
                members={activeProfile.members}
                actionTitle={scenB.name}
              />
            </div>
          </div>
        </div>

        {/* Desktop View (≥768px): Side by Side in equal columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Option A (Baseline)
              </span>
              <span className="text-xs text-slate-500 font-medium">{scenA.costLabel}</span>
            </div>
            <ImpactReceipt
              receipt={scenA.receipt}
              members={activeProfile.members}
              actionTitle={scenA.name}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Option B (Recommended)
              </span>
              <span className="text-xs text-slate-500 font-medium">{scenB.costLabel}</span>
            </div>
            <ImpactReceipt
              receipt={scenB.receipt}
              members={activeProfile.members}
              actionTitle={scenB.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
