import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { apiRequest } from './apiClient';
import { db } from './firebase';
import { NotificationTarget, PushProvider, PushRegistrationStatus } from '../types/notification';
import { AppError } from '../utils/errors';
import { isConversationType, isRecord } from '../utils/parsers';

const DEVICE_ID_KEY = 'chat.deviceId';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function getDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const generated = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

type PushToken = { token: string; provider: PushProvider };

async function getPushToken(): Promise<PushToken> {
  if (Platform.OS === 'android') {
    const native = await Notifications.getDevicePushTokenAsync();
    if (typeof native.data !== 'string' || native.data.length === 0) {
      throw new AppError('NO_TOKEN', 'Este dispositivo não retornou um token de notificação.');
    }
    return { token: native.data, provider: 'fcm' };
  }
  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== 'string') {
    throw new AppError('NO_PROJECT_ID', 'Configure o projectId do EAS no app.json.');
  }
  const expo = await Notifications.getExpoPushTokenAsync({ projectId });
  return { token: expo.data, provider: 'expo' };
}

async function saveDevice(uid: string, push: PushToken): Promise<void> {
  const deviceId = await getDeviceId();
  await setDoc(doc(db, 'users', uid, 'devices', deviceId), {
    token: push.token,
    provider: push.provider,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    enabled: true,
    updatedAt: Date.now(),
  });
}


export async function registerDevice(uid: string): Promise<PushRegistrationStatus> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return 'unavailable';
 
  if (!Device.isDevice && Platform.OS === 'ios') return 'unavailable';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Mensagens',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') {
    await unregisterDevice(uid);
    return 'denied';
  }

  await saveDevice(uid, await getPushToken());
  return 'registered';
}


export async function unregisterDevice(uid: string): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await deleteDoc(doc(db, 'users', uid, 'devices', deviceId));
  } catch {
    
  }
}


export function observeTokenRefresh(uid: string): () => void {
  const subscription = Notifications.addPushTokenListener((token) => {
    if (Platform.OS === 'android' && typeof token.data === 'string') {
      void saveDevice(uid, { token: token.data, provider: 'fcm' }).catch(() => undefined);
    }
  });
  return () => subscription.remove();
}


export async function requestMessagePush(conversationId: string, messageId: string): Promise<void> {
  await apiRequest<unknown>('/notifications/messages', {
    method: 'POST',
    body: { conversationId, messageId },
  });
}

function parseTarget(data: unknown): NotificationTarget | null {
  if (!isRecord(data)) return null;
  const { conversationId, conversationType } = data;
  if (typeof conversationId === 'string' && isConversationType(conversationType)) {
    return { conversationId, conversationType };
  }
  return null;
}

export function extractNotificationTarget(response: Notifications.NotificationResponse): NotificationTarget | null {
  const request = response.notification.request;
  const fromContent = parseTarget(request.content.data);
  if (fromContent) return fromContent;
  const trigger = request.trigger;
  if (trigger && 'type' in trigger && trigger.type === 'push') {
    return parseTarget(trigger.remoteMessage?.data);
  }
  return null;
}