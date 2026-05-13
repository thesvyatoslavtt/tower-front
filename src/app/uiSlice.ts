import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

export const THEME = {
  light: "light",
  dark: "dark",
} as const;

export type Theme = (typeof THEME)[keyof typeof THEME];

export const NEXT_THEME: Record<Theme, Theme> = {
  [THEME.light]: THEME.dark,
  [THEME.dark]: THEME.light,
};

export interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
}

const initialState: UiState = {
  theme: THEME.light,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setTheme, toggleSidebar } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
