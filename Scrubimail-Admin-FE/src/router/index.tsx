import { createBrowserRouter } from 'react-router-dom';
import AdminShell from '@/components/layout/admin-shell';
import { routes } from './routes';

/**
 * `blank` routes (auth, error pages) render bare; everything else is wrapped in
 * the admin chrome.
 */
const finalRoutes = routes.map((route) => ({
    ...route,
    element: route.layout === 'blank' ? route.element : <AdminShell>{route.element}</AdminShell>,
}));

const router = createBrowserRouter(finalRoutes);

export default router;
