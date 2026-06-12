import { Pressable, StyleSheet, Text } from "react-native";
import { Card } from "../../domain/cards/types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/tokens";
import { RANK_LABELS, SUIT_COLORS, SUIT_SYMBOLS } from "./cardDisplay";

interface PlayingCardProps {
  card: Card;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export function PlayingCard({ card, onPress, disabled, testID }: PlayingCardProps) {
  const suitColor = SUIT_COLORS[card.suit];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[styles.card, disabled && styles.cardDisabled]}>
      <Text style={[styles.rank, { color: suitColor }]}>{RANK_LABELS[card.rank]}</Text>
      <Text style={[styles.suit, { color: suitColor }]}>{SUIT_SYMBOLS[card.suit]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 56,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  rank: {
    fontSize: 20,
    fontWeight: "700",
  },
  suit: {
    fontSize: 24,
  },
});
