import { renderComponent } from "../../testUtils";
import { RoundResult } from "../RoundResult";
import { RoundScore } from "../../../domain/rules/scoring";

describe("RoundResult", () => {
  const score: RoundScore = {
    declarerTeamPoints: 100,
    opponentTeamPoints: 0,
    declarerTeamWon: true,
    schneider: true,
    schwarz: true,
    laufende: 0,
    tarif: 30,
  };

  it("shows the points, outcome and tarif when a game was played", () => {
    const json = JSON.stringify(renderComponent(<RoundResult score={score} onNewRound={() => {}} />).toJSON());
    expect(json).toContain("100");
    expect(json).toContain("Schneider");
    expect(json).toContain("Schwarz");
    expect(json).toContain("30");
  });

  it("shows a fallback message when everyone passed", () => {
    const json = JSON.stringify(renderComponent(<RoundResult score={null} onNewRound={() => {}} />).toJSON());
    expect(json).toContain("gepasst");
  });

  it("calls onNewRound when the button is pressed", () => {
    const onNewRound = jest.fn();
    const tree = renderComponent(<RoundResult score={null} onNewRound={onNewRound} />);
    tree.root.findAllByProps({ testID: "new-round-button" })[0].props.onPress();
    expect(onNewRound).toHaveBeenCalled();
  });
});
