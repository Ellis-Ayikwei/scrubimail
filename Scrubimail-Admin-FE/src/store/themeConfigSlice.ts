import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfigState {
    theme: ThemeMode;
    isDarkMode: boolean;
}

const STORAGE_KEY = 'theme';

/**
 * Resolve the startup theme once, synchronously, so the first paint already
 * matches the user's choice instead of flashing light and correcting.
 */
const resolveInitialTheme = (): ThemeMode => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initial = resolveInitialTheme();

const initialState: ThemeConfigState = {
    theme: initial,
    isDarkMode: initial === 'dark',
};

const themeConfigSlice = createSlice({
    name: 'themeConfig',
    initialState,
    reducers: {
        toggleTheme(state, action: PayloadAction<ThemeMode>) {
            state.theme = action.payload;
            state.isDarkMode = action.payload === 'dark';
            localStorage.setItem(STORAGE_KEY, action.payload);
        },
    },
});

export const { toggleTheme } = themeConfigSlice.actions;

export default themeConfigSlice.reducer;
