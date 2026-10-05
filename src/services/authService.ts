import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { Unsubscribe, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { uploadImage } from './storageService';
import { ChatUser, RegisterInput } from '../types/user';
import { isRecord, toChatUser } from '../utils/parsers';

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}


export function observeProfile(
  uid: string,
  onProfile: (profile: ChatUser | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      const data: unknown = snap.data();
      onProfile(snap.exists() && isRecord(data) ? toChatUser(uid, data) : null);
    },
    onError,
  );
}

export async function registerWithEmail(input: RegisterInput): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const uid = credential.user.uid;
  try {
    const photoUrl = input.photoUri ? await uploadImage(input.photoUri, 'chat/profilePhotos') : '';
    const createdAt = Date.now();
    const name = input.name.trim();

    
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), {
      uid,
      name,
      email: input.email.trim(),
      phoneNumber: input.phoneNumber.replace(/\D/g, ''),
      birthDate: input.birthDate,
      photoUrl,
      createdAt,
    });
    batch.set(doc(db, 'userDirectory', uid), { uid, name, nameLower: name.toLowerCase(), photoUrl, createdAt });
    await batch.commit();
  } catch (error) {
    
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}
