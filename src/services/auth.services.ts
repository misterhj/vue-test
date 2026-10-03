import { ref } from 'vue';
import api from "./api";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
}

export interface LoginDto {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterDto {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    identityDocument?: string;
    telephone?: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token?: string;
    user?: User;
}

const storedUser = localStorage.getItem('auth_user');

export const isAuthenticated = ref<boolean>(!!localStorage.getItem('auth_token'));
export const currentUser = ref<User | null>(storedUser ? JSON.parse(storedUser) : null);

export const authService = {
    async login(data: LoginDto): Promise<AuthResponse> {
        const response = await api.post('/auth/login', data);
        if (response.data.access_token) {
            this.setSession(response.data);
        }
        return response.data;
    },

    async register(data: RegisterDto): Promise<{ message: string }> {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No hay refresh_token disponible');
        }

        // Se usa axios directo o la instancia api omitiendo reintentos
        const response = await api.post('/auth/refresh', { refreshToken });
        if (response.data.access_token) {
            this.setSession(response.data);
        }
        return response.data;
    },

    setSession(authData: AuthResponse) {
        if (authData.access_token) {
            localStorage.setItem('auth_token', authData.access_token);
        }
        if (authData.refresh_token) {
            localStorage.setItem('refresh_token', authData.refresh_token);
        }
        if (authData.user) {
            localStorage.setItem('auth_user', JSON.stringify(authData.user));
            currentUser.value = authData.user;
        }
        isAuthenticated.value = true;
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        } finally {
            this.clearSession();
        }
    },

    clearSession(): void {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        isAuthenticated.value = false;
        currentUser.value = null;
    }
};