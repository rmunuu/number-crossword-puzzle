interface ProgressBarProps {
  filled: number;
  total: number;
}

export function ProgressBar({ filled, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((filled / total) * 100);

  return (
    <section className="progress-panel" aria-label="입력 진행률">
      <div className="progress-copy">
        <span>입력 완료</span>
        <strong>
          {filled} / {total}칸
        </strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={filled}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}
