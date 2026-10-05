import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { FormInput } from '../components/FormInput';
import { Loading } from '../components/Loading';
import { PolicySelector } from '../components/PolicySelector';
import { PrimaryButton } from '../components/PrimaryButton';
import { SearchInput } from '../components/SearchInput';
import { UserItem } from '../components/UserItem';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroups';
import { useUsers } from '../hooks/useUsers';
import { createGroup, updateGroup } from '../services/groupService';
import { pickImage } from '../services/imagePickerService';
import { colors } from '../theme';
import { DEFAULT_MEMBER_LIMIT } from '../types/group';
import { NotificationPolicy } from '../types/notification';
import { ScreenProps } from '../types/navigation';
import { PublicUser } from '../types/user';
import { getErrorMessage } from '../utils/errors';
import {
  availableSlots,
  formatSlots,
  parseMemberLimit,
  validateGroupName,
  validateMemberLimit,
} from '../utils/groupValidation';

export function GroupFormScreen({ navigation, route }: ScreenProps<'GroupForm'>) {
  const { user } = useAuth();
  const groupId = route.params?.groupId ?? null;
  const isEdit = groupId !== null;
  const { group, loading: groupLoading, error: groupError } = useGroup(groupId);

  const [name, setName] = useState('');
  const [limitText, setLimitText] = useState(String(DEFAULT_MEMBER_LIMIT));
  const [policy, setPolicy] = useState<NotificationPolicy>('all_group_messages');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initialized = useRef(false);

  const { users, loading: usersLoading, error: usersError } = useUsers(user?.uid ?? null, search);

  // Preenche o formulário uma única vez no modo edição.
  useEffect(() => {
    if (group && !initialized.current) {
      initialized.current = true;
      setName(group.name);
      setLimitText(String(group.memberLimit));
      setPolicy(group.notificationPolicy);
      setSelectedIds(group.memberIds.filter((id) => id !== group.ownerId));
    }
  }, [group]);

  const totalMembers = selectedIds.length + 1; // + proprietário
  const parsedLimit = parseMemberLimit(limitText);
  const slots = parsedLimit === null ? 0 : availableSlots(parsedLimit, totalMembers);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleUser = useCallback(
    (target: PublicUser) => {
      setFormError(null);
      setSelectedIds((prev) => {
        if (prev.includes(target.uid)) return prev.filter((id) => id !== target.uid);
        if (parsedLimit !== null && prev.length + 1 >= parsedLimit) {
          setFormError('Grupo sem vagas: aumente o limite ou remova alguém antes de adicionar.');
          return prev;
        }
        return [...prev, target.uid];
      });
    },
    [parsedLimit],
  );

  const handlePickPhoto = useCallback(async () => {
    setFormError(null);
    try {
      const uri = await pickImage();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      setFormError(getErrorMessage(e));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;
    const nameError = validateGroupName(name);
    const limitError = validateMemberLimit(limitText, totalMembers);
    if (nameError || limitError) {
      setFormError(nameError ?? limitError);
      return;
    }
    if (totalMembers < 2) {
      setFormError('Selecione ao menos um integrante além de você.');
      return;
    }
    const memberLimit = Number(limitText);

    setSaving(true);
    setFormError(null);
    try {
      if (group) {
        const addMemberIds = selectedIds.filter((id) => !group.memberIds.includes(id));
        const removeMemberIds = group.memberIds.filter((id) => id !== group.ownerId && !selectedSet.has(id));
        await updateGroup(group.id, user.uid, {
          name,
          photoUri,
          memberLimit,
          notificationPolicy: policy,
          addMemberIds,
          removeMemberIds,
        });
        navigation.goBack();
      } else {
        const newId = await createGroup(user.uid, {
          name,
          photoUri,
          memberLimit,
          notificationPolicy: policy,
          memberIds: selectedIds,
        });
        navigation.replace('Chat', { conversationId: newId, conversationType: 'group' });
      }
    } catch (e) {
      setFormError(getErrorMessage(e));
      setSaving(false);
    }
  }, [group, limitText, name, navigation, photoUri, policy, selectedIds, selectedSet, totalMembers, user]);

  if (isEdit && groupLoading) return <Loading />;
  if (isEdit && (groupError || !group)) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={groupError ?? 'Grupo não encontrado.'} />
      </View>
    );
  }
  if (group && user && group.ownerId !== user.uid) {
    return (
      <View style={styles.container}>
        <ErrorMessage message="Somente o proprietário pode editar o grupo." />
      </View>
    );
  }

  const header = (
    <View style={styles.form}>
      <View style={styles.photoBlock}>
        <Avatar uri={photoUri ?? group?.photoUrl} name={name || 'Grupo'} size={96} isGroup />
        <Pressable onPress={() => void handlePickPhoto()} accessibilityRole="button">
          <Text style={styles.link}>Escolher foto do grupo</Text>
        </Pressable>
      </View>

      <FormInput label="Nome do grupo" value={name} onChangeText={setName} maxLength={40} />
      <FormInput
        label="Limite de integrantes (incluindo você)"
        value={limitText}
        onChangeText={setLimitText}
        keyboardType="number-pad"
      />
      <Text style={[styles.slots, slots === 0 && styles.slotsFull]}>
        {parsedLimit === null ? 'Informe um limite válido.' : formatSlots(parsedLimit, totalMembers)}
      </Text>

      <Text style={styles.section}>Notificações push</Text>
      <PolicySelector value={policy} onChange={setPolicy} />

      <Text style={styles.section}>Integrantes</Text>
      <SearchInput value={search} onChangeText={setSearch} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <UserItem user={item} onPress={toggleUser} selected={selectedSet.has(item.uid)} />
        )}
        ListEmptyComponent={
          usersLoading ? (
            <Loading />
          ) : (
            <EmptyState title="Nenhum usuário encontrado" description="Convide alguém para criar uma conta." />
          )
        }
        ListFooterComponent={
          <View style={styles.form}>
            {usersError ? <ErrorMessage message={usersError} /> : null}
            {formError ? <ErrorMessage message={formError} onDismiss={() => setFormError(null)} /> : null}
            <PrimaryButton
              title={isEdit ? 'Salvar alterações' : 'Criar grupo'}
              onPress={() => void handleSave()}
              loading={saving}
            />
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: 16 },
  photoBlock: { alignItems: 'center', gap: 8, marginBottom: 12 },
  link: { color: colors.primary, fontWeight: '700' },
  slots: { color: colors.success, fontWeight: '600', marginBottom: 12 },
  slotsFull: { color: colors.danger },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 8 },
});
