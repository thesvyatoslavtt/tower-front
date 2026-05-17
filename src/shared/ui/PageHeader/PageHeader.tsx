import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  actions,
  icon,
}: PageHeaderProps) => {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
          {icon}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
