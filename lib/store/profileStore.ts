import { HouseholdProfile, HouseholdProfileSchema } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

const PROFILE_STORAGE_KEY = 'saans_household_profile_v1';
const DEMO_MODE_STORAGE_KEY = 'saans_demo_mode_active';

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') {
    return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  }
  const stored = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
}

export function getDefaultDemoProfile(): HouseholdProfile {
  const parsed = HouseholdProfileSchema.safeParse(demoSnapshot.profile);
  if (parsed.success) {
    return parsed.data;
  }
  throw new Error('Default demo profile in demo_snapshot.json failed validation: ' + JSON.stringify(parsed.error));
}

export function getStoredProfile(): HouseholdProfile | null {
  if (typeof window === 'undefined') {
    return getDefaultDemoProfile();
  }

  const demoActive = isDemoModeEnabled();
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const validated = HouseholdProfileSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch {
      // Invalid JSON or format in localStorage, fallback
    }
  }

  if (demoActive) {
    return getDefaultDemoProfile();
  }

  return null;
}

export function saveStoredProfile(profile: HouseholdProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearStoredProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}
