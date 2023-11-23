#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { join } = require('path');
const { platform } = require('os');

const args = process.argv.slice(2);
const executable = platform() === 'win32' ? 'graspit.exe' : 'graspit';
spawnSync(join(__dirname, 'bin', executable), args, { stdio: 'inherit', env: process.env });
