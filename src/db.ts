import { app } from 'electron';
import path from 'path';
import Datastore from 'nedb-promises';

function dbFactory(filename: string, options = {}) {
  return Datastore.create({
    filename: path.join(app.getAppPath(), 'data', filename),
    autoload: true,
    ...options,
  });
}

export default {
  rows: dbFactory('rows.db', { timestampData: true }),
  columns: dbFactory('columns.db'),
  async init() {
    const data = await this.columns.find({});
    if (data.length === 0) {
      [
        { width: 50 },
        { width: 100 },
        { width: 300 },
        { width: 50 },
        { width: 50 },
        { width: 50, percent: 25 },
      ].forEach(column => this.columns.insert(column));
    }
  },
};
