'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';

export interface AirRingProps {
  aqi: number;
  pm25: number;
  whoMultiple?: number;
  label?: string;
  isIndoor?: boolean;
  size?: number;
  className?: string;
}

export interface AqiMeta {
  band: string;
  label: string;
  icon: string;
  color: string;
  strokeColor: string;
  textColor: string;
  bgColor: string;
  advice: string;
}

export function getAqiMeta(aqi: number): AqiMeta {
  if (aqi <= 50) {
    return {
      band: 'good',
      label: 'Good',
      icon: '🌿',
      color: '#10b981', // green
      strokeColor: 'stroke-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      advice: 'Air quality is satisfactory. Enjoy outdoor activities.',
    };
  }
  if (aqi <= 100) {
    return {
      band: 'moderate',
      label: 'Moderate',
      icon: '🌤️',
      color: '#f59e0b', // yellow
      strokeColor: 'stroke-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      advice: 'Acceptable air quality. Sensitive individuals should take care.',
    };
  }
  if (aqi <= 150) {
    return {
      band: 'unhealthy-sensitive',
      label: 'Unhealthy for Sensitive Groups',
      icon: '😷',
      color: '#f97316', // orange
      strokeColor: 'stroke-orange-500',
      textColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
      advice: 'Children, seniors, and asthmatics should reduce outdoor exertion.',
    };
  }
  if (aqi <= 200) {
    return {
      band: 'unhealthy',
      label: 'Unhealthy',
      icon: '⚠️',
      color: '#ef4444', // red
      strokeColor: 'stroke-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
      advice: 'Health alert for all. Wear an N95 respirator outdoors.',
    };
  }
  if (aqi <= 300) {
    return {
      band: 'very-unhealthy',
      label: 'Very Unhealthy',
      icon: '🚨',
      color: '#8b5cf6', // purple
      strokeColor: 'stroke-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      advice: 'Serious health alert. Run air purification continuously.',
    };
  }
  return {
    band: 'hazardous',
    label: 'Hazardous',
    icon: '☠️',
    color: '#7f1d1d', // maroon
    strokeColor: 'stroke-rose-900 dark:stroke-rose-700',
    textColor: 'text-rose-900 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-900',
    advice: 'Emergency conditions. Remain indoors and run air purification on high.',
  };
}

export function AirRing({
  aqi,
  pm25,
  whoMultiple,
  label,
  isIndoor = false,
  size = 200,
  className = '',
}: AirRingProps) {
  const { t } = useTranslation();
  const meta = getAqiMeta(aqi);
  const localizedBand = t('aqi.' + meta.band);
  const displayBandLabel = localizedBand !== 'aqi.' + meta.band ? localizedBand : meta.label;

  // SVG Geometry
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Max AQI mapped to 500 for US AQI scale
  const progressRatio = Math.min(1, Math.max(0, aqi / 500));
  const strokeDashoffset = circumference - progressRatio * circumference;

  // WHO guideline: 24h mean is 15 µg/m³
  const multiple =
    whoMultiple ?? Math.max(1, Math.round((pm25 / 15) * 10) / 10);

  return (
    <div
      role="region"
      aria-label={`Air Quality Index gauge: AQI ${aqi}, ${displayBandLabel}, PM2.5 ${pm25} µg/m³, ${multiple} times WHO guideline.`}
      className={`flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
    >
      {/* SVG Ring Gauge */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 motion-reduce:transform-none"
          aria-hidden="true"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-200 dark:stroke-slate-800 fill-none"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={meta.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-1000 ease-out motion-reduce:transition-none"
          />
        </svg>

        {/* Center Content: Big AQI number + "US AQI" tiny below + band label. No raw µg/m³ inside the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full max-w-[150px] truncate mb-0.5"
            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
          >
            {displayBandLabel}
          </span>

          <span
            className="text-4xl sm:text-5xl font-black tracking-tight my-0.5"
            style={{ color: meta.color }}
          >
            {aqi}
          </span>

          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {isIndoor ? (t('air.indoor_gauge_label') || 'Indoor AQI') : label || t('air.gauge_label') || 'US AQI'}
          </span>
        </div>
      </div>

      {/* Below Ring: PM2.5 metric & WHO guideline multiplier (small and muted) */}
      <div className="mt-4 space-y-1.5 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="text-rose-600 dark:text-rose-400 font-bold">
            ×{multiple}
          </span>
          <span>WHO daily guideline</span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          PM2.5: {pm25} µg/m³
        </div>
      </div>
    </div>
  );
}

export default AirRing;
