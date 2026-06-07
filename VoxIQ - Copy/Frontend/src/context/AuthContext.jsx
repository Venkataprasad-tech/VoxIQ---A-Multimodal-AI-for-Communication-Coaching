import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('voxiq_token') ?? null);
  const [loading, setLoading] = useState(true);

  /* ── restore user session whenever token changes ── */
  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('voxiq_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  /* ── email/password login ── */
  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('voxiq_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  /* ── register ── */
  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    localStorage.setItem('voxiq_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  /* ── Google OAuth — called from HomePage after redirect ── */
  const loginWithGoogle = () => {
    authAPI.googleOAuth(); // redirects browser to Google
  };

  /* ── called from HomePage after Google redirects back with ?token= ── */
  const setGoogleToken = (newToken) => {
    localStorage.setItem('voxiq_token', newToken);
    setToken(newToken); // triggers useEffect → fetches user → sets avatar
  };

  /* ── logout ── */
  const logout = () => {
    localStorage.removeItem('voxiq_token');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, register, loginWithGoogle, setGoogleToken, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};