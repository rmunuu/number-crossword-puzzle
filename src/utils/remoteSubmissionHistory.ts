import { ENTERABLE_VALUES, type CellValue } from "../data/puzzle";
import type { SubmissionRecord } from "./submissionHistory";

interface LoadRemoteSubmissionHistoryArgs {
  authToken: string;
  puzzleId: string;
  teamName: string;
}

interface RemoteSubmissionHistoryResponse {
  entries?: unknown;
  error?: string;
  ok?: boolean;
}

const validValues = new Set<CellValue>(["", ...ENTERABLE_VALUES]);

function cleanAnswers(value: unknown): Record<number, CellValue> {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([cellId, cellValue]) => [Number(cellId), cellValue])
      .filter(([cellId, cellValue]) => Number.isInteger(cellId) && validValues.has(cellValue as CellValue))
      .map(([cellId, cellValue]) => [cellId, cellValue as CellValue])
  ) as Record<number, CellValue>;
}

function cleanRemoteRecord(value: unknown): SubmissionRecord | null {
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
    delivery: "endpoint"
  };
}

async function readRemoteHistoryResponse(response: Response): Promise<RemoteSubmissionHistoryResponse> {
  const responseText = await response.text();
  if (!responseText) return {};

  try {
    const parsed = JSON.parse(responseText) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as RemoteSubmissionHistoryResponse) : {};
  } catch {
    return {
      ok: false,
      error: "제출 기록 응답이 JSON이 아닙니다. Apps Script 웹앱을 최신 코드로 새 버전 배포했는지 확인해 주세요."
    };
  }
}

export async function loadRemoteSubmissionHistory({
  authToken,
  puzzleId,
  teamName
}: LoadRemoteSubmissionHistoryArgs): Promise<SubmissionRecord[] | null> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "submissionHistory",
      authToken,
      puzzleId,
      teamName
    })
  });

  if (!response.ok) {
    throw new Error(`제출 기록 동기화 실패: ${response.status}`);
  }

  const payload = await readRemoteHistoryResponse(response);
  if (payload.ok === false) {
    throw new Error(payload.error ?? "제출 기록을 불러오지 못했습니다.");
  }

  if (!Array.isArray(payload.entries)) return [];
  return payload.entries
    .map(cleanRemoteRecord)
    .filter((record): record is SubmissionRecord => record !== null)
    .sort((a, b) => a.round - b.round || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
}
