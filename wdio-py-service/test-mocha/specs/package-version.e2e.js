import { readFileSync } from "node:fs"
import { Key } from "webdriverio"
import { join } from "node:path"

describe("Verifying if our packages are up to date", async function () {
    /**
     * string[]
     */
    const packages = JSON.parse(readFileSync(join(process.cwd(), "package.json"))).dependencies;

    it("Redirecting to the npm website", async function () {
        await browser.url("https://www.npmjs.com/")
    })

    it("Search for the package", async function () {
        const searchBar = $("input[type=search]")
        expect(searchBar).toBeDisplayed();
        await searchBar.setValue(Object.keys(packages)[0])
        await browser.keys([Key.Enter])
    })

    it.skip("This step is skipped", async () => {
        return "skipped"
    })


    // Object.keys(packages).map(
    //     it("Waiting for the test case", async (pack) => {
    //         const searchBar = $("input[type=search]")
    //         await expect(searchBar).toBeDisplayed();
    //         await searchBar.setValue(pack);
    //         await browser.keys([Key.Enter]);
    //     })
    // )
})