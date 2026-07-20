import axios from 'axios';

console.log('VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',

    headers: {
        'Content-Type': 'application/json',
        // PENTING: Header ini digunakan untuk melewati halaman peringatan ngrok
        // saat pertama kali diakses oleh aplikasi frontend
        'ngrok-skip-browser-warning': 'true'
    }
});

// Interceptor untuk menambahkan token JWT secara otomatis ke request header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor response untuk menangani error 401 (Unauthorized / Token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Token JWT kedaluwarsa atau tidak valid. Mengosongkan token dan mengarahkan ke login...");
            localStorage.removeItem('userToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userFullName');
            localStorage.removeItem('userId');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
