const { join, dirname } = require('node:path');
const { platform } = require('node:os');
const { exit } = require('node:process');
const { existsSync, mkdirSync, readFileSync } = require('node:fs');

function getPath() {
  let interest;
  let exeName = 'handshake';

  switch (platform()) {
    case 'win32': {
      interest = 'handshake-Windows.exe';
      exeName = 'handshake.exe'; // removing .exe makes its unusable
      break;
    }
    case 'darwin': {
      interest = 'handshake-Darwin';
      break;
    }
    case 'linux': {
      interest = 'handshake-Linux';
      break;
    }
    default: {
      console.warn(`yet to be supported for: ${platform()}`);
      exit(0);
    }
  }

  return [interest, exeName];
}

function getBinPath() {
  return join(dirname(dirname(__filename)), 'bin');
}

function getVersionFromNames() {
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
  return versionFromNames;
}

module.exports = { getBinPath, getPath, getVersionFromNames };
