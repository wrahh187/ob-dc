# Edi Paździo — Discord Bot

Bot Discord o nazwie "Edi Paździo" z automatycznym obrotem statusu, slash komendami i odpowiedziami na wiadomości tekstowe.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — uruchom serwer API + bota (port 5000)
- `pnpm run typecheck` — pełny typecheck
- `pnpm run build` — typecheck + build
- Wymagane env: `DISCORD_BOT_TOKEN` — token bota z discord.com/developers/applications → Bot

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: discord.js v14
- DB: PostgreSQL + Drizzle ORM
- Build: esbuild (CJS bundle)

## Where things live

- Bot: `artifacts/api-server/src/bot/`
  - `index.ts` — inicjalizacja klienta Discord
  - `commands.ts` — slash komendy (`/ping`, `/say`)
  - `messages.ts` — odpowiedzi na wiadomości tekstowe
  - `status.ts` — losowa zmiana statusu co godzinę
  - `utils.ts` — helper `unidecode()` do normalizacji polskich znaków
- API: `artifacts/api-server/src/`

## Architecture decisions

- Bot uruchamia się jako moduł w tym samym procesie co serwer Express
- Odpowiedzi na wiadomości używają `unidecode()` (usuwa polskie znaki diakrytyczne) żeby dopasowanie działało niezależnie od klawiatury
- Slash komendy synchronizowane globalnie i dla konkretnej gildii przy każdym starcie

## Product

- **Automatyczny status** — losowy co godzinę (Playing/Listening/Watching, online/idle/dnd)
- **`/ping`** — sprawdzenie czy bot działa
- **`/say <wiadomość>`** — wysłanie wiadomości przez bota (wymaga roli)
- **Odpowiedzi Edi** — reaguje na "edi pokaz zabki", "edi lubisz picce?", "edi co robisz" itd.

## Gotchas

- Token bota to NIE Client Secret i NIE Public Key — pochodzi z zakładki **Bot** na portalu Discord
- Prawdziwy token ma ~70 znaków i 2 kropki
- `MessageContent` intent musi być włączony na portalu Discord (Privileged Gateway Intents)
- `GuildMembers` intent wymagany do sprawdzania ról w komendzie `/say`
