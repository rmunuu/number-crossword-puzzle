import { teams } from "../data/teams";

interface TeamSelectorProps {
  value: string;
  onChange: (teamName: string) => void;
}

export function TeamSelector({ value, onChange }: TeamSelectorProps) {
  return (
    <label className="team-selector">
      <span>조</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">조를 선택하세요</option>
        {teams.map((team) => (
          <option key={team} value={team}>
            {team}
          </option>
        ))}
      </select>
    </label>
  );
}
