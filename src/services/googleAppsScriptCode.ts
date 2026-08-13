export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Gym Tracker Google Sheets Backend API Bridge
 * Copy and paste this code into your Google Sheet:
 * Extensions -> Apps Script -> Paste this code -> Deploy as Web App (Execute as: Me, Access: Anyone)
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = { success: false, data: null, error: null };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureTabsExist(ss);

    var params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var action = params.action || 'get_all';

    if (action === 'ping') {
      output.success = true;
      output.data = { status: 'online', app: 'Sessions' };
    } else if (action === 'get_all') {
      output.data = {
        logs: readLogsSheet(ss),
        templates: readJsonSheet(ss, 'Templates'),
        exercises: readJsonSheet(ss, 'Exercises')
      };
      output.success = true;
    } else if (action === 'save_log') {
      appendLog(ss, params.log);
      output.success = true;
      output.message = 'Workout session saved successfully';
    } else if (action === 'delete_log' || action === 'deleteLog') {
      deleteLogFromSheet(ss, params.logId);
      output.success = true;
      output.message = 'Log deleted successfully';
    } else if (action === 'save_templates') {
      saveJsonSheet(ss, 'Templates', params.templates);
      output.success = true;
    } else if (action === 'save_exercises') {
      saveJsonSheet(ss, 'Exercises', params.exercises);
      output.success = true;
    } else {
      output.error = 'Unknown action: ' + action;
    }
  } catch (err) {
    output.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureTabsExist(ss) {
  var requiredTabs = ['Logs', 'Templates', 'Exercises', 'Config'];
  for (var i = 0; i < requiredTabs.length; i++) {
    var sheet = ss.getSheetByName(requiredTabs[i]);
    if (!sheet) {
      sheet = ss.insertSheet(requiredTabs[i]);
      if (requiredTabs[i] === 'Logs') {
        sheet.appendRow(['id', 'date', 'workout_type', 'exercise_name', 'category', 'type', 'set_number', 'weight_kg', 'reps', 'completed', 'cardio_duration', 'cardio_resistance', 'notes', 'created_at']);
      } else if (requiredTabs[i] === 'Templates' || requiredTabs[i] === 'Exercises') {
        sheet.appendRow(['id', 'json_data', 'updated_at']);
      }
    }
  }
}

// Sheets turns the date column into a real Date, and String(date) is never an
// ISO string, so the day key has to be formatted rather than sliced.
function formatDateKey(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).split('T')[0];
}

function readLogsSheet(ss) {
  var sheet = ss.getSheetByName('Logs');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var logsMap = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var logId = row[0];
    if (!logId) continue;

    if (!logsMap[logId]) {
      logsMap[logId] = {
        id: logId,
        date: row[1],
        workoutType: row[2],
        exercisesMap: {},
        timestamp: new Date(row[13] || Date.now()).getTime()
      };
    }

    var exName = row[3];
    var category = row[4];
    var type = row[5];
    var setNum = row[6];
    var weight = row[7];
    var reps = row[8];
    var completed = row[9] === true || row[9] === 'true';
    var cDuration = row[10];
    var cResistance = row[11];
    var notes = row[12];

    if (!logsMap[logId].exercisesMap[exName]) {
      logsMap[logId].exercisesMap[exName] = {
        exerciseId: 'ex-' + exName.toLowerCase().replace(/\\s+/g, '-'),
        exerciseName: exName,
        category: category || 'General',
        type: type || 'strength',
        sets: [],
        cardio: type === 'cardio' ? { durationMin: Number(cDuration || 0), resistanceLevel: Number(cResistance || 0) } : undefined
      };
    }

    if (type !== 'cardio' && setNum) {
      logsMap[logId].exercisesMap[exName].sets.push({
        setNumber: Number(setNum),
        weightKg: Number(weight || 0),
        reps: Number(reps || 0),
        completed: completed,
        notes: notes
      });
    }
  }

  var result = [];
  for (var key in logsMap) {
    var item = logsMap[key];
    var exList = [];
    for (var exKey in item.exercisesMap) {
      exList.push(item.exercisesMap[exKey]);
    }
    result.push({
      id: item.id,
      date: formatDateKey(item.date),
      workoutType: item.workoutType,
      exercises: exList,
      timestamp: item.timestamp
    });
  }

  return result;
}

function appendLog(ss, log) {
  var sheet = ss.getSheetByName('Logs');
  var now = new Date().toISOString();
  if (!log || !log.exercises) return;

  // First delete any previous entries for this log ID if updating
  deleteLogFromSheet(ss, log.id);

  for (var i = 0; i < log.exercises.length; i++) {
    var ex = log.exercises[i];
    if (ex.type === 'cardio' && ex.cardio) {
      sheet.appendRow([
        log.id,
        log.date,
        log.workoutType,
        ex.exerciseName,
        ex.category,
        'cardio',
        1,
        0,
        0,
        true,
        ex.cardio.durationMin || 0,
        ex.cardio.resistanceLevel || 0,
        ex.notes || '',
        now
      ]);
    } else if (ex.sets && ex.sets.length > 0) {
      for (var s = 0; s < ex.sets.length; s++) {
        var set = ex.sets[s];
        sheet.appendRow([
          log.id,
          log.date,
          log.workoutType,
          ex.exerciseName,
          ex.category,
          'strength',
          set.setNumber,
          set.weightKg,
          set.reps,
          set.completed,
          0,
          0,
          set.notes || '',
          now
        ]);
      }
    }
  }
}

function deleteLogFromSheet(ss, logId) {
  if (!logId) return;
  var sheet = ss.getSheetByName('Logs');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(logId)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function readJsonSheet(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;

    try {
      if (row[1] && String(row[1]).trim().indexOf('{') === 0) {
        list.push(JSON.parse(row[1]));
      } else if (tabName === 'Exercises') {
        list.push({
          id: String(row[0] || ('ex-' + i)),
          name: String(row[1] || row[0] || ('Exercise ' + i)),
          category: String(row[2] || 'Chest'),
          type: String(row[3] || 'strength').toLowerCase(),
          defaultNotes: String(row[4] || '')
        });
      } else if (tabName === 'Templates') {
        list.push({
          id: String(row[0] || ('tmpl-' + i)),
          name: String(row[1] || row[0] || ('Routine ' + i)),
          exerciseIds: []
        });
      }
    } catch (e) {}
  }
  return list;
}

function saveJsonSheet(ss, tabName, items) {
  var sheet = ss.getSheetByName(tabName);
  sheet.clearContents();
  sheet.appendRow(['id', 'json_data', 'updated_at']);

  if (!items || !items.length) return;
  var now = new Date().toISOString();

  for (var i = 0; i < items.length; i++) {
    sheet.appendRow([items[i].id || ('id-' + i), JSON.stringify(items[i]), now]);
  }
}
`;
