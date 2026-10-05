import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { ChatInput } from '../components/ChatInput';
import { ChatMessage } from '../components/ChatMessage';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useConversationInfo } from '../hooks/useConversationInfo';
import { useUserDirectory } from '../hooks/useUsers';
import { colors } from '../theme';
import { ChatMessage as ChatMessageModel } from '../types/chat';
import { ScreenProps } from '../types/navigation';

export function ChatScreen({ navigation, route }: ScreenProps<'Chat'>) {
  const { conversationId, conversationType } = route.params;
  const { user } = useAuth();
  const { info, loading: infoLoading, error: infoError } = useConversationInfo(
    conversationId,
    conversationType,
    user?.uid ?? null,
  );
  const { byId } = useUserDirectory();
  const canChat = info.isMember && !infoError;
  const chat = useChat(conversationId, conversationType, canChat ? user : null);
  const listRef = useRef<FlatList<ChatMessageModel>>(null);

  const openHeader = useCallback(() => {
    if (info.isGroup) {
      navigation.navigate('GroupMembers', { groupId: conversationId });
    } else if (info.otherUserId) {
      navigation.navigate('Profile', { userId: info.otherUserId });
    }
  }, [conversationId, info.isGroup, info.otherUserId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <Avatar uri={info.photoUrl} name={info.title} size={36} isGroup={info.isGroup} onPress={openHeader} />
          <Pressable onPress={openHeader}>
            <Text style={styles.headerText} numberOfLines={1}>
              {info.title}
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [info.isGroup, info.photoUrl, info.title, navigation, openHeader]);

  // Integrantes selecionáveis como destinatário/menção (sem o próprio usuário).
  const selectableMembers = useMemo(
    () => (info.isGroup ? info.members.filter((m) => m.uid !== user?.uid) : undefined),
    [info.isGroup, info.members, user?.uid],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessageModel }) => {
      const isMine = item.senderId === user?.uid;
      const targetName =
        item.target.type === 'member' ? byId[item.target.memberId]?.name ?? 'integrante' : undefined;
      return (
        <ChatMessage
          message={item}
          isMine={isMine}
          authorName={info.isGroup ? byId[item.senderId]?.name ?? 'Usuário' : undefined}
          targetName={targetName}
          onAuthorPress={info.isGroup ? () => navigation.navigate('Profile', { userId: item.senderId }) : undefined}
        />
      );
    },
    [byId, info.isGroup, navigation, user?.uid],
  );

  if (infoLoading) return <Loading />;

  if (infoError || !info.isMember) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Conversa indisponível"
          description={infoError ?? 'Você não faz parte desta conversa ou ela não existe mais.'}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {!chat.connected ? (
        <View style={styles.offline}>
          <Text style={styles.offlineText}>Sem conexão — reconectando...</Text>
        </View>
      ) : null}

      {chat.loading ? (
        <Loading message="Carregando mensagens..." />
      ) : (
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <EmptyState title="Nenhuma mensagem ainda" description="Envie a primeira mensagem para começar." />
          }
          contentContainerStyle={chat.messages.length === 0 ? styles.emptyList : styles.list}
        />
      )}

      <View style={styles.messages}>
        {chat.error ? <ErrorMessage message={chat.error} onDismiss={chat.clearError} /> : null}
        {chat.pushWarning ? (
          <ErrorMessage tone="warning" message={chat.pushWarning} onDismiss={chat.clearPushWarning} />
        ) : null}
      </View>

      <ChatInput onSend={chat.sendMessage} sending={chat.sending} members={selectableMembers} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { fontSize: 17, fontWeight: '700', color: colors.text, maxWidth: 220 },
  list: { paddingVertical: 8 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  messages: { paddingHorizontal: 12 },
  offline: { backgroundColor: colors.warningBg, padding: 6, alignItems: 'center' },
  offlineText: { color: colors.warningText, fontSize: 13 },
});
