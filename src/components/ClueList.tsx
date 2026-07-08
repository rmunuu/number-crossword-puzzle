import type { Direction, PuzzleEntry } from "../data/puzzle";

interface ClueListProps {
  entries: PuzzleEntry[];
}

const directionLabels: Record<Direction, string> = {
  across: "가로",
  down: "세로"
};

export function ClueList({ entries }: ClueListProps) {
  const groups: Direction[] = ["across", "down"];

  return (
    <section className="clue-list" aria-label="문제 목표값">
      {groups.map((direction) => (
        <div className="clue-column" key={direction}>
          <h2>{directionLabels[direction]}</h2>
          <dl>
            {entries
              .filter((entry) => entry.direction === direction)
              .sort((a, b) => a.clueNumber - b.clueNumber)
              .map((entry) => (
                <div key={`${entry.direction}-${entry.clueNumber}`}>
                  <dt>{entry.clueNumber}</dt>
                  <dd>{entry.targetValue}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
