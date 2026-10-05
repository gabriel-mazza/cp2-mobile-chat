export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Informe seu nome.';
  if (trimmed.length > 60) return 'O nome pode ter no máximo 60 caracteres.';
  return null;
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Informe um e-mail válido.';
}

export function validatePassword(password: string): string | null {
  return password.length >= 6 ? null : 'A senha precisa ter ao menos 6 caracteres.';
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? null : 'Informe o celular com DDD.';
}

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskDate(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}


export function parseBirthDate(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!valid) return null;
  const now = new Date();
  if (date > now || year < now.getFullYear() - 120) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function validateBirthDate(input: string): string | null {
  return parseBirthDate(input) ? null : 'Informe uma data válida (dd/mm/aaaa).';
}

export function formatBirthDate(iso: string | null): string {
  if (!iso) return 'Não disponível';
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : 'Não disponível';
}
