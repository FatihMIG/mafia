const NICKNAME_KEY = "wolf.nickname";
const SESSION_KEY = "wolf.session";

export interface StoredSession {
  roomCode: string;
  sessionToken: string;
}

export function getStoredNickname(): string {
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

export function setStoredNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function getStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
