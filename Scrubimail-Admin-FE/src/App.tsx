import { PropsWithChildren, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ConfigProvider, theme as antTheme } from 'antd';
import { IRootState } from './store';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

/**
 * Applies the active colour scheme and hosts the app-wide providers.
 *
 * The antd ConfigProvider is transitional: pages are being migrated onto
 * shadcn module by module, and it can be dropped once no page imports antd.
 */
function App({ children }: PropsWithChildren) {
    const theme = useSelector((state: IRootState) => state.themeConfig.theme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.style.colorScheme = theme;
    }, [theme]);

    return (
        <ConfigProvider theme={{ algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm }}>
            <TooltipProvider delay={200}>
                {children}
                <Toaster position="bottom-right" richColors closeButton />
            </TooltipProvider>
        </ConfigProvider>
    );
}

export default App;
