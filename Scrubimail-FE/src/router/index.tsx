import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import FlexibleLayout from '../components/Layouts/FlexibleLayout';
import AdminLayout from '../components/AdminLayout';
import AppShell from '../components/app/AppShell';
import App from '../App';
import { routes } from './routes';

/**
 * `app`      — signed-in product pages, wrapped in the single AppShell chrome.
 * `flexible` — marketing pages (public nav + footer).
 * `blank`    — auth and error pages, no chrome.
 *
 * Product pages must use `app`. They previously split between `blank` (pages
 * that wrapped themselves in AppShell) and `default` (the old Vristo sidebar),
 * which is why two different sidebars were shipping at once.
 */
const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element:
            route.layout === 'blank' ? (
                <BlankLayout>{route.element}</BlankLayout>
            ) : route.layout === 'app' ? (
                // <App> owns the `dark` class and theme sync, as in every other layout.
                <App>
                    <AppShell>{route.element}</AppShell>
                </App>
            ) : route.layout === 'flexible' ? (
                <FlexibleLayout>{route.element}</FlexibleLayout>
            ) : route.layout === 'admin' ? (
                <AdminLayout>{route.element}</AdminLayout>
            ) : (
                <DefaultLayout>{route.element}</DefaultLayout>
            ),
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
