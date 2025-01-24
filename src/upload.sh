#!/bin/bash

# GitHub repo details
USER="koodo-reader"
REPO="koodo-reader"


# Backblaze details
BUCKET="koodo-reader"
R2_ACCOUNT_ID=$1
R2_APPLICATION_KEY=$2
R2_ENDPOINT=$3



# Get the release details from GitHub API
RELEASE=$(curl --silent "https://api.github.com/repos/$USER/$REPO/releases/latest")

# Get the assets from the release
ASSETS=$(echo $RELEASE | jq -r '.assets[] | .browser_download_url')

# Get the tag name
TAG=$(echo $RELEASE | jq -r '.tag_name')

# Create a directory with the name of the tag
mkdir -p $TAG

# Download each asset
for ASSET in $ASSETS; do
    curl -L -o $TAG/$(basename $ASSET) $ASSET
done


wget https://dl.koodoreader.com/rclone
chmod +x ./rclone
./rclone config create r2 s3 provider "Cloudflare" env_auth "false" access_key_id $R2_ACCOUNT_ID secret_access_key $R2_APPLICATION_KEY region "auto" endpoint $R2_ENDPOINT

./rclone copy $TAG r2:$BUCKET/$TAG --ignore-existing


# 获取文件列表
file_list=$(./rclone lsl r2:$BUCKET/$TAG)

# 创建一个新的HTML文件
html_file="file_list.html"
echo "<html><body><table>" > $html_file

# 添加表头
echo "<tr><th style='text-align:left'>File Name</th><th style='width:150px;text-align:left'>File size</th><th style='width:150px;text-align:left'>Last Modified</th></tr>" >> $html_file

# 遍历文件列表
echo "$file_list" | while read line; do
    # 获取文件名、文件类型和最后修改时间
    file_name=$(echo $line | awk '{print $4}')
    file_size=$(echo $line | awk '{print $1}')
    last_modified=$(echo $line | awk '{print $2}')

    # 添加到HTML文件
    echo "<tr><td><a href="./$TAG/$file_name">$(echo "$file_name" | sed 's/.*\///')</a></td><td style='width:100px'>$(($((file_size)) / 1024 / 1024)) MB</td><td style='width:100px'>$last_modified</td></tr>" >> $html_file
done

# 结束HTML文件
echo "</table></body></html>" >> $html_file

mv file_list.html $TAG.html
./rclone copy $TAG.html r2:$BUCKET
./rclone copyto $TAG.html r2:$BUCKET/latest.html

