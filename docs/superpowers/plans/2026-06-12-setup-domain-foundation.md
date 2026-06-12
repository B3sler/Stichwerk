# Setup & Domain-Fundament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein lauffähiges Expo-Projekt (TypeScript, Expo Router, NativeWind) mit Jest-Test-Setup und den ersten Domain-Bausteinen für Schafkopf (Kartentypen, Deck, Kartenwertigkeiten/Trumpf-Reihenfolge für Rufspiel) inklusive Unit-Tests.

**Architecture:** `src/domain/cards/` enthält reine, UI-unabhängige Typen und Funktionen (Card, Deck, Ordering). `src/theme/` enthält Farb-/Spacing-Tokens als Basis für spätere UI-Arbeit. Das Projekt nutzt Expo Router (Default-Template) + NativeWind für Styling.

**Tech Stack:** Expo (latest SDK), TypeScript (strict), Expo Router, NativeWind v4 + Tailwind CSS, Jest (`jest-expo` preset).

---

### Task 1: Expo-Projekt scaffolden

**Files:**
- Create: gesamtes Expo-Default-Template (package.json, app.json, tsconfig.json, app/, assets/, etc.)

- [ ] **Step 1: Projekt im aktuellen Verzeichnis scaffolden**

```bash
npx create-expo-app@latest . --yes
```

Hinweis: Das Verzeichnis enthält bereits `.git`, `.idea/`, `CLAUDE.md`, `docs/`. Diese Dateien stehen nicht in Konflikt mit dem Expo-Template. Falls der Befehl wegen eines nicht-leeren Verzeichnisses ablehnt, in ein temporäres Verzeichnis scaffolden und die erzeugten Dateien/Ordner (außer `.git`) ins Projektverzeichnis verschieben.

- [ ] **Step 2: Dependencies installieren (falls nicht automatisch erfolgt)**

```bash
npm install
```

- [ ] **Step 3: TypeScript-Check als Smoke-Test**

```bash
npx tsc --noEmit
```

Expected: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo Router TypeScript project"
```

---

### Task 2: NativeWind + Tailwind konfigurieren

**Files:**
- Create: `tailwind.config.js`
- Create: `global.css`
- Create: `nativewind-env.d.ts`
- Modify: `babel.config.js`
- Create: `metro.config.js`
- Modify: `app/_layout.tsx` (CSS-Import ergänzen)

- [ ] **Step 1: NativeWind und Tailwind installieren**

```bash
npm install nativewind
npm install -D tailwindcss@^3.4.0
```

- [ ] **Step 2: Tailwind-Config anlegen**

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0f1f17",
          dark: "#0a1510",
          light: "#1a2e22",
          alt: "#16281e",
          border: "#2f5a40",
        },
        accent: {
          gold: "#e8c873",
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Globales Stylesheet anlegen**

`global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Babel-Config um NativeWind erweitern**

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 5: Metro-Config für NativeWind anlegen**

`metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 6: TypeScript-Typen für NativeWind ergänzen**

`nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Globales CSS in das Root-Layout importieren**

In `app/_layout.tsx` ganz oben (vor allen anderen Imports) ergänzen:

```ts
import "../global.css";
```

- [ ] **Step 8: App startet ohne Fehler (Web)**

```bash
npx expo start --web --non-interactive
```

Expected: Metro-Bundler startet ohne Konfigurationsfehler (Prozess danach mit Ctrl+C / Abbruch beenden, es geht nur um den fehlerfreien Start).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: configure NativeWind and Tailwind CSS"
```

---

### Task 3: Jest-Setup für Domain-Tests

**Files:**
- Modify: `package.json` (devDependencies + jest config + test script)

- [ ] **Step 1: Jest-Pakete installieren**

```bash
npx expo install jest-expo jest @types/jest --dev
```

- [ ] **Step 2: Test-Script und Jest-Konfiguration in `package.json` ergänzen**

In `package.json` den `"scripts"`-Block um folgenden Eintrag erweitern:

```json
"test": "jest"
```

Und ein Top-Level-Feld `"jest"` ergänzen:

```json
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 3: Platzhalter-Test schreiben, um Setup zu verifizieren**

`src/domain/__tests__/setup.test.ts`:

```ts
describe("jest setup", () => {
  it("runs domain tests", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Tests ausführen**

```bash
npm test
```

Expected: 1 Suite, 1 Test, PASS.

- [ ] **Step 5: Platzhalter-Test entfernen**

`src/domain/__tests__/setup.test.ts` löschen.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Jest with jest-expo preset"
```

---

### Task 4: Theme-Tokens anlegen

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/tokens.ts`

- [ ] **Step 1: Farb-Palette definieren**

`src/theme/colors.ts`:

```ts
export const colors = {
  background: "#0f1f17",
  backgroundDark: "#0a1510",
  surface: "#1a2e22",
  surfaceAlt: "#16281e",
  border: "#2f5a40",
  accent: "#e8c873",
  text: "#f4f1e8",
  textMuted: "#9fb3a6",
  trump: "#e8c873",
  success: "#3aa873",
  danger: "#d9534f",
} as const;

export type ColorToken = keyof typeof colors;
```

- [ ] **Step 2: Spacing- und Radius-Tokens definieren**

`src/theme/tokens.ts`:

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;
```

- [ ] **Step 3: TypeScript-Check**

```bash
npx tsc --noEmit
```

Expected: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add theme color and spacing tokens"
```

---

### Task 5: Domain-Kartentypen

**Files:**
- Create: `src/domain/cards/types.ts`

- [ ] **Step 1: Grundtypen für Karten definieren**

`src/domain/cards/types.ts`:

```ts
export type Suit = "eichel" | "laub" | "herz" | "schell";

export type Rank = "7" | "8" | "9" | "10" | "unter" | "ober" | "koenig" | "ass";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS: readonly Suit[] = ["eichel", "laub", "herz", "schell"];

export const RANKS: readonly Rank[] = [
  "7",
  "8",
  "9",
  "10",
  "unter",
  "ober",
  "koenig",
  "ass",
];

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}`;
}
```

- [ ] **Step 2: TypeScript-Check**

```bash
npx tsc --noEmit
```

Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Schafkopf card types"
```

---

### Task 6: Deck erzeugen, mischen, austeilen

**Files:**
- Create: `src/domain/cards/deck.ts`
- Test: `src/domain/__tests__/deck.test.ts`

- [ ] **Step 1: Failing-Test für `createDeck` schreiben**

`src/domain/__tests__/deck.test.ts`:

```ts
import { createDeck, shuffleDeck, dealCards } from "../cards/deck";
import { cardKey } from "../cards/types";

describe("createDeck", () => {
  it("creates 32 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(32);

    const unique = new Set(deck.map(cardKey));
    expect(unique.size).toBe(32);
  });
});

describe("shuffleDeck", () => {
  it("keeps the same set of cards but changes the order", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, () => 0);

    expect(shuffled).toHaveLength(32);
    expect(shuffled.map(cardKey).sort()).toEqual(deck.map(cardKey).sort());
    expect(shuffled).not.toEqual(deck);
  });
});

describe("dealCards", () => {
  it("deals 8 cards to each of 4 players", () => {
    const deck = createDeck();
    const hands = dealCards(deck);

    expect(hands).toHaveLength(4);
    hands.forEach((hand) => expect(hand).toHaveLength(8));

    const allDealt = hands.flat();
    expect(allDealt.map(cardKey).sort()).toEqual(deck.map(cardKey).sort());
  });
});
```

- [ ] **Step 2: Test ausführen, um Fehlschlag zu bestätigen**

```bash
npm test -- deck.test.ts
```

Expected: FAIL – Modul `../cards/deck` existiert nicht.

- [ ] **Step 3: `deck.ts` implementieren**

`src/domain/cards/deck.ts`:

```ts
import { Card, RANKS, SUITS } from "./types";

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[], rng: () => number = Math.random): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealCards(deck: Card[], playerCount = 4): Card[][] {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, index) => {
    hands[index % playerCount].push(card);
  });
  return hands;
}
```

- [ ] **Step 4: Test ausführen, um Erfolg zu bestätigen**

```bash
npm test -- deck.test.ts
```

Expected: PASS, 3 Tests grün.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add deck creation, shuffling and dealing"
```

---

### Task 7: Kartenwerte & Trumpf-Reihenfolge für Rufspiel

**Files:**
- Create: `src/domain/cards/ordering.ts`
- Test: `src/domain/__tests__/ordering.test.ts`

- [ ] **Step 1: Failing-Tests schreiben**

`src/domain/__tests__/ordering.test.ts`:

```ts
import { createDeck } from "../cards/deck";
import {
  cardPoints,
  cardRank,
  isTrump,
  rufspielTrumpOrder,
} from "../cards/ordering";

describe("cardPoints", () => {
  it("returns correct Augen values per rank", () => {
    expect(cardPoints({ suit: "eichel", rank: "ass" })).toBe(11);
    expect(cardPoints({ suit: "eichel", rank: "10" })).toBe(10);
    expect(cardPoints({ suit: "eichel", rank: "koenig" })).toBe(4);
    expect(cardPoints({ suit: "eichel", rank: "ober" })).toBe(3);
    expect(cardPoints({ suit: "eichel", rank: "unter" })).toBe(2);
    expect(cardPoints({ suit: "eichel", rank: "9" })).toBe(0);
    expect(cardPoints({ suit: "eichel", rank: "8" })).toBe(0);
    expect(cardPoints({ suit: "eichel", rank: "7" })).toBe(0);
  });

  it("sums to 120 Augen across the whole deck", () => {
    const total = createDeck().reduce((sum, card) => sum + cardPoints(card), 0);
    expect(total).toBe(120);
  });
});

describe("rufspielTrumpOrder", () => {
  it("contains 14 trumps: 4 Ober, 4 Unter, 6 Herz", () => {
    const order = rufspielTrumpOrder();
    expect(order).toHaveLength(14);
    expect(order.filter((c) => c.rank === "ober")).toHaveLength(4);
    expect(order.filter((c) => c.rank === "unter")).toHaveLength(4);
    expect(
      order.filter((c) => c.suit === "herz" && c.rank !== "ober" && c.rank !== "unter")
    ).toHaveLength(6);
  });

  it("ranks Eichel-Ober as the strongest trump", () => {
    expect(rufspielTrumpOrder()[0]).toEqual({ suit: "eichel", rank: "ober" });
  });

  it("ranks Herz-7 as the weakest trump", () => {
    const order = rufspielTrumpOrder();
    expect(order[order.length - 1]).toEqual({ suit: "herz", rank: "7" });
  });
});

describe("isTrump", () => {
  it("treats every Ober and Unter as trump", () => {
    expect(isTrump({ suit: "schell", rank: "ober" }, "rufspiel")).toBe(true);
    expect(isTrump({ suit: "laub", rank: "unter" }, "rufspiel")).toBe(true);
  });

  it("treats Herz cards (non Ober/Unter) as trump", () => {
    expect(isTrump({ suit: "herz", rank: "ass" }, "rufspiel")).toBe(true);
    expect(isTrump({ suit: "herz", rank: "7" }, "rufspiel")).toBe(true);
  });

  it("does not treat plain color cards as trump", () => {
    expect(isTrump({ suit: "eichel", rank: "ass" }, "rufspiel")).toBe(false);
    expect(isTrump({ suit: "laub", rank: "7" }, "rufspiel")).toBe(false);
  });
});

describe("cardRank", () => {
  it("ranks Eichel-Ober higher than Schell-Ober", () => {
    const eichelOber = cardRank({ suit: "eichel", rank: "ober" }, "rufspiel");
    const schellOber = cardRank({ suit: "schell", rank: "ober" }, "rufspiel");
    expect(eichelOber).toBeGreaterThan(schellOber);
  });

  it("ranks every trump higher than every non-trump", () => {
    const herzSeven = cardRank({ suit: "herz", rank: "7" }, "rufspiel");
    const eichelAss = cardRank({ suit: "eichel", rank: "ass" }, "rufspiel");
    expect(herzSeven).toBeGreaterThan(eichelAss);
  });

  it("ranks Ass higher than Koenig within the same non-trump color", () => {
    const ass = cardRank({ suit: "laub", rank: "ass" }, "rufspiel");
    const koenig = cardRank({ suit: "laub", rank: "koenig" }, "rufspiel");
    expect(ass).toBeGreaterThan(koenig);
  });
});
```

- [ ] **Step 2: Test ausführen, um Fehlschlag zu bestätigen**

```bash
npm test -- ordering.test.ts
```

Expected: FAIL – Modul `../cards/ordering` existiert nicht.

- [ ] **Step 3: `ordering.ts` implementieren**

`src/domain/cards/ordering.ts`:

```ts
import { Card, Rank, Suit } from "./types";

export const CARD_POINTS: Record<Rank, number> = {
  ass: 11,
  "10": 10,
  koenig: 4,
  ober: 3,
  unter: 2,
  "9": 0,
  "8": 0,
  "7": 0,
};

export function cardPoints(card: Card): number {
  return CARD_POINTS[card.rank];
}

/**
 * Suit order used for Ober/Unter trumps and as a tie-breaker reference.
 */
const TRUMP_SUIT_ORDER: readonly Suit[] = ["eichel", "laub", "herz", "schell"];

/**
 * Rank order for Herz trumps (below Ober/Unter) and for plain color suits.
 */
const FARB_RANK_ORDER: readonly Rank[] = ["ass", "10", "koenig", "9", "8", "7"];

/**
 * Full trump order for Rufspiel, strongest first:
 * all four Ober, then all four Unter, then Herz Ass..7.
 */
export function rufspielTrumpOrder(): Card[] {
  const order: Card[] = [];
  for (const suit of TRUMP_SUIT_ORDER) {
    order.push({ suit, rank: "ober" });
  }
  for (const suit of TRUMP_SUIT_ORDER) {
    order.push({ suit, rank: "unter" });
  }
  for (const rank of FARB_RANK_ORDER) {
    order.push({ suit: "herz", rank });
  }
  return order;
}

export type GameType = "rufspiel";

export function isTrump(card: Card, gameType: GameType): boolean {
  if (card.rank === "ober" || card.rank === "unter") return true;
  if (gameType === "rufspiel" && card.suit === "herz") return true;
  return false;
}

/**
 * Returns a numeric strength for a card within the given game type.
 * Higher numbers beat lower numbers. Trumps always outrank non-trumps.
 */
export function cardRank(card: Card, gameType: GameType): number {
  const trumps = rufspielTrumpOrder();
  const trumpIndex = trumps.findIndex(
    (c) => c.suit === card.suit && c.rank === card.rank
  );
  if (trumpIndex !== -1) {
    return 1000 - trumpIndex;
  }

  const farbIndex = FARB_RANK_ORDER.indexOf(card.rank);
  return 100 - farbIndex;
}
```

- [ ] **Step 4: Test ausführen, um Erfolg zu bestätigen**

```bash
npm test -- ordering.test.ts
```

Expected: PASS, alle Tests grün.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add card points and Rufspiel trump ordering"
```

---

### Task 8: Gesamtverifikation

**Files:** keine neuen Dateien

- [ ] **Step 1: Vollständige Test-Suite ausführen**

```bash
npm test
```

Expected: alle Suiten PASS (deck, ordering).

- [ ] **Step 2: TypeScript-Check über das gesamte Projekt**

```bash
npx tsc --noEmit
```

Expected: keine Fehler.

- [ ] **Step 3: Web-Build-Smoke-Test**

```bash
npx expo start --web --non-interactive
```

Expected: Metro startet ohne Fehler (danach Prozess beenden).

- [ ] **Step 4: Abschluss-Commit (falls noch offene Änderungen)**

```bash
git status
```

Falls Änderungen vorhanden:

```bash
git add -A
git commit -m "chore: finalize setup and domain foundation"
```
