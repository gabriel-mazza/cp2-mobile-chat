import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { colors } from '../theme';
import { ConversationSummary } from '../types/chat';

type Props = { conversation: ConversationSummary; onPress: (conversation: ConversationSummary) => void };

export const ConversationItem = React.memo(function ConversationItem({ conversation, onPress }: Props) {
  const isGroup = conversation.type === 'group';
  return (
    <Pressable style={styles.row} onPress={() => onPress(conversation)} accessibilityRole="button">
      <Avatar uri={conversation.photoUrl} name={conversation.title} isGroup={isGroup} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {conversation.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {conversation.subtitle}
        </Text>
      </View>
      <View style={[styles.badge, isGroup ? styles.badgeGroup : styles.badgeDirect]}>
        <Text style={styles.badgeText}>{isGroup ? 'Grupo' : 'Individual'}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeGroup: { backgroundColor: '#DBEAFE' },
  badgeDirect: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.text },
});
