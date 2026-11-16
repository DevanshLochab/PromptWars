/**
 * Saans Theme Store & Manager
 * Supports: 'system' (default), 'light', 'dark'.
 * Automatically tracks system color scheme changes when set to 'system'.
 */

export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'saans_theme_preference';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const val = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
  if (val === 'light' || val === 'dark' || val === 'system') {
    return val;
  }
  return 'system';
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference default
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export function initThemeListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const current = getStoredTheme();
  applyTheme(current);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}
