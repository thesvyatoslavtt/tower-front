import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";

import { uiReducer } from "../src/app/uiSlice";

import type { Preview } from "@storybook/react";

import "../src/index.css";

const mockStore = configureStore({
  reducer: {
    ui: uiReducer,
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => {
      const initialRoute =
        (context.parameters.initialRoute as string | undefined) ?? "/";
      return (
        <Provider store={mockStore}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Story />
          </MemoryRouter>
        </Provider>
      );
    },
  ],
};

export default preview;
