import { Level } from 'log4js';

export interface ReporterOptions {
  port: number;
  root: string;
  collectionName: string;
  addScreenshots?:boolean;
  timeout?:number;
  logLevel?:Level;

}
export interface HandshakeServiceOptions {
  port: number;
  root: string;
  exePath?:string;
  collectionName: string;
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
