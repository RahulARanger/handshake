import NeXtReporter from './reporter';
import Shipment from './shipment';

/**
 * @typedef {import("./reporter").ReporterOptions} ReporterOptions
 * @typedef {import('./contacts').ShipmentOptions} ShipmentOptions
 * @typedef {ReporterOptions | ShipmentOptions} Options
 * @param {Options} options Options to pass to our reporter and service
 * @returns {{Reporter: [NeXtReporter, ReporterOptions],
 *  Service: [Shipment, ShipmentOptions]}} returns the Reporter and service
 */
export function neXtReporter(
    options,
) {
    const reporterOptions = {
        port: options.port || 6969,
    };

    const serviceOptions = {
        port: reporterOptions.port,
        root: options.root || process.cwd(),
        collectionName: options.collectionName || 'Test Results',
        timeout: options.timeout || 30e3,
        reportLabel: options.reportLabel || undefined,
        generateOut: options.generateOut || false,
    };

    return {
        Reporter: [NeXtReporter, reporterOptions],
        Service: [Shipment, serviceOptions],
    };
}

/**
 * @typedef {import("@wdio/types").Options.WebdriverIO} Config
 * @param {Config} _config config. we use it for our test framework
 * @param {Options} options options for our NeXt Reporter
 * @returns {Config} Updated Config Object
 */
export default function attachNeXtReporter(_config, options) {
    const generated = neXtReporter(options);
    if (_config.reporters) _config.reporters.push(generated.Reporter);
    // eslint-disable-next-line no-param-reassign
    else _config.reporters = [generated.Reporter];

    if (_config.services) _config.services.push(generated.Service);
    // eslint-disable-next-line no-param-reassign
    else _config.services = [generated.Service];

    return _config;
}
