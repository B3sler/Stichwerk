import { Card, Suit } from "../cards/types";

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
