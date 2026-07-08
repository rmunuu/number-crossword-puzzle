import { RotateCcw, Send } from "lucide-react";

interface SubmitPanelProps {
  disabled: boolean;
  filledCells: number;
  isSubmitting: boolean;
  maxSubmissions: number;
  onExitReview: () => void;
  onReset: () => void;
  onSubmit: () => void;
  reviewMode: boolean;
  submissionCount: number;
  teamName: string;
  totalCells: number;
}

export function SubmitPanel({
  disabled,
  filledCells,
  isSubmitting,
  maxSubmissions,
  onExitReview,
  onReset,
  onSubmit,
  reviewMode,
  submissionCount,
  teamName,
  totalCells
}: SubmitPanelProps) {
  const hasSubmissionSlot = submissionCount < maxSubmissions;
  const submitLabel = !hasSubmissionSlot ? "제출 완료" : isSubmitting ? "제출 중" : `${submissionCount + 1}회차 제출`;

  return (
    <section className="submit-panel" aria-label="제출">
      <div>
        <span className="panel-label">현재 팀</span>
        <strong>{teamName || "미선택"}</strong>
        <p>
          {filledCells} / {totalCells}칸 입력
        </p>
        <p>
          제출 기회 {submissionCount} / {maxSubmissions}회 사용
        </p>
      </div>
      <div className="submit-actions">
        <button
          type="button"
          className="secondary-action"
          disabled={disabled || isSubmitting}
          onClick={reviewMode ? onExitReview : onReset}
        >
          <RotateCcw size={18} aria-hidden="true" />
          {reviewMode ? "입력 화면" : "초기화"}
        </button>
        <button
          type="button"
          className="primary-action"
          disabled={disabled || isSubmitting || reviewMode || !hasSubmissionSlot}
          onClick={onSubmit}
        >
          <Send size={18} aria-hidden="true" />
          {submitLabel}
        </button>
      </div>
    </section>
  );
}
