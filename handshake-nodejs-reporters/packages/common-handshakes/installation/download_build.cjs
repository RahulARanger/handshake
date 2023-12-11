const {
  createWriteStream, readFileSync, chmodSync, mkdirSync, existsSync,
} = require('node:fs');
const superagent = require('superagent');
const { join, dirname } = require('node:path');

const { getPath, getBinPath } = require('./get_path.cjs');

/**
   * @typedef {{url: string;
   *  id: number; name: 'Windows.exe' | 'Darwin';
   * label: string; content_type: string; state: 'uploaded'; size: number; download_count: number;
  * created_at: string;
  * updated_at: string;
  *   browser_download_url: string;}} Asset
   * @type {Record<string, Asset>}
   */
const versionFromNames = {};

const root = getBinPath();
if (!existsSync(root)) {
  mkdirSync(root);
}

(JSON.parse(readFileSync(join(dirname(root), '.version')).toString())).forEach(
  (dist) => { versionFromNames[dist.name] = dist; },
);

const [interest, exeName] = getPath();
const exe = join(root, exeName);
const stream = createWriteStream(exe);

superagent
  .get(versionFromNames[interest].browser_download_url)
  .pipe(stream).on('close', () => {
    if (!exe.endsWith('.exe')) chmodSync(exe, 755);
  });

module.exports.default = versionFromNames;
