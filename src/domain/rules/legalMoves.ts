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
