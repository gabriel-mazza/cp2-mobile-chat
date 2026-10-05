import { firestore } from './firebaseAdmin';
import { loadConversation, loadMessage } from './conversationLoader';
import { sendPush } from './notificationSender';
import { resolveRecipients } from './recipientResolver';
import { DeviceTarget, PushProvider } from '../types';
import { HttpError } from '../utils/httpError';
import { asString, isRecord } from '../utils/parse';

export type DispatchResult = {
  status: 'sent' | 'duplicate' | 'no_recipients' | 'no_devices';
  recipients: number;
  sent: number;
  failed: number;
};

function isAlreadyExists(error: unknown): boolean {
  if (!isRecord(error)) return false;
  return error.code === 6 || error.code === 'already-exists';
}

function isPushProvider(value: unknown): value is PushProvider {
  return value === 'fcm' || value === 'expo';
}

async function loadDevices(userIds: readonly string[]): Promise<DeviceTarget[]> {
  const snapshots = await Promise.all(
    userIds.map((uid) =>
      firestore.collection('users').doc(uid).collection('devices').where('enabled', '==', true).get(),
    ),
  );
  const devices: DeviceTarget[] = [];
  snapshots.forEach((snapshot, index) => {
    const uid = userIds[index];
    if (!uid) return;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const token = asString(data.token);
      const provider: unknown = data.provider;
      if (token && isPushProvider(provider)) {
        devices.push({ uid, deviceId: doc.id, token, provider });
      }
    });
  });
  return devices;
}

async function displayName(uid: string): Promise<string> {
  const snap = await firestore.collection('userDirectory').doc(uid).get();
  const name = asString(snap.data()?.name);
  return name || 'Alguém';
}

export async function dispatchMessageNotification(
  authenticatedUid: string,
  conversationId: string,
  messageId: string,
): Promise<DispatchResult> {
  // 1) A conversa existe e o usuário autenticado participa (lido do Firestore).
  const conversation = await loadConversation(conversationId);
  if (!conversation) {
    throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversa não encontrada.');
  }
  if (!conversation.participants.includes(authenticatedUid)) {
    throw new HttpError(403, 'FORBIDDEN', 'Você não participa desta conversa.');
  }

  // 2) A mensagem existe no Realtime Database e pertence ao usuário autenticado.
  const message = await loadMessage(conversationId, messageId);
  if (!message) {
    throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Mensagem não encontrada.');
  }
  if (message.senderId !== authenticatedUid) {
    throw new HttpError(403, 'FORBIDDEN', 'A mensagem não pertence ao usuário autenticado.');
  }

  // 3) Idempotência: create() falha se o documento já existir, mesmo com requisições concorrentes.
  const logRef = firestore.collection('notificationDeliveries').doc(`${conversationId}__${messageId}`);
  try {
    await logRef.create({ status: 'processing', senderId: authenticatedUid, createdAt: Date.now() });
  } catch (error) {
    if (isAlreadyExists(error)) {
      return { status: 'duplicate', recipients: 0, sent: 0, failed: 0 };
    }
    throw error;
  }

  try {
    // 4) Destinatários calculados no servidor (nunca confiamos em lista vinda do app).
    const recipientIds = resolveRecipients({
      conversationType: conversation.type,
      participants: conversation.participants,
      policy: conversation.policy,
      senderId: authenticatedUid,
      target: message.target,
      mentionedUserIds: message.mentionedUserIds,
    });

    if (recipientIds.length === 0) {
      await logRef.update({ status: 'no_recipients', finishedAt: Date.now() });
      return { status: 'no_recipients', recipients: 0, sent: 0, failed: 0 };
    }

    const devices = await loadDevices(recipientIds);
    if (devices.length === 0) {
      await logRef.update({ status: 'no_devices', recipients: recipientIds.length, finishedAt: Date.now() });
      return { status: 'no_devices', recipients: recipientIds.length, sent: 0, failed: 0 };
    }

    // 5) Texto genérico: o conteúdo da mensagem não vai na notificação.
    const senderName = await displayName(authenticatedUid);
    const title = conversation.type === 'group' ? (conversation.name ?? 'Grupo') : senderName;
    const body = conversation.type === 'group' ? `${senderName} enviou uma mensagem` : 'Nova mensagem';

    const result = await sendPush(devices, {
      title,
      body,
      data: {
        conversationId,
        conversationType: conversation.type,
        messageId,
      },
    });

    // 6) Tokens inválidos são desativados.
    await Promise.all(
      result.invalid.map((device) =>
        firestore
          .collection('users')
          .doc(device.uid)
          .collection('devices')
          .doc(device.deviceId)
          .update({ enabled: false, disabledReason: 'invalid_token', updatedAt: Date.now() })
          .catch(() => undefined),
      ),
    );

    await logRef.update({
      status: 'sent',
      recipients: recipientIds.length,
      sent: result.sent,
      failed: result.failed,
      finishedAt: Date.now(),
    });

    return { status: 'sent', recipients: recipientIds.length, sent: result.sent, failed: result.failed };
  } catch (error) {
    // Libera o registro para que o app possa tentar de novo.
    await logRef.delete().catch(() => undefined);
    throw error;
  }
}
