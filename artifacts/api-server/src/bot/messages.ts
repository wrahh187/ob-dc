import { type Message, type TextChannel, type Client } from "discord.js";
import { unidecode } from "./utils";
import { zapytajEdi } from "./ai";
import { sprawdzSpam } from "./antispam";

type Reply = string | string[];

const odpowiedzi: Record<string, Reply> = {
  "edi pokaz zabki":
    "https://media.discordapp.net/attachments/1368381837570998387/1373733870544883742/received_3820947334860267.jpg",
  "edi lubisz picce?": "Tak! Ciap ciap",
  "edi lubisz picce": "Tak! Ciap ciap",
  "edi masz prace":
    "Tak, pracuje jako grafik i montażysta. :smiling_face_with_3_hearts:",
  "edi co robisz": [
    "Jem!",
    "https://media.discordapp.net/attachments/1368381837570998387/1373734196828180490/Messenger_creation_7A7E29FF-63FF-45D8-BC25-64A731743D6F.jpg",
  ],
  "edi kochasz siostre?": "A ty swojej rodziny nie kochasz? :laughing:",
  "edi kochasz siostre": "A ty swojej rodziny nie kochasz? :laughing:",
  "edi kiedy renta":
    "Ja pracuje jako grafik i montażysta, więc nie muszę się martwić o rentę. Ale jeśli chodzi o Twoją, to nie mam pojęcia. :laughing:",
  "edi ile renty":
    "Ja pracuje jako grafik i montażysta, więc nie muszę się martwić o rentę. Ale jeśli chodzi o Twoją, to nie mam pojęcia. :laughing:",
  "edi kiedy nowy film":
    "Niedługo, może nowa pi picca, albo kolorowanka. A może jakaś wyścigówka? :laughing:",
  "edi jak odpala maluch":
    "https://media.discordapp.net/attachments/1367096000883462258/1373960510222893118/copy_C0F08700-03EF-4076-A9D3-369CBD29C368.mov?ex=682c4ff0&is=682afe70&hm=dd379e077280c8e16c7421553ee3a4829040b74b667b11c8fee7b25b330f4bb2&",
};

export async function handleMessage(
  message: Message,
  client: Client,
): Promise<void> {
  if (message.author.bot) return;

  const byłSpam = await sprawdzSpam(message);
  if (byłSpam) return;

  if (!("send" in message.channel)) return;
  const channel = message.channel as TextChannel;

  if (message.mentions.everyone) return;

  const byłOznaczony =
    client.user != null && message.mentions.has(client.user);

  if (byłOznaczony) {
    const tresc = message.content
      .replace(/<@!?\d+>/g, "")
      .trim();

    await channel.sendTyping();

    const odpowiedz = await zapytajEdi(
      message.author.id,
      message.author.displayName ?? message.author.username,
      tresc || "hej",
    );

    await channel.send(odpowiedz);
    return;
  }

  const msg = unidecode(message.content.toLowerCase());

  const reply = odpowiedzi[msg];
  if (!reply) return;

  if (Array.isArray(reply)) {
    for (const line of reply) {
      await channel.send(line);
    }
  } else {
    await channel.send(reply);
  }
}
