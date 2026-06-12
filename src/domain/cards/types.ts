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
