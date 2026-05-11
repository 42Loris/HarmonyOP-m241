"use client";

import { useState } from "react";
import { AlertTriangle, UserX, Loader2 } from "lucide-react";
import { offboardEmployeeAction } from "@/actions/offboard";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OffboardButton({ employeeId, employeeName }: { employeeId: string, employeeName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOffboard = async () => {
    if (confirmText !== employeeName) return;

    setLoading(true);
    const res = await offboardEmployeeAction(employeeId, confirmText);
    setLoading(false);

    if (!res.success) {
      toast.error(res.error || "Failed to offboard employee");
    } else {
      toast.success("Employee successfully offboarded.");
      if (res.warning) {
        toast.warning(res.warning);
      }
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setConfirmText("");
    }}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <UserX className="h-4 w-4" />
          Offboard Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
            This action will immediately disable <strong>{employeeName}</strong> in Microsoft Entra ID, revoke their active sign-in sessions, and generate a task for IT to convert their mailbox. 
            <br /><br />
            This cannot be easily undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Please type <strong>{employeeName}</strong> to confirm.
          </label>
          <Input 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={employeeName}
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleOffboard} 
            disabled={loading || confirmText !== employeeName}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
            Terminate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}