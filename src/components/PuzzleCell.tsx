import type { CSSProperties } from "react";
import type { CellValue, PuzzleCell as PuzzleCellType } from "../data/puzzle";

export type CellReviewStatus = "correct" | "incorrect";

interface PuzzleCellProps {
  cell: PuzzleCellType;
  disabled: boolean;
  isSelected: boolean;
  onSelect: (cellId: number) => void;
  status?: CellReviewStatus;
  value: CellValue;
}

export function PuzzleCell({ cell, disabled, isSelected, onSelect, status, value }: PuzzleCellProps) {
  const clueLabels =
    cell.clues?.map((clue) => ({
      number: clue.clueNumber,
      mark: clue.clueDirection === "across" ? "→" : "↓"
    })) ?? [];
  const style = {
    gridColumn: cell.col,
    gridRow: cell.row
  } satisfies CSSProperties;

  return (
    <button
      type="button"
      className={`cell${isSelected ? " selected" : ""}${status ? ` ${status}` : ""}`}
      style={style}
      disabled={disabled}
      aria-label={`${cell.sourceLabel ?? cell.id}번 칸${value ? `, ${value}` : ""}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(cell.id)}
    >
      {clueLabels.length > 0 ? (
        <span className="clue-label">
          {clueLabels.map((clue) => `${clue.number}${clue.mark}`).join(" ")}
        </span>
      ) : null}
      <span className="cell-value">{value}</span>
    </button>
  );
}
