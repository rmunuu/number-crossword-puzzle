import { HelpCircle, RotateCcw, Send } from "lucide-react";
import type { ReactNode } from "react";

interface SubmitPanelProps {
  disabled: boolean;
  isSubmitting: boolean;
  maxSubmissions: number;
  onExitReview: () => void;
  onReset: () => void;
  onShowGuide: () => void;
  onSubmit: () => void;
  reviewMode: boolean;
  submissionCount: number;
  teamName: string;
  teamSelector?: ReactNode;
}

export function SubmitPanel({
  disabled,
  isSubmitting,
  maxSubmissions,
  onExitReview,
  onReset,
  onShowGuide,
  onSubmit,
  reviewMode,
  submissionCount,
  teamName,
  teamSelector
}: SubmitPanelProps) {
  const hasSubmissionSlot = submissionCount < maxSubmissions;
  const remainingSubmissions = Math.max(0, maxSubmissions - submissionCount);
  const submitLabel = !hasSubmissionSlot ? "제출 완료" : isSubmitting ? "제출 중" : `${submissionCount + 1}회차 제출`;

  return (
    <section className="submit-panel" aria-label="제출">
      <div>
        {teamSelector ?? (
          <>
            <span className="panel-label">팀</span>
            <strong>{teamName || "미선택"}</strong>
          </>
        )}
        <p>남은 제출기회 {remainingSubmissions}회</p>
      </div>
      <div className="submit-actions">
        <button type="button" className="secondary-action guide-action" onClick={onShowGuide}>
          <HelpCircle size={18} aria-hidden="true" />
          입력 설명서
        </button>
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
