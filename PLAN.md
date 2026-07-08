# PLAN.md - 수식십자말풀이 온라인 제출 프로그램 개발 계획서

## 0. 프로젝트 요약

수식십자말풀이 퍼즐을 웹에서 입력하고 팀별 답안을 제출할 수 있는 프로그램을 만든다.

- 퍼즐 유형: 수식십자말풀이
- 퍼즐 규모: 문제 30개, 입력 칸 142개
- 참가자 팀명: `A-1`부터 `F-9`까지 드롭다운 선택
- 입력 가능 문자: 숫자 `0~9`, 기호 `+`, `-`, `×`, `÷`, `!`, `√`
- 키보드 매핑: `* → ×`, `/ → ÷`, `f → !`, `r → √`
- 정답 데이터: 프론트엔드 코드에 포함 가능
- 배포 목표: GitHub Pages
- 제출 저장 MVP: Google Apps Script + Google Sheets 또는 JSON 다운로드 fallback

이 문서는 Codex에 그대로 넣어 개발을 시작할 수 있는 작업 계획서다.

---

## 1. 목표

참가자가 웹 브라우저에서 팀명을 선택하고, 퍼즐의 각 칸에 숫자나 수식 기호를 입력한 뒤 답안을 제출할 수 있게 한다.

운영자는 제출된 답안을 팀별로 확인할 수 있어야 한다. 정답은 프론트엔드에 포함해 자동 채점할 수 있게 한다.

---

## 2. 기술 스택

### 2.1 Frontend

- React
- TypeScript
- Vite
- CSS Modules 또는 일반 CSS
- localStorage

### 2.2 배포

- GitHub Pages
- GitHub Actions

### 2.3 제출 저장

MVP에서는 아래 순서로 구현한다.

1. `VITE_SUBMISSION_ENDPOINT`가 있으면 Google Apps Script Web App으로 POST 제출
2. endpoint가 없으면 제출 데이터를 JSON 파일로 다운로드
3. 콘솔에도 payload를 출력해 디버깅 가능하게 함

---

## 3. 사용자 흐름

1. 사용자가 웹사이트 접속
2. 팀 드롭다운에서 팀 선택
3. 퍼즐 칸 클릭
4. 키보드 또는 화면 버튼으로 값 입력
5. 입력 상태는 localStorage에 자동 저장
6. 제출 버튼 클릭
7. 미입력 칸이 있으면 확인 모달 표시
8. 정답과 비교해 점수 계산
9. 제출 payload 생성
10. Google Apps Script endpoint로 전송하거나 JSON 다운로드
11. 제출 완료 화면 표시

---

## 4. 팀 선택 요구사항

참가자는 팀명을 직접 입력하지 않는다. 드롭다운에서만 선택한다.

팀명 형식은 다음과 같다.

```text
A-1, A-2, A-3, A-4, A-5, A-6, A-7, A-8, A-9
B-1, B-2, B-3, B-4, B-5, B-6, B-7, B-8, B-9
C-1, C-2, C-3, C-4, C-5, C-6, C-7, C-8, C-9
D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-8, D-9
E-1, E-2, E-3, E-4, E-5, E-6, E-7, E-8, E-9
F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9
```

총 54개 팀이다.

구현 요구사항:

- `src/data/teams.ts`에서 팀 배열 생성
- 첫 화면 또는 상단 고정 영역에 드롭다운 표시
- 기본값은 빈 선택값: `팀을 선택하세요`
- 팀 미선택 상태에서는 제출 버튼 비활성화
- 제출 payload에 `teamName` 필드 필수 포함
- 팀 변경 시 해당 팀의 localStorage 저장값 복원

예상 구현:

```ts
export const TEAM_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
export const TEAM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const teams = TEAM_LETTERS.flatMap((letter) =>
  TEAM_NUMBERS.map((number) => `${letter}-${number}`)
);
```

---

## 5. 입력 요구사항

### 5.1 입력 가능한 값

```text
0 1 2 3 4 5 6 7 8 9
+ - × ÷ ! √
```

### 5.2 키보드 입력 매핑

```text
0~9       → 그대로 입력
+         → +
-         → -
*         → ×
/         → ÷
f 또는 F  → !
r 또는 R  → √
Backspace → 현재 칸 삭제
Delete    → 현재 칸 삭제
ArrowUp   → 위쪽 입력 칸으로 이동
ArrowDown → 아래쪽 입력 칸으로 이동
ArrowLeft → 왼쪽 입력 칸으로 이동
ArrowRight→ 오른쪽 입력 칸으로 이동
Tab       → 다음 입력 가능 칸으로 이동
Shift+Tab → 이전 입력 가능 칸으로 이동
```

### 5.3 화면 버튼 입력

화면 하단 또는 우측에 입력 버튼 패드를 배치한다.

```text
7 8 9 + -
4 5 6 × ÷
1 2 3 ! √
0 지우기
```

버튼 클릭 시:

1. 현재 선택된 칸에 값 입력
2. 입력값 자동 저장
3. 다음 입력 가능 칸으로 이동

---

## 6. 퍼즐 데이터 구조

퍼즐은 모든 입력 칸을 좌표 데이터로 정의한다.

MVP에서는 실제 좌표와 정답을 `TODO`로 두더라도 타입과 구조는 먼저 완성한다. 이후 첨부 이미지/PDF를 기준으로 `cells`, `entries`, `solution`을 채운다.

### 6.1 타입 정의

파일: `src/data/puzzle.ts`

```ts
export type CellValue =
  | ""
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "+"
  | "-"
  | "×"
  | "÷"
  | "!"
  | "√";

export type Direction = "across" | "down";

export interface PuzzleCell {
  id: number;
  row: number;
  col: number;
  clueNumber?: number;
  clueDirection?: Direction;
}

export interface PuzzleEntry {
  clueNumber: number;
  direction: Direction;
  cellIds: number[];
  targetValue: string;
}

export interface PuzzleDefinition {
  puzzleId: string;
  title: string;
  totalCells: number;
  rowCount: number;
  colCount: number;
  cells: PuzzleCell[];
  entries: PuzzleEntry[];
}
```

### 6.2 퍼즐 정의 예시

```ts
export const puzzle: PuzzleDefinition = {
  puzzleId: "formula-crossword-001",
  title: "수식십자말풀이",
  totalCells: 142,
  rowCount: 24,
  colCount: 30,
  cells: [
    // TODO: 첨부 퍼즐을 기준으로 실제 좌표 입력
    { id: 1, row: 1, col: 2, clueNumber: 1, clueDirection: "down" },
    { id: 2, row: 2, col: 2 },
    { id: 3, row: 3, col: 2, clueNumber: 2, clueDirection: "across" }
  ],
  entries: [
    // TODO: 각 가로/세로 문제의 cellIds 연결
    { clueNumber: 1, direction: "down", cellIds: [1, 2, 3, 4, 5], targetValue: "17" },
    { clueNumber: 2, direction: "across", cellIds: [3, 6, 7, 8, 9, 10, 11], targetValue: "9" }
  ]
};
```

---

## 7. 정답 데이터 구조

정답은 프론트엔드에 포함해도 된다.

파일: `src/data/solution.ts`

```ts
import type { CellValue } from "./puzzle";

export const solution: Record<number, CellValue> = {
  // TODO: 실제 정답 입력
  1: "5",
  2: "×",
  3: "3"
};
```

주의:

- 정답이 프론트엔드 번들에 포함되므로 브라우저 개발자 도구로 확인 가능하다.
- 이번 프로젝트에서는 사용자가 허용했으므로 이 방식으로 구현한다.
- 추후 보안이 중요해지면 정답 검증을 서버로 이동한다.

---

## 8. 채점 로직

파일: `src/utils/scoring.ts`

### 8.1 타입

```ts
import type { CellValue } from "../data/puzzle";

export interface ScoreResult {
  totalCells: number;
  filledCells: number;
  correctCells: number;
  incorrectCells: number;
  isPerfect: boolean;
}
```

### 8.2 함수 요구사항

```ts
export function scoreAnswers(
  answers: Record<number, CellValue>,
  solution: Record<number, CellValue>
): ScoreResult {
  const solutionEntries = Object.entries(solution);
  const totalCells = solutionEntries.length;
  let filledCells = 0;
  let correctCells = 0;

  for (const [cellId, correctValue] of solutionEntries) {
    const value = answers[Number(cellId)] ?? "";
    if (value !== "") filledCells += 1;
    if (value === correctValue) correctCells += 1;
  }

  return {
    totalCells,
    filledCells,
    correctCells,
    incorrectCells: totalCells - correctCells,
    isPerfect: correctCells === totalCells
  };
}
```

### 8.3 화면 표시 정책

기본 정책:

- 입력 중에는 정오답 표시하지 않음
- 제출 후에도 참가자에게 점수는 기본적으로 숨김
- 제출 완료 메시지만 표시
- 운영자는 제출 데이터에서 `correctCells`, `isPerfect` 확인 가능

옵션:

- `.env` 값으로 제출 후 점수 공개 여부를 제어할 수 있게 한다.

```text
VITE_SHOW_SCORE_AFTER_SUBMIT=false
```

---

## 9. 제출 데이터 구조

파일: `src/utils/submission.ts`

### 9.1 Payload 타입

```ts
import type { CellValue } from "../data/puzzle";
import type { ScoreResult } from "./scoring";

export interface SubmissionPayload {
  puzzleId: string;
  teamName: string;
  submittedAt: string;
  answers: Record<number, CellValue>;
  score: ScoreResult;
  userAgent: string;
}
```

### 9.2 Payload 예시

```json
{
  "puzzleId": "formula-crossword-001",
  "teamName": "A-2",
  "submittedAt": "2026-07-01T12:00:00.000Z",
  "answers": {
    "1": "5",
    "2": "×",
    "3": "3"
  },
  "score": {
    "totalCells": 142,
    "filledCells": 142,
    "correctCells": 142,
    "incorrectCells": 0,
    "isPerfect": true
  },
  "userAgent": "Mozilla/5.0 ..."
}
```

### 9.3 제출 동작

- `VITE_SUBMISSION_ENDPOINT`가 있으면 endpoint로 POST
- endpoint가 없으면 JSON 다운로드
- 제출 성공 시 완료 화면 표시
- 제출 실패 시 오류 메시지와 재시도 버튼 표시

---

## 10. localStorage 자동 저장

팀별로 입력값을 따로 저장한다.

### 10.1 저장 키

```text
formula-crossword-001:<teamName>
```

예시:

```text
formula-crossword-001:A-2
```

### 10.2 저장 데이터

```ts
interface SavedProgress {
  teamName: string;
  answers: Record<number, CellValue>;
  updatedAt: string;
}
```

### 10.3 요구사항

- 팀을 선택하면 해당 팀의 기존 입력값 복원
- 입력할 때마다 자동 저장
- 새로고침 후에도 복원
- `초기화` 버튼으로 현재 팀의 저장값 삭제
- 다른 팀의 저장값은 삭제하지 않음

---

## 11. 화면 구성

### 11.1 App 전체 구조

```text
App
├─ Header
├─ TeamSelector
├─ PuzzleGrid
├─ InputPad
├─ ProgressBar
├─ SubmitPanel
└─ SubmitResultModal
```

### 11.2 메인 화면 요소

1. 제목: `수식십자말풀이 답안 제출`
2. 안내 문구
3. 팀 선택 드롭다운
4. 입력 진행률: `입력 완료: 120 / 142칸`
5. 퍼즐 격자
6. 입력 버튼 패드
7. 초기화 버튼
8. 제출 버튼

### 11.3 퍼즐 격자 UI

요구사항:

- CSS Grid 사용
- 실제 입력 칸만 테두리 있는 셀로 표시
- 빈 공간은 렌더링하지 않거나 invisible 처리
- 선택된 칸은 명확히 강조
- 값은 중앙 정렬
- 문제 시작 칸에는 작은 번호 표시
- 방향 표시가 필요한 경우 `2→`, `1↓` 같은 작은 라벨 표시
- 모바일에서는 격자가 너무 작아지지 않게 가로 스크롤 허용

CSS 방향:

```css
.puzzle-wrapper {
  overflow-x: auto;
  padding: 12px;
}

.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(var(--col-count), 32px);
  grid-template-rows: repeat(var(--row-count), 32px);
  gap: 1px;
  width: max-content;
}

.cell {
  width: 32px;
  height: 32px;
  border: 1px solid #111;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}

.cell.selected {
  outline: 3px solid #2563eb;
  z-index: 1;
}

.clue-label {
  position: absolute;
  top: 1px;
  left: 2px;
  font-size: 9px;
  line-height: 1;
  font-weight: 600;
}
```

---

## 12. 파일 구조

아래 구조로 구현한다.

```text
formula-crossword-submitter/
  package.json
  vite.config.ts
  index.html
  README.md
  PLAN.md
  .env.example

  src/
    main.tsx
    App.tsx

    data/
      puzzle.ts
      solution.ts
      teams.ts

    components/
      Header.tsx
      TeamSelector.tsx
      PuzzleGrid.tsx
      PuzzleCell.tsx
      InputPad.tsx
      ProgressBar.tsx
      SubmitPanel.tsx
      SubmitResultModal.tsx

    hooks/
      usePuzzleInput.ts
      useLocalStorage.ts
      useKeyboardInput.ts

    utils/
      normalizeInput.ts
      scoring.ts
      submission.ts
      downloadJson.ts

    styles/
      global.css
      puzzle.css

  docs/
    google-apps-script.js
```

---

## 13. 주요 모듈 요구사항

### 13.1 `src/utils/normalizeInput.ts`

```ts
import type { CellValue } from "../data/puzzle";

export function normalizeInput(key: string): CellValue | null {
  if (/^[0-9]$/.test(key)) return key as CellValue;
  if (key === "+") return "+";
  if (key === "-") return "-";
  if (key === "*") return "×";
  if (key === "/") return "÷";
  if (key === "f" || key === "F") return "!";
  if (key === "r" || key === "R") return "√";
  return null;
}
```

### 13.2 `src/components/TeamSelector.tsx`

요구사항:

- `teams` 배열을 options로 렌더링
- 선택값 변경 시 상위 컴포넌트에 전달
- 미선택 placeholder 표시

### 13.3 `src/components/PuzzleGrid.tsx`

요구사항:

- `puzzle.cells` 기준으로 셀 렌더링
- `row`, `col`을 CSS grid 위치로 사용
- `selectedCellId` 상태 반영
- 셀 클릭 시 선택 상태 변경
- 셀 값 표시

### 13.4 `src/components/InputPad.tsx`

요구사항:

- 숫자와 기호 버튼 렌더링
- 클릭 시 `onInput(value)` 호출
- 지우기 버튼은 `onClear()` 호출

### 13.5 `src/hooks/useKeyboardInput.ts`

요구사항:

- 전역 keydown 이벤트 등록
- input/select/textarea 포커스 중에는 퍼즐 입력 방해하지 않음
- 허용된 키는 normalize 후 입력
- Backspace/Delete 처리
- Arrow key 이동 처리
- Tab 이동 처리

### 13.6 `src/utils/submission.ts`

요구사항:

- payload 생성
- endpoint POST
- endpoint가 없으면 JSON 다운로드 fallback
- POST는 Google Apps Script 호환을 위해 `Content-Type: text/plain;charset=utf-8` 사용

---

## 14. Google Apps Script 제출 API

MVP 제출 저장소로 Google Sheets를 사용할 수 있다.

### 14.1 Sheet 컬럼

```text
timestamp
puzzleId
teamName
filledCells
correctCells
incorrectCells
totalCells
isPerfect
answersJson
userAgent
```

### 14.2 Apps Script 예시

파일: `docs/google-apps-script.js`

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const payload = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    payload.puzzleId,
    payload.teamName,
    payload.score.filledCells,
    payload.score.correctCells,
    payload.score.incorrectCells,
    payload.score.totalCells,
    payload.score.isPerfect,
    JSON.stringify(payload.answers),
    payload.userAgent || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 14.3 Frontend POST 예시

```ts
export async function submitPayload(payload: SubmissionPayload): Promise<void> {
  const endpoint = import.meta.env.VITE_SUBMISSION_ENDPOINT;

  if (!endpoint) {
    downloadJson(payload, `submission-${payload.teamName}.json`);
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Submit failed: ${response.status}`);
  }
}
```

---

## 15. 환경변수

파일: `.env.example`

```text
VITE_SUBMISSION_ENDPOINT=
VITE_SHOW_SCORE_AFTER_SUBMIT=false
```

설명:

- `VITE_SUBMISSION_ENDPOINT`: Google Apps Script Web App URL
- `VITE_SHOW_SCORE_AFTER_SUBMIT`: 제출 후 점수 표시 여부

---

## 16. GitHub Pages 배포

### 16.1 Vite base 설정

저장소 이름이 `formula-crossword-submitter`인 경우:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/formula-crossword-submitter/"
});
```

저장소 이름이 바뀌면 `base`도 같이 수정한다.

### 16.2 GitHub Actions

파일: `.github/workflows/deploy.yml`

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 17. Codex 작업 순서

### 17.1 1차 작업: 프로젝트 뼈대와 입력 UI

목표:

- React + TypeScript + Vite 프로젝트 생성
- 기본 화면 구현
- 팀 드롭다운 구현
- 퍼즐 격자 컴포넌트 구현
- 버튼 입력 구현
- 키보드 입력 구현
- localStorage 자동 저장 구현

완료 조건:

- `npm install` 성공
- `npm run dev` 성공
- 브라우저에서 팀 선택 가능
- 칸 클릭 후 숫자/기호 입력 가능
- `*`, `/`, `f`, `r` 키 매핑 정상 작동
- 새로고침 후 입력값 복원

### 17.2 2차 작업: 정답과 채점

목표:

- `solution.ts` 구조 추가
- 채점 함수 구현
- 제출 payload 생성
- 제출 전 확인 모달 구현
- 제출 완료 화면 구현

완료 조건:

- 입력값과 정답 비교 가능
- 총 142칸 기준 점수 계산 가능
- `teamName`, `submittedAt`, `answers`, `score`가 payload에 포함됨

### 17.3 3차 작업: 제출 저장

목표:

- Google Apps Script endpoint 연동
- `.env.example` 작성
- endpoint 없을 때 JSON 다운로드 fallback 구현
- `docs/google-apps-script.js` 작성

완료 조건:

- endpoint가 있으면 POST 제출
- endpoint가 없으면 JSON 다운로드
- 제출 실패 시 오류 메시지 표시

### 17.4 4차 작업: 배포와 문서

목표:

- GitHub Pages 배포 설정
- GitHub Actions workflow 추가
- README 작성
- 운영자 안내 작성

완료 조건:

- `npm run build` 성공
- GitHub Actions로 Pages 배포 가능
- README에 실행, 빌드, 배포, endpoint 설정 방법 포함

---

## 18. 테스트 체크리스트

### 18.1 입력 테스트

- [ ] 숫자 `0~9` 입력 가능
- [ ] `+`, `-` 입력 가능
- [ ] `*` 입력 시 `×`로 입력됨
- [ ] `/` 입력 시 `÷`로 입력됨
- [ ] `f` 입력 시 `!`로 입력됨
- [ ] `F` 입력 시 `!`로 입력됨
- [ ] `r` 입력 시 `√`로 입력됨
- [ ] `R` 입력 시 `√`로 입력됨
- [ ] 허용되지 않은 키는 무시됨
- [ ] Backspace로 삭제 가능
- [ ] Delete로 삭제 가능
- [ ] 방향키로 이동 가능
- [ ] Tab으로 다음 칸 이동 가능

### 18.2 팀 선택 테스트

- [ ] `A-1`부터 `F-9`까지 표시됨
- [ ] 팀 미선택 시 제출 불가
- [ ] 팀 변경 시 해당 팀의 저장값 복원
- [ ] 다른 팀의 저장값과 섞이지 않음

### 18.3 저장 테스트

- [ ] 입력 즉시 localStorage 저장
- [ ] 새로고침 후 복원
- [ ] 초기화 버튼으로 현재 팀 입력값 삭제
- [ ] 초기화해도 다른 팀 데이터는 유지

### 18.4 채점 테스트

- [ ] 빈칸은 오답 처리
- [ ] 정답과 같은 값은 정답 처리
- [ ] `filledCells` 계산 정확
- [ ] `correctCells` 계산 정확
- [ ] 모든 칸 정답이면 `isPerfect: true`

### 18.5 제출 테스트

- [ ] payload에 `puzzleId` 포함
- [ ] payload에 `teamName` 포함
- [ ] payload에 `submittedAt` 포함
- [ ] payload에 `answers` 포함
- [ ] payload에 `score` 포함
- [ ] 미입력 칸이 있어도 확인 후 제출 가능
- [ ] 제출 성공 메시지 표시
- [ ] 제출 실패 메시지 표시
- [ ] endpoint 없을 때 JSON 다운로드

### 18.6 배포 테스트

- [ ] `npm run build` 성공
- [ ] GitHub Pages에서 화면 표시
- [ ] 새로고침 시 404 문제 없음
- [ ] 모바일 브라우저에서 사용 가능
- [ ] 가로 스크롤로 전체 퍼즐 접근 가능

---

## 19. 운영 정책

### 19.1 중복 제출

MVP 기본 정책:

- 같은 팀이 여러 번 제출할 수 있다.
- Google Sheet에는 모든 제출 기록을 남긴다.
- 운영자는 가장 마지막 제출을 기준으로 판단한다.

추후 개선:

- 팀별 1회 제출 제한
- 제출 마감 시간 이후 차단
- 관리자 비밀번호 기능 추가

### 19.2 점수 공개

기본 정책:

- 참가자에게 점수 공개 안 함
- 운영자용 Sheet에는 점수 저장

옵션:

- `VITE_SHOW_SCORE_AFTER_SUBMIT=true`일 때 제출 후 점수 표시

### 19.3 정답 공개 리스크

이번 버전은 정답을 프론트엔드에 포함한다.

장점:

- 구현이 단순하다.
- 서버 채점이 필요 없다.
- 제출 데이터에 점수를 바로 저장할 수 있다.

단점:

- 개발자 도구로 정답 확인 가능하다.
- 보안이 중요한 대회에는 적합하지 않다.

현재 프로젝트에서는 정답 프론트엔드 포함이 허용되었으므로 이 방식으로 진행한다.

---

## 20. README 작성 요구사항

README에는 다음 내용을 포함한다.

1. 프로젝트 설명
2. 로컬 실행 방법
3. 빌드 방법
4. GitHub Pages 배포 방법
5. Google Apps Script endpoint 설정 방법
6. 팀명 형식
7. 입력 가능한 키 목록
8. 퍼즐 좌표 수정 방법
9. 정답 데이터 수정 방법
10. 제출 데이터 확인 방법

---

## 21. Codex에 바로 넣을 첫 지시문

아래 문장을 Codex 첫 작업 지시로 사용한다.

```text
이 저장소에 수식십자말풀이 온라인 제출 프로그램을 구현해줘.

PLAN.md의 17.1 1차 작업부터 시작해줘.

우선 React + TypeScript + Vite 프로젝트를 만들고, 팀 선택 드롭다운, 퍼즐 격자, 키보드 입력, 화면 입력 버튼, localStorage 자동 저장까지 구현해줘.

puzzle.ts와 solution.ts는 실제 좌표와 정답을 아직 완성하지 않아도 되지만, 총 142칸 퍼즐을 넣을 수 있는 타입과 데이터 구조는 완성해줘. 샘플 셀 데이터를 몇 개 넣어서 화면이 동작하도록 해줘.

완료 후 npm install, npm run build가 통과하는지 확인하고, 구현 요약과 다음 단계 TODO를 알려줘.
```

---

## 22. 최종 산출물

최종적으로 다음이 동작해야 한다.

- 참가자용 웹 페이지
- 팀명 드롭다운
- 수식십자말풀이 입력 UI
- 숫자/기호 키보드 입력
- 화면 입력 버튼
- 팀별 자동 저장
- 정답 비교
- 제출 payload 생성
- Google Sheets 제출 저장 또는 JSON 다운로드
- GitHub Pages 배포 설정
