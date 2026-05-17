import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

type StatBoxTone = "default" | "positive" | "negative" | "warning" | "info" | "purple" | "teal";

export interface StatBoxProps {
  label: ReactNode;
  value: string;
  tone?: StatBoxTone;
  sub?: string;
  delta?: number;
  icon?: ReactNode;
  onClick?: () => void;
}

const TONE_VAR: Record<StatBoxTone, string> = {
  default: "var(--color-foreground)",
  positive: "var(--color-positive)",
  negative: "var(--color-negative)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  purple: "var(--color-purple)",
  teal: "var(--color-teal)",
};

export const StatBox = ({
  label,
  value,
  tone = "default",
  sub,
  delta,
  icon,
  onClick,
}: StatBoxProps) => {
  const interactive = typeof onClick === "function";

  const className = cn(
    "rounded-xl border border-border bg-card p-4 text-left",
    interactive &&
      "cursor-pointer transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  const body = (
    <>
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-[11px] font-medium tracking-wide">
        {icon}
        <span>{label}</span>
      </div>

      <div
        className="font-mono text-[26px] leading-none font-bold tracking-tight tabular-nums"
        style={{ color: TONE_VAR[tone] }}
      >
        {value}
      </div>

      {sub && <div className="text-muted-foreground mt-1.5 text-[11px]">{sub}</div>}

      {delta != null && (
        <div
          className="mt-1 text-[11px] font-semibold"
          style={{
            color: delta >= 0 ? "var(--color-positive)" : "var(--color-negative)",
          }}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
        </div>
      )}
    </>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
};
