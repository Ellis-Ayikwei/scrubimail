import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import FlexibleLayout from '../components/Layouts/FlexibleLayout';
import AdminLayout from '../components/AdminLayout';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element:
            route.layout === 'blank' ? (
                <BlankLayout>{route.element}</BlankLayout>
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
