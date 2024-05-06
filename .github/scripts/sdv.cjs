// save-dashboard-version.cjs

const fs = require("fs");
const { join } = require("path")

const file_name = ".version"
const outputs = [
    "handshake-nodejs-reporters/packages/common-handshakes",
    "handshake"
];

for (const output of outputs) {
    const output_file = join(output, file_name)
    // make sure the output_file already exists (at-least having empty object: {})
    
    const store = JSON.parse(fs.readFileSync(output_file));
    const built = JSON.parse(process.env.ASSETS ?? '{}')

    fs.writeFileSync(output_file, JSON.stringify({ ...store, ...built }))
    console.log(
        `Output file for ${output_file} generated as: ${JSON.parse(fs.readFileSync(output_file))}`
    )
}
