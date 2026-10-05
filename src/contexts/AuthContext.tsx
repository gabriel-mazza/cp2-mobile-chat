import React, { ReactNode, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { loginWithEmail, logout, observeAuthState, observeProfile, registerWithEmail } from '../services/authService';
import { unregisterDevice } from '../services/notificationService';
import { ChatUser, RegisterInput } from '../types/user';

export type AuthContextValue = {
  user: ChatUser | null;
  /** true enquanto a sessão está sendo recuperada. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const registering = useRef(false);
  const userRef = useRef<ChatUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let stopProfile: Unsubscribe | null = null;

    const stopAuth = observeAuthState((firebaseUser) => {
      stopProfile?.();
      stopProfile = null;

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      stopProfile = observeProfile(
        firebaseUser.uid,
        (profile) => {
          if (profile) {
            setUser(profile);
            setLoading(false);
          } else if (!registering.current) {
            // Conta sem perfil (cadastro interrompido): encerra a sessão.
            setUser(null);
            setLoading(false);
            void logout();
          }
        },
        () => {
          setUser(null);
          setLoading(false);
        },
      );
    });

    return () => {
      stopProfile?.();
      stopAuth();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await loginWithEmail(email, password);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    registering.current = true;
    try {
      await registerWithEmail(input);
    } finally {
      registering.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    const current = userRef.current;
    if (current) await unregisterDevice(current.uid);
    await logout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
