/* eslint-disable import/extensions */
import { spawn, ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import {
    clearInterval, setTimeout, clearTimeout, setInterval,
} from 'node:timers';
// eslint-disable-next-line import/no-unresolved
import logger from '@wdio/logger';
import ContactList from './contacts.js';

/**
 * @class
 */

export default class Shipment extends ContactList {
    timeout = 20e3;

    logger = logger('wdio-py-service');

    cwd = process.cwd();

    /**
     * @type {ChildProcess}
     */
    pyProcess;

    /**
     *
     * @param {{port?: number, cwd: string, timeout: number}} options
     *  Options for Shipping the test results
     */
    constructor(options) {
        super();
        this.port = options.port ?? this.port;
        this.cwd = options.cwd ?? this.cwd;
        this.timeout = options.timeout ?? this.timeout;
    }

    async onPrepare() {
        const path = join('venv', 'Scripts', 'activate');
        const { cwd } = this;

        this.pyProcess = spawn(`"${path}" && sanic app:app --port ${this.port} --workers 2`, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] }, { cwd });

        this.pyProcess.stdout.on('data', (data) => this.logger.info(data?.toString()));
        this.pyProcess.stderr.on('data', (data) => this.logger.warn(data?.toString()));

        this.pyProcess.on('error', (err) => { throw new Error(String(err)); });
        this.pyProcess.on('exit', (code) => { throw new Error(`Failed to generate the report, Error Code: ${code}`); });

        this.logger.warn(`pid: ${this.pyProcess.pid}`);

        process.on('exit', async () => { await this.forceKill(); });
    }

    async onWorkerStart() {
        await Promise.resolve(this.waitUntilItsReady.bind(this)());
    }

    async onComplete() {
        const completed = this.pyProcess.killed || (await fetch(`${this.url}/setLastWave`, { method: 'POST' })).status !== 200;
        if (completed) return this.pyProcess.exitCode === 0;

        return this.flagToPyThatsItsDone();
    }

    async forceKill() {
        if (this.pyProcess.killed) return;
        if ((await fetch(`${this.url}/`)).status === 200) { this.pyProcess.kill('SIGINT'); }
    }

    async sayBye() {
        if (this.pyProcess.killed) return;
        await fetch(`${this.url}/bye`, { method: 'POST' });
    }

    async waitUntilItsReady() {
        const waitingForTheServer = new Error('Not able to connect with server within 10 seconds');
        return new Promise((resolve, reject) => {
            const bomb = setTimeout(() => {
                this.logger.error('Failed to connect with the server');
                reject(waitingForTheServer);
            }, 10e3); // 5 seconds buffer

            const timer = setInterval(() => {
                this.logger.warn('pinging py-server...');

                fetch(`${this.url}/`).then((resp) => {
                    if (resp.status !== 200) return;

                    clearTimeout(bomb);
                    clearInterval(timer);
                    this.logger.info('Connection Found!');
                    resolve();
                });
            }, 3e3);
        }).catch(this.sayBye);
    }

    async flagToPyThatsItsDone() {
        const explain = new Error('Sorry, could not generate report on time, please increase the timeout.');
        return new Promise((resolve, reject) => {
            const bomb = setTimeout(() => {
                this.logger.error('Failed to generate report on time');
                reject(explain);
            }, this.timeout + 5e3); // 5 seconds buffer

            const timer = setInterval(() => {
                this.logger.warn('Waiting for the py-process to complete...');

                fetch(`${this.url}/isItDone`).then((data) => data.json()).then(
                    (data) => {
                        if (!data.done) { this.logger.warn(`Pending tasks: ${data.message}`); return; }

                        clearTimeout(bomb);
                        clearInterval(timer);
                        resolve();
                    },
                );
            }, 1e3);
        }).then(async () => {
            this.logger.info('Killed the process...');
            await this.sayBye();
        });
    }
}
