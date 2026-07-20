import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children, allowedRoles }) {
  const userRole = localStorage.getItem('userRole');
  const userToken = localStorage.getItem('userToken');

  if (!userToken || !userRole) {
    // Redirect to login if token or role is missing
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to dashboard if user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const userRole = localStorage.getItem('userRole');
  const userToken = localStorage.getItem('userToken');

  if (userToken && userRole) {
    // Redirect to dashboard if already logged in
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
