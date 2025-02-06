const env = import.meta.env.MODE;
export const apiUrl = env === 'development' ? 'http://localhost:5000' : import.meta.env.VITE_APP_API_URL;
export const socketServer = env === 'development' ? 'ws://localhost:5000' : `wss://${import.meta.env.VITE_APP_SOCKET_SERVER}`;