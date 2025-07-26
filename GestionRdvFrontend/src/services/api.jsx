
import axios from 'axios';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: false, // false car tu utilises des tokens Bearer, pas les cookies Sanctum
  headers: {
    Accept: "application/json",
  },
});

// Ajout automatique du token dans les requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
