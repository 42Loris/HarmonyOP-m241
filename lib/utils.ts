import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Task = {
  id: string;
  taskType: string;
  status: string;
};

export function calculateProgressRatio(tasks: Task[]): number {
  const employeeTasks = tasks.filter(
    (t) => t.taskType === "TRAINING" || t.taskType === "HR_ADMIN"
  );
  
  if (employeeTasks.length === 0) {
    return 100;
  }

  const completed = employeeTasks.filter((t) => t.status === "DONE").length;
  return Math.round((completed / employeeTasks.length) * 100);
}
