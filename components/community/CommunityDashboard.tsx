'use client';

import React, { useState, useEffect } from 'react';
import { communityStore, PooledTotals, ActionKit } from '@/lib/store/communityStore';
import { ActionKitCard } from './ActionKitCard';
import { HotspotReport } from './HotspotReport';
import { NeighbourCheck } from './NeighbourCheck';
import { useProfile } from '@/lib/store/ProfileProvider';
import { useTranslation } from '@/lib/i18n';
import { WhatsAppSummary } from '@/components/common/WhatsAppSummary';

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
  const [selectedKitIndex, setSelectedKitIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'impact' | 'kits' | 'hotspot' | 'neighbours'>('impact');

  useEffect(() => {
    async function loadData() {
      const data = await communityStore.getPooledTotals(communityCode);
      const kits = await communityStore.getActionKits(communityCode);
      setPooledData(data);
      setActionKits(kits);
    }
    loadData();
  }, [communityCode]);

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const clean = inputCode.trim().toUpperCase();
    await communityStore.joinCommunity(clean);
    setCommunityCode(clean);
    setIsChangingCode(false);
    setInputCode('');
    const refreshed = await communityStore.getPooledTotals(clean);
    setPooledData(refreshed);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {t('community.hub_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('community.hub_desc')}
          </p>
        </div>
        <WhatsAppSummary />
      </div>

      {/* 1. Community Code & Airshed Join Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-100 dark:border-sky-900/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
              Active Airshed Collaborative
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {pooledData?.communityName || communityCode}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {communityCode}
              </span>
            </div>
          </div>

          {!isChangingCode ? (
            <button
              type="button"
              onClick={() => setIsChangingCode(true)}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              {t('community.join_title')}
            </button>
          ) : (
            <form onSubmit={handleJoinCode} className="flex items-center gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. DELHI-GREEN-01"
                className="p-1.5 px-3 text-xs rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
              >
                {t('community.join_button')}
              </button>
              <button
                type="button"
                onClick={() => setIsChangingCode(false)}
                className="p-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('impact')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'impact'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          📊 Airshed Impact
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kits')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'kits'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          📁 Action Kits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hotspot')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'hotspot'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          📍 Hotspot Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('neighbours')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'neighbours'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          🤝 Care List
        </button>
      </div>

      {/* TAB 1: Pooled Anonymous Weekly Totals */}
      {activeTab === 'impact' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Active Homes
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {pooledData?.householdsCount ?? 60}
              </div>
              <p className="text-[10px] text-emerald-600 font-medium">
                Participating households
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Actions Done
              </span>
              <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                {pooledData?.weeklyActionsDone ?? 428}
              </div>
              <p className="text-[10px] text-slate-500">
                Past 7 days aggregate
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Emissions Avoided
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {((pooledData?.weeklyPm25AvoidedGrams ?? 3420) / 1000).toFixed(1)} kg
              </div>
              <p className="text-[10px] text-slate-500">
                PM2.5 prevented locally
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Avg Exposure Cut
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                -{pooledData?.weeklyAvgExposureReductionPct ?? 28}%
              </div>
              <p className="text-[10px] text-slate-500">
                Household indoor benefit
              </p>
            </div>
          </div>

          {/* Active Campaigns Progress */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t('community.active_initiatives')}
            </h2>
            <div className="space-y-3">
              {(pooledData?.recentInitiatives || []).map((init) => (
                <div
                  key={init.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {init.title}
                    </span>
                    <span className="font-semibold text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-100 dark:border-sky-900">
                      {init.current} / {init.target} {init.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
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
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t('community.top_neighborhood_actions')}
            </h2>
            <div className="space-y-2">
              {(pooledData?.topActions || []).map((act, idx) => (
                <div
                  key={act.actionId}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {act.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {act.count} logged
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Action Kit Generator */}
      {activeTab === 'kits' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t('actionkit.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('actionkit.desc')}
            </p>
          </div>

          {/* Issue Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {actionKits.map((kit, idx) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => setSelectedKitIndex(idx)}
                className={`text-xs px-3.5 py-2 rounded-xl transition-all ${
                  selectedKitIndex === idx
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {kit.issueLabel}
              </button>
            ))}
          </div>

          {actionKits[selectedKitIndex] && (
            <ActionKitCard kit={actionKits[selectedKitIndex]} />
          )}
        </div>
      )}

      {/* TAB 3: Hotspot Report */}
      {activeTab === 'hotspot' && (
        <div className="animate-in fade-in duration-200">
          <HotspotReport communityCode={communityCode} />
        </div>
      )}

      {/* TAB 4: Check on a Neighbour */}
      {activeTab === 'neighbours' && (
        <div className="animate-in fade-in duration-200">
          <NeighbourCheck />
        </div>
      )}
    </div>
  );
}
