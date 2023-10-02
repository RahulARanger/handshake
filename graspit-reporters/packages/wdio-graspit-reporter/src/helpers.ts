import { relative } from 'node:path';
import type { Options } from '@wdio/types';
import superagent from 'superagent';
import { AfterCommandArgs, BeforeCommandArgs } from '@wdio/reporter';
import { GraspItServiceOptions, ReporterOptions } from './types';
import GraspItService from './service';
import ReporterContacts from './contacts';

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

  toModify.reporters = toModify.reporters || [];
  toModify.services = toModify.services || [];

  toModify.reporters?.push([
    'graspit',
    {
      port,
      addScreenshots: options.addScreenshots || false,
    },
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

// Thanks to https://github.com/webdriverio/webdriverio/blob/e83d38b292cc2aa4bede7e026ab2f9419a7c9d42/packages/wdio-browserstack-service/src/util.ts#L829
export function isScreenShot(args: BeforeCommandArgs | AfterCommandArgs): boolean {
  return (args.endpoint && args.endpoint.includes('/screenshot')) || false;
}

export async function attachScreenshot(title: string, content: string, entity_id: string) {
  await superagent.post(
    ReporterContacts.addAttachmentForEntity,
  ).send({
    description: title, value: content, type: 'PNG', entityID: entity_id,
  });
}
