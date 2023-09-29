# Grasp-it

Utilizes the data collected from the test execution does some processing and then displays it in the Dashboard.

## Architecture

- we initiate the Grasp-it-dashboard
  - this step would be skipped if these below steps were done previously, Note: it would be not skipped if it finds a new version of the dashboard
  - Copy the dashboard from `src`
  - downloads all the required npm modules
  - creates a new `TeStReSuLtS.db`
- And then we start the framework
- Past that we collect all the Test suites, sessions, test cases, we name this routes under the prefix: "register"
- After the registration, we collect the details pertaining to the end result of the registered entity
- Now we make sure to fill the calculated cells in some records that were added, this is to save the time while generating the report.
- we export the results past the test completion, while this is an optional step, which could be configured at the plugin level, but it has to done at some point in order to generate a report.

## Plans

### Test Reports
- Adding Attachments
- Dynamic Report
- JIRA Reporter

### wdio-py-reporter
- Support Cucumber framework
- Dynamic Report

