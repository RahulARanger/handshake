#!/usr/bin/bash
# root directory is in root of this project
#
output="handshake-nodejs-reporters/packages/common-handshakes/.version"

if [ -f "$output" ] ; then
    rm "$output"
fi

echo "${ASSETS}" > $output