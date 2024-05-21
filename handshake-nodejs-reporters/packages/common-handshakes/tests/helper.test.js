const { describe, test, expect } = require('@jest/globals');
const { join, dirname } = require('path');
const { readFileSync } = require('fs');
const { sanitizePaths, acceptableDateString, checkVersion } = require('../src/helpers');

describe('verifying sanitizer', () => {
  const current = join('tests', 'helper.test.js');
  test('verifying the basic case', () => {
    expect(sanitizePaths([__filename])).toEqual([current]);
    expect(sanitizePaths([__filename, __dirname])).toEqual([current, 'tests']);
  });

  test('with file://', () => {
    expect(sanitizePaths([`file:///${__filename}`, `file:///${__dirname}`])).toEqual([current, 'tests']);
  });

  test('convert the date to iso string', () => {
    const note = new Date();
    expect(acceptableDateString(note)).toEqual(note.toISOString()); // we only save the ISO string
  });
});

test('verifying the version match test', async () => {
  const { version } = JSON.parse(readFileSync(join(dirname(__dirname), '.version').toString()));
  expect(checkVersion('handshake')).toEqual(version);
});
