#!/usr/bin/bash
# root directory is in root of this project

file=$(<"pyproject.toml");
output="graspit-reporters/packages/graspit-dashboard/.version"

if [ -f "$output" ] ; then
    rm "$output"
fi

echo "$file" | grep -Po "version = \"(.*)\"" | grep -Po "([0-9\.]*)" | xargs >> $output

store=$(head -n 1 $output)
echo "VERSION=$store" >> "$GITHUB_OUTPUT"

