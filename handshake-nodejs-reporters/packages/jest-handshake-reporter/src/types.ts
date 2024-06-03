import { Level } from 'pino';

export default interface HandshakeJestReporterOptions {
  root?: string;
  resultsFolderName: string;
  testConfig: {
    projectName: string;
    avoidParentSuitesInCount?: boolean;
  };
  port?: number;
  requestsTimeout?: number;
  logLevel?:Level;
  disabled?: boolean;
  reportGenerationTimeout?:number;
  workers?:number;
  exportOutDir?: string;
}
