'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserInteractionsContextValue = {
  user: SupabaseUser | null;
  ready: boolean;
  isFavorited: (productId: string) => boolean;
  isLiked: (productId: string) => boolean;
  setFavoriteLocal: (productId: string, favorited: boolean) => void;
  setLikedLocal: (productId: string, liked: boolean) => void;
};

const defaultValue: UserInteractionsContextValue = {
  user: null,
  ready: false,
  isFavorited: () => false,
  isLiked: () => false,
  setFavoriteLocal: () => {},
  setLikedLocal: () => {},
};

const UserInteractionsContext =
  createContext<UserInteractionsContextValue>(defaultValue);

/**
 * Single batched provider for user favorites & product likes.
 * Replaces N*2 per-card Supabase queries (up to 80+ requests per homepage load)
 * with ONE parallel pair of lightweight ID-only queries per authenticated session.
 */
export function UserInteractionsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [ready, setReady] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const loadedUserIdRef = useRef<string | null>(null);

  const loadForUser = useCallback(async (uid: string) => {
    if (loadedUserIdRef.current === uid) return;
    loadedUserIdRef.current = uid;

    try {
      const [favRes, likeRes] = await Promise.all([
        supabase.from('favorites').select('product_id').eq('user_id', uid),
        supabase.from('likes').select('product_id').eq('user_id', uid),
      ]);

      if (loadedUserIdRef.current !== uid) return;

      if (!favRes.error && Array.isArray(favRes.data)) {
        setFavoriteIds(
          new Set(
            favRes.data
              .map((row) => String(row.product_id ?? ''))
              .filter(Boolean),
          ),
        );
      }
      if (!likeRes.error && Array.isArray(likeRes.data)) {
        setLikedIds(
          new Set(
            likeRes.data
              .map((row) => String(row.product_id ?? ''))
              .filter(Boolean),
          ),
        );
      }
    } catch {
      // Non-blocking: UI buttons still work and retry on click
    }
  }, []);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active) return;

        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setReady(true);

        if (nextUser) {
          void loadForUser(nextUser.id);
        } else {
          loadedUserIdRef.current = null;
          setFavoriteIds(new Set());
          setLikedIds(new Set());
        }
      } catch {
        if (active) setReady(true);
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setReady(true);

      if (nextUser) {
        void loadForUser(nextUser.id);
      } else {
        loadedUserIdRef.current = null;
        setFavoriteIds(new Set());
        setLikedIds(new Set());
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadForUser]);

  const isFavorited = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const isLiked = useCallback(
    (productId: string) => likedIds.has(productId),
    [likedIds],
  );

  const setFavoriteLocal = useCallback((productId: string, favorited: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const setLikedLocal = useCallback((productId: string, liked: boolean) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const value = useMemo<UserInteractionsContextValue>(
    () => ({
      user,
      ready,
      isFavorited,
      isLiked,
      setFavoriteLocal,
      setLikedLocal,
    }),
    [user, ready, isFavorited, isLiked, setFavoriteLocal, setLikedLocal],
  );

  return (
    <UserInteractionsContext.Provider value={value}>
      {children}
    </UserInteractionsContext.Provider>
  );
}

export function useUserInteractions() {
  return useContext(UserInteractionsContext);
}
