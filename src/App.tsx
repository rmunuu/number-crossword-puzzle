import { useCallback, useEffect, useMemo, useState } from "react";
import { ClueList } from "./components/ClueList";
import { Header } from "./components/Header";
import { InputPad } from "./components/InputPad";
import { ProgressBar } from "./components/ProgressBar";
import { PuzzleGrid } from "./components/PuzzleGrid";
import { SubmissionHistory } from "./components/SubmissionHistory";
import { SubmitPanel } from "./components/SubmitPanel";
import { SubmitResultModal, type SubmitModalKind } from "./components/SubmitResultModal";
import { TeamSelector } from "./components/TeamSelector";
import type { CellValue } from "./data/puzzle";
import { puzzle } from "./data/puzzle";
import { solution } from "./data/solution";
import { clearProgress, loadProgress, saveProgress } from "./hooks/useLocalStorage";
import { useKeyboardInput } from "./hooks/useKeyboardInput";
import { usePuzzleInput } from "./hooks/usePuzzleInput";
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

export default function App() {
  const [teamName, setTeamName] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [lastScore, setLastScore] = useState<ScoreResult | null>(null);
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

  const handleTeamChange = useCallback(
    (nextTeamName: string) => {
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
    [resetAnswers]
  );

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

  const submitCurrentAnswers = useCallback(async () => {
    if (!teamName) return;
    if (submissionHistory.length >= MAX_SUBMISSION_ROUNDS) {
      setModal({
        kind: "error",
        message: "이미 5번의 제출 기회를 모두 사용했습니다."
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
            : `${round}회차 제출 JSON 파일을 다운로드했습니다.`
      });
    } catch (error) {
      setModal({
        kind: "error",
        message: error instanceof Error ? error.message : "답안을 제출하지 못했습니다."
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, submissionHistory, teamName]);

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
      <Header totalCells={puzzle.totalCells} />

      <main className="app-main">
        <section className="control-band">
          <TeamSelector value={teamName} onChange={handleTeamChange} />
          <ProgressBar filled={filledCount} total={puzzle.totalCells} />
        </section>

        <div className="workspace">
          <PuzzleGrid
            answers={visibleAnswers}
            cellStatuses={visibleCellStatuses}
            disabled={!teamName || reviewMode || !hasSubmissionSlot}
            puzzle={puzzle}
            selectedCellId={reviewMode ? null : selectedCellId}
            onSelectCell={setSelectedCellId}
          />

          <aside className="side-panel">
            <InputPad disabled={inputDisabled} onClear={clearValue} onInput={inputValue} />
            <SubmitPanel
              disabled={!teamName}
              filledCells={filledCount}
              isSubmitting={isSubmitting}
              maxSubmissions={MAX_SUBMISSION_ROUNDS}
              onExitReview={() => setReviewRecordId(null)}
              onReset={handleReset}
              onSubmit={handleSubmitRequest}
              reviewMode={reviewMode}
              submissionCount={submissionHistory.length}
              teamName={teamName}
              totalCells={puzzle.totalCells}
            />
            <SubmissionHistory
              maxSubmissions={MAX_SUBMISSION_ROUNDS}
              records={submissionHistory}
              selectedRecordId={reviewRecordId}
              onSelectRecord={setReviewRecordId}
            />
            <ClueList entries={puzzle.entries} />
          </aside>
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
    </div>
  );
}
