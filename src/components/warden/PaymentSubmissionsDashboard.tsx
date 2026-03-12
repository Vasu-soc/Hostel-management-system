import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { CreditCard, Check, X, Clock, ExternalLink, Download } from "lucide-react";

interface PaymentSubmissionsDashboardProps {
  wardenType?: string;
}

const PaymentSubmissionsDashboard = ({ wardenType }: PaymentSubmissionsDashboardProps) => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel('payment_submissions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_submissions' }, payload => {
        fetchSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wardenType]);

  const fetchSubmissions = async () => {
    let query = (supabase as any)
      .from('payment_submissions')
      .select('*, students!inner(gender)')
      .order('created_at', { ascending: false });

    if (wardenType === 'girls') {
      query = query.in('students.gender', ['girl', 'female']);
    } else if (wardenType === 'boys') {
      query = query.in('students.gender', ['boy', 'male']);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch payment submissions:", error);
      return;
    }
    setSubmissions(data || []);
  };

  const getReceiptUrl = async (path: string) => {
    // If it's already a full URL from standard upload (since we used getPublicUrl in Student form)
    if (path.startsWith('http')) {
      return path;
    }
    // Fallback if just path was stored
    const { data } = supabase.storage.from('payment_receipts').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAction = async (submission: any, action: "approved" | "rejected") => {
    setIsLoading(true);

    let currentAction = action;
    let studentData: any = null;

    if (action === "approved") {
      // Fetch student to check current fee balance first
      const { data, error } = await supabase
        .from("students")
        .select("paid_fee, pending_fee, id")
        .eq("id", submission.student_id)
        .single();
        
      if (!error && data) {
        studentData = data;
        const currentPending = Number(data.pending_fee || submission.hostel_fee);
        if (currentPending <= 0) {
          currentAction = "rejected";
        }
      }
    }

    if (currentAction === "rejected" && action === "approved") {
        // This means it was auto-rejected because fees are already paid
        await (supabase as any)
          .from("payment_submissions")
          .update({ status: "rejected" })
          .eq("id", submission.id);

        toast({
          title: "Payment Rejected",
          description: "Student's fees are already fully paid. Cannot approve extra payment.",
          variant: "destructive"
        });

        await (supabase as any).from("notifications").insert({
            student_id: submission.student_id,
            title: "Payment Rejected (Fee Completed)",
            message: "This year Your fees is completed you can again pay extra go and contact the concern Hostel Deen and resolve your payment issue.",
            type: "payment"
        });

        setIsLoading(false);
        setSelectedSubmission(null);
        fetchSubmissions();
        return;
    }
    
    // Begin transaction-like operations
    // 1. Update submission status
    const { error: updateError } = await (supabase as any)
      .from("payment_submissions")
      .update({ status: action })
      .eq("id", submission.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (action === "approved" && studentData) {
      // 3. Add to fee transactions
      const { error: txError } = await supabase.from("fee_transactions").insert({
          student_id: submission.student_id,
          amount: submission.amount_paid,
          payment_date: submission.payment_date,
          remarks: `Payment Ref: ${submission.transaction_id} (${submission.payment_method})`,
          academic_year: submission.year?.replace(/[^0-9]/g, '') || "1",
      });

      if (!txError) {
        // 4. Update student paid and pending fees
        const newPaid = Number(studentData.paid_fee || 0) + Number(submission.amount_paid);
        const newPending = Number(studentData.pending_fee || submission.hostel_fee) - Number(submission.amount_paid);

        await supabase
          .from("students")
          .update({
              paid_fee: newPaid,
              pending_fee: Math.max(0, newPending),
          })
          .eq("id", submission.student_id);
      }
    }

    toast({
      title: action === "approved" ? "Payment Approved" : "Payment Rejected",
      description: `The payment submission has been ${action}. ${action === "approved" ? "Student fee balances upgraded." : ""}`
    });
    
    // Add notification
    await (supabase as any).from("notifications").insert({
        student_id: submission.student_id,
        title: `Payment ${action === "approved" ? "Approved" : "Rejected"}`,
        message: `Your payment of ₹${submission.amount_paid} has been ${action} by the warden.`,
        type: "payment"
    });

    setIsLoading(false);
    setSelectedSubmission(null);
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": return <Badge className="bg-success text-success-foreground hover:bg-success/90">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Student Payments</h2>
          <p className="text-muted-foreground text-sm">Review and verify student fee payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((sub) => (
          <Card key={sub.id} className={`cursor-pointer transition-all hover:shadow-md border-2 ${sub.status === 'pending' ? 'border-warning/30' : 'border-border'}`} onClick={async () => {
              setSelectedSubmission(sub);
              setReceiptUrl(await getReceiptUrl(sub.receipt_url));
          }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{sub.student_name}</CardTitle>
                  <CardDescription className="text-xs font-bold font-mono">{sub.roll_number}</CardDescription>
                </div>
                {getStatusBadge(sub.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Amount</span>
                  <span className="font-bold text-primary">₹{Number(sub.amount_paid).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs px-1">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(sub.payment_date).toLocaleDateString()}</span>
                  <span className="font-medium uppercase opacity-70">{sub.payment_method}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {submissions.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <h3 className="text-lg font-bold text-muted-foreground">No Submissions Found</h3>
            <p className="text-sm text-muted-foreground mt-1">When students submit payment receipts, they will appear here.</p>
          </div>
        )}
      </div>

      {/* Submission Details Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        {selectedSubmission && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Submission Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-widest border-b pb-1">Student Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <strong>{selectedSubmission.student_name}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Roll No:</span> <strong>{selectedSubmission.roll_number}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Branch:</span> <strong>{selectedSubmission.branch} ({selectedSubmission.year} Year)</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Fee:</span> <strong>₹{Number(selectedSubmission.hostel_fee).toLocaleString()}</strong></div>
                </div>

                <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-widest border-b pb-1 pt-4">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid:</span> <strong className="text-lg text-primary">₹{Number(selectedSubmission.amount_paid).toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date:</span> <strong>{new Date(selectedSubmission.payment_date).toLocaleDateString()}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Method:</span> <strong className="uppercase">{selectedSubmission.payment_method}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ref/UTR No:</span> <strong className="font-mono">{selectedSubmission.transaction_id}</strong></div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 flex flex-col h-full">
                <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-widest border-b pb-1 flex justify-between items-center">
                  Receipt
                  {receiptUrl && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => window.open(receiptUrl, '_blank')}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Open
                    </Button>
                  )}
                </h4>
                <div className="flex-1 min-h-[200px] border rounded-lg bg-muted/10 flex items-center justify-center p-1 overflow-hidden">
                  {receiptUrl ? (
                    receiptUrl.toLowerCase().includes('.pdf') ? (
                      <div className="text-center">
                        <ExternalLink className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">PDF Document</p>
                        <Button variant="link" size="sm" onClick={() => window.open(receiptUrl, '_blank')}>View PDF</Button>
                      </div>
                    ) : (
                      <img src={receiptUrl} alt="Receipt" className="max-h-full max-w-full object-contain cursor-zoom-in" onClick={() => window.open(receiptUrl, '_blank')} />
                    )
                  ) : (
                    <div className="animate-pulse flex items-center text-muted-foreground text-sm">Loading receipt...</div>
                  )}
                </div>
              </div>
            </div>

            {selectedSubmission.status === 'pending' && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button 
                  className="flex-1 font-bold h-12 bg-success hover:bg-success/90 text-white" 
                  disabled={isLoading} 
                  onClick={() => handleAction(selectedSubmission, "approved")}
                >
                  <Check className="w-5 h-5 mr-2" /> Approve & Update Fees
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 font-bold h-12" 
                  disabled={isLoading} 
                  onClick={() => handleAction(selectedSubmission, "rejected")}
                >
                  <X className="w-5 h-5 mr-2" /> Reject
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default PaymentSubmissionsDashboard;
