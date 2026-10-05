import { firestore } from './firebaseAdmin';
import { syncConversationMembers } from './conversationLoader';
import { HttpError } from '../utils/httpError';

export function buildDirectConversationId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export async function getOrCreateDirectConversation(uid: string, otherUid: string): Promise<string> {
  if (uid === otherUid) {
    throw new HttpError(400, 'SELF_CONVERSATION', 'Você não pode conversar consigo mesmo.');
  }
  const other = await firestore.collection('userDirectory').doc(otherUid).get();
  if (!other.exists) throw new HttpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');

  const id = buildDirectConversationId(uid, otherUid);
  const ref = firestore.collection('directConversations').doc(id);
  const participantIds = [uid, otherUid].sort();

  // Transação: nunca existem duas conversas para o mesmo par (id determinístico).
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) tx.set(ref, { participantIds, createdAt: Date.now() });
  });
  await syncConversationMembers(id, participantIds);
  return id;
}
