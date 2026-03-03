import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WardenRegister = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token") || "";
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [wardenType, setWardenType] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setIsValidating(false);
      setIsValidToken(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("warden_registration_tokens")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setIsValidToken(false);
      } else {
        setIsValidToken(true);
        setWardenType(data.warden_type);
      }
    } catch {
      setIsValidToken(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.mobileNumber || !formData.username || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Password and Confirm Password must match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const { data: existingWarden } = await supabase
        .from("wardens")
        .select("id")
        .eq("username", formData.username.toLowerCase())
        .maybeSingle();

      if (existingWarden) {
        toast({
          title: "Username Taken",
          description: "This username is already registered. Please choose another.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create warden account
      const { error: wardenError } = await supabase.from("wardens").insert({
        name: formData.name.trim(),
        mobile_number: formData.mobileNumber,
        username: formData.username.toLowerCase(),
        password: formData.password,
          warden_type: wardenType,
      });

      if (wardenError) throw wardenError;

      // Mark token as used
      await supabase
        .from("warden_registration_tokens")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("token", token);

      toast({
        title: "Registration Successful!",
        description: "You can now login with your credentials",
      });

      navigate("/warden-login");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background grid-motion-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Validating registration link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background grid-motion-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground mb-6">
              This registration link is invalid, expired, or has already been used.
            </p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const wardenLabel = wardenType === "boys" ? "Boys Hostel" : "Girls Hostel";
  const wardenColor = wardenType === "boys" ? "text-accent" : "text-primary";

  return (
    <div className="min-h-screen bg-background grid-motion-bg">
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-2 border-border bg-card/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center border-b border-border">
            <div className="mx-auto w-16 h-16 rounded-full bg-warning flex items-center justify-center mb-4">
              <UserCircle className="w-8 h-8 text-warning-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">
              <span className={wardenColor}>{wardenLabel}</span> Warden Registration
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-success">Valid Registration Link</span>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warden Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Phone Number *</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="h-12"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="Choose a username for login"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WardenRegister;