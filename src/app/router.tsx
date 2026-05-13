import { createBrowserRouter, RouterProvider } from "react-router";

import { AppLayout } from "@/widgets/AppLayout";

function HomePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Tower v2</h1>
      <p className="text-[var(--color-muted-foreground)]">
        Bootstrap complete. Modules will be added per docs/roadmap.md.
      </p>
    </div>
  );
}

function PeoplePlaceholder() {
  return <div className="text-[var(--color-muted-foreground)]">People module — TODO</div>;
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "people", element: <PeoplePlaceholder /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
