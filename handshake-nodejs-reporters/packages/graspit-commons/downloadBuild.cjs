const {
  createWriteStream, readFileSync, chmodSync, mkdirSync, existsSync,
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

const root = join(dirname(__filename), 'bin');

if (!existsSync(root)) {
  mkdirSync(root);
}

(JSON.parse(readFileSync(join(dirname(__filename), '.version')).toString())).forEach(
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
  case 'linux': {
    interest = 'graspit-Linux';
    break;
  }
  default: {
    console.warn(`yet to supported for: ${platform()}`);
    exit(0);
  }
}

const exe = join(root, exeName);
const stream = createWriteStream(exe);

superagent
  .get(versionFromNames[interest].browser_download_url)
  .pipe(stream).on('close', () => {
    if (!exe.endsWith('.exe')) chmodSync(exe, 755);
  });
