/**
 * Принимает ответы анкеты и записывает их в эту Google Таблицу.
 * Вставляется в таблицу через меню «Расширения → Apps Script».
 *
 * Строка ниже разрешает скрипту работать только с этой таблицей.
 * @OnlyCurrentDoc
 */

var COLUMNS = [
  ['name', 'Имя и фамилия'],
  ['attend', 'Придёт'],
  ['guests', 'С кем придёт'],
  ['drinks', 'Напитки'],
  ['food', 'Аллергии и особенности'],
  ['song', 'Песня']
];

var MAX_LENGTH = 500;

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!clean(data.name) || ['Да', 'Нет'].indexOf(data.attend) === -1) {
      return reply(false);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Когда ответил'].concat(COLUMNS.map(function (column) { return column[1]; })));
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([new Date()].concat(COLUMNS.map(function (column) { return clean(data[column[0]]); })));
    return reply(true);
  } catch (error) {
    return reply(false);
  }
}

// Адрес анкеты виден в коде страницы, поэтому текст не должен сработать в таблице как формула
function clean(value) {
  var text = String(value === undefined || value === null ? '' : value).trim().slice(0, MAX_LENGTH);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply(ok) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: ok }))
    .setMimeType(ContentService.MimeType.JSON);
}
