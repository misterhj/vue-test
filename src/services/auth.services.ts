import api from "./api";

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

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
}

export interface AuthResponse {
    access_token: string;
    refresh_token?: string;
    user: User;
}

export const authService = {
    async login(data: LoginDto): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    async register(data: RegisterDto): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/auth/register', data);
        return response.data;
    },

    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = localStorage.getItem('auth_refresh_token'); // 👈 Clave corregida
        if (!refreshToken) {
            throw new Error('No hay refresh_token disponible');
        }

        const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
        return response.data;
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        }
    },
};