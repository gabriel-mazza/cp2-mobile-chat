import { isRecord } from './parsers';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const FIREBASE_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha é muito fraca. Use ao menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/user-token-expired': 'Sua sessão expirou. Entre novamente.',
  'auth/requires-recent-login': 'Sua sessão expirou. Entre novamente.',
  'permission-denied': 'Você não tem permissão para realizar esta ação.',
  'PERMISSION_DENIED': 'Você não tem permissão para realizar esta ação.',
  unavailable: 'Serviço indisponível. Verifique sua conexão.',
};


export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof AppError) return error.message;
  if (isRecord(error) && typeof error.code === 'string') {
    const mapped = FIREBASE_MESSAGES[error.code];
    if (mapped) return mapped;
  }
  return 'Algo deu errado. Tente novamente.';
}
