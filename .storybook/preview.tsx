import { configureStore, createSlice } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";

import type { Preview } from "@storybook/react";

import "../src/index.css";

// Minimal mock UI slice so Header's useAppSelector(state => state.ui.theme) works
// without depending on the real app store wiring.
const mockUiSlice = createSlice({
  name: "ui",
  initialState: { theme: "light" as "light" | "dark", sidebarCollapsed: false },
  reducers: {
    setTheme(state, action: { payload: "light" | "dark" }) {
      state.theme = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

const mockStore = configureStore({
  reducer: { ui: mockUiSlice.reducer },
});

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
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
