import { type Client, type TextChannel } from "discord.js";
import { logger } from "../lib/logger";
import { BOT_VERSION, CHANGELOG } from "./version";

const VERSION_PREFIX = `[BOT v`;

export async function sprawdzAktualizacje(client: Client): Promise<void> {
  const channelId = process.env["ANNOUNCEMENT_CHANNEL_ID"];
  if (!channelId) {
    logger.warn("ANNOUNCEMENT_CHANNEL_ID nie ustawiony — pomijam sprawdzanie wersji");
    return;
  }

  const channel = client.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel || !("send" in channel)) {
    logger.warn({ channelId }, "Nie znaleziono kanału ogłoszeń");
    return;
  }

  try {
    const wiadomosci = await channel.messages.fetch({ limit: 50 });
    const juzOgloszono = wiadomosci.some((msg) =>
      msg.author.id === client.user?.id &&
      msg.content.startsWith(`${VERSION_PREFIX}${BOT_VERSION}]`)
    );

    if (juzOgloszono) {
      logger.info({ version: BOT_VERSION }, "Wersja już ogłoszona — pomijam");
      return;
    }

    const opis = CHANGELOG[BOT_VERSION] ?? "Brak opisu zmian.";

    await channel.send(
      `${VERSION_PREFIX}${BOT_VERSION}] 🔄 Aktualizacja bota!\n📋 ${opis}`
    );

    logger.info({ version: BOT_VERSION }, "Ogłoszono nową wersję bota");
  } catch (err) {
    logger.error({ err }, "Błąd podczas sprawdzania wersji");
  }
}
