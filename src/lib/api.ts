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

/** Erro da API com o status e o corpo (ex.: avisos de duplicidade num 409). */
export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
    public corpo: unknown
  ) {
    super(message);
    this.name = 'ErroApi';
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
    throw new ErroApi(typeof body?.erro === 'string' ? body.erro : `Erro ${res.status}`, res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
