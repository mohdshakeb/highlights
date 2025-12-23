#!/bin/bash
# Remove macOS ._ files recursively from the current directory
find . -name "._*" -type f -delete
echo "Cleaned up macOS ._ files."
