import { Delete } from "lucide-react";
import type { CellValue } from "../data/puzzle";

const PAD_ROWS: Exclude<CellValue, "">[][] = [
  ["7", "8", "9", "+", "-"],
  ["4", "5", "6", "×", "÷"],
  ["1", "2", "3", "!", "√"],
  ["0"]
];

interface InputPadProps {
  disabled: boolean;
  onClear: () => void;
  onInput: (value: CellValue) => void;
}

export function InputPad({ disabled, onClear, onInput }: InputPadProps) {
  return (
    <section className="input-pad" aria-label="입력 패드">
      {PAD_ROWS.map((row, rowIndex) => (
        <div className="pad-row" key={`row-${rowIndex}`}>
          {row.map((value) => (
            <button
              type="button"
              className="pad-key"
              key={value}
              disabled={disabled}
              onClick={() => onInput(value)}
            >
              {value}
            </button>
          ))}
          {rowIndex === PAD_ROWS.length - 1 ? (
            <button type="button" className="pad-key clear-key" disabled={disabled} onClick={onClear}>
              <Delete size={18} aria-hidden="true" />
              지우기
            </button>
          ) : null}
        </div>
      ))}
    </section>
  );
}
