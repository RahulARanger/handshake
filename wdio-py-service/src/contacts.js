export default class ContactList {
    /**
     * @typedef {{
     * port?: number, root?: string,
     *  timeout?: number, collectionName?: string}} Options
     * @type {Options} Options
     */
    options = {
        timeout: 20e3,
        root: process.cwd(),
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
        this.options = {
            port: options.port ?? this.options.port,
            collectionName: options.collectionName ?? this.options.collectionName,
            timeout: options.timeout ?? this.options.timeout,
            root: options.root ?? this.options.root,
        };
    }
}
