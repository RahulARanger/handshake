import { readFileSync } from "node:fs"
import { Key } from "webdriverio"
import { join } from "node:path"
import { browser, $, expect } from "@wdio/globals"
import { addDescription, addLink } from "@hand-shakes/wdio-handshake-reporter"

describe("Verifying the versions of the project's dependencies", async function () {
    /**
     * string[]
     */
    const _raw = JSON.parse(readFileSync(join(process.cwd(), "package.json")))
    const packages = _raw.dependencies;
    const dev_packages = _raw.devDependencies

    async function verifyPackages(packages) {
        it("move to search site", async () => {
            await browser.url("https://duckduckgo.com/");
            await expect(browser).toHaveTitle(expect.stringMatching("^DuckDuckGo.*"));
        });

        for (let _package in packages) {
            const searchQuery = `${_package} - npm`;

            it(`Search for the package: ${_package}`, async function () {
                await addDescription("Verifying the presence of the searchbar");
                const searchBar = $("input[name=q]")
                expect(searchBar).toBeDisplayed();
                await searchBar.setValue(searchQuery)
                await browser.keys([Key.Enter])
            });
            it("we should see npm link on top", async () => {
                const first_found = $("a[data-testid=result-title-a]");
                const link = `https://www.npmjs.com/package/${_package}`;
                await addLink(link, "npm link");
                await expect(first_found).toHaveHref(link);
                await expect(first_found).toHaveText(searchQuery);
            });
        }
    }


    describe("Verifying the version of the required packages", async () => await verifyPackages(packages))
    describe("Verifying the version of the dev packages", async () => await verifyPackages(dev_packages))

    it.skip("This step is skipped", async () => {
        await addDescription("This step should skip")
        return "skipped"
    })

})