import { useCallback, useEffect, useRef, useState } from 'react';
import { observeConnection, observeMessages, sendChatMessage } from '../services/chatService';
import { requestMessagePush } from '../services/notificationService';
import { ChatMessage, ConversationType, MessageTarget } from '../types/chat';
import { ChatUser } from '../types/user';
import { getErrorMessage } from '../utils/errors';

const NO_CONNECTION = 'Sem conexão com a internet. Tente novamente quando estiver online.';

export function useChat(conversationId: string, conversationType: ConversationType, user: ChatUser | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushWarning, setPushWarning] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const connectedRef = useRef(true);

  
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setError(null);
    const stop = observeMessages(
      conversationId,
      (list) => {
        setMessages(list);
        setLoading(false);
      },
      (e) => {
        setError(getErrorMessage(e));
        setLoading(false);
      },
    );
    return stop;
  }, [conversationId]);

  useEffect(() => {
    return observeConnection((value) => {
      connectedRef.current = value;
      setConnected(value);
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string, target: MessageTarget, mentionedUserIds: string[]): Promise<boolean> => {
      const trimmed = text.trim();
      if (!user || trimmed.length === 0) return false;
      if (!connectedRef.current) {
        setError(NO_CONNECTION);
        return false;
      }
      setSending(true);
      setError(null);
      setPushWarning(null);
      try {
        const messageId = await sendChatMessage({
          conversationId,
          conversationType,
          senderId: user.uid,
          text: trimmed,
          target,
          mentionedUserIds,
        });
        try {
          await requestMessagePush(conversationId, messageId);
        } catch {
          try {
            
            await requestMessagePush(conversationId, messageId);
          } catch {
            setPushWarning('Mensagem enviada, mas não foi possível solicitar a notificação push.');
          }
        }
        return true;
      } catch (e) {
        setError(`Falha ao enviar a mensagem. ${getErrorMessage(e)}`);
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, conversationType, user],
  );

  const clearError = useCallback(() => setError(null), []);
  const clearPushWarning = useCallback(() => setPushWarning(null), []);

  return { messages, loading, sending, error, pushWarning, connected, sendMessage, clearError, clearPushWarning };
}
