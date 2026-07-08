import { ENTERABLE_VALUES, type CellValue } from "../data/puzzle";

export interface SavedProgress {
  teamName: string;
  answers: Record<number, CellValue>;
  updatedAt: string;
}

const validValues = new Set<CellValue>(["", ...ENTERABLE_VALUES]);

export function getStorageKey(puzzleId: string, teamName: string): string {
  return `${puzzleId}:${teamName}`;
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

export function loadProgress(puzzleId: string, teamName: string): SavedProgress | null {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(getStorageKey(puzzleId, teamName));
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<SavedProgress>;
    return {
      teamName,
      answers: cleanAnswers(parsed.answers),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function saveProgress(
  puzzleId: string,
  teamName: string,
  answers: Record<number, CellValue>
): void {
  if (typeof window === "undefined") return;

  const payload: SavedProgress = {
    teamName,
    answers,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(getStorageKey(puzzleId, teamName), JSON.stringify(payload));
}

export function clearProgress(puzzleId: string, teamName: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(puzzleId, teamName));
}
