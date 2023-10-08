# wdio-graspit-reporter

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
