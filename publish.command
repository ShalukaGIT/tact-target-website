#!/bin/bash
cd "$(dirname "$0")"
echo "--- Tact Target Website Publisher ---"
echo "Pulling latest files..."
git pull
echo "Adding updated files..."
git add .
echo "Committing updates..."
git commit -m "Update site content"
echo "Pushing updates to GitHub..."
git push
echo "Site updated successfully!"
read -p "Press Enter to close..."
