import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Building, ExternalLink, QrCode, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import qrCodeImg from "@/assets/qrcode.jpg";

const PaymentPortal = () => {
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
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

        {/* QR Code */}
        <div className="flex flex-col items-center py-4">
          <div className="w-32 h-32 bg-white rounded-lg border-2 border-border flex items-center justify-center overflow-hidden">
            <img src={qrCodeImg} alt="QR Code" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Scan to Pay</p>
        </div>

        {/* Google Form Link */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open("https://forms.gle/obPGXkBNG4gZwyFV9", "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Payment Confirmation Form
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentPortal;
