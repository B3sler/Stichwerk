import { renderComponent } from "../../testUtils";
import { PlayingCard } from "../../cards/PlayingCard";
import { PlayerHand } from "../PlayerHand";

describe("PlayerHand", () => {
  const cards = [
    { suit: "eichel" as const, rank: "ass" as const },
    { suit: "herz" as const, rank: "7" as const },
  ];

  it("renders one PlayingCard per card in hand, disabled when there is no onPlay handler", () => {
    const tree = renderComponent(<PlayerHand cards={cards} />);
    const cardInstances = tree.root.findAllByType(PlayingCard);
    expect(cardInstances).toHaveLength(2);
    expect(cardInstances.every((c) => c.props.disabled)).toBe(true);
  });

  it("enables only legal cards and calls onPlay with the pressed card", () => {
    const onPlay = jest.fn();
    const tree = renderComponent(<PlayerHand cards={cards} legalCards={[cards[1]]} onPlay={onPlay} />);

    const cardInstances = tree.root.findAllByType(PlayingCard);
    const enabled = cardInstances.filter((c) => !c.props.disabled);
    expect(enabled).toHaveLength(1);

    enabled[0].props.onPress();
    expect(onPlay).toHaveBeenCalledWith(cards[1]);
  });
});
