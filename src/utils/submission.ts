import type { CellValue } from "../data/puzzle";
import type { ScoreResult } from "./scoring";

export interface SubmissionPayload {
  authToken?: string;
  puzzleId: string;
  teamName: string;
  round: number;
  maxRounds: number;
  submittedAt: string;
  answers: Record<number, CellValue>;
  score: ScoreResult;
  userAgent: string;
}

export type SubmissionDelivery = "endpoint" | "local";

export interface SubmissionResult {
  delivery: SubmissionDelivery;
}

interface EndpointResponsePayload {
  ok?: boolean;
  error?: string;
}

interface CreateSubmissionPayloadArgs {
  puzzleId: string;
  teamName: string;
  round: number;
  maxRounds: number;
  answers: Record<number, CellValue>;
  authToken?: string;
  score: ScoreResult;
}

export function createSubmissionPayload({
  puzzleId,
  teamName,
  round,
  maxRounds,
  answers,
  authToken,
  score
}: CreateSubmissionPayloadArgs): SubmissionPayload {
  return {
    authToken,
    puzzleId,
    teamName,
    round,
    maxRounds,
    submittedAt: new Date().toISOString(),
    answers,
    score,
    userAgent: navigator.userAgent
  };
}

async function readEndpointResponse(response: Response): Promise<EndpointResponsePayload | null> {
  const responseText = await response.text();
  if (!responseText) return null;

  try {
    const parsed = JSON.parse(responseText) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as EndpointResponsePayload;
    return payload;
  } catch {
    return null;
  }
}

function getSubmitStatusError(status: number): string {
  if (status === 404) {
    return "제출 endpoint를 찾지 못했습니다. Apps Script 웹앱 URL이 /exec로 끝나는지, 새 버전으로 배포했는지 확인해 주세요.";
  }

  return `Submit failed: ${status}`;
}

export async function submitPayload(payload: SubmissionPayload): Promise<SubmissionResult> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT?.trim();
  console.log("Submission payload", payload);

  if (!endpoint) {
    return { delivery: "local" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(getSubmitStatusError(response.status));
  }

  const responsePayload = await readEndpointResponse(response);
  if (responsePayload?.ok === false) {
    throw new Error(responsePayload.error || "답안을 제출하지 못했습니다.");
  }

  return { delivery: "endpoint" };
}
