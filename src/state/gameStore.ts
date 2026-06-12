import { create } from "zustand";
import { simpleBotStrategy } from "../domain/bots/simpleBot";
import { Card } from "../domain/cards/types";
import { applyAction } from "../domain/engine/actions";
import { createInitialGameState } from "../domain/engine/gameMachine";
import { GameState } from "../domain/engine/gameState";
import { BidDecision } from "../domain/rules/gameTypes";

const HUMAN_PLAYER_INDEX = 0;

function currentActor(state: GameState): number {
  if (state.phase === "bidding") {
    return state.bidding.order[state.bidding.currentIndex];
  }
  return (state.currentTrick.leaderIndex + state.currentTrick.cards.length) % 4;
}

function runBotTurns(state: GameState): GameState {
  let current = state;
  while (current.phase !== "roundEnd" && current.players[currentActor(current)].isBot) {
    const actor = currentActor(current);
    if (current.phase === "bidding") {
      const decision = simpleBotStrategy.decideBid(current, actor);
      current = applyAction(current, { type: "placeBid", playerIndex: actor, decision });
    } else {
      const card = simpleBotStrategy.chooseCard(current, actor);
      current = applyAction(current, { type: "playCard", playerIndex: actor, card });
    }
  }
  return current;
}

interface GameStore {
  game: GameState;
  startNewRound: (dealerIndex?: number, rng?: () => number) => void;
  placeBid: (decision: BidDecision) => void;
  playCard: (card: Card) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: runBotTurns(createInitialGameState(0)),
  startNewRound: (dealerIndex = 0, rng = Math.random) => {
    set({ game: runBotTurns(createInitialGameState(dealerIndex, rng)) });
  },
  placeBid: (decision) => {
    const next = applyAction(get().game, {
      type: "placeBid",
      playerIndex: HUMAN_PLAYER_INDEX,
      decision,
    });
    set({ game: runBotTurns(next) });
  },
  playCard: (card) => {
    const next = applyAction(get().game, {
      type: "playCard",
      playerIndex: HUMAN_PLAYER_INDEX,
      card,
    });
    set({ game: runBotTurns(next) });
  },
}));
