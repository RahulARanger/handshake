# graspit-commons

## 2.1.18

### Patch Changes

- Updated dependencies
  - graspit@3.1.5

## 2.1.17

### Patch Changes

- Updated dependencies
  - graspit@3.1.4

## 2.1.16

### Patch Changes

- support server-build 0.12.4
- Updated dependencies
  - graspit@3.1.3

## 2.1.15

### Patch Changes

- support server patch for exporting results
- Updated dependencies
  - graspit@3.1.2

## 2.1.14

### Patch Changes

- patched required things

## 2.1.13

### Patch Changes

- script for feeding exe args

## 2.1.12

### Patch Changes

- edit for the feed.cjs

## 2.1.11

### Patch Changes

- added feeder script for the exe file

## 2.1.10

### Patch Changes

- fix: test items

## 2.1.9

### Patch Changes

- fix: relative path in preinstall script

## 2.1.8

### Patch Changes

- fix the script for preinstall

## 2.1.7

### Patch Changes

- fix the path for preinstall script

## 2.1.6

### Patch Changes

- removed files part

## 2.1.5

### Patch Changes

- fix files

## 2.1.4

### Patch Changes

- preinstall -> postinstallation of build

## 2.1.3

### Patch Changes

- download file path

## 2.1.2

### Patch Changes

- fix installatiom

## 2.1.1

### Patch Changes

- bump package version
- Updated dependencies
  - graspit@3.1.1

## 2.1.0

### Minor Changes

- test e2e

### Patch Changes

- Updated dependencies
  - graspit@3.1.0

## 1.5.0

### Minor Changes

- e02741a: added some helper functions for registering and marking session or test entity

### Patch Changes

- a526144: Revamped wdio-graspit-reporter, reusing the helper function from graspit-commons

## 1.4.3

### Patch Changes

- 0fb98cf: Moved some of the common methods from wdio-graspit-reporter to graspit-commons, add tests for graspit-commons and planned a custom report for jest.

## 1.4.1

### Patch Changes

- updated dependant packages, skipping mark session if the session id is undefined which would happen if a spec file was missed [observed in webdriverio]

## 1.4.0

### Minor Changes

- renamed browser to entity in the sessionbase, made changes to replicate the same on UI side and we have moved sending the details reg. session from register to mark in webdriverio

### Patch Changes

- Updated dependencies
  - graspit@2.2.0

## 1.3.2

### Patch Changes

- Registering a test case which was skipped expliclity, minor improvements for the dashboard
- Updated dependencies
  - graspit@2.1.0

## 1.3.1

### Patch Changes

- e6055a0: Revert the line in package.json for graspit package

## 1.3.0

### Minor Changes

- Added cross env way of activating venv created

### Patch Changes

- Updated dependencies
  - graspit@2.0.1

## 1.2.0

### Minor Changes

- Added Export Command for the graspit dashboard now we do not lint the export files at the time of export and also do not generate the css file on production, this can save some time for report generation.

### Patch Changes

- Updated dependencies
  - graspit@2.0.0

## 1.1.0

### Minor Changes

- Improved the Import paths and types for the reporter for webdriverio

### Patch Changes

- Updated dependencies
  - graspit@1.1.0

## 1.0.0

### Major Changes

- Merged tsconfig with graspit-commons and moved certain methods to graspit commons so we can avoid replicating few things for creating a nodejs based plugins

### Patch Changes

- Updated dependencies
  - graspit@1.0.0
