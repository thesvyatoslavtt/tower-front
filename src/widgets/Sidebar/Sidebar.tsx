import { NavLink } from "react-router";

import { cn } from "@/shared/lib/utils";

import { MENU_ITEMS } from "./menuItems";

export const Sidebar = () => (
  <aside
    className={cn(
      "w-56 shrink-0 border-r border-[var(--color-border)]",
      "bg-[var(--color-card)] text-[var(--color-card-foreground)]",
    )}
  >
    <nav className="flex flex-col gap-1 p-3">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                "hover:bg-[var(--color-accent)]",
                isActive && "bg-[var(--color-accent)] font-medium",
              )
            }
          >
            <Icon size={16} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  </aside>
);
