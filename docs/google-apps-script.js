const HEADER = [
  "timestamp",
  "puzzleId",
  "teamName",
  "round",
  "maxRounds",
  "filledCells",
  "correctCells",
  "incorrectCells",
  "totalCells",
  "isPerfect",
  "answersJson",
  "userAgent"
];

const DEFAULT_SHEET_NAME = "Submissions";
const TIMESTAMP_MODE = "iso-text-v2";

function doGet(e) {
  try {
    const action = e.parameter.action || "leaderboard";

    if (action === "leaderboard") {
      return jsonResponse({
        ok: true,
        timestampMode: TIMESTAMP_MODE,
        entries: getLeaderboardEntries(e.parameter.puzzleId)
      });
    }

    return jsonResponse({ ok: false, error: "Unknown action" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.action === "resetLeaderboard") {
      resetLeaderboard(payload.puzzleId, payload.adminCode);
      return jsonResponse({ ok: true });
    }

    appendSubmission(payload);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function getSubmissionSheet() {
  const spreadsheet = getSubmissionSpreadsheet();
  const properties = PropertiesService.getScriptProperties();
  const sheetName = properties.getProperty("SHEET_NAME") || DEFAULT_SHEET_NAME;

  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getSubmissionSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error("SPREADSHEET_ID is not configured in Script Properties.");
  }

  return spreadsheet;
}

function appendSubmission(payload) {
  const sheet = getSubmissionSheet();
  ensureHeader(sheet);
  const submittedAt = payload.submittedAt || new Date().toISOString();

  sheet.appendRow([
    submittedAt,
    payload.puzzleId,
    payload.teamName,
    payload.round,
    payload.maxRounds,
    payload.score.filledCells,
    payload.score.correctCells,
    payload.score.incorrectCells,
    payload.score.totalCells,
    payload.score.isPerfect,
    JSON.stringify(payload.answers),
    payload.userAgent || ""
  ]);
}

function getLeaderboardEntries(puzzleId) {
  const sheet = getSubmissionSheet();
  ensureHeader(sheet);

  const rows = getDataRows(sheet);
  const teamMap = {};

  rows.forEach((row) => {
    if (puzzleId && row[1] !== puzzleId) return;

    const teamName = row[2];
    if (!teamName) return;

    const submittedAt = toIsoString(row[0]);
    const round = Number(row[3] || 0);
    const maxRounds = Number(row[4] || 5);
    const correctCells = Number(row[6] || 0);
    const totalCells = Number(row[8] || 0);

    if (!teamMap[teamName]) {
      teamMap[teamName] = {
        teamName,
        submissions: 0,
        best: null,
        maxRounds
      };
    }

    teamMap[teamName].submissions += 1;
    teamMap[teamName].maxRounds = maxRounds || teamMap[teamName].maxRounds;

    const candidate = {
      teamName,
      correctCells,
      totalCells,
      remainingRounds: 0,
      submittedAt,
      submissionCount: 0,
      round
    };

    const currentBest = teamMap[teamName].best;
    if (
      !currentBest ||
      candidate.correctCells > currentBest.correctCells ||
      (candidate.correctCells === currentBest.correctCells &&
        new Date(candidate.submittedAt).getTime() < new Date(currentBest.submittedAt).getTime())
    ) {
      teamMap[teamName].best = candidate;
    }
  });

  return Object.keys(teamMap)
    .map((teamName) => {
      const record = teamMap[teamName];
      const best = record.best;
      best.submissionCount = record.submissions;
      best.remainingRounds = Math.max(0, record.maxRounds - record.submissions);
      return best;
    })
    .sort((a, b) => {
      return (
        b.correctCells - a.correctCells ||
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    });
}

function resetLeaderboard(puzzleId, adminCode) {
  const configuredCode = PropertiesService.getScriptProperties().getProperty("ADMIN_CODE");
  if (!configuredCode) {
    throw new Error("ADMIN_CODE is not configured in Script Properties.");
  }
  if (adminCode !== configuredCode) {
    throw new Error("Invalid admin code.");
  }

  const sheet = getSubmissionSheet();
  ensureHeader(sheet);

  const rows = getDataRows(sheet);
  const remainingRows = rows.filter((row) => puzzleId && row[1] !== puzzleId);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);

  if (remainingRows.length > 0) {
    sheet.getRange(2, 1, remainingRows.length, HEADER.length).setValues(remainingRows);
  }
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, HEADER.length).getValues()[0];
    if (firstRow[0] !== HEADER[0]) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    }
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat("@");
}

function getDataRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADER.length).getValues();
}

function toIsoString(value) {
  if (value instanceof Date) return toIsoStringFromLegacySheetDate(value);
  return new Date(value).toISOString();
}

function toIsoStringFromLegacySheetDate(value) {
  const timeZone = getSubmissionSpreadsheet().getSpreadsheetTimeZone();
  const offset = Utilities.formatDate(value, timeZone, "Z");
  const sign = offset[0] === "-" ? -1 : 1;
  const hours = Number(offset.slice(1, 3));
  const minutes = Number(offset.slice(3, 5));
  const offsetMinutes = sign * (hours * 60 + minutes);

  return new Date(value.getTime() - offsetMinutes * 60 * 1000).toISOString();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
