import { puzzle } from "../data/puzzle";

export type AuthRole = "team" | "admin";

export interface AuthSession {
  authenticatedAt: string;
  role: AuthRole;
  teamName: string;
  token: string;
}

interface VerifyAccessResponse {
  ok?: boolean;
  error?: string;
  role?: AuthRole;
  teamName?: string;
  token?: string;
}

const authSessionKey = `${puzzle.puzzleId}:authSession`;

function cleanSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<AuthSession>;

  if (
    (session.role !== "team" && session.role !== "admin") ||
    typeof session.token !== "string" ||
    typeof session.authenticatedAt !== "string"
  ) {
    return null;
  }

  if (session.role === "team" && typeof session.teamName !== "string") return null;

  return {
    authenticatedAt: session.authenticatedAt,
    role: session.role,
    teamName: session.role === "team" ? session.teamName ?? "" : "",
    token: session.token
  };
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(authSessionKey);
  if (!rawValue) return null;

  try {
    return cleanSession(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(authSessionKey, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(authSessionKey);
}

async function readVerifyResponse(response: Response): Promise<VerifyAccessResponse> {
  const responseText = await response.text();
  if (!responseText) return {};

  try {
    const parsed = JSON.parse(responseText) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as VerifyAccessResponse) : {};
  } catch {
    return {};
  }
}

export async function verifyAccess(teamName: string, pin: string): Promise<AuthSession> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();
  if (!endpoint) {
    throw new Error("팀 PIN 인증을 사용하려면 VITE_SUBMISSION_ENDPOINT가 필요합니다.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "verifyAccess",
      puzzleId: puzzle.puzzleId,
      teamName,
      pin
    })
  });

  if (!response.ok) {
    throw new Error(`인증 실패: ${response.status}`);
  }

  const payload = await readVerifyResponse(response);
  if (payload.ok === false) {
    throw new Error(payload.error ?? "PIN을 확인하지 못했습니다.");
  }
  if ((payload.role !== "team" && payload.role !== "admin") || typeof payload.token !== "string") {
    throw new Error("인증 응답이 올바르지 않습니다.");
  }

  const session: AuthSession = {
    authenticatedAt: new Date().toISOString(),
    role: payload.role,
    teamName: payload.role === "team" ? payload.teamName ?? teamName : "",
    token: payload.token
  };

  saveAuthSession(session);
  return session;
}
