import { applyAction } from "../engine/actions";
import { GameState, Player } from "../engine/gameState";
import { ActiveGame } from "../rules/gameTypes";
import { TrickCard } from "../rules/trickEvaluation";
import { Card } from "../cards/types";

function player(id: number, hand: Card[], isBot = id !== 0): Player {
  return { id: `player-${id}`, name: `Spieler ${id + 1}`, isBot, hand };
}

function makeBiddingState(): GameState {
  return {
    phase: "bidding",
    players: [
      player(0, [{ suit: "eichel", rank: "9" }, { suit: "herz", rank: "7" }]),
      player(1, [{ suit: "schell", rank: "7" }]),
      player(2, [{ suit: "eichel", rank: "ass" }]),
      player(3, [{ suit: "laub", rank: "7" }]),
    ],
    dealerIndex: 3,
    bidding: { order: [0, 1, 2, 3], currentIndex: 0, result: null, allPassed: false },
    activeGame: null,
    currentTrick: { cards: [], leaderIndex: 0 },
    completedTricks: [],
    scores: null,
  };
}

const rufspielGame: ActiveGame = {
  gameType: "rufspiel",
  declarerIndex: 0,
  calledSuit: "schell",
  partnerIndex: 2,
};

function makePlayingState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "playing",
    players: [
      player(0, [{ suit: "eichel", rank: "8" }]),
      player(1, [{ suit: "eichel", rank: "7" }]),
      player(2, [{ suit: "eichel", rank: "ass" }]),
      player(3, [{ suit: "eichel", rank: "10" }]),
    ],
    dealerIndex: 3,
    bidding: { order: [0, 1, 2, 3], currentIndex: 0, result: rufspielGame, allPassed: false },
    activeGame: rufspielGame,
    currentTrick: { cards: [], leaderIndex: 0 },
    completedTricks: [],
    scores: null,
    ...overrides,
  };
}

describe("applyAction - placeBid", () => {
  it("starts the playing phase when a player announces rufspiel", () => {
    const state = makeBiddingState();
    const next = applyAction(state, {
      type: "placeBid",
      playerIndex: 0,
      decision: { type: "play", calledSuit: "eichel" },
    });

    expect(next.phase).toBe("playing");
    expect(next.activeGame).toEqual({
      gameType: "rufspiel",
      declarerIndex: 0,
      calledSuit: "eichel",
      partnerIndex: 2,
    });
    expect(next.bidding.result).toEqual(next.activeGame);
    expect(next.currentTrick).toEqual({ cards: [], leaderIndex: 0 });
  });

  it("advances to the next bidder on pass", () => {
    const state = makeBiddingState();
    const next = applyAction(state, {
      type: "placeBid",
      playerIndex: 0,
      decision: { type: "pass" },
    });

    expect(next.phase).toBe("bidding");
    expect(next.bidding.currentIndex).toBe(1);
    expect(next.activeGame).toBeNull();
  });

  it("ends the round with allPassed when every player passes", () => {
    let state = makeBiddingState();
    for (const playerIndex of [0, 1, 2, 3]) {
      state = applyAction(state, { type: "placeBid", playerIndex, decision: { type: "pass" } });
    }

    expect(state.phase).toBe("roundEnd");
    expect(state.bidding.allPassed).toBe(true);
    expect(state.scores).toBeNull();
  });

  it("throws if a player bids out of turn", () => {
    const state = makeBiddingState();
    expect(() =>
      applyAction(state, { type: "placeBid", playerIndex: 1, decision: { type: "pass" } })
    ).toThrow();
  });

  it("throws if a player calls a suit they cannot legally call", () => {
    const state = makeBiddingState();
    expect(() =>
      applyAction(state, {
        type: "placeBid",
        playerIndex: 0,
        decision: { type: "play", calledSuit: "schell" },
      })
    ).toThrow();
  });
});

describe("applyAction - playCard", () => {
  it("throws when not in the playing phase", () => {
    const state = makeBiddingState();
    expect(() =>
      applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "9" } })
    ).toThrow();
  });

  it("throws when it is not the player's turn", () => {
    const state = makePlayingState();
    expect(() =>
      applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "eichel", rank: "7" } })
    ).toThrow();
  });

  it("throws when the card is not a legal move", () => {
    const state = makePlayingState({
      players: [
        player(0, [{ suit: "eichel", rank: "8" }]),
        player(1, [{ suit: "schell", rank: "8" }, { suit: "herz", rank: "7" }]),
        player(2, [{ suit: "eichel", rank: "ass" }]),
        player(3, [{ suit: "eichel", rank: "10" }]),
      ],
      currentTrick: { cards: [{ playerIndex: 0, card: { suit: "schell", rank: "7" } }], leaderIndex: 0 },
    });
    expect(() =>
      applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "herz", rank: "7" } })
    ).toThrow();
  });

  it("plays a card, removing it from the hand and adding it to the current trick", () => {
    const state = makePlayingState();
    const next = applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "8" } });

    expect(next.players[0].hand).toEqual([]);
    expect(next.currentTrick.cards).toEqual([{ playerIndex: 0, card: { suit: "eichel", rank: "8" } }]);
    expect(next.phase).toBe("playing");
  });

  it("completes a trick and sets the next leader to the trick winner", () => {
    let state = makePlayingState();
    state = applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "8" } });
    state = applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "eichel", rank: "7" } });
    state = applyAction(state, { type: "playCard", playerIndex: 2, card: { suit: "eichel", rank: "ass" } });
    state = applyAction(state, { type: "playCard", playerIndex: 3, card: { suit: "eichel", rank: "10" } });

    expect(state.completedTricks).toHaveLength(1);
    expect(state.currentTrick).toEqual({ cards: [], leaderIndex: 2 }); // eichel ass wins
    expect(state.phase).toBe("playing");
    expect(state.players.every((p) => p.hand.length === 0)).toBe(true);
  });

  it("ends the round and computes scores after the 8th trick", () => {
    const dummyTrick: TrickCard[] = [
      { playerIndex: 0, card: { suit: "laub", rank: "7" } },
      { playerIndex: 1, card: { suit: "laub", rank: "8" } },
      { playerIndex: 2, card: { suit: "laub", rank: "9" } },
      { playerIndex: 3, card: { suit: "laub", rank: "10" } },
    ];
    let state = makePlayingState({ completedTricks: Array.from({ length: 7 }, () => dummyTrick) });

    state = applyAction(state, { type: "playCard", playerIndex: 0, card: { suit: "eichel", rank: "8" } });
    state = applyAction(state, { type: "playCard", playerIndex: 1, card: { suit: "eichel", rank: "7" } });
    state = applyAction(state, { type: "playCard", playerIndex: 2, card: { suit: "eichel", rank: "ass" } });
    state = applyAction(state, { type: "playCard", playerIndex: 3, card: { suit: "eichel", rank: "10" } });

    expect(state.phase).toBe("roundEnd");
    expect(state.completedTricks).toHaveLength(8);
    expect(state.scores).toEqual({
      declarerTeamPoints: 21,
      opponentTeamPoints: 70,
      declarerTeamWon: false,
      schneider: false,
      schwarz: false,
      laufende: 0,
      tarif: 10,
    });
  });
});
