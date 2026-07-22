import { puzzle } from "../data/puzzle";
import { teams } from "../data/teams";

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
  if (session.role === "team" && !teams.includes(session.teamName as (typeof teams)[number])) return null;

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
  if (!responseText) {
    return {
      ok: false,
      error: "인증 응답이 비어 있습니다. Apps Script 웹앱을 최신 코드로 새 버전 배포했는지 확인해 주세요."
    };
  }

  try {
    const parsed = JSON.parse(responseText) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as VerifyAccessResponse) : {};
  } catch {
    return {
      ok: false,
      error: "인증 응답이 JSON이 아닙니다. Apps Script 웹앱 URL과 배포 권한을 확인해 주세요."
    };
  }
}

export async function verifyAccess(teamName: string, pin: string): Promise<AuthSession> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();
  if (!endpoint) {
    throw new Error("조 PIN 인증을 사용하려면 VITE_SUBMISSION_ENDPOINT가 필요합니다.");
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
    throw new Error("인증 응답이 올바르지 않습니다. Apps Script 코드를 최신 버전으로 다시 배포해 주세요.");
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
