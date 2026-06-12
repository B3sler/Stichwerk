import { renderComponent } from "../../testUtils";
import { TrickArea } from "../TrickArea";

describe("TrickArea", () => {
  it("renders a card and player label for each card in the trick", () => {
    const json = JSON.stringify(
      renderComponent(
        <TrickArea
          cards={[
            { playerIndex: 0, card: { suit: "herz", rank: "ass" } },
            { playerIndex: 2, card: { suit: "laub", rank: "7" } },
          ]}
          playerNames={["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"]}
        />
      ).toJSON()
    );

    expect(json).toContain("Spieler 1");
    expect(json).toContain("Spieler 3");
    expect(json).toContain("A");
    expect(json).toContain("7");
  });

  it("renders nothing extra when the trick is empty", () => {
    const tree = renderComponent(<TrickArea cards={[]} playerNames={["a", "b", "c", "d"]} />);
    expect(tree.toJSON()).not.toBeNull();
  });
});
