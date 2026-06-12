# UI & Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the playable Rufspiel table screen: card rendering, hand/trick/opponent UI, bidding controls, and round-result display, wired to `useGameStore` so a human can bid and play a full round against the three `simpleBotStrategy` bots.

**Architecture:** New `src/ui/cards/` holds pure display-mapping helpers and the `PlayingCard`/`CardBack` components. New `src/ui/game/` holds the game-table components (`PlayerHand`, `TrickArea`, `OpponentSeat`, `BiddingPanel`, `RoundResult`), each a "dumb" component receiving plain props — no direct store access. `src/app/index.tsx` becomes the Schafkopf table screen: it reads `useGameStore`, derives whose turn it is and which moves are legal (via existing `domain/rules` functions), and passes plain data/callbacks down to the `src/ui/game/` components. The screen uses the fixed dark forest-green palette from `src/theme/colors.ts` / `src/theme/tokens.ts` directly (plain `View`/`Text` + `StyleSheet`), not the light/dark `ThemedView`/`ThemedText` scaffolding, since the Schafkopf table always uses the dark theme in Phase 1.

**Tech Stack:** React Native components + `StyleSheet`, `react-test-renderer` (already available via `jest-expo`) for component smoke tests, existing `src/domain/rules/bidding.ts` (`callableSuits`) and `src/domain/rules/legalMoves.ts` (`legalMoves`) for turn logic.

---

## File Structure

- Create: `src/ui/cards/cardDisplay.ts` — suit symbols/colors and rank labels (pure, TDD).
- Create: `src/ui/cards/PlayingCard.tsx` — face-up card component.
- Create: `src/ui/cards/CardBack.tsx` — face-down card component.
- Create: `src/ui/game/PlayerHand.tsx` — horizontal row of the human's cards, disables illegal moves.
- Create: `src/ui/game/OpponentSeat.tsx` — bot name + stacked card backs.
- Create: `src/ui/game/TrickArea.tsx` — currently played trick cards with player labels.
- Create: `src/ui/game/BiddingPanel.tsx` — "call suit" / "pass" buttons during bidding.
- Create: `src/ui/game/RoundResult.tsx` — round score summary + "new round" button.
- Modify: `src/app/index.tsx` — Schafkopf table screen wiring all of the above to `useGameStore`.
- Test files: `src/ui/cards/__tests__/cardDisplay.test.ts`, `src/ui/cards/__tests__/PlayingCard.test.tsx`, `src/ui/game/__tests__/PlayerHand.test.tsx`, `src/ui/game/__tests__/TrickArea.test.tsx`, `src/ui/game/__tests__/BiddingPanel.test.tsx`, `src/ui/game/__tests__/RoundResult.test.tsx`.

---

### Task 1: Card display helpers

**Files:**
- Create: `src/ui/cards/cardDisplay.ts`
- Test: `src/ui/cards/__tests__/cardDisplay.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/ui/cards/__tests__/cardDisplay.test.ts
import { cardLabel, RANK_LABELS, SUIT_COLORS, SUIT_SYMBOLS } from "../cardDisplay";

describe("cardDisplay", () => {
  it("provides a symbol and color for every suit", () => {
    expect(SUIT_SYMBOLS.eichel).toBe("\u{1F330}");
    expect(SUIT_SYMBOLS.laub).toBe("\u{1F343}");
    expect(SUIT_SYMBOLS.herz).toBe("♥");
    expect(SUIT_SYMBOLS.schell).toBe("\u{1F514}");
    expect(SUIT_COLORS.herz).toBe("#b3433f");
  });

  it("provides a short label for every rank", () => {
    expect(RANK_LABELS.ass).toBe("A");
    expect(RANK_LABELS.koenig).toBe("K");
    expect(RANK_LABELS.ober).toBe("O");
    expect(RANK_LABELS.unter).toBe("U");
    expect(RANK_LABELS["10"]).toBe("10");
    expect(RANK_LABELS["7"]).toBe("7");
  });

  it("combines rank label and suit symbol into a card label", () => {
    expect(cardLabel({ suit: "herz", rank: "ass" })).toBe("A♥");
    expect(cardLabel({ suit: "eichel", rank: "unter" })).toBe("U\u{1F330}");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cardDisplay`
Expected: FAIL with "Cannot find module '../cardDisplay'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/ui/cards/cardDisplay.ts
import { Card, Rank, Suit } from "../../domain/cards/types";

export const SUIT_SYMBOLS: Record<Suit, string> = {
  eichel: "\u{1F330}",
  laub: "\u{1F343}",
  herz: "♥",
  schell: "\u{1F514}",
};

export const SUIT_COLORS: Record<Suit, string> = {
  eichel: "#b08552",
  laub: "#6fae5c",
  herz: "#b3433f",
  schell: "#e8c873",
};

export const RANK_LABELS: Record<Rank, string> = {
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  unter: "U",
  ober: "O",
  koenig: "K",
  ass: "A",
};

export function cardLabel(card: Card): string {
  return `${RANK_LABELS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cardDisplay`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/cards/cardDisplay.ts src/ui/cards/__tests__/cardDisplay.test.ts
git commit -m "feat: add card display helpers (suit symbols, colors, rank labels)"
```

---

### Task 2: PlayingCard component

**Files:**
- Create: `src/ui/testUtils.tsx` — shared `renderComponent` helper.
- Create: `src/ui/cards/PlayingCard.tsx`
- Test: `src/ui/cards/__tests__/PlayingCard.test.tsx`

Component tests in this codebase use `react-test-renderer`. Under the current React/RN versions, `create()` triggers a lazy module load that resolves on a microtask after the synchronous test body returns, which causes "trying to import a file after the Jest environment has been torn down" / "Can't access .root on unmounted test renderer" errors unless the render is wrapped in `act()`. The shared `renderComponent` helper below wraps `create()` in `act()` so every component test gets this for free.

- [x] **Step 1: Add the shared render helper**

```tsx
// src/ui/testUtils.tsx
import { ReactElement } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

export function renderComponent(element: ReactElement): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree;
}
```

- [x] **Step 2: Write the failing test**

```tsx
// src/ui/cards/__tests__/PlayingCard.test.tsx
import { renderComponent } from "../../testUtils";
import { PlayingCard } from "../PlayingCard";

describe("PlayingCard", () => {
  it("renders the rank label and suit symbol", () => {
    const json = JSON.stringify(renderComponent(<PlayingCard card={{ suit: "herz", rank: "ass" }} />).toJSON());
    expect(json).toContain("A");
    expect(json).toContain("♥");
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const tree = renderComponent(
      <PlayingCard card={{ suit: "eichel", rank: "7" }} onPress={onPress} testID="card-eichel-7" />
    );
    tree.root.findAllByProps({ testID: "card-eichel-7" })[0].props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disables onPress when disabled is true", () => {
    const onPress = jest.fn();
    const tree = renderComponent(
      <PlayingCard card={{ suit: "eichel", rank: "7" }} onPress={onPress} disabled testID="card-eichel-7" />
    );
    const node = tree.root.findAllByProps({ testID: "card-eichel-7" })[0];
    expect(node.props.disabled).toBe(true);
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run: `npm test -- PlayingCard`
Expected: FAIL with "Cannot find module '../PlayingCard'"

- [x] **Step 4: Write minimal implementation**

```tsx
// src/ui/cards/PlayingCard.tsx
import { Pressable, StyleSheet, Text } from "react-native";
import { Card } from "../../domain/cards/types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/tokens";
import { RANK_LABELS, SUIT_COLORS, SUIT_SYMBOLS } from "./cardDisplay";

interface PlayingCardProps {
  card: Card;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export function PlayingCard({ card, onPress, disabled, testID }: PlayingCardProps) {
  const suitColor = SUIT_COLORS[card.suit];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[styles.card, disabled && styles.cardDisabled]}>
      <Text style={[styles.rank, { color: suitColor }]}>{RANK_LABELS[card.rank]}</Text>
      <Text style={[styles.suit, { color: suitColor }]}>{SUIT_SYMBOLS[card.suit]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 56,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  rank: {
    fontSize: 20,
    fontWeight: "700",
  },
  suit: {
    fontSize: 24,
  },
});
```

- [x] **Step 5: Run test to verify it passes**

Run: `npm test -- PlayingCard`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/ui/cards/PlayingCard.tsx src/ui/cards/__tests__/PlayingCard.test.tsx src/ui/testUtils.tsx
git commit -m "feat: add PlayingCard component"
```

---

### Task 3: CardBack component

**Files:**
- Create: `src/ui/cards/CardBack.tsx`

No test for this task — it is a static, prop-less component (a styled `View`); Task 4's `OpponentSeat` smoke test exercises it indirectly.

- [x] **Step 1: Write the component**

```tsx
// src/ui/cards/CardBack.tsx
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/tokens";

export function CardBack() {
  return <View style={styles.card} />;
}

const styles = StyleSheet.create({
  card: {
    width: 40,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
```

- [x] **Step 2: Commit**

```bash
git add src/ui/cards/CardBack.tsx
git commit -m "feat: add CardBack component"
```

---

### Task 4: OpponentSeat component

**Files:**
- Create: `src/ui/game/OpponentSeat.tsx`

No dedicated test for this task — it's a thin composition of `CardBack` + `Text`; it's exercised by manual verification in Task 9.

- [ ] **Step 1: Write the component**

```tsx
// src/ui/game/OpponentSeat.tsx
import { StyleSheet, Text, View } from "react-native";
import { CardBack } from "../cards/CardBack";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";

interface OpponentSeatProps {
  name: string;
  cardCount: number;
  isCurrentTurn?: boolean;
}

export function OpponentSeat({ name, cardCount, isCurrentTurn }: OpponentSeatProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.name, isCurrentTurn && styles.nameActive]}>{name}</Text>
      <View style={styles.cards}>
        {Array.from({ length: cardCount }).map((_, index) => (
          <View key={index} style={index > 0 && styles.overlap}>
            <CardBack />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  nameActive: {
    color: colors.accent,
  },
  cards: {
    flexDirection: "row",
  },
  overlap: {
    marginLeft: -24,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/game/OpponentSeat.tsx
git commit -m "feat: add OpponentSeat component"
```

---

### Task 5: PlayerHand component

**Files:**
- Create: `src/ui/game/PlayerHand.tsx`
- Test: `src/ui/game/__tests__/PlayerHand.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/game/__tests__/PlayerHand.test.tsx
import { renderComponent } from "../../testUtils";
import { PlayingCard } from "../../cards/PlayingCard";
import { PlayerHand } from "../PlayerHand";

describe("PlayerHand", () => {
  const cards = [
    { suit: "eichel" as const, rank: "ass" as const },
    { suit: "herz" as const, rank: "7" as const },
  ];

  it("renders one PlayingCard per card in hand, disabled when there is no onPlay handler", () => {
    const tree = renderComponent(<PlayerHand cards={cards} />);
    const cardInstances = tree.root.findAllByType(PlayingCard);
    expect(cardInstances).toHaveLength(2);
    expect(cardInstances.every((c) => c.props.disabled)).toBe(true);
  });

  it("enables only legal cards and calls onPlay with the pressed card", () => {
    const onPlay = jest.fn();
    const tree = renderComponent(<PlayerHand cards={cards} legalCards={[cards[1]]} onPlay={onPlay} />);

    const cardInstances = tree.root.findAllByType(PlayingCard);
    const enabled = cardInstances.filter((c) => !c.props.disabled);
    expect(enabled).toHaveLength(1);

    enabled[0].props.onPress();
    expect(onPlay).toHaveBeenCalledWith(cards[1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PlayerHand`
Expected: FAIL with "Cannot find module '../PlayerHand'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/ui/game/PlayerHand.tsx
import { ScrollView, StyleSheet } from "react-native";
import { Card, cardEquals } from "../../domain/cards/types";
import { spacing } from "../../theme/tokens";
import { PlayingCard } from "../cards/PlayingCard";

interface PlayerHandProps {
  cards: Card[];
  legalCards?: Card[];
  onPlay?: (card: Card) => void;
}

export function PlayerHand({ cards, legalCards, onPlay }: PlayerHandProps) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
      {cards.map((card) => {
        const isLegal = !legalCards || legalCards.some((c) => cardEquals(c, card));
        const canPlay = isLegal && !!onPlay;
        return (
          <PlayingCard
            key={`${card.suit}-${card.rank}`}
            card={card}
            disabled={!canPlay}
            onPress={canPlay ? () => onPlay(card) : undefined}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PlayerHand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/game/PlayerHand.tsx src/ui/game/__tests__/PlayerHand.test.tsx
git commit -m "feat: add PlayerHand component with legal-move highlighting"
```

---

### Task 6: TrickArea component

**Files:**
- Create: `src/ui/game/TrickArea.tsx`
- Test: `src/ui/game/__tests__/TrickArea.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/game/__tests__/TrickArea.test.tsx
import { renderComponent } from "../../testUtils";
import { TrickArea } from "../TrickArea";

describe("TrickArea", () => {
  it("renders a card and player label for each card in the trick", () => {
    const json = JSON.stringify(
      renderComponent(
        <TrickArea
          cards={[
            { playerIndex: 0, card: { suit: "herz", rank: "ass" } },
            { playerIndex: 2, card: { suit: "laub", rank: "7" } },
          ]}
          playerNames={["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"]}
        />
      ).toJSON()
    );

    expect(json).toContain("Spieler 1");
    expect(json).toContain("Spieler 3");
    expect(json).toContain("A");
    expect(json).toContain("7");
  });

  it("renders nothing extra when the trick is empty", () => {
    const tree = renderComponent(<TrickArea cards={[]} playerNames={["a", "b", "c", "d"]} />);
    expect(tree.toJSON()).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TrickArea`
Expected: FAIL with "Cannot find module '../TrickArea'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/ui/game/TrickArea.tsx
import { StyleSheet, Text, View } from "react-native";
import { TrickCard } from "../../domain/rules/trickEvaluation";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";
import { PlayingCard } from "../cards/PlayingCard";

interface TrickAreaProps {
  cards: TrickCard[];
  playerNames: string[];
}

export function TrickArea({ cards, playerNames }: TrickAreaProps) {
  return (
    <View style={styles.row}>
      {cards.map((tc) => (
        <View key={`${tc.playerIndex}-${tc.card.suit}-${tc.card.rank}`} style={styles.slot}>
          <Text style={styles.label}>{playerNames[tc.playerIndex]}</Text>
          <PlayingCard card={tc.card} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: spacing.md,
    minHeight: 110,
  },
  slot: {
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TrickArea`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/game/TrickArea.tsx src/ui/game/__tests__/TrickArea.test.tsx
git commit -m "feat: add TrickArea component"
```

---

### Task 7: BiddingPanel component

**Files:**
- Create: `src/ui/game/BiddingPanel.tsx`
- Test: `src/ui/game/__tests__/BiddingPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/game/__tests__/BiddingPanel.test.tsx
import { Pressable } from "react-native";
import { renderComponent } from "../../testUtils";
import { BiddingPanel } from "../BiddingPanel";

describe("BiddingPanel", () => {
  it("renders one call-suit button per callable suit plus a pass button", () => {
    const tree = renderComponent(
      <BiddingPanel callableSuits={["eichel", "laub"]} onCallSuit={jest.fn()} onPass={jest.fn()} />
    );

    expect(tree.root.findAllByType(Pressable)).toHaveLength(3);
  });

  it("calls onCallSuit with the chosen suit and onPass when passing", () => {
    const onCallSuit = jest.fn();
    const onPass = jest.fn();
    const tree = renderComponent(
      <BiddingPanel callableSuits={["eichel"]} onCallSuit={onCallSuit} onPass={onPass} />
    );

    const buttons = tree.root.findAllByType(Pressable);
    buttons[0].props.onPress();
    expect(onCallSuit).toHaveBeenCalledWith("eichel");

    buttons[1].props.onPress();
    expect(onPass).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BiddingPanel`
Expected: FAIL with "Cannot find module '../BiddingPanel'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/ui/game/BiddingPanel.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Suit } from "../../domain/cards/types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/tokens";
import { SUIT_SYMBOLS } from "../cards/cardDisplay";

interface BiddingPanelProps {
  callableSuits: Suit[];
  onCallSuit: (suit: Suit) => void;
  onPass: () => void;
}

export function BiddingPanel({ callableSuits, onCallSuit, onPass }: BiddingPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Du bist am Reizen</Text>
      <View style={styles.row}>
        {callableSuits.map((suit) => (
          <Pressable key={suit} style={styles.button} onPress={() => onCallSuit(suit)}>
            <Text style={styles.buttonText}>Rufspiel {SUIT_SYMBOLS[suit]}</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.button, styles.passButton]} onPress={onPass}>
          <Text style={styles.buttonText}>Weiter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  heading: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  passButton: {
    borderColor: colors.textMuted,
  },
  buttonText: {
    color: colors.text,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BiddingPanel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/game/BiddingPanel.tsx src/ui/game/__tests__/BiddingPanel.test.tsx
git commit -m "feat: add BiddingPanel component"
```

---

### Task 8: RoundResult component

**Files:**
- Create: `src/ui/game/RoundResult.tsx`
- Test: `src/ui/game/__tests__/RoundResult.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/game/__tests__/RoundResult.test.tsx
import { renderComponent } from "../../testUtils";
import { RoundResult } from "../RoundResult";
import { RoundScore } from "../../../domain/rules/scoring";

describe("RoundResult", () => {
  const score: RoundScore = {
    declarerTeamPoints: 100,
    opponentTeamPoints: 0,
    declarerTeamWon: true,
    schneider: true,
    schwarz: true,
    laufende: 0,
    tarif: 30,
  };

  it("shows the points, outcome and tarif when a game was played", () => {
    const json = JSON.stringify(renderComponent(<RoundResult score={score} onNewRound={() => {}} />).toJSON());
    expect(json).toContain("100");
    expect(json).toContain("Schneider");
    expect(json).toContain("Schwarz");
    expect(json).toContain("30");
  });

  it("shows a fallback message when everyone passed", () => {
    const json = JSON.stringify(renderComponent(<RoundResult score={null} onNewRound={() => {}} />).toJSON());
    expect(json).toContain("gepasst");
  });

  it("calls onNewRound when the button is pressed", () => {
    const onNewRound = jest.fn();
    const tree = renderComponent(<RoundResult score={null} onNewRound={onNewRound} />);
    tree.root.findAllByProps({ testID: "new-round-button" })[0].props.onPress();
    expect(onNewRound).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- RoundResult`
Expected: FAIL with "Cannot find module '../RoundResult'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/ui/game/RoundResult.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RoundScore } from "../../domain/rules/scoring";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/tokens";

interface RoundResultProps {
  score: RoundScore | null;
  onNewRound: () => void;
}

export function RoundResult({ score, onNewRound }: RoundResultProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Runde beendet</Text>
      {score ? (
        <View style={styles.stats}>
          <Text style={styles.text}>Spielerpartei: {score.declarerTeamPoints} Augen</Text>
          <Text style={styles.text}>Gegenpartei: {score.opponentTeamPoints} Augen</Text>
          <Text style={styles.text}>
            {score.declarerTeamWon ? "Spielerpartei gewinnt" : "Gegenpartei gewinnt"}
          </Text>
          {score.schneider && <Text style={styles.text}>Schneider</Text>}
          {score.schwarz && <Text style={styles.text}>Schwarz</Text>}
          {score.laufende > 0 && <Text style={styles.text}>Laufende: {score.laufende}</Text>}
          <Text style={styles.tarif}>Tarif: {score.tarif}</Text>
        </View>
      ) : (
        <Text style={styles.text}>Alle Spieler haben gepasst.</Text>
      )}
      <Pressable testID="new-round-button" style={styles.button} onPress={onNewRound}>
        <Text style={styles.buttonText}>Neue Runde</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  stats: {
    alignItems: "center",
    gap: spacing.xs,
  },
  text: {
    color: colors.text,
  },
  tarif: {
    color: colors.accent,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.backgroundDark,
    fontWeight: "700",
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- RoundResult`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/game/RoundResult.tsx src/ui/game/__tests__/RoundResult.test.tsx
git commit -m "feat: add RoundResult component"
```

---

### Task 9: Schafkopf table screen

**Files:**
- Modify: `src/app/index.tsx`

This task wires the components from Tasks 1-8 to `useGameStore`. There is no automated test for the screen itself (it requires the Expo Router navigation context); verify it manually with `npm run web` per Step 3 below.

- [ ] **Step 1: Replace the screen implementation**

Replace the entire contents of `src/app/index.tsx` with:

```tsx
// src/app/index.tsx
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { callableSuits } from "../domain/rules/bidding";
import { legalMoves } from "../domain/rules/legalMoves";
import { useGameStore } from "../state/gameStore";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { BiddingPanel } from "../ui/game/BiddingPanel";
import { OpponentSeat } from "../ui/game/OpponentSeat";
import { PlayerHand } from "../ui/game/PlayerHand";
import { RoundResult } from "../ui/game/RoundResult";
import { TrickArea } from "../ui/game/TrickArea";

const HUMAN_INDEX = 0;

export default function GameScreen() {
  const game = useGameStore((state) => state.game);
  const placeBid = useGameStore((state) => state.placeBid);
  const playCard = useGameStore((state) => state.playCard);
  const startNewRound = useGameStore((state) => state.startNewRound);

  const human = game.players[HUMAN_INDEX];
  const opponents = game.players.filter((_, index) => index !== HUMAN_INDEX);

  const isHumanBidTurn =
    game.phase === "bidding" && game.bidding.order[game.bidding.currentIndex] === HUMAN_INDEX;
  const isHumanPlayTurn =
    game.phase === "playing" &&
    (game.currentTrick.leaderIndex + game.currentTrick.cards.length) % 4 === HUMAN_INDEX;

  const legal = isHumanPlayTurn
    ? legalMoves(human.hand, game.currentTrick.cards, "rufspiel", game.activeGame)
    : undefined;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Schafkopf</Text>

        <View style={styles.opponents}>
          {opponents.map((player) => (
            <OpponentSeat key={player.id} name={player.name} cardCount={player.hand.length} />
          ))}
        </View>

        <TrickArea cards={game.currentTrick.cards} playerNames={game.players.map((p) => p.name)} />

        {game.phase === "bidding" && isHumanBidTurn && (
          <BiddingPanel
            callableSuits={callableSuits(human.hand)}
            onCallSuit={(suit) => placeBid({ type: "play", calledSuit: suit })}
            onPass={() => placeBid({ type: "pass" })}
          />
        )}

        {game.phase === "roundEnd" && (
          <RoundResult score={game.scores} onNewRound={() => startNewRound((game.dealerIndex + 1) % 4)} />
        )}

        <PlayerHand cards={human.hand} legalCards={legal} onPlay={isHumanPlayTurn ? playCard : undefined} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  title: {
    textAlign: "center",
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  opponents: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
```

- [ ] **Step 2: Run the full test suite and type check**

Run: `npm test`
Expected: all tests pass (existing tests + new component tests from this plan)

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run web`

In the browser:
- Confirm the table renders: title, three opponent seats with stacked card backs, an (empty) trick area, and the human's hand at the bottom.
- If it's the human's turn to bid, confirm the `BiddingPanel` shows a "Rufspiel <suit>" button per callable suit plus a "Weiter" button, and tapping one starts the playing phase (bots resolve automatically; trick area and opponents' card counts update).
- If it's the human's turn to play, confirm only legal cards in the hand are enabled (non-legal cards appear dimmed) and tapping one plays it, with bots auto-playing their turns afterwards.
- Play through to `roundEnd` and confirm `RoundResult` shows the score/tarif (or the "alle Spieler haben gepasst" message if everyone passed), and that "Neue Runde" deals a fresh round.

- [ ] **Step 4: Commit**

```bash
git add src/app/index.tsx
git commit -m "feat: wire Schafkopf table screen to game store"
```
