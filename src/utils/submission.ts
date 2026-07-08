import type { CellValue } from "../data/puzzle";
import type { ScoreResult } from "./scoring";

export interface SubmissionPayload {
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

interface CreateSubmissionPayloadArgs {
  puzzleId: string;
  teamName: string;
  round: number;
  maxRounds: number;
  answers: Record<number, CellValue>;
  score: ScoreResult;
}

export function createSubmissionPayload({
  puzzleId,
  teamName,
  round,
  maxRounds,
  answers,
  score
}: CreateSubmissionPayloadArgs): SubmissionPayload {
  return {
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
    throw new Error(`Submit failed: ${response.status}`);
  }

  return { delivery: "endpoint" };
}
