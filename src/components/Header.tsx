import { Calculator, Trophy } from "lucide-react";

interface HeaderProps {
  onOpenLeaderboard: () => void;
  totalCells: number;
}

export function Header({ onOpenLeaderboard, totalCells }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-mark" aria-hidden="true">
        <Calculator size={24} />
      </div>
      <div>
        <p className="eyebrow">온라인 제출</p>
        <h1>수식퍼즐</h1>
      </div>
      <div className="header-actions">
        <span className="cell-count-badge">{totalCells}칸</span>
        <button type="button" className="secondary-action compact-action" onClick={onOpenLeaderboard}>
          <Trophy size={18} aria-hidden="true" />
          리더보드
        </button>
      </div>
    </header>
  );
}
