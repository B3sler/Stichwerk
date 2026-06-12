import { Pressable, StyleSheet, Text, View } from "react-native";
import { RoundScore } from "../../domain/rules/scoring";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/tokens";

interface RoundResultProps {
  score: RoundScore | null;
  onNewRound: () => void;
}

export function RoundResult({ score, onNewRound }: RoundResultProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Runde beendet</Text>
      {score ? (
        <View style={styles.stats}>
          <Text style={styles.text}>Spielerpartei: {score.declarerTeamPoints} Augen</Text>
          <Text style={styles.text}>Gegenpartei: {score.opponentTeamPoints} Augen</Text>
          <Text style={styles.text}>
            {score.declarerTeamWon ? "Spielerpartei gewinnt" : "Gegenpartei gewinnt"}
          </Text>
          {score.schneider && <Text style={styles.text}>Schneider</Text>}
          {score.schwarz && <Text style={styles.text}>Schwarz</Text>}
          {score.laufende > 0 && <Text style={styles.text}>Laufende: {score.laufende}</Text>}
          <Text style={styles.tarif}>Tarif: {score.tarif}</Text>
        </View>
      ) : (
        <Text style={styles.text}>Alle Spieler haben gepasst.</Text>
      )}
      <Pressable testID="new-round-button" style={styles.button} onPress={onNewRound}>
        <Text style={styles.buttonText}>Neue Runde</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  stats: {
    alignItems: "center",
    gap: spacing.xs,
  },
  text: {
    color: colors.text,
  },
  tarif: {
    color: colors.accent,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.backgroundDark,
    fontWeight: "700",
  },
});
