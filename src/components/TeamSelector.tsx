import { teams } from "../data/teams";

interface TeamSelectorProps {
  value: string;
  onChange: (teamName: string) => void;
}

export function TeamSelector({ value, onChange }: TeamSelectorProps) {
  return (
    <label className="team-selector">
      <span>팀</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">팀을 선택하세요</option>
        {teams.map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>
    </label>
  );
}
