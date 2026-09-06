// Discord Rich Presence
let discordRPCClient = null;
let discordRPCReady = false;
let discordRPCConnecting = false;
const DISCORD_CLIENT_ID = "1490863275074781305"; // Koodo Reader Discord App ID

const initDiscordRPC = () => {
  if (discordRPCConnecting || discordRPCReady) return Promise.resolve();
  discordRPCConnecting = true;
  return new Promise((resolve) => {
    try {
      const DiscordRPC = require("discord-rpc");
      DiscordRPC.register(DISCORD_CLIENT_ID);
      const client = new DiscordRPC.Client({ transport: "ipc" });
      client.on("ready", () => {
        console.info("Discord RPC connected");
        discordRPCClient = client;
        discordRPCReady = true;
        discordRPCConnecting = false;
        resolve();
      });
      client.login({ clientId: DISCORD_CLIENT_ID }).catch((err) => {
        console.warn("Discord RPC login failed:", err.message);
        discordRPCClient = null;
        discordRPCReady = false;
        discordRPCConnecting = false;
        resolve();
      });
    } catch (e) {
      console.warn("Discord RPC init failed:", e.message);
      discordRPCClient = null;
      discordRPCReady = false;
      discordRPCConnecting = false;
      resolve();
    }
  });
};

const destroyDiscordRPC = () => {
  if (discordRPCClient) {
    try {
      discordRPCClient.destroy();
    } catch (_) {}
    discordRPCClient = null;
  }
  discordRPCReady = false;
  discordRPCConnecting = false;
};

const buildProgressBar = (percentage) => {
  const total = 10;
  const filled = Math.round((percentage / 100) * total);
  const empty = total - filled;
  return "▓".repeat(filled) + "░".repeat(empty);
};

const setDiscordActivity = async ({ bookTitle, author, percentage } = {}) => {
  if (!discordRPCReady) {
    await initDiscordRPC();
  }
  if (!discordRPCClient || !discordRPCReady) return;
  try {
    const progressBar = buildProgressBar(percentage);
    await discordRPCClient.setActivity({
      details: bookTitle,
      state: `${progressBar} ${percentage}%  |  by ${author}`,
      largeImageKey: "koodo_reader_logo",
      largeImageText: "Koodo Reader",
      startTimestamp: Date.now(),
      instance: false,
      buttons: [
        {
          label: "Get Koodo Reader",
          url: "https://koodoreader.com",
        },
      ],
    });
  } catch (e) {
    console.warn("Failed to set Discord activity:", e.message);
  }
};

const clearDiscordActivity = async () => {
  if (discordRPCClient) {
    try {
      await discordRPCClient.clearActivity();
    } catch (e) {
      console.warn("Failed to clear Discord activity:", e.message);
    }
  }
};

module.exports = {
  initDiscordRPC,
  destroyDiscordRPC,
  setDiscordActivity,
  clearDiscordActivity,
};
