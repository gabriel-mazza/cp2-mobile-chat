/** Id determinístico: os dois uid ordenados garantem uma única conversa por par. */
export function buildDirectConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export function getOtherParticipant(participants: readonly string[], myUid: string): string | null {
  return participants.find((id) => id !== myUid) ?? null;
}
