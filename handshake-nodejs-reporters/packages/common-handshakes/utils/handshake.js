#!/usr/bin/env node
/* eslint-disable no-console */

import arg from 'arg';
import { exit } from 'process';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
// eslint-disable-next-line import/extensions
import spawnInstallation, { dashboardBuildFile, validateConnection } from './installation-script.js';

// NOTE: do not name this bin-script as handshake else it will conflict with the python-build
const args = arg({
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--build': Boolean,
  '--download': Boolean,

  // Aliases
  '-v': '--version',
  '-b': '--build',
  '-d': '--download',
  '-h': '--help',
});

if (args['--version']) {
  validateConnection(false);
  exit();
}

if (args['--help']) {
  console.log(
    chalk.bold('Shake CLI: A tool to use handshake CLI with a custom reporter context.\n'),
  );
  console.log(
    chalk.italic('Note: To use most commands in Shake CLI, you need to first activate the virtual environment.\n'),
  );

  console.log(chalk.blue('--version or -v: Checks if the version matches with the required version against the python-build. If not, it installs the required version.'));
  console.log(chalk.yellow('--build or -b: Requires two arguments - TestResults followed by TestReports. TestResults is where your results are stored, and TestReports is where the generated reports will be saved.'));
  console.log(chalk.blueBright('--download or -d: Downloads the raw build for the dashboard. This command is typically called automatically post-installation.'));
  console.log(chalk.yellowBright('--help or -h: Prints this help message.'));
  console.log(chalk.underline(chalk.dim('Examples:')));
  console.log(chalk.green('npx shake --build Results Reports'));
  console.log(chalk.green('npx shake -b Results Reports'));
  console.log(chalk.green('npx shake -d'));
  console.log(chalk.green('npx shake --download'));

  exit(0);
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
