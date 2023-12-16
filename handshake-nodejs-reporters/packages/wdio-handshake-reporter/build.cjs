const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const toReplace = '__toESM(require("@wdio/reporter"), 1)';
const withThis = 'require("@wdio/reporter")';

const toRead = join(__dirname, 'dist', 'index.cjs');
writeFileSync(
  toRead,
  readFileSync(toRead, 'utf-8').replace(toReplace, withThis),
  'utf-8',
);
