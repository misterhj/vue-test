import api from './api';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  identityDocument?: string | null;
  telephone?: string | null;
  password?: string;
}

export interface UserProfileResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  identityDocument: string | null;
  telephone: string | null;
  avatar: string | null;
}

export const userService = {
  async getProfile(): Promise<UserProfileResponseDto> {
    const response = await api.get<UserProfileResponseDto>('/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfilePayload): Promise<UserProfileResponseDto> {
    const response = await api.patch<UserProfileResponseDto>('/users/me', data);
    return response.data;
  }
};