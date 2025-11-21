import axios from 'axios';

const baseURL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://colegiocandelaria.edu.gt/api"
    : "http://localhost:4000/api");

const apiClient = axios.create({
  baseURL,
});

console.log("Base URL:", apiClient.defaults.baseURL);

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
