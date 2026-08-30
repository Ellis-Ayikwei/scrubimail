import { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import App from '../../App';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import TopBar from '../TopBar';
import AppShell from '../app/AppShell';
import Footer from '../Footer';
import IconLoader from '../Icon/IconLoader';

interface AuthUser {
    user: {
        id: string;
        email: string;
        user_type?: string;
        name?: string;
    };
}

const FlexibleLayout = ({ children }: PropsWithChildren) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const isAuthenticated = useIsAuthenticated();
    console.log('isAuthenticated:', isAuthenticated);
    const authUser = useAuthUser() as AuthUser | null;
    console.log("the auth user", authUser?.user);
    console.log("the auth user", authUser);

    const [showLoader, setShowLoader] = useState(true);
    const [showTopButton, setShowTopButton] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const goToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const onScrollHandler = () => {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            setShowTopButton(true);
        } else {
            setShowTopButton(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', onScrollHandler);

        const screenLoader = document.getElementsByClassName('screen_loader');
        if (screenLoader?.length) {
            screenLoader[0].classList.add('animate__fadeOut');
            setTimeout(() => {
                setShowLoader(false);
            }, 200);
        }

        return () => {
            window.removeEventListener('scroll', onScrollHandler);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Signed in: these pages (API docs, integrations, pricing, ...) are reachable
    // from the product sidebar, so they render in the same AppShell chrome rather
    // than swapping to a second sidebar mid-session.
    if (isAuthenticated && authUser) {
        return (
            <App>
                <AppShell>
                    <Suspense>{children}</Suspense>
                </AppShell>
            </App>
        );
    }

    // If user is not authenticated, show a simple layout without sidebar
    return (
        <App>
            <div className="text-black dark:text-white-dark min-h-screen bg-white dark:bg-black">
                <TopBar />
                {/* Main content */}
                <main className="min-h-screen">{children}</main>

                {/* Footer for non-authenticated users */}
                <Footer />
            </div>
        </App>
    );
};

export default FlexibleLayout;

