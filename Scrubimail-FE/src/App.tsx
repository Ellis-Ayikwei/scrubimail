import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import store, { AppDispatch, IRootState } from './store';
import { toggleAnimation, toggleLayout, toggleLocale, toggleMenu, toggleNavbar, toggleRTL, toggleSemidark } from './store/themeConfigSlice';
import defaultTheme from './theme.config';
import { THEME_STORAGE_KEY } from './utils/themeStorage';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch<AppDispatch>();

    // Theme comes from `readStoredTheme()` in themeConfigSlice; avoid re-reading localStorage here (would race toggles).
    useEffect(() => {
        dispatch(toggleMenu((localStorage.getItem('menu') as string) || defaultTheme.menu));
        dispatch(toggleLayout((localStorage.getItem('layout') as string) || defaultTheme.layout));
        dispatch(toggleRTL((localStorage.getItem('rtlClass') as string) || defaultTheme.rtlClass));
        dispatch(toggleAnimation((localStorage.getItem('animation') as string) || defaultTheme.animation));
        dispatch(toggleNavbar((localStorage.getItem('navbar') as string) || defaultTheme.navbar));
        dispatch(toggleLocale(localStorage.getItem('i18nextLng') || defaultTheme.locale));
        dispatch(toggleSemidark(localStorage.getItem('semidark') === 'true' || defaultTheme.semidark));
    }, [dispatch]);

    // Tailwind + persist `theme` (Mantine follows Redux via `forceColorScheme` in MantineReduxRoot)
    useEffect(() => {
        const scheme = themeConfig.theme === 'light' ? 'light' : 'dark';
        try {
            localStorage.setItem(THEME_STORAGE_KEY, scheme);
        } catch {
            /* ignore */
        }
        document.documentElement.classList.toggle('dark', scheme === 'dark');
    }, [themeConfig.theme]);


    return (
        <div
            className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                themeConfig.rtlClass
            } main-section antialiased relative font-nunito text-sm font-normal app-bg app-text`}
        >
            {children}
        </div>
    );
}

export default App;
