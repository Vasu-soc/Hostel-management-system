import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Check, X, Clock } from "lucide-react";

export default function LeaveExtensions() {
  const [extensions, setExtensions] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchExtensions = async () => {
    try {
      // Fetch leave extensions and join with students table (if possible) or just display roll numbers
      const { data, error } = await supabase
        .from('leave_extensions')
        .select(`
          *,
          students:student_id (student_name, branch, year)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExtensions(data || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to load extensions", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleStatusChange = async (id: string, status: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from('leave_extensions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Create notification for the student
      const { error: notifyError } = await supabase.from('notifications').insert({
        student_id: studentId,
        title: "Leave Extension Update",
        message: `Your leave extension request has been ${status}.`,
        type: "leave_extension"
      });
      if (notifyError) console.error("Notification failed", notifyError);

      toast({ title: "Success", description: `Extension ${status} successfully.` });
      fetchExtensions();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update status", variant: "destructive" });
    }
  };

  if (extensions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No leave extension requests pending.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {extensions.map((ext) => (
        <div key={ext.id} className="p-4 bg-card border-2 border-border rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-lg">{ext.students?.student_name || ext.roll_number}</p>
              <p className="text-sm text-muted-foreground">{ext.roll_number} • {ext.students?.branch?.toUpperCase()} • {ext.students?.year}</p>
            </div>
            <Badge variant={ext.status === 'approved' ? 'default' : ext.status === 'rejected' ? 'destructive' : 'secondary'}>
              {ext.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 py-3 border-y border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Extension Requested</p>
              <p className="font-medium">{ext.number_of_days} Day(s)</p>
              <p className="text-[10px] text-muted-foreground">{ext.extension_from} to {ext.extension_to}</p>
            </div>
            <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Medical Proof</p>
              {ext.proof_url ? (
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => window.open(ext.proof_url, '_blank')}>
                  <FileText className="w-4 h-4 mr-1" /> View Document
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">No document uploaded</span>
              )}
            </div>
          </div>
          
          <div className="mt-3">
             <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Reason provided</p>
             <p className="text-sm mt-1 bg-muted/50 p-3 rounded-md italic">"{ext.reason}"</p>
          </div>

          {ext.status === 'pending' && (
            <div className="flex gap-3 mt-4">
              <Button onClick={() => handleStatusChange(ext.id, 'approved', ext.student_id)} className="flex-1" variant="hero">
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button onClick={() => handleStatusChange(ext.id, 'rejected', ext.student_id)} className="flex-1" variant="destructive">
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
