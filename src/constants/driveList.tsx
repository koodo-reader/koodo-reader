export const driveConfig = {
  callbackUrl:
    process.env.NODE_ENV === "production"
      ? "https://reader.960960.xyz"
      : "http://localhost:3000",
  onedriveAuthUrl: "https://koodo.960960.xyz/api/onedrive_auth",
  onedriveRefreshUrl: "https://koodo.960960.xyz/api/onedrive_refresh",
  dropboxClientId: "vnc67byrssocvy1",
  onedriveClientId: "506df58a-29ab-4020-afc5-6f423dc80f35",
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
    url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${driveConfig.onedriveClientId}&scope=files.readwrite offline_access&response_type=code&redirect_uri=${driveConfig.callbackUrl}`,
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
];
