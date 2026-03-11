import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { adminLoginSchema, formatValidationErrors } from "@/lib/validations";
import { setAdminSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
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
          userType: "admin",
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
    const validation = adminLoginSchema.safeParse(loginData);
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
      const { data: admin, error } = await supabase
        .from("admins")
        .select("*")
        .eq("username", loginData.username)
        .maybeSingle();

      if (error) throw error;

      if (!admin) {
        logger.error("admin_login", loginData.username, "failure");
        toast({
          title: "Admin Not Found",
          description: "No admin account found with this username",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (admin.password !== loginData.password) {
        logger.error("admin_login", loginData.username, "failure");
        toast({
          title: "Invalid Password",
          description: "Please check your password and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Use secure session management (no password stored)
      setAdminSession(admin as Record<string, unknown>);
      logger.info("admin_login", loginData.username, "success");
      toast({
        title: "Login Successful",
        description: `Welcome back, ${admin.name}!`,
      });
      navigate("/admin-dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login";
      logger.error("admin_login", loginData.username, "failure");
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-motion-bg">
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <Card className="border-2 border-border bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Admin Login
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Access your admin dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    placeholder="Enter your username"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      placeholder="Enter your password"
                      required
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
