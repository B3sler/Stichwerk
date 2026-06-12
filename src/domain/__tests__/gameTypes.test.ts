import { ActiveGame, BidDecision } from "../rules/gameTypes";

describe("gameTypes", () => {
  it("allows constructing an ActiveGame for rufspiel", () => {
    const game: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "eichel",
      partnerIndex: 2,
    };
    expect(game.gameType).toBe("rufspiel");
  });

  it("allows constructing play and pass BidDecisions", () => {
    const play: BidDecision = { type: "play", calledSuit: "laub" };
    const pass: BidDecision = { type: "pass" };
    expect(play.type).toBe("play");
    expect(pass.type).toBe("pass");
  });
});
