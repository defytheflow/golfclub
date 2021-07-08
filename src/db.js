const { app } = require('electron');
const path = require('path');
const Datastore = require('nedb-promises');

function dbFactory(fileName) {
  return Datastore.create({
    filename: path.join(app.getAppPath('userData'), 'data', fileName),
    timestampData: true,
    autoload: true,
  });
}

const db = dbFactory('rows.db');

module.exports = db;
