/** Single source of truth for app + Mantine + Tailwind (class `dark`). */
export const THEME_STORAGE_KEY = 'theme';

export type AppColorScheme = 'light' | 'dark';

function migrateLegacyKeys(): void {
    if (typeof window === 'undefined') return;
    try {
        let t = localStorage.getItem(THEME_STORAGE_KEY);
        if (t === 'light' || t === 'dark') return;

        const mantine = localStorage.getItem('mantine-color-scheme-value');
        if (mantine === 'light' || mantine === 'dark') {
            localStorage.setItem(THEME_STORAGE_KEY, mantine);
            return;
        }

        const legacyDark = localStorage.getItem('darkMode');
        if (legacyDark === 'true') {
            localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        } else if (legacyDark === 'false') {
            localStorage.setItem(THEME_STORAGE_KEY, 'light');
        }
    } catch {
        /* ignore */
    }
}

/** Call once before reading theme (store init, App bootstrap). */
export function readStoredTheme(): AppColorScheme {
    if (typeof window === 'undefined') return 'dark';
    migrateLegacyKeys();
    try {
        const t = localStorage.getItem(THEME_STORAGE_KEY);
        if (t === 'light' || t === 'dark') return t;
    } catch {
        /* ignore */
    }
    return 'dark';
}

