import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, UserPlus, Eye, EyeOff, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  parentLoginSchema,
  parentRegistrationSchema,
  formatValidationErrors
} from "@/lib/validations";
import { setParentSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import { useRateLimit } from "@/hooks/useRateLimit";

const ParentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";

  const [activeTab, setActiveTab] = useState(mode === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const { isLockedOut, remainingTime, recordAttempt, resetAttempts, attemptsCount } = useRateLimit("parent_login");

  // Login form
  const [loginData, setLoginData] = useState({
    mobileNumber: "",
    password: "",
  });
  const passwordRef = useRef<HTMLInputElement>(null);

  // Register form
  const [registerData, setRegisterData] = useState({
    parentName: "",
    mobileNumber: "",
    studentRollNumber: "",
    password: "",
  });

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image strictly under 3MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({ mobileNumber: "", email: "" });
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.mobileNumber || !forgotPasswordData.email) {
      toast({
        title: "Error",
        description: "Please enter both mobile number and email",
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
          mobileNumber: forgotPasswordData.mobileNumber,
          email: forgotPasswordData.email,
          userType: "parent",
          baseUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        logger.info("password_reset_request", forgotPasswordData.mobileNumber, "success");
        toast({
          title: "Email Sent",
          description: data.message || "Password reset link has been sent to your email",
        });
        setShowForgotPassword(false);
        setForgotPasswordData({ mobileNumber: "", email: "" });
      } else {
        logger.error("password_reset_request", forgotPasswordData.mobileNumber, "failure");
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
    const validation = parentLoginSchema.safeParse(loginData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: formatValidationErrors(validation.error),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (isLockedOut) {
      setIsLoading(false);
      toast({
        title: "Account Temporarily Blocked",
        description: `Too many failed attempts. Access is restricted for ${remainingTime}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: parent, error } = await supabase
        .from("parents")
        .select("*")
        .eq("mobile_number", loginData.mobileNumber)
        .maybeSingle();

      if (error) throw error;

      if (!parent) {
        const justLocked = recordAttempt();
        logger.error("parent_login", loginData.mobileNumber, "failure");
        if (justLocked) {
          toast({
            title: "Security Block Activated",
            description: "You have exceeded 5 wrong attempts. Your account is blocked for 24 hours.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Parent Not Found",
            description: `Please register first before logging in (${attemptsCount + 1}/5 attempts used)`,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      if (parent.password !== loginData.password) {
        const justLocked = recordAttempt();
        logger.error("parent_login", loginData.mobileNumber, "failure");
        if (justLocked) {
          toast({
            title: "Security Block Activated",
            description: "You have exceeded 5 wrong attempts. Your account is blocked for 24 hours.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid Password",
            description: `Invalid credentials. (${attemptsCount + 1}/5 attempts used)`,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      // Use secure session management (no password stored)
      resetAttempts();
      setParentSession(parent as Record<string, unknown>);
      sessionStorage.setItem("show_terminal_loader", "true");
      logger.info("parent_login", loginData.mobileNumber, "success");
      navigate("/parent-dashboard");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      logger.error("parent_login", loginData.mobileNumber, "failure");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate registration data
    const validation = parentRegistrationSchema.safeParse(registerData);
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
      // Check if student roll number exists
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, roll_number")
        .eq("roll_number", registerData.studentRollNumber.toUpperCase())
        .maybeSingle();

      if (studentError) throw studentError;

      if (!student) {
        toast({
          title: "Student Not Found",
          description: "The provided Roll Number does not exist in the system",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if mobile number already registered
      const { data: existingParent } = await supabase
        .from("parents")
        .select("id")
        .eq("mobile_number", registerData.mobileNumber)
        .maybeSingle();

      if (existingParent) {
        toast({
          title: "Already Registered",
          description: "This mobile number is already registered. Please login instead.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if student already has a parent registered
      const { data: existingStudentParent } = await supabase
        .from("parents")
        .select("id")
        .eq("student_roll_number", registerData.studentRollNumber.toUpperCase())
        .maybeSingle();

      if (existingStudentParent) {
        toast({
          title: "Student Already Linked",
          description: "This student already has a parent account linked",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Upload photo if provided
      let photoUrl: string | null = null;
      if (photoFile) {
        setIsUploadingPhoto(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `PARENT_${registerData.mobileNumber}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          toast({
            title: "Photo Upload Warning",
            description: "Could not upload photo, but registration will continue",
            variant: "destructive",
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('student-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
        setIsUploadingPhoto(false);
      }

      const { error } = await supabase.from("parents").insert({
        parent_name: registerData.parentName.trim(),
        mobile_number: registerData.mobileNumber,
        student_roll_number: registerData.studentRollNumber.toUpperCase(),
        password: registerData.password,
        photo_url: photoUrl,
      });

      if (error) throw error;

      // Also update student's parent_photo_url for gate pass verification
      if (photoUrl) {
        await supabase
          .from("students")
          .update({ parent_photo_url: photoUrl })
          .eq("roll_number", registerData.studentRollNumber.toUpperCase());
      }

      logger.info("parent_registration", registerData.mobileNumber, "success");
      toast({
        title: "Registration Successful!",
        description: "You can now login with your mobile number",
      });

      setActiveTab("login");
      setLoginData({ ...loginData, mobileNumber: registerData.mobileNumber });
      
      // Update URL to switch to login mode after successful registration
      navigate(`/parent-login?mode=login`, { replace: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      logger.error("parent_registration", registerData.mobileNumber, "failure");
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
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              <span className="text-purple-600">Parent</span> Portal
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={mode === "register" ? "register" : "login"} className="w-full">
              {/* TabsList hidden for single-view experience as per user request */}

              <TabsContent value="login" className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-purple-500/10 pb-4">
                  <h2 className="text-xl font-bold text-purple-600 flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Parent Login
                  </h2>
                  <div className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                    Secure Access
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={loginData.mobileNumber}
                      onChange={(e) => setLoginData({ ...loginData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          passwordRef.current?.focus();
                        }
                      }}
                      className="h-12"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        ref={passwordRef}
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
                            <Label>Mobile Number</Label>
                            <Input
                              type="tel"
                              placeholder="Enter your registered mobile number"
                              value={forgotPasswordData.mobileNumber}
                              onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                              className="h-12"
                              maxLength={10}
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
              </TabsContent>

              <TabsContent value="register" className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-pink-500/10 pb-4">
                  <h2 className="text-xl font-bold text-pink-600 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Parent Registration
                  </h2>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Parent Photo Upload */}
                  <div className="flex flex-col items-center space-y-2 pb-4">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-purple-500/30 flex items-center justify-center overflow-hidden bg-muted group relative">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Parent" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="parent-photo-upload"
                      />
                    </div>
                    <Label htmlFor="parent-photo-upload" className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                      Upload Parent Photo *
                    </Label>
                    <p className="text-[10px] text-muted-foreground italic">Strictly under 3MB</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent Name *</Label>
                    <Input
                      id="parentName"
                      placeholder="Enter parent's full name"
                      value={registerData.parentName}
                      onChange={(e) => setRegisterData({ ...registerData, parentName: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regMobileNumber">Mobile Number *</Label>
                    <Input
                      id="regMobileNumber"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={registerData.mobileNumber}
                      onChange={(e) => setRegisterData({ ...registerData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="h-12"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentRollNumber">Student Roll Number *</Label>
                    <Input
                      id="studentRollNumber"
                      placeholder="Enter student's roll number (e.g., 21GK1A0501)"
                      value={registerData.studentRollNumber}
                      onChange={(e) => setRegisterData({ ...registerData, studentRollNumber: e.target.value.toUpperCase() })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password *</Label>
                    <div className="relative">
                      <Input
                        id="regPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
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
                    {isLoading ? "Creating Account..." : "Register Now"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ParentLogin;
