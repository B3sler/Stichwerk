import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { callableSuits } from "../domain/rules/bidding";
import { legalMoves } from "../domain/rules/legalMoves";
import { useGameStore } from "../state/gameStore";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { BiddingPanel } from "../ui/game/BiddingPanel";
import { OpponentSeat } from "../ui/game/OpponentSeat";
import { PlayerHand } from "../ui/game/PlayerHand";
import { RoundResult } from "../ui/game/RoundResult";
import { TrickArea } from "../ui/game/TrickArea";

const HUMAN_INDEX = 0;

export default function GameScreen() {
  const game = useGameStore((state) => state.game);
  const placeBid = useGameStore((state) => state.placeBid);
  const playCard = useGameStore((state) => state.playCard);
  const startNewRound = useGameStore((state) => state.startNewRound);

  const human = game.players[HUMAN_INDEX];
  const opponents = game.players.filter((_, index) => index !== HUMAN_INDEX);

  const isHumanBidTurn =
    game.phase === "bidding" && game.bidding.order[game.bidding.currentIndex] === HUMAN_INDEX;
  const isHumanPlayTurn =
    game.phase === "playing" &&
    (game.currentTrick.leaderIndex + game.currentTrick.cards.length) % 4 === HUMAN_INDEX;

  const legal = isHumanPlayTurn
    ? legalMoves(human.hand, game.currentTrick.cards, "rufspiel", game.activeGame)
    : undefined;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Schafkopf</Text>

        <View style={styles.opponents}>
          {opponents.map((player) => (
            <OpponentSeat key={player.id} name={player.name} cardCount={player.hand.length} />
          ))}
        </View>

        <TrickArea cards={game.currentTrick.cards} playerNames={game.players.map((p) => p.name)} />

        {game.phase === "bidding" && isHumanBidTurn && (
          <BiddingPanel
            callableSuits={callableSuits(human.hand)}
            onCallSuit={(suit) => placeBid({ type: "play", calledSuit: suit })}
            onPass={() => placeBid({ type: "pass" })}
          />
        )}

        {game.phase === "roundEnd" && (
          <RoundResult score={game.scores} onNewRound={() => startNewRound((game.dealerIndex + 1) % 4)} />
        )}

        <PlayerHand cards={human.hand} legalCards={legal} onPlay={isHumanPlayTurn ? playCard : undefined} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  title: {
    textAlign: "center",
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  opponents: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
