import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  width = "w-96",
}: DrawerProps) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close drawer backdrop"
          className="fixed inset-0 z-50 bg-black/50"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen flex-col border-l border-border bg-background shadow-2xl transition-transform duration-200",
          width,
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[14px] font-bold text-foreground">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </>
  );
};
