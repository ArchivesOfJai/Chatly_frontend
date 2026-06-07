import axios from 'axios';
import { CONFIG } from '../config';

const API = axios.create({
  baseURL: CONFIG.API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
