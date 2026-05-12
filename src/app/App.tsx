import { StoreProvider } from "@/app/providers/StoreProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

import { AppRouter } from "./router";

export function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </StoreProvider>
  );
}
