import { useEffect, useState } from 'react';
import { observeGroup } from '../services/groupService';
import { ChatGroup } from '../types/group';
import { getErrorMessage } from '../utils/errors';

/** Assina um grupo em tempo real. Passe null para não assinar. */
export function useGroup(groupId: string | null) {
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [loading, setLoading] = useState<boolean>(groupId !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGroup(null);
    setError(null);
    if (!groupId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return observeGroup(
      groupId,
      (value) => {
        setGroup(value);
        setLoading(false);
      },
      (e) => {
        setError(getErrorMessage(e));
        setLoading(false);
      },
    );
  }, [groupId]);

  return { group, loading, error };
}
