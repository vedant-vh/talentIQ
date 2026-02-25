import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('Missing VITE_API_URL environment variable');
}

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true //by adding this field browser will send cookies to server automatically on every request
});

export default axiosInstance;