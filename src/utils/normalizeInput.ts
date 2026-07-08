import type { CellValue } from "../data/puzzle";

export function normalizeInput(key: string, code = ""): CellValue | null {
  if (/^[0-9]$/.test(key)) return key as CellValue;
  if (key === "+") return "+";
  if (key === "-") return "-";
  if (key === "*") return "×";
  if (key === "/") return "÷";
  if (key === "f" || key === "F" || key === "ㄹ" || code === "KeyF") return "!";
  if (key === "r" || key === "R" || key === "ㄱ" || code === "KeyR") return "√";
  return null;
}
