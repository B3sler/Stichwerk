import { renderComponent } from "../../testUtils";
import { PlayingCard } from "../PlayingCard";

describe("PlayingCard", () => {
  it("renders the rank label and suit symbol", () => {
    const json = JSON.stringify(renderComponent(<PlayingCard card={{ suit: "herz", rank: "ass" }} />).toJSON());
    expect(json).toContain("A");
    expect(json).toContain("♥");
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const tree = renderComponent(
      <PlayingCard card={{ suit: "eichel", rank: "7" }} onPress={onPress} testID="card-eichel-7" />
    );
    tree.root.findAllByProps({ testID: "card-eichel-7" })[0].props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disables onPress when disabled is true", () => {
    const onPress = jest.fn();
    const tree = renderComponent(
      <PlayingCard card={{ suit: "eichel", rank: "7" }} onPress={onPress} disabled testID="card-eichel-7" />
    );
    const node = tree.root.findAllByProps({ testID: "card-eichel-7" })[0];
    expect(node.props.disabled).toBe(true);
  });
});
