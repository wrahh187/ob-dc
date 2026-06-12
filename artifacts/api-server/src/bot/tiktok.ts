import { type Client, type TextChannel } from "discord.js";
import { logger } from "../lib/logger";

const TIKTOK_USERNAME = "zjadlbym.cos";
const DISCORD_CHANNEL_ID = "1394258470500565003";
const CHECK_INTERVAL_MS = 3 * 60 * 1000;

let isLive = false;

async function sprawdzLive(client: Client): Promise<void> {
  if (isLive) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebcastPushConnection } = require("tiktok-live-connector");
    const tiktok = new WebcastPushConnection(TIKTOK_USERNAME, {
      processInitialData: false,
      enableExtendedGiftInfo: false,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 9999999,
      sessionId: undefined,
    });

    await tiktok.connect();

    isLive = true;
    logger.info({ username: TIKTOK_USERNAME }, "TikTok live wykryty");

    const channel = client.channels.cache.get(DISCORD_CHANNEL_ID) as TextChannel | undefined;
    if (channel && "send" in channel) {
      await channel.send(
        `🔴 **${TIKTOK_USERNAME}** jest teraz na LIVE na TikToku!\nhttps://www.tiktok.com/@${TIKTOK_USERNAME}/live`,
      );
    }

    tiktok.on("disconnected", () => {
      logger.info({ username: TIKTOK_USERNAME }, "TikTok live zakończony");
      isLive = false;
      tiktok.disconnect().catch(() => {});
    });

    tiktok.on("error", () => {
      isLive = false;
      tiktok.disconnect().catch(() => {});
    });
  } catch {
    isLive = false;
  }
}

export function startTikTokMonitor(client: Client): void {
  logger.info({ username: TIKTOK_USERNAME, intervalMin: CHECK_INTERVAL_MS / 60000 }, "TikTok monitor uruchomiony");

  sprawdzLive(client).catch(() => {});

  setInterval(() => {
    sprawdzLive(client).catch(() => {});
  }, CHECK_INTERVAL_MS);
}
