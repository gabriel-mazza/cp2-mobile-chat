import { auth } from './firebase';
import { ApiError } from '../utils/errors';
import { isRecord } from '../utils/parsers';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 15000;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

function extractMessage(payload: unknown, status: number): { code: string; message: string } {
  if (isRecord(payload) && isRecord(payload.error)) {
    const { code, message } = payload.error;
    if (typeof code === 'string' && typeof message === 'string') return { code, message };
  }
  if (status === 401) return { code: 'UNAUTHENTICATED', message: 'Sua sessão expirou. Entre novamente.' };
  return { code: 'HTTP_ERROR', message: 'O servidor não conseguiu concluir a operação.' };
}


export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError('API_NOT_CONFIGURED', 'A URL da API não foi configurada (EXPO_PUBLIC_API_URL).', 0);
  }
  const user = auth.currentUser;
  if (!user) {
    throw new ApiError('UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.', 401);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const token = await user.getIdToken();
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const { code, message } = extractMessage(payload, response.status);
      throw new ApiError(code, message, response.status);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('NETWORK', 'Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  } finally {
    clearTimeout(timer);
  }
}
