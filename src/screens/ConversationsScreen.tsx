import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConversationItem } from '../components/ConversationItem';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useNotifications } from '../hooks/useNotifications';
import { colors } from '../theme';
import { ConversationSummary } from '../types/chat';
import { ScreenProps } from '../types/navigation';
import { getErrorMessage } from '../utils/errors';

const PUSH_BANNERS: Partial<Record<string, string>> = {
  denied: 'Notificações desativadas. Ative a permissão nas configurações do aparelho para receber mensagens em segundo plano.',
  unavailable: 'Notificações push exigem um dispositivo físico. Neste ambiente elas não serão recebidas.',
};

export function ConversationsScreen({ navigation }: ScreenProps<'Conversations'>) {
  const { user, signOut } = useAuth();
  const { conversations, loading, error } = useConversations(user?.uid ?? null);
  const push = useNotifications(user);

  const openConversation = useCallback(
    (conversation: ConversationSummary) =>
      navigation.navigate('Chat', { conversationId: conversation.id, conversationType: conversation.type }),
    [navigation],
  );

  const confirmLogout = useCallback(() => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          signOut().catch((e: unknown) => Alert.alert('Erro', getErrorMessage(e)));
        },
      },
    ]);
  }, [signOut]);

  const banner = PUSH_BANNERS[push.status] ?? (push.status === 'error' ? push.error : null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => user && navigation.navigate('Profile', { userId: user.uid })}>
          <Text style={styles.title}>Conversas</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={() => navigation.navigate('Users')} accessibilityRole="button">
            <Text style={styles.action}>+ Conversa</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('GroupForm')} accessibilityRole="button">
            <Text style={styles.action}>+ Grupo</Text>
          </Pressable>
          <Pressable onPress={confirmLogout} accessibilityRole="button">
            <Text style={styles.logout}>Sair</Text>
          </Pressable>
        </View>
      </View>

      {banner ? (
        <View style={styles.bannerWrapper}>
          <ErrorMessage
            tone="warning"
            message={banner}
            onRetry={push.status === 'error' || push.status === 'denied' ? () => void push.retry() : undefined}
          />
        </View>
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}

      {loading ? (
        <Loading message="Carregando conversas..." />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => `${item.type}:${item.id}`}
          renderItem={({ item }) => <ConversationItem conversation={item} onPress={openConversation} />}
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma conversa ainda"
              description="Toque em “+ Conversa” para falar com alguém ou em “+ Grupo” para criar um grupo."
            />
          }
          contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  actions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  action: { color: colors.primary, fontWeight: '700' },
  logout: { color: colors.danger, fontWeight: '700' },
  bannerWrapper: { paddingHorizontal: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
});
