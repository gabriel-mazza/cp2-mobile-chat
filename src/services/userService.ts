import { Unsubscribe, collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { apiRequest } from './apiClient';
import { db } from './firebase';
import { PublicUser, UserProfile } from '../types/user';
import { AppError } from '../utils/errors';
import { asString, isRecord, toPublicUser } from '../utils/parsers';

export function observeUserDirectory(
  onData: (users: PublicUser[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, 'userDirectory'), orderBy('nameLower'));
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => toPublicUser(d.id, d.data()))),
    onError,
  );
}

type ProfileResponse = { profile: UserProfile };

/**
 * Perfil próprio: lido direto do Firestore.
 * Perfil de outra pessoa: lido pela API, que só entrega se houver conversa/grupo em comum.
 */
export async function fetchUserProfile(userId: string, myUid: string): Promise<UserProfile> {
  if (userId === myUid) {
    const snap = await getDoc(doc(db, 'users', myUid));
    const data: unknown = snap.data();
    if (!snap.exists() || !isRecord(data)) {
      throw new AppError('NOT_FOUND', 'Perfil não encontrado.');
    }
    const orNull = (v: unknown): string | null => (asString(v) ? asString(v) : null);
    return {
      uid: myUid,
      name: asString(data.name),
      photoUrl: asString(data.photoUrl),
      email: orNull(data.email),
      phoneNumber: orNull(data.phoneNumber),
      birthDate: orNull(data.birthDate),
    };
  }
  const response = await apiRequest<ProfileResponse>(`/users/${encodeURIComponent(userId)}/profile`);
  return response.profile;
}
