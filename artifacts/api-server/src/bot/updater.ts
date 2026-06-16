import { type Client, type TextChannel, EmbedBuilder } from "discord.js";
import { logger } from "../lib/logger";
import { BOT_VERSION, CHANGELOG } from "./version";

const ANNOUNCEMENT_CHANNEL_ID = "1516445924510011602";
const VERSION_TAG = `[v${BOT_VERSION}]`;

export async function sprawdzAktualizacje(client: Client): Promise<void> {
  let channel: TextChannel;
  try {
    const fetched = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
    if (!fetched || !("send" in fetched)) {
      logger.warn({ channelId: ANNOUNCEMENT_CHANNEL_ID }, "Kanal ogloszen nie jest kanalem tekstowym");
      return;
    }
    channel = fetched as TextChannel;
  } catch (err) {
    logger.error({ err, channelId: ANNOUNCEMENT_CHANNEL_ID }, "Nie znaleziono kanalu ogloszen");
    return;
  }

  try {
    const wiadomosci = await channel.messages.fetch({ limit: 50 });
    const juzOgloszono = wiadomosci.some(
      (msg) =>
        msg.author.id === client.user?.id &&
        msg.embeds.some((e) => e.footer?.text === VERSION_TAG),
    );

    if (juzOgloszono) {
      logger.info({ version: BOT_VERSION }, "Wersja juz ogloszona — pomijam");
      return;
    }

    const opis = CHANGELOG[BOT_VERSION] ?? "Brak opisu zmian.";

    const embed = new EmbedBuilder()
      .setTitle(`Wdrozono wersje ${BOT_VERSION}`)
      .setDescription(opis)
      .setColor(0x2b2d31)
      .setTimestamp()
      .setFooter({ text: VERSION_TAG });

    await channel.send({ embeds: [embed] });
    logger.info({ version: BOT_VERSION }, "Ogloszono nowa wersje bota");
  } catch (err) {
    logger.error({ err }, "Blad podczas sprawdzania wersji");
  }
}
