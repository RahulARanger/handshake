import { Level } from 'pino';

export interface ReporterOptions {
  port: number; // port at which we would run the handshake server
  addScreenshots?:boolean; // do we need to add screenshots to the report ?
  requestsTimeout?:number; // dependent on reportSyncTimeout in webdriverIOConfig.
  logLevel?:Level; // log level for pino logger that we use
  disabled?: boolean; // make it true to not add reporter and service
  // if disabled it is as if we haven't added handshake-reporter
}
export interface HandshakeServiceOptions {
  port: number;
  root: string; // Results are stored relative to this root
  // and handshake.json is assumed to be in this root.
  resultsFolderName: string; // Results are stored in ${{ROOT}}/${{resultsFolderName}}
  requestsTimeout?: number; // we send bulk requests to the server so if it takes more than this,
  //  it will stop
  reportGenerationTimeout?:number; // stop generating reports if it takes more than this timeout
  workers?:number; // workers to support handshake-server
  logLevel?:Level; // log level for pino logger that we use (for custom service)
  exportOutDir?: string; // directory path to store the Dashboard (HTML) Reports
  testConfig: {
    projectName: string; // Name of the project
    avoidParentSuitesInCount?: boolean;
    // In Gherkin:
    // Feature -> Scenario -> Step.. in this case we get 2 suites but its 1.
    // so we ignore the parent suites in the totalNumberOfSuites.
    // do not use this unless required. it is true only when you cucumber as framework
    // else it is false.
  }
}

// for attachReporter function we need both (union) the above options
export type AttachReporterOptions = ReporterOptions & HandshakeServiceOptions & { root?: string };
