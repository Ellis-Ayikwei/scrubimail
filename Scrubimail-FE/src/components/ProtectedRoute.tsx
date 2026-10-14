import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { authAxiosInstance } from '../services/authAxiosInstance';
import IconLoader from './Icon/IconLoader';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const [checkingSession, setCheckingSession] = useState(isAuthenticated);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      setCheckingSession(false);
      setSessionValid(false);
      return () => {
        active = false;
      };
    }

    setCheckingSession(true);
    authAxiosInstance
      .get('/user/')
      .then(() => {
        if (active) setSessionValid(true);
      })
      .catch(() => {
        if (active) setSessionValid(false);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center app-bg">
        <IconLoader />
      </div>
    );
  }

  if (!isAuthenticated || !sessionValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 