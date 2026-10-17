import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Edge, User } from './types';
import { SAMPLE_EDGES, SAMPLE_USERS } from './data';
import { analyze } from './algo';
import type { Net } from './algo';

export interface State {
  users: User[];
  edges: Edge[];
  /** When true, new friendships are one-way edges (directed demo mode). */
  directed: boolean;
  /** The user whose perspective the app uses ("viewing as"). */
  me: string;
  dismissed: string[];
  /** Users with fewer direct connections than this are "Low Connectivity". */
  threshold: number;
}

const KEY = 'bondly-demo-v1';

const initial = (): State => ({
  users: SAMPLE_USERS.map((u) => ({ ...u, interests: [...u.interests] })),
  edges: SAMPLE_EDGES.map((e) => [e[0], e[1]] as Edge),
  directed: false,
  me: 'u0',
  dismissed: [],
  threshold: 2,
});

function load(): State {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.users) && Array.isArray(s.edges) && s.users.length >= 2) {
        const st: State = { ...initial(), ...s };
        if (!st.users.some((u) => u.id === st.me)) st.me = st.users[0].id;
        return st;
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return initial();
}

interface Ctx {
  state: State;
  net: Net;
  meIdx: number;
  connect: (a: string, b: string) => void;
  disconnect: (a: string, b: string) => void;
  addUser: (u: Omit<User, 'id'>) => string;
  removeUser: (id: string) => void;
  updateUser: (id: string, patch: Partial<Omit<User, 'id'>>) => void;
  setMe: (id: string) => void;
  setDirected: (v: boolean) => void;
  dismiss: (id: string) => void;
  setThreshold: (n: number) => void;
  reset: () => void;
  toast: string | null;
  notify: (msg: string) => void;
  profileId: string | null;
  openProfile: (id: string | null) => void;
  suggestId: string | null;
  openSuggest: (id: string | null) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [toast, setToast] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [suggestId, setSuggestId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const net = useMemo(() => analyze(state.users, state.edges), [state.users, state.edges]);
  const meIdx = net.idx.get(state.me) ?? 0;

  const notify = useCallback((m: string) => setToast(m), []);

  const connect = useCallback((a: string, b: string) => {
    if (a === b) return;
    setState((s) => {
      const set = new Set(s.edges.map(([x, y]) => `${x}|${y}`));
      set.add(`${a}|${b}`);
      if (!s.directed) set.add(`${b}|${a}`);
      const edges = [...set].map((k) => k.split('|') as Edge);
      return { ...s, edges };
    });
  }, []);

  const disconnect = useCallback((a: string, b: string) => {
    setState((s) => ({
      ...s,
      edges: s.edges.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a))),
    }));
  }, []);

  const addUser = useCallback((u: Omit<User, 'id'>) => {
    const id = `u${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    setState((s) => ({ ...s, users: [...s.users, { ...u, id }] }));
    return id;
  }, []);

  const removeUser = useCallback((id: string) => {
    setState((s) => {
      if (s.users.length <= 2) return s;
      const users = s.users.filter((u) => u.id !== id);
      return {
        ...s,
        users,
        edges: s.edges.filter(([x, y]) => x !== id && y !== id),
        me: s.me === id ? users[0].id : s.me,
        dismissed: s.dismissed.filter((k) => !k.split(':').includes(id)),
      };
    });
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<Omit<User, 'id'>>) => {
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  }, []);

  const value: Ctx = {
    state,
    net,
    meIdx,
    connect,
    disconnect,
    addUser,
    removeUser,
    updateUser,
    setMe: (id) => setState((s) => ({ ...s, me: id })),
    setDirected: (v) => setState((s) => ({ ...s, directed: v })),
    dismiss: (id) => setState((s) => ({ ...s, dismissed: [...s.dismissed, `${s.me}:${id}`] })),
    setThreshold: (n) => setState((s) => ({ ...s, threshold: Math.max(1, Math.min(10, n)) })),
    reset: () => {
      setState(initial());
      setProfileId(null);
      setSuggestId(null);
      setToast('Demo reset to the original sample network.');
    },
    toast,
    notify,
    profileId,
    openProfile: setProfileId,
    suggestId,
    openSuggest: setSuggestId,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
