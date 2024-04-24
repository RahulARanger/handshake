import { Level } from 'pino';

export interface ReporterOptions {
  port: number;
  addScreenshots?:boolean;
  timeout?:number;
  logLevel?:Level;

}
export interface HandshakeServiceOptions {
  port: number;
  root: string;
  resultsFolderName: string;
  timeout?: number;
  workers?:number;
  logLevel?:Level;
  export?: {
    out?: string;
    maxTestRuns: number;
    skipPatch?: boolean;
  }
  testConfig: {
    projectName: string;
    avoidParentSuitesInCount?: boolean;
  }
}
