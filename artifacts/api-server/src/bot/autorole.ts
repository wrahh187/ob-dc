import { type GuildMember } from "discord.js";
import { logger } from "../lib/logger";

const AUTOROLE_ID = "1367784131551035412";

export async function nadajAutorole(member: GuildMember): Promise<void> {
  try {
    await member.roles.add(AUTOROLE_ID, "Automatyczna rola dla nowych czlonkow");
    logger.info({ userId: member.user.id, roleId: AUTOROLE_ID }, "Nadano autorole");
  } catch (err) {
    logger.error({ err, userId: member.user.id }, "Nie udalo sie nadac autoroli");
  }
}
