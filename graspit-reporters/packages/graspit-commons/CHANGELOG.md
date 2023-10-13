# graspit-commons

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
