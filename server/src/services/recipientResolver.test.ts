import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveRecipients, ResolveInput } from './recipientResolver';

const base: ResolveInput = {
  conversationType: 'group',
  participants: ['a', 'b', 'c', 'd'],
  policy: 'all_group_messages',
  senderId: 'a',
  target: { type: 'conversation' },
  mentionedUserIds: [],
};

test('all_group_messages: todos menos o remetente', () => {
  assert.deepEqual(resolveRecipients(base).sort(), ['b', 'c', 'd']);
});

test('mentioned_members: só mencionados e destinatário explícito', () => {
  const out = resolveRecipients({
    ...base,
    policy: 'mentioned_members',
    mentionedUserIds: ['b'],
    target: { type: 'member', memberId: 'c' },
  });
  assert.deepEqual(out.sort(), ['b', 'c']);
});

test('mentioned_members: mensagem geral sem menção não notifica ninguém', () => {
  assert.deepEqual(resolveRecipients({ ...base, policy: 'mentioned_members' }), []);
});

test('mentioned_members: ignora quem não é integrante e o próprio remetente', () => {
  const out = resolveRecipients({
    ...base,
    policy: 'mentioned_members',
    mentionedUserIds: ['a', 'zzz', 'd'],
  });
  assert.deepEqual(out, ['d']);
});

test('direct_messages_only e disabled não notificam em grupo', () => {
  assert.deepEqual(resolveRecipients({ ...base, policy: 'direct_messages_only' }), []);
  assert.deepEqual(resolveRecipients({ ...base, policy: 'disabled' }), []);
});

test('conversa direta notifica o outro participante, independente da política', () => {
  const out = resolveRecipients({
    ...base,
    conversationType: 'direct',
    participants: ['a', 'b'],
    policy: null,
  });
  assert.deepEqual(out, ['b']);
});

test('usuário removido (fora de participants) nunca recebe', () => {
  const out = resolveRecipients({ ...base, participants: ['a', 'b'] });
  assert.deepEqual(out, ['b']);
});
