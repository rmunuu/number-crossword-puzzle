import { History } from "lucide-react";
import type { SubmissionRecord } from "../utils/submissionHistory";

interface SubmissionHistoryProps {
  canLoadRecord: boolean;
  maxSubmissions: number;
  records: SubmissionRecord[];
  selectedRecordId: string | null;
  onLoadSelectedRecord: () => void;
  onSelectRecord: (recordId: string) => void;
}

function formatSubmittedAt(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function SubmissionHistory({
  canLoadRecord,
  maxSubmissions,
  records,
  onLoadSelectedRecord,
  selectedRecordId,
  onSelectRecord
}: SubmissionHistoryProps) {
  return (
    <section className="history-panel" aria-label="제출 기록">
      <div className="history-heading">
        <History size={18} aria-hidden="true" />
        <h2>제출 기록</h2>
        <span>
          {records.length} / {maxSubmissions}
        </span>
      </div>

      {records.length === 0 ? (
        <p className="empty-history">아직 제출 기록이 없습니다.</p>
      ) : (
        <div className="history-list">
          {records.map((record) => (
            <button
              type="button"
              className={`history-item${selectedRecordId === record.id ? " selected" : ""}`}
              key={record.id}
              onClick={() => onSelectRecord(record.id)}
            >
              <span>{record.round}회차</span>
              <strong>
                {record.score.correctCells} / {record.score.totalCells}
              </strong>
              <small>{formatSubmittedAt(record.submittedAt)}</small>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="history-edit-action"
        disabled={!selectedRecordId || !canLoadRecord}
        onClick={onLoadSelectedRecord}
      >
        선택 기록 수정
      </button>
    </section>
  );
}
