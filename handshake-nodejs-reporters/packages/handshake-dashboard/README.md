# Handshake Dashboard

This is a part of or mono-repo, unlike rest of the packages, this would help us in generating the dashboard, once build we would export it along with the handshake package (through pypi)

## Getting Started

-   Clone this repo.
-   Open this folder as root directory
-   Execute these commands:
    -   `npm install`
    -   you might see some version related issues, resolve them and try again.

*   If you want to open the storybook: `npm run storybook`
    If you want to spin dev server: `npm run dev`

*   you want want to consider adding a `.env.development` file which would look like this:

```.env .env.development
DB_PATH=../../../TestResults/TeStReSuLtS.db
ANALYZE=false
```

DB_PATH would tell you where to look for the exported json files (it looks for the `Import` folder inside the TestResults folder)

## Generating Samples

-   Run the tests of the `test-wdio-cucumber` and `test-wdio-mocha` or any in `test-*`.
-   make sure to run `npm run test` if you want results in the **TestResults** directory else `npm run sanity` if in **SanityResults**
-   Once done, you can work with the dev server.
-   for the storybook it depends on the test-data file located inside the Helpers folder.
-

## Generating Export

-   For generating the export, you can use this command: `npm run export`
-   and you can see the `.html` files generated inside of the `handshake/dashboard` (.py package)

## Testing the Export

-   This would require our handshake (python package) build in your local.
-   Follow this [instructions]() for that.
-   Once done, execute this `handshake patch TestResults --out TestReports`
-   you can see the static reports inside the `TestReports`
-   you can execute this command here, `npm run display`

## Note:

-   Please do not upgrade eslint packages, because all such would be major from now on, to support the flat configuration of eslint v9 which was released on April 8th, 2024.
    -   Let all of the dependents complete their transition and I would quickly migrate to eslint v9.
