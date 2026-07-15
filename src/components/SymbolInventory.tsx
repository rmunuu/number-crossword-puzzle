import { ENTERABLE_VALUES, type CellValue } from "../data/puzzle";

export interface SymbolCount {
  total: number;
  used: number;
  value: Exclude<CellValue, "">;
}

interface SymbolInventoryProps {
  counts: SymbolCount[];
}

const valueLabels: Record<Exclude<CellValue, "">, string> = Object.fromEntries(
  ENTERABLE_VALUES.map((value) => [value, value])
) as Record<Exclude<CellValue, "">, string>;

export function SymbolInventory({ counts }: SymbolInventoryProps) {
  return (
    <section className="symbol-inventory" aria-label="기호별 입력 개수">
      <div className="symbol-inventory-heading">
        <span>입력 개수</span>
        <strong>현재 / 전체</strong>
      </div>
      <div className="symbol-count-grid">
        {counts.map((count) => {
          const isComplete = count.total > 0 && count.used === count.total;
          const isOver = count.used > count.total;
          const fillRatio = count.total === 0 ? 0 : Math.min(1, count.used / count.total);

          return (
            <div
              className={`symbol-count${isComplete ? " complete" : ""}${isOver ? " over" : ""}`}
              key={count.value}
            >
              <span className="symbol-token">{valueLabels[count.value]}</span>
              <strong>
                {count.used}/{count.total}
              </strong>
              <span className="symbol-meter" aria-hidden="true">
                <span style={{ width: `${fillRatio * 100}%` }} />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
