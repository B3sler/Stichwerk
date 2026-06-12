# Bots & State-Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a heuristic `BotStrategy` for Rufspiel bidding/play, a `gameStore` (Zustand) that wraps `domain/engine` and auto-resolves bot turns, and a persisted `settingsStore` for theme/card-design/sound preferences.

**Architecture:** `src/domain/bots/` stays pure (no React/RN, operates on `GameState` + existing rules). `src/state/gameStore.ts` is the *only* bridge between `domain/engine` and the UI: it dispatches `applyAction` for the human player (player index 0) and then runs any consecutive bot turns via `simpleBotStrategy`. `src/state/settingsStore.ts` uses Zustand's `persist` middleware with AsyncStorage.

**Tech Stack:** TypeScript (strict), Zustand 5 (already installed via `npx expo install zustand @react-native-async-storage/async-storage`), Jest (`jest-expo` preset).

---

## File Structure

- Create: `src/domain/bots/strategy.ts` — `BotStrategy` interface.
- Create: `src/domain/bots/simpleBot.ts` — `simpleBotStrategy`.
- Modify: `package.json` — add a `moduleNameMapper` for the AsyncStorage Jest mock.
- Create: `src/state/gameStore.ts` — `useGameStore` (Zustand).
- Create: `src/state/settingsStore.ts` — `useSettingsStore` (Zustand + persist).
- Test files mirror each module: `src/domain/__tests__/simpleBot.test.ts`, `src/state/__tests__/gameStore.test.ts`, `src/state/__tests__/settingsStore.test.ts`.

---

### Task 1: Bot strategy interface and simple heuristic bot

**Files:**
- Create: `src/domain/bots/strategy.ts`
- Create: `src/domain/bots/simpleBot.ts`
- Test: `src/domain/__tests__/simpleBot.test.ts`

`simpleBotStrategy` makes no claim to playing strength (per the design spec): for bidding it plays Rufspiel with the first callable suit if any exists, otherwise passes; for card play it always plays the weakest legal card (lowest `cardRank`), which naturally prefers non-trump cards over trumps.

- [x] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/simpleBot.test.ts
import { simpleBotStrategy } from "../bots/simpleBot";
import { createInitialGameState } from "../engine/gameMachine";
import { ActiveGame } from "../rules/gameTypes";

describe("simpleBotStrategy.decideBid", () => {
  it("plays rufspiel with the first callable suit when possible", () => {
    const state = createInitialGameState(0, () => 0);
    state.players[1].hand = [
      { suit: "eichel", rank: "9" },
      { suit: "herz", rank: "7" },
    ];
    expect(simpleBotStrategy.decideBid(state, 1)).toEqual({ type: "play", calledSuit: "eichel" });
  });

  it("passes when no suit is callable", () => {
    const state = createInitialGameState(0, () => 0);
    state.players[1].hand = [
      { suit: "eichel", rank: "ass" },
      { suit: "laub", rank: "ass" },
      { suit: "schell", rank: "ass" },
      { suit: "herz", rank: "7" },
    ];
    expect(simpleBotStrategy.decideBid(state, 1)).toEqual({ type: "pass" });
  });
});

describe("simpleBotStrategy.chooseCard", () => {
  const rufspiel: ActiveGame = {
    gameType: "rufspiel",
    declarerIndex: 0,
    calledSuit: "schell",
    partnerIndex: 2,
  };

  it("plays the weakest legal card", () => {
    const state = createInitialGameState(0, () => 0);
    state.activeGame = rufspiel;
    state.players[1].hand = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "7" },
    ];
    state.currentTrick = { cards: [], leaderIndex: 1 };
    expect(simpleBotStrategy.chooseCard(state, 1)).toEqual({ suit: "eichel", rank: "7" });
  });

  it("prefers a non-trump card over a trump when both are legal", () => {
    const state = createInitialGameState(0, () => 0);
    state.activeGame = rufspiel;
    state.players[1].hand = [
      { suit: "herz", rank: "7" },
      { suit: "laub", rank: "7" },
    ];
    state.currentTrick = { cards: [], leaderIndex: 1 };
    expect(simpleBotStrategy.chooseCard(state, 1)).toEqual({ suit: "laub", rank: "7" });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- simpleBot`
Expected: FAIL with "Cannot find module '../bots/simpleBot'"

- [x] **Step 3: Write minimal implementation**

```ts
// src/domain/bots/strategy.ts
import { Card } from "../cards/types";
import { GameState } from "../engine/gameState";
import { BidDecision } from "../rules/gameTypes";

export interface BotStrategy {
  decideBid(state: GameState, playerIndex: number): BidDecision;
  chooseCard(state: GameState, playerIndex: number): Card;
}
```

```ts
// src/domain/bots/simpleBot.ts
import { cardRank } from "../cards/ordering";
import { GameState } from "../engine/gameState";
import { callableSuits } from "../rules/bidding";
import { BidDecision } from "../rules/gameTypes";
import { legalMoves } from "../rules/legalMoves";
import { BotStrategy } from "./strategy";

export const simpleBotStrategy: BotStrategy = {
  decideBid(state, playerIndex): BidDecision {
    const hand = state.players[playerIndex].hand;
    const suits = callableSuits(hand);
    if (suits.length > 0) {
      return { type: "play", calledSuit: suits[0] };
    }
    return { type: "pass" };
  },

  chooseCard(state, playerIndex) {
    const hand = state.players[playerIndex].hand;
    const allowed = legalMoves(hand, state.currentTrick.cards, "rufspiel", state.activeGame);
    return allowed.reduce((weakest, card) =>
      cardRank(card, "rufspiel") < cardRank(weakest, "rufspiel") ? card : weakest
    );
  },
};
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- simpleBot`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/domain/bots/strategy.ts src/domain/bots/simpleBot.ts src/domain/__tests__/simpleBot.test.ts
git commit -m "feat: add simple heuristic bot strategy for rufspiel"
```

---

### Task 2: Settings store with persistence

**Files:**
- Modify: `package.json` — add a `moduleNameMapper` to the `jest` config block so `@react-native-async-storage/async-storage` resolves to its Jest mock.
- Create: `src/state/settingsStore.ts`
- Test: `src/state/__tests__/settingsStore.test.ts`

- [x] **Step 1: Update Jest config**

In `package.json`, change the `"jest"` block from:

```json
  "jest": {
    "preset": "jest-expo"
  }
```

to:

```json
  "jest": {
    "preset": "jest-expo",
    "moduleNameMapper": {
      "^@react-native-async-storage/async-storage$": "@react-native-async-storage/async-storage/jest/async-storage-mock"
    }
  }
```

- [x] **Step 2: Write the failing test**

```ts
// src/state/__tests__/settingsStore.test.ts
import { useSettingsStore } from "../settingsStore";

describe("useSettingsStore", () => {
  it("has sensible defaults", () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.cardDesign).toBe("bavarian-classic");
    expect(state.soundEnabled).toBe(true);
  });

  it("updates theme, card design and sound settings", () => {
    useSettingsStore.getState().setTheme("light");
    useSettingsStore.getState().setCardDesign("bavarian-classic");
    useSettingsStore.getState().setSoundEnabled(false);

    const state = useSettingsStore.getState();
    expect(state.theme).toBe("light");
    expect(state.cardDesign).toBe("bavarian-classic");
    expect(state.soundEnabled).toBe(false);
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run: `npm test -- settingsStore`
Expected: FAIL with "Cannot find module '../settingsStore'"

- [x] **Step 4: Write minimal implementation**

```ts
// src/state/settingsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";
export type CardDesign = "bavarian-classic";

interface SettingsState {
  theme: ThemeMode;
  cardDesign: CardDesign;
  soundEnabled: boolean;
  setTheme: (theme: ThemeMode) => void;
  setCardDesign: (cardDesign: CardDesign) => void;
  setSoundEnabled: (soundEnabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      cardDesign: "bavarian-classic",
      soundEnabled: true,
      setTheme: (theme) => set({ theme }),
      setCardDesign: (cardDesign) => set({ cardDesign }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    {
      name: "stichwerk-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

- [x] **Step 5: Run test to verify it passes**

Run: `npm test -- settingsStore`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add package.json src/state/settingsStore.ts src/state/__tests__/settingsStore.test.ts
git commit -m "feat: add persisted settings store"
```

---

### Task 3: Game store with bot auto-play

**Files:**
- Create: `src/state/gameStore.ts`
- Test: `src/state/__tests__/gameStore.test.ts`

`useGameStore` holds the single `GameState` for the local game. `startNewRound` deals a fresh game. `placeBid`/`playCard` always act on the human player (index 0), then call `runBotTurns`, which repeatedly applies `simpleBotStrategy` decisions for the bot whose turn it is (computed from `bidding.order`/`currentTrick`) until it's the human's turn or the round ends.

- [x] **Step 1: Write the failing test**

```ts
// src/state/__tests__/gameStore.test.ts
import { useGameStore } from "../gameStore";
import { GameState } from "../../domain/engine/gameState";
import { ActiveGame } from "../../domain/rules/gameTypes";

function totalCardCount(game: GameState): number {
  const inHands = game.players.reduce((sum, p) => sum + p.hand.length, 0);
  const inCurrentTrick = game.currentTrick.cards.length;
  const inCompletedTricks = game.completedTricks.reduce((sum, t) => sum + t.length, 0);
  return inHands + inCurrentTrick + inCompletedTricks;
}

describe("useGameStore", () => {
  it("startNewRound deals a full 32-card game in the bidding phase", () => {
    useGameStore.getState().startNewRound(0, () => 0);
    const { game } = useGameStore.getState();
    expect(game.players).toHaveLength(4);
    expect(totalCardCount(game)).toBe(32);
    expect(["bidding", "playing", "roundEnd"]).toContain(game.phase);
  });

  it("placeBid by the human starts the playing phase and auto-plays subsequent bot turns", () => {
    const rufspiel: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "eichel",
      partnerIndex: 2,
    };
    const state: GameState = {
      phase: "bidding",
      players: [
        {
          id: "player-0",
          name: "Spieler 1",
          isBot: false,
          hand: [{ suit: "eichel", rank: "9" }, { suit: "schell", rank: "7" }],
        },
        {
          id: "player-1",
          name: "Spieler 2",
          isBot: true,
          hand: [{ suit: "laub", rank: "8" }, { suit: "schell", rank: "9" }],
        },
        {
          id: "player-2",
          name: "Spieler 3",
          isBot: true,
          hand: [{ suit: "eichel", rank: "ass" }, { suit: "laub", rank: "7" }],
        },
        {
          id: "player-3",
          name: "Spieler 4",
          isBot: true,
          hand: [{ suit: "schell", rank: "8" }, { suit: "herz", rank: "7" }],
        },
      ],
      dealerIndex: 3,
      bidding: { order: [1, 0, 2, 3], currentIndex: 1, result: null, allPassed: false },
      activeGame: null,
      currentTrick: { cards: [], leaderIndex: 1 },
      completedTricks: [],
      scores: null,
    };
    useGameStore.setState({ game: state });

    useGameStore.getState().placeBid({ type: "play", calledSuit: "eichel" });

    const { game } = useGameStore.getState();
    expect(game.phase).toBe("playing");
    expect(game.activeGame).toEqual(rufspiel);
    expect(game.currentTrick).toEqual({
      cards: [
        { playerIndex: 1, card: { suit: "laub", rank: "8" } },
        { playerIndex: 2, card: { suit: "laub", rank: "7" } },
        { playerIndex: 3, card: { suit: "schell", rank: "8" } },
      ],
      leaderIndex: 1,
    });
    expect(game.players[1].hand).toEqual([{ suit: "schell", rank: "9" }]);
    expect(game.players[2].hand).toEqual([{ suit: "eichel", rank: "ass" }]);
    expect(game.players[3].hand).toEqual([{ suit: "herz", rank: "7" }]);
    expect(game.players[0].hand).toEqual([
      { suit: "eichel", rank: "9" },
      { suit: "schell", rank: "7" },
    ]);
  });

  it("playCard by the human auto-plays subsequent bot turns within the trick", () => {
    const rufspiel: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "schell",
      partnerIndex: 2,
    };
    const state: GameState = {
      phase: "playing",
      players: [
        {
          id: "player-0",
          name: "Spieler 1",
          isBot: false,
          hand: [{ suit: "eichel", rank: "koenig" }, { suit: "herz", rank: "7" }],
        },
        {
          id: "player-1",
          name: "Spieler 2",
          isBot: true,
          hand: [{ suit: "eichel", rank: "9" }, { suit: "laub", rank: "koenig" }],
        },
        {
          id: "player-2",
          name: "Spieler 3",
          isBot: true,
          hand: [{ suit: "eichel", rank: "8" }, { suit: "laub", rank: "9" }],
        },
        {
          id: "player-3",
          name: "Spieler 4",
          isBot: true,
          hand: [{ suit: "eichel", rank: "10" }, { suit: "laub", rank: "7" }],
        },
      ],
      dealerIndex: 0,
      bidding: { order: [1, 2, 3, 0], currentIndex: 4, result: rufspiel, allPassed: false },
      activeGame: rufspiel,
      currentTrick: { cards: [], leaderIndex: 0 },
      completedTricks: [],
      scores: null,
    };
    useGameStore.setState({ game: state });

    useGameStore.getState().playCard({ suit: "eichel", rank: "koenig" });

    const { game } = useGameStore.getState();
    expect(game.phase).toBe("playing");
    expect(game.completedTricks).toEqual([
      [
        { playerIndex: 0, card: { suit: "eichel", rank: "koenig" } },
        { playerIndex: 1, card: { suit: "eichel", rank: "9" } },
        { playerIndex: 2, card: { suit: "eichel", rank: "8" } },
        { playerIndex: 3, card: { suit: "eichel", rank: "10" } },
      ],
    ]);
    expect(game.currentTrick).toEqual({
      cards: [{ playerIndex: 3, card: { suit: "laub", rank: "7" } }],
      leaderIndex: 3,
    });
    expect(game.players[0].hand).toEqual([{ suit: "herz", rank: "7" }]);
    expect(game.players[1].hand).toEqual([{ suit: "laub", rank: "koenig" }]);
    expect(game.players[2].hand).toEqual([{ suit: "laub", rank: "9" }]);
    expect(game.players[3].hand).toEqual([]);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- gameStore`
Expected: FAIL with "Cannot find module '../gameStore'"

- [x] **Step 3: Write minimal implementation**

```ts
// src/state/gameStore.ts
import { create } from "zustand";
import { simpleBotStrategy } from "../domain/bots/simpleBot";
import { Card } from "../domain/cards/types";
import { applyAction } from "../domain/engine/actions";
import { createInitialGameState } from "../domain/engine/gameMachine";
import { GameState } from "../domain/engine/gameState";
import { BidDecision } from "../domain/rules/gameTypes";

const HUMAN_PLAYER_INDEX = 0;

function currentActor(state: GameState): number {
  if (state.phase === "bidding") {
    return state.bidding.order[state.bidding.currentIndex];
  }
  return (state.currentTrick.leaderIndex + state.currentTrick.cards.length) % 4;
}

function runBotTurns(state: GameState): GameState {
  let current = state;
  while (current.phase !== "roundEnd" && current.players[currentActor(current)].isBot) {
    const actor = currentActor(current);
    if (current.phase === "bidding") {
      const decision = simpleBotStrategy.decideBid(current, actor);
      current = applyAction(current, { type: "placeBid", playerIndex: actor, decision });
    } else {
      const card = simpleBotStrategy.chooseCard(current, actor);
      current = applyAction(current, { type: "playCard", playerIndex: actor, card });
    }
  }
  return current;
}

interface GameStore {
  game: GameState;
  startNewRound: (dealerIndex?: number, rng?: () => number) => void;
  placeBid: (decision: BidDecision) => void;
  playCard: (card: Card) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: runBotTurns(createInitialGameState(0)),
  startNewRound: (dealerIndex = 0, rng = Math.random) => {
    set({ game: runBotTurns(createInitialGameState(dealerIndex, rng)) });
  },
  placeBid: (decision) => {
    const next = applyAction(get().game, {
      type: "placeBid",
      playerIndex: HUMAN_PLAYER_INDEX,
      decision,
    });
    set({ game: runBotTurns(next) });
  },
  playCard: (card) => {
    const next = applyAction(get().game, {
      type: "playCard",
      playerIndex: HUMAN_PLAYER_INDEX,
      card,
    });
    set({ game: runBotTurns(next) });
  },
}));
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- gameStore`
Expected: PASS

- [x] **Step 5: Run the full test suite and type check**

Run: `npm test`
Expected: all tests pass (existing 55 + new tests from this plan)

Run: `npx tsc --noEmit`
Expected: no errors

- [x] **Step 6: Commit**

```bash
git add src/state/gameStore.ts src/state/__tests__/gameStore.test.ts
git commit -m "feat: add game store with automatic bot turn resolution"
```
