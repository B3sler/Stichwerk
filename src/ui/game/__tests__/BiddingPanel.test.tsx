import { renderComponent } from "../../testUtils";
import { BiddingPanel } from "../BiddingPanel";

describe("BiddingPanel", () => {
  it("renders one call-suit button per callable suit plus a pass button", () => {
    const tree = renderComponent(
      <BiddingPanel callableSuits={["eichel", "laub"]} onCallSuit={jest.fn()} onPass={jest.fn()} />
    );

    expect(tree.root.findAllByProps({ testID: "bidding-call-eichel" })[0]).toBeTruthy();
    expect(tree.root.findAllByProps({ testID: "bidding-call-laub" })[0]).toBeTruthy();
    expect(tree.root.findAllByProps({ testID: "bidding-pass" })[0]).toBeTruthy();
  });

  it("calls onCallSuit with the chosen suit and onPass when passing", () => {
    const onCallSuit = jest.fn();
    const onPass = jest.fn();
    const tree = renderComponent(
      <BiddingPanel callableSuits={["eichel"]} onCallSuit={onCallSuit} onPass={onPass} />
    );

    tree.root.findAllByProps({ testID: "bidding-call-eichel" })[0].props.onPress();
    expect(onCallSuit).toHaveBeenCalledWith("eichel");

    tree.root.findAllByProps({ testID: "bidding-pass" })[0].props.onPress();
    expect(onPass).toHaveBeenCalled();
  });
});
