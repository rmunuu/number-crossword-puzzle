import type { CellValue } from "../data/puzzle";

export function normalizeInput(key: string): CellValue | null {
  if (/^[0-9]$/.test(key)) return key as CellValue;
  if (key === "+") return "+";
  if (key === "-") return "-";
  if (key === "*") return "×";
  if (key === "/") return "÷";
  if (key === "f" || key === "F") return "!";
  if (key === "r" || key === "R") return "√";
  return null;
}
