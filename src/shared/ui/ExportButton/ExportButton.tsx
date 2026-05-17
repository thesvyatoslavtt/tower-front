import { Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_TIMEOUT_MS = 3500;
const EXPORT_DELAY_MS = 2000;

type ExportFormat = "CSV" | "PDF";

interface ExportButtonProps {
  onExport?: (format: ExportFormat) => void;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  const handleExport = (format: ExportFormat) => {
    setOpen(false);
    setToast("Export started — file will download shortly");
    setTimeout(() => setToast(`${format} export complete`), EXPORT_DELAY_MS);
    onExport?.(format);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
      >
        <Download size={13} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={() => handleExport("CSV")}
            className="w-full px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-accent"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("PDF")}
            className="w-full border-t border-border px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-accent"
          >
            Export PDF
          </button>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-2.5 text-[13px] font-medium text-white shadow-lg"
          style={{ background: "var(--color-positive)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
