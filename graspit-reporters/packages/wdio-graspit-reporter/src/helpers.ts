import { relative } from 'node:path';
import type { Options } from '@wdio/types';
import { GraspItServiceOptions, ReporterOptions } from './types';
import GraspItService from './service';

export default function sanitizePaths(specs?: string[]): string[] {
  return (specs ?? []).map((spec) => relative(
    process.cwd(),
    spec.startsWith('file:///') ? decodeURI(spec.slice(8)) : spec,
  ));
}

export function attachReporter(
  config: Options.Testrunner,
  options: ReporterOptions & GraspItServiceOptions,
): Options.Testrunner {
  const port = options.port ?? 6969;

  const toModify = config;
  toModify.reporters?.push([
    'graspit', { port },
  ]);

  toModify.services?.push([
    GraspItService, {
      port,
      projectName: options.projectName,
      results: options.results,
      timeout: options.timeout,
      root: options.root,
      collectionName: options.collectionName,
    },
  ]);

  return toModify;
}
