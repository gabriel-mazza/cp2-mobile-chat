export type ChatUser = {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  birthDate: string; // ISO yyyy-mm-dd
  photoUrl: string;
  createdAt: number;
};

/** Dados mínimos visíveis a qualquer usuário autenticado (userDirectory). */
export type PublicUser = {
  uid: string;
  name: string;
  nameLower: string;
  photoUrl: string;
  createdAt: number;
};

/** Perfil entregue pela API somente a quem compartilha conversa/grupo. */
export type UserProfile = {
  uid: string;
  name: string;
  photoUrl: string;
  email: string | null;
  phoneNumber: string | null;
  birthDate: string | null;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  birthDate: string; // ISO yyyy-mm-dd
  photoUri: string | null;
};
