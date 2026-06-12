import { createDeck, shuffleDeck, dealCards } from "../cards/deck";
import { cardKey } from "../cards/types";

describe("createDeck", () => {
  it("creates 32 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(32);

    const unique = new Set(deck.map(cardKey));
    expect(unique.size).toBe(32);
  });
});

describe("shuffleDeck", () => {
  it("keeps the same set of cards but changes the order", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, () => 0);

    expect(shuffled).toHaveLength(32);
    expect(shuffled.map(cardKey).sort()).toEqual(deck.map(cardKey).sort());
    expect(shuffled).not.toEqual(deck);
  });
});

describe("dealCards", () => {
  it("deals 8 cards to each of 4 players", () => {
    const deck = createDeck();
    const hands = dealCards(deck);

    expect(hands).toHaveLength(4);
    hands.forEach((hand) => expect(hand).toHaveLength(8));

    const allDealt = hands.flat();
    expect(allDealt.map(cardKey).sort()).toEqual(deck.map(cardKey).sort());
  });
});
