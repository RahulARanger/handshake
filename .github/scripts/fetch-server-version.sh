#!/usr/bin/bash
# root directory is in root of this project

file=$(<"handshake/__init__.py");


output=$(echo "$file" | grep -Po "__version__ = \"(.*)\"" | grep -Po "([0-9\.]*)" | xargs)
echo "VERSION=$output" >> "$GITHUB_OUTPUT"

