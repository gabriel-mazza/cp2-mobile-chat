import { MAX_MEMBER_LIMIT, MIN_GROUP_MEMBERS } from '../types/group';

export function validateGroupName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'O nome do grupo precisa ter ao menos 3 caracteres.';
  if (trimmed.length > 40) return 'O nome do grupo pode ter no máximo 40 caracteres.';
  return null;
}

export function parseMemberLimit(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  return Number(raw.trim());
}

export function validateMemberLimit(raw: string, currentMembers: number): string | null {
  const value = parseMemberLimit(raw);
  if (value === null) return 'O limite deve ser um número inteiro.';
  if (value < MIN_GROUP_MEMBERS) return `O limite mínimo é ${MIN_GROUP_MEMBERS} integrantes.`;
  if (value > MAX_MEMBER_LIMIT) return `O limite máximo é ${MAX_MEMBER_LIMIT} integrantes.`;
  if (value < currentMembers) {
    return `O limite não pode ser menor que a quantidade atual de integrantes (${currentMembers}).`;
  }
  return null;
}

export function availableSlots(limit: number, members: number): number {
  return Math.max(0, limit - members);
}

export function formatSlots(limit: number, members: number): string {
  const slots = availableSlots(limit, members);
  if (slots === 0) return `${members}/${limit} integrantes — grupo sem vagas`;
  return `${members}/${limit} integrantes — ${slots} ${slots === 1 ? 'vaga disponível' : 'vagas disponíveis'}`;
}
