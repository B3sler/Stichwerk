import { createInitialGameState } from "../engine/gameMachine";

describe("createInitialGameState", () => {
  it("deals 8 cards to each of the 4 players", () => {
    const state = createInitialGameState(0, () => 0);
    expect(state.players).toHaveLength(4);
    for (const player of state.players) {
      expect(player.hand).toHaveLength(8);
    }
  });

  it("deals all 32 distinct cards across the players", () => {
    const state = createInitialGameState(0, () => 0);
    const allCards = state.players.flatMap((p) => p.hand);
    expect(allCards).toHaveLength(32);
    const uniqueKeys = new Set(allCards.map((c) => `${c.suit}-${c.rank}`));
    expect(uniqueKeys.size).toBe(32);
  });

  it("sets the bidding order to start with the player right of the dealer", () => {
    const state = createInitialGameState(1, () => 0);
    expect(state.bidding.order).toEqual([2, 3, 0, 1]);
    expect(state.bidding.currentIndex).toBe(0);
    expect(state.bidding.result).toBeNull();
    expect(state.bidding.allPassed).toBe(false);
  });

  it("starts in the bidding phase with the first bidder as initial trick leader", () => {
    const state = createInitialGameState(2, () => 0);
    expect(state.phase).toBe("bidding");
    expect(state.dealerIndex).toBe(2);
    expect(state.currentTrick).toEqual({ cards: [], leaderIndex: 3 });
    expect(state.activeGame).toBeNull();
    expect(state.completedTricks).toEqual([]);
    expect(state.scores).toBeNull();
  });
});
