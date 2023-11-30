# wdio-graspit-reporter

## 3.4.3

### Patch Changes

- graspit-commons@3.4.3

## 3.4.2

### Patch Changes

- graspit-commons@3.4.2

## 3.4.1

### Patch Changes

- graspit-commons@3.4.1

## 3.4.0

### Patch Changes

- graspit-commons@3.4.0

## 3.3.1

### Patch Changes

- graspit-commons@3.3.1

## 3.3.0

### Minor Changes

- feat: migrated to echarts

### Patch Changes

- Updated dependencies
  - graspit-commons@3.3.0

## 3.2.0

### Minor Changes

- added support for links and assertions

### Patch Changes

- Updated dependencies
  - graspit-commons@3.2.0

## 3.1.6

### Patch Changes

- handled permission and attached links
- Updated dependencies
  - graspit-commons@3.1.6

## 2.1.18

### Patch Changes

- graspit-commons@2.1.18

## 2.1.17

### Patch Changes

- graspit-commons@2.1.17

## 2.1.16

### Patch Changes

- support server-build 0.12.4
- Updated dependencies
  - graspit-commons@2.1.16

## 2.1.15

### Patch Changes

- support server patch for exporting results
- Updated dependencies
  - graspit-commons@2.1.15

## 2.1.14

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.14

## 2.1.13

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.13

## 2.1.12

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.12

## 2.1.11

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.11

## 2.1.10

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.10

## 2.1.9

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.9

## 2.1.8

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.8

## 2.1.7

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.7

## 2.1.6

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.6

## 2.1.5

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.5

## 2.1.4

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.4

## 2.1.3

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.3

## 2.1.2

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.2

## 2.1.1

### Patch Changes

- bump package version
- Updated dependencies
  - graspit-commons@2.1.1

## 2.1.0

### Minor Changes

- test e2e

### Patch Changes

- Updated dependencies
  - graspit-commons@2.1.0

## 2.0.0

### Major Changes

- working on the release to include the binary

## 1.5.0

### Patch Changes

- a526144: Revamped wdio-graspit-reporter, reusing the helper function from graspit-commons
- Updated dependencies [a526144]
- Updated dependencies [e02741a]
  - graspit-commons@1.5.0

## 1.4.3

### Patch Changes

- 0fb98cf: Moved some of the common methods from wdio-graspit-reporter to graspit-commons, add tests for graspit-commons and planned a custom report for jest.
- Updated dependencies [0fb98cf]
  - graspit-commons@1.4.3

## 1.4.2

### Patch Changes

- Updated dependant packages

## 1.4.1

### Patch Changes

- updated dependant packages, skipping mark session if the session id is undefined which would happen if a spec file was missed [observed in webdriverio]
- Updated dependencies
  - graspit-commons@1.4.1

## 1.4.0

### Minor Changes

- renamed browser to entity in the sessionbase, made changes to replicate the same on UI side and we have moved sending the details reg. session from register to mark in webdriverio

### Patch Changes

- Updated dependencies
  - graspit@2.2.0
  - graspit-commons@1.4.0

## 1.3.0

### Minor Changes

- Registering a test case which was skipped expliclity, minor improvements for the dashboard

### Patch Changes

- Updated dependencies
  - graspit@2.1.0
  - graspit-commons@1.3.2

## 1.2.1

### Patch Changes

- Added cross env way of activating venv created
- Updated dependencies
  - graspit-commons@1.3.0
  - graspit@2.0.1

## 1.2.0

### Minor Changes

- Added Export Command for the graspit dashboard now we do not lint the export files at the time of export and also do not generate the css file on production, this can save some time for report generation.

### Patch Changes

- Updated dependencies
  - graspit@2.0.0
  - graspit-commons@1.2.0

## 1.1.0

### Minor Changes

- Improved the Import paths and types for the reporter for webdriverio

### Patch Changes

- Updated dependencies
  - graspit@1.1.0
  - graspit-commons@1.1.0

## 1.0.0

### Major Changes

- 0dcd2be: Marking these packages as public ones, we initally had written this package in js but now it is converted to the ts
- Merged tsconfig with graspit-commons and moved certain methods to graspit commons so we can avoid replicating few things for creating a nodejs based plugins

### Patch Changes

- Updated dependencies
  - graspit-commons@1.0.0
  - graspit@1.0.0

## 0.1.0

### Minor Changes

- Merged the service and reporter and it is now production ready
