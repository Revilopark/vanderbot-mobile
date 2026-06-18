// Vanderbot IAM Integration Layer
// Handles authentication, identity verification, and access control

const IAM_API_BASE = process.env.NEXT_PUBLIC_IAM_API_URL || "https://api.vanderbot.io/v1";

// ─── Types ─────────────────────────────────────────────────────────

export interface IAMUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "admin";
  cohort?: string;
  permissions: string[];
  avatar?: string;
}

export interface IAMSession {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: IAMUser;
}

export interface IAMContext {
  user: IAMUser | null;
  project: IAMProject | null;
  mode: string;
  memoryScope: string;
  confidence: number;
  rightsRisk: "low" | "medium" | "high";
}

export interface IAMProject {
  id: string;
  name: string;
  visibility: "private" | "team" | "cohort" | "public";
  members: IAMMember[];
  permissions: string[];
}

export interface IAMMember {
  userId: string;
  name: string;
  role: "owner" | "editor" | "viewer";
}

// ─── Storage ───────────────────────────────────────────────────────

const STORAGE_KEY = "vanderbot_iam_session";

function getStoredSession(): IAMSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as IAMSession;
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: IAMSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── API Client ────────────────────────────────────────────────────

async function iamFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (session) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }
  return fetch(`${IAM_API_BASE}${path}`, {
    ...options,
    headers,
  });
}

// ─── Auth Methods ──────────────────────────────────────────────────

export async function iamLogin(email: string, password: string): Promise<IAMSession> {
  const res = await iamFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Login failed");
  }
  const session: IAMSession = await res.json();
  storeSession(session);
  return session;
}

export async function iamSignup(email: string, password: string, name: string): Promise<IAMSession> {
  const res = await iamFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Signup failed");
  }
  const session: IAMSession = await res.json();
  storeSession(session);
  return session;
}

export async function iamLogout(): Promise<void> {
  const session = getStoredSession();
  if (session) {
    await iamFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }).catch(() => {});
  }
  clearSession();
}

export async function iamRefresh(): Promise<IAMSession | null> {
  const session = getStoredSession();
  if (!session) return null;
  const res = await iamFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const newSession: IAMSession = await res.json();
  storeSession(newSession);
  return newSession;
}

export function iamGetUser(): IAMUser | null {
  return getStoredSession()?.user || null;
}

export function iamIsAuthenticated(): boolean {
  return getStoredSession() !== null;
}

// ─── Project Access Control ────────────────────────────────────────

export async function iamGetProject(projectId: string): Promise<IAMProject | null> {
  const res = await iamFetch(`/projects/${projectId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function iamCheckPermission(projectId: string, action: string): Promise<boolean> {
  const res = await iamFetch(`/projects/${projectId}/check`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) return false;
  const { allowed } = await res.json();
  return allowed;
}

export async function iamGetContext(): Promise<IAMContext | null> {
  const res = await iamFetch("/context");
  if (!res.ok) return null;
  return res.json();
}

// ─── Mock Implementation (for demo/dev) ────────────────────────────

export function iamMockLogin(email: string, _password: string): IAMSession {
  const session: IAMSession = {
    token: "mock_token_" + Date.now(),
    refreshToken: "mock_refresh_" + Date.now(),
    expiresAt: Date.now() + 86400000,
    user: {
      id: "user_123",
      email,
      name: email.split("@")[0],
      role: "student",
      cohort: "Summer 2026",
      permissions: ["read", "write", "create_project"],
    },
  };
  storeSession(session);
  return session;
}

export function iamMockGetContext(): IAMContext {
  return {
    user: iamGetUser(),
    project: {
      id: "proj_1",
      name: "Sustainable Fashion Marketplace",
      visibility: "private",
      members: [
        { userId: "user_123", name: "You", role: "owner" },
      ],
      permissions: ["read", "write", "share", "delete"],
    },
    mode: "create",
    memoryScope: "Project + 3 files",
    confidence: 0.85,
    rightsRisk: "low",
  };
}
