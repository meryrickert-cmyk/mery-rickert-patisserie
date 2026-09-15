import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const adminToken = localStorage.getItem('mr_token');
  const customerToken = localStorage.getItem('mr_customer_token');
  const token = adminToken || customerToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401, la sesión expiró → redirigir al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('mr_token');
      window.location.href = '/admin/login?expired=1';
    }
    return Promise.reject(err);
  }
);

export default api;
