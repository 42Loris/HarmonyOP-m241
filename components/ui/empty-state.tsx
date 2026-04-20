import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl",
      className
    )}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950 mb-6">
        <Icon className="h-10 w-10 text-slate-400 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-8">
        {description}
      </p>
      {action && (
        <Button asChild>
          <Link href={action.href}>
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}