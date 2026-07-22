import { get, post } from './client';
import type { User, ApiResponse } from '@omniplan/shared';

interface AuthResult {
  user: User;
  api_key: string;
}

export function register(username: string, displayName: string) {
  return post<ApiResponse<AuthResult>>('/api/auth/register', { username, display_name: displayName });
}

export function login(username: string) {
  return post<ApiResponse<AuthResult>>('/api/auth/login', { username });
}

export function verifyToken(signal?: AbortSignal) {
  return get<ApiResponse<{ user: User }>>('/api/auth/verify', signal);
}
