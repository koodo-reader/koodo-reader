export const driveList = [
  {
    label: "WebDAV",
    value: "webdav",
    icon: "icon-webdav",
    isPro: false,
    support: ["desktop", "phone"],
  },

  {
    label: "Dropbox",
    value: "dropbox",
    icon: "icon-dropbox",
    isPro: true,
    support: ["desktop", "browser", "phone"],
  },
  {
    label: "OneDrive",
    value: "microsoft",
    icon: "icon-onedrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
  },
  {
    label: "Google Drive",
    value: "google",
    icon: "icon-googledrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
  },
  {
    label: "Mega",
    value: "mega",
    icon: "icon-mega",
    isPro: true,
    support: ["desktop", "browser"],
  },
  {
    label: "Box",
    value: "boxnet",
    icon: "icon-box",
    isPro: true,
    support: ["desktop", "browser", "phone"],
  },
  {
    label: "阿里云盘",
    value: "adrive",
    icon: "icon-adrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
  },
  {
    label: "S3 Compatible",
    value: "s3compatible",
    icon: "icon-s3compatible",
    isPro: true,
    support: ["desktop", "browser", "phone"],
  },
  {
    label: "FTP",
    value: "ftp",
    icon: "icon-ftp",
    isPro: false,
    support: ["desktop"],
  },
  {
    label: "SFTP",
    value: "sftp",
    icon: "icon-sftp",
    isPro: false,
    support: ["desktop"],
  },
];
interface ConfigItem {
  label: string;
  value: string;
  type: string;
}

// Type the driveInputConfig
interface DriveInputConfig {
  [key: string]: ConfigItem[];
}
export const driveInputConfig: DriveInputConfig = {
  webdav: [
    {
      label: "Server address",
      value: "url",
      type: "text",
    },
    {
      label: "Server path",
      value: "dir",
      type: "text",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
    },
  ],
  mega: [
    {
      label: "Email",
      value: "email",
      type: "text",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
    },
    {
      label: "Path",
      value: "path",
      type: "text",
    },
  ],
  box: [
    {
      label: "Token",
      value: "token",
      type: "text",
    },
  ],
  ftp: [
    {
      label: "Server address",
      value: "url",
      type: "text",
    },
    {
      label: "Server port",
      value: "port",
      type: "text",
    },
    {
      label: "Server path",
      value: "dir",
      type: "text",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
    },
    {
      label: "Use SSL, 1 for use, 0 for not use",
      value: "ssl",
      type: "text",
    },
  ],
  sftp: [
    {
      label: "Server address",
      value: "url",
      type: "text",
    },
    {
      label: "Server port",
      value: "port",
      type: "text",
    },
    {
      label: "Server Path",
      value: "dir",
      type: "text",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
    },
  ],
  s3compatible: [
    {
      label: "Endpoint",
      value: "endpoint",
      type: "text",
    },
    {
      label: "Region",
      value: "region",
      type: "text",
    },
    {
      label: "BucketName",
      value: "bucketName",
      type: "text",
    },
    {
      label: "Path",
      value: "dir",
      type: "text",
    },
    {
      label: "AccessKeyId",
      value: "accessKeyId",
      type: "text",
    },
    {
      label: "SecretAccessKey",
      value: "secretAccessKey",
      type: "text",
    },
  ],
  google: [
    {
      label: "Token",
      value: "token",
      type: "text",
    },
  ],
  microsoft: [
    {
      label: "Token",
      value: "token",
      type: "text",
    },
  ],
  dropbox: [
    {
      label: "Token",
      value: "code",
      type: "text",
    },
  ],
};
