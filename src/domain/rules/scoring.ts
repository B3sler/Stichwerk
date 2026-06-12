import { cardKey } from "../cards/types";
import { GameType, cardPoints, rufspielTrumpOrder } from "../cards/ordering";
import { TrickCard, trickWinner } from "./trickEvaluation";
import { ActiveGame } from "./gameTypes";

export interface ScoringConfig {
  baseValue: number;
  schneiderValue: number;
  schwarzValue: number;
  laufendeValue: number;
  laufendeThreshold: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  baseValue: 10,
  schneiderValue: 10,
  schwarzValue: 10,
  laufendeValue: 10,
  laufendeThreshold: 3,
};

export interface RoundScore {
  declarerTeamPoints: number;
  opponentTeamPoints: number;
  declarerTeamWon: boolean;
  schneider: boolean;
  schwarz: boolean;
  laufende: number;
  tarif: number;
}

export function calculateLaufende(
  completedTricks: TrickCard[][],
  gameType: GameType,
  declarerIndex: number,
  partnerIndex: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  const cardOwner = new Map<string, number>();
  for (const trick of completedTricks) {
    for (const tc of trick) {
      cardOwner.set(cardKey(tc.card), tc.playerIndex);
    }
  }

  const declarerTeam = new Set([declarerIndex, partnerIndex]);
  const trumps = rufspielTrumpOrder();

  let count = 0;
  let teamIsDeclarer: boolean | null = null;
  for (const trump of trumps) {
    const owner = cardOwner.get(cardKey(trump));
    if (owner === undefined) break;
    const ownerIsDeclarerTeam = declarerTeam.has(owner);
    if (teamIsDeclarer === null) {
      teamIsDeclarer = ownerIsDeclarerTeam;
    } else if (ownerIsDeclarerTeam !== teamIsDeclarer) {
      break;
    }
    count++;
  }

  return count >= config.laufendeThreshold ? count : 0;
}

export function calculateRoundScore(
  completedTricks: TrickCard[][],
  activeGame: ActiveGame,
  gameType: GameType,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): RoundScore {
  const declarerTeam = new Set([activeGame.declarerIndex, activeGame.partnerIndex]);

  let declarerTeamPoints = 0;
  let opponentTeamPoints = 0;
  for (const trick of completedTricks) {
    const winner = trickWinner(trick, gameType);
    const points = trick.reduce((sum, tc) => sum + cardPoints(tc.card), 0);
    if (declarerTeam.has(winner)) {
      declarerTeamPoints += points;
    } else {
      opponentTeamPoints += points;
    }
  }

  const declarerTeamWon = declarerTeamPoints > 60;
  const schneider = declarerTeamWon ? declarerTeamPoints >= 91 : opponentTeamPoints >= 91;
  const schwarz = declarerTeamWon ? opponentTeamPoints === 0 : declarerTeamPoints === 0;
  const laufende = calculateLaufende(completedTricks, gameType, activeGame.declarerIndex, activeGame.partnerIndex, config);

  let tarif = config.baseValue;
  if (schneider) tarif += config.schneiderValue;
  if (schwarz) tarif += config.schwarzValue;
  if (laufende > 0) tarif += laufende * config.laufendeValue;

  return {
    declarerTeamPoints,
    opponentTeamPoints,
    declarerTeamWon,
    schneider,
    schwarz,
    laufende,
    tarif,
  };
}
