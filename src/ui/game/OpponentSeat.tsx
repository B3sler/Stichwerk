import { StyleSheet, Text, View } from "react-native";
import { CardBack } from "../cards/CardBack";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";

interface OpponentSeatProps {
  name: string;
  cardCount: number;
  isCurrentTurn?: boolean;
}

export function OpponentSeat({ name, cardCount, isCurrentTurn }: OpponentSeatProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.name, isCurrentTurn && styles.nameActive]}>{name}</Text>
      <View style={styles.cards}>
        {Array.from({ length: cardCount }).map((_, index) => (
          <View key={index} style={index > 0 && styles.overlap}>
            <CardBack />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  nameActive: {
    color: colors.accent,
  },
  cards: {
    flexDirection: "row",
  },
  overlap: {
    marginLeft: -24,
  },
});
