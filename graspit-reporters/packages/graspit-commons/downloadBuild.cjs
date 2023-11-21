const {
  createWriteStream, readFileSync,
} = require('node:fs');
const superagent = require('superagent');
const { platform } = require('node:os');
const { exit } = require('node:process');
const { join, dirname } = require('node:path');

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

const root = dirname(__filename);

(JSON.parse(readFileSync(join(root, '.version')).toString())).forEach(
  (dist) => { versionFromNames[dist.name] = dist; },
);

let interest;
let exeName = 'graspit';

switch (platform()) {
  case 'win32': {
    interest = 'graspit-Windows.exe';
    exeName = 'graspit.exe'; // removing .exe makes its unusable
    break;
  }
  case 'darwin': {
    interest = 'graspit-Darwin';
    break;
  }
  default: {
    console.warn(`yet to supported for: ${platform()}`);
    exit(0);
  }
}

const stream = createWriteStream(join(root, exeName));

superagent
  . get(versionFromNames[interest].browser_download_url)
  .pipe(stream);