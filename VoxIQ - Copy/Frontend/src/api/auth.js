import api from './axios';

export const authAPI = {

  /* ── Login — FastAPI OAuth2 expects form-encoded body ── */
  login: async (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);   // FastAPI OAuth2 field is "username"
    form.append('password', password);
    const res = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  /* ── Register — sends full_name to match backend schema ── */
  register: async (name, email, password) => {
    const res = await api.post('/api/auth/register', {
      name,   // matches RegisterRequest schema in FastAPI
      email,
      password,
    });
    return res.data;
  },

  /* ── Get current user ── */
  getMe: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  /* ── Google OAuth — redirects to FastAPI which handles Google flow ── */
  googleOAuth: () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || 'http://localhost:8001'
    }/api/auth/google`;
  },
};