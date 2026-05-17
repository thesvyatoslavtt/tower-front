import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions, icon }: PageHeaderProps) => (
  <div className="mb-6 flex items-start justify-between">
    <div>
      <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
        {icon}
        <span>{title}</span>
      </h1>

      {subtitle && <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>}
    </div>

    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
