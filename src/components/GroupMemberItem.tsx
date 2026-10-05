import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { colors } from '../theme';
import { PublicUser } from '../types/user';

type Props = {
  member: PublicUser;
  isOwner: boolean;
  isMe: boolean;
  onPress: (member: PublicUser) => void;
  onRemove?: (member: PublicUser) => void;
};

export const GroupMemberItem = React.memo(function GroupMemberItem({
  member,
  isOwner,
  isMe,
  onPress,
  onRemove,
}: Props) {
  return (
    <Pressable style={styles.row} onPress={() => onPress(member)} accessibilityRole="button">
      <Avatar uri={member.photoUrl} name={member.name} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {member.name}
          {isMe ? ' (você)' : ''}
        </Text>
        {isOwner ? <Text style={styles.owner}>Proprietário</Text> : null}
      </View>
      {onRemove ? (
        <Pressable onPress={() => onRemove(member)} hitSlop={8} accessibilityLabel={`Remover ${member.name}`}>
          <Text style={styles.remove}>Remover</Text>
        </Pressable>
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
  info: { flex: 1 },
  name: { fontSize: 16, color: colors.text },
  owner: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  remove: { color: colors.danger, fontWeight: '700' },
});
