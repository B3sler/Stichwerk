import { legalMoves } from "../rules/legalMoves";
import { TrickCard } from "../rules/trickEvaluation";
import { ActiveGame } from "../rules/gameTypes";
import { Card } from "../cards/types";

const rufspiel: ActiveGame = {
  gameType: "rufspiel",
  declarerIndex: 0,
  calledSuit: "eichel",
  partnerIndex: 2,
};

describe("legalMoves", () => {
  it("allows any card when leading an empty trick", () => {
    const hand: Card[] = [
      { suit: "schell", rank: "7" },
      { suit: "herz", rank: "ass" },
      { suit: "eichel", rank: "10" },
    ];
    const result = legalMoves(hand, [], "rufspiel", null);
    expect(result).toEqual(hand);
  });

  it("must follow the led non-trump suit if possible", () => {
    const hand: Card[] = [
      { suit: "schell", rank: "7" },
      { suit: "schell", rank: "koenig" },
      { suit: "herz", rank: "ass" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "schell", rank: "9" } }];
    const result = legalMoves(hand, trick, "rufspiel", null);
    expect(result).toEqual([
      { suit: "schell", rank: "7" },
      { suit: "schell", rank: "koenig" },
    ]);
  });

  it("must follow with trump if a trump is led and trumps are held", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ober" },
      { suit: "schell", rank: "7" },
      { suit: "herz", rank: "8" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "unter" } }];
    const result = legalMoves(hand, trick, "rufspiel", null);
    expect(result).toEqual([
      { suit: "eichel", rank: "ober" },
      { suit: "herz", rank: "8" },
    ]);
  });

  it("allows any card if the hand cannot follow suit or trump", () => {
    const hand: Card[] = [
      { suit: "schell", rank: "7" },
      { suit: "laub", rank: "ass" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "unter" } }];
    const result = legalMoves(hand, trick, "rufspiel", null);
    expect(result).toEqual(hand);
  });

  it("forbids discarding the called ace when following the called suit with other cards available", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "8" },
      { suit: "herz", rank: "7" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "9" } }];
    const result = legalMoves(hand, trick, "rufspiel", rufspiel);
    expect(result).toEqual([{ suit: "eichel", rank: "8" }]);
  });

  it("allows playing the called ace when it is the only card of the called suit", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "herz", rank: "7" },
    ];
    const trick: TrickCard[] = [{ playerIndex: 3, card: { suit: "eichel", rank: "9" } }];
    const result = legalMoves(hand, trick, "rufspiel", rufspiel);
    expect(result).toEqual([{ suit: "eichel", rank: "ass" }]);
  });

  it("does not restrict the called ace when leading a trick", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "8" },
    ];
    const result = legalMoves(hand, [], "rufspiel", rufspiel);
    expect(result).toEqual(hand);
  });
});
