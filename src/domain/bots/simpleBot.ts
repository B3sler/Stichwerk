import { cardRank } from "../cards/ordering";
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
