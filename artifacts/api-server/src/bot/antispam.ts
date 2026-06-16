import { type Message, type GuildMember, type TextChannel } from "discord.js";
import { logger } from "../lib/logger";

const OKNO_MS = 30_000;
const PROG_UDERZEŃ = 2;
const TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

interface Uderzenie {
  liczba: number;
  pierwszeMs: number;
}

const licznik = new Map<string, Uderzenie>();

function czyMaSpamMencji(message: Message): boolean {
  return message.mentions.everyone;
}

function resetujPoCzasie(userId: string): void {
  setTimeout(() => licznik.delete(userId), OKNO_MS + 1000);
}

export async function sprawdzSpam(message: Message): Promise<boolean> {
  if (!czyMaSpamMencji(message)) return false;
  if (!message.guild) return false;

  const member = message.member;
  if (!member) return false;

  if (member.permissions.has("Administrator")) return false;
  if (member.permissions.has("MentionEveryone")) return false;

  const userId = message.author.id;
  const teraz = Date.now();

  const wpis = licznik.get(userId);

  if (!wpis || teraz - wpis.pierwszeMs > OKNO_MS) {
    licznik.set(userId, { liczba: 1, pierwszeMs: teraz });
    resetujPoCzasie(userId);

    try {
      await message.delete();
    } catch {
      logger.warn({ userId }, "Nie udało się usunąć wiadomości (brak uprawnień?)");
    }

    if ("send" in message.channel) {
      try {
        await (message.channel as TextChannel).send(
          `⚠️ <@${userId}> — nie używaj @everyone / @here. Następnym razem dostaniesz muta.`,
        );
      } catch {
        logger.warn({ userId }, "Nie udało się wysłać ostrzeżenia");
      }
    }

    logger.info({ userId, tag: message.author.tag }, "Ostrzeżenie za @everyone/@here");
    return false;
  }

  wpis.liczba += 1;
  licznik.set(userId, wpis);

  try {
    await message.delete();
  } catch {
    logger.warn({ userId }, "Nie udało się usunąć wiadomości spam");
  }

  await mutujUzytkownika(member, message);
  licznik.delete(userId);
  return true;
}

async function mutujUzytkownika(member: GuildMember, message: Message): Promise<void> {
  const userId = member.user.id;

  try {
    await member.timeout(TIMEOUT_MS, "Spam @everyone/@here");
    logger.info({ userId, tag: member.user.tag }, "Zmutowano za spam @everyone/@here");

    if ("send" in message.channel) {
      await (message.channel as TextChannel).send(
        `🔇 <@${userId}> został(a) wyciszony(a) za spam \`@everyone\` / \`@here\`. Odwołanie przez moderatora.`,
      );
    }
  } catch (err) {
    logger.error({ err, userId }, "Nie udało się zmutować użytkownika");
    if ("send" in message.channel) {
      await (message.channel as TextChannel).send(
        `⚠️ Chciałem wyciszyć <@${userId}> za spam, ale brakuje mi uprawnień. Sprawdźcie role bota.`,
      );
    }
  }
}
