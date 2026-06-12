import { createPlayers, GameState } from "../engine/gameState";

describe("createPlayers", () => {
  it("creates 4 players with empty hands, ids and bot flags", () => {
    const players = createPlayers();
    expect(players).toHaveLength(4);
    expect(players[0]).toEqual({ id: "player-0", name: "Spieler 1", isBot: false, hand: [] });
    expect(players[1]).toEqual({ id: "player-1", name: "Spieler 2", isBot: true, hand: [] });
    expect(players.every((p, i) => (i === 0 ? !p.isBot : p.isBot))).toBe(true);
  });
});

describe("GameState type", () => {
  it("can represent a freshly dealt bidding-phase state", () => {
    const state: GameState = {
      phase: "bidding",
      players: createPlayers(),
      dealerIndex: 0,
      bidding: { order: [1, 2, 3, 0], currentIndex: 0, result: null, allPassed: false },
      activeGame: null,
      currentTrick: { cards: [], leaderIndex: 1 },
      completedTricks: [],
      scores: null,
    };
    expect(state.phase).toBe("bidding");
  });
});
