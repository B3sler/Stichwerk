import { useGameStore } from "../gameStore";
import { GameState } from "../../domain/engine/gameState";
import { ActiveGame } from "../../domain/rules/gameTypes";

function totalCardCount(game: GameState): number {
  const inHands = game.players.reduce((sum, p) => sum + p.hand.length, 0);
  const inCurrentTrick = game.currentTrick.cards.length;
  const inCompletedTricks = game.completedTricks.reduce((sum, t) => sum + t.length, 0);
  return inHands + inCurrentTrick + inCompletedTricks;
}

describe("useGameStore", () => {
  it("startNewRound deals a full 32-card game in the bidding phase", () => {
    useGameStore.getState().startNewRound(0, () => 0);
    const { game } = useGameStore.getState();
    expect(game.players).toHaveLength(4);
    expect(totalCardCount(game)).toBe(32);
    expect(["bidding", "playing", "roundEnd"]).toContain(game.phase);
  });

  it("placeBid by the human starts the playing phase and auto-plays subsequent bot turns", () => {
    const rufspiel: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "eichel",
      partnerIndex: 2,
    };
    const state: GameState = {
      phase: "bidding",
      players: [
        {
          id: "player-0",
          name: "Spieler 1",
          isBot: false,
          hand: [{ suit: "eichel", rank: "9" }, { suit: "schell", rank: "7" }],
        },
        {
          id: "player-1",
          name: "Spieler 2",
          isBot: true,
          hand: [{ suit: "laub", rank: "8" }, { suit: "schell", rank: "9" }],
        },
        {
          id: "player-2",
          name: "Spieler 3",
          isBot: true,
          hand: [{ suit: "eichel", rank: "ass" }, { suit: "laub", rank: "7" }],
        },
        {
          id: "player-3",
          name: "Spieler 4",
          isBot: true,
          hand: [{ suit: "schell", rank: "8" }, { suit: "herz", rank: "7" }],
        },
      ],
      dealerIndex: 3,
      bidding: { order: [1, 0, 2, 3], currentIndex: 1, result: null, allPassed: false },
      activeGame: null,
      currentTrick: { cards: [], leaderIndex: 1 },
      completedTricks: [],
      scores: null,
    };
    useGameStore.setState({ game: state });

    useGameStore.getState().placeBid({ type: "play", calledSuit: "eichel" });

    const { game } = useGameStore.getState();
    expect(game.phase).toBe("playing");
    expect(game.activeGame).toEqual(rufspiel);
    expect(game.currentTrick).toEqual({
      cards: [
        { playerIndex: 1, card: { suit: "laub", rank: "8" } },
        { playerIndex: 2, card: { suit: "laub", rank: "7" } },
        { playerIndex: 3, card: { suit: "schell", rank: "8" } },
      ],
      leaderIndex: 1,
    });
    expect(game.players[1].hand).toEqual([{ suit: "schell", rank: "9" }]);
    expect(game.players[2].hand).toEqual([{ suit: "eichel", rank: "ass" }]);
    expect(game.players[3].hand).toEqual([{ suit: "herz", rank: "7" }]);
    expect(game.players[0].hand).toEqual([
      { suit: "eichel", rank: "9" },
      { suit: "schell", rank: "7" },
    ]);
  });

  it("playCard by the human auto-plays subsequent bot turns within the trick", () => {
    const rufspiel: ActiveGame = {
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "schell",
      partnerIndex: 2,
    };
    const state: GameState = {
      phase: "playing",
      players: [
        {
          id: "player-0",
          name: "Spieler 1",
          isBot: false,
          hand: [{ suit: "eichel", rank: "koenig" }, { suit: "herz", rank: "7" }],
        },
        {
          id: "player-1",
          name: "Spieler 2",
          isBot: true,
          hand: [{ suit: "eichel", rank: "9" }, { suit: "laub", rank: "koenig" }],
        },
        {
          id: "player-2",
          name: "Spieler 3",
          isBot: true,
          hand: [{ suit: "eichel", rank: "8" }, { suit: "laub", rank: "9" }],
        },
        {
          id: "player-3",
          name: "Spieler 4",
          isBot: true,
          hand: [{ suit: "eichel", rank: "10" }, { suit: "laub", rank: "7" }],
        },
      ],
      dealerIndex: 0,
      bidding: { order: [1, 2, 3, 0], currentIndex: 4, result: rufspiel, allPassed: false },
      activeGame: rufspiel,
      currentTrick: { cards: [], leaderIndex: 0 },
      completedTricks: [],
      scores: null,
    };
    useGameStore.setState({ game: state });

    useGameStore.getState().playCard({ suit: "eichel", rank: "koenig" });

    const { game } = useGameStore.getState();
    expect(game.phase).toBe("playing");
    expect(game.completedTricks).toEqual([
      [
        { playerIndex: 0, card: { suit: "eichel", rank: "koenig" } },
        { playerIndex: 1, card: { suit: "eichel", rank: "9" } },
        { playerIndex: 2, card: { suit: "eichel", rank: "8" } },
        { playerIndex: 3, card: { suit: "eichel", rank: "10" } },
      ],
    ]);
    expect(game.currentTrick).toEqual({
      cards: [{ playerIndex: 3, card: { suit: "laub", rank: "7" } }],
      leaderIndex: 3,
    });
    expect(game.players[0].hand).toEqual([{ suit: "herz", rank: "7" }]);
    expect(game.players[1].hand).toEqual([{ suit: "laub", rank: "koenig" }]);
    expect(game.players[2].hand).toEqual([{ suit: "laub", rank: "9" }]);
    expect(game.players[3].hand).toEqual([]);
  });
});
