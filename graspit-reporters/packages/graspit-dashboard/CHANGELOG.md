# graspit

## 3.1.4

### Patch Changes

- fix: query for fetching related runs, sorted it

## 3.1.3

### Patch Changes

- support server-build 0.12.4

## 3.1.2

### Patch Changes

- support server patch for exporting results

## 3.1.1

### Patch Changes

- bump package version

## 3.1.0

### Minor Changes

- test e2e

## 3.0.6

### Patch Changes

- planned tests for graspit installation

## 3.0.5

### Patch Changes

- fix the way we would name the downloaded executable for windows

## 3.0.4

### Patch Changes

- take 4 for package installation

## 3.0.3

### Patch Changes

- take 3 for installation test

## 3.0.2

### Patch Changes

- Minor Patch for pre-build installation

## 3.0.1

### Patch Changes

- ignoring the build

## 3.0.0

### Major Changes

- working on the release

## 2.2.2

### Patch Changes

- replaced the sv icons with the png ones

## 2.2.1

### Patch Changes

- updated dependant packages, skipping mark session if the session id is undefined which would happen if a spec file was missed [observed in webdriverio]

## 2.2.0

### Minor Changes

- renamed browser to entity in the sessionbase, made changes to replicate the same on UI side and we have moved sending the details reg. session from register to mark in webdriverio

## 2.1.0

### Minor Changes

- Registering a test case which was skipped expliclity, minor improvements for the dashboard

## 2.0.1

### Patch Changes

- Added cross env way of activating venv created

## 2.0.0

### Major Changes

- Added Export Command for the graspit dashboard now we do not lint the export files at the time of export and also do not generate the css file on production, this can save some time for report generation.

## 1.1.0

### Minor Changes

- Improved the Import paths and types for the reporter for webdriverio

## 1.0.0

### Major Changes

- Merged tsconfig with graspit-commons and moved certain methods to graspit commons so we can avoid replicating few things for creating a nodejs based plugins
