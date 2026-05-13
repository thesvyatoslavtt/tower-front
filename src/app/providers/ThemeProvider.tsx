import { useEffect } from "react";

import { useAppSelector } from "@/app/store";
import { THEME } from "@/app/uiSlice";

import type { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(THEME.dark, theme === THEME.dark);
  }, [theme]);

  return <>{children}</>;
}
