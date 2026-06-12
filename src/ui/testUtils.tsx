import { ReactElement } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

export function renderComponent(element: ReactElement): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree;
}
