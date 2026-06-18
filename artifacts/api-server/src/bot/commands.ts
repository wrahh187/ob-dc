import {
  type Client,
  type Interaction,
  type TextChannel,
  type GuildMember,
  SlashCommandBuilder,
  EmbedBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
} from "discord.js";
import { logger } from "../lib/logger";

const GUILD_ID = "1367084705937358859";
const ROLE_ID_ALLOWED = "1514940178345496596";
const ROLE_ID_MOD = "1514751735372058786";

const CZAS_CHOICES = [
  { name: "5 minut", value: 5 },
  { name: "15 minut", value: 15 },
  { name: "30 minut", value: 30 },
  { name: "1 godzina", value: 60 },
  { name: "6 godzin", value: 360 },
  { name: "12 godzin", value: 720 },
  { name: "1 dzien", value: 1440 },
  { name: "7 dni", value: 10080 },
  { name: "28 dni", value: 40320 },
];

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdz czy bot dziala"),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Bot powie podany tekst")
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Co bot ma powiedziec")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Wycisz uzytkownika na okreslony czas")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("uzytkownik").setDescription("Uzytkownik do wyciszenia").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("czas")
        .setDescription("Czas wyciszenia")
        .setRequired(true)
        .addChoices(...CZAS_CHOICES),
    )
    .addStringOption((opt) =>
      opt.setName("powod").setDescription("Powod wyciszenia").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Sprawdz informacje o uzytkowniku")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("uzytkownik").setDescription("Uzytkownik do sprawdzenia").setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("dm")
    .setDescription("Wyslij wiadomosc prywatna do uzytkownika lub wszystkich")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt.setName("wiadomosc").setDescription("Tresc wiadomosci").setRequired(true),
    )
    .addUserOption((opt) =>
      opt.setName("uzytkownik").setDescription("Konkretny uzytkownik (brak = wyslij do wszystkich)").setRequired(false),
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
    logger.error({ err }, "Blad synchronizacji komend");
  }
}

function formatCzas(minuty: number): string {
  if (minuty < 60) return `${minuty} min`;
  if (minuty < 1440) return `${minuty / 60} godz`;
  if (minuty < 10080) return `${minuty / 1440} dni`;
  return `${Math.round(minuty / 10080)} tyg`;
}

async function handleMute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const member = interaction.guild?.members.cache.get(interaction.user.id) as GuildMember | undefined;
  const isOwner = interaction.guild?.ownerId === interaction.user.id;
  const canTimeout = member?.permissions.has("ModerateMembers") ?? false;

  if (!isOwner && !canTimeout) {
    await interaction.reply({ content: "Nie masz uprawnien do tej komendy.", ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser("uzytkownik", true);
  const minuty = interaction.options.getInteger("czas", true);
  const powod = interaction.options.getString("powod") ?? "Brak podanego powodu";

  let targetMember: GuildMember | undefined;
  try {
    targetMember = await interaction.guild?.members.fetch(targetUser.id);
  } catch {
    await interaction.reply({ content: "Nie znaleziono uzytkownika na serwerze.", ephemeral: true });
    return;
  }

  if (!targetMember) {
    await interaction.reply({ content: "Nie znaleziono uzytkownika na serwerze.", ephemeral: true });
    return;
  }

  if (targetMember.permissions.has("Administrator")) {
    await interaction.reply({ content: "Nie mozna wyciszyc administratora.", ephemeral: true });
    return;
  }

  const botMember = await interaction.guild?.members.fetchMe();
  if (botMember && targetMember.roles.highest.position >= botMember.roles.highest.position) {
    await interaction.reply({
      content: `Nie moge wyciszyc tego uzytkownika — jego rola jest rowna lub wyzsza od roli bota.\nPrzeciagnij role bota wyzej w **Ustawienia serwera → Role**.`,
      ephemeral: true,
    });
    return;
  }

  const msTimeout = minuty * 60 * 1000;

  try {
    await targetMember.timeout(msTimeout, powod);

    const koniecTimestamp = Math.floor((Date.now() + msTimeout) / 1000);

    const embed = new EmbedBuilder()
      .setTitle("Uzytkownik wyciszony")
      .setColor(0x2b2d31)
      .addFields(
        { name: "Uzytkownik", value: `<@${targetUser.id}> \`${targetUser.tag}\``, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "\u200b", value: "\u200b", inline: false },
        { name: "Czas", value: formatCzas(minuty), inline: true },
        { name: "Koniec", value: `<t:${koniecTimestamp}:R>`, inline: true },
        { name: "Powod", value: powod, inline: false },
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: `ID: ${targetUser.id}` });

    await interaction.reply({ embeds: [embed] });

    logger.info(
      { targetId: targetUser.id, moderatorId: interaction.user.id, minuty, powod },
      "Uzytkownik wyciszony",
    );
  } catch (err) {
    logger.error({ err }, "Blad podczas wyciszania uzytkownika");
    await interaction.reply({
      content: "Nie udalo sie wyciszyc uzytkownika. Sprawdz uprawnienia bota.",
      ephemeral: true,
    });
  }
}

async function handleDm(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const wiadomosc = interaction.options.getString("wiadomosc", true);
  const targetUser = interaction.options.getUser("uzytkownik");

  await interaction.deferReply({ ephemeral: true });

  if (targetUser) {
    try {
      await targetUser.send(wiadomosc);
      await interaction.editReply(`✅ Wysłano DM do **${targetUser.username}**.`);
    } catch {
      await interaction.editReply(`❌ Nie udało się wysłać DM do **${targetUser.username}** — prawdopodobnie ma wyłączone wiadomości prywatne.`);
    }
    return;
  }

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("❌ Nie można pobrać listy członków serwera.");
    return;
  }

  const members = await guild.members.fetch();
  const nonBots = members.filter((m) => !m.user.bot);

  let udane = 0;
  let nieudane = 0;

  for (const [, member] of nonBots) {
    try {
      await member.send(wiadomosc);
      udane++;
    } catch {
      nieudane++;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  await interaction.editReply(
    `✅ Wysyłanie zakończone:\n• **${udane}** dostarczono\n• **${nieudane}** nieudanych (wyłączone DM lub zablokowane)`,
  );
}

async function handleUserInfo(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const targetUser = interaction.options.getUser("uzytkownik") ?? interaction.user;
  let targetMember: GuildMember | undefined;

  try {
    targetMember = await interaction.guild?.members.fetch(targetUser.id);
  } catch {
    targetMember = undefined;
  }

  const accountCreated = Math.floor(targetUser.createdTimestamp / 1000);
  const joinedAt = targetMember?.joinedAt
    ? Math.floor(targetMember.joinedAt.getTime() / 1000)
    : null;

  const roles = targetMember?.roles.cache
    .filter((r) => r.id !== interaction.guildId)
    .sort((a, b) => b.position - a.position)
    .map((r) => `<@&${r.id}>`)
    .join(" ") || "Brak";

  const isTimedOut = targetMember?.communicationDisabledUntil != null &&
    targetMember.communicationDisabledUntil > new Date();

  const flags: string[] = [];
  if (targetUser.bot) flags.push("🤖 Bot");
  if (interaction.guild?.ownerId === targetUser.id) flags.push("👑 Właściciel");
  if (isTimedOut) flags.push("🔇 Wyciszony");
  if (targetMember?.permissions.has("Administrator")) flags.push("🛡️ Admin");

  const embed = new EmbedBuilder()
    .setTitle(`Informacje o użytkowniku`)
    .setColor(0x2b2d31)
    .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "Użytkownik", value: `${targetUser.toString()} \`${targetUser.username}\``, inline: true },
      { name: "ID", value: `\`${targetUser.id}\``, inline: true },
      { name: "\u200b", value: "\u200b", inline: false },
      { name: "Konto założone", value: `<t:${accountCreated}:F> (<t:${accountCreated}:R>)`, inline: false },
      ...(joinedAt ? [{ name: "Dołączył do serwera", value: `<t:${joinedAt}:F> (<t:${joinedAt}:R>)`, inline: false }] : []),
      { name: `Role (${targetMember?.roles.cache.size ? targetMember.roles.cache.size - 1 : 0})`, value: roles, inline: false },
      ...(flags.length ? [{ name: "Status", value: flags.join(" • "), inline: false }] : []),
    )
    .setFooter({ text: `Zapytał: ${interaction.user.username}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleInteraction(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
    return;
  }

  if (interaction.commandName === "say") {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const hasRole = member?.roles.cache.has(ROLE_ID_ALLOWED) ?? false;

    if (!hasRole) {
      await interaction.reply({ content: "Nie masz uprawnien do uzycia tej komendy.", ephemeral: true });
      return;
    }

    const msg = interaction.options.getString("message", true);
    await interaction.reply({ content: `Wiadomosc wyslana.`, ephemeral: true });

    if (interaction.channel && "send" in interaction.channel) {
      await (interaction.channel as TextChannel).send(msg);
    }
    return;
  }

  if (interaction.commandName === "mute") {
    await handleMute(interaction);
    return;
  }

  if (interaction.commandName === "userinfo") {
    await handleUserInfo(interaction);
    return;
  }

  if (interaction.commandName === "dm") {
    await handleDm(interaction);
    return;
  }
}
