import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  description: { marginTop: 6, color: colors.muted, textAlign: 'center' },
});
