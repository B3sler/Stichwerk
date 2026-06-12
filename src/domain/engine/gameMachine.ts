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
