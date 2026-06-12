import { StyleSheet, Text, View } from "react-native";
import { TrickCard } from "../../domain/rules/trickEvaluation";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";
import { PlayingCard } from "../cards/PlayingCard";

interface TrickAreaProps {
  cards: TrickCard[];
  playerNames: string[];
}

export function TrickArea({ cards, playerNames }: TrickAreaProps) {
  return (
    <View style={styles.row}>
      {cards.map((tc) => (
        <View key={`${tc.playerIndex}-${tc.card.suit}-${tc.card.rank}`} style={styles.slot}>
          <Text style={styles.label}>{playerNames[tc.playerIndex]}</Text>
          <PlayingCard card={tc.card} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: spacing.md,
    minHeight: 110,
  },
  slot: {
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
