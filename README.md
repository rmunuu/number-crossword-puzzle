# 수식십자말풀이 답안 제출

팀별로 수식십자말풀이 답안을 웹에서 입력하고 제출하는 React + TypeScript + Vite 앱입니다.

## 로컬 실행

```bash
pnpm install
pnpm run dev
```

npm을 사용하는 환경이라면 `npm install`, `npm run dev`로도 실행할 수 있습니다.

## 빌드

```bash
pnpm run build
```

## 환경변수

`.env.example`을 참고해 `.env`를 만들 수 있습니다.

```text
VITE_SUBMISSION_ENDPOINT=
VITE_BASE_PATH=
```

- `VITE_SUBMISSION_ENDPOINT`: Google Apps Script Web App URL입니다.
- `VITE_BASE_PATH`: GitHub Pages 저장소 경로를 직접 지정해야 할 때 사용합니다.

## 팀명

팀은 드롭다운에서만 선택합니다. 형식은 `A-1`부터 `F-9`까지 총 54개입니다.

## 입력 키

- 숫자 `0`-`9`
- `+`, `-`
- `*` → `×`
- `/` → `÷`
- `f` 또는 `F` → `!`
- `r` 또는 `R` → `√`
- `Backspace`, `Delete` → 현재 칸 삭제
- 방향키 → 같은 행 또는 열의 입력 칸으로 이동
- `Tab`, `Shift+Tab` → 다음 또는 이전 입력 칸으로 이동

## 퍼즐 좌표 수정

`src/data/puzzle.ts`의 `puzzle.cells`와 `puzzle.entries`를 실제 퍼즐 기준으로 교체합니다.

현재 버전은 첨부 PDF에서 추출한 격자 좌표를 사용합니다. PDF 제목은 142칸이지만 파일 내부에는 `84`번이 두 번 표시된 입력 박스까지 총 143개 박스가 있어, 화면은 PDF에 보이는 모양을 그대로 따릅니다.

## 정답 데이터 수정

`src/data/solution.ts`의 `solution`을 실제 정답으로 교체합니다.

```ts
export const solution: Record<number, CellValue> = {
  1: "5",
  2: "×",
  3: "3"
};
```

정답은 프론트엔드 번들에 포함되므로 브라우저 개발자 도구에서 확인될 수 있습니다. 보안이 필요한 대회에서는 서버 채점으로 옮기는 것이 좋습니다.

## 제출 저장

팀별로 최대 5번 제출할 수 있습니다. 각 제출은 즉시 채점되고, 제출 기록은 브라우저 localStorage에 저장되어 다시 확인할 수 있습니다. 기록을 선택하면 제출 당시 답안만 보이고, 맞은 칸은 연한 파랑, 틀린 칸은 연한 빨강으로 표시됩니다.

`VITE_SUBMISSION_ENDPOINT`가 있으면 Google Apps Script Web App으로 POST합니다. 없으면 제출 payload를 JSON 파일로 다운로드합니다. payload는 콘솔에도 출력됩니다.

Google Sheets용 Apps Script 예시는 `docs/google-apps-script.js`에 있습니다.

Sheet 컬럼 예시:

```text
timestamp, puzzleId, teamName, round, maxRounds, filledCells, correctCells, incorrectCells, totalCells, isPerfect, answersJson, userAgent
```

## GitHub Pages 배포

`.github/workflows/deploy.yml`이 포함되어 있습니다.

1. GitHub 저장소 Settings → Pages에서 Source를 GitHub Actions로 설정합니다.
2. Google Apps Script 제출 저장을 쓰려면 Settings → Secrets and variables → Actions → Variables에 `VITE_SUBMISSION_ENDPOINT`를 추가합니다.
3. `main` 브랜치에 push합니다.
4. Actions가 `pnpm run build` 후 Pages에 배포합니다.

저장소 경로가 자동으로 base path에 반영됩니다. 별도 경로가 필요하면 `VITE_BASE_PATH=/저장소명/` 형태로 지정합니다.

## 현재 TODO

- Google Apps Script Web App URL 발급 후 `.env` 또는 GitHub Actions 환경변수에 설정
