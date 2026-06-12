import { cardLabel, RANK_LABELS, SUIT_COLORS, SUIT_SYMBOLS } from "../cardDisplay";

describe("cardDisplay", () => {
  it("provides a symbol and color for every suit", () => {
    expect(SUIT_SYMBOLS.eichel).toBe("\u{1F330}");
    expect(SUIT_SYMBOLS.laub).toBe("\u{1F343}");
    expect(SUIT_SYMBOLS.herz).toBe("♥");
    expect(SUIT_SYMBOLS.schell).toBe("\u{1F514}");
    expect(SUIT_COLORS.herz).toBe("#b3433f");
  });

  it("provides a short label for every rank", () => {
    expect(RANK_LABELS.ass).toBe("A");
    expect(RANK_LABELS.koenig).toBe("K");
    expect(RANK_LABELS.ober).toBe("O");
    expect(RANK_LABELS.unter).toBe("U");
    expect(RANK_LABELS["10"]).toBe("10");
    expect(RANK_LABELS["7"]).toBe("7");
  });

  it("combines rank label and suit symbol into a card label", () => {
    expect(cardLabel({ suit: "herz", rank: "ass" })).toBe("A♥");
    expect(cardLabel({ suit: "eichel", rank: "unter" })).toBe("U\u{1F330}");
  });
});
