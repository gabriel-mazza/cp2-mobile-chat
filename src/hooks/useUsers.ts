import { useEffect, useMemo, useState } from 'react';
import { observeUserDirectory } from '../services/userService';
import { PublicUser } from '../types/user';
import { getErrorMessage } from '../utils/errors';


export function useUserDirectory() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stop = observeUserDirectory(
      (list) => {
        setUsers(list);
        setError(null);
        setLoading(false);
      },
      (e) => {
        setError(getErrorMessage(e));
        setLoading(false);
      },
    );
    return stop;
  }, []);

  const byId = useMemo(() => {
    const map: Record<string, PublicUser> = {};
    users.forEach((u) => {
      map[u.uid] = u;
    });
    return map;
  }, [users]);

  return { users, byId, loading, error };
}


export function useUsers(excludeUid: string | null, search: string) {
  const { users, byId, loading, error } = useUserDirectory();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => u.uid !== excludeUid && (term === '' || u.nameLower.includes(term)));
  }, [users, excludeUid, search]);

  return { users: filtered, byId, loading, error };
}
