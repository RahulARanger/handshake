#!/usr/bin/env node
/* eslint-disable no-fallthrough */
/* eslint-disable no-console */

import arg from 'arg';
import { exit } from 'process';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
// eslint-disable-next-line import/extensions
import spawnInstallation, { dashboardBuildFile, handshakeVersion, validateConnection } from './installation-script.js';

// NOTE: do not name this bin-script as handshake else it will conflict with the python-build
const args = arg({
  // Types
  '--help': Boolean,
  '--fix-version': Boolean,
  '--version': Boolean,
  '--build': Boolean,
  '--download': Boolean,

  // Aliases
  '-v': '--version',
  '-f': '--fix-version',
  '-b': '--build',
  '-d': '--download',
  '-h': '--help',
});

if (args['--help']) {
  console.log(
    chalk.bold('Shake CLI: A tool to use handshake CLI with a custom reporter context.\n'),
  );
  console.log(
    chalk.italic('Note: To use most commands in Shake CLI, you need to first activate the virtual environment.\n'),
  );

  const noted = ['--download', '--build', '--fix-version', '--version'];

  if (noted.filter((key) => args[key]).length === 0) {
    noted.splice(0, noted.length);
    noted.push('--all');
  }
  let slide = false;

  noted.forEach((key) => {
    if (key !== '--all' && !args[key]) return;
    switch (key) {
      case '--all': {
        slide = true;
      }
      case '--build': {
        console.log(chalk.yellowBright('--build or -b: Requires two arguments - TestResults followed by TestReports. TestResults is where your results are stored, and TestReports is where the generated reports will be saved.'));
        if (!slide) break;
      }
      case '--fix-version': {
        console.log(chalk.redBright('--fix-version or -f: checks and downloads required handshake python build (if mismatch was found) in the current python context'));
        if (!slide) break;
      }
      case '--download': {
        console.log(chalk.blueBright('--download or -d: Downloads the raw build for the dashboard. This command is called automatically, post-installation.'));
        if (!slide) break;
      }
      case '--version': {
        console.log(chalk.grey('--version or -v: Prints the version of required handshake python build'));
        if (!slide) break;
      }

      default: {
        break;
      }
    }
  });

  console.log(chalk.underline(chalk.dim('Examples:')));

  noted.forEach((key) => {
    if (key !== '--all' && !args[key]) return;
    switch (key) {
      case '--all': {
        slide = true;
      }
      case '--build': {
        console.log(chalk.yellow('\tnpx shake -b Results Reports'));
        console.log(chalk.yellow('\tnpx shake --build Results Reports'));
        if (!slide) break;
      }
      case '--fix-version': {
        console.log(chalk.red('\tnpx shake -f'));
        console.log(chalk.red('\tnpx shake --fix-version'));
        if (!slide) break;
      }
      case '--download': {
        console.log(chalk.blue('\tnpx shake -d'));
        console.log(chalk.blue('\tnpx shake --download'));
        if (!slide) break;
      }
      case '--version': {
        console.log(chalk.grey('\tnpx shake -v'));
        console.log(chalk.grey('\tnpx shake --version'));
        if (!slide) break;
      }

      default: {
        break;
      }
    }
  });

  console.log(chalk.yellowBright('\t--help or -h: Prints full help message.'));
  exit(0);
}

if (args['--version']) {
  console.log(chalk.blueBright(handshakeVersion().version));
  validateConnection(false);
  exit();
}

if (args['--fix-version']) {
  validateConnection(true);
  exit();
}

if (args['--build']) {
  const [resultsPath, reportPath] = args._;
  const output = spawnSync(
    'handshake',
    ['patch', `"${resultsPath}"`, '-o', `"${reportPath}"`, '-b', `"${dashboardBuildFile}"`],
    { shell: true },
  );
  const error = output.stderr?.toString();
  const outputFeed = output.stdout?.toString();
  const use = output.status === 0 ? chalk.blue : chalk.red;

  console.log(use(outputFeed));
  console.log(use(error));
  exit(output.status);
}

if (args['--download']) {
  spawnInstallation();
}
