import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { ChatMessage as ChatMessageModel } from '../types/chat';

type Props = {
  message: ChatMessageModel;
  isMine: boolean;
  authorName?: string;
  targetName?: string;
  onAuthorPress?: () => void;
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isMine,
  authorName,
  targetName,
  onAuthorPress,
}: Props) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!isMine && authorName ? (
          <Pressable onPress={onAuthorPress} disabled={!onAuthorPress}>
            <Text style={styles.author}>{authorName}</Text>
          </Pressable>
        ) : null}
        {targetName ? (
          <Text style={[styles.target, isMine && styles.textMine]}>↪ para {targetName}</Text>
        ) : null}
        <Text style={[styles.text, isMine && styles.textMine]}>{message.text}</Text>
        <Text style={[styles.time, isMine && styles.timeMine]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.bubbleMine, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.bubbleOther, borderBottomLeftRadius: 4 },
  author: { fontWeight: '700', color: colors.primaryDark, marginBottom: 2, fontSize: 13 },
  target: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  text: { fontSize: 16, color: colors.text },
  textMine: { color: '#fff' },
  time: { fontSize: 11, color: colors.muted, alignSelf: 'flex-end', marginTop: 2 },
  timeMine: { color: '#DBEAFE' },
});
