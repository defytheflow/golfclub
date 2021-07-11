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

const defaultColumns = [
  { order: 1, width: 50 },
  { order: 2, width: 100 },
  { order: 3, width: 325 },
  { order: 4, width: 75 },
  { order: 5, width: 75 },
  { order: 6, width: 75, percent: 25 },
  { order: 10000, width: 100 },
];

export default {
  rows: dbFactory('rows.db', { timestampData: true }),
  columns: dbFactory('columns.db'),
  async init() {
    const data = await this.columns.find({});
    if (data.length === 0) {
      this.columns.insert(defaultColumns);
    }
  },
};
