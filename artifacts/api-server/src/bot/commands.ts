import {
  type Client,
  type Interaction,
  type TextChannel,
  SlashCommandBuilder,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger";

const GUILD_ID = "1367084705937358859";
const ROLE_ID_ALLOWED = "1514940178345496596";

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdź czy bot działa"),
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Bot powie podany tekst")
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Co bot ma powiedzieć")
        .setRequired(true),
    ),
].map((cmd) => cmd.toJSON());

export async function registerCommands(
  token: string,
  clientId: string,
): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    const globalSynced = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    logger.info(
      { count: (globalSynced as unknown[]).length },
      "Zsynchronizowano globalne komendy slash",
    );

    const guildSynced = await rest.put(
      Routes.applicationGuildCommands(clientId, GUILD_ID),
      { body: commands },
    );
    logger.info(
      { count: (guildSynced as unknown[]).length },
      "Zsynchronizowano komendy slash dla gildii",
    );
  } catch (err) {
    logger.error({ err }, "Błąd synchronizacji komend");
  }
}

export async function handleInteraction(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("🏓 Pong!");
    return;
  }

  if (interaction.commandName === "say") {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const hasRole = member?.roles.cache.has(ROLE_ID_ALLOWED) ?? false;

    if (!hasRole) {
      await interaction.reply({
        content: "Nie masz uprawnień do użycia tej komendy.",
        ephemeral: true,
      });
      return;
    }

    const msg = interaction.options.getString("message", true);

    await interaction.reply({
      content: `✅ Wiadomość została wysłana: \`${msg}\``,
      ephemeral: true,
    });

    if (interaction.channel && "send" in interaction.channel) {
      await (interaction.channel as TextChannel).send(msg);
    }
  }
}
