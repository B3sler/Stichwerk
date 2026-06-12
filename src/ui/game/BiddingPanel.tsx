import { Pressable, StyleSheet, Text, View } from "react-native";
import { Suit } from "../../domain/cards/types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/tokens";
import { SUIT_SYMBOLS } from "../cards/cardDisplay";

interface BiddingPanelProps {
  callableSuits: Suit[];
  onCallSuit: (suit: Suit) => void;
  onPass: () => void;
}

export function BiddingPanel({ callableSuits, onCallSuit, onPass }: BiddingPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Du bist am Reizen</Text>
      <View style={styles.row}>
        {callableSuits.map((suit) => (
          <Pressable
            key={suit}
            testID={`bidding-call-${suit}`}
            style={styles.button}
            onPress={() => onCallSuit(suit)}>
            <Text style={styles.buttonText}>Rufspiel {SUIT_SYMBOLS[suit]}</Text>
          </Pressable>
        ))}
        <Pressable testID="bidding-pass" style={[styles.button, styles.passButton]} onPress={onPass}>
          <Text style={styles.buttonText}>Weiter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  heading: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  passButton: {
    borderColor: colors.textMuted,
  },
  buttonText: {
    color: colors.text,
  },
});
