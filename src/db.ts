import path from 'path';
import { readFileSync } from 'fs';

import { app } from 'electron';
import Datastore from 'nedb-promises';

import log from './logging';
import { Row } from './types';

function dbFactory(filename: string, options = {}) {
  const dbPath = path.join(app.getAppPath(), 'data', filename);
  return Datastore.create({ filename: dbPath, autoload: true, ...options });
}

function loadPlayers() {
  const resourcesPath =
    process.env.NODE_ENV === 'production'
      ? process.resourcesPath
      : path.join(app.getAppPath(), 'src', 'assets');

  const players: Row[] = [];
  const csvPath = path.join(resourcesPath, 'players.csv');
  log('csvPath is', csvPath);
  const lines = readFileSync(csvPath, 'utf8').split('\r\n');

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].split(';').map(word => word.trim());
    const number = line[0];
    const name = line[1]?.replace('.', '');
    const gender = normalizeGender(line[3]);
    const hi = line[4]?.replace(',', '.');
    players.push({ number, name, gender, hi });
  }

  return players;
}

function normalizeGender(gender?: string) {
  gender = gender.toLowerCase();
  if (gender === 'м') return 'Муж.';
  if (gender === 'ж') return 'Жен.';
  return gender;
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
  async init(cb = () => {}) {
    const rows = await this.rows.find({});
    if (rows.length === 0) {
      this.rows.insert(loadPlayers());
    }

    const columns = await this.columns.find({});
    if (columns.length === 0) {
      this.columns.insert(defaultColumns);
    }

    log('db.init FINISHED');
    cb();
  },
};
