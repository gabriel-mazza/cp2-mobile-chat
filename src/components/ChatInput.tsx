import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { MessageTarget } from '../types/chat';
import { PublicUser } from '../types/user';

type Props = {
  onSend: (text: string, target: MessageTarget, mentionedUserIds: string[]) => Promise<boolean>;
  sending: boolean;
  
  members?: PublicUser[];
};

export function ChatInput({ onSend, sending, members }: Props) {
  const [text, setText] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);

  const isGroup = members !== undefined;
  const canSend = text.trim().length > 0 && !sending;

  const selectedName = useMemo(
    () => (targetId ? members?.find((m) => m.uid === targetId)?.name ?? null : null),
    [members, targetId],
  );

  const addMention = useCallback((member: PublicUser) => {
    setText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@${member.name} `);
    setShowMentions(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    // Menções vigentes = membros cujo "@Nome" ainda está no texto.
    const mentioned = (members ?? []).filter((m) => text.includes(`@${m.name}`)).map((m) => m.uid);
    const target: MessageTarget = targetId ? { type: 'member', memberId: targetId } : { type: 'conversation' };
    const ok = await onSend(text, target, mentioned);
    if (ok) {
      setText('');
      setTargetId(null);
    }
  }, [canSend, members, onSend, targetId, text]);

  return (
    <View style={styles.container}>
      {isGroup ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.chipLabel}>Para:</Text>
            <Pressable
              style={[styles.chip, targetId === null && styles.chipActive]}
              onPress={() => setTargetId(null)}
            >
              <Text style={[styles.chipText, targetId === null && styles.chipTextActive]}>Grupo todo</Text>
            </Pressable>
            {members.map((m) => (
              <Pressable
                key={m.uid}
                style={[styles.chip, targetId === m.uid && styles.chipActive]}
                onPress={() => setTargetId(m.uid)}
              >
                <Text style={[styles.chipText, targetId === m.uid && styles.chipTextActive]}>{m.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {showMentions ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.chipLabel}>Mencionar:</Text>
              {members.map((m) => (
                <Pressable key={m.uid} style={styles.chip} onPress={() => addMention(m)}>
                  <Text style={styles.chipText}>@{m.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      <View style={styles.inputRow}>
        {isGroup ? (
          <Pressable
            style={styles.mentionButton}
            onPress={() => setShowMentions((v) => !v)}
            accessibilityLabel="Mencionar integrante"
          >
            <Text style={styles.mentionText}>@</Text>
          </Pressable>
        ) : null}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={selectedName ? `Mensagem para ${selectedName}` : 'Digite uma mensagem'}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendDisabled]}
          onPress={() => void handleSend()}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
        >
          <Text style={styles.sendText}>{sending ? '...' : 'Enviar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: 8 },
  chipLabel: { alignSelf: 'center', color: colors.muted, marginRight: 6, fontSize: 13 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
  },
  mentionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionText: { fontWeight: '700', color: colors.primary, fontSize: 18 },
  sendButton: { backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700' },
});
