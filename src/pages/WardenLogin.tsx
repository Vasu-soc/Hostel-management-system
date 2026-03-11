import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  wardenLoginSchema,
  wardenRegistrationSchema,
  formatValidationErrors
} from "@/lib/validations";
import { setWardenSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const WardenLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";

  const [activeTab, setActiveTab] = useState(mode === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    name: "",
    mobileNumber: "",
    wardenType: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({ username: "", email: "" });
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.username || !forgotPasswordData.email) {
      toast({
        title: "Error",
        description: "Please enter both username and email",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-password-reset-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          username: forgotPasswordData.username,
          email: forgotPasswordData.email,
          userType: "warden",
          baseUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        logger.info("password_reset_request", forgotPasswordData.username, "success");
        toast({
          title: "Email Sent",
          description: data.message || "Password reset link has been sent to your email",
        });
        setShowForgotPassword(false);
        setForgotPasswordData({ username: "", email: "" });
      } else {
        logger.error("password_reset_request", forgotPasswordData.username, "failure");
        toast({
          title: "Error",
          description: data.error || "Failed to send reset email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = wardenLoginSchema.safeParse(loginData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: formatValidationErrors(validation.error),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: warden, error } = await supabase
        .from("wardens")
        .select("*")
        .eq("username", loginData.username)
        .maybeSingle();

      if (error) throw error;

      if (!warden) {
        logger.error("warden_login", loginData.username, "failure");
        toast({
          title: "Warden Not Found",
          description: "Please register first before logging in",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (warden.password !== loginData.password) {
        logger.error("warden_login", loginData.username, "failure");
        toast({
          title: "Invalid Password",
          description: "Please check your password and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check approval status
      if (warden.approval_status === "pending") {
        logger.error("warden_login", loginData.username, "failure");
        toast({
          title: "Approval Pending",
          description: "Your registration is pending approval from the Admin. Please wait.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (warden.approval_status === "rejected") {
        logger.error("warden_login", loginData.username, "failure");
        toast({
          title: "Registration Rejected",
          description: warden.rejected_reason || "Your registration was rejected by the Admin.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Use secure session management (no password stored)
      setWardenSession(warden as Record<string, unknown>);
      logger.info("warden_login", loginData.username, "success");
      navigate("/warden-dashboard");
    } catch (error: any) {
      console.error("Login Error Object:", error);
      let errorMessage = "Login failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error) || "Login failed";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      logger.error("warden_login", loginData.username, "failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate registration data
    const validation = wardenRegistrationSchema.safeParse(registerData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: formatValidationErrors(validation.error),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if username exists
      const { data: existing } = await supabase
        .from("wardens")
        .select("id")
        .eq("username", registerData.username)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Username Taken",
          description: "This username is already registered. Please choose another.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("wardens").insert({
        name: registerData.name.trim(),
        mobile_number: registerData.mobileNumber || null,
        warden_type: registerData.wardenType,
        username: registerData.username,
        password: registerData.password,
        is_approved: false,
        approval_status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Registration Submitted!",
        description: "Your registration is pending Admin approval. You will be able to login once approved.",
      });

      setActiveTab("login");
      setRegisterData({ name: "", mobileNumber: "", wardenType: "", username: "", password: "", confirmPassword: "" });
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
            <div className="mx-auto w-16 h-16 rounded-full gradient-secondary flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Warden Portal
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-primary/10 pb-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Warden Login
                </h2>
                <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                  Secure Access
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm text-primary hover:underline mt-2"
                >
                  Forgot Password?
                </button>
              </form>

              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Forgot Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            placeholder="Enter your username"
                            value={forgotPasswordData.username}
                            onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, username: e.target.value })}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={forgotPasswordData.email}
                            onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                            className="h-12"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          A password reset link will be sent to your email address.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowForgotPassword(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="flex-1" disabled={isSendingReset}>
                            {isSendingReset ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WardenLogin;
