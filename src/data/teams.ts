export const TEAM_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
export const TEAM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const teams = TEAM_LETTERS.flatMap((letter) =>
  TEAM_NUMBERS.map((number) => `${letter}-${number}`)
);

export type TeamName = (typeof teams)[number];
