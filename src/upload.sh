#!/bin/bash

# GitHub repo details
USER="koodo-reader"
REPO="koodo-reader"
TAG="v1.5.1"

# Backblaze details
BUCKET="koodo-reader"
B2_ACCOUNT_ID=$1
B2_APPLICATION_KEY=$2


# Create a directory with the name of the tag
mkdir -p $TAG

# Get the release details from GitHub API
RELEASE=$(curl --silent "https://api.github.com/repos/$USER/$REPO/releases/tags/$TAG")

# Get the assets from the release
ASSETS=$(echo $RELEASE | jq -r '.assets[] | .browser_download_url')

# Download each asset
for ASSET in $ASSETS; do
    curl -L -o $TAG/$(basename $ASSET) $ASSET
done

# Install B2 CLI
wget https://github.com/Backblaze/B2_Command_Line_Tool/releases/latest/download/b2-linux
mv b2-linux b2
chmod +x ./b2
./b2 authorize-account $B2_ACCOUNT_ID $B2_APPLICATION_KEY

# Upload the directory to Backblaze
./b2 sync --replaceNewer $TAG b2://$BUCKET/$TAG