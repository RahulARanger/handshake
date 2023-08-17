/**
 * @typedef {{port?:number, root?: string,
 *  timeout?:number, collectionName?:string, reportLabel?: string, generateOut?:boolean}
 * } ShipmentOptions Options to be utilized for the Service
 */

export default class ContactList {
    /**
     * @type {ShipmentOptions} Options
     */
    options = {};

    /**
     *
     * @param {ShipmentOptions} options options for running the service
     */
    constructor(options) {
        this.options = options;
    }

    get url() {
        return `http://127.0.0.1:${this.options.port}`;
    }
}
