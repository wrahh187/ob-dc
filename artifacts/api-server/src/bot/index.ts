import { Client, GatewayIntentBits } from "discord.js";
import { logger } from "../lib/logger";
import { zmienStatusCoGodzine } from "./status";
import { handleMessage } from "./messages";
import { handleInteraction, registerCommands } from "./commands";

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN nie jest ustawiony — bot nie zostanie uruchomiony");
    return;
  }

  logger.info(
    { tokenLength: token.length, tokenStart: token.slice(0, 4), hasDots: (token.match(/\./g) ?? []).length },
    "Próba logowania bota"
  );

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once("ready", async (readyClient) => {
    logger.info({ tag: readyClient.user.tag }, "Bot zalogowany");
    await registerCommands(token, readyClient.user.id);
    zmienStatusCoGodzine(readyClient).catch((err) =>
      logger.error({ err }, "Błąd pętli statusu"),
    );
  });

  client.on("messageCreate", (message) => {
    handleMessage(message).catch((err) =>
      logger.error({ err }, "Błąd obsługi wiadomości"),
    );
  });

  client.on("interactionCreate", (interaction) => {
    handleInteraction(interaction).catch((err) =>
      logger.error({ err }, "Błąd obsługi interakcji"),
    );
  });

  client.on("error", (err) => {
    logger.error({ err }, "Błąd Discord client");
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Nie udało się zalogować bota");
  });
}
