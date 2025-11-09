import axios from 'axios';

const api = axios.create({
baseURL: 'https://colegiocandelaria.edu.gt/api',
});

export default api;
