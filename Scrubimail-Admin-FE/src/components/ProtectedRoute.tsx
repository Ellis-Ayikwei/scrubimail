import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

/** The API is the real authority (every admin endpoint uses DRF's IsAdminUser);
 *  this only keeps a non-admin out of a shell that would otherwise render
 *  nothing but permission errors. Any signed-in customer used to land here —
 *  including by signing in with a social provider on the admin origin.
 *
 *  Deliberately gated on is_staff, the exact flag IsAdminUser checks, so the
 *  client's idea of "admin" cannot drift from the server's. `user_type` is a
 *  display label and is NOT authorization. */
export const isAdminUser = (user: any): boolean =>
  Boolean(user && (user.is_staff || user.is_superuser));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const authUser = useAuthUser() as any;
  const location = useLocation();

  if (!isAuthenticated) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  if (!isAdminUser(authUser)) {
    return <Navigate to="/login?error=not_admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
