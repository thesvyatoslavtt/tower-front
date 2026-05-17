
import { AIPanel } from "./AIPanel";
import { aiPanelMock } from "./AIPanel.mock";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Shared/AIPanel",
  component: AIPanel,
} satisfies Meta<typeof AIPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: aiPanelMock,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
