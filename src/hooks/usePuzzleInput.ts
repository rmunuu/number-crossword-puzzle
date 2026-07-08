import { useCallback, useMemo, useState } from "react";
import type { CellValue, PuzzleCell } from "../data/puzzle";

export type NavigationDirection = "up" | "down" | "left" | "right" | "next" | "previous";

function sortCells(a: PuzzleCell, b: PuzzleCell): number {
  return a.row - b.row || a.col - b.col || a.id - b.id;
}

export function usePuzzleInput(cells: PuzzleCell[]) {
  const orderedCells = useMemo(() => [...cells].sort(sortCells), [cells]);
  const firstCellId = orderedCells[0]?.id ?? null;
  const [selectedCellId, setSelectedCellId] = useState<number | null>(firstCellId);
  const [answers, setAnswers] = useState<Record<number, CellValue>>({});

  const cellById = useMemo(
    () => new Map(orderedCells.map((cell) => [cell.id, cell])),
    [orderedCells]
  );

  const getRelativeCellId = useCallback(
    (cellId: number, direction: NavigationDirection): number | null => {
      const current = cellById.get(cellId);
      if (!current) return firstCellId;

      if (direction === "next" || direction === "previous") {
        const index = orderedCells.findIndex((cell) => cell.id === cellId);
        if (index < 0) return firstCellId;
        const delta = direction === "next" ? 1 : -1;
        const nextIndex = (index + delta + orderedCells.length) % orderedCells.length;
        return orderedCells[nextIndex]?.id ?? cellId;
      }

      const candidates = orderedCells.filter((cell) => {
        if (direction === "up") return cell.col === current.col && cell.row < current.row;
        if (direction === "down") return cell.col === current.col && cell.row > current.row;
        if (direction === "left") return cell.row === current.row && cell.col < current.col;
        return cell.row === current.row && cell.col > current.col;
      });

      candidates.sort((a, b) => {
        if (direction === "up") return b.row - a.row;
        if (direction === "down") return a.row - b.row;
        if (direction === "left") return b.col - a.col;
        return a.col - b.col;
      });

      return candidates[0]?.id ?? cellId;
    },
    [cellById, firstCellId, orderedCells]
  );

  const moveSelection = useCallback(
    (direction: NavigationDirection) => {
      setSelectedCellId((currentCellId) => {
        if (currentCellId === null) return firstCellId;
        return getRelativeCellId(currentCellId, direction);
      });
    },
    [firstCellId, getRelativeCellId]
  );

  const inputValue = useCallback(
    (value: CellValue) => {
      if (value === "") return;
      const targetCellId = selectedCellId ?? firstCellId;
      if (targetCellId === null) return;

      setAnswers((currentAnswers) => ({
        ...currentAnswers,
        [targetCellId]: value
      }));
      setSelectedCellId(getRelativeCellId(targetCellId, "next"));
    },
    [firstCellId, getRelativeCellId, selectedCellId]
  );

  const clearValue = useCallback(() => {
    const targetCellId = selectedCellId ?? firstCellId;
    if (targetCellId === null) return;

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [targetCellId]: ""
    }));
  }, [firstCellId, selectedCellId]);

  const resetAnswers = useCallback(
    (nextAnswers: Record<number, CellValue> = {}) => {
      setAnswers(nextAnswers);
      setSelectedCellId(firstCellId);
    },
    [firstCellId]
  );

  const filledCount = useMemo(
    () => cells.reduce((count, cell) => count + (answers[cell.id] ? 1 : 0), 0),
    [answers, cells]
  );

  return {
    answers,
    clearValue,
    filledCount,
    inputValue,
    moveSelection,
    resetAnswers,
    selectedCellId,
    setAnswers,
    setSelectedCellId
  };
}
