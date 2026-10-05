import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { GroupMemberItem } from '../components/GroupMemberItem';
import { Loading } from '../components/Loading';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroups';
import { useUserDirectory } from '../hooks/useUsers';
import { leaveGroup, updateGroup } from '../services/groupService';
import { colors } from '../theme';
import { NOTIFICATION_POLICY_LABELS } from '../types/notification';
import { ScreenProps } from '../types/navigation';
import { PublicUser } from '../types/user';
import { getErrorMessage } from '../utils/errors';
import { formatSlots } from '../utils/groupValidation';

export function GroupMembersScreen({ navigation, route }: ScreenProps<'GroupMembers'>) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { group, loading, error } = useGroup(groupId);
  const { byId } = useUserDirectory();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwner = Boolean(user && group && group.ownerId === user.uid);

  const members = useMemo(
    () =>
      (group?.memberIds ?? [])
        .map((id) => byId[id])
        .filter((m): m is PublicUser => m !== undefined)
        .sort((a, b) => Number(b.uid === group?.ownerId) - Number(a.uid === group?.ownerId)),
    [group, byId],
  );

  const removeMember = useCallback(
    (member: PublicUser) => {
      if (!user) return;
      Alert.alert('Remover integrante', `Remover ${member.name} do grupo?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            setActionError(null);
            updateGroup(groupId, user.uid, { removeMemberIds: [member.uid] })
              .catch((e: unknown) => setActionError(getErrorMessage(e)))
              .finally(() => setBusy(false));
          },
        },
      ]);
    },
    [groupId, user],
  );

  const handleLeave = useCallback(() => {
    Alert.alert('Sair do grupo', 'Você deixará de receber as mensagens deste grupo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          leaveGroup(groupId)
            .then(() => navigation.popToTop())
            .catch((e: unknown) => {
              setActionError(getErrorMessage(e));
              setBusy(false);
            });
        },
      },
    ]);
  }, [groupId, navigation]);

  if (loading) return <Loading />;
  if (error || !group) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error ?? 'Grupo indisponível ou você não é mais integrante.'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={
          <View style={styles.header}>
            <Avatar uri={group.photoUrl} name={group.name} size={96} isGroup />
            <Text style={styles.name}>{group.name}</Text>
            <Text style={styles.meta}>{formatSlots(group.memberLimit, group.memberIds.length)}</Text>
            <Text style={styles.meta}>
              Notificações: {NOTIFICATION_POLICY_LABELS[group.notificationPolicy].title}
            </Text>
            {actionError ? <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <GroupMemberItem
            member={item}
            isOwner={item.uid === group.ownerId}
            isMe={item.uid === user?.uid}
            onPress={(m) => navigation.navigate('Profile', { userId: m.uid })}
            onRemove={isOwner && item.uid !== group.ownerId && !busy ? removeMember : undefined}
          />
        )}
        ListEmptyComponent={<EmptyState title="Nenhum integrante encontrado" />}
        ListFooterComponent={
          <View style={styles.footer}>
            {isOwner ? (
              <PrimaryButton title="Editar grupo" onPress={() => navigation.navigate('GroupForm', { groupId })} />
            ) : (
              <PrimaryButton title="Sair do grupo" variant="danger" onPress={handleLeave} loading={busy} />
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', padding: 20, gap: 6 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, textAlign: 'center' },
  footer: { padding: 16 },
});
