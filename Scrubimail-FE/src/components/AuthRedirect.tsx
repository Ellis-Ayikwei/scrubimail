import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

interface AuthRedirectProps {
  children: React.ReactNode;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const authUser = useAuthUser();

  // If user is authenticated, redirect to dashboard
  // if (authUser) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  // If not authenticated, show the auth page
  return <>{children}</>;
};

export default AuthRedirect; 