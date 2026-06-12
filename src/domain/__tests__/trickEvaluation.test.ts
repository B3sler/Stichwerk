import { trickWinner } from "../rules/trickEvaluation";
import { Card } from "../cards/types";

function tc(playerIndex: number, card: Card) {
  return { playerIndex, card };
}

describe("trickWinner", () => {
  it("highest card of the led suit wins when no trump is played", () => {
    const trick = [
      tc(0, { suit: "schell", rank: "9" }),
      tc(1, { suit: "schell", rank: "ass" }),
      tc(2, { suit: "schell", rank: "7" }),
      tc(3, { suit: "schell", rank: "koenig" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(1);
  });

  it("a trump beats a higher non-trump card of the led suit", () => {
    const trick = [
      tc(0, { suit: "schell", rank: "ass" }),
      tc(1, { suit: "eichel", rank: "unter" }),
      tc(2, { suit: "schell", rank: "10" }),
      tc(3, { suit: "schell", rank: "koenig" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(1);
  });

  it("non-trump cards that don't follow suit cannot win", () => {
    const trick = [
      tc(0, { suit: "schell", rank: "8" }),
      tc(1, { suit: "eichel", rank: "ass" }),
      tc(2, { suit: "laub", rank: "ass" }),
      tc(3, { suit: "schell", rank: "7" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(0);
  });

  it("among multiple trumps the strongest trump order wins", () => {
    const trick = [
      tc(0, { suit: "herz", rank: "ass" }),
      tc(1, { suit: "eichel", rank: "unter" }),
      tc(2, { suit: "schell", rank: "ober" }),
      tc(3, { suit: "herz", rank: "unter" }),
    ];
    expect(trickWinner(trick, "rufspiel")).toBe(2);
  });
});
