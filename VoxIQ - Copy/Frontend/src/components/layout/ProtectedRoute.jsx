import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProtectedRoute.css';

/*
  ProtectedRoute wraps any page that requires login.
  - While AuthContext is loading (checking stored token) → show spinner
  - If user is authenticated → show the page
  - If user is NOT authenticated → redirect to /login
*/
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="protected-loader">
        <div className="protected-spinner" />
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}