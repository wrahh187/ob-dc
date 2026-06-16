import { type Client, ActivityType } from "discord.js";
import { logger } from "../lib/logger";

const statusy: { name: string; type: ActivityType }[] = [
  { name: "Need For Renta 2025", type: ActivityType.Playing },
  { name: "i je picce 🍕", type: ActivityType.Listening },
  { name: "i pali papierosa", type: ActivityType.Listening },
  { name: "i koloruje kolorowanki", type: ActivityType.Watching },
  { name: "i pije piwo", type: ActivityType.Watching },
  { name: "Podgląda siostrę", type: ActivityType.Playing },
  { name: "Czyta Wandę", type: ActivityType.Playing },
  { name: "Odgania MOPS", type: ActivityType.Playing },
  { name: "Sprawdza Tipply", type: ActivityType.Playing },
];

const dostepnosci = ["online", "idle", "dnd"] as const;

export async function zmienStatusCoGodzine(client: Client): Promise<void> {

  const rotate = async () => {
    const status = statusy[Math.floor(Math.random() * statusy.length)]!;
    const dostepnosc =
      dostepnosci[Math.floor(Math.random() * dostepnosci.length)]!;

    await client.user?.setPresence({
      status: dostepnosc,
      activities: [{ name: status.name, type: status.type }],
    });

    logger.info({ status: status.name, dostepnosc }, "Status zmieniony");
  };

  await rotate();

  setInterval(() => {
    rotate().catch((err) => logger.error({ err }, "Błąd zmiany statusu"));
  }, 3600 * 1000);
}
