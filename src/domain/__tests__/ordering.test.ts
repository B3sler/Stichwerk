import { createDeck } from "../cards/deck";
import {
  cardPoints,
  cardRank,
  isTrump,
  rufspielTrumpOrder,
} from "../cards/ordering";

describe("cardPoints", () => {
  it("returns correct Augen values per rank", () => {
    expect(cardPoints({ suit: "eichel", rank: "ass" })).toBe(11);
    expect(cardPoints({ suit: "eichel", rank: "10" })).toBe(10);
    expect(cardPoints({ suit: "eichel", rank: "koenig" })).toBe(4);
    expect(cardPoints({ suit: "eichel", rank: "ober" })).toBe(3);
    expect(cardPoints({ suit: "eichel", rank: "unter" })).toBe(2);
    expect(cardPoints({ suit: "eichel", rank: "9" })).toBe(0);
    expect(cardPoints({ suit: "eichel", rank: "8" })).toBe(0);
    expect(cardPoints({ suit: "eichel", rank: "7" })).toBe(0);
  });

  it("sums to 120 Augen across the whole deck", () => {
    const total = createDeck().reduce((sum, card) => sum + cardPoints(card), 0);
    expect(total).toBe(120);
  });
});

describe("rufspielTrumpOrder", () => {
  it("contains 14 trumps: 4 Ober, 4 Unter, 6 Herz", () => {
    const order = rufspielTrumpOrder();
    expect(order).toHaveLength(14);
    expect(order.filter((c) => c.rank === "ober")).toHaveLength(4);
    expect(order.filter((c) => c.rank === "unter")).toHaveLength(4);
    expect(
      order.filter((c) => c.suit === "herz" && c.rank !== "ober" && c.rank !== "unter")
    ).toHaveLength(6);
  });

  it("ranks Eichel-Ober as the strongest trump", () => {
    expect(rufspielTrumpOrder()[0]).toEqual({ suit: "eichel", rank: "ober" });
  });

  it("ranks Herz-7 as the weakest trump", () => {
    const order = rufspielTrumpOrder();
    expect(order[order.length - 1]).toEqual({ suit: "herz", rank: "7" });
  });
});

describe("isTrump", () => {
  it("treats every Ober and Unter as trump", () => {
    expect(isTrump({ suit: "schell", rank: "ober" }, "rufspiel")).toBe(true);
    expect(isTrump({ suit: "laub", rank: "unter" }, "rufspiel")).toBe(true);
  });

  it("treats Herz cards (non Ober/Unter) as trump", () => {
    expect(isTrump({ suit: "herz", rank: "ass" }, "rufspiel")).toBe(true);
    expect(isTrump({ suit: "herz", rank: "7" }, "rufspiel")).toBe(true);
  });

  it("does not treat plain color cards as trump", () => {
    expect(isTrump({ suit: "eichel", rank: "ass" }, "rufspiel")).toBe(false);
    expect(isTrump({ suit: "laub", rank: "7" }, "rufspiel")).toBe(false);
  });
});

describe("cardRank", () => {
  it("ranks Eichel-Ober higher than Schell-Ober", () => {
    const eichelOber = cardRank({ suit: "eichel", rank: "ober" }, "rufspiel");
    const schellOber = cardRank({ suit: "schell", rank: "ober" }, "rufspiel");
    expect(eichelOber).toBeGreaterThan(schellOber);
  });

  it("ranks every trump higher than every non-trump", () => {
    const herzSeven = cardRank({ suit: "herz", rank: "7" }, "rufspiel");
    const eichelAss = cardRank({ suit: "eichel", rank: "ass" }, "rufspiel");
    expect(herzSeven).toBeGreaterThan(eichelAss);
  });

  it("ranks Ass higher than Koenig within the same non-trump color", () => {
    const ass = cardRank({ suit: "laub", rank: "ass" }, "rufspiel");
    const koenig = cardRank({ suit: "laub", rank: "koenig" }, "rufspiel");
    expect(ass).toBeGreaterThan(koenig);
  });
});
