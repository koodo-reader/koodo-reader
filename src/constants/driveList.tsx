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
    label: "S3 Compatible",
    value: "s3compatible",
  },
  {
    label: "Dropbox",
    value: "dropbox",
    isPro: true,
  },
  {
    label: "OneDrive",
    value: "microsoft",
    isPro: true,
  },
  {
    label: "Google Drive",
    value: "google",
    isPro: true,
  },
];
export const driveInputConfig = {
  webdav: [
    {
      label: "Server address",
      value: "url",
      type: "text",
      placeholder: "https://example.com",
    },
    {
      label: "Path",
      value: "path",
      type: "text",
      placeholder: "/path/to/folder",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      placeholder: "username",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      placeholder: "password",
    },
  ],
  ftp: [
    {
      label: "Server address",
      value: "url",
      type: "text",
      placeholder: "ftp://example.com",
    },
    {
      label: "Server port",
      value: "port",
      type: "text",
      placeholder: "21",
    },
    {
      label: "Server Path",
      value: "path",
      type: "text",
      placeholder: "/path/to/folder",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      placeholder: "username",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      placeholder: "password",
    },
  ],
  sftp: [
    {
      label: "Server address",
      value: "url",
      type: "text",
      placeholder: "sftp://example.com",
    },
    {
      label: "Server port",
      value: "port",
      type: "text",
      placeholder: "22",
    },
    {
      label: "Server Path",
      value: "path",
      type: "text",
      placeholder: "/path/to/folder",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      placeholder: "username",
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      placeholder: "password",
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
