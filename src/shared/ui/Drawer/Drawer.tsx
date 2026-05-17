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

export const Drawer = ({ isOpen, onClose, title, children, width = "w-96" }: DrawerProps) => {
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
          "border-border bg-background fixed top-0 right-0 z-50 flex h-screen flex-col border-l shadow-2xl transition-transform duration-200",
          width,
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="border-border flex flex-shrink-0 items-center justify-between border-b px-4 py-3">
          <span className="text-foreground text-[14px] font-bold">{title}</span>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 transition-colors"
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
