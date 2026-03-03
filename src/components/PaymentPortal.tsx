import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Building, ExternalLink, QrCode } from "lucide-react";

const PaymentPortal = () => {
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
            <span className="text-muted-foreground">Account Number:</span>
            <span className="font-mono font-semibold">12345678900987</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground ml-6">IFSC Code:</span>
            <span className="font-mono font-semibold">SBI09388200</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center py-4">
          <div className="w-32 h-32 bg-white rounded-lg border-2 border-border flex items-center justify-center">
            <QrCode className="w-24 h-24 text-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Scan to Pay</p>
        </div>

        {/* Google Form Link */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open("https://forms.google.com", "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Payment Confirmation Form
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentPortal;
