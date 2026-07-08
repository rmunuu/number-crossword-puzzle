import { Calculator } from "lucide-react";

interface HeaderProps {
  totalCells: number;
}

export function Header({ totalCells }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-mark" aria-hidden="true">
        <Calculator size={24} />
      </div>
      <div>
        <p className="eyebrow">온라인 제출</p>
        <h1>수식십자말풀이 답안 제출</h1>
      </div>
      <span className="cell-count-badge">{totalCells}칸</span>
    </header>
  );
}
