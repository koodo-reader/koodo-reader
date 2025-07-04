export const driveList = [
  {
    label: "WebDAV",
    value: "webdav",
    icon: "icon-webdav",
    isPro: false,
    support: ["desktop", "browser", "phone"],
    scoped: false,
    isCNAvailable: true,
  },
  {
    label: "Dropbox",
    value: "dropbox",
    icon: "icon-dropbox",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: true,
    isCNAvailable: false,
  },
  {
    label: "OneDrive",
    value: "microsoft",
    icon: "icon-onedrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: true,
    isCNAvailable: true,
  },
  {
    label: "Google Drive",
    value: "google",
    icon: "icon-googledrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: true,
    isCNAvailable: false,
  },
  {
    label: "MEGA",
    value: "mega",
    icon: "icon-mega",
    isPro: true,
    support: ["desktop", "browser"],
    scoped: false,
    isCNAvailable: false,
  },
  {
    label: "Box",
    value: "boxnet",
    icon: "icon-box",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: false,
    isCNAvailable: false,
  },
  {
    label: "pCloud",
    value: "pcloud",
    icon: "icon-pcloud",
    isPro: true,
    support: ["desktop", "phone"],
    scoped: true,
    isCNAvailable: false,
  },
  {
    label: "Aliyun Drive",
    value: "adrive",
    icon: "icon-adrive",
    isPro: true,
    support: ["desktop", "phone"],
    scoped: false,
    isCNAvailable: true,
  },
  {
    label: "OneDrive (Experimental)",
    value: "microsoft_exp",
    icon: "icon-onedrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: false,
    isCNAvailable: true,
  },
  {
    label: "Google Drive (Experimental)",
    value: "google_exp",
    icon: "icon-googledrive",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: false,
    isCNAvailable: false,
  },
  {
    label: "S3 Compatible",
    value: "s3compatible",
    icon: "icon-s3compatible",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: false,
    isCNAvailable: true,
  },
  {
    label: "Docker",
    value: "docker",
    icon: "icon-docker",
    isPro: true,
    support: ["desktop", "browser", "phone"],
    scoped: true,
    isCNAvailable: true,
  },
  {
    label: "FTP",
    value: "ftp",
    icon: "icon-ftp",
    isPro: false,
    support: ["desktop"],
    scoped: false,
    isCNAvailable: true,
  },
  {
    label: "SFTP",
    value: "sftp",
    icon: "icon-sftp",
    isPro: false,
    support: ["desktop"],
    scoped: false,
    isCNAvailable: true,
  },
];
interface ConfigItem {
  label: string;
  value: string;
  type: string;
  required?: boolean;
  example?: string;
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
      required: true,
      example: "https://example.com/dav",
    },
    {
      label: "Server path (Please first create this folder manually)",
      value: "dir",
      type: "text",
      required: true,
      example: "KoodoReader",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      required: true,
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      required: true,
    },
  ],
  docker: [
    {
      label: "Server address",
      value: "url",
      type: "text",
      required: true,
      example: "http://192.168.28.14:8080",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      required: true,
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      required: true,
    },
  ],
  mega: [
    {
      label: "Email",
      value: "email",
      type: "text",
      required: true,
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      required: true,
    },
  ],
  boxnet: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  ftp: [
    {
      label: "Server address",
      value: "url",
      type: "text",
      required: true,
      example: "192.168.28.173",
    },
    {
      label: "Server port",
      value: "port",
      type: "text",
      required: true,
      example: "21",
    },
    {
      label: "Server path",
      value: "dir",
      type: "text",
      required: false,
      example: "KoodoReader",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      required: true,
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      required: true,
    },
    {
      label: "Use SSL, 1 for use, 0 for not use",
      value: "ssl",
      type: "text",
      required: true,
    },
  ],
  sftp: [
    {
      label: "Server address",
      value: "url",
      type: "text",
      required: true,
      example: "192.168.28.173",
    },
    {
      label: "Server port",
      value: "port",
      type: "text",
      required: true,
      example: "22",
    },
    {
      label: "Server Path",
      value: "dir",
      type: "text",
      required: false,
      example: "KoodoReader",
    },
    {
      label: "Username",
      value: "username",
      type: "text",
      required: true,
    },
    {
      label: "Password",
      value: "password",
      type: "password",
      required: true,
    },
  ],
  s3compatible: [
    {
      label: "Endpoint",
      value: "endpoint",
      type: "text",
      required: true,
      example: "https://endpoint.example.com",
    },
    {
      label: "Region",
      value: "region",
      type: "text",
      required: true,
      example: "ap-west-1",
    },
    {
      label: "BucketName",
      value: "bucketName",
      type: "text",
      required: true,
      example: "koodo-reader-bucket",
    },
    {
      label: "Path",
      value: "dir",
      type: "text",
      required: false,
      example: "KoodoReader",
    },
    {
      label: "AccessKeyId",
      value: "accessKeyId",
      type: "password",
      required: true,
    },
    {
      label: "SecretAccessKey",
      value: "secretAccessKey",
      type: "password",
      required: true,
    },
  ],
  google: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  microsoft: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  google_exp: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  microsoft_exp: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  dropbox: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  pcloud: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
  adrive: [
    {
      label: "Token",
      value: "token",
      type: "text",
      required: true,
    },
  ],
};
