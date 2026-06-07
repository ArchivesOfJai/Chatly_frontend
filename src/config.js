/**
 * Connection and Configuration constants for the frontend
 */

export const CONFIG = {
  // API and Socket URLs
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  SOCKET_ENDPOINT: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  
  // Storage Keys
  TOKEN_KEY: 'chat_app_token',
  USER_KEY: 'chat_app_user',
  
  // Asset Paths
  UPLOADS_URL: (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000') + '/uploads',
};

export default CONFIG;
