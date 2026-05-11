// components/ui/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export type StatCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode; // explicitly telling TypeScript this is allowed
  trend?: string;
};

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}