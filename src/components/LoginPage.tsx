import { Calculator, LogIn, Trophy } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { teams } from "../data/teams";
import { verifyAccess, type AuthSession } from "../utils/auth";

interface LoginPageProps {
  onAuthenticated: (session: AuthSession) => void;
  onOpenLeaderboard: () => void;
}

export function LoginPage({ onAuthenticated, onOpenLeaderboard }: LoginPageProps) {
  const [teamName, setTeamName] = useState("");
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pin.trim()) {
      setErrorMessage("PIN 또는 master code를 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const session = await verifyAccess(teamName, pin.trim());
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "인증하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">
          <Calculator size={28} />
        </div>
        <p className="eyebrow">온라인 제출</p>
        <h1 id="login-title">수식퍼즐</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>팀</span>
            <select value={teamName} onChange={(event) => setTeamName(event.target.value)}>
              <option value="">master code 또는 팀 선택</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>PIN</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
          </label>
          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
          <button type="submit" className="primary-action" disabled={isSubmitting}>
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? "확인 중" : "입장"}
          </button>
        </form>

        <button type="button" className="secondary-action" onClick={onOpenLeaderboard}>
          <Trophy size={18} aria-hidden="true" />
          리더보드
        </button>
      </section>
    </main>
  );
}
