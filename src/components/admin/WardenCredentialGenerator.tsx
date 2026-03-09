import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Copy, Check, UserPlus, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface RegistrationToken {
  id: string;
  token: string;
  warden_type: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

interface Warden {
  id: string;
  name: string;
  username: string;
  mobile_number: string | null;
  warden_type: string;
  created_at: string;
}

interface WardenCredentialGeneratorProps {
  adminId: string;
}

const WardenCredentialGenerator = ({ adminId }: WardenCredentialGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWardenType, setSelectedWardenType] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState<RegistrationToken[]>([]);
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription
    const channel = supabase
      .channel("warden-credential-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "warden_registration_tokens" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "wardens" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch tokens
    const { data: tokenData } = await supabase
      .from("warden_registration_tokens")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (tokenData) {
      setTokens(tokenData as RegistrationToken[]);
    }

    // Fetch wardens
    const { data: wardenData } = await supabase
      .from("wardens")
      .select("*")
      .not("username", "ilike", "deleted_%")
      .order("created_at", { ascending: false });
    
    if (wardenData) {
      setWardens(wardenData as Warden[]);
    }

    setIsLoading(false);
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateLink = async () => {
    if (!selectedWardenType) {
      toast({
        title: "Select Warden Type",
        description: "Please select Boys or Girls warden type",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Link valid for 7 days

      const { error } = await supabase.from("warden_registration_tokens").insert({
        token,
        warden_type: selectedWardenType,
        created_by: adminId,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      const link = `${window.location.origin}/warden-register?token=${token}`;
      setGeneratedLink(link);
      setShowLinkDialog(true);
      
      toast({
        title: "Link Generated!",
        description: "Share this link with the warden to complete registration",
      });

      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate link";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Warden Registration Link (Valid for 7 days):\n\n${generatedLink}\n\nPlease use this link to complete your warden registration.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Generate Link Section */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Generate Warden Registration Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedWardenType} onValueChange={setSelectedWardenType}>
              <SelectTrigger className="h-12 flex-1">
                <SelectValue placeholder="Select Warden Type..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-2 border-border z-50">
                <SelectItem value="boys">Boys Hostel Warden</SelectItem>
                <SelectItem value="girls">Girls Hostel Warden</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleGenerateLink}
              disabled={!selectedWardenType || isGenerating}
              className="h-12"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Link
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Generated links are valid for 7 days and can only be used once.
          </p>
        </CardContent>
      </Card>

      {/* Registered Wardens */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-lg">Registered Wardens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : wardens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No wardens registered yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Registered On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wardens.map((warden) => (
                  <TableRow key={warden.id}>
                    <TableCell className="font-medium">{warden.name}</TableCell>
                    <TableCell>{warden.username}</TableCell>
                    <TableCell>{warden.mobile_number || "-"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        warden.warden_type.includes("Boys") 
                          ? "bg-accent/10 text-accent" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {warden.warden_type.includes("Boys") ? "Boys" : "Girls"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(warden.created_at), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generated Links History */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-lg">Registration Links History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tokens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No registration links generated yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => {
                  const isExpired = new Date(token.expires_at) < new Date();
                  return (
                    <TableRow key={token.id}>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          token.warden_type === "boys" 
                            ? "bg-accent/10 text-accent" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {token.warden_type === "boys" ? "Boys" : "Girls"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {token.used ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                            Used
                          </span>
                        ) : isExpired ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                            Expired
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(token.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(token.expires_at), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Link Generated Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-success" />
              Registration Link Generated
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-lg break-all">
              <code className="text-sm">{generatedLink}</code>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button onClick={shareOnWhatsApp} className="flex-1 bg-success hover:bg-success/90">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share on WhatsApp
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This link is valid for 7 days and can only be used once.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WardenCredentialGenerator;