import { calculateLaufende, calculateRoundScore, DEFAULT_SCORING_CONFIG } from "../rules/scoring";
import { TrickCard } from "../rules/trickEvaluation";
import { ActiveGame } from "../rules/gameTypes";
import { Card } from "../cards/types";
import { rufspielTrumpOrder } from "../cards/ordering";

const rufspiel: ActiveGame = {
  gameType: "rufspiel",
  declarerIndex: 0,
  calledSuit: "eichel",
  partnerIndex: 2,
};

function trick(cards: [number, Card][]): TrickCard[] {
  return cards.map(([playerIndex, card]) => ({ playerIndex, card }));
}

describe("calculateLaufende", () => {
  it("counts consecutive top trumps held by one team, starting from Eichel-Ober", () => {
    const trumps = rufspielTrumpOrder();
    const tricks: TrickCard[][] = [
      trick([
        [0, trumps[0]],
        [1, { suit: "schell", rank: "7" }],
        [2, trumps[1]],
        [3, { suit: "schell", rank: "8" }],
      ]),
      trick([
        [0, trumps[2]],
        [1, trumps[3]],
        [2, { suit: "laub", rank: "7" }],
        [3, { suit: "laub", rank: "8" }],
      ]),
    ];
    expect(calculateLaufende(tricks, "rufspiel", 0, 2)).toBe(3);
  });

  it("returns 0 when fewer than the threshold of consecutive top trumps are held by one team", () => {
    const trumps = rufspielTrumpOrder();
    const tricks: TrickCard[][] = [
      trick([
        [0, trumps[0]],
        [1, trumps[1]],
        [2, { suit: "schell", rank: "7" }],
        [3, { suit: "schell", rank: "8" }],
      ]),
    ];
    expect(calculateLaufende(tricks, "rufspiel", 0, 2)).toBe(0);
  });
});

describe("calculateRoundScore", () => {
  it("computes a simple win with base tarif and no schneider/schwarz/laufende", () => {
    const tricks: TrickCard[][] = [
      trick([
        [0, { suit: "eichel", rank: "ass" }],
        [1, { suit: "schell", rank: "7" }],
        [2, { suit: "laub", rank: "7" }],
        [3, { suit: "schell", rank: "8" }],
      ]),
      trick([
        [1, { suit: "herz", rank: "unter" }],
        [0, { suit: "schell", rank: "koenig" }],
        [2, { suit: "schell", rank: "ass" }],
        [3, { suit: "schell", rank: "10" }],
      ]),
    ];

    const score = calculateRoundScore(tricks, rufspiel, "rufspiel", DEFAULT_SCORING_CONFIG);

    expect(score.declarerTeamPoints).toBe(11);
    expect(score.opponentTeamPoints).toBe(27);
    expect(score.declarerTeamWon).toBe(false);
    expect(score.schneider).toBe(false);
    expect(score.schwarz).toBe(false);
    expect(score.laufende).toBe(0);
    expect(score.tarif).toBe(DEFAULT_SCORING_CONFIG.baseValue);
  });

  it("applies schneider and schwarz when one team takes (almost) all Augen", () => {
    // Each trick is won by player 2 (declarer team) via a Herz trump; the other three
    // players each contribute a high-value non-trump card of a different suit.
    const tricks: TrickCard[][] = [
      trick([
        [1, { suit: "eichel", rank: "ass" }],
        [3, { suit: "laub", rank: "ass" }],
        [0, { suit: "schell", rank: "ass" }],
        [2, { suit: "herz", rank: "ass" }],
      ]),
      trick([
        [1, { suit: "eichel", rank: "10" }],
        [3, { suit: "laub", rank: "10" }],
        [0, { suit: "schell", rank: "10" }],
        [2, { suit: "herz", rank: "10" }],
      ]),
      trick([
        [1, { suit: "eichel", rank: "koenig" }],
        [3, { suit: "laub", rank: "koenig" }],
        [0, { suit: "schell", rank: "koenig" }],
        [2, { suit: "herz", rank: "koenig" }],
      ]),
    ];

    const score = calculateRoundScore(tricks, rufspiel, "rufspiel", DEFAULT_SCORING_CONFIG);

    expect(score.declarerTeamPoints).toBe(100);
    expect(score.opponentTeamPoints).toBe(0);
    expect(score.declarerTeamWon).toBe(true);
    expect(score.schneider).toBe(true);
    expect(score.schwarz).toBe(true);
    expect(score.laufende).toBe(0);
    expect(score.tarif).toBe(
      DEFAULT_SCORING_CONFIG.baseValue + DEFAULT_SCORING_CONFIG.schneiderValue + DEFAULT_SCORING_CONFIG.schwarzValue
    );
  });
});
