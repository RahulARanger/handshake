// eslint-disable-next-line max-classes-per-file
import WDIOReporter from '@wdio/reporter';

/**
 * @typedef {{port?:number, root?: string,
 *  timeout?:number, collectionName?:string, reportLabel?: string,
 *  projectName:string}
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

export class ReporterEndpoints extends WDIOReporter {
    get url() {
        return `http://127.0.0.1:${this.options.port}`;
    }

    get saveUrl() {
        return `${this.url}/save`;
    }

    get addFeatureUrl() {
        return `${this.saveUrl}/addFeature`;
    }

    get addSuiteUrl() {
        return `${this.saveUrl}/addSuite`;
    }

    get registerSession() {
        return `${this.saveUrl}/registerSession`;
    }

    get registerSuite() {
        return `${this.saveUrl}/registerSuite`;
    }

    get updateSuite() {
        return `${this.saveUrl}/updateSuite`;
    }

    get updateSession() {
        return `${this.saveUrl}/updateSession`;
    }
}
