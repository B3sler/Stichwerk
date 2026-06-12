# Rufspiel-Regelwerk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Rufspiel rules engine in `src/domain/rules/` and `src/domain/engine/`: trick evaluation, legal moves (Bedienpflicht + Sau-Regel), bidding, full scoring (Abrechnung), and a serializable game state machine with reducer-style actions.

**Architecture:** Pure functions and types only, no React/RN imports. Builds on existing `src/domain/cards/{types,deck,ordering}.ts` (`Card`, `Suit`, `Rank`, `cardKey`, `cardEquals`, `createDeck`, `shuffleDeck`, `dealCards`, `cardPoints`, `cardRank`, `isTrump`, `rufspielTrumpOrder`, `GameType`). Each module gets its own `__tests__` file under `src/domain/__tests__/`.

**Tech Stack:** TypeScript (strict), Jest (`jest-expo` preset, `npm test`).

---

## File Structure

- Create: `src/domain/rules/gameTypes.ts` — shared `ActiveGame`, `BidDecision`, `Suit`-helper re-exports for the rules layer.
- Create: `src/domain/rules/trickEvaluation.ts` — `trickWinner()`.
- Create: `src/domain/rules/legalMoves.ts` — `legalMoves()` (Bedienpflicht + Sau-Regel).
- Create: `src/domain/rules/bidding.ts` — `callableSuits()`, `canPlayRufspiel()`.
- Create: `src/domain/rules/scoring.ts` — `calculateLaufende()`, `calculateRoundScore()`, `DEFAULT_SCORING_CONFIG`.
- Create: `src/domain/engine/gameState.ts` — `GameState`, `Player`, `Trick`, `TrickCard`, `BiddingState`, `RoundScore`, `Phase` types.
- Create: `src/domain/engine/gameMachine.ts` — `createInitialGameState()`.
- Create: `src/domain/engine/actions.ts` — `GameAction`, `applyAction()`.
- Test files mirror each module under `src/domain/__tests__/`.

---

### Task 1: Rules-level shared types (`gameTypes.ts`)

**Files:**
- Create: `src/domain/rules/gameTypes.ts`
- Test: `src/domain/__tests__/gameTypes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/gameTypes.test.ts
import { ActiveGame, BidDecision } from "../rules/gameTypes";

describe("gameTypes", () => {
  it("allows constructing an ActiveGame for rufspiel", () => {
    const game: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "eichel",
      partnerIndex: 2,
    };
    expect(game.gameType).toBe("rufspiel");
  });

  it("allows constructing play and pass BidDecisions", () => {
    const play: BidDecision = { type: "play", calledSuit: "laub" };
    const pass: BidDecision = { type: "pass" };
    expect(play.type).toBe("play");
    expect(pass.type).toBe("pass");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameTypes`
Expected: FAIL with "Cannot find module '../rules/gameTypes'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/rules/gameTypes.ts
import { GameType, Suit } from "../cards/ordering";

export type { GameType };

export interface ActiveGame {
  gameType: GameType;
  declarerIndex: number;
  calledSuit: Suit;
  partnerIndex: number;
}

export type BidDecision =
  | { type: "play"; calledSuit: Suit }
  | { type: "pass" };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameTypes`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/gameTypes.ts src/domain/__tests__/gameTypes.test.ts
git commit -m "feat: add shared rules types for active game and bidding decisions"
```

---

### Task 2: Trick evaluation (`trickEvaluation.ts`)

**Files:**
- Create: `src/domain/rules/trickEvaluation.ts`
- Test: `src/domain/__tests__/trickEvaluation.test.ts`

Recall `Trick`/`TrickCard` don't exist as types yet — for this task's tests, use plain `{ playerIndex: number; card: Card }[]` arrays so this module has no dependency on the engine layer (the engine's `Trick` type, defined in Task 6, is structurally compatible: `{ cards: TrickCard[] }`).

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/trickEvaluation.test.ts
import { trickWinner } from "../rules/trickEvaluation";
import { Card } from "../cards/types";

function tc(playerIndex: number, card: Card) {
  return { playerIndex, card };
}

describe("trickWinner", () => {
  it("highest card of the led suit wins when no trump is played", () => {
    const trick = [
      tc(0, { suit: "schell", rank: "9" }),
      tc(1, { suit: "schell", rank: "ass" }),
      tc(2, { suit: "schell", rank: "7" }),
      tc(3, { suit: "schell", rank: "koenig" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(1);
  });

  it("a trump beats a higher non-trump card of the led suit", () => {
    const trick = [
      tc(0, { suit: "schell", rank: "ass" }),
      tc(1, { suit: "eichel", rank: "unter" }),
      tc(2, { suit: "schell", rank: "10" }),
      tc(3, { suit: "schell", rank: "koenig" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(1);
  });

  it("non-trump cards that don't follow suit cannot win", () => {
    const trick = [
      tc(0, { suit: "schell", rank: "8" }),
      tc(1, { suit: "eichel", rank: "ass" }),
      tc(2, { suit: "laub", rank: "ass" }),
      tc(3, { suit: "schell", rank: "7" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(0);
  });

  it("among multiple trumps the strongest trump order wins", () => {
    const trick = [
      tc(0, { suit: "herz", rank: "ass" }),
      tc(1, { suit: "eichel", rank: "unter" }),
      tc(2, { suit: "schell", rank: "ober" }),
      tc(3, { suit: "herz", rank: "unter" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- trickEvaluation`
Expected: FAIL with "Cannot find module '../rules/trickEvaluation'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/rules/trickEvaluation.ts
import { Card } from "../cards/types";
import { GameType, cardRank, isTrump } from "../cards/ordering";

export interface TrickCard {
  playerIndex: number;
  card: Card;
}

export function trickWinner(trick: TrickCard[], gameType: GameType): number {
  const [first, ...rest] = trick;
  const leadSuit = first.card.suit;
  let best = first;

  for (const tc of rest) {
    const tcIsTrump = isTrump(tc.card, gameType);
    const bestIsTrump = isTrump(best.card, gameType);

    if (tcIsTrump && !bestIsTrump) {
      best = tc;
      continue;
    }
    if (!tcIsTrump && bestIsTrump) {
      continue;
    }
    if (!tcIsTrump && tc.card.suit !== leadSuit) {
      continue;
    }
    if (cardRank(tc.card, gameType) > cardRank(best.card, gameType)) {
      best = tc;
    }
  }

  return best.playerIndex;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- trickEvaluation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/trickEvaluation.ts src/domain/__tests__/trickEvaluation.test.ts
git commit -m "feat: add trick winner evaluation"
```

---

### Task 3: Legal moves (`legalMoves.ts`)

**Files:**
- Create: `src/domain/rules/legalMoves.ts`
- Test: `src/domain/__tests__/legalMoves.test.ts`

Implements Bedienpflicht (must follow suit/trump if possible) plus the Rufspiel "Sau-Regel": a player holding the called-suit Ace may not discard it to follow the called suit if they hold other non-trump cards of that suit.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/legalMoves.test.ts
import { legalMoves } from "../rules/legalMoves";
import { TrickCard } from "../rules/trickEvaluation";
import { ActiveGame } from "../rules/gameTypes";
import { Card } from "../cards/types";

const rufspiel: ActiveGame = {
  gameType: "rufspiel",
  declarerIndex: 0,
  calledSuit: "eichel",
  partnerIndex: 2,
};

describe("legalMoves", () => {
  it("allows any card when leading an empty trick", () => {
    const hand: Card[] = [
      { suit: "schell", rank: "7" },
      { suit: "herz", rank: "ass" },
      { suit: "eichel", rank: "10" },
    ];
    const result = legalMoves(hand, [], "rufspiel", null);
    expect(result).toEqual(hand);
  });

  it("must follow the led non-trump suit if possible", () => {
    const hand: Card[] = [
      { suit: "schell", rank: "7" },
      { suit: "schell", rank: "koenig" },
      { suit: "herz", rank: "ass" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "schell", rank: "9" } }];
    const result = legalMoves(hand, trick, "rufspiel", null);
    expect(result).toEqual([
      { suit: "schell", rank: "7" },
      { suit: "schell", rank: "koenig" },
    ]);
  });

  it("must follow with trump if a trump is led and trumps are held", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ober" },
      { suit: "schell", rank: "7" },
      { suit: "herz", rank: "8" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "unter" } }];
    const result = legalMoves(hand, trick, "rufspiel", null);
    expect(result).toEqual([
      { suit: "eichel", rank: "ober" },
      { suit: "herz", rank: "8" },
    ]);
  });

  it("allows any card if the hand cannot follow suit or trump", () => {
    const hand: Card[] = [
      { suit: "schell", rank: "7" },
      { suit: "laub", rank: "ass" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "unter" } }];
    const result = legalMoves(hand, trick, "rufspiel", null);
    expect(result).toEqual(hand);
  });

  it("forbids discarding the called ace when following the called suit with other cards available", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "8" },
      { suit: "herz", rank: "7" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "9" } }];
    const result = legalMoves(hand, trick, "rufspiel", rufspiel);
    expect(result).toEqual([{ suit: "eichel", rank: "8" }]);
  });

  it("allows playing the called ace when it is the only card of the called suit", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "herz", rank: "7" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "9" } }];
    const result = legalMoves(hand, trick, "rufspiel", rufspiel);
    expect(result).toEqual([{ suit: "eichel", rank: "ass" }]);
  });

  it("does not restrict the called ace when leading a trick", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "8" },
    ];
    const result = legalMoves(hand, [], "rufspiel", rufspiel);
    expect(result).toEqual(hand);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- legalMoves`
Expected: FAIL with "Cannot find module '../rules/legalMoves'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/rules/legalMoves.ts
import { Card, cardEquals } from "../cards/types";
import { GameType, isTrump } from "../cards/ordering";
import { TrickCard } from "./trickEvaluation";
import { ActiveGame } from "./gameTypes";

export function legalMoves(
  hand: Card[],
  trick: TrickCard[],
  gameType: GameType,
  activeGame: ActiveGame | null
): Card[] {
  let candidates: Card[];

  if (trick.length === 0) {
    candidates = [...hand];
  } else {
    const leadCard = trick[0].card;
    const leadIsTrump = isTrump(leadCard, gameType);
    const required = leadIsTrump
      ? hand.filter((c) => isTrump(c, gameType))
      : hand.filter((c) => !isTrump(c, gameType) && c.suit === leadCard.suit);
    candidates = required.length > 0 ? required : [...hand];

    if (activeGame?.gameType === "rufspiel" && !leadIsTrump && leadCard.suit === activeGame.calledSuit) {
      const calledAce: Card = { suit: activeGame.calledSuit, rank: "ass" };
      const hasOtherCalledSuitCards = hand.some(
        (c) => c.suit === activeGame.calledSuit && !isTrump(c, gameType) && !cardEquals(c, calledAce)
      );
      if (hasOtherCalledSuitCards) {
        const withoutAce = candidates.filter((c) => !cardEquals(c, calledAce));
        if (withoutAce.length > 0) {
          candidates = withoutAce;
        }
      }
    }
  }

  return candidates;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- legalMoves`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/legalMoves.ts src/domain/__tests__/legalMoves.test.ts
git commit -m "feat: add legal moves with Bedienpflicht and Sau-Regel"
```

---

### Task 4: Bidding (`bidding.ts`)

**Files:**
- Create: `src/domain/rules/bidding.ts`
- Test: `src/domain/__tests__/bidding.test.ts`

A player may call a suit (Eichel/Laub/Schell — never Herz, since Herz is trump in Rufspiel) if they hold at least one non-trump card of that suit and do NOT already hold the Ace of that suit.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/bidding.test.ts
import { callableSuits, canPlayRufspiel } from "../rules/bidding";
import { Card } from "../cards/types";

describe("callableSuits", () => {
  it("includes a suit when the player has a non-trump card of it but not its ace", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "9" },
      { suit: "herz", rank: "7" },
    ];
    expect(callableSuits(hand)).toEqual(["eichel"]);
  });

  it("excludes a suit when the player already holds its ace", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "9" },
    ];
    expect(callableSuits(hand)).toEqual([]);
  });

  it("excludes a suit when the player only has trump cards (ober/unter) of it", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ober" },
      { suit: "eichel", rank: "unter" },
    ];
    expect(callableSuits(hand)).toEqual([]);
  });

  it("never includes herz, since it is always trump in rufspiel", () => {
    const hand: Card[] = [{ suit: "herz", rank: "9" }];
    expect(callableSuits(hand)).toEqual([]);
  });

  it("can return multiple callable suits", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "9" },
      { suit: "laub", rank: "8" },
      { suit: "schell", rank: "ass" },
    ];
    expect(callableSuits(hand)).toEqual(["eichel", "laub"]);
  });
});

describe("canPlayRufspiel", () => {
  it("is true when at least one suit is callable", () => {
    const hand: Card[] = [{ suit: "eichel", rank: "9" }];
    expect(canPlayRufspiel(hand)).toBe(true);
  });

  it("is false when no suit is callable", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "laub", rank: "ass" },
      { suit: "schell", rank: "ass" },
      { suit: "herz", rank: "7" },
    ];
    expect(canPlayRufspiel(hand)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- bidding`
Expected: FAIL with "Cannot find module '../rules/bidding'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/rules/bidding.ts
import { Card } from "../cards/types";
import { Suit } from "../cards/ordering";

const CALLABLE_SUITS: readonly Suit[] = ["eichel", "laub", "schell"];

export function callableSuits(hand: Card[]): Suit[] {
  return CALLABLE_SUITS.filter((suit) => {
    const hasNonTrumpCardOfSuit = hand.some(
      (c) => c.suit === suit && c.rank !== "ober" && c.rank !== "unter"
    );
    const hasAce = hand.some((c) => c.suit === suit && c.rank === "ass");
    return hasNonTrumpCardOfSuit && !hasAce;
  });
}

export function canPlayRufspiel(hand: Card[]): boolean {
  return callableSuits(hand).length > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- bidding`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/bidding.ts src/domain/__tests__/bidding.test.ts
git commit -m "feat: add rufspiel bidding eligibility checks"
```

---

### Task 5: Scoring (`scoring.ts`)

**Files:**
- Create: `src/domain/rules/scoring.ts`
- Test: `src/domain/__tests__/scoring.test.ts`

`calculateRoundScore` sums Augen per team from `completedTricks` (using `trickWinner` + `cardPoints`), determines win/Schneider/Schwarz, counts Laufende (consecutive top trumps owned by one team, starting from the strongest), and computes the Tarif.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/scoring.test.ts
import { calculateLaufende, calculateRoundScore, DEFAULT_SCORING_CONFIG } from "../rules/scoring";
import { TrickCard } from "../rules/trickEvaluation";
import { ActiveGame } from "../rules/gameTypes";
import { Card } from "../cards/types";
import { rufspielTrumpOrder } from "../cards/ordering";

const rufspiel: ActiveGame = {
  gameType: "rufspiel",
  declarerIndex: 0,
  calledSuit: "eichel",
  partnerIndex: 2,
};

function trick(cards: [number, Card][]): TrickCard[] {
  return cards.map(([playerIndex, card]) => ({ playerIndex, card }));
}

describe("calculateLaufende", () => {
  it("counts consecutive top trumps held by one team, starting from Eichel-Ober", () => {
    const trumps = rufspielTrumpOrder();
    // Give trumps[0..2] (Eichel-Ober, Laub-Ober, Herz-Ober) to declarer team (players 0/2),
    // trumps[3] (Schell-Ober) to the opponent team -> 3 Laufende.
    const tricks: TrickCard[][] = [
      trick([
        [0, trumps[0]],
        [1, { suit: "schell", rank: "7" }],
        [2, trumps[1]],
        [3, { suit: "schell", rank: "8" }],
      ]),
      trick([
        [0, trumps[2]],
        [1, trumps[3]],
        [2, { suit: "laub", rank: "7" }],
        [3, { suit: "laub", rank: "8" }],
      ]),
    ];
    expect(calculateLaufende(tricks, "rufspiel", 0, 2)).toBe(3);
  });

  it("returns 0 when fewer than the threshold of consecutive top trumps are held by one team", () => {
    const trumps = rufspielTrumpOrder();
    // trumps[0] to declarer team, trumps[1] to opponent -> only 1 Laufender.
    const tricks: TrickCard[][] = [
      trick([
        [0, trumps[0]],
        [1, trumps[1]],
        [2, { suit: "schell", rank: "7" }],
        [3, { suit: "schell", rank: "8" }],
      ]),
    ];
    expect(calculateLaufende(tricks, "rufspiel", 0, 2)).toBe(0);
  });
});

describe("calculateRoundScore", () => {
  it("computes a simple win with base tarif and no schneider/schwarz/laufende", () => {
    const tricks: TrickCard[][] = [
      trick([
        [0, { suit: "eichel", rank: "ass" }],
        [1, { suit: "schell", rank: "7" }],
        [2, { suit: "laub", rank: "7" }],
        [3, { suit: "schell", rank: "8" }],
      ]),
      trick([
        [1, { suit: "herz", rank: "unter" }],
        [0, { suit: "schell", rank: "koenig" }],
        [2, { suit: "schell", rank: "ass" }],
        [3, { suit: "schell", rank: "10" }],
      ]),
    ];

    const score = calculateRoundScore(tricks, rufspiel, "rufspiel", DEFAULT_SCORING_CONFIG);

    expect(score.declarerTeamPoints).toBe(11); // trick 1: player 0 wins with eichel-ass (11 Augen)
    expect(score.opponentTeamPoints).toBe(27); // trick 2: player 1's herz-unter (trump) wins 2+4+11+10 = 27 Augen
    expect(score.declarerTeamWon).toBe(false);
    expect(score.schneider).toBe(false);
    expect(score.schwarz).toBe(false);
    expect(score.laufende).toBe(0);
    expect(score.tarif).toBe(DEFAULT_SCORING_CONFIG.baseValue);
  });

  it("applies schneider and schwarz when one team takes (almost) all Augen", () => {
    // Each trick is won by player 2 (declarer team) via a Herz trump; the other three
    // players each contribute a high-value non-trump card of a different suit.
    const tricks: TrickCard[][] = [
      trick([
        [1, { suit: "eichel", rank: "ass" }],
        [3, { suit: "laub", rank: "ass" }],
        [0, { suit: "schell", rank: "ass" }],
        [2, { suit: "herz", rank: "ass" }],
      ]),
      trick([
        [1, { suit: "eichel", rank: "10" }],
        [3, { suit: "laub", rank: "10" }],
        [0, { suit: "schell", rank: "10" }],
        [2, { suit: "herz", rank: "10" }],
      ]),
      trick([
        [1, { suit: "eichel", rank: "koenig" }],
        [3, { suit: "laub", rank: "koenig" }],
        [0, { suit: "schell", rank: "koenig" }],
        [2, { suit: "herz", rank: "koenig" }],
      ]),
    ];

    const score = calculateRoundScore(tricks, rufspiel, "rufspiel", DEFAULT_SCORING_CONFIG);

    expect(score.declarerTeamPoints).toBe(100);
    expect(score.opponentTeamPoints).toBe(0);
    expect(score.declarerTeamWon).toBe(true);
    expect(score.schneider).toBe(true);
    expect(score.schwarz).toBe(true);
    expect(score.laufende).toBe(0);
    expect(score.tarif).toBe(
      DEFAULT_SCORING_CONFIG.baseValue + DEFAULT_SCORING_CONFIG.schneiderValue + DEFAULT_SCORING_CONFIG.schwarzValue
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scoring`
Expected: FAIL with "Cannot find module '../rules/scoring'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/rules/scoring.ts
import { cardKey } from "../cards/types";
import { GameType, cardPoints, rufspielTrumpOrder } from "../cards/ordering";
import { TrickCard, trickWinner } from "./trickEvaluation";
import { ActiveGame } from "./gameTypes";

export interface ScoringConfig {
  baseValue: number;
  schneiderValue: number;
  schwarzValue: number;
  laufendeValue: number;
  laufendeThreshold: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  baseValue: 10,
  schneiderValue: 10,
  schwarzValue: 10,
  laufendeValue: 10,
  laufendeThreshold: 3,
};

export interface RoundScore {
  declarerTeamPoints: number;
  opponentTeamPoints: number;
  declarerTeamWon: boolean;
  schneider: boolean;
  schwarz: boolean;
  laufende: number;
  tarif: number;
}

export function calculateLaufende(
  completedTricks: TrickCard[][],
  gameType: GameType,
  declarerIndex: number,
  partnerIndex: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  const cardOwner = new Map<string, number>();
  for (const trick of completedTricks) {
    for (const tc of trick) {
      cardOwner.set(cardKey(tc.card), tc.playerIndex);
    }
  }

  const declarerTeam = new Set([declarerIndex, partnerIndex]);
  const trumps = rufspielTrumpOrder();

  let count = 0;
  let teamIsDeclarer: boolean | null = null;
  for (const trump of trumps) {
    const owner = cardOwner.get(cardKey(trump));
    if (owner === undefined) break;
    const ownerIsDeclarerTeam = declarerTeam.has(owner);
    if (teamIsDeclarer === null) {
      teamIsDeclarer = ownerIsDeclarerTeam;
    } else if (ownerIsDeclarerTeam !== teamIsDeclarer) {
      break;
    }
    count++;
  }

  return count >= config.laufendeThreshold ? count : 0;
}

export function calculateRoundScore(
  completedTricks: TrickCard[][],
  activeGame: ActiveGame,
  gameType: GameType,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): RoundScore {
  const declarerTeam = new Set([activeGame.declarerIndex, activeGame.partnerIndex]);

  let declarerTeamPoints = 0;
  let opponentTeamPoints = 0;
  for (const trick of completedTricks) {
    const winner = trickWinner(trick, gameType);
    const points = trick.reduce((sum, tc) => sum + cardPoints(tc.card), 0);
    if (declarerTeam.has(winner)) {
      declarerTeamPoints += points;
    } else {
      opponentTeamPoints += points;
    }
  }

  const declarerTeamWon = declarerTeamPoints > 60;
  const schneider = declarerTeamWon ? declarerTeamPoints >= 91 : opponentTeamPoints >= 91;
  const schwarz = declarerTeamWon ? opponentTeamPoints === 0 : declarerTeamPoints === 0;
  const laufende = calculateLaufende(completedTricks, gameType, activeGame.declarerIndex, activeGame.partnerIndex, config);

  let tarif = config.baseValue;
  if (schneider) tarif += config.schneiderValue;
  if (schwarz) tarif += config.schwarzValue;
  if (laufende > 0) tarif += laufende * config.laufendeValue;

  return {
    declarerTeamPoints,
    opponentTeamPoints,
    declarerTeamWon,
    schneider,
    schwarz,
    laufende,
    tarif,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scoring`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/rules/scoring.ts src/domain/__tests__/scoring.test.ts
git commit -m "feat: add rufspiel scoring with laufende, schneider and schwarz"
```

---

### Task 6: Engine state types (`gameState.ts`)

**Files:**
- Create: `src/domain/engine/gameState.ts`
- Test: `src/domain/__tests__/gameState.test.ts`

Defines the serializable `GameState` shape used by `gameMachine` and `actions`. No logic, just types plus one small helper (`createPlayers`) used by `gameMachine` in Task 7.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/gameState.test.ts
import { createPlayers, GameState } from "../engine/gameState";

describe("createPlayers", () => {
  it("creates 4 players with empty hands, ids and bot flags", () => {
    const players = createPlayers();
    expect(players).toHaveLength(4);
    expect(players[0]).toEqual({ id: "player-0", name: "Spieler 1", isBot: false, hand: [] });
    expect(players[1]).toEqual({ id: "player-1", name: "Spieler 2", isBot: true, hand: [] });
    expect(players.every((p, i) => (i === 0 ? !p.isBot : p.isBot))).toBe(true);
  });
});

describe("GameState type", () => {
  it("can represent a freshly dealt bidding-phase state", () => {
    const state: GameState = {
      phase: "bidding",
      players: createPlayers(),
      dealerIndex: 0,
      bidding: { order: [1, 2, 3, 0], currentIndex: 0, result: null, allPassed: false },
      activeGame: null,
      currentTrick: { cards: [], leaderIndex: 1 },
      completedTricks: [],
      scores: null,
    };
    expect(state.phase).toBe("bidding");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameState`
Expected: FAIL with "Cannot find module '../engine/gameState'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/engine/gameState.ts
import { Card } from "../cards/types";
import { TrickCard } from "../rules/trickEvaluation";
import { ActiveGame } from "../rules/gameTypes";
import { RoundScore } from "../rules/scoring";

export type Phase = "bidding" | "playing" | "roundEnd";

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
}

export interface Trick {
  cards: TrickCard[];
  leaderIndex: number;
}

export interface BiddingState {
  order: number[];
  currentIndex: number;
  result: ActiveGame | null;
  allPassed: boolean;
}

export interface GameState {
  phase: Phase;
  players: Player[];
  dealerIndex: number;
  bidding: BiddingState;
  activeGame: ActiveGame | null;
  currentTrick: Trick;
  completedTricks: TrickCard[][];
  scores: RoundScore | null;
}

const PLAYER_NAMES = ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"];

export function createPlayers(): Player[] {
  return PLAYER_NAMES.map((name, index) => ({
    id: `player-${index}`,
    name,
    isBot: index !== 0,
    hand: [],
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameState`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/engine/gameState.ts src/domain/__tests__/gameState.test.ts
git commit -m "feat: add serializable game state types"
```

---

### Task 7: Initial state / dealing (`gameMachine.ts`)

**Files:**
- Create: `src/domain/engine/gameMachine.ts`
- Test: `src/domain/__tests__/gameMachine.test.ts`

`createInitialGameState(dealerIndex, rng?)` shuffles and deals a fresh deck (via existing `createDeck`/`shuffleDeck`/`dealCards`), assigns hands to the 4 players, and sets up the `bidding` phase. Bidding order starts with the player to the dealer's right (`(dealerIndex + 1) % 4`) and proceeds clockwise; that same player is the initial `currentTrick.leaderIndex` (Vorhand leads the first trick).

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/gameMachine.test.ts
import { createInitialGameState } from "../engine/gameMachine";

describe("createInitialGameState", () => {
  it("deals 8 cards to each of the 4 players", () => {
    const state = createInitialGameState(0, () => 0);
    expect(state.players).toHaveLength(4);
    for (const player of state.players) {
      expect(player.hand).toHaveLength(8);
    }
  });

  it("deals all 32 distinct cards across the players", () => {
    const state = createInitialGameState(0, () => 0);
    const allCards = state.players.flatMap((p) => p.hand);
    expect(allCards).toHaveLength(32);
    const uniqueKeys = new Set(allCards.map((c) => `${c.suit}-${c.rank}`));
    expect(uniqueKeys.size).toBe(32);
  });

  it("sets the bidding order to start with the player right of the dealer", () => {
    const state = createInitialGameState(1, () => 0);
    expect(state.bidding.order).toEqual([2, 3, 0, 1]);
    expect(state.bidding.currentIndex).toBe(0);
    expect(state.bidding.result).toBeNull();
    expect(state.bidding.allPassed).toBe(false);
  });

  it("starts in the bidding phase with the first bidder as initial trick leader", () => {
    const state = createInitialGameState(2, () => 0);
    expect(state.phase).toBe("bidding");
    expect(state.dealerIndex).toBe(2);
    expect(state.currentTrick).toEqual({ cards: [], leaderIndex: 3 });
    expect(state.activeGame).toBeNull();
    expect(state.completedTricks).toEqual([]);
    expect(state.scores).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameMachine`
Expected: FAIL with "Cannot find module '../engine/gameMachine'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/engine/gameMachine.ts
import { createDeck, dealCards, shuffleDeck } from "../cards/deck";
import { createPlayers, GameState } from "./gameState";

export function createInitialGameState(dealerIndex: number, rng: () => number = Math.random): GameState {
  const deck = shuffleDeck(createDeck(), rng);
  const hands = dealCards(deck, 4);
  const players = createPlayers().map((player, index) => ({
    ...player,
    hand: hands[index],
  }));

  const firstBidder = (dealerIndex + 1) % 4;
  const order = [0, 1, 2, 3].map((offset) => (firstBidder + offset) % 4);

  return {
    phase: "bidding",
    players,
    dealerIndex,
    bidding: { order, currentIndex: 0, result: null, allPassed: false },
    activeGame: null,
    currentTrick: { cards: [], leaderIndex: firstBidder },
    completedTricks: [],
    scores: null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameMachine`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/engine/gameMachine.ts src/domain/__tests__/gameMachine.test.ts
git commit -m "feat: add initial game state creation with dealing and bidding setup"
```

---

### Task 8: Reducer actions (`actions.ts`)

**Files:**
- Create: `src/domain/engine/actions.ts`
- Test: `src/domain/__tests__/actions.test.ts`

`applyAction(state, action)` is the single reducer entry point for `placeBid` and `playCard`. It validates turn order and legality (throwing `Error` on violations — the UI/store is expected to only dispatch legal actions, this is a defensive invariant check), then returns a new `GameState`.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/__tests__/actions.test.ts
import { applyAction } from "../engine/actions";
import { GameState, Player } from "../engine/gameState";
import { ActiveGame } from "../rules/gameTypes";
import { TrickCard } from "../rules/trickEvaluation";
import { Card } from "../cards/types";

function player(id: number, hand: Card[], isBot = id !== 0): Player {
  return { id: `player-${id}`, name: `Spieler ${id + 1}`, isBot, hand };
}

function makeBiddingState(): GameState {
  return {
    phase: "bidding",
    players: [
      player(0, [{ suit: "eichel", rank: "9" }, { suit: "herz", rank: "7" }]),
      player(1, [{ suit: "schell", rank: "7" }]),
      player(2, [{ suit: "eichel", rank: "ass" }]),
      player(3, [{ suit: "laub", rank: "7" }]),
    ],
    dealerIndex: 3,
    bidding: { order: [0, 1, 2, 3], currentIndex: 0, result: null, allPassed: false },
    activeGame: null,
    currentTrick: { cards: [], leaderIndex: 0 },
    completedTricks: [],
    scores: null,
  };
}

const rufspielGame: ActiveGame = {
  gameType: "rufspiel",
  declarerIndex: 0,
  calledSuit: "schell",
  partnerIndex: 2,
};

function makePlayingState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "playing",
    players: [
      player(0, [{ suit: "eichel", rank: "8" }]),
      player(1, [{ suit: "eichel", rank: "7" }]),
      player(2, [{ suit: "eichel", rank: "ass" }]),
      player(3, [{ suit: "eichel", rank: "10" }]),
    ],
    dealerIndex: 3,
    bidding: { order: [0, 1, 2, 3], currentIndex: 0, result: rufspielGame, allPassed: false },
    activeGame: rufspielGame,
    currentTrick: { cards: [], leaderIndex: 0 },
    completedTricks: [],
    scores: null,
    ...overrides,
  };
}

describe("applyAction - placeBid", () => {
  it("starts the playing phase when a player announces rufspiel", () => {
    const state = makeBiddingState();
    const next = applyAction(state, {
      type: "placeBid",
      playerIndex: 0,
      decision: { type: "play", calledSuit: "eichel" },
    });

    expect(next.phase).toBe("playing");
    expect(next.activeGame).toEqual({
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "eichel",
      partnerIndex: 2,
    });
    expect(next.bidding.result).toEqual(next.activeGame);
    expect(next.currentTrick).toEqual({ cards: [], leaderIndex: 0 });
  });

  it("advances to the next bidder on pass", () => {
    const state = makeBiddingState();
    const next = applyAction(state, {
      type: "placeBid",
      playerIndex: 0,
      decision: { type: "pass" },
    });

    expect(next.phase).toBe("bidding");
    expect(next.bidding.currentIndex).toBe(1);
    expect(next.activeGame).toBeNull();
  });

  it("ends the round with allPassed when every player passes", () => {
    let state = makeBiddingState();
    for (const playerIndex of [0, 1, 2, 3]) {
      state = applyAction(state, { type: "placeBid", playerIndex, decision: { type: "pass" } });
    }

    expect(state.phase).toBe("roundEnd");
    expect(state.bidding.allPassed).toBe(true);
    expect(state.scores).toBeNull();
  });

  it("throws if a player bids out of turn", () => {
    const state = makeBiddingState();
    expect(() =>
      applyAction(state, { type: "placeBid", playerIndex: 1, decision: { type: "pass" } })
    ).toThrow();
  });

  it("throws if a player calls a suit they cannot legally call", () => {
    const state = makeBiddingState();
    expect(() =>
      applyAction(state, {
        type: "placeBid",
        playerIndex: 0,
        decision: { type: "play", calledSuit: "schell" },
      })
    ).toThrow();
  });
});

describe("applyAction - playCard", () => {
  it("throws when not in the playing phase", () => {
    const state = makeBiddingState();
    expect(() =>
      applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "9" } })
    ).toThrow();
  });

  it("throws when it is not the player's turn", () => {
    const state = makePlayingState();
    expect(() =>
      applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "eichel", rank: "7" } })
    ).toThrow();
  });

  it("throws when the card is not a legal move", () => {
    const state = makePlayingState({
      players: [
        player(0, [{ suit: "eichel", rank: "8" }]),
        player(1, [{ suit: "schell", rank: "8" }, { suit: "herz", rank: "7" }]),
        player(2, [{ suit: "eichel", rank: "ass" }]),
        player(3, [{ suit: "eichel", rank: "10" }]),
      ],
      currentTrick: { cards: [{ playerIndex: 0, card: { suit: "schell", rank: "7" } }], leaderIndex: 0 },
    });
    expect(() =>
      applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "herz", rank: "7" } })
    ).toThrow();
  });

  it("plays a card, removing it from the hand and adding it to the current trick", () => {
    const state = makePlayingState();
    const next = applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "8" } });

    expect(next.players[0].hand).toEqual([]);
    expect(next.currentTrick.cards).toEqual([{ playerIndex: 0, card: { suit: "eichel", rank: "8" } }]);
    expect(next.phase).toBe("playing");
  });

  it("completes a trick and sets the next leader to the trick winner", () => {
    let state = makePlayingState();
    state = applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "8" } });
    state = applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "eichel", rank: "7" } });
    state = applyAction(state, { type: "playCard", playerIndex: 2, card: { suit: "eichel", rank: "ass" } });
    state = applyAction(state, { type: "playCard", playerIndex: 3, card: { suit: "eichel", rank: "10" } });

    expect(state.completedTricks).toHaveLength(1);
    expect(state.currentTrick).toEqual({ cards: [], leaderIndex: 2 }); // eichel ass wins
    expect(state.phase).toBe("playing");
    expect(state.players.every((p) => p.hand.length === 0)).toBe(true);
  });

  it("ends the round and computes scores after the 8th trick", () => {
    const dummyTrick: TrickCard[] = [
      { playerIndex: 0, card: { suit: "laub", rank: "7" } },
      { playerIndex: 1, card: { suit: "laub", rank: "8" } },
      { playerIndex: 2, card: { suit: "laub", rank: "9" } },
      { playerIndex: 3, card: { suit: "laub", rank: "10" } },
    ];
    let state = makePlayingState({ completedTricks: Array.from({ length: 7 }, () => dummyTrick) });

    state = applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "8" } });
    state = applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "eichel", rank: "7" } });
    state = applyAction(state, { type: "playCard", playerIndex: 2, card: { suit: "eichel", rank: "ass" } });
    state = applyAction(state, { type: "playCard", playerIndex: 3, card: { suit: "eichel", rank: "10" } });

    expect(state.phase).toBe("roundEnd");
    expect(state.completedTricks).toHaveLength(8);
    expect(state.scores).toEqual({
      declarerTeamPoints: 21,
      opponentTeamPoints: 70,
      declarerTeamWon: false,
      schneider: false,
      schwarz: false,
      laufende: 0,
      tarif: 10,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- actions`
Expected: FAIL with "Cannot find module '../engine/actions'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/engine/actions.ts
import { Card, cardEquals } from "../cards/types";
import { callableSuits } from "../rules/bidding";
import { ActiveGame, BidDecision } from "../rules/gameTypes";
import { legalMoves } from "../rules/legalMoves";
import { calculateRoundScore } from "../rules/scoring";
import { trickWinner } from "../rules/trickEvaluation";
import { GameState } from "./gameState";

export type GameAction =
  | { type: "placeBid"; playerIndex: number; decision: BidDecision }
  | { type: "playCard"; playerIndex: number; card: Card };

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "placeBid":
      return applyPlaceBid(state, action.playerIndex, action.decision);
    case "playCard":
      return applyPlayCard(state, action.playerIndex, action.card);
  }
}

function applyPlaceBid(state: GameState, playerIndex: number, decision: BidDecision): GameState {
  if (state.phase !== "bidding") {
    throw new Error("placeBid is only allowed during the bidding phase");
  }

  const { bidding } = state;
  const expectedPlayer = bidding.order[bidding.currentIndex];
  if (playerIndex !== expectedPlayer) {
    throw new Error(`It is player ${expectedPlayer}'s turn to bid, not player ${playerIndex}`);
  }

  if (decision.type === "play") {
    const hand = state.players[playerIndex].hand;
    if (!callableSuits(hand).includes(decision.calledSuit)) {
      throw new Error(`Player ${playerIndex} cannot call ${decision.calledSuit}`);
    }

    const partnerIndex = state.players.findIndex((p) =>
      p.hand.some((c) => c.suit === decision.calledSuit && c.rank === "ass")
    );

    const activeGame: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: playerIndex,
      calledSuit: decision.calledSuit,
      partnerIndex,
    };

    return {
      ...state,
      phase: "playing",
      activeGame,
      bidding: { ...bidding, result: activeGame },
      currentTrick: { cards: [], leaderIndex: bidding.order[0] },
    };
  }

  const nextIndex = bidding.currentIndex + 1;
  if (nextIndex >= bidding.order.length) {
    return {
      ...state,
      phase: "roundEnd",
      bidding: { ...bidding, currentIndex: nextIndex, allPassed: true },
      scores: null,
    };
  }

  return {
    ...state,
    bidding: { ...bidding, currentIndex: nextIndex },
  };
}

function applyPlayCard(state: GameState, playerIndex: number, card: Card): GameState {
  if (state.phase !== "playing" || !state.activeGame) {
    throw new Error("playCard is only allowed during the playing phase");
  }

  const expectedPlayer = (state.currentTrick.leaderIndex + state.currentTrick.cards.length) % 4;
  if (playerIndex !== expectedPlayer) {
    throw new Error(`It is player ${expectedPlayer}'s turn to play, not player ${playerIndex}`);
  }

  const hand = state.players[playerIndex].hand;
  const allowed = legalMoves(hand, state.currentTrick.cards, "rufspiel", state.activeGame);
  if (!allowed.some((c) => cardEquals(c, card))) {
    throw new Error(`Card ${card.suit}-${card.rank} is not a legal move for player ${playerIndex}`);
  }

  const newHand = hand.filter((c) => !cardEquals(c, card));
  const players = state.players.map((p, i) => (i === playerIndex ? { ...p, hand: newHand } : p));
  const cards = [...state.currentTrick.cards, { playerIndex, card }];

  if (cards.length < 4) {
    return {
      ...state,
      players,
      currentTrick: { ...state.currentTrick, cards },
    };
  }

  const winner = trickWinner(cards, "rufspiel");
  const completedTricks = [...state.completedTricks, cards];

  if (completedTricks.length === 8) {
    const scores = calculateRoundScore(completedTricks, state.activeGame, "rufspiel");
    return {
      ...state,
      players,
      phase: "roundEnd",
      currentTrick: { cards: [], leaderIndex: winner },
      completedTricks,
      scores,
    };
  }

  return {
    ...state,
    players,
    currentTrick: { cards: [], leaderIndex: winner },
    completedTricks,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- actions`
Expected: PASS

- [ ] **Step 5: Run the full test suite and type check**

Run: `npm test`
Expected: all tests pass (existing 14 + new tests from this plan)

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/domain/engine/actions.ts src/domain/__tests__/actions.test.ts
git commit -m "feat: add bidding and play-card reducer actions"
```
