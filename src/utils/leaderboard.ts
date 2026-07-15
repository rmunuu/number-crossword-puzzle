import { puzzle } from "../data/puzzle";
import { teams } from "../data/teams";
import { applyGameReset, clearLocalGameState } from "./gameReset";
import { MAX_SUBMISSION_ROUNDS, loadSubmissionHistory, type SubmissionRecord } from "./submissionHistory";

export interface LeaderboardEntry {
  teamName: string;
  correctCells: number;
  totalCells: number;
  remainingRounds: number;
  submittedAt: string;
  submissionCount: number;
  round: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  resetAt?: string;
  source: "endpoint" | "local";
}

const TIMESTAMP_MODE_ISO_TEXT = "iso-text-v2";
const LEGACY_ENDPOINT_TIME_SHIFT_MS = 7 * 60 * 60 * 1000;

type EndpointLeaderboardEntry = Partial<LeaderboardEntry> & {
  maxRounds?: number;
};

function compareLeaderboardEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return b.correctCells - a.correctCells || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
}

function pickBestRecord(records: SubmissionRecord[]): SubmissionRecord | null {
  if (records.length === 0) return null;

  return [...records].sort((a, b) => {
    return (
      b.score.correctCells - a.score.correctCells ||
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );
  })[0];
}

export function getLocalLeaderboardEntries(): LeaderboardEntry[] {
  return teams
    .map<LeaderboardEntry | null>((teamName) => {
      const records = loadSubmissionHistory(puzzle.puzzleId, teamName);
      const bestRecord = pickBestRecord(records);
      if (!bestRecord) return null;

      return {
        teamName,
        correctCells: bestRecord.score.correctCells,
        totalCells: bestRecord.score.totalCells,
        remainingRounds: Math.max(0, MAX_SUBMISSION_ROUNDS - records.length),
        submittedAt: bestRecord.submittedAt,
        submissionCount: records.length,
        round: bestRecord.round
      };
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null)
    .sort(compareLeaderboardEntries);
}

function normalizeEndpointSubmittedAt(value: string, timestampMode: unknown): string {
  if (timestampMode === TIMESTAMP_MODE_ISO_TEXT) return value;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  return new Date(timestamp + LEGACY_ENDPOINT_TIME_SHIFT_MS).toISOString();
}

function normalizeSubmissionCount(candidate: EndpointLeaderboardEntry): number {
  if (typeof candidate.submissionCount === "number") {
    return Math.max(0, Math.floor(candidate.submissionCount));
  }

  if (typeof candidate.round === "number") {
    return Math.max(0, Math.floor(candidate.round));
  }

  return 0;
}

function normalizeRemainingRounds(_candidate: EndpointLeaderboardEntry, submissionCount: number): number {
  return Math.max(0, MAX_SUBMISSION_ROUNDS - submissionCount);
}

function normalizeEndpointEntries(value: unknown): LeaderboardEntry[] {
  const timestampMode =
    value && typeof value === "object" ? (value as { timestampMode?: unknown }).timestampMode : undefined;
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { entries?: unknown }).entries)
      ? (value as { entries: unknown[] }).entries
      : [];

  return entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as EndpointLeaderboardEntry;
      if (
        typeof candidate.teamName !== "string" ||
        typeof candidate.correctCells !== "number" ||
        typeof candidate.totalCells !== "number" ||
        typeof candidate.submittedAt !== "string"
      ) {
        return null;
      }

      const submissionCount = normalizeSubmissionCount(candidate);

      return {
        teamName: candidate.teamName,
        correctCells: candidate.correctCells,
        totalCells: candidate.totalCells,
        remainingRounds: normalizeRemainingRounds(candidate, submissionCount),
        submittedAt: normalizeEndpointSubmittedAt(candidate.submittedAt, timestampMode),
        submissionCount,
        round: typeof candidate.round === "number" ? candidate.round : 0
      };
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null)
    .sort(compareLeaderboardEntries);
}

function getEndpointResetAt(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const resetAt = (value as { resetAt?: unknown }).resetAt;
  return typeof resetAt === "string" ? resetAt : undefined;
}

export async function loadLeaderboard(): Promise<LeaderboardResult> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();

  if (!endpoint) {
    return {
      entries: getLocalLeaderboardEntries(),
      source: "local"
    };
  }

  const url = new URL(endpoint);
  url.searchParams.set("action", "leaderboard");
  url.searchParams.set("puzzleId", puzzle.puzzleId);

  const response = await fetch(url.toString(), {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Leaderboard failed: ${response.status}`);
  }

  const payload = (await response.json()) as { ok?: boolean; error?: string } | unknown;
  if (payload && typeof payload === "object" && (payload as { ok?: boolean }).ok === false) {
    throw new Error((payload as { error?: string }).error ?? "리더보드를 불러오지 못했습니다.");
  }

  const resetAt = getEndpointResetAt(payload);
  applyGameReset(resetAt);

  return {
    entries: normalizeEndpointEntries(payload),
    resetAt,
    source: "endpoint"
  };
}

export async function resetLeaderboard(adminCode: string): Promise<void> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();

  if (!endpoint) {
    clearLocalGameState();
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "resetLeaderboard",
      puzzleId: puzzle.puzzleId,
      adminCode
    })
  });

  if (!response.ok) {
    throw new Error(`Reset failed: ${response.status}`);
  }

  const payload = (await response.json()) as { ok?: boolean; error?: string; resetAt?: string };
  if (payload.ok === false) {
    throw new Error(payload.error ?? "리더보드를 초기화하지 못했습니다.");
  }

  if (payload.resetAt) {
    applyGameReset(payload.resetAt);
  } else {
    clearLocalGameState();
  }
}
