import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const adminToken = localStorage.getItem('mr_token');
  const customerToken = localStorage.getItem('mr_customer_token');
  const token = adminToken || customerToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
