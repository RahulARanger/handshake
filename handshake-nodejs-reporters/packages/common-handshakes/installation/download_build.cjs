const {
  createWriteStream, chmodSync,
} = require('node:fs');
const superagent = require('superagent');
const { join } = require('node:path');

const { getLogger } = require('log4js');
const { getPath, getBinPath, getVersionFromNames } = require('./get_path.cjs');

const versionFromNames = getVersionFromNames();

const [interest, exeName] = getPath();
const exe = join(getBinPath(), exeName);
const stream = createWriteStream(exe);

(async () => {
  const logger = getLogger('handshake-installation');
  logger.level = 'info';
  const url = versionFromNames[interest].browser_download_url;
  logger.info(`Downloading from ${url}`);

  const request = superagent.get(url);
  request.pipe(stream).on('close', () => {
    const code = request.responseType()?.response?.statusCode ?? 404;

    if (code < 300 && code > 199) logger.info('Download completed, we can now use the handshake executable.');
    else logger.error(`Failed to download the handshake executable, please check if this url is still valid: ${url}, found status code: ${code}.\nPlease contact package owner reg. this. if this error is visible even on latest version.`);

    if (!exe.endsWith('.exe')) chmodSync(exe, 755);
  });
})();

module.exports.default = versionFromNames;
