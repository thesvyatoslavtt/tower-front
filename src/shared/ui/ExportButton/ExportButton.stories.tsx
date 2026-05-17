
import { ExportButton } from "./ExportButton";
import { exportButtonMock } from "./ExportButton.mock";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Shared/ExportButton",
  component: ExportButton,
} satisfies Meta<typeof ExportButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: exportButtonMock,
};
