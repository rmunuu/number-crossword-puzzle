import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ScoreResult } from "../utils/scoring";

export type SubmitModalKind = "confirm" | "success" | "error";

interface SubmitResultModalProps {
  isSubmitting: boolean;
  kind: SubmitModalKind;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  open: boolean;
  score: ScoreResult | null;
  showScore: boolean;
}

export function SubmitResultModal({
  isSubmitting,
  kind,
  message,
  onClose,
  onConfirm,
  open,
  score,
  showScore
}: SubmitResultModalProps) {
  if (!open) return null;

  const title = kind === "confirm" ? "미입력 칸 확인" : kind === "success" ? "제출 완료" : "제출 실패";
  const confirmLabel = kind === "error" ? "재시도" : "제출";

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="submit-modal-title">
        <div className={`modal-icon ${kind}`} aria-hidden="true">
          {kind === "success" ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
        </div>
        <h2 id="submit-modal-title">{title}</h2>
        <p>{message}</p>
        {showScore && score ? (
          <dl className="score-list">
            <div>
              <dt>정답</dt>
              <dd>
                {score.correctCells} / {score.totalCells}
              </dd>
            </div>
            <div>
              <dt>입력</dt>
              <dd>
                {score.filledCells} / {score.totalCells}
              </dd>
            </div>
            <div>
              <dt>완성</dt>
              <dd>{score.isPerfect ? "예" : "아니오"}</dd>
            </div>
          </dl>
        ) : null}
        <div className="modal-actions">
          {kind === "success" ? (
            <button type="button" className="primary-action" onClick={onClose}>
              확인
            </button>
          ) : (
            <>
              <button type="button" className="secondary-action" disabled={isSubmitting} onClick={onClose}>
                취소
              </button>
              {onConfirm ? (
                <button type="button" className="primary-action" disabled={isSubmitting} onClick={onConfirm}>
                  {isSubmitting ? "처리 중" : confirmLabel}
                </button>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
