// components/dashboard/ActiveWorkflowsTable.tsx
"use client";

import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";
type WorkflowData = {
  id: string;
  roleTitle: string;
  department: string;
  startDate: Date;
  progressRatio: number;
  newHire: { name: string };
  tasks: { taskType: string; status: TaskStatus }[];
};

export default function ActiveWorkflowsTable({ data }: { data: WorkflowData[] }) {
  const getBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case "DONE": return "default";
      case "IN_PROGRESS": return "secondary";
      case "BLOCKED": return "destructive";
      default: return "outline";
    }
  };

  const getCustomBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case "DONE": return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
      case "BLOCKED": return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
      default: return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="rounded-md border bg-white dark:bg-slate-900">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-950">
          <TableRow>
            <TableHead className="font-medium">Employee Name</TableHead>
            <TableHead className="font-medium">Role</TableHead>
            <TableHead className="font-medium">Department</TableHead>
            <TableHead className="font-medium">Start Date</TableHead>
            <TableHead className="font-medium">Progress</TableHead>
            <TableHead className="font-medium">IT Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            // Get ALL IT and Hardware tasks for this employee
            const itTasks = row.tasks.filter(
              (t) => t.taskType === "IT_ACCESS" || t.taskType === "HARDWARE"
            );
            
            // Calculate the aggregate IT status
            let itStatus: TaskStatus = "PENDING";
            if (itTasks.length > 0) {
              if (itTasks.some((t) => t.status === "BLOCKED")) {
                itStatus = "BLOCKED"; // Critical priority: if one is blocked, the whole IT flow is blocked
              } else if (itTasks.every((t) => t.status === "DONE")) {
                itStatus = "DONE"; // Only DONE if BOTH AD account and Laptop are done
              } else if (itTasks.some((t) => t.status === "IN_PROGRESS" || t.status === "DONE")) {
                itStatus = "IN_PROGRESS"; // If some work has started, it's in progress
              }
            }
            
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.newHire.name}</TableCell>
                <TableCell className="text-slate-600">{row.roleTitle}</TableCell>
                <TableCell className="text-slate-600">{row.department}</TableCell>
                <TableCell className="text-slate-600">{format(new Date(row.startDate), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${row.progressRatio}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{row.progressRatio}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(itStatus)} className={getCustomBadgeClass(itStatus)}>
                    {itStatus.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}