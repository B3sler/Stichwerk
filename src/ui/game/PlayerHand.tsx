import { ScrollView, StyleSheet } from "react-native";
import { Card, cardEquals } from "../../domain/cards/types";
import { spacing } from "../../theme/tokens";
import { PlayingCard } from "../cards/PlayingCard";

interface PlayerHandProps {
  cards: Card[];
  legalCards?: Card[];
  onPlay?: (card: Card) => void;
}

export function PlayerHand({ cards, legalCards, onPlay }: PlayerHandProps) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
      {cards.map((card) => {
        const isLegal = !legalCards || legalCards.some((c) => cardEquals(c, card));
        const canPlay = isLegal && !!onPlay;
        return (
          <PlayingCard
            key={`${card.suit}-${card.rank}`}
            card={card}
            disabled={!canPlay}
            onPress={canPlay ? () => onPlay(card) : undefined}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
