import { io } from 'socket.io-client';
import { CONFIG } from '../config';

const ENDPOINT = CONFIG.SOCKET_ENDPOINT;
let socket;

export const initSocket = (userData) => {
  socket = io(ENDPOINT);
  socket.emit('setup', userData);
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
