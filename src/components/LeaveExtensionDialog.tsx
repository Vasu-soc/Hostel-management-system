import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

interface Props {
  studentId: string;
  rollNumber: string;
  gatePassId: string;
  onSuccess?: () => void;
}

export function LeaveExtensionDialog({ studentId, rollNumber, gatePassId, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate days when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setDays(diffDays);
      }
    }
  }, [fromDate, toDate]);

  const handleSubmit = async () => {
    if (!reason || days < 1 || !file || !fromDate || !toDate) {
      toast({ title: "Validation Error", description: "Reason, dates, number of days, and medical proof are required.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Proof must be less than 5MB.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("leave-proofs").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("leave-proofs").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("leave_extensions").insert({
        student_id: studentId,
        roll_number: rollNumber,
        gate_pass_id: gatePassId,
        reason,
        number_of_days: days,
        extension_from: fromDate,
        extension_to: toDate,
        proof_url: urlData.publicUrl,
        status: "pending"
      });
      if (insertError) throw insertError;

      toast({ title: "Success", description: "Leave extension requested successfully." });
      setOpen(false);
      setReason("");
      setDays(1);
      setFromDate("");
      setToDate("");
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4 text-warning border-warning hover:bg-warning/10" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          Request Leave Extension
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Leave Extension</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Additional Days Required</Label>
            <Input type="number" min="1" max="30" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Reason (Medical Emergency, etc.)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please explain why an extension is needed..." />
          </div>
          <div className="space-y-2">
            <Label>Upload Medical Proof (Required)</Label>
            <Input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground">Max 5MB. Provide doctor's prescription or relevant proof.</p>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Extension Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
