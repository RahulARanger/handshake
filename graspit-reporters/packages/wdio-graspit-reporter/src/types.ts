export interface ReporterOptions {
  port: number;
  addScreenshots?:boolean;
  lockTimeout?:number;
}
export interface GraspItServiceOptions {
  port: number;
  root: string;
  exePath?:string;
  collectionName: string;
  timeout?: number;
  export?: {
    out?: string;
    maxTestRuns: number;
    isDynamic?: boolean;
    skipPatch?: boolean;
  }
  testConfig: {
    projectName: string;
    avoidParentSuitesInCount?: boolean;
  }
}
