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
