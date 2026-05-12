import { Outlet } from "react-router";

import { Header } from "@/widgets/Header";
import { Sidebar } from "@/widgets/Sidebar";

export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
