import type { CSSProperties } from "react";
import type { CellValue, PuzzleDefinition } from "../data/puzzle";
import { PuzzleCell, type CellReviewStatus } from "./PuzzleCell";

interface PuzzleGridProps {
  answers: Record<number, CellValue>;
  cellStatuses?: Record<number, CellReviewStatus>;
  disabled: boolean;
  puzzle: PuzzleDefinition;
  selectedCellId: number | null;
  onSelectCell: (cellId: number) => void;
}

export function PuzzleGrid({
  answers,
  cellStatuses,
  disabled,
  puzzle,
  selectedCellId,
  onSelectCell
}: PuzzleGridProps) {
  const gridStyle = {
    "--row-count": puzzle.rowCount,
    "--col-count": puzzle.colCount
  } as CSSProperties;

  return (
    <section className="puzzle-section" aria-label={puzzle.title}>
      <div className="puzzle-wrapper">
        <div className="puzzle-grid" style={gridStyle}>
          {puzzle.cells.map((cell) => (
            <PuzzleCell
              key={cell.id}
              cell={cell}
              disabled={disabled}
              isSelected={selectedCellId === cell.id}
              onSelect={onSelectCell}
              status={cellStatuses?.[cell.id]}
              value={answers[cell.id] ?? ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
