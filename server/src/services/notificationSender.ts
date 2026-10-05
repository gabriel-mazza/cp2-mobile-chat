import { messaging } from './firebaseAdmin';
import { DeviceTarget } from '../types';
import { asString, isRecord } from '../utils/parse';

export type PushPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
};

export type SendResult = {
  sent: number;
  failed: number;
  invalid: DeviceTarget[];
};

const FCM_INVALID_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}


async function sendViaFcm(devices: DeviceTarget[], payload: PushPayload): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, invalid: [] };
  for (const group of chunk(devices, 500)) {
    const response = await messaging.sendEach(
      group.map((device) => ({
        token: device.token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: {
          priority: 'high' as const,
          notification: { channelId: 'default' },
        },
      })),
    );
    response.responses.forEach((item, index) => {
      const device = group[index];
      if (!device) return;
      if (item.success) {
        result.sent += 1;
        return;
      }
      result.failed += 1;
      const code = item.error?.code ?? '';
      if (FCM_INVALID_CODES.has(code)) result.invalid.push(device);
    });
  }
  return result;
}


async function sendViaExpo(devices: DeviceTarget[], payload: PushPayload): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, invalid: [] };
  for (const group of chunk(devices, 100)) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        group.map((device) => ({
          to: device.token,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: 'default',
          channelId: 'default',
          priority: 'high',
        })),
      ),
    });
    const json: unknown = await response.json().catch(() => null);
    const tickets: unknown[] = isRecord(json) && Array.isArray(json.data) ? json.data : [];
    group.forEach((device, index) => {
      const ticket = tickets[index];
      if (isRecord(ticket) && ticket.status === 'ok') {
        result.sent += 1;
        return;
      }
      result.failed += 1;
      if (isRecord(ticket) && isRecord(ticket.details)) {
        if (asString(ticket.details.error) === 'DeviceNotRegistered') result.invalid.push(device);
      }
    });
  }
  return result;
}

export async function sendPush(devices: DeviceTarget[], payload: PushPayload): Promise<SendResult> {
  const fcm = devices.filter((d) => d.provider === 'fcm');
  const expo = devices.filter((d) => d.provider === 'expo');
  const [a, b] = await Promise.all([
    fcm.length > 0 ? sendViaFcm(fcm, payload) : Promise.resolve<SendResult>({ sent: 0, failed: 0, invalid: [] }),
    expo.length > 0 ? sendViaExpo(expo, payload) : Promise.resolve<SendResult>({ sent: 0, failed: 0, invalid: [] }),
  ]);
  return {
    sent: a.sent + b.sent,
    failed: a.failed + b.failed,
    invalid: [...a.invalid, ...b.invalid],
  };
}
