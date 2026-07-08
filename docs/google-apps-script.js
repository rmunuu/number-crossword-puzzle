function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const payload = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
