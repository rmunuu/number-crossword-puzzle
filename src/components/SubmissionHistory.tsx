import { History } from "lucide-react";
import { formatSeoulSubmittedAt } from "../utils/dateTime";
import type { SubmissionRecord } from "../utils/submissionHistory";

interface SubmissionHistoryProps {
  canLoadRecord: boolean;
  maxSubmissions: number;
  records: SubmissionRecord[];
  selectedRecordId: string | null;
  onLoadSelectedRecord: () => void;
  onSelectRecord: (recordId: string) => void;
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
        <button
          type="button"
          className="history-edit-action"
          disabled={!selectedRecordId || !canLoadRecord}
          onClick={onLoadSelectedRecord}
        >
          선택 기록 수정
        </button>
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
              <small>{formatSeoulSubmittedAt(record.submittedAt)}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
