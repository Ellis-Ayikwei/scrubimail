import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../store';
import { toggleSidebar } from '../store/themeConfigSlice';
import TopBar from './TopBar';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const dispatch = useDispatch();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar overlay for mobile */}
      <div 
        className={`${(!themeConfig.sidebar && 'hidden') || ''} fixed inset-0 bg-black/60 z-40 lg:hidden`} 
        onClick={() => dispatch(toggleSidebar())}
      />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className={`transition-all duration-300 ${themeConfig.sidebar ? 'lg:ltr:ml-[220px] lg:rtl:mr-[220px]' : ''}`}>
        <TopBar />
        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout; 