'use client';

import React, { useState, useEffect } from 'react';
import { communityStore, PooledTotals, ActionKit } from '@/lib/store/communityStore';
import { ActionKitCard } from './ActionKitCard';
import { HotspotReport } from './HotspotReport';
import { NeighbourCheck } from './NeighbourCheck';
import { useProfile } from '@/lib/store/ProfileProvider';
import { useTranslation } from '@/lib/i18n';
import { WhatsAppSummary } from '@/components/common/WhatsAppSummary';
import {
  Users,
  Wind,
  TreePine,
  Activity,
  AlertCircle,
  Edit2,
  Check,
  X,
  Sparkles,
  BarChart2,
  FolderKanban,
  MapPin,
  Heart,
} from 'lucide-react';

const STUBBLE_KIT: ActionKit = {
  id: 'kit_stubble_burning',
  issue: 'stubble_burning' as any,
  issueLabel: 'Stubble Burning Nearby',
  title: 'Seasonal Crop Residue & Smog Protection Protocol',
  description:
    'Transboundary agricultural stubble burning releases massive particulate plumes across the airshed. Coordinated window sealing and bedroom air filtration prevents acute respiratory emergencies.',
  practicalAlternatives: [
    'Tape weather-stripping or damp cloth rolls along window sills and balcony thresholds.',
    'Run bedroom air purifiers in sealed rooms 45 minutes before sleep.',
    'Distribute N95 masks to domestic staff and facility teams for commute hours.',
  ],
  whatChangesStats:
    'Sealing door gaps reduces indoor PM2.5 infiltration by 40–55% during extreme episodic farm-fire inversions.',
  buildingNotice: `RWA ADVISORY: TRANSBOUNDARY SMOG & STUBBLE SMOKE EPISODE

Dear Residents,

Regional air quality monitors report intense stubble burning activity with north-westerly winds pushing AQI past 400. 

Recommended Indoor Defenses:
1. Keep all balcony doors and windows tightly closed throughout the night.
2. Restrict early morning outdoor fitness activities; avoid jogging before 10 AM.
3. Keep residential tower corridor windows shut to prevent chimney-effect smoke drafts.

— Resident Welfare Association (RWA) Health Advisory Cell`,
  whatsAppMessage: `🌾 *Air Alert: Transboundary Stubble Smoke Inflow* 🌾

Dear Neighbours,
Severe stubble smoke is impacting our airshed today.

🛡️ *Quick Protection Guide:*
• Keep balcony doors and windows sealed
• Run bedroom purifiers on high
• Vulnerable seniors and young children should stay indoors
• Use N95 masks when stepping outside

Stay safe and breathe easy! 💨🏠`,
};

export function CommunityDashboard() {
  const { profile } = useProfile();
  const { t } = useTranslation();

  const [communityCode, setCommunityCode] = useState<string>(
    profile?.communityCode || 'DELHI-GREEN-01'
  );
  const [inputCode, setInputCode] = useState<string>('');
  const [isChangingCode, setIsChangingCode] = useState(false);
  const [pooledData, setPooledData] = useState<PooledTotals | null>(null);
  const [actionKits, setActionKits] = useState<ActionKit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string>('kit_stubble_burning');
  const [activeTab, setActiveTab] = useState<'impact' | 'kits' | 'report' | 'care'>('impact');

  // Load pooled totals and action kits
  useEffect(() => {
    async function loadData() {
      const data = await communityStore.getPooledTotals(communityCode);
      const kits = await communityStore.getActionKits(communityCode);
      // Ensure stubble burning kit is available in the list
      const combined = kits.some((k) => k.id === 'kit_stubble_burning')
        ? kits
        : [STUBBLE_KIT, ...kits];

      setPooledData(data);
      setActionKits(combined);
      if (!selectedKitId && combined.length > 0) {
        setSelectedKitId(combined[0].id);
      }
    }
    loadData();
  }, [communityCode]);

  const isDemo =
    !profile?.communityCode ||
    communityCode === 'DELHI-GREEN-01' ||
    communityCode === 'NOIDA-SECTOR-62';

  const [codeError, setCodeError] = useState<string | null>(null);

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
    if (!clean || clean.length < 3) {
      setCodeError('Code must be 3–20 alphanumeric characters (e.g. NOIDA-SEC-62).');
      return;
    }
    setCodeError(null);
    await communityStore.joinCommunity(clean);
    setCommunityCode(clean);
    setIsChangingCode(false);
    setInputCode('');
    const refreshed = await communityStore.getPooledTotals(clean);
    setPooledData(refreshed);
  };

  const selectedKit =
    actionKits.find((k) => k.id === selectedKitId) || actionKits[0] || STUBBLE_KIT;

  const weeklyAvoidedKg = ((pooledData?.weeklyPm25AvoidedGrams ?? 3420) / 1000).toFixed(1);
  const treesEquivalent = Math.round((pooledData?.weeklyPm25AvoidedGrams ?? 3420) / 140);

  return (
    <div className="space-y-6">
      {/* 1. Page Title & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text)]">
            {t('community.our_air') || "Our neighbourhood's air"}
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {t('community.our_air_sub') || 'Shared community impact, advocacy toolkits, and neighbour care'}
          </p>
        </div>
        <WhatsAppSummary />
      </div>

      {/* 2. Page Header: Society name + join code chip + Demo data chip */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-[var(--text)]">
                {pooledData?.communityName || 'Sector 15 RWA'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-[var(--surface-2)] text-[var(--primary)] border border-[var(--border)]">
                {t('community.code_prefix') || 'Code:'} {communityCode}
              </span>
            </div>

            {/* Honest Demo Data Chip */}
            {isDemo && (
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>{t('community.demo_data_chip') || 'Demo data — join to see real figures'}</span>
                </span>
              </div>
            )}
          </div>

          {!isChangingCode ? (
            <button
              type="button"
              onClick={() => setIsChangingCode(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>{t('community.change_code') || 'Change society / code'}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-1 self-start sm:self-auto">
              <form onSubmit={handleJoinCode} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    if (codeError) setCodeError(null);
                  }}
                  placeholder={t('community.enter_code_placeholder') || 'e.g. A4B2 or SECTOR-15'}
                  className="p-1.5 px-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] uppercase focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t('common.confirm') || 'Join'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingCode(false);
                    setCodeError(null);
                  }}
                  className="p-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                  title={t('common.cancel') || 'Cancel'}
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
              {codeError && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {codeError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Segmented Tabs: Impact / Action Kits / Report / Care */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('impact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs font-bold'
              : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>{t('community.tab_impact') || 'Impact'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'kits'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs font-bold'
              : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>{t('community.tab_kits') || 'Action Kits'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'report'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs font-bold'
              : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{t('community.tab_report') || 'Report'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('care')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'care'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs font-bold'
              : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{t('community.tab_care') || 'Care'}</span>
        </button>
      </div>

      {/* TAB 1: IMPACT (Always 2x2 grid on mobile + initiatives + top actions) */}
      {activeTab === 'impact' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stats Grid: ALWAYS 2x2 grid on mobile (never 3+ columns) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tile 1: Households joined */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span className="font-medium text-sm text-[var(--text)]">Households joined</span>
                <Users className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">
                  {pooledData?.householdsCount ?? 60}
                </div>
                <p className="text-xs text-[var(--muted)] pt-0.5">
                  Active families in cluster
                </p>
              </div>
            </div>

            {/* Tile 2: PM2.5 avoided */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span className="font-medium text-sm text-[var(--text)]">PM2.5 avoided</span>
                <Wind className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {weeklyAvoidedKg} kg
                </div>
                <p className="text-xs text-[var(--muted)] pt-0.5">
                  Prevented this week locally
                </p>
              </div>
            </div>

            {/* Tile 3: Trees equivalent */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span className="font-medium text-sm text-[var(--text)]">Trees equivalent</span>
                <TreePine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">
                  {treesEquivalent} trees
                </div>
                <p className="text-xs text-[var(--muted)] pt-0.5">
                  Air cleaning equivalent
                </p>
              </div>
            </div>

            {/* Tile 4: Actions taken this week */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span className="font-medium text-sm text-[var(--text)]">Actions taken this week</span>
                <Activity className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--primary)]">
                  {pooledData?.weeklyActionsDone ?? 428}
                </div>
                <p className="text-xs text-[var(--muted)] pt-0.5">
                  Shared steps logged
                </p>
              </div>
            </div>
          </div>

          {/* Active Campaigns Progress */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[var(--text)]">
              {t('community.active_initiatives')}
            </h2>
            <div className="space-y-2.5">
              {(pooledData?.recentInitiatives || []).map((init) => (
                <div
                  key={init.id}
                  className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text)]">
                      {init.title}
                    </span>
                    <span className="font-semibold text-[var(--primary)] bg-[var(--primary-soft)] px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20">
                      {init.current} / {init.target} {init.unit}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--primary)] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((init.current / init.target) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Actions in Neighborhood */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[var(--text)]">
              {t('community.top_neighborhood_actions')}
            </h2>
            <div className="space-y-2">
              {(pooledData?.topActions || []).map((act, idx) => (
                <div
                  key={act.actionId}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text)]">
                      {t('actions.' + act.actionId + '.title') || act.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[var(--muted)]">
                    {act.count} logged
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTION KITS (Issue picker chips + ActionKitCard) */}
      {activeTab === 'kits' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[var(--text)]">
              {t('actionkit.title')}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {t('actionkit.desc')}
            </p>
          </div>

          {/* Issue Picker Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {actionKits.map((kit) => {
              const isSelected = selectedKit.id === kit.id;
              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => setSelectedKitId(kit.id)}
                  className={`text-xs px-3.5 py-2 rounded-xl transition-all font-medium ${
                    isSelected
                      ? 'bg-[var(--primary)] text-[var(--on-primary)] font-bold shadow-xs'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {kit.issueLabel}
                </button>
              );
            })}
          </div>

          {/* Preview Card */}
          {selectedKit && <ActionKitCard kit={selectedKit} />}
        </div>
      )}

      {/* TAB 3: REPORT (3-Step Mini-Wizard) */}
      {activeTab === 'report' && (
        <div className="animate-in fade-in duration-200">
          <HotspotReport communityCode={communityCode} />
        </div>
      )}

      {/* TAB 4: CARE (Neighbour Care with Heart Check in & Vulnerable badges) */}
      {activeTab === 'care' && (
        <div className="animate-in fade-in duration-200">
          <NeighbourCheck />
        </div>
      )}
    </div>
  );
}
