import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/tokens";

export function CardBack() {
  return <View style={styles.card} />;
}

const styles = StyleSheet.create({
  card: {
    width: 40,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
