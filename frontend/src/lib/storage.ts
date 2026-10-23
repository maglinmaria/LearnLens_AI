/**
 * Local persistence helpers using localStorage.
 * Saved sessions, quiz scores, etc.
 */

export interface SavedSession {
  id: string;
  question: string;
  diagramSvg?: string;
  diagramType?: string;
  explanation?: string;
  lensIQ?: string;
  lensCheck?: object;
  quiz?: object[];
  createdAt: string;
  updatedAt: string;
}

const SESSIONS_KEY = "learnlens_sessions";

export function loadSessions(): SavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as SavedSession[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: Omit<SavedSession, "id" | "createdAt" | "updatedAt">): SavedSession {
  const sessions = loadSessions();
  const now = new Date().toISOString();
  const newSession: SavedSession = {
    ...session,
    id: `session_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  sessions.unshift(newSession);
  // Keep at most 50 sessions
  const trimmed = sessions.slice(0, 50);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  return newSession;
}

export function updateSession(id: string, updates: Partial<SavedSession>): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export function deleteSession(id: string): void {
  const sessions = loadSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
}

export function getSession(id: string): SavedSession | undefined {
  return loadSessions().find((s) => s.id === id);
}
