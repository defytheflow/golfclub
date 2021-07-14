import fs from 'fs';
import path from 'path';
import util from 'util';

import { app } from 'electron';
import chalk from 'chalk';

const LOG_FILE = fs.createWriteStream(path.join(app.getAppPath(), 'debug.log'), {
  flags: 'a',
});

export default function log(...args: unknown[]) {
  const msg = util.format(...args);
  console.log(chalk.blue.bold('log:'), msg);
  LOG_FILE.write(msg + '\n');
}
