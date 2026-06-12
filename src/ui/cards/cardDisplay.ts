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
