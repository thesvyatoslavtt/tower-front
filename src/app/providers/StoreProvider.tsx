import { Provider } from "react-redux";

import { store } from "@/app/store";

import type { ReactNode } from "react";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
