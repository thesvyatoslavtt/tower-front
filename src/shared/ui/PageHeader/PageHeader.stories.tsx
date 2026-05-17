
import { PageHeader } from "./PageHeader";
import { pageHeaderMock } from "./PageHeader.mock";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Shared/PageHeader",
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: pageHeaderMock,
};

export const WithActions: Story = {
  args: {
    ...pageHeaderMock,
    actions: (
      <button
        type="button"
        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground"
      >
        Export
      </button>
    ),
  },
};
