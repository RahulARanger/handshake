// save-dashboard-version.cjs

const fs = require("fs");

const output = "handshake-nodejs-reporters/packages/common-handshakes/.version";

const store = JSON.parse(fs.readFileSync(output));
const built = JSON.parse(process.env.ASSETS ?? '{}')

fs.writeFileSync(output, JSON.stringify({...store, ...built}))
console.log(JSON.parse(fs.readFileSync(output)))
