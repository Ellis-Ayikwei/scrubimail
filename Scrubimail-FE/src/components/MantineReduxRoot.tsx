import { MantineProvider } from '@mantine/core';
import { PropsWithChildren, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';

/**
 * Mantine must follow Redux theme. `forceColorScheme` avoids fighting between
 * `setColorScheme` in layout and Mantine's color-scheme manager.
 */
export default function MantineReduxRoot({ children }: PropsWithChildren) {
    const theme = useSelector((s: IRootState) => s.themeConfig.theme);
    const scheme = useMemo(() => (theme === 'light' ? 'light' : 'dark'), [theme]);

    return (
        <MantineProvider withGlobalClasses defaultColorScheme="dark" forceColorScheme={scheme}>
            {children}
        </MantineProvider>
    );
}
