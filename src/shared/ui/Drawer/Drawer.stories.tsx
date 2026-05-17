
import { Drawer } from "./Drawer";
import { drawerMock } from "./Drawer.mock";

import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Shared/Drawer",
  component: Drawer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    ...drawerMock,
    onClose: () => undefined,
    children: (
      <div className="text-sm text-muted-foreground">
        Drawer content goes here. Press Escape or click the backdrop to close.
      </div>
    ),
  },
};

export const Closed: Story = {
  args: {
    ...drawerMock,
    isOpen: false,
    onClose: () => undefined,
    children: <div>hidden</div>,
  },
};
