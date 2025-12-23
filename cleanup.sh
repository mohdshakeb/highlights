#!/bin/bash

# Cleanup script for Highlight extension
# Removes macOS metadata files (._* files) from the project

echo "🧹 Cleaning up macOS metadata files..."

# Change to the project root
cd "$(dirname "$0")"

# Count files before deletion
COUNT=$(find . -name "._*" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Found $COUNT macOS metadata files"

# Remove all ._* files from the project
find . -name "._*" -type f -delete 2>/dev/null

# Also clean up from node_modules if they somehow got in there
# (exclude node_modules from the count since that's expected)

echo "✅ Cleanup complete!"
echo ""
echo "Tip: Add '._*' to your .gitignore to prevent these files from being tracked."
