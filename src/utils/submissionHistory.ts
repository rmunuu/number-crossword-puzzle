import { ENTERABLE_VALUES, type CellValue } from "../data/puzzle";
import type { ScoreResult } from "./scoring";
import type { SubmissionDelivery } from "./submission";

export const MAX_SUBMISSION_ROUNDS = 3;

export interface SubmissionRecord {
  id: string;
  round: number;
  submittedAt: string;
  answers: Record<number, CellValue>;
  score: ScoreResult;
  delivery: SubmissionDelivery;
}

const validValues = new Set<CellValue>(["", ...ENTERABLE_VALUES]);

export function getSubmissionHistoryKey(puzzleId: string, teamName: string): string {
  return `${puzzleId}:${teamName}:submissions`;
}

function cleanAnswers(value: unknown): Record<number, CellValue> {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([cellId, cellValue]) => [Number(cellId), cellValue])
      .filter(([cellId, cellValue]) => Number.isInteger(cellId) && validValues.has(cellValue as CellValue))
      .map(([cellId, cellValue]) => [cellId, cellValue as CellValue])
  ) as Record<number, CellValue>;
}

function cleanRecord(value: unknown): SubmissionRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<SubmissionRecord>;

  if (
    typeof record.id !== "string" ||
    typeof record.round !== "number" ||
    typeof record.submittedAt !== "string" ||
    !record.score ||
    typeof record.score.correctCells !== "number"
  ) {
    return null;
  }

  return {
    id: record.id,
    round: record.round,
    submittedAt: record.submittedAt,
    answers: cleanAnswers(record.answers),
    score: record.score,
    delivery: record.delivery === "endpoint" ? "endpoint" : "local"
  };
}

export function loadSubmissionHistory(puzzleId: string, teamName: string): SubmissionRecord[] {
  if (typeof window === "undefined") return [];

  const rawValue = window.localStorage.getItem(getSubmissionHistoryKey(puzzleId, teamName));
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(cleanRecord).filter((record): record is SubmissionRecord => record !== null);
  } catch {
    return [];
  }
}

export function saveSubmissionHistory(
  puzzleId: string,
  teamName: string,
  records: SubmissionRecord[]
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getSubmissionHistoryKey(puzzleId, teamName), JSON.stringify(records));
}
