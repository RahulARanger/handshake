#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { join } = require('path');
const { platform } = require('os');
const { getBinPath } = require('./installation/get_path.cjs');

const args = process.argv.slice(2);
const executable = platform() === 'win32' ? 'handshake.exe' : 'handshake';
spawnSync(join(getBinPath(), executable), args, { stdio: 'inherit', env: process.env });
