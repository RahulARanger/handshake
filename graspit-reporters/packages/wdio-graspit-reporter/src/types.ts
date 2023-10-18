export interface ReporterOptions {
  port: number;
  addScreenshots?:boolean;
}
export interface GraspItServiceOptions {
  port: number;
  root: string;
  collectionName: string;
  timeout?: number;
  projectName: string;
  export?: {
    out: string;
    maxTestRuns: number;
    isDynamic?: boolean;
    skipPatch?: boolean;
  }
}
