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


    const _its = Object.keys(packages).map(async (pack) => {
        const searchBar = $("input[type=search]")
        await expect(searchBar).toBeDisplayed();
        await searchBar.setValue(pack);
        await browser.keys([Key.Enter]);
    })

    _its.map(_func => it(_func));
})