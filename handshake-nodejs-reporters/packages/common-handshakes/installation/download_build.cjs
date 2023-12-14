const {
  createWriteStream, chmodSync,
} = require('node:fs');
const superagent = require('superagent');
const { join } = require('node:path');

const { getPath, getBinPath, getVersionFromNames } = require('./get_path.cjs');

const versionFromNames = getVersionFromNames();

const [interest, exeName] = getPath();
const exe = join(getBinPath(), exeName);
const stream = createWriteStream(exe);

(async () => {
  await superagent
    .get(versionFromNames[interest].browser_download_url)
    .pipe(stream).on('close', () => {
      if (!exe.endsWith('.exe')) chmodSync(exe, 755);
    });
})();

module.exports.default = versionFromNames;
