import { Card } from "../cards/types";
import { GameState } from "../engine/gameState";
import { BidDecision } from "../rules/gameTypes";

export interface BotStrategy {
  decideBid(state: GameState, playerIndex: number): BidDecision;
  chooseCard(state: GameState, playerIndex: number): Card;
}
