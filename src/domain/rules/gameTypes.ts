import { GameType } from "../cards/ordering";
import { Suit } from "../cards/types";

export type { GameType };

export interface ActiveGame {
  gameType: GameType;
  declarerIndex: number;
  calledSuit: Suit;
  partnerIndex: number;
}

export type BidDecision =
  | { type: "play"; calledSuit: Suit }
  | { type: "pass" };
