export default class ContactList {
    /**
     * @typedef {{
     * port?: number, cwd: string,
     *  timeout: number, collectionName?: string}} Options
     * @type {Options} Options
     */
    options = {
        timeout: 20e3,
        cwd: process.cwd(),
        collectionName: 'results',
        port: 6969,
    };

    get url() {
        return `http://127.0.0.1:${this.options.port}`;
    }

    /**
     *
     * @param {Options} options Options for the service
     */
    constructor(options) {
        this.option = options;
    }
}
