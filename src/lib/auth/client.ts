'use client';

import type { User } from '@/types/user';
import { api, getToken, setToken } from '@/lib/api';

export interface SignInWithPasswordParams {
  email: string;
  senha: string;
}

class AuthClient {
  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    const { email, senha } = params;

    try {
      const { token } = await api<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      setToken(token);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Não foi possível entrar' };
    }
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    if (!getToken()) {
      return { data: null };
    }

    try {
      const usuario = await api<User>('/auth/me');
      return { data: usuario };
    } catch {
      setToken(null);
      return { data: null };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    setToken(null);
    return {};
  }
}

export const authClient = new AuthClient();
