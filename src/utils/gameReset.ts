import { puzzle } from "../data/puzzle";
import { teams } from "../data/teams";
import { getStorageKey } from "../hooks/useLocalStorage";
import { getSubmissionHistoryKey } from "./submissionHistory";

const resetMarkerKey = `${puzzle.puzzleId}:resetAt`;

interface ResetStatePayload {
  ok?: boolean;
  error?: string;
  resetAt?: string;
}

export function clearLocalGameState(): void {
  if (typeof window === "undefined") return;

  for (const teamName of teams) {
    window.localStorage.removeItem(getStorageKey(puzzle.puzzleId, teamName));
    window.localStorage.removeItem(getSubmissionHistoryKey(puzzle.puzzleId, teamName));
  }
}

export function applyGameReset(resetAt: unknown): boolean {
  if (typeof window === "undefined" || typeof resetAt !== "string") return false;

  const resetTime = new Date(resetAt).getTime();
  if (Number.isNaN(resetTime)) return false;

  const currentResetAt = window.localStorage.getItem(resetMarkerKey);
  const currentResetTime = currentResetAt ? new Date(currentResetAt).getTime() : Number.NaN;
  if (currentResetAt === resetAt || (!Number.isNaN(currentResetTime) && currentResetTime >= resetTime)) {
    return false;
  }

  clearLocalGameState();
  window.localStorage.setItem(resetMarkerKey, resetAt);
  return true;
}

export async function syncRemoteGameReset(): Promise<boolean> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();
  if (!endpoint) return false;

  const url = new URL(endpoint);
  url.searchParams.set("action", "state");
  url.searchParams.set("puzzleId", puzzle.puzzleId);

  const response = await fetch(url.toString(), {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Reset state failed: ${response.status}`);
  }

  const payload = (await response.json()) as ResetStatePayload;
  if (payload.ok === false) {
    throw new Error(payload.error ?? "게임 초기화 상태를 확인하지 못했습니다.");
  }

  return applyGameReset(payload.resetAt);
}
