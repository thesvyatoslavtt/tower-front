import { Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_TIMEOUT_MS = 3500;
const EXPORT_DELAY_MS = 2000;

type ExportFormat = "CSV" | "PDF";

export interface ExportButtonProps {
  onExport?: (format: ExportFormat) => void;
}

export const ExportButton = ({ onExport }: ExportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
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

  useEffect(
    () => () => {
      if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    },
    [],
  );

  const handleExport = (format: ExportFormat) => {
    setOpen(false);
    setToast("Export started — file will download shortly");

    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);

    exportTimerRef.current = setTimeout(
      () => setToast(`${format} export complete`),
      EXPORT_DELAY_MS,
    );

    onExport?.(format);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="border-border bg-card text-foreground hover:bg-accent flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors"
      >
        <Download size={13} />
        Export
      </button>

      {open && (
        <div className="border-border bg-card absolute top-full right-0 z-40 mt-1 w-36 overflow-hidden rounded-lg border shadow-lg">
          <button
            type="button"
            onClick={() => handleExport("CSV")}
            className="text-foreground hover:bg-accent w-full px-3 py-2 text-left text-[12px] transition-colors"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => handleExport("PDF")}
            className="border-border text-foreground hover:bg-accent w-full border-t px-3 py-2 text-left text-[12px] transition-colors"
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
};
