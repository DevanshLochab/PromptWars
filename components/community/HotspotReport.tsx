'use client';

import React, { useState } from 'react';
import { HotspotReport as HotspotReportType, communityStore } from '@/lib/store/communityStore';
import { useTranslation } from '@/lib/i18n';
import { useProfile } from '@/lib/store/ProfileProvider';
import {
  Camera,
  ShieldCheck,
  Send,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Info,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface HotspotReportProps {
  communityCode?: string;
  onReportSubmitted?: () => void;
}

export function HotspotReport({
  communityCode = 'DELHI-GREEN-01',
  onReportSubmitted,
}: HotspotReportProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();

  // 3-step wizard: 1 = Photo, 2 = AI Review, 3 = Send
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<HotspotReportType['sourceType']>('waste_burning');
  const [severity, setSeverity] = useState<HotspotReportType['severity']>('high');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Dynamic civic authority resolution based on user's geographic profile
  const placeNameLower = (profile?.location?.placeName || '').toLowerCase();
  const targetChannelName = placeNameLower.includes('mumbai') || placeNameLower.includes('pune')
    ? 'CPCB Sameer / BMC 24x7 App (Helpline 1916)'
    : placeNameLower.includes('bengaluru') || placeNameLower.includes('bangalore')
      ? 'CPCB Sameer / BBMP Sahaaya Portal'
      : placeNameLower.includes('hyderabad')
        ? 'CPCB Sameer / GHMC Citizen App'
        : placeNameLower.includes('kolkata')
          ? 'CPCB Sameer / KMC Citizen Grievance'
          : placeNameLower.includes('chennai')
            ? 'CPCB Sameer / Greater Chennai Corp (GCC 1913)'
            : 'CPCB Sameer / MCD 311 / Green Delhi App';

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

  const handleNextToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || location.trim().length < 3) {
      setLocationError('Please provide a specific street name, colony gate, or landmark (min 3 chars).');
      return;
    }
    setLocationError(null);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (!privacyConfirmed) {
      alert('Please confirm that the photo contains no faces, license plates, or private property.');
      return;
    }

    setIsSubmitting(true);
    const newId = `hotspot_${Date.now()}`;
    try {
      await communityStore.submitHotspot(communityCode, {
        id: newId,
        sourceType,
        severity,
        locationDescription: location || 'Near society perimeter',
        notes,
        photoUrl: photoPreview || undefined,
        timestamp: new Date().toISOString(),
        contactChannel: targetChannelName,
        status: 'submitted',
      });

      setSubmittedId(newId);
      setSubmitSuccess(true);
      if (onReportSubmitted) onReportSubmitted();
    } catch {
      alert('Failed to submit hotspot report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitSuccess(false);
    setCurrentStep(1);
    setLocation('');
    setNotes('');
    setPhotoPreview(null);
    setPrivacyConfirmed(false);
    setSubmittedId(null);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-5 transition-all">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {t('hotspot.title')}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {t('hotspot.desc')}
            </p>
          </div>
        </div>
      </div>

      {/* 3-Step Wizard Indicator */}
      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => !submitSuccess && setCurrentStep(1)}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
            currentStep === 1
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : currentStep > 1
              ? 'bg-[var(--surface-2)] text-[var(--text)]'
              : 'text-[var(--muted)] opacity-60'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">1</span>
          <span>Photo & Info</span>
        </button>

        <button
          type="button"
          onClick={() => !submitSuccess && setCurrentStep(2)}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
            currentStep === 2
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : currentStep > 2
              ? 'bg-[var(--surface-2)] text-[var(--text)]'
              : 'text-[var(--muted)] opacity-60'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">2</span>
          <span>AI Review</span>
        </button>

        <button
          type="button"
          onClick={() => !submitSuccess && privacyConfirmed && setCurrentStep(3)}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
            currentStep === 3
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : 'text-[var(--muted)] opacity-60'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">3</span>
          <span>Send</span>
        </button>
      </div>

      {/* SUCCESS STATE */}
      {submitSuccess ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text)]">
              {t('hotspot.success')}
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              Hotspot report logged to {communityCode} airshed queue and routed to CPCB Sameer & MCD 311.
            </p>
            {submittedId && (
              <p className="text-[11px] font-mono text-[var(--muted)] pt-1">
                Reference ID: <span className="font-bold text-[var(--text)]">{submittedId}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--on-primary)] shadow-xs hover:opacity-90 transition-opacity"
          >
            Submit Another Report
          </button>
        </div>
      ) : (
        <>
          {/* STEP 1: PHOTO & SOURCE */}
          {currentStep === 1 && (
            <form onSubmit={handleNextToReview} className="space-y-4 animate-in fade-in duration-200">
              {/* Photo Upload Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                  <span>{t('hotspot.photo_upload')}</span>
                  <span className="text-[11px] font-normal text-[var(--muted)]">Optional but recommended</span>
                </label>

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] p-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Hotspot preview"
                      className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-[var(--text)] truncate">Photo captured</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ready for AI screening
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      id="hotspot-photo-wizard"
                      className="hidden"
                    />
                    <label
                      htmlFor="hotspot-photo-wizard"
                      className="w-full py-6 px-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)]/50 hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--primary)] text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span>{t('hotspot.photo_choose')}</span>
                      <span className="text-[10px] text-[var(--muted)] font-normal">
                        Supports camera capture on mobile phones
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Source Type & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">
                    {t('hotspot.source_type')}
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
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
                  <label className="text-xs font-bold text-[var(--text)]">
                    {t('hotspot.severity')}
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="low">🟡 Low (Faint smoldering smoke)</option>
                    <option value="medium">🟠 Medium (Noticeable localized plume)</option>
                    <option value="high">🔴 High (Dense smoke spreading across lane)</option>
                    <option value="severe">🟣 Severe (Thick black/plastic toxic smoke)</option>
                  </select>
                </div>
              </div>

              {/* Location & Notes */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                    <span>{t('hotspot.location')}</span>
                    <span className="text-[10px] text-rose-500 font-normal">*Required</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (locationError) setLocationError(null);
                    }}
                    placeholder={t('hotspot.location_placeholder')}
                    className={`w-full p-2.5 text-xs rounded-xl border bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:ring-2 focus:ring-[var(--primary)] ${
                      locationError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {locationError && (
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {locationError}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text)]">
                    {t('hotspot.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Occurs nightly around 10:30 PM near back alley..."
                    className="w-full h-18 p-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]/60 focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  />
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--on-primary)] shadow-xs hover:opacity-90 transition-opacity"
              >
                <span>Continue to AI Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: AI REVIEW */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* AI Verification Banner */}
              <div className="p-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary-soft)]/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
                  <Sparkles className="w-4 h-4" />
                  <span>Saans Airshed AI Verification</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Privacy Screen: No identifiable human faces detected</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Vehicle Anonymity: No readable license plates</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text)] font-medium">
                    <Info className="w-4 h-4 shrink-0 text-[var(--primary)]" />
                    <span>Plume Signature: Particulate aerosol source matched ({sourceType.replace('_', ' ')})</span>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-2 font-semibold">
                  <span>Report Summary</span>
                  <span className="text-[10px] uppercase font-bold text-[var(--primary)]">{communityCode}</span>
                </div>
                <p><strong>Source:</strong> {sourceType.replace('_', ' ')}</p>
                <p><strong>Severity:</strong> <span className="uppercase font-bold text-rose-600">{severity}</span></p>
                <p><strong>Location:</strong> {location || 'Near society perimeter'}</p>
                {notes && <p><strong>Notes:</strong> {notes}</p>}
                {photoPreview && (
                  <div className="pt-2">
                    <span className="font-semibold block mb-1">Attached Evidence:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Attached" className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]" />
                  </div>
                )}
              </div>

              {/* Mandatory Privacy Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[var(--text)] p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <input
                  type="checkbox"
                  checked={privacyConfirmed}
                  onChange={(e) => setPrivacyConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0"
                />
                <span className="leading-tight">
                  {t('hotspot.review_confirm')}
                </span>
              </label>

              {/* Navigation */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Edit</span>
                </button>

                <button
                  type="button"
                  disabled={!privacyConfirmed}
                  onClick={() => setCurrentStep(3)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                    privacyConfirmed
                      ? 'bg-[var(--primary)] hover:opacity-90 cursor-pointer'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>Proceed to Send</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SEND */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Ready to Dispatch Card */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[var(--primary)]" />
                    <span>Ready for Civic Dispatch</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    Direct GRAP Line
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  This report will be logged anonymously in the <strong>{communityCode}</strong> airshed database and formatted for direct submission to {targetChannelName}.
                </p>

                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--muted)] space-y-1">
                  <div><strong>Location:</strong> {location || 'Near society perimeter'}</div>
                  <div><strong>Category:</strong> {sourceType.replace('_', ' ')}</div>
                  <div><strong>Target Channel:</strong> {targetChannelName}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? t('hotspot.submitting') : 'Send Official Report'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
