const env = process.env.NODE_ENV;
export const apiUrl = env === 'development' ? 'http://localhost:5000' : process.env.REACT_APP_API_URL;