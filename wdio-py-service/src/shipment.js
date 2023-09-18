/* eslint-disable import/extensions */
import { spawn, ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import {
    clearInterval, setTimeout, clearTimeout, setInterval,
} from 'node:timers';
// eslint-disable-next-line import/no-unresolved
import logger from '@wdio/logger';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import ContactList from './referenceUrls.js';

export default class Shipment extends ContactList {
    logger = logger('wdio-py-service');

    /**
     * @type {ChildProcess}
     */
    pyProcess;

    get resultsDir() {
        return join(this.options.root, this.options.collectionName);
    }

    get venv() {
        return join('venv', 'Scripts', 'activate');
    }

    /**
     *
    //  * @param {import("@wdio/types").Options.WebdriverIO} _
     * Config used for the webdriverIO tests
     */
    async onPrepare() {
        const {
            root: rootDir, port, projectName,
        } = this.options;

        this.logger.info('Starting py-process 🚚...');
        const { resultsDir } = this;
        if (!existsSync(resultsDir)) { mkdir(resultsDir); }

        const command = `"${this.venv}" && next-py run-app ${projectName} "${resultsDir}" -p ${port} -w 2`;
        this.pyProcess = spawn(
            command,
            { cwd: rootDir, shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
            { cwd: rootDir },
        );

        this.pyProcess.stdout.on('data', (data) => this.logger.info(data?.toString()));
        this.pyProcess.stderr.on('data', (data) => this.logger.warn(data?.toString()));

        this.pyProcess.on('error', (err) => { throw new Error(String(err)); });
        this.pyProcess.on('exit', (code) => { if (code !== 0) throw new Error(`→ Failed to generate the report, Error Code: ${code}`); });

        this.logger.info(`Started py-process, running 🐰 at pid: ${this.pyProcess.pid}`);
        process.on('exit', async () => { await this.forceKill(); });
    }

    async onWorkerStart() {
        await Promise.resolve(this.waitUntilItsReady.bind(this)());
    }

    async forceKill() {
        if (this.pyProcess.killed) return;
        if ((await fetch(`${this.url}/`)).status === 200) {
            await this.sayBye();
            this.pyProcess.kill('SIGINT');
            this.logger.warn('→ Had to 🗡️ the py-process.');
        }
    }

    async sayBye() {
        if (this.pyProcess.killed) return;
        try {
            this.logger.warn('→ See you later py-process 👋');
            await fetch(`${this.url}/bye`, { method: 'POST' });
            this.logger.info('→ Py Process was closed 😪');
        } catch {
            this.logger.warn('→ Server was already closed. 😫');
        }
    }

    async waitUntilItsReady() {
        const waitingForTheServer = new Error(
            'Not able to connect with server within 10 seconds 😢, please try again later',
        );

        return new Promise((resolve, reject) => {
            const bomb = setTimeout(() => { reject(waitingForTheServer); }, 10e3);

            const timer = setInterval(() => {
                this.logger.warn('pinging py-server 👆...');

                fetch(`${this.url}/`).then((resp) => {
                    if (resp.status !== 200) return;
                    clearTimeout(bomb); clearInterval(timer);

                    this.logger.info('Server is online! 😀');
                    resolve();
                }).catch(() => {
                    this.logger.warn('😓 Server has not started yet...');
                });
            }, 3e3);
        }).catch(this.sayBye.bind(this));
    }

    async flagToPyThatsItsDone() {
        // closing next-py server for now.
        await this.sayBye();

        const reportError = new Error('Failed to generate Report on time 😢, please note the errors if any seen.');
        const patcher = spawn(`"${this.venv}" && next-py patch "${this.resultsDir}"`, { shell: true, cwd: this.options.root, stdio: ['ignore', 'pipe', 'pipe'] });

        return new Promise((resolve, reject) => {
            const bomb = setTimeout(
                () => reject(reportError),
                this.options.timeout,
            );
            patcher.on('exit', (exitCode) => {
                clearTimeout(bomb);

                if (exitCode !== 0) {
                    this.logger.warn(patcher.stdout.read()?.toString());
                    this.logger.error(patcher.stderr.read()?.toString());
                    return reject(reportError);
                }
                this.logger.info('Results are patched 🤩. Now we are ready to export it.');
                return resolve();
            });
        });
    }

    /**
     *
     * @param {any} _ exitCode
     * @param {import("@wdio/types").Options.WebdriverIO} config WebdriverIO config
     * @returns {Promise<any>} wait for promise
     */
    async onComplete(_, config) {
        const resp = await fetch(this.updateRunConfig, {
            method: 'PUT',
            body: JSON.stringify(
                {
                    maxTestRuns: 100,
                    platformName: config.capabilities.platformName,
                },
            ),
        });
        this.logger.info(`Updated config 🐰 for the test run: ${await resp.text()}`);
        const completed = this.pyProcess.killed;
        if (completed) return this.pyProcess.exitCode === 0;
        await fetch(`${this.url}/done`, { method: 'PUT' }).then(async (data) => this.logger.info(await data.text()));
        return this.flagToPyThatsItsDone();
    }
}
