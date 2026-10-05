import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { SearchInput } from '../components/SearchInput';
import { UserItem } from '../components/UserItem';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { getOrCreateDirectConversation } from '../services/chatService';
import { colors } from '../theme';
import { ScreenProps } from '../types/navigation';
import { PublicUser } from '../types/user';
import { getErrorMessage } from '../utils/errors';

export function UsersScreen({ navigation }: ScreenProps<'Users'>) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [opening, setOpening] = useState(false);
  // O próprio usuário é excluído da lista: não é possível conversar consigo mesmo.
  const { users, loading, error } = useUsers(user?.uid ?? null, search);

  const startConversation = useCallback(
    async (target: PublicUser) => {
      if (!user || opening) return;
      setOpening(true);
      try {
        const conversationId = await getOrCreateDirectConversation(user.uid, target.uid);
        navigation.replace('Chat', { conversationId, conversationType: 'direct' });
      } catch (e) {
        Alert.alert('Não foi possível iniciar a conversa', getErrorMessage(e));
        setOpening(false);
      }
    },
    [navigation, opening, user],
  );

  if (loading) return <Loading message="Carregando usuários..." />;

  return (
    <View style={styles.container}>
      <SearchInput value={search} onChangeText={setSearch} />
      {error ? <ErrorMessage message={error} /> : null}
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <UserItem user={item} onPress={(u) => void startConversation(u)} disabled={opening} />
        )}
        ListEmptyComponent={
          <EmptyState
            title={search ? 'Nenhum usuário encontrado' : 'Nenhum outro usuário cadastrado'}
            description={search ? 'Tente outro nome.' : 'Convide alguém para criar uma conta.'}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });
