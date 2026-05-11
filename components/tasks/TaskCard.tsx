// components/tasks/TaskCard.tsx
"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/actions/tasks";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Key, Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    taskType: string;
    status: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  };
  employeeName: string;
  role: string;
};

export default function TaskCard({ task, employeeName, role }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE") => {
    startTransition(async () => {
      await updateTaskStatus(task.id, newStatus);
    });
  };

  return (
    <Card className={`relative shadow-sm transition-all ${isPending ? "opacity-60" : "opacity-100"}`}>
      {isPending && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-xs">
            {task.taskType === "IT_ACCESS" && <Key className="mr-1 h-3 w-3" />}
            {task.taskType === "HARDWARE" && <Monitor className="mr-1 h-3 w-3" />}
            {task.taskType === "HR_ADMIN" && <FileText className="mr-1 h-3 w-3" />}
            {task.taskType.replace("_", " ")}
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{employeeName}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-800 border-t p-3 flex justify-between gap-2">
        {task.status === "PENDING" && (
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange("IN_PROGRESS")}>
            Start Work
          </Button>
        )}
        
        {task.status === "IN_PROGRESS" && (
          <>
            <Button size="sm" variant="destructive" className="w-1/2" onClick={() => handleStatusChange("BLOCKED")}>
              <AlertCircle className="mr-1 h-3 w-3" /> Block
            </Button>
            <Button size="sm" className="w-1/2 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("DONE")}>
              <CheckCircle2 className="mr-1 h-3 w-3" /> Done
            </Button>
          </>
        )}

        {task.status === "BLOCKED" && (
          <Button size="sm" variant="outline" className="w-full" onClick={() => handleStatusChange("IN_PROGRESS")}>
            Resume Work
          </Button>
        )}

        {task.status === "DONE" && (
          <Button size="sm" variant="ghost" className="w-full text-green-700 hover:text-green-800 hover:bg-green-100" disabled>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}