#!/usr/bin/bash
# root directory is in root of this project

file=$(<"pyproject.toml");


output=$(echo "$file" | grep -Po "version = \"(.*)\"" | grep -Po "([0-9\.]*)" | xargs)
echo "VERSION=$output" >> "$GITHUB_OUTPUT"

