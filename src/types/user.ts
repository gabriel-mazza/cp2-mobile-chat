export type ChatUser = {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  photoUrl: string;
  createdAt: number;
};


export type PublicUser = {
  uid: string;
  name: string;
  nameLower: string;
  photoUrl: string;
  createdAt: number;
};


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
  birthDate: string;
  photoUri: string | null;
};
