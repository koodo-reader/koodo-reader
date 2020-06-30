import React from "react";
import { render } from "@testing-library/react";

import { Provider } from "react-redux";
import About from "../";
import store from "../../../redux/store";

describe("<About />", () => {
  it("should render about info", () => {
    const { container } = render(
      <Provider store={store}>
        <About />
      </Provider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
