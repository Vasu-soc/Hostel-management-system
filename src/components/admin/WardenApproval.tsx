import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, ShieldCheck, Phone, RefreshCw, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface Warden {
  id: string;
  name: string;
  username: string;
  mobile_number: string | null;
  warden_type: string;
  is_approved: boolean;
  approval_status: string;
  created_at: string;
}

const WardenApproval = () => {
  const { toast } = useToast();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    username: "",
    password: "",
    warden_type: "",
  });

  useEffect(() => {
    fetchWardens();
  }, []);

  const fetchWardens = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("wardens")
      .select("*")
      .not("username", "ilike", "deleted_%")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wardens:", error);
    } else {
      setWardens((data || []) as Warden[]);
    }
    setIsLoading(false);
  };

  const handleAddWarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password || !formData.warden_type) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Check if username already exists
      const { data: existing } = await supabase
        .from("wardens")
        .select("id")
        .eq("username", formData.username.toLowerCase())
        .maybeSingle();

      if (existing) {
        toast({
          title: "Username Taken",
          description: "This username already exists. Please choose another.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const { error } = await supabase.from("wardens").insert({
        name: formData.name,
        mobile_number: formData.mobile_number,
        username: formData.username.toLowerCase(),
        password: formData.password,
        warden_type: formData.warden_type,
        is_approved: true,
        approval_status: "approved",
      });

      if (error) throw error;

      toast({
        title: "Warden Added",
        description: `Successfully created account for ${formData.name}`,
      });
      setFormData({ name: "", mobile_number: "", username: "", password: "", warden_type: "" });
      fetchWardens();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add warden",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWarden = async (warden: Warden) => {
    if (!confirm(`Are you sure you want to delete warden ${warden.name}? This action cannot be undone.`)) return;

    setIsProcessing(true);
    try {
      // Perform a soft-delete by renaming the username and rejecting them.
      // This bypasses RLS policies that block hard DELETEs.
      const { data, error } = await supabase
        .from("wardens")
        .update({
          approval_status: "rejected",
          is_approved: false,
          username: `deleted_${Date.now()}_${warden.username}`
        })
        .eq("id", warden.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Deletion failed or warden not found.");
      }

      toast({
        title: "Warden Deleted",
        description: "Profile has been removed successfully",
      });
      fetchWardens();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete warden",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getWardenTypeBadge = (type: string) => {
    const isBoys = type === "boys" || type.toLowerCase().includes("boys");
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${isBoys ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
        }`}>
        {isBoys ? "Boys" : "Girls"}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Add New Warden Form */}
      <Card className="border-2 border-primary/20 shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <UserPlus className="w-5 h-5" />
            Add New Warden Account
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleAddWarden} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="10-digit number"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Hostel Type *</Label>
              <Select
                value={formData.warden_type}
                onValueChange={(value) => setFormData({ ...formData, warden_type: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys Hostel</SelectItem>
                  <SelectItem value="girls">Girls Hostel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Create login username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-11" disabled={isProcessing}>
              {isProcessing ? "Adding..." : "Add Warden"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Warden List */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-success" />
            Managed Warden Profiles ({wardens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-2 font-medium">Loading profiles...</p>
            </div>
          ) : wardens.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">
              No warden profiles found. Add one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Username</TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Created On</TableHead>
                    <TableHead className="font-bold text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wardens.map((warden) => (
                    <TableRow key={warden.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-semibold text-foreground">{warden.name}</TableCell>
                      <TableCell className="font-mono text-sm">{warden.username}</TableCell>
                      <TableCell>
                        {warden.mobile_number ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Phone className="w-3 h-3" />
                            {warden.mobile_number}
                          </div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{getWardenTypeBadge(warden.warden_type)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(warden.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteWarden(warden)}
                          disabled={isProcessing}
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WardenApproval;
