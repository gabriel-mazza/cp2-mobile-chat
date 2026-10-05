import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ title, onPress, loading = false, disabled = false, variant = 'primary' }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryText: { color: colors.primary },
});
