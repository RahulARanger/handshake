const { describe, test, expect } = require('@jest/globals');
const { sanitizePaths } = require('../src/helpers');

describe('verifying sanitizer', () => {
  test('verifying the basic case', () => {
    expect(sanitizePaths([__filename])).toEqual(['tests\\helper.test.js']);
    expect(sanitizePaths([__filename, __dirname])).toEqual(['tests\\helper.test.js', 'tests']);
  });

  test('with file://', () => {
    expect(sanitizePaths([`file:///${__filename}`, `file:///${__dirname}`])).toEqual(['tests\\helper.test.js', 'tests']);
  });
});
