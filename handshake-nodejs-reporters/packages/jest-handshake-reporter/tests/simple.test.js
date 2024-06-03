const {
  describe, test, expect,
} = require('@jest/globals');

describe('Simple Scenario for intro. with the ', () => {
  test('Simple Test', () => {
    console.log('Simple LOG');
    console.log('with some args', 1, 2, false, 'this one too');
  });

  test('Multiple Assertions', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('have this').toContain('this');
  });
});

test('outside of the suite', async () => {
  expect(1 + 1).toBe(2);
});
