import { simpleBotStrategy } from "../bots/simpleBot";
import { createInitialGameState } from "../engine/gameMachine";
import { ActiveGame } from "../rules/gameTypes";

describe("simpleBotStrategy.decideBid", () => {
  it("plays rufspiel with the first callable suit when possible", () => {
    const state = createInitialGameState(0, () => 0);
    state.players[1].hand = [
      { suit: "eichel", rank: "9" },
      { suit: "herz", rank: "7" },
    ];
    expect(simpleBotStrategy.decideBid(state, 1)).toEqual({ type: "play", calledSuit: "eichel" });
  });

  it("passes when no suit is callable", () => {
    const state = createInitialGameState(0, () => 0);
    state.players[1].hand = [
      { suit: "eichel", rank: "ass" },
      { suit: "laub", rank: "ass" },
      { suit: "schell", rank: "ass" },
      { suit: "herz", rank: "7" },
    ];
    expect(simpleBotStrategy.decideBid(state, 1)).toEqual({ type: "pass" });
  });
});

describe("simpleBotStrategy.chooseCard", () => {
  const rufspiel: ActiveGame = {
    gameType: "rufspiel",
    declarerIndex: 0,
    calledSuit: "schell",
    partnerIndex: 2,
  };

  it("plays the weakest legal card", () => {
    const state = createInitialGameState(0, () => 0);
    state.activeGame = rufspiel;
    state.players[1].hand = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "7" },
    ];
    state.currentTrick = { cards: [], leaderIndex: 1 };
    expect(simpleBotStrategy.chooseCard(state, 1)).toEqual({ suit: "eichel", rank: "7" });
  });

  it("prefers a non-trump card over a trump when both are legal", () => {
    const state = createInitialGameState(0, () => 0);
    state.activeGame = rufspiel;
    state.players[1].hand = [
      { suit: "herz", rank: "7" },
      { suit: "laub", rank: "7" },
    ];
    state.currentTrick = { cards: [], leaderIndex: 1 };
    expect(simpleBotStrategy.chooseCard(state, 1)).toEqual({ suit: "laub", rank: "7" });
  });
});
