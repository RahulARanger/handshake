const { existsSync, rmSync } = require('fs');
const { join, dirname } = require('path');

const root = dirname(dirname(process.cwd()));
const results = join(root, 'Jest-Results');
const reports = join(results, 'Jest-Reports');

function resetDir() {
  if (existsSync(results)) rmSync(results, { recursive: true, force: true });
  if (existsSync(reports)) rmSync(reports, { recursive: true, force: true });
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = {
  resetDir, root, results, uuidRegex, reports,
};
