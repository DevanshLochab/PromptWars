'use client';

import React, { useState } from 'react';
import { HotspotReport as HotspotReportType, communityStore } from '@/lib/store/communityStore';
import { useTranslation } from '@/lib/i18n';

interface HotspotReportProps {
  communityCode?: string;
  onReportSubmitted?: () => void;
}

export function HotspotReport({ communityCode = 'DELHI-GREEN-01', onReportSubmitted }: HotspotReportProps) {
  const { t } = useTranslation();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<HotspotReportType['sourceType']>('waste_burning');
  const [severity, setSeverity] = useState<HotspotReportType['severity']>('high');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle image upload and base64 preview
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!privacyConfirmed) {
      alert('Please confirm that the photo contains no faces, license plates, or private property.');
      return;
    }

    setIsSubmitting(true);
    try {
      await communityStore.submitHotspot(communityCode, {
        id: `hotspot_${Date.now()}`,
        sourceType,
        severity,
        locationDescription: location || 'Near society perimeter',
        notes,
        photoUrl: photoPreview || undefined,
        timestamp: new Date().toISOString(),
        contactChannel: 'CPCB Sameer / MCD 311 / Green Delhi App',
        status: 'submitted',
      });

      setSubmitSuccess(true);
      setIsReviewOpen(false);
      if (onReportSubmitted) onReportSubmitted();
      setTimeout(() => {
        setSubmitSuccess(false);
        setLocation('');
        setNotes('');
        setPhotoPreview(null);
        setPrivacyConfirmed(false);
      }, 4000);
    } catch {
      alert('Failed to submit hotspot report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('hotspot.title')}
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('hotspot.desc')}
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <span className="text-base">🛡️</span>
        <div>
          <span className="font-bold">Privacy Guard: </span>
          <span>{t('hotspot.privacy_warning')}</span>
        </div>
      </div>

      {/* 1. Photo Upload */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {t('hotspot.photo_upload')}
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            id="hotspot-photo-input"
            className="hidden"
          />
          <label
            htmlFor="hotspot-photo-input"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-sky-700 dark:text-sky-300 text-center cursor-pointer transition-colors shadow-xs"
          >
            📸 {photoPreview ? 'Change Photo' : t('hotspot.photo_choose')}
          </label>

          {photoPreview && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Hotspot preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Classification Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('hotspot.source_type')}
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as any)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
          >
            <option value="waste_burning">🍂 Horticultural & Leaf Burning</option>
            <option value="guard_bonfire">🪵 Night Scrap/Plastic Bonfire</option>
            <option value="construction_dust">🏗️ Uncovered Construction Dust</option>
            <option value="idling">🚗 Persistent Vehicle Idling</option>
            <option value="industrial_smoke">🏭 Commercial Boiler / Chimney</option>
            <option value="other">⚠️ Other Visible Smoke Plume</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('hotspot.severity')}
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
          >
            <option value="low">🟡 Low (Faint smoldering smoke)</option>
            <option value="medium">🟠 Medium (Noticeable localized plume)</option>
            <option value="high">🔴 High (Dense smoke spreading across lane)</option>
            <option value="severe">🟣 Severe (Thick black/plastic toxic smoke)</option>
          </select>
        </div>
      </div>

      {/* 3. Draft Report (Editable) */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('hotspot.location')}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('hotspot.location_placeholder')}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t('hotspot.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Occurs nightly around 10:30 PM near back alley..."
            className="w-full h-16 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>
      </div>

      {/* 4. Local Channel Info */}
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🏛️</span>
          <span>{t('hotspot.channels_info')}</span>
        </div>
        <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
          Official GRAP Channels
        </span>
      </div>

      {/* 5. Mandatory Review Step Button */}
      {!isReviewOpen ? (
        <button
          type="button"
          onClick={() => setIsReviewOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-xs"
        >
          {t('hotspot.review_step')} & Continue →
        </button>
      ) : (
        /* Review Step Panel */
        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <span>🔍</span>
            <span>Mandatory Pre-Submission Review</span>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-sky-150 dark:border-sky-900">
            <p><strong>Source:</strong> {sourceType.replace('_', ' ')}</p>
            <p><strong>Severity:</strong> {severity.toUpperCase()}</p>
            <p><strong>Location:</strong> {location || 'Not specified'}</p>
            {notes && <p><strong>Notes:</strong> {notes}</p>}
          </div>

          {/* Privacy Mandatory Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800 dark:text-slate-200 pt-1">
            <input
              type="checkbox"
              checked={privacyConfirmed}
              onChange={(e) => setPrivacyConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-sky-600 cursor-pointer"
            />
            <span className="leading-tight font-medium">
              {t('hotspot.review_confirm')}
            </span>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Edit
            </button>
            <button
              type="button"
              disabled={!privacyConfirmed || isSubmitting}
              onClick={handleSubmit}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white transition-colors shadow-xs ${
                privacyConfirmed && !isSubmitting
                  ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? t('hotspot.submitting') : t('hotspot.submit_report')}
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {submitSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span>✅</span>
          <span className="font-semibold">{t('hotspot.success')}</span>
        </div>
      )}
    </div>
  );
}
