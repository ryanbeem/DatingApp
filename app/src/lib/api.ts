import { Platform } from 'react-native';
import { API_URL } from './config';
import type { Card, Conversation, Message, Options, Profile } from './types';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Query = Record<string, string | number | undefined>;

// Routes go through ?r= so the API works on hosts without URL rewriting.
function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams({ r: path });
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== '') params.set(k, String(v));
  }
  return `${API_URL}/index.php?${params.toString()}`;
}

async function request<T>(method: string, path: string, opts: { body?: unknown; form?: FormData; query?: Query } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) headers['X-Auth-Token'] = authToken;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(res.status, 'The server sent an unexpected response.');
  }
  if (!res.ok) {
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: 'seeker' | 'worker';
  first_name: string;
  birthdate: string;
}

export const api = {
  options: () => request<Options>('GET', '/options'),
  register: (input: RegisterInput) => request<{ token: string; user: Profile }>('POST', '/auth/register', { body: input }),
  login: (email: string, password: string) => request<{ token: string; user: Profile }>('POST', '/auth/login', { body: { email, password } }),
  logout: () => request<{ ok: boolean }>('POST', '/auth/logout'),

  me: () => request<Profile>('GET', '/me'),
  updateMe: (fields: Partial<Profile> & { quality_ids?: number[] }) => request<Profile>('PUT', '/me', { body: fields }),
  deleteMe: () => request<{ ok: boolean }>('DELETE', '/me'),

  uploadPhoto: async (uri: string, file?: File) => {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = file ?? (await (await fetch(uri)).blob());
      form.append('photo', blob, 'photo.jpg');
    } else {
      form.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    }
    return request<Profile>('POST', '/photos', { form });
  },
  deletePhoto: (id: number) => request<Profile>('DELETE', `/photos/${id}`),
  setMainPhoto: (id: number) => request<Profile>('POST', `/photos/${id}/main`),
  likePhoto: (id: number, like: boolean) =>
    request<{ photo_id: number; liked_by_me: boolean; like_count: number }>(like ? 'POST' : 'DELETE', `/photos/${id}/like`),

  discover: (filters: { job_title?: string; state?: string } = {}) =>
    request<{ cards: Card[] }>('GET', '/discover', { query: { limit: 20, ...filters } }),
  swipe: (targetId: number, direction: 'like' | 'pass') => request<{ matched: boolean }>('POST', '/swipes', { body: { target_id: targetId, direction } }),
  matches: () => request<{ matches: Card[] }>('GET', '/matches'),
  likes: () => request<{ likes: Card[] }>('GET', '/likes'),
  profile: (id: number) => request<Profile>('GET', `/profiles/${id}`),

  conversations: () => request<{ conversations: Conversation[] }>('GET', '/conversations'),
  messages: (partnerId: number, afterId = 0) => request<{ messages: Message[] }>('GET', `/messages/${partnerId}`, { query: { after_id: afterId } }),
  sendMessage: (partnerId: number, body: string) => request<{ message: Message }>('POST', `/messages/${partnerId}`, { body: { body } }),

  block: (userId: number) => request<{ ok: boolean }>('POST', `/users/${userId}/block`),
  report: (userId: number, reason: string) => request<{ ok: boolean }>('POST', `/users/${userId}/report`, { body: { reason } }),
};
