import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token");
  const userType = searchParams.get("type") as "student" | "warden" | "parent" | "admin" | null;

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [tokenData, setTokenData] = useState<{ user_identifier: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !userType) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("password_reset_tokens")
          .select("*")
          .eq("token", token)
          .eq("user_type", userType)
          .eq("used", false)
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        if (error || !data) {
          setIsValid(false);
        } else {
          setIsValid(true);
          setTokenData(data);
        }
      } catch (err) {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, userType]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!tokenData || !userType) return;

    setIsLoading(true);

    try {
      // Update password based on user type
      let updateError;
      
      if (userType === "student") {
        const { error } = await supabase
          .from("students")
          .update({ password: passwordData.password })
          .eq("roll_number", tokenData.user_identifier);
        updateError = error;
      } else if (userType === "warden") {
        const { error } = await supabase
          .from("wardens")
          .update({ password: passwordData.password })
          .eq("username", tokenData.user_identifier);
        updateError = error;
      } else if (userType === "parent") {
        const { error } = await supabase
          .from("parents")
          .update({ password: passwordData.password })
          .eq("mobile_number", tokenData.user_identifier);
        updateError = error;
      } else if (userType === "admin") {
        const { error } = await supabase
          .from("admins")
          .update({ password: passwordData.password })
          .eq("username", tokenData.user_identifier);
        updateError = error;
      }

      if (updateError) throw updateError;

      // Mark token as used
      await supabase
        .from("password_reset_tokens")
        .update({ used: true })
        .eq("token", token);

      setResetSuccess(true);
      logger.info("password_reset_complete", tokenData.user_identifier, "success");
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now login with your new password.",
      });

    } catch (error: any) {
      logger.error("password_reset_complete", tokenData?.user_identifier || "unknown", "failure");
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLoginPath = () => {
    switch (userType) {
      case "student": return "/student-login?gender=boys";
      case "warden": return "/warden-login";
      case "parent": return "/parent-login";
      case "admin": return "/admin-login";
      default: return "/";
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background grid-motion-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background grid-motion-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-2 border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Invalid or Expired Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-background grid-motion-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-2 border-green-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-xl text-green-600">Password Reset Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your password has been successfully updated. You can now login with your new password.
            </p>
            <Link to={getLoginPath()}>
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-motion-bg">
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-md">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-2 border-border bg-card/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center border-b border-border">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Enter your new password below
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters)"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
