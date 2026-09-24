import { config } from '@/config';

const TOKEN_KEY = 'apta_token';

export function getToken(): string | null {
  if (globalThis.window === undefined) {
    return null;
  }
  return globalThis.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (globalThis.window === undefined) {
    return;
  }
  if (token) {
    globalThis.localStorage.setItem(TOKEN_KEY, token);
  } else {
    globalThis.localStorage.removeItem(TOKEN_KEY);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.erro === 'string' ? body.erro : `Erro ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
