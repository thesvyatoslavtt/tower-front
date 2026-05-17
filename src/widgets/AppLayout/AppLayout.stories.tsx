import { Route, Routes } from "react-router";

import { AppLayout } from "./AppLayout";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Widgets/AppLayout",
  component: AppLayout,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

const withOutlet = (content: React.ReactNode) => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={content} />
      <Route path="/people" element={content} />
    </Route>
  </Routes>
);

export const Default: Story = {
  render: () =>
    withOutlet(
      <div className="border-border rounded-md border p-6">
        <h1 className="text-xl font-semibold">Home</h1>
        <p className="text-muted-foreground text-sm">Outlet content goes here.</p>
      </div>,
    ),
};

export const EmptyOutlet: Story = {
  render: () => withOutlet(null),
};

export const LongContent: Story = {
  render: () =>
    withOutlet(
      <div className="space-y-4">
        {Array.from({ length: 40 }).map((_, idx) => (
          <p key={idx} className="text-sm">
            Row {idx + 1} — scroll to see the layout overflow behavior.
          </p>
        ))}
      </div>,
    ),
};
