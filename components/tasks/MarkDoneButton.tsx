"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { updateTaskStatus } from "@/actions/tasks";
import { toast } from "sonner";

export default function MarkDoneButton({ taskId, taskTitle }: { taskId: string, taskTitle: string }) {
  const [loading, setLoading] = useState(false);

  const handleMarkDone = async () => {
    setLoading(true);
    const res = await updateTaskStatus(taskId, "DONE");
    setLoading(false);

    if (res.error) {
      toast.error(`Failed to mark "${taskTitle}" as done.`);
    } else {
      toast.success(`"${taskTitle}" marked as done.`);
    }
  };

  return (
    <button
      onClick={handleMarkDone}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Mark as Done
    </button>
  );
}