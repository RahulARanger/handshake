/* eslint-disable @typescript-eslint/no-var-requires */
import { createWriteStream, readFileSync } from 'node:fs';
import { get } from 'node:https';
import { platform } from 'node:os';
import { exit } from 'node:process';

/**
 * @typedef {{url: string;
 *  id: number; name: 'Windows.exe' | 'Darwin';
 * label: string; content_type: string; state: 'uploaded'; size: number; download_count: number;
* created_at: string;
*updated_at: string;
*   browser_download_url: string;}} Asset
 * @type {Record<string, Asset>}
 */
const versionFromNames = {};

(JSON.parse(readFileSync('./.version').toString())).forEach(
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

const file = createWriteStream(exeName);

get(versionFromNames[interest].browser_download_url, (resp) => {
  resp.pipe(file);

  file.on('finish', () => {
    console.log('Thanks for waiting');
    file.close();
  });
});
