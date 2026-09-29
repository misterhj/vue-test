import{ ref } from 'vue';
import api from "./api";

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
}

export const isAuthenticated = ref<boolean>(!!localStorage.getItem('auth_token'));

export const authService = {
    async login(data: LoginDto): Promise<AuthResponse> {
        const response = await api.post('/auth/login', data);
        if(response.data.access_token){
            localStorage.setItem('auth_token', response.data.access_token);
            isAuthenticated.value = true;
        }
        return response.data;
    },

    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await api.post('/auth/register', data);
        if (response.data.access_token) {
            localStorage.setItem('auth_token', response.data.access_token);
            isAuthenticated.value = true; // Notifica el cambio de estado
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('auth_token');
        isAuthenticated.value = false;
    }

}