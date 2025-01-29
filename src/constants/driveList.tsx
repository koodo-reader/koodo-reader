export const driveList = [
  {
    label: "Local",
    value: "local",
  },
  {
    label: "WebDAV",
    value: "webdav",
  },

  {
    label: "FTP",
    value: "ftp",
  },
  {
    label: "SFTP",
    value: "sftp",
  },
  {
    label: "S3 Compatible (Pro)",
    value: "s3compatible",
  },
  {
    label: "Dropbox (Pro)",
    value: "dropbox",
    isPro: true,
  },
  {
    label: "OneDrive (Pro)",
    value: "microsoft",
    isPro: true,
  },
  {
    label: "Google Drive (Pro)",
    value: "google",
    isPro: true,
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
      value: "path",
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
      value: "path",
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
      value: "path",
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
      label: "Server Path",
      value: "path",
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
