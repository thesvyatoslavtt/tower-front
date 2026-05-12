import { Home, Users } from "lucide-react";

import { ROUTES } from "@/shared/config/routes";

import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const MENU_ITEMS: MenuItem[] = [
  { label: "Home", path: ROUTES.home, icon: Home },
  { label: "People", path: ROUTES.people, icon: Users },
];
