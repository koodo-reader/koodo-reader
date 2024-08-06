export const driveConfig = {
  callbackUrl:
    process.env.NODE_ENV === "production"
      ? "https://web.koodoreader.com"
      : "http://localhost:3000",
  onedriveAuthUrl: "https://cloud.960960.xyz/api/v1/third_auth/onedrive_auth",
  onedriveRefreshUrl:
    "https://cloud.960960.xyz/api/v1/third_auth/onedrive_refresh",
  googleAuthUrl: "https://cloud.960960.xyz/api/v1/third_auth/google_auth",
  googleRefreshUrl: "https://cloud.960960.xyz/api/v1/third_auth/google_refresh",
  googleScope: "https://www.googleapis.com/auth/drive.appdata",
  dropboxClientId: "vnc67byrssocvy1",
  onedriveClientId: "506df58a-29ab-4020-afc5-6f423dc80f35",
  googleClientId:
    "1051055003225-ph1f5fvh328dhv7bco5jitlnfhg6ks2t.apps.googleusercontent.com",
};
export const driveList = [
  {
    id: 1,
    name: "Local",
    icon: "local",
    url: "",
  },
  {
    id: 2,
    name: "Dropbox",
    icon: "dropbox",
    url: `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${driveConfig.dropboxClientId}&redirect_uri=${driveConfig.callbackUrl}`,
  },
  {
    id: 3,
    name: "WebDAV",
    icon: "webdav",
    url: "",
  },
  {
    id: 4,
    name: "OneDrive",
    icon: "onedrive",
    url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${driveConfig.onedriveClientId}&scope=files.readwrite.appfolder offline_access&response_type=code&redirect_uri=${driveConfig.callbackUrl}`,
  },
  {
    id: 5,
    name: "FTP",
    icon: "ftp",
    url: "",
  },
  {
    id: 6,
    name: "SFTP",
    icon: "sftp",
    url: "",
  },
  {
    id: 7,
    name: "Google Drive",
    icon: "googledrive",
    url: `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${driveConfig.callbackUrl}&prompt=consent&response_type=code&client_id=${driveConfig.googleClientId}&scope=${driveConfig.googleScope}&access_type=offline`,
  },
  {
    id: 8,
    name: "S3 Compatible",
    icon: "s3compatible",
    url: "",
  },
];
