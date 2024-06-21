export interface RegisterSession {
  retried: number;
  started: Date;
}

export type SuiteType = 'SUITE' | 'TEST';
export type Standing = 'PASSED' | 'FAILED' | 'SKIPPED' | 'PENDING' | 'YET_TO_CALC';

interface Tag {
  name: string;
  label: string;
}

export interface RegisterTestEntity {
  title: string;
  description: string;
  file: string;
  tags: Tag[];
  started: Date;
  suiteType: SuiteType;
  session_id: string;
  retried: number;
}

export interface MarkTestEntity {
  duration: number;
  suiteID: string;
  errors: Error[];
  standing: Standing;
  ended: Date;
}

export interface MarkTestSession {
  ended: Date;
  duration: number;
  sessionID: string;
  passed: number;
  failed: number;
  skipped: number;
  hooks: number;
  tests: number;
  entityName: string;
  entityVersion: string;
  simplified: string;
}

export interface UpdateTestRunConfig {
  maxInstances?:number;
  framework:string;
  platformName: string;
  exitCode:number;
  fileRetries:number;
  bail?: number;
  avoidParentSuitesInCount: boolean;
  tags: Tag[];
}

export interface Assertion {
  expected: any;
  passed?:boolean;
  wait?:number;
  interval?:number;
  message: string;
}

export interface Attachment {
  entityID: string;
  title?: string;
  description?:string;
  value:string | Assertion;
  type: 'DESC' | 'LINK' | 'PNG' | 'ASSERT'
}

export interface UpdateTestRun {
  started: Date;
}
