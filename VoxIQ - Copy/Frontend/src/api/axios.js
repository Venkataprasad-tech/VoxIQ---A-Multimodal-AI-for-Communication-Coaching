import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
}); 

/* ── attach JWT token on every request ── */
api.interceptors.request.use(config => {
  const token = localStorage.getItem('voxiq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── global response error handler ── */
api.interceptors.response.use(
  res => res,
  err => {
    // Only redirect on 401 if we actually have a response
    if (err.response?.status === 401) {
      localStorage.removeItem('voxiq_token');
      window.location.href = '/login';
    }

    // Always reject with a proper Error so catch blocks get a message
    const message =
      err.response?.data?.detail ||   // FastAPI validation error
      err.response?.data?.message ||  // custom message field
      err.response?.data?.error ||    // custom error field
      err.message ||                  // axios network error
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

export default api;