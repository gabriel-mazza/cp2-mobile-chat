import { firestore } from './firebaseAdmin';
import { buildDirectConversationId } from './directConversations';
import { asString } from '../utils/parse';

export type SharedProfile = {
  uid: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  birthDate: string | null;
  photoUrl: string;
};

export async function shareConversation(a: string, b: string): Promise<boolean> {
  if (a === b) return true;
  const direct = await firestore.collection('directConversations').doc(buildDirectConversationId(a, b)).get();
  if (direct.exists) return true;
  const groups = await firestore.collection('groups').where('memberIds', 'array-contains', a).get();
  return groups.docs.some((doc) => {
    const members: unknown = doc.data().memberIds;
    return Array.isArray(members) && members.includes(b);
  });
}

export async function loadSharedProfile(uid: string): Promise<SharedProfile | null> {
  const snap = await firestore.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  const orNull = (value: unknown): string | null => {
    const text = asString(value);
    return text.length > 0 ? text : null;
  };
  return {
    uid,
    name: asString(data.name),
    email: orNull(data.email),
    phoneNumber: orNull(data.phoneNumber),
    birthDate: orNull(data.birthDate),
    photoUrl: asString(data.photoUrl),
  };
}
