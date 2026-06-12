import { Card } from "../cards/types";
import { TrickCard } from "../rules/trickEvaluation";
import { ActiveGame } from "../rules/gameTypes";
import { RoundScore } from "../rules/scoring";

export type Phase = "bidding" | "playing" | "roundEnd";

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
}

export interface Trick {
  cards: TrickCard[];
  leaderIndex: number;
}

export interface BiddingState {
  order: number[];
  currentIndex: number;
  result: ActiveGame | null;
  allPassed: boolean;
}

export interface GameState {
  phase: Phase;
  players: Player[];
  dealerIndex: number;
  bidding: BiddingState;
  activeGame: ActiveGame | null;
  currentTrick: Trick;
  completedTricks: TrickCard[][];
  scores: RoundScore | null;
}

const PLAYER_NAMES = ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"];

export function createPlayers(): Player[] {
  return PLAYER_NAMES.map((name, index) => ({
    id: `player-${index}`,
    name,
    isBot: index !== 0,
    hand: [],
  }));
}
