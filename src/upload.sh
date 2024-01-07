#!/bin/bash

# GitHub repo details
USER="koodo-reader"
REPO="koodo-reader"
TAG="v1.5.9"

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

# 获取文件列表
file_list=$(./b2 ls --long "$BUCKET" | grep -oE '^.*/$')

# 创建一个新的HTML文件
html_file="file_list.html"
echo "<html><body><table>" > $html_file

# 添加表头
echo "<tr><th>File Name</th><th>File Size</th><th>Last Modified</th></tr>" >> $html_file

# 遍历文件列表
echo "$file_list" | while read line; do
    # 获取文件名、文件类型和最后修改时间
    file_name=$(echo $line | awk '{print $6}')
    file_size=$(echo $line | awk '{print $5}')
    last_modified=$(echo $line | awk '{print $3}')

    # 添加到HTML文件
    echo "<tr><td><a href="./$(echo "$file_name" | sed 's/\///g').html">$(echo "$file_name" | sed 's/\///g')</a></td><td>$file_size</td><td>$last_modified</td></tr>" >> $html_file
done

# 结束HTML文件
echo "</table></body></html>" >> $html_file

./b2 upload-file $BUCKET file_list.html index.html

# 获取文件列表
file_list=$(./b2 ls --long "$BUCKET" "$TAG")

# 创建一个新的HTML文件
html_file="file_list.html"
echo "<html><body><table>" > $html_file

# 添加表头
echo "<tr><th style='text-align:left'>File Name</th><th style='width:100px;text-align:left'>File Size</th><th style='width:100px;text-align:left'>Last Modified</th></tr>" >> $html_file

# 遍历文件列表
echo "$file_list" | while read line; do
    # 获取文件名、文件类型和最后修改时间
    file_name=$(echo $line | awk '{print $6}')
    file_size=$(echo $line | awk '{print $5}')
    last_modified=$(echo $line | awk '{print $3}')

    # 添加到HTML文件
    echo "<tr><td><a href="./$file_name">$(echo "$file_name" | sed 's/.*\///')</a></td><td style='width:100px'>$(($((file_size)) / 1024 / 1024)) MB</td><td style='width:100px'>$last_modified</td></tr>" >> $html_file
done

# 结束HTML文件
echo "</table></body></html>" >> $html_file

./b2 upload-file $BUCKET file_list.html $TAG.html

