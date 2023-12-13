const { join, dirname } = require('node:path');
const { platform } = require('node:os');
const { exit } = require('node:process');

function getPath() {
  let interest;
  let exeName = 'handshake';

  switch (platform()) {
    case 'win32': {
      interest = 'graspit-Windows.exe';
      exeName = 'handshake.exe'; // removing .exe makes its unusable
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
      console.warn(`yet to be supported for: ${platform()}`);
      exit(0);
    }
  }

  return [interest, exeName];
}

function getBinPath() {
  return join(dirname(dirname(__filename)), 'bin');
}

module.exports = { getBinPath, getPath };
