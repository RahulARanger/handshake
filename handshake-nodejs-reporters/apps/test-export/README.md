Hi, this project is to test the handshake-dashboard and its generated output.

we assume that some reports are generated and saved in the folder: '../../../TestReports', before running this tests. and once this test runs we host those files and then we connect with the database located at '../../../TestResults/TeStReSuLtS.db' to check if the info matches with reports.

## Setup

-   Download this repo.
-   move to ../../ and then perform `npm install` and `npm run sanity`
-   and then redirect to this project and then you can perform `npm install`
-   now you can run any feature files or simply: `npm run sanity`

Note: you can also test the latest run, if you are building the dashboard, you can create an env file and then add a variable, `port`. mostly you can make it to `3000`. This will point to the dev version.
