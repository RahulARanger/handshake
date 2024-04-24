const {
    describe, test, expect, beforeAll,
  } = require('@jest/globals');
const { existsSync, rmSync } = require('fs');
const { join, dirname } = require('path');
const spawnInstallation = require("../utils/installation-script").default


describe("Installing the dashboard built", () => {
    const target = join(dirname(__dirname), "dashboard.tar.bz2");

    beforeAll(async () => {
        if(existsSync(target)) rmSync(target);
        expect(existsSync(target)).toBe(false);
        await spawnInstallation()
    })

    test("expect the presence of the dashboard build", () => {
        expect(existsSync(target)).toBe(true);
    })
})