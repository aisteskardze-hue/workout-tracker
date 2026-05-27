/**
 * Google Apps Script for Workout Tracker sync
 *
 * Paste this entire file into Apps Script (script.google.com) inside your
 * Google Sheet (Extensions → Apps Script). Then deploy as Web App.
 *
 * The script handles two operations:
 *   - POST { action: "backup", sessions: [...] }  → writes all sessions to the sheet
 *   - GET  ?action=restore                        → returns all sessions as JSON
 */

const SHEET_NAME = 'Workouts';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'backup') {
      writeSessionsToSheet(body.sessions || []);
      return jsonResponse({ ok: true, count: (body.sessions || []).length });
    }

    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'restore';

    if (action === 'restore') {
      const sessions = readSessionsFromSheet();
      return jsonResponse({ ok: true, sessions: sessions });
    }

    if (action === 'ping') {
      return jsonResponse({ ok: true, message: 'pong' });
    }

    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function writeSessionsToSheet(sessions) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  sheet.clear();

  // Header row
  const headers = ['Session ID', 'Type', 'Date', 'Exercise', 'Muscle Group', 'Weight (kg)', 'Sets', 'Reps'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');

  // Flatten sessions into rows (one row per exercise within a session)
  const rows = [];
  sessions.forEach(function(s) {
    (s.exercises || []).forEach(function(ex) {
      rows.push([
        s.id,
        s.type,
        s.date,
        ex.name,
        ex.muscleGroup || '',
        ex.weight,
        ex.sets,
        ex.reps
      ]);
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.autoResizeColumns(1, headers.length);

  // Add timestamp on a second sheet
  let metaSheet = ss.getSheetByName('Sync Log');
  if (!metaSheet) {
    metaSheet = ss.insertSheet('Sync Log');
    metaSheet.getRange(1, 1, 1, 2).setValues([['Timestamp', 'Sessions Synced']]);
    metaSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  metaSheet.appendRow([new Date(), sessions.length]);
}

function readSessionsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  // Skip header, group rows by session ID
  const sessionsMap = {};
  for (let i = 1; i < data.length; i++) {
    const [id, type, date, name, muscleGroup, weight, sets, reps] = data[i];
    if (!id) continue;

    if (!sessionsMap[id]) {
      sessionsMap[id] = {
        id: Number(id),
        type: type,
        date: formatDateForApp(date),
        exercises: []
      };
    }

    sessionsMap[id].exercises.push({
      name: name,
      muscleGroup: muscleGroup || null,
      weight: Number(weight),
      sets: Number(sets),
      reps: Number(reps)
    });
  }

  return Object.values(sessionsMap);
}

function formatDateForApp(d) {
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }
  return String(d);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
