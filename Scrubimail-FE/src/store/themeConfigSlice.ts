import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { readStoredTheme } from '../utils/themeStorage';

export interface ThemeConfigState {
    isDarkMode?: boolean;
    sidebar?: boolean;
    theme?: string;
    menu?: string;
    layout?: string;
    rtlClass?: string;
    animation?: string;
    navbar?: string;
    locale?: string;
    semidark?: boolean;
}

const bootTheme = readStoredTheme();

const initialState: ThemeConfigState = {
    isDarkMode: bootTheme === 'dark',
    sidebar: true,
    theme: bootTheme,
    menu: 'vertical',
    layout: 'full',
    rtlClass: 'ltr',
    animation: '',
    navbar: 'navbar-sticky',
    locale: 'en',
    semidark: false,
};

const themeConfigSlice = createSlice({
    name: 'themeConfig',
    initialState,
    reducers: {
        toggleTheme(state, action: PayloadAction<string>) {
            state.theme = action.payload;
            state.isDarkMode = action.payload === 'dark';
        },
        toggleMenu(state, action: PayloadAction<string>) {
            state.menu = action.payload;
        },
        toggleLayout(state, action: PayloadAction<string>) {
            state.layout = action.payload;
        },
        toggleRTL(state, action: PayloadAction<string>) {
            state.rtlClass = action.payload;
        },
        toggleAnimation(state, action: PayloadAction<string>) {
            state.animation = action.payload;
        },
        toggleNavbar(state, action: PayloadAction<string>) {
            state.navbar = action.payload;
        },
        toggleLocale(state, action: PayloadAction<string>) {
            state.locale = action.payload;
        },
        toggleSemidark(state, action: PayloadAction<boolean>) {
            state.semidark = action.payload;
        },
        toggleSidebar(state) {
            state.sidebar = !state.sidebar;
        },
        setSidebar(state, action: PayloadAction<boolean>) {
            state.sidebar = action.payload;
        },
    },
});

export const {
    toggleTheme,
    toggleMenu,
    toggleLayout,
    toggleRTL,
    toggleAnimation,
    toggleNavbar,
    toggleLocale,
    toggleSemidark,
    toggleSidebar,
    setSidebar,
} = themeConfigSlice.actions;

export default themeConfigSlice.reducer;