/**
 * Browser helpers. The browser never talks to Supabase directly any more:
 * everything goes through our own /api routes and an HttpOnly session cookie.
 */
import { User } from '@/types/game';

export type LoginCode = 'wrong' | 'locked' | 'rate_limited' | 'no_pin' | 'network' | 'other';
export type LoginOutcome = { ok: true; user: User } | { ok: false; code: LoginCode; message: string };

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: boolean; status: number; data: T & { error?: string; code?: string } }> {
  try {
    const res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: '인터넷 연결을 확인해 주세요.', code: 'network' } as T & { error?: string; code?: string } };
  }
}

// Legacy unsigned cookie from the old version: just remove it.
export const clearLegacyCookie = (): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `haanriver-user-id=; expires=${new Date(0).toUTCString()}; path=/`;
};

const LAST_NAME_KEY = 'haanriver-last-name';
export const getLastName = (): string => {
  try {
    return localStorage.getItem(LAST_NAME_KEY) || '';
  } catch {
    return '';
  }
};

export const fetchMe = async (): Promise<User | null> => {
  const r = await call<{ user: User | null }>('/api/session');
  return r.ok ? r.data.user : null;
};

export const loginWithPin = async (name: string, pin: string): Promise<LoginOutcome> => {
  const r = await call<{ user: User }>('/api/session', { method: 'POST', body: { name: name.trim(), pin } });
  if (r.ok && r.data.user) {
    try {
      localStorage.setItem(LAST_NAME_KEY, name.trim());
    } catch {
      /* ignore */
    }
    clearLegacyCookie();
    return { ok: true, user: r.data.user };
  }
  const known: LoginCode[] = ['wrong', 'locked', 'rate_limited', 'no_pin', 'network'];
  const code = (known.includes(r.data.code as LoginCode) ? r.data.code : 'other') as LoginCode;
  return { ok: false, code, message: r.data.error || '로그인하지 못했어요.' };
};

export const logoutSession = async (): Promise<void> => {
  await call('/api/session', { method: 'DELETE' });
  clearLegacyCookie();
};

/** Ask the server for a signed "game started" token (used to bound the score by play time). */
export const startGameOnServer = async (): Promise<string | null> => {
  const r = await call<{ token: string }>('/api/games/start', { method: 'POST' });
  return r.ok ? r.data.token : null;
};

/** Save a finished game. The server validates the score and updates high_score itself. */
export const submitGameResult = async (
  token: string,
  score: number,
  round: number,
  virusesReachedBottom: number
): Promise<{ ok: boolean; highScore?: number; error?: string }> => {
  const r = await call<{ highScore: number }>('/api/scores', {
    method: 'POST',
    body: { token, score, round, virusesReachedBottom },
  });
  return r.ok ? { ok: true, highScore: r.data.highScore } : { ok: false, error: r.data.error };
};

export interface RankingRow {
  name: string;
  organization: string;
  score: number;
  playedAt: string;
}

export const fetchRankings = async (tab: 'weekly' | 'personal' | 'organization' | 'overall'): Promise<RankingRow[]> => {
  const r = await call<{ rows: RankingRow[] }>(`/api/rankings?tab=${tab}`);
  if (!r.ok) throw new Error(r.data.error || 'rankings failed');
  return r.data.rows;
};
