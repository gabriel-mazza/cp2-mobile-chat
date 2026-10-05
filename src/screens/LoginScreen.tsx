import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { ErrorMessage } from '../components/ErrorMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';
import { ScreenProps } from '../types/navigation';
import { getErrorMessage } from '../utils/errors';
import { validateEmail, validatePassword } from '../utils/validators';

export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setError(null);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
  }, [email, password, signIn]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>Entre com seu e-mail e senha</Text>

        <FormInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <FormInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <ErrorMessage message={error} /> : null}

        <PrimaryButton title="Entrar" onPress={() => void handleLogin()} loading={loading} />
        <PrimaryButton title="Criar conta" variant="secondary" onPress={() => navigation.navigate('Register')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, justifyContent: 'center', flexGrow: 1, gap: 8 },
  title: { fontSize: 32, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { textAlign: 'center', color: colors.muted, marginBottom: 16 },
});
