export const config = {
  callback_url:
    process.env.NODE_ENV === "production"
      ? "https://koodo-reader.vercel.app"
      : "http://localhost:3000",
  token_url:
    process.env.NODE_ENV === "production"
      ? "http://localhost:3366"
      : "http://localhost:3366",
  dropbox_client_id: "vnc67byrssocvy1",
  googledrive_client_id:
    "99440516227-ifr1ann33f2j610i3ri17ej0i51c7m6e.apps.googleusercontent.com",
  onedrive_client_id: "ac96f9bf-94f2-49c0-8418-999b919bc236",
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
    url: `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${config.dropbox_client_id}&redirect_uri=${config.callback_url}`,
  },

  {
    id: 3,
    name: "Google Drive",
    icon: "googledrive",
    url: "",
  },
  // {
  //   id: 4,
  //   name: "OneDrive",
  //   icon: "onedrive",
  //   url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.onedrive_client_id}&scope=files.readwrite offline_access&response_type=code&redirect_uri=${config.callback_url}`,
  // },
  {
    id: 5,
    name: "WebDav",
    icon: "webdav",
    url: "",
  },
];
