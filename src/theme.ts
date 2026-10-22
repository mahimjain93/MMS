import { useEffect, useState } from 'react';
import { loadTheme, saveTheme, type ThemePref } from './storage';

const NEXT: Record<ThemePref, ThemePref> = { light: 'dark', dark: 'auto', auto: 'light' };

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0622' : '#cfe3d4');
}

/** Current theme preference and a function that steps Light → Dark → Auto. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(loadTheme);

  useEffect(() => {
    apply(pref);
    saveTheme(pref);
    if (pref !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  return [pref, () => setPref((p) => NEXT[p])] as const;
}
