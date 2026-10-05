import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import {
  NOTIFICATION_POLICIES,
  NOTIFICATION_POLICY_LABELS,
  NotificationPolicy,
} from '../types/notification';

type Props = { value: NotificationPolicy; onChange: (policy: NotificationPolicy) => void };

export function PolicySelector({ value, onChange }: Props) {
  return (
    <View>
      {NOTIFICATION_POLICIES.map((policy) => {
        const selected = policy === value;
        const label = NOTIFICATION_POLICY_LABELS[policy];
        return (
          <Pressable
            key={policy}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(policy)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={[styles.radio, selected && styles.radioSelected]} />
            <View style={styles.texts}>
              <Text style={styles.title}>{label.title}</Text>
              <Text style={styles.description}>{label.description}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
    gap: 10,
  },
  optionSelected: { borderColor: colors.primary },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  texts: { flex: 1 },
  title: { fontWeight: '600', color: colors.text },
  description: { color: colors.muted, fontSize: 13 },
});
