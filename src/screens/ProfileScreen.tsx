import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { fetchUserProfile } from '../services/userService';
import { colors } from '../theme';
import { ScreenProps } from '../types/navigation';
import { UserProfile } from '../types/user';
import { getErrorMessage } from '../utils/errors';
import { formatBirthDate, maskPhone } from '../utils/validators';

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? 'Não disponível'}</Text>
    </View>
  );
}

export function ProfileScreen({ route }: ScreenProps<'Profile'>) {
  const { userId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const myUid = user?.uid ?? null;

  const load = useCallback(async () => {
    if (!myUid) return;
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchUserProfile(userId, myUid));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId, myUid]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading />;
  if (error || !profile) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error ?? 'Perfil indisponível.'} onRetry={() => void load()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profile.photoUrl} name={profile.name} size={120} />
        <Text style={styles.name}>{profile.name}</Text>
      </View>
      <Field label="E-mail" value={profile.email} />
      <Field label="Celular" value={profile.phoneNumber ? maskPhone(profile.phoneNumber) : null} />
      <Field label="Data de nascimento" value={profile.birthDate ? formatBirthDate(profile.birthDate) : null} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 24, gap: 12 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  field: { backgroundColor: colors.surface, padding: 14, borderRadius: 10, marginBottom: 10 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 2 },
  value: { color: colors.text, fontSize: 16 },
});
