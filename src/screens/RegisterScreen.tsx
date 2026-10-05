import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { ErrorMessage } from '../components/ErrorMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { pickImage } from '../services/imagePickerService';
import { colors } from '../theme';
import { ScreenProps } from '../types/navigation';
import { getErrorMessage } from '../utils/errors';
import {
  maskDate,
  maskPhone,
  parseBirthDate,
  validateBirthDate,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../utils/validators';

type FieldErrors = Partial<
  Record<'name' | 'email' | 'password' | 'confirm' | 'phone' | 'birth', string | null>
>;

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = useCallback(async () => {
    setFormError(null);
    try {
      const uri = await pickImage();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      setFormError(getErrorMessage(e));
    }
  }, []);

  const handleRegister = useCallback(async () => {
    const next: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: password === confirm ? null : 'As senhas não conferem.',
      phone: validatePhone(phone),
      birth: validateBirthDate(birth),
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some((value) => value)) return;

    const birthDate = parseBirthDate(birth);
    if (!birthDate) return;

    setLoading(true);
    try {
      await signUp({ name, email, password, phoneNumber: phone, birthDate, photoUri });
     
    } catch (e) {
      setFormError(getErrorMessage(e));
      setLoading(false);
    }
  }, [birth, confirm, email, name, password, phone, photoUri, signUp]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.photoBlock}>
          <Avatar uri={photoUri ?? undefined} name={name || '?'} size={96} />
          <Pressable onPress={() => void handlePickPhoto()} accessibilityRole="button">
            <Text style={styles.photoLink}>{photoUri ? 'Trocar foto' : 'Escolher foto de perfil'}</Text>
          </Pressable>
        </View>

        <FormInput label="Nome" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
        <FormInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormInput
          label="Celular"
          value={phone}
          onChangeText={(text) => setPhone(maskPhone(text))}
          error={errors.phone}
          keyboardType="phone-pad"
          placeholder="(11) 91234-5678"
        />
        <FormInput
          label="Data de nascimento"
          value={birth}
          onChangeText={(text) => setBirth(maskDate(text))}
          error={errors.birth}
          keyboardType="number-pad"
          placeholder="dd/mm/aaaa"
        />
        <FormInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
        />
        <FormInput
          label="Confirmar senha"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secureTextEntry
          autoCapitalize="none"
        />

        {formError ? <ErrorMessage message={formError} /> : null}

        <PrimaryButton title="Criar conta" onPress={() => void handleRegister()} loading={loading} />
        <PrimaryButton title="Já tenho conta" variant="secondary" onPress={() => navigation.goBack()} disabled={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, gap: 8 },
  photoBlock: { alignItems: 'center', gap: 8, marginBottom: 12 },
  photoLink: { color: colors.primary, fontWeight: '700' },
});
