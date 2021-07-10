import { app } from 'electron';
import path from 'path';
import Datastore from 'nedb-promises';

function dbFactory(filename: string) {
  const filenamePath = path.join(app.getAppPath(), 'data', filename);
  return Datastore.create({
    filename: filenamePath,
    timestampData: true,
    autoload: true,
  });
}

export default {
  rows: dbFactory('rows.db'),
  ui: dbFactory('ui.db'),
};
