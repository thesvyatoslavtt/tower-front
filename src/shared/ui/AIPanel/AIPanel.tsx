import { Eye, Play, Sparkles, X } from "lucide-react";
import { useState } from "react";

export interface AISuggestion {
  text: string;
  urgent?: boolean;
  warn?: boolean;
  action?: string;
  interactionId?: string;
}

export interface AIPanelProps {
  items: AISuggestion[];
  onAction?: (interactionId: string) => void;
}

const accentFor = (item: AISuggestion): string => {
  if (item.urgent) return "var(--color-negative)";
  if (item.warn) return "var(--color-warning)";

  return "var(--color-info)";
};

export const AIPanel = ({ items, onAction }: AIPanelProps) => {
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});

  if (!items.length) return null;

  const visible = items.filter((_, index) => !dismissed[index]);

  if (!visible.length) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="flex items-center gap-2 border-b border-border px-4 py-2.5"
        style={{ color: "var(--color-info)" }}
      >
        <Sparkles size={13} />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          AI Insights
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {visible.length} recommendation{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.map((item, index) => {
        if (dismissed[index]) return null;

        const accent = accentFor(item);

        return (
          <div
            key={item.interactionId ?? `${item.text}-${index}`}
            className="flex items-center gap-3 border-b border-border px-4 py-2.5 transition-opacity last:border-b-0"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            <span className="flex-shrink-0 text-[12px]" style={{ color: accent }}>
              {item.urgent ? "⚠" : "✧"}
            </span>

            <span className="flex-1 text-[12px] leading-relaxed text-muted-foreground">
              {item.text}
            </span>

            <div className="flex flex-shrink-0 gap-1.5">
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                  color: accent,
                  border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
                }}
                onClick={() => {
                  if (item.interactionId && onAction) {
                    onAction(item.interactionId);
                  }
                }}
              >
                {item.urgent ? <Play size={10} /> : <Eye size={10} />}
                {item.action || (item.urgent ? "Act Now" : "Review")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setDismissed((current) => ({
                    ...current,
                    [index]: true,
                  }))
                }
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Dismiss suggestion"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
