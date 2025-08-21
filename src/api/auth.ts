import api from './axios';
import { LoginRequest, LoginResponse } from '../types/auth';

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/login', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/logout');
};