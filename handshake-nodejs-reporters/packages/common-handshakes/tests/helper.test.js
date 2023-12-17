const { describe, test, expect } = require('@jest/globals');
const { join } = require('path');
const { sanitizePaths, acceptableDateString } = require('../src/helpers');

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
