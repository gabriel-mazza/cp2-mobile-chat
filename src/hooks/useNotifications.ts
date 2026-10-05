import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  extractNotificationTarget,
  observeTokenRefresh,
  registerDevice,
} from '../services/notificationService';
import { PushRegistrationStatus } from '../types/notification';
import { RootStackParamList } from '../types/navigation';
import { ChatUser } from '../types/user';
import { getErrorMessage } from '../utils/errors';


export function useNotifications(user: ChatUser | null) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [status, setStatus] = useState<PushRegistrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);
  const uid = user?.uid ?? null;

  const register = useCallback(async () => {
    if (!uid) return;
    setStatus('registering');
    setError(null);
    try {
      setStatus(await registerDevice(uid));
    } catch (e) {
      setStatus('error');
      setError(getErrorMessage(e));
    }
  }, [uid]);

  useEffect(() => {
    void register();
  }, [register]);

  useEffect(() => {
    if (!uid) return undefined;
    return observeTokenRefresh(uid);
  }, [uid]);

  useEffect(() => {
    if (!lastResponse || !uid) return;
    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) return;
    handledId.current = id;
    const target = extractNotificationTarget(lastResponse);
    if (target) navigation.push('Chat', target);
  }, [lastResponse, uid, navigation]);

  return { status, error, retry: register };
}
