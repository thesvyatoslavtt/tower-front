
import { StatBox } from "./StatBox";
import { statBoxMock, statBoxWithDeltaMock } from "./StatBox.mock";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Shared/StatBox",
  component: StatBox,
} satisfies Meta<typeof StatBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: statBoxMock,
};

export const WithDelta: Story = {
  args: statBoxWithDeltaMock,
};

export const Interactive: Story = {
  args: {
    ...statBoxMock,
    onClick: () => undefined,
  },
};
