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
