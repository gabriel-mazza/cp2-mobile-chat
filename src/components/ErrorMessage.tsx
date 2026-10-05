import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  tone?: 'error' | 'warning';
};

export function ErrorMessage({ message, onRetry, onDismiss, tone = 'error' }: Props) {
  const isWarning = tone === 'warning';
  return (
    <View style={[styles.box, isWarning ? styles.warningBox : styles.errorBox]} accessibilityRole="alert">
      <Text style={[styles.text, isWarning ? styles.warningText : styles.errorText]}>{message}</Text>
      <View style={styles.actions}>
        {onRetry ? (
          <Pressable onPress={onRetry}>
            <Text style={styles.action}>Tentar novamente</Text>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable onPress={onDismiss}>
            <Text style={styles.action}>Fechar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 12, borderRadius: 8, marginVertical: 8 },
  errorBox: { backgroundColor: colors.dangerBg },
  warningBox: { backgroundColor: colors.warningBg },
  text: { fontSize: 14 },
  errorText: { color: colors.danger },
  warningText: { color: colors.warningText },
  actions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  action: { fontWeight: '700', color: colors.text },
});
