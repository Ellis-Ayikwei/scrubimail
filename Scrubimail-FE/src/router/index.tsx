import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element:
            route.layout === 'blank' ? (
                route.element
            ) : route.layout === 'admin' ? (
                <AdminLayout>{route.element}</AdminLayout>
            ) : (
                <Layout>{route.element}</Layout>
            ),
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
