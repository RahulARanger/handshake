# wdio-graspit-reporter

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