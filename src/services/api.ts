import axios from 'axios';
import router from '@/router';
import { authService } from './auth.services';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables para controlar la cola de peticiones durante la renovación
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Respuestas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Verificar si es un error 401 y no es un reintento o llamada a login/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Si ya hay un refresco en curso, encolar esta petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const data = await authService.refreshToken();
        const newToken = data.access_token;

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_permissions');
        router.push({ name: 'login' });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

	if (error.response?.data?.message) {
		const serverMessage = error.response.data.message;

		error.message = Array.isArray(serverMessage) 
			? serverMessage.join(', ') 
			: serverMessage;
	}

    return Promise.reject(error);
  }
);

export default api;