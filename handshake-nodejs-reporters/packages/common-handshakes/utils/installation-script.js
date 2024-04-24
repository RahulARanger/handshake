import chalk from "chalk";
import { readFileSync, createWriteStream, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import { spawnSync } from "child_process";
import superagent from "superagent"

export default async function spawnInstallation() {
    const currentDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const versionFile = join(currentDir, ".version");
    const versionMeta = JSON.parse(readFileSync(versionFile))

    let isSame = false;
    let hasConnected = false;
    let required = null;

    try {
        const output = spawnSync("handshake", ["v"], { shell: true })
        hasConnected = true;
        required = output.stdout.toString().trim();

    }
    catch (error) {
        console.log(chalk.yellowBright('+ Failed to connect with handshake server, it is recommended to install/update common-handshakes (for handshake-dashboard) inside a terminal with venv activated and handshake (python-build) installed'));
        console.error(chalk.red(`  + Connection Error: ${error}`))
    }

    if (hasConnected) {
        isSame = required === versionMeta.version
    }

    if (isSame) {
        console.log(chalk.green("+ No Update is required for the handshake (python build)"));
    }
    else if (hasConnected) {
        console.log(chalk.yellow("+ Requested to install handshake ") + chalk.italic("(python build)") + chalk.bold(` of ${required}`) + chalk.yellow(`, Currently we are at ${versionMeta.version}`))
    }
    else {
        console.log(chalk.yellow("+ Requested to install handshake ") + chalk.italic("(python build)") + chalk.bold(` of ${required}`))
    }

    const dashboardBuild = versionMeta[0].browser_download_url
    console.log(chalk.blue(`+ Downloading dashboard build from ${dashboardBuild}...`))

    const target = join(currentDir, "dashboard.tar.bz2");
    if (existsSync(target)) {
        rmSync(target);
    }
    const stream = createWriteStream(target);
    const request = superagent.get(dashboardBuild);

    await new Promise((resolve, reject) => {
        request.pipe(stream).on('close', () => {
            const code = request.responseType()?.response?.statusCode ?? 404;

            if (code < 300 && code > 199) {
                console.log(chalk.blue('+ Download completed, we can now use the handshake executable.'));
                resolve();
            } else {
                console.log(chalk.red(`+ Failed to download the handshake executable, please check if this url is still valid: ${url}, found status code: ${code}.\nPlease contact package owner reg. this. if this error is visible even on latest version.`));
                reject();
            }
        });
    });
}