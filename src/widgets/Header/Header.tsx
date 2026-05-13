import { Moon, Sun } from "lucide-react";

import { NEXT_THEME, THEME, setTheme } from "@/app/uiSlice";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { cn } from "@/shared/lib/utils";

export function Header() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  const handleToggleTheme = () => {
    dispatch(setTheme(NEXT_THEME[theme]));
  };

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4",
        "bg-[var(--color-card)] text-[var(--color-card-foreground)]",
      )}
    >
      <div className="font-semibold">Tower v2</div>

      <button
        type="button"
        onClick={handleToggleTheme}
        className="rounded-md p-2 hover:bg-[var(--color-accent)]"
        aria-label="Toggle theme"
      >
        {theme === THEME.light ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
}
