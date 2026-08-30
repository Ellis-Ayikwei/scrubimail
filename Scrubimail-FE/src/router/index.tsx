import { createBrowserRouter, Outlet, type RouteObject } from 'react-router-dom';
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
 * Each layout is a pathless *layout route* rendering an <Outlet />, so the
 * chrome mounts once and only the page below it swaps on navigation.
 *
 * Previously every route carried its own copy of the layout in its `element`.
 * Sibling routes share no component instances, so React Router tore the whole
 * tree down and rebuilt it on each click: the sidebar remounted, its billing
 * fetch re-ran and open/scroll state reset — navigation looked like a reload.
 */
type LayoutName = 'app' | 'blank' | 'flexible' | 'admin' | 'default';

const LAYOUT_ELEMENT: Record<LayoutName, JSX.Element> = {
    // <App> owns the `dark` class and theme sync; the other layouts wrap
    // themselves in it already.
    app: (
        <App>
            <AppShell>
                <Outlet />
            </AppShell>
        </App>
    ),
    blank: (
        <BlankLayout>
            <Outlet />
        </BlankLayout>
    ),
    flexible: (
        <FlexibleLayout>
            <Outlet />
        </FlexibleLayout>
    ),
    admin: (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    ),
    default: (
        <DefaultLayout>
            <Outlet />
        </DefaultLayout>
    ),
};

const ORDER: LayoutName[] = ['app', 'blank', 'flexible', 'admin', 'default'];

const grouped = routes.reduce<Record<string, RouteObject[]>>((acc, route) => {
    const { layout, ...rest } = route as typeof route & { layout?: LayoutName };
    const name: LayoutName = layout && layout in LAYOUT_ELEMENT ? layout : 'default';
    (acc[name] ||= []).push(rest as RouteObject);
    return acc;
}, {});

const finalRoutes: RouteObject[] = ORDER.filter((name) => grouped[name]?.length).map((name) => ({
    element: LAYOUT_ELEMENT[name],
    children: grouped[name],
}));

const router = createBrowserRouter(finalRoutes);

export default router;
