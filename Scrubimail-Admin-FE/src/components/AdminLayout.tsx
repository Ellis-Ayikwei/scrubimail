import React from 'react';
import Layout from './Layout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export default AdminLayout;