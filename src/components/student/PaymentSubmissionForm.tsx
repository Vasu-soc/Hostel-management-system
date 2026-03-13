import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentSession } from "@/lib/session";
import { Loader2, Upload, ExternalLink, Check } from "lucide-react";

interface PaymentSubmissionFormProps {
  student: StudentSession;
}

const PaymentSubmissionForm = ({ student }: PaymentSubmissionFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"gpay" | "paytm" | "">("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod || !amountPaid || !paymentDate || !transactionId || !receiptFile) {
      toast({ title: "Validation Error", description: "Please fill all fields and upload a receipt.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload receipt
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${student.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment_receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment_receipts')
        .getPublicUrl(fileName);

      const receiptUrl = urlData.publicUrl;

      // 2. Save submission to db
      const { error: insertError } = await (supabase as any).from("payment_submissions").insert({
        student_id: student.id,
        student_name: student.student_name,
        roll_number: student.roll_number,
        branch: student.branch,
        year: student.year,
        hostel_fee: student.total_fee || 100000,
        amount_paid: Number(amountPaid),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        receipt_url: receiptUrl,
        status: "pending"
      });

      if (insertError) throw insertError;

      toast({
        title: "Submission Successful",
        description: "Your payment receipt has been submitted to the warden for verification."
      });
      
      setIsOpen(false);
      
      // Reset form
      setPaymentMethod("");
      setAmountPaid("");
      setPaymentDate("");
      setTransactionId("");
      setReceiptFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`w-full font-bold ${student.pending_fee <= 0 ? "bg-success/20 text-success border-success/30 hover:bg-success/30" : ""}`}
          disabled={student.pending_fee <= 0}
        >
          {student.pending_fee <= 0 ? (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Fees Already Completed
            </div>
          ) : (
            "Submit Payment Details"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Submission Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pre-blocked info (Read-only) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg text-sm border">
            <div>
              <span className="text-muted-foreground text-xs block">Name:</span>
              <span className="font-semibold">{student.student_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Roll No:</span>
              <span className="font-semibold">{student.roll_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Branch:</span>
              <span className="font-semibold">{student.branch}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Year:</span>
              <span className="font-semibold">{student.year}</span>
            </div>
            <div className="col-span-2 pt-2 border-t mt-1">
              <span className="text-muted-foreground text-xs block">Total Hostel Fee:</span>
              <span className="font-bold text-primary text-base">₹{Number(student.total_fee || 100000).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount Paid (₹) *</Label>
              <Input
                type="number"
                min="1"
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <div className="flex gap-3 mt-1">
                <Button
                  type="button"
                  onClick={() => setPaymentMethod("gpay")}
                  variant={paymentMethod === "gpay" ? "default" : "outline"}
                  className={`flex-1 ${paymentMethod === "gpay" ? "border-sky-500 bg-sky-50 text-sky-700 hover:bg-sky-100" : ""}`}
                >
                  <img src="/logos/gpay.png" alt="GPay" className="h-5 w-auto mr-2 object-contain" />
                  Google Pay
                </Button>
                <Button
                  type="button"
                  onClick={() => setPaymentMethod("paytm")}
                  variant={paymentMethod === "paytm" ? "default" : "outline"}
                  className={`flex-1 ${paymentMethod === "paytm" ? "border-sky-500 bg-sky-50 text-sky-700 hover:bg-sky-100" : ""}`}
                >
                  <img src="/logos/paytm.png" alt="Paytm" className="h-5 w-auto mr-2 object-contain" />
                  Paytm
                </Button>
              </div>
            </div>

            {paymentMethod && (
              <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                <Label>Enter {paymentMethod === "gpay" ? "UPI ID / Ref No" : "UTR No"} *</Label>
                <Input
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={`Enter 12-digit ${paymentMethod === "gpay" ? "UPI reference" : "UTR number"}`}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Upload Payment Receipt *</Label>
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-dashed"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {receiptFile ? "Change Receipt" : "Choose Image/PDF"}
                </Button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden" 
                />
              </div>
              {receiptFile && (
                <p className="text-xs text-muted-foreground text-center">
                  Selected: {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Payment Details"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSubmissionForm;
