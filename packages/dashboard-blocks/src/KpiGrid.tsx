import type { ReactNode } from "react";
import { cn } from "@vizora/utils";
import { KpiCard } from "./KpiCard";
import type { KpiCardProps } from "./KpiCard";

export type KpiGridProps = {
  items: KpiCardProps[];
  columns?: number;
  className?: string;
  children?: ReactNode;
};

export function KpiGrid(props: KpiGridProps) {
  const { items, columns = 4, className, children } = props;
  return (
    <div
      className={cn("vz-kpi-grid", className)}
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(960 / columns)}px, 1fr))`,
      }}
    >
      {items.map((item, i) => (
        <KpiCard key={item.label + i} {...item} />
      ))}
      {children}
    </div>
  );
}
