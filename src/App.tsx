import { useCallback, useEffect, useMemo, useState } from "react";
import { ClueList } from "./components/ClueList";
import { Header } from "./components/Header";
import { InputGuideModal } from "./components/InputGuideModal";
import { LeaderboardPage } from "./components/LeaderboardPage";
import { LoginPage } from "./components/LoginPage";
import { PuzzleGrid } from "./components/PuzzleGrid";
import { SubmissionHistory } from "./components/SubmissionHistory";
import { SubmitPanel } from "./components/SubmitPanel";
import { SubmitResultModal, type SubmitModalKind } from "./components/SubmitResultModal";
import { SymbolInventory, type SymbolCount } from "./components/SymbolInventory";
import { TeamSelector } from "./components/TeamSelector";
import { ENTERABLE_VALUES, type CellValue } from "./data/puzzle";
import { puzzle } from "./data/puzzle";
import { solution } from "./data/solution";
import { clearProgress, loadProgress, saveProgress } from "./hooks/useLocalStorage";
import { useKeyboardInput } from "./hooks/useKeyboardInput";
import { usePuzzleInput } from "./hooks/usePuzzleInput";
import { clearAuthSession, loadAuthSession, saveAuthSession, type AuthSession } from "./utils/auth";
import { syncRemoteGameReset } from "./utils/gameReset";
import { scoreAnswers, type ScoreResult } from "./utils/scoring";
import { createSubmissionPayload, submitPayload } from "./utils/submission";
import {
  loadSubmissionHistory,
  MAX_SUBMISSION_ROUNDS,
  saveSubmissionHistory,
  type SubmissionRecord
} from "./utils/submissionHistory";

interface ModalState {
  kind: SubmitModalKind;
  message: string;
}

function getCompleteAnswers(answers: Record<number, CellValue>): Record<number, CellValue> {
  return Object.fromEntries(puzzle.cells.map((cell) => [cell.id, answers[cell.id] ?? ""])) as Record<
    number,
    CellValue
  >;
}

function getCellStatuses(answers: Record<number, CellValue>): Record<number, "correct" | "incorrect"> {
  return Object.fromEntries(
    puzzle.cells.map((cell) => [cell.id, (answers[cell.id] ?? "") === solution[cell.id] ? "correct" : "incorrect"])
  ) as Record<number, "correct" | "incorrect">;
}

function getSymbolCounts(answers: Record<number, CellValue>): SymbolCount[] {
  const totals = new Map<CellValue, number>();
  const used = new Map<CellValue, number>();

  for (const value of Object.values(solution)) {
    if (!value) continue;
    totals.set(value, (totals.get(value) ?? 0) + 1);
  }

  for (const value of Object.values(answers)) {
    if (!value) continue;
    used.set(value, (used.get(value) ?? 0) + 1);
  }

  return ENTERABLE_VALUES.map((value) => ({
    value,
    total: totals.get(value) ?? 0,
    used: used.get(value) ?? 0
  }));
}

interface SubmitAppProps {
  onLogout: () => void;
  onOpenLeaderboard: () => void;
  session: AuthSession;
}

function SubmitApp({ onLogout, onOpenLeaderboard, session }: SubmitAppProps) {
  const isAdmin = session.role === "admin";
  const [teamName, setTeamName] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [lastScore, setLastScore] = useState<ScoreResult | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionRecord[]>([]);
  const [reviewRecordId, setReviewRecordId] = useState<string | null>(null);

  const {
    answers,
    clearValue,
    filledCount,
    inputValue,
    moveSelection,
    resetAnswers,
    selectedCellId,
    setSelectedCellId
  } = usePuzzleInput(puzzle.cells);

  const selectedReviewRecord = useMemo(
    () => submissionHistory.find((record) => record.id === reviewRecordId) ?? null,
    [reviewRecordId, submissionHistory]
  );
  const reviewMode = selectedReviewRecord !== null;
  const hasSubmissionSlot = submissionHistory.length < MAX_SUBMISSION_ROUNDS;
  const inputDisabled = !teamName || isSubmitting || reviewMode || !hasSubmissionSlot;
  const missingCells = useMemo(() => puzzle.totalCells - filledCount, [filledCount]);
  const visibleAnswers = selectedReviewRecord?.answers ?? answers;
  const symbolCounts = useMemo(() => getSymbolCounts(visibleAnswers), [visibleAnswers]);
  const visibleCellStatuses = useMemo(
    () => (selectedReviewRecord ? getCellStatuses(selectedReviewRecord.answers) : undefined),
    [selectedReviewRecord]
  );

  useKeyboardInput({
    enabled: !inputDisabled,
    onClear: clearValue,
    onInput: inputValue,
    onMove: moveSelection
  });

  useEffect(() => {
    if (!teamName) return;
    saveProgress(puzzle.puzzleId, teamName, answers);
  }, [answers, teamName]);

  useEffect(() => {
    let cancelled = false;

    async function syncResetState() {
      try {
        const wasReset = await syncRemoteGameReset();
        if (!wasReset || cancelled) return;

        resetAnswers({});
        setSubmissionHistory([]);
        setReviewRecordId(null);
        setLastScore(null);
        setModal(null);
      } catch (error) {
        console.warn("Game reset sync failed", error);
      }
    }

    void syncResetState();
    const syncIntervalId = window.setInterval(syncResetState, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(syncIntervalId);
    };
  }, [resetAnswers]);

  const handleTeamChange = useCallback(
    (nextTeamName: string) => {
      if (!isAdmin && nextTeamName !== session.teamName) return;

      setTeamName(nextTeamName);
      setLastScore(null);
      setModal(null);
      setReviewRecordId(null);

      if (!nextTeamName) {
        resetAnswers({});
        setSubmissionHistory([]);
        return;
      }

      const savedProgress = loadProgress(puzzle.puzzleId, nextTeamName);
      const savedHistory = loadSubmissionHistory(puzzle.puzzleId, nextTeamName);
      resetAnswers(savedProgress?.answers ?? {});
      setSubmissionHistory(savedHistory);
      setReviewRecordId(savedHistory[savedHistory.length - 1]?.id ?? null);
    },
    [isAdmin, resetAnswers, session.teamName]
  );

  useEffect(() => {
    if (session.role === "team") {
      handleTeamChange(session.teamName);
    }
  }, [handleTeamChange, session.role, session.teamName]);

  const handleReset = useCallback(() => {
    if (!teamName) return;

    const shouldReset = window.confirm(`${teamName} 팀의 저장된 답안을 초기화할까요?`);
    if (!shouldReset) return;

    clearProgress(puzzle.puzzleId, teamName);
    resetAnswers({});
    setLastScore(null);
    setModal(null);
    setReviewRecordId(null);
  }, [resetAnswers, teamName]);

  const handleLoadSelectedRecordForEdit = useCallback(() => {
    if (!teamName || !selectedReviewRecord || !hasSubmissionSlot) return;

    resetAnswers(selectedReviewRecord.answers);
    setReviewRecordId(null);
    setLastScore(null);
    setModal(null);
  }, [hasSubmissionSlot, resetAnswers, selectedReviewRecord, teamName]);

  const submitCurrentAnswers = useCallback(async () => {
    if (!teamName) return;
    if (submissionHistory.length >= MAX_SUBMISSION_ROUNDS) {
      setModal({
        kind: "error",
        message: "이미 3번의 제출 기회를 모두 사용했습니다."
      });
      return;
    }

    setIsSubmitting(true);

    const completeAnswers = getCompleteAnswers(answers);
    const score = scoreAnswers(completeAnswers, solution);
    const round = submissionHistory.length + 1;
    const payload = createSubmissionPayload({
      puzzleId: puzzle.puzzleId,
      teamName,
      round,
      maxRounds: MAX_SUBMISSION_ROUNDS,
      answers: completeAnswers,
      authToken: session.token,
      score
    });

    try {
      const result = await submitPayload(payload);
      const record: SubmissionRecord = {
        id: `${puzzle.puzzleId}:${teamName}:${round}:${payload.submittedAt}`,
        round,
        submittedAt: payload.submittedAt,
        answers: completeAnswers,
        score,
        delivery: result.delivery
      };
      const nextHistory = [...submissionHistory, record];
      setSubmissionHistory(nextHistory);
      saveSubmissionHistory(puzzle.puzzleId, teamName, nextHistory);
      setReviewRecordId(record.id);
      setLastScore(score);
      setModal({
        kind: "success",
        message:
          result.delivery === "endpoint"
            ? `${round}회차 답안이 제출 저장소에 기록되었습니다.`
            : `${round}회차 답안이 이 브라우저의 제출 기록에 저장되었습니다.`
      });
    } catch (error) {
      setModal({
        kind: "error",
        message: error instanceof Error ? error.message : "답안을 제출하지 못했습니다."
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, session.token, submissionHistory, teamName]);

  const handleSubmitRequest = useCallback(() => {
    if (!teamName) return;
    if (reviewMode) return;

    if (missingCells > 0) {
      setModal({
        kind: "confirm",
        message: `아직 ${missingCells}칸이 비어 있습니다. ${submissionHistory.length + 1}회차로 제출할까요?`
      });
      return;
    }

    void submitCurrentAnswers();
  }, [missingCells, reviewMode, submissionHistory.length, submitCurrentAnswers, teamName]);

  return (
    <div className="app-shell">
      <Header
        authLabel={isAdmin ? "관리자" : session.teamName}
        onLogout={onLogout}
        onOpenLeaderboard={onOpenLeaderboard}
        totalCells={puzzle.totalCells}
      />

      <main className="app-main">
        <section className="top-dashboard">
          <SubmitPanel
            disabled={!teamName}
            isSubmitting={isSubmitting}
            maxSubmissions={MAX_SUBMISSION_ROUNDS}
            onExitReview={() => setReviewRecordId(null)}
            onReset={handleReset}
            onShowGuide={() => setIsGuideOpen(true)}
            onSubmit={handleSubmitRequest}
            reviewMode={reviewMode}
            submissionCount={submissionHistory.length}
            teamName={teamName}
            teamSelector={isAdmin ? <TeamSelector value={teamName} onChange={handleTeamChange} /> : undefined}
          />
          <SubmissionHistory
            canLoadRecord={hasSubmissionSlot}
            maxSubmissions={MAX_SUBMISSION_ROUNDS}
            onLoadSelectedRecord={handleLoadSelectedRecordForEdit}
            records={submissionHistory}
            selectedRecordId={reviewRecordId}
            onSelectRecord={setReviewRecordId}
          />
          <SymbolInventory counts={symbolCounts} />
        </section>

        <div className="board-row">
          <PuzzleGrid
            answers={visibleAnswers}
            cellStatuses={visibleCellStatuses}
            disabled={!teamName || reviewMode || !hasSubmissionSlot}
            puzzle={puzzle}
            selectedCellId={reviewMode ? null : selectedCellId}
            onSelectCell={setSelectedCellId}
          />
          <ClueList entries={puzzle.entries} />
        </div>
      </main>

      <SubmitResultModal
        isSubmitting={isSubmitting}
        kind={modal?.kind ?? "success"}
        message={modal?.message ?? ""}
        onClose={() => setModal(null)}
        onConfirm={modal?.kind === "confirm" || modal?.kind === "error" ? submitCurrentAnswers : undefined}
        open={modal !== null}
        score={lastScore}
        showScore={modal?.kind === "success"}
      />
      <InputGuideModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

function getCurrentRoute(): "submit" | "leaderboard" {
  return window.location.hash === "#/leaderboard" ? "leaderboard" : "submit";
}

export default function App() {
  const [route, setRoute] = useState<"submit" | "leaderboard">(getCurrentRoute);
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession());

  useEffect(() => {
    function handleHashChange() {
      setRoute(getCurrentRoute());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openLeaderboard = useCallback(() => {
    window.location.hash = "/leaderboard";
    setRoute("leaderboard");
  }, []);

  const openSubmit = useCallback(() => {
    window.location.hash = "";
    setRoute("submit");
  }, []);

  const handleAuthenticated = useCallback((nextSession: AuthSession) => {
    saveAuthSession(nextSession);
    setSession(nextSession);
    window.location.hash = "";
    setRoute("submit");
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    window.location.hash = "";
    setRoute("submit");
  }, []);

  if (route === "leaderboard") {
    return <LeaderboardPage onBack={openSubmit} />;
  }

  if (!session) {
    return <LoginPage onAuthenticated={handleAuthenticated} onOpenLeaderboard={openLeaderboard} />;
  }

  return <SubmitApp onLogout={handleLogout} onOpenLeaderboard={openLeaderboard} session={session} />;
}
