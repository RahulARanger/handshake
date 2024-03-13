#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { join } = require('path');
const { platform } = require('os');
const { existsSync } = require('fs');
const { getBinPath } = require('./installation/get_path.cjs');

const args = process.argv.slice(2);
const executable = platform() === 'win32' ? 'handshake.exe' : 'handshake';
const executablePath = join(getBinPath(), executable);

if (existsSync(executablePath)) spawnSync(executablePath, args, { stdio: 'inherit', env: process.env });
else throw new Error(`Failed to find the executable in the bin folder, ${executablePath}`);
