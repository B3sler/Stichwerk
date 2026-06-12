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
