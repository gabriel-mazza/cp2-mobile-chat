import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { colors } from '../theme';
import { PublicUser } from '../types/user';

type Props = {
  user: PublicUser;
  onPress: (user: PublicUser) => void;
  
  selected?: boolean;
  disabled?: boolean;
};

export const UserItem = React.memo(function UserItem({ user, onPress, selected, disabled = false }: Props) {
  return (
    <Pressable
      style={[styles.row, disabled && styles.disabled]}
      onPress={() => onPress(user)}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Avatar uri={user.photoUrl} name={user.name} />
      <Text style={styles.name} numberOfLines={1}>
        {user.name}
      </Text>
      {selected !== undefined ? (
        <View style={[styles.check, selected && styles.checkActive]}>
          {selected ? <Text style={styles.checkText}>✓</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  name: { flex: 1, fontSize: 16, color: colors.text },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { color: '#fff', fontWeight: '700' },
});
