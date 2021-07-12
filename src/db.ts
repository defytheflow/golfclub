import path from 'path';
import { readFileSync } from 'fs';

import { app } from 'electron';
import Datastore from 'nedb-promises';

import { Row } from './types';

function dbFactory(filename: string, options = {}) {
  return Datastore.create({
    filename: path.join(app.getAppPath(), 'data', filename),
    autoload: true,
    ...options,
  });
}

function loadPlayers() {
  const players: Row[] = [];
  const lines = readFileSync('players.csv', 'utf8').split('\r\n');

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim().split(';');
    const number = line[0]?.trim();
    const name = line[1]?.replace('.', '')?.trim();
    const gender = normalizeGender(line[3]?.trim().toLowerCase());
    const hi = line[4]?.trim().replace(',', '.');
    players.push({ number, name, gender, hi });
  }

  return players;
}

function normalizeGender(gender?: string) {
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
  async init() {
    const rows = await this.rows.find({});
    if (rows.length === 0) {
      this.rows.insert(loadPlayers());
    }
    const columns = await this.columns.find({});
    if (columns.length === 0) {
      this.columns.insert(defaultColumns);
    }
  },
};
