import api from './api';
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/api/auth/login', data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/api/auth/register', data);
    return res.data;
  },

  async getMe(): Promise<UserResponse> {
    const res = await api.get<UserResponse>('/api/auth/me');
    return res.data;
  },
};
