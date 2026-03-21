import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
    console.warn('NEXT_PUBLIC_API_URL is not set, defaulting to localhost:5000');
}

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
                    localStorage.setItem('accessToken', res.data.accessToken);
                    localStorage.setItem('refreshToken', res.data.refreshToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
                    return api(originalRequest);
                } catch (_refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
