import { ArrowLeft, RefreshCw, RotateCcw, ShieldAlert, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { loadLeaderboard, resetLeaderboard, type LeaderboardEntry } from "../utils/leaderboard";

interface LeaderboardPageProps {
  onBack: () => void;
}

function formatSubmittedAt(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<"endpoint" | "local">("local");

  const refreshLeaderboard = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setIsLoading(true);
    setMessage("");

    try {
      const result = await loadLeaderboard();
      setEntries(result.entries);
      setSource(result.source);
      if (result.source === "local") {
        setMessage("제출 endpoint가 없어 이 브라우저의 기록만 표시합니다.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "리더보드를 불러오지 못했습니다.");
    } finally {
      if (!options.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLeaderboard();
  }, [refreshLeaderboard]);

  useEffect(() => {
    const refreshIntervalId = window.setInterval(() => {
      void refreshLeaderboard({ silent: true });
    }, 10_000);

    return () => window.clearInterval(refreshIntervalId);
  }, [refreshLeaderboard]);

  const handleReset = useCallback(async () => {
    const promptMessage =
      source === "endpoint"
        ? "관리자 코드를 입력하면 전체 리더보드를 초기화합니다."
        : "제출 endpoint가 없어 이 브라우저의 리더보드 기록만 초기화합니다. 계속하려면 관리자 코드를 입력하세요.";
    const adminCode = window.prompt(promptMessage);
    if (!adminCode) return;

    const shouldReset = window.confirm("리더보드를 초기화할까요? 이 작업은 되돌릴 수 없습니다.");
    if (!shouldReset) return;

    setIsResetting(true);
    setMessage("");

    try {
      await resetLeaderboard(adminCode);
      setMessage("리더보드를 초기화했습니다.");
      await refreshLeaderboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "리더보드를 초기화하지 못했습니다.");
    } finally {
      setIsResetting(false);
    }
  }, [refreshLeaderboard, source]);

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <button type="button" className="secondary-action compact-action" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          제출 화면
        </button>
        <div>
          <p className="eyebrow">전체 순위</p>
          <h1>수식퍼즐 리더보드</h1>
        </div>
        <div className="leaderboard-tools">
          <button
            type="button"
            className="secondary-action compact-action"
            disabled={isLoading}
            onClick={() => {
              void refreshLeaderboard();
            }}
          >
            <RefreshCw size={18} aria-hidden="true" />
            새로고침
          </button>
          <button
            type="button"
            className="danger-action compact-action"
            disabled={isResetting}
            onClick={handleReset}
          >
            <ShieldAlert size={18} aria-hidden="true" />
            초기화
          </button>
        </div>
      </header>

      <main className="leaderboard-main">
        {message ? <p className="leaderboard-message">{message}</p> : null}

        <section className="leaderboard-table-wrap" aria-label="팀별 순위">
          {isLoading ? (
            <div className="leaderboard-empty">불러오는 중</div>
          ) : entries.length === 0 ? (
            <div className="leaderboard-empty">아직 제출 기록이 없습니다.</div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>팀명</th>
                  <th>맞춘 개수</th>
                  <th>남은 횟수</th>
                  <th>제출 시각</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={`${entry.teamName}-${entry.submittedAt}`}>
                    <td>
                      <span className="rank-cell">
                        {index === 0 ? <Trophy size={16} aria-hidden="true" /> : null}
                        {index + 1}
                      </span>
                    </td>
                    <td>{entry.teamName}</td>
                    <td>
                      <strong>
                        {entry.correctCells} / {entry.totalCells}
                      </strong>
                    </td>
                    <td>{entry.remainingRounds}</td>
                    <td>{formatSubmittedAt(entry.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
