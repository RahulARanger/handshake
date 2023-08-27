import { readFileSync } from "node:fs"
import { Key } from "webdriverio"
import { join } from "node:path"
import { browser, $, expect } from "@wdio/globals"





describe("Verifying the versions of the project's dependencies", async function () {
    /**
     * string[]
     */
    const _raw = JSON.parse(readFileSync(join(process.cwd(), "package.json")))
    const packages = _raw.dependencies;
    const dev_packages = _raw.devDependencies

    this.beforeAll(async () => {
        await browser.url("https://www.npmjs.com/")
        await expect(browser).toHaveTitle("npm");
    })

    async function verifyPackages(packages) {
        for (let _package in packages) {
            it("Search for the package", async function () {
                const searchBar = $("input[type=search]")
                expect(searchBar).toBeDisplayed();
                await searchBar.setValue(_package)
                await browser.keys([Key.Enter])
            })
            it("Should find a exactly matched package", async function () {
                const exactlyMatched = await $("#pkg-list-exact-match")
                const title = await exactlyMatched.previousElement()
                await expect(title).toHaveText(_package);
                await title.click();
            })

            it("Verifying if you have opened the detailed view of the package", async function () {
                const version = await $("h3=Version")
                await version.waitForDisplayed({ timeout: 10e3 });
                await expect(browser).toHaveUrl(`https://www.npmjs.com/package/${_package}`)
                await expect(browser).toHaveTitle(`${_package} - npm`)
            })
            it("Verifying the version of the package", async function () {
                const version = await $("h3=Version")
                const _version = (await version.nextElement()).$("p")
                await expect(_version).toHaveText(packages[_package].slice(1))
            })
        }
    }


    describe("Verifying the version of the required packages", async () => await verifyPackages(packages))
    describe("Verifying the version of the dev packages", async () => await verifyPackages(dev_packages))

    it.skip("This step is skipped", async () => {
        return "skipped"
    })

})