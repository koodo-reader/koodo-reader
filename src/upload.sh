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

html_file="file_list.html"

# 创建HTML文件并添加响应式布局
cat <<EOF > $html_file
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* 基础样式 */
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            word-wrap: break-word;
        }
        .table-container {
            width: 100%;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px; /* 保持桌面端表格完整性 */
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        
        /* 移动端适配 */
        @media screen and (max-width: 768px) {
            body {
                margin: 10px;
            }
            th, td {
                padding: 8px;
                font-size: 1rem;
            }
            th:nth-child(3), td:nth-child(3) {
                display: none; /* 在小屏幕上隐藏最后修改时间列 */
            }
        }
    </style>
</head>
<body>
<h2>Koodo Reader Release</h2>
<div class="table-container">
    <table>
        <tr>
            <th>File Name</th>
            <th>File Size</th>
            <th>Last Modified</th>
        </tr>
EOF

# 遍历文件列表
echo "$file_list" | while read line; do
    file_name=$(echo $line | awk '{print $4}')
    file_size=$(echo $line | awk '{print $1}')
    last_modified=$(echo $line | awk '{print $2}')

    # 转换文件大小为更友好的格式
    size_mb=$((file_size / 1024 / 1024))
    if [ $size_mb -eq 0 ]; then
        formatted_size="$((file_size / 1024)) KB"
    else
        formatted_size="${size_mb} MB"
    fi

    cat <<EOF >> $html_file
        <tr>
            <td><a href="./$TAG/$file_name">${file_name##*/}</a></td>
            <td>${formatted_size}</td>
            <td>${last_modified}</td>
        </tr>
EOF
done

# 结束HTML文件
cat <<EOF >> $html_file
    </table>
</div>
</body>
</html>
EOF

mv file_list.html $TAG.html
# ./rclone copy $TAG.html r2:$BUCKET
./rclone copyto $TAG.html r2:$BUCKET/latest.html

