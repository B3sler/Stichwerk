import { callableSuits, canPlayRufspiel } from "../rules/bidding";
import { Card } from "../cards/types";

describe("callableSuits", () => {
  it("includes a suit when the player has a non-trump card of it but not its ace", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "9" },
      { suit: "herz", rank: "7" },
    ];
    expect(callableSuits(hand)).toEqual(["eichel"]);
  });

  it("excludes a suit when the player already holds its ace", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "eichel", rank: "9" },
    ];
    expect(callableSuits(hand)).toEqual([]);
  });

  it("excludes a suit when the player only has trump cards (ober/unter) of it", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ober" },
      { suit: "eichel", rank: "unter" },
    ];
    expect(callableSuits(hand)).toEqual([]);
  });

  it("never includes herz, since it is always trump in rufspiel", () => {
    const hand: Card[] = [{ suit: "herz", rank: "9" }];
    expect(callableSuits(hand)).toEqual([]);
  });

  it("can return multiple callable suits", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "9" },
      { suit: "laub", rank: "8" },
      { suit: "schell", rank: "ass" },
    ];
    expect(callableSuits(hand)).toEqual(["eichel", "laub"]);
  });
});

describe("canPlayRufspiel", () => {
  it("is true when at least one suit is callable", () => {
    const hand: Card[] = [{ suit: "eichel", rank: "9" }];
    expect(canPlayRufspiel(hand)).toBe(true);
  });

  it("is false when no suit is callable", () => {
    const hand: Card[] = [
      { suit: "eichel", rank: "ass" },
      { suit: "laub", rank: "ass" },
      { suit: "schell", rank: "ass" },
      { suit: "herz", rank: "7" },
    ];
    expect(canPlayRufspiel(hand)).toBe(false);
  });
});
