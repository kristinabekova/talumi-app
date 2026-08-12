# TALUMI – Gaming a Chill zóna

Kompletný zdrojový projekt aktuálnej publikovanej aplikácie TALUMI. Obsahuje úvodný výber zón, Gaming zónu, Chill zónu, matematické hry, Kryštálovú mriežku (Sudoku), všetky lokálne obrázky, piktogramy a fonty používané aplikáciou.

## 1. Použité technológie

- React 19 a TypeScript
- Next.js 16 App Router
- Vinext a Vite 8
- Cloudflare Workers/Wrangler pre produkčný runtime
- CSS bez externej UI knižnice
- Node.js test runner
- Drizzle ORM a podpora Cloudflare D1 sú v štruktúre projektu pripravené, aktuálna aplikácia ich však nepoužíva
- `localStorage` pre lokálne ukladanie rozpracovaných Sudoku hier

Fonty Bricolage Grotesque a Nunito sú uložené lokálne v `.vinext/fonts/`. Obrázky, ilustrácie, ikony a piktogramy sú v `public/`.

## 2. Požadovaná verzia Node.js

- Node.js `>= 22.13.0`
- npm (súčasť inštalácie Node.js)

Odporúčané prostredie pre všetky pripravené skripty je Linux alebo WSL. Build skripty používajú nástroje `bash`, `flock`, `curl` a GNU `timeout`.

## 3. Inštalácia dependencies

V koreňovom adresári projektu spustite:

```bash
npm ci
```

Projekt obsahuje `package-lock.json`, preto `npm ci` nainštaluje presne uzamknuté verzie balíkov.

## 4. Lokálne spustenie

```bash
npm run dev
```

Po spustení otvorte adresu, ktorú vypíše terminál (štandardne `http://localhost:3000` alebo najbližší voľný port).

## 5. Production build

```bash
npm run build
```

Build sa vytvorí v adresári `dist/` a automaticky sa overí jeho hostingový manifest aj serverový vstupný bod.

Lokálne spustenie už vytvoreného produkčného buildu:

```bash
npm run start
```

## 6. Environment variables a externé služby

Aktuálna aplikácia nepotrebuje žiadne používateľské environment variables, externé API, databázu ani používateľské účty. Všetky herné vizuály a fonty sú súčasťou projektu. Rozpracované Sudoku sa ukladá iba lokálne v prehliadači.

Súbor `.openai/hosting.json` zachováva identitu pôvodného projektu pre prípadné opätovné nasadenie cez ChatGPT Sites. Pre bežné lokálne spustenie nie je potrebné nič nastavovať. Premenné `ASSETS` a `IMAGES` vo `worker/index.ts` sú runtime bindingy vytvárané buildom/hostingovým prostredím, nie tajné hodnoty, ktoré má používateľ dopĺňať.

## Dôležité príkazy

```bash
npm ci                                      # inštalácia balíkov
npm run dev                                 # lokálny vývoj
npm run build                               # production build a validácia
npm run start                               # spustenie produkčného buildu
npm test                                    # build a testy Sudoku/renderovania
node --import tsx --test tests/snake-logic.test.ts  # testy hernej logiky hada
npm run lint                                # statická kontrola zdrojového kódu
```

## Adresárová štruktúra

```text
app/                  stránky, komponenty, hry a štýly
  snake/              logika a UI hry Matematický hadík
  sudoku/             Kryštálová mriežka, generátor, solver a UI
  talumi/             spoločné TALUMI komponenty a meteorická hra
build/                podpora produkčného buildu
db/                   pripravená, aktuálne nepoužívaná databázová vrstva
examples/             voliteľný príklad D1
public/               všetky lokálne obrázky, logá, ikony a piktogramy
scripts/              inštalačné, build a validačné skripty
tests/                automatizované testy
worker/               serverový vstup pre Cloudflare/Vinext runtime
.vinext/fonts/        lokálne fontové súbory a ich štýly
.openai/hosting.json  manifest pôvodného Sites projektu
```

## Hlavné miesta na úpravy

- celková navigácia a zóny: `app/page.tsx`
- globálne štýly: `app/globals.css`
- TALUMI vzhľad a responzivita: `app/talumi/talumi.css`
- Sudoku vzhľad: `app/sudoku/sudoku.css`
- Sudoku texty a obrazovky: `app/sudoku/SudokuIntro.tsx`, `app/sudoku/SudokuGame.tsx`
- Sudoku generátor a solver: `app/sudoku/engine.ts`
- matematický hadík: `app/snake/`
- obrázky a piktogramy: `public/`

## Poznámka k exportu

Export vychádza zo zdrojového commitu publikovanej verzie 26 (`20a57b3e0c6ea27dd2ad304a9f7c26f660fd1587`). Do exportu bol oproti tomuto commitu doplnený iba tento návod `README.md`. `node_modules/`, `dist/`, lokálne logy a Git história nie sú súčasťou ZIP-u; vytvoria sa znova pomocou príkazov vyššie a nie sú zdrojovou časťou aplikácie.
