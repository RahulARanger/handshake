import { Level } from 'pino';

export interface ReporterOptions {
  port: number;
  addScreenshots?:boolean;
  requestsTimeout?:number;
  logLevel?:Level;
  disabled?: boolean;

}
export interface HandshakeServiceOptions {
  port: number;
  root: string;
  resultsFolderName: string;
  requestsTimeout?: number;
  reportGenerationTimeout?:number;
  workers?:number;
  logLevel?:Level;
  exportOutDir?: string;
  testConfig: {
    projectName: string;
    avoidParentSuitesInCount?: boolean;
  }
}
