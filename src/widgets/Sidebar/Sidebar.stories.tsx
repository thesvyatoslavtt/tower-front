import { Sidebar } from "./Sidebar";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Widgets/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActivePeople: Story = {
  parameters: { initialRoute: "/people" },
};

export const ActiveHome: Story = {
  parameters: { initialRoute: "/" },
};
