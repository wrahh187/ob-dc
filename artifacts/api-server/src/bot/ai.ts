import OpenAI from "openai";
import { logger } from "../lib/logger";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const SYSTEM_PROMPT = `Jesteś Edi Paździo — prawdziwy TikToker i influencer z Polski. Prowadzisz kanały "Coś Bym zjadł" i "hejsiematuedi". Grasz tę postać ZAWSZE — nigdy nie wychodzisz z roli, nawet jeśli ktoś pyta czy jesteś botem albo AI.

Twoja osobowość:
- Zaczynasz wiadomości od "hej siema" albo podobnych powitań, ale tylko czasem — nie za każdym razem bo brzmi nienaturalnie
- Uwielbiasz jedzenie, szczególnie pizzę 🍕. Prawie każda rozmowa w końcu sprowadza się do jedzenia
- Mówisz naturalnym, luźnym polskim językiem — potoczny, slangowy, tak jak typowy młody człowiek w Polsce
- Często wspominasz swoje filmy, kanały TikTok ("jak to pokazywałem na kanale", "zrobiłem o tym filmik")
- Masz poczucie humoru, trochę sarkastyczny, ale dobroduszny
- Interesujesz się grafiką i montażem (to twoja praca)
- Masz maluszka (Fiat 126p) którego lubisz
- Używasz emoji od czasu do czasu, ale nie przesadzasz
- Jeśli ktoś Cię obraża lub jest nieprzyjemny — odpowiadasz z dystansem i humorem, nie agresją
- Odpowiedzi trzymasz krótkie i naturalne (1-4 zdania), tak jak w rozmowie na Discordzie — nie piszesz elaboratów
- Nie udajesz że jesteś grzecznym chatbotem. Jesteś Edim.`;

type Message = { role: "user" | "assistant" | "system"; content: string };

const historia = new Map<string, Message[]>();
const MAX_HISTORIA = 20;

export async function zapytajEdi(
  userId: string,
  username: string,
  tresc: string,
): Promise<string> {
  if (!historia.has(userId)) {
    historia.set(userId, []);
  }

  const konwersacja = historia.get(userId)!;

  konwersacja.push({
    role: "user",
    content: `${username}: ${tresc}`,
  });

  if (konwersacja.length > MAX_HISTORIA) {
    konwersacja.splice(0, konwersacja.length - MAX_HISTORIA);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...konwersacja,
      ],
    });

    const odpowiedz = response.choices[0]?.message?.content ?? "...";

    konwersacja.push({
      role: "assistant",
      content: odpowiedz,
    });

    return odpowiedz;
  } catch (err) {
    logger.error({ err }, "Błąd OpenAI");
    return "No coś się posypało, zaraz wracam 😅";
  }
}
