/* eslint-disable @typescript-eslint/no-var-requires */
const { createWriteStream, readFileSync } = require('node:fs')
const { get } = require("node:https")
const { platform } = require("node:os")
const { exit } = require("node:process")


/**
 * @typedef {{url: string;
 *  id: number; name: 'Windows.exe' | 'Darwin'; label: string; content_type: string; state: 'uploaded'; size: number; download_count: number;
    * created_at: string;
*updated_at: string;
*   browser_download_url: string;}} Asset
 * @type {Record<string, Asset>}
 */
const versionFromNames = {};

(JSON.parse(readFileSync('./.version').toString())).forEach(
    (dist) => (versionFromNames[dist.name] = dist),
);

let interest;

switch (platform()) {
    case 'win32': {
        interest = 'graspit-Windows.exe';
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

const file = createWriteStream(`./graspit`);

get(versionFromNames[interest].browser_download_url, function (resp) {
    resp.pipe(file);

    file.on('finish', () => {
        console.log("Thanks for waiting")
        file.close();
    });
});
