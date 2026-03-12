import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Building, ExternalLink, Copy, Download, ZoomIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PaymentSubmissionForm from "@/components/student/PaymentSubmissionForm";
import { StudentSession } from "@/lib/session";

import qrCodeImg from "@/assets/qrcode.jpg";

interface PaymentPortalProps {
  student?: StudentSession;
}

const PaymentPortal = ({ student }: PaymentPortalProps) => {
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeImg;
    link.download = "payment_qrcode.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Portal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Details */}
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground italic">Bank:</span>
            <span className="font-semibold text-primary/80">Axis Bank</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground ml-6 italic">A/C Name:</span>
            <span className="font-semibold">GIST</span>
          </div>
          <div className="flex items-center gap-2 text-sm group">
            <span className="text-muted-foreground ml-6 italic">A/C Number:</span>
            <span className="font-mono font-bold tracking-wider text-foreground">918010096854290</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy('918010096854290', 'Account Number')}
              title="Copy Account Number"
            >
              <Copy className="h-4 w-4 text-primary" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm group">
            <span className="text-muted-foreground ml-6 italic">IFSC Code:</span>
            <span className="font-mono font-bold tracking-wider text-foreground">UTIB0000152</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy('UTIB0000152', 'IFSC Code')}
              title="Copy IFSC Code"
            >
              <Copy className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        {/* QR Code with Zoom and Apps */}
        <div className="flex flex-col items-center py-4 bg-muted/30 rounded-lg border border-border">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative group cursor-pointer w-32 h-32 bg-white rounded-lg border-2 border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                <img src={qrCodeImg} alt="QR Code" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <ZoomIn className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Zoom</span>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-11/12 max-h-[90vh] rounded-xl flex flex-col items-center justify-center p-6">
              <DialogHeader>
                <DialogTitle className="text-center w-full">Scan Payment QR</DialogTitle>
              </DialogHeader>
              <div className="w-full flex items-center justify-center my-4 bg-white p-2 rounded-lg border">
                <img src={qrCodeImg} alt="QR Code Enlarged" className="w-full max-w-sm rounded-lg shadow-sm" />
              </div>
              <Button onClick={handleDownloadQR} className="w-full flex items-center justify-center gap-2 mt-2" variant="default">
                <Download className="w-4 h-4" />
                Download QR Code
              </Button>
            </DialogContent>
          </Dialog>
          <p className="text-xs text-muted-foreground mt-3 font-medium uppercase tracking-wider">Scan to Pay</p>

          {/* Payment Apps Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full px-3">
            <a href="phonepe://" className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 text-center shadow-sm hover:shadow-md">
              <img src="/logos/phonepe.png" alt="PhonePe" className="h-8 w-auto mb-1 object-contain" />
              <span className="font-bold text-[10px] text-indigo-700 whitespace-nowrap">PhonePe</span>
            </a>
            <a href="tez://upi/" className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 text-center shadow-sm hover:shadow-md">
              <img src="/logos/gpay.png" alt="GPay" className="h-8 w-auto mb-1 object-contain" />
              <span className="font-bold text-[10px] text-blue-700 whitespace-nowrap">GPay</span>
            </a>
            <a href="paytmmp://" className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-sky-50 hover:bg-sky-100 transition-all border border-sky-100 text-center shadow-sm hover:shadow-md">
              <img src="/logos/paytm.png" alt="Paytm" className="h-8 w-auto mb-1 object-contain" />
              <span className="font-bold text-[10px] text-sky-700 whitespace-nowrap">Paytm</span>
            </a>
          </div>
        </div>

        {/* Payment Submission / Google Form Link */}
        {student && (
          <div className="mb-4">
            <PaymentSubmissionForm student={student} />
          </div>
        )}
        <Button
          variant="outline"
          className="w-full border-primary/30 hover:bg-primary/5"
          onClick={() => window.open("https://forms.gle/obPGXkBNG4gZwyFV9", "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2 text-primary" />
          Fees Submition Google form
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentPortal;
