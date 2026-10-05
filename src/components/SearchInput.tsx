import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../theme';

type Props = { value: string; onChangeText: (text: string) => void; placeholder?: string };

export function SearchInput({ value, onChangeText, placeholder = 'Buscar por nome' }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: colors.background },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
});
