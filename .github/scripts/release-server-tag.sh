#!/usr/bin/bash
# root directory is in root of this project
#
output="graspit-reporters/packages/graspit-commons/.version"

if [ -f "$output" ] ; then
    rm "$output"
fi

echo "${ASSETS}" > $output