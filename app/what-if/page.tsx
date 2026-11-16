'use client';

import React, { useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { Receipt } from '@/lib/schemas';

interface ScenarioDef {
  id: string;
  name: string;
  category: string;
  description: string;
  costLabel: string;
  costValue: number; // monthly or daily cost in INR
  exposureAvoidedUgM3: number;
  receipt: Receipt;
}

const PRESET_SCENARIOS: Record<string, { title: string; scenarioA: ScenarioDef; scenarioB: ScenarioDef }> = {
  'car-vs-metro': {
    title: '🚗 Solo Car vs 🚇 Metro Transit',
    scenarioA: {
      id: 'solo_car',
      name: 'Scenario A: Drive Solo Car',
      category: 'Commute',
      description: '15 km daily city commute driving a petrol sedan with AC on recirculate.',
      costLabel: '₹250 / day (fuel + toll + parking)',
      costValue: 250,
      exposureAvoidedUgM3: 60,
      receipt: {
        id: 'rcpt_whatif_car',
        actionId: 'drive_solo_car',
        memberIds: ['m1'],
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
        give: {
          pm25_g: 0,
          co2e_g: 0,
          period: 'daily',
        },
        cost: { upfront: 0, ongoing: 250, currency: 'INR' },
        effort: 2,
        evidence: 'B',
        confidence: 'high',
        assumptions: [
          { label: 'Cabin filter rating', value: 'Standard cabin mesh', source: 'OEM cabin air filter' },
          { label: 'Tailpipe emissions generated', value: '145g PM2.5 / day', source: 'ARAI vehicle factor' },
        ],
      },
    },
    scenarioB: {
      id: 'metro_transit',
      name: 'Scenario B: Delhi Metro Transit',
      category: 'Commute',
      description: '15 km daily commute on high-speed underground Metro rail with station filtration.',
      costLabel: '₹50 / day (Metro Smart Card)',
      costValue: 50,
      exposureAvoidedUgM3: 125,
      receipt: {
        id: 'rcpt_whatif_metro',
        actionId: 'metro_transit_shift',
        memberIds: ['m1'],
        formulaId: 'metro_transit_filtration',
        breathe: {
          metric: 'pm25_exposure_reduction_pct',
          before: 180,
          after: 55,
          deltaPct: -69.4,
          unit: 'µg/m³',
          low: 45,
          high: 70,
        },
        give: {
          pm25_g: 145,
          co2e_g: 2200,
          period: 'daily',
        },
        cost: { upfront: 0, ongoing: 50, currency: 'INR' },
        effort: 3,
        evidence: 'A',
        confidence: 'high',
        assumptions: [
          { label: 'Underground air filtration', value: 'MERV-13 central HVAC', source: 'DMRC station standard' },
          { label: 'Urban tailpipe PM avoided', value: '145g / day', source: 'CPCB emission inventory' },
          { label: 'Greenhouse gas avoided', value: '2.2 kg CO₂e / day', source: 'EEA transit factors' },
        ],
      },
    },
  },

  'purifier-vs-diy': {
    title: '🏢 Commercial Purifier vs 📦 DIY Box Fan',
    scenarioA: {
      id: 'commercial_hepa',
      name: 'Scenario A: Commercial HEPA Purifier',
      category: 'Purification',
      description: 'Brand-name HEPA air purifier with 250 m³/h clean air delivery rate.',
      costLabel: '₹8,500 upfront + ₹1,500/yr filter',
      costValue: 275, // amortized monthly
      exposureAvoidedUgM3: 278,
      receipt: {
        id: 'rcpt_whatif_commercial_purifier',
        actionId: 'commercial_hepa_purifier',
        memberIds: ['m1', 'm2', 'm3', 'm4'],
        formulaId: 'hepa_purification',
        breathe: {
          metric: 'pm25_exposure_reduction_pct',
          before: 320,
          after: 42,
          deltaPct: -86.8,
          unit: 'µg/m³',
          low: 35,
          high: 55,
        },
        give: {
          pm25_g: 0,
          co2e_g: 0,
          period: 'daily',
        },
        cost: { upfront: 8500, ongoing: 125, currency: 'INR' },
        effort: 1,
        evidence: 'A',
        confidence: 'high',
        assumptions: [
          { label: 'Clean Air Delivery Rate', value: '250', unit: 'm³/h', source: 'AHAM certified specification' },
          { label: 'HEPA single-pass efficiency', value: '99.97', unit: '%', source: 'EN 1822 standard' },
        ],
      },
    },
    scenarioB: {
      id: 'diy_corsi_box',
      name: 'Scenario B: DIY Box Fan (Corsi-Rosenthal)',
      category: 'Purification',
      description: 'Standard residential box fan sealed with 4 MERV-13 furnace filter panels.',
      costLabel: '₹2,200 upfront + ₹800/yr filters',
      costValue: 120, // amortized monthly
      exposureAvoidedUgM3: 292,
      receipt: {
        id: 'rcpt_whatif_diy_purifier',
        actionId: 'diy_corsi_rosenthal_box',
        memberIds: ['m1', 'm2', 'm3', 'm4'],
        formulaId: 'diy_box_fan_purification',
        breathe: {
          metric: 'pm25_exposure_reduction_pct',
          before: 320,
          after: 28,
          deltaPct: -91.2,
          unit: 'µg/m³',
          low: 20,
          high: 38,
        },
        give: {
          pm25_g: 0,
          co2e_g: 0,
          period: 'daily',
        },
        cost: { upfront: 2200, ongoing: 65, currency: 'INR' },
        effort: 3,
        evidence: 'B',
        confidence: 'high',
        assumptions: [
          { label: 'Effective CADR', value: '420', unit: 'm³/h', source: 'UC Davis / EPA Corsi-Rosenthal bench study' },
          { label: 'Electrical safety', value: 'Fused motor fan', source: 'Underwriters Laboratories UL 507' },
        ],
      },
    },
  },

  'heater-vs-layers': {
    title: '🔥 Unvented Heater vs 🧤 Thermal Layers',
    scenarioA: {
      id: 'gas_heater',
      name: 'Scenario A: Run Fuel Flame Heater',
      category: 'Indoor Sources',
      description: 'Burning unvented gas or charcoal angithi indoors during chilly winter nights.',
      costLabel: '₹80 / day fuel cost',
      costValue: 80,
      exposureAvoidedUgM3: -190, // worsens exposure!
      receipt: {
        id: 'rcpt_whatif_gas_heater',
        actionId: 'unvented_flame_heater',
        memberIds: ['m1', 'm2', 'm3', 'm4'],
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
        give: {
          pm25_g: 0,
          period: 'daily',
        },
        cost: { upfront: 0, ongoing: 80, currency: 'INR' },
        effort: 1,
        evidence: 'D',
        confidence: 'high',
        assumptions: [
          { label: 'Unvented combustion emission', value: 'High PM2.5 + lethal CO risk', source: 'WHO Household Air Pollution' },
        ],
      },
    },
    scenarioB: {
      id: 'thermal_layers',
      name: 'Scenario B: Blankets & Thermal Layers',
      category: 'Indoor Sources',
      description: 'Turn off combustion heaters completely; use layered woolens and quilts.',
      costLabel: '₹0 / day (Zero fuel cost)',
      costValue: 0,
      exposureAvoidedUgM3: 35,
      receipt: {
        id: 'rcpt_whatif_thermal_layers',
        actionId: 'blankets_and_thermal_layers',
        memberIds: ['m1', 'm2', 'm3', 'm4'],
        formulaId: 'zero_combustion_indoor',
        breathe: {
          metric: 'pm25_exposure_reduction_pct',
          before: 120,
          after: 85,
          deltaPct: -29.2,
          unit: 'µg/m³',
          low: 70,
          high: 95,
        },
        give: {
          pm25_g: 0,
          period: 'daily',
        },
        cost: { upfront: 0, ongoing: 0, currency: 'INR' },
        effort: 1,
        evidence: 'A',
        confidence: 'high',
        assumptions: [
          { label: 'Zero carbon monoxide', value: '0 ppm CO', source: 'Elimination of combustion source' },
        ],
      },
    },
  },

  'mask-vs-nomask': {
    title: '😷 N95 Respirator vs 🧣 Cloth Bandana',
    scenarioA: {
      id: 'cloth_bandana',
      name: 'Scenario A: Cloth Mask / Handkerchief',
      category: 'Personal Protection',
      description: 'Single-layer cotton handkerchief or cloth face mask during two-wheeler commute.',
      costLabel: '₹0 (existing cloth)',
      costValue: 0,
      exposureAvoidedUgM3: 20,
      receipt: {
        id: 'rcpt_whatif_cloth_mask',
        actionId: 'cloth_mask_commute',
        memberIds: ['m1'],
        formulaId: 'cloth_mask_filtration',
        breathe: {
          metric: 'pm25_exposure_reduction_pct',
          before: 380,
          after: 360,
          deltaPct: -5.3,
          unit: 'µg/m³',
          low: 350,
          high: 375,
        },
        give: { pm25_g: 0, period: 'daily' },
        cost: { upfront: 0, ongoing: 0, currency: 'INR' },
        effort: 1,
        evidence: 'D',
        confidence: 'high',
        assumptions: [
          { label: 'Cotton weave particle capture', value: '<10%', source: 'NIOSH / CDC mask filtration studies' },
        ],
      },
    },
    scenarioB: {
      id: 'n95_respirator',
      name: 'Scenario B: Sealed NIOSH N95 Respirator',
      category: 'Personal Protection',
      description: 'Certified electrostatically charged meltblown N95 respirator with tight nose seal.',
      costLabel: '₹40 / mask (₹8 / commute day)',
      costValue: 8,
      exposureAvoidedUgM3: 304,
      receipt: {
        id: 'rcpt_whatif_n95_respirator',
        actionId: 'n95_during_motorcycle_auto_commute',
        memberIds: ['m1'],
        formulaId: 'n95_commute_filtration',
        breathe: {
          metric: 'pm25_exposure_reduction_pct',
          before: 380,
          after: 76,
          deltaPct: -80.0,
          unit: 'µg/m³',
          low: 65,
          high: 95,
        },
        give: { pm25_g: 0, period: 'daily' },
        cost: { upfront: 200, ongoing: 40, currency: 'INR' },
        effort: 2,
        evidence: 'A',
        confidence: 'high',
        assumptions: [
          { label: 'Filter media rating', value: '95% @ 0.3µm', source: 'NIOSH 42 CFR 84 certification' },
          { label: 'Real-world fit-factor adjustment', value: '80% effective', source: 'Occupational hygiene chamber testing' },
        ],
      },
    },
  },
};

export default function WhatIfPage() {
  const { profile } = useProfile();
  const [activePresetKey, setActivePresetKey] = useState<string>('car-vs-metro');

  const preset = PRESET_SCENARIOS[activePresetKey] || PRESET_SCENARIOS['car-vs-metro'];
  const scenA = preset.scenarioA;
  const scenB = preset.scenarioB;

  // Cost per µg/m³ avoided calculation
  const deltaExposure = scenB.exposureAvoidedUgM3 - scenA.exposureAvoidedUgM3;
  const deltaCost = scenB.costValue - scenA.costValue;

  const renderCostEffectiveness = () => {
    if (activePresetKey === 'car-vs-metro') {
      return (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
            <span>💡</span>
            <span>Exceptional Economic & Air Health Win-Win</span>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
            Switching from car to Metro saves <strong>₹200 / day</strong> while slashing personal exposure by an additional <strong>65 µg/m³</strong>. This yields a negative net cost of <strong>-₹3.07 per µg/m³ avoided</strong>.
          </p>
        </div>
      );
    }

    if (activePresetKey === 'purifier-vs-diy') {
      return (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-200 text-sm">
            <span>💡</span>
            <span>4× Higher CADR per Rupee Spent</span>
          </div>
          <p className="text-sky-800 dark:text-sky-300 leading-relaxed font-medium">
            The DIY Corsi-Rosenthal box costs only <strong>₹0.41 per µg/m³ clean air delivered</strong> compared to ₹0.99 for commercial purifiers, delivering a massive 420 m³/h clean air volume for larger living rooms.
          </p>
        </div>
      );
    }

    if (activePresetKey === 'heater-vs-layers') {
      return (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200 text-sm">
            <span>⚠️</span>
            <span>Life-Safety Elimination: Zero CO Risk</span>
          </div>
          <p className="text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
            Turning off fuel combustion heaters completely removes the hazard of lethal carbon monoxide accumulation while preventing an indoor particulate spike of 190 µg/m³ — at zero monetary cost.
          </p>
        </div>
      );
    }

    // Mask vs No Mask
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1 text-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
          <span>💡</span>
          <span>Highest ROI Personal Protection Intervention</span>
        </div>
        <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
          N95 respirators avert <strong>284 µg/m³ more PM2.5</strong> than cloth coverings for just <strong>₹0.026 per µg/m³ avoided</strong>. Cloth masks do not block microscopic airborne particulates.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14">
      {/* 1. Header */}
      <div className="space-y-1 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Scenario Simulator & Tradeoff Sandbox
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Compare realistic lifestyle choices side-by-side. Evaluate exposure averted, emissions prevented, and cost-effectiveness.
        </p>
      </div>

      {/* 2. Preset Selector Pills */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Select Comparison Scenario
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(PRESET_SCENARIOS).map(([key, item]) => {
            const isSelected = activePresetKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActivePresetKey(key)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left border min-h-[44px] flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cost per µg/m³ Avoided Insight Box */}
      {renderCostEffectiveness()}

      {/* 4. Side-by-Side ImpactReceipt Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚖️</span>
            <span>Side-by-Side Impact Receipts</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {preset.title}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scenario A Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Baseline / Alternative A
              </span>
              <span className="text-xs text-slate-500">
                Cost: {scenA.costLabel}
              </span>
            </div>
            <ImpactReceipt
              receipt={scenA.receipt}
              members={profile?.members}
              actionTitle={scenA.name}
            />
          </div>

          {/* Scenario B Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Recommended / Intervention B
              </span>
              <span className="text-xs text-slate-500">
                Cost: {scenB.costLabel}
              </span>
            </div>
            <ImpactReceipt
              receipt={scenB.receipt}
              members={profile?.members}
              actionTitle={scenB.name}
            />
          </div>
        </div>
      </div>

      {/* 5. Summary Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3 shadow-xs text-xs">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
          <span>📊</span>
          <span>Decision Matrix Summary</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-3 font-semibold">Evaluation Metric</th>
                <th className="py-2 px-3 font-semibold text-rose-700 dark:text-rose-400">
                  {scenA.name}
                </th>
                <th className="py-2 pl-3 font-semibold text-emerald-700 dark:text-emerald-400">
                  {scenB.name}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                  PM2.5 Exposure Level
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                  {scenA.receipt.breathe.after} µg/m³
                </td>
                <td className="py-2.5 pl-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                  {scenB.receipt.breathe.after} µg/m³ ({scenB.receipt.breathe.deltaPct}%)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                  Airshed Emissions
                </td>
                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                  Adds urban pollution
                </td>
                <td className="py-2.5 pl-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  Avoids tailpipe/indoor combustion
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-slate-600 dark:text-slate-400">
                  Estimated Direct Cost
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
                  Scientific Evidence
                </td>
                <td className="py-2.5 px-3">Grade {scenA.receipt.evidence}</td>
                <td className="py-2.5 pl-3 font-bold text-emerald-600 dark:text-emerald-400">
                  Grade {scenB.receipt.evidence} (Peer-Reviewed)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
