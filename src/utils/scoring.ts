import type { CellValue } from "../data/puzzle";

export interface ScoreResult {
  totalCells: number;
  filledCells: number;
  correctCells: number;
  incorrectCells: number;
  isPerfect: boolean;
}

export function scoreAnswers(
  answers: Record<number, CellValue>,
  solution: Record<number, CellValue>
): ScoreResult {
  const solutionEntries = Object.entries(solution);
  const totalCells = solutionEntries.length;
  let filledCells = 0;
  let correctCells = 0;

  for (const [cellId, correctValue] of solutionEntries) {
    const value = answers[Number(cellId)] ?? "";
    if (value !== "") filledCells += 1;
    if (value === correctValue) correctCells += 1;
  }

  return {
    totalCells,
    filledCells,
    correctCells,
    incorrectCells: totalCells - correctCells,
    isPerfect: correctCells === totalCells
  };
}
