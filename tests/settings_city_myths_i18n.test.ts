import { describe, it, expect, beforeEach } from 'vitest';
import { INDIAN_CITIES, findNearestCity } from '@/lib/data/cities';
import { SUPPORTED_LANGUAGES, t, Language } from '@/lib/i18n';
import { HouseholdProfileSchema, LocationSchema, LanguageEnum } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Settings, City Selection & Regional Languages', () => {
  it('includes comprehensive Indian cities across all regions and states', () => {
    expect(INDIAN_CITIES.length).toBeGreaterThanOrEqual(30);

    const metros = INDIAN_CITIES.filter((c) => c.isMetro);
    expect(metros.some((c) => c.city === 'New Delhi')).toBe(true);
    expect(metros.some((c) => c.city === 'Mumbai')).toBe(true);
    expect(metros.some((c) => c.city === 'Bengaluru')).toBe(true);
    expect(metros.some((c) => c.city === 'Kolkata')).toBe(true);
    expect(metros.some((c) => c.city === 'Chennai')).toBe(true);
    expect(metros.some((c) => c.city === 'Hyderabad')).toBe(true);
    expect(metros.some((c) => c.city === 'Pune')).toBe(true);
    expect(metros.some((c) => c.city === 'Ahmedabad')).toBe(true);
    expect(metros.some((c) => c.city === 'Jaipur')).toBe(true);
    expect(metros.some((c) => c.city === 'Lucknow')).toBe(true);
  });

  it('correctly calculates nearest Indian city from coordinates', () => {
    // Coords near Mumbai
    const mumbaiNearest = findNearestCity(19.08, 72.88);
    expect(mumbaiNearest.city).toBe('Mumbai');

    // Coords near Bengaluru
    const blrNearest = findNearestCity(12.97, 77.59);
    expect(blrNearest.city).toBe('Bengaluru');

    // Coords near Kolkata
    const kolNearest = findNearestCity(22.57, 88.36);
    expect(kolNearest.city).toBe('Kolkata');
  });

  it('supports major Indian regional languages with translations and metadata', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(8);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('bn');
    expect(codes).toContain('mr');
    expect(codes).toContain('te');
    expect(codes).toContain('ta');
    expect(codes).toContain('gu');
    expect(codes).toContain('kn');
    expect(codes).toContain('pa');

    // Test translation in various languages
    expect(t('nav.today', 'en')).toBe('Today');
    expect(t('nav.today', 'hi')).toContain('आज');
    expect(t('nav.today', 'bn')).toContain('আজ');
    expect(t('nav.today', 'mr')).toContain('आज');
    expect(t('nav.today', 'ta')).toBe('இன்று');
    expect(t('nav.today', 'te')).toContain('ఈ రోజు');
    expect(t('nav.today', 'gu')).toContain('આજ');
    expect(t('nav.today', 'kn')).toBe('ಇಂದು');
    expect(t('nav.today', 'pa')).toContain('ਅੱਜ');
  });

  it('validates HouseholdProfile with non-Delhi location and regional language', () => {
    const profile = {
      ...demoSnapshot.profile,
      location: {
        lat: 19.076,
        lon: 72.8777,
        placeName: 'Mumbai, Maharashtra, India',
        timezone: 'Asia/Kolkata',
      },
      language: 'mr' as Language,
    };

    const parsed = HouseholdProfileSchema.safeParse(profile);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.location.placeName).toContain('Mumbai');
      expect(parsed.data.language).toBe('mr');
    }
  });

  it('validates LanguageEnum encompasses all supported regional languages', () => {
    const validLanguages = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'kn', 'pa'];
    for (const lang of validLanguages) {
      expect(LanguageEnum.safeParse(lang).success).toBe(true);
    }
  });
});
