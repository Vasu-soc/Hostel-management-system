import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, Users, UserPlus, Eye, EyeOff, Camera, Upload, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  studentLoginSchema,
  studentRegistrationSchema,
  passwordSetupSchema,
  formatValidationErrors
} from "@/lib/validations";
import { setStudentSession } from "@/lib/session";
import { localApi } from "@/lib/localStudentApi";

const branches = [
  { value: "cse", label: "CSE" },
  { value: "aiml", label: "AIML" },
  { value: "ds", label: "Data Science" },
  { value: "ece", label: "ECE" },
  { value: "eee", label: "EEE" },
  { value: "mech", label: "MECH" },
  { value: "civil", label: "CIVIL" },
  { value: "it", label: "IT" },
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const floors = ["1", "2", "3"];

interface Room {
  room_number: string;
  room_type: string;
  ac_type: string;
  floor_number: string;
  total_beds: number;
  occupied_beds: number | null;
  pending_beds: number | null;
  closed_beds: number | null;
}

const StudentLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const gender = searchParams.get("gender") || "boys";
  const mode = searchParams.get("mode") || "login";

  const [activeTab, setActiveTab] = useState(mode === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Available rooms from database
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  // Login form
  const [loginData, setLoginData] = useState({
    rollNumber: "",
    password: "",
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    branch: "",
    rollNumber: "",
    studentName: "",
    email: "",
    year: "",
    validityFrom: "2024",
    validityTo: "2028",
    gender: gender === "boys" ? "male" : "female",
    roomNumber: "",
    floorNumber: "",
    hostelBlockType: "",
    password: "",
    confirmPassword: "",
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
  const [forgotPasswordData, setForgotPasswordData] = useState({ email: "" });
  const [isSendingReset, setIsSendingReset] = useState(false);

  // First time password setup
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [studentForPassword, setStudentForPassword] = useState<Record<string, unknown> | null>(null);
  const [passwordSetup, setPasswordSetup] = useState({
    password: "",
    confirmPassword: "",
  });

  // Fetch rooms and accurately calculate occupancy on mount
  const getRoomFee = (room: Room) => {
    if (room.ac_type === 'ac') {
      return room.total_beds <= 2 ? 100000 : 90000;
    } else {
      return room.total_beds <= 2 ? 84000 : 75000;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");

      if (!roomsData || roomsError) return;

      // Fetch students to correctly override potentially desycnced database occupied_beds
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, hostel_room_number, room_allotted");

      const deletedIds = await localApi.getDeletedIds();
      const actualOccupiedCounts: Record<string, number> = {};

      if (studentsData) {
        studentsData.forEach(student => {
          if (student.hostel_room_number && student.room_allotted && !deletedIds.includes(student.id)) {
            actualOccupiedCounts[student.hostel_room_number] = (actualOccupiedCounts[student.hostel_room_number] || 0) + 1;
          }
        });
      }

      // Filter rooms based on gender
      // Boys: A (AC) or N (Non-AC) prefix, NOT GA/GN
      // Girls: GA (AC) or GN (Non-AC) prefix
      const isBoys = gender === "boys";
      const filteredRooms = roomsData.filter((r: Room) => {
        // OVERRIDE with the true calculation
        r.occupied_beds = actualOccupiedCounts[r.room_number] || 0;

        if (isBoys) {
          return (r.room_number.startsWith('A') || r.room_number.startsWith('N')) &&
            !r.room_number.startsWith('GA') && !r.room_number.startsWith('GN');
        } else {
          return r.room_number.startsWith('GA') || r.room_number.startsWith('GN');
        }
      });
      setAllRooms(filteredRooms);
    };
    fetchData();
  }, [gender]);

  // Filter available rooms based on selection (Floor + Block Type only)
  useEffect(() => {
    if (!registerData.floorNumber || !registerData.hostelBlockType) {
      setAvailableRooms([]);
      return;
    }

    const filtered = allRooms.filter((room) => {
      // Check floor
      if (room.floor_number !== registerData.floorNumber) return false;

      // Check AC type
      if (room.ac_type !== registerData.hostelBlockType) return false;

      // Check availability (has at least 1 available bed)
      const occupied = room.occupied_beds || 0;
      const closed = room.closed_beds || 0;
      const available = room.total_beds - occupied - closed;

      return available > 0;
    });

    setAvailableRooms(filtered);

    // Clear room number if previously selected room is no longer available
    if (registerData.roomNumber && !filtered.find(r => r.room_number === registerData.roomNumber)) {
      setRegisterData(prev => ({ ...prev, roomNumber: "" }));
    }
  }, [registerData.floorNumber, registerData.hostelBlockType, allRooms]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = studentLoginSchema.safeParse(loginData);
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
      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("roll_number", loginData.rollNumber.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        toast({
          title: "Student Not Found",
          description: "Please register first before logging in",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check gender validation
      const expectedGender = gender === "boys" ? "male" : "female";
      if (student.gender !== expectedGender) {
        toast({
          title: "Access Denied",
          description: `This login is only for ${gender}. Please use the correct login portal.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!student.password) {
        setStudentForPassword(student as Record<string, unknown>);
        setIsFirstTimeLogin(true);
        toast({
          title: "First Time Login",
          description: "Please set your password",
        });
        setIsLoading(false);
        return;
      }

      if (student.password !== loginData.password) {
        toast({
          title: "Invalid Password",
          description: "Please check your password and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if student is approved (room_allotted is our approval flag)
      if (!student.room_allotted) {
        toast({
          title: "Account Pending Approval",
          description: "Your registration is complete. Please wait for the Warden to approve your room and give you login access.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Use secure session management (no password stored)
      setStudentSession(student as Record<string, unknown>);
      navigate(`/student-dashboard?gender=${gender}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const validation = passwordSetupSchema.safeParse(passwordSetup);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: formatValidationErrors(validation.error),
        variant: "destructive",
      });
      return;
    }

    if (!studentForPassword) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ password: passwordSetup.password })
        .eq("id", studentForPassword.id as string);

      if (error) throw error;

      // Use secure session management (no password stored)
      setStudentSession(studentForPassword);

      toast({
        title: "Password Set Successfully!",
        description: "You are now logged in",
      });

      navigate(`/student-dashboard?gender=${gender}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to set password";
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

    // Validate password match
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Password and Confirm Password must match",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate registration data
    const validation = studentRegistrationSchema.safeParse({
      rollNumber: registerData.rollNumber.toUpperCase(),
      studentName: registerData.studentName,
      branch: registerData.branch,
      year: registerData.year,
      gender: registerData.gender,
      validityFrom: registerData.validityFrom,
      validityTo: registerData.validityTo,
      roomNumber: registerData.roomNumber,
      floorNumber: registerData.floorNumber,
    });

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
      // Check if already registered
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("roll_number", registerData.rollNumber.toUpperCase())
        .maybeSingle();

      if (existing) {
        // If the student exists in DB but is in our "deleted blocklist", 
        // it means they are a "ghost" (delete was blocked by RLS).
        // Let's force delete them via RPC so the new registration can succeed.
        const deletedIds = await localApi.getDeletedIds();

        if (deletedIds.includes(existing.id)) {
          console.log("Found ghost record for", registerData.rollNumber, "- forcibly deleting");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('delete_student_complete', {
            p_student_id: existing.id,
            p_roll_number: registerData.rollNumber.toUpperCase(),
          });
        } else {
          toast({
            title: "Already Registered",
            description: "This Roll Number is already registered. Please login instead.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Upload photo if provided
      let photoUrl: string | null = null;
      if (photoFile) {
        setIsUploadingPhoto(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${registerData.rollNumber.toUpperCase()}_${Date.now()}.${fileExt}`;

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
      const selectedRoomData = availableRooms.find(r => r.room_number === registerData.roomNumber);
      const fee = selectedRoomData ? getRoomFee(selectedRoomData) : 84000;

      const { error } = await supabase.from("students").insert({
        roll_number: registerData.rollNumber.toUpperCase(),
        student_name: registerData.studentName.trim(),
        email: registerData.email.trim() || null,
        branch: registerData.branch,
        year: registerData.year,
        gender: registerData.gender,
        validity_from: registerData.validityFrom,
        validity_to: registerData.validityTo,
        room_allotted: false,
        hostel_room_number: registerData.roomNumber || null,
        floor_number: registerData.floorNumber || null,
        total_fee: fee,
        pending_fee: fee,
        paid_fee: 0,
        password: registerData.password,
        photo_url: photoUrl,
      });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "You can now login with your Roll Number and password",
      });

      setActiveTab("login");
      setLoginData({ ...loginData, rollNumber: registerData.rollNumber.toUpperCase() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUploadingPhoto(false);
    }
  };

  const genderLabel = gender === "boys" ? "Boys" : "Girls";
  const genderColor = gender === "boys" ? "text-accent" : "text-primary";

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.email) {
      toast({
        title: "Error",
        description: "Please enter your registered email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
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
          email: forgotPasswordData.email.toLowerCase().trim(),
          userType: "student",
          baseUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: data.message || "Password reset link has been sent to your email",
        });
        setShowForgotPassword(false);
        setForgotPasswordData({ email: "" });
      } else {
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
            <div className={`mx-auto w-16 h-16 rounded-full ${gender === "boys" ? "gradient-secondary" : "gradient-primary"} flex items-center justify-center mb-4`}>
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">
              <span className={genderColor}>{genderLabel}</span> Student Portal
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {isFirstTimeLogin ? (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <h3 className="text-lg font-semibold text-center text-foreground mb-4">
                  Set Your Password
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordSetup.password}
                      onChange={(e) => setPasswordSetup({ ...passwordSetup, password: e.target.value })}
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
                      placeholder="Confirm password"
                      value={passwordSetup.confirmPassword}
                      onChange={(e) => setPasswordSetup({ ...passwordSetup, confirmPassword: e.target.value })}
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
                  {isLoading ? "Setting Password..." : "Set Password & Login"}
                </Button>
              </form>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-2xl border border-border mb-8">
                  <TabsTrigger
                    value="login"
                    className={`rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 font-bold text-base gap-2`}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className={`rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg transition-all duration-300 font-bold text-base gap-2`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-primary/10 pb-4">
                    <h2 className={`text-xl font-bold ${genderColor} flex items-center gap-2`}>
                      <LogIn className="w-5 h-5" />
                      Student Login
                    </h2>
                    <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                      Secure Access
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Roll Number / Mobile Number (Username)</Label>
                      <Input
                        id="rollNumber"
                        placeholder="Enter Roll No. or Mobile No."
                        value={loginData.rollNumber}
                        onChange={(e) => setLoginData({ ...loginData, rollNumber: e.target.value.toUpperCase() })}
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
                              <Label>Email Address</Label>
                              <Input
                                type="email"
                                placeholder="Enter your registered email"
                                value={forgotPasswordData.email}
                                onChange={(e) => setForgotPasswordData({ email: e.target.value.toLowerCase() })}
                                className="h-12"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              A password reset link will be sent to your registered email address.
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
                  <div className="flex items-center justify-between border-b-2 border-accent/10 pb-4">
                    <h2 className="text-xl font-bold text-accent flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Student Registration
                    </h2>
                    <div className="bg-accent/10 text-accent text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                      New Account
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">Full Name *</Label>
                        <Input
                          id="studentName"
                          placeholder="Your full name"
                          value={registerData.studentName}
                          onChange={(e) => setRegisterData({ ...registerData, studentName: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regRollNumber">Roll Number / Mobile Number *</Label>
                        <Input
                          id="regRollNumber"
                          placeholder="e.g. 21GK1A0501 or Mobile No."
                          value={registerData.rollNumber}
                          onChange={(e) => setRegisterData({ ...registerData, rollNumber: e.target.value.toUpperCase() })}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="regEmail">Email Address</Label>
                        <Input
                          id="regEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch *</Label>
                        <Select value={registerData.branch} onValueChange={(v) => setRegisterData({ ...registerData, branch: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-2 border-border z-[100]">
                            {branches.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Current Year *</Label>
                        <Select value={registerData.year} onValueChange={(v) => setRegisterData({ ...registerData, year: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-2 border-border z-[100]">
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor">Floor Number *</Label>
                        <Select value={registerData.floorNumber} onValueChange={(v) => setRegisterData({ ...registerData, floorNumber: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select Floor" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-2 border-border z-[100]">
                            {floors.map(f => <SelectItem key={f} value={f}>Floor {f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="blockType">Hostel Block *</Label>
                        <Select value={registerData.hostelBlockType} onValueChange={(v) => setRegisterData({ ...registerData, hostelBlockType: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select Block" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-2 border-border z-[100]">
                            <SelectItem value="ac">AC Block</SelectItem>
                            <SelectItem value="normal">Non-AC Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roomNumber">Preferred Room *</Label>
                        <Select value={registerData.roomNumber} onValueChange={(v) => setRegisterData({ ...registerData, roomNumber: v })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={availableRooms.length > 0 ? "Select Room" : "No rooms available"} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-2 border-border z-[100]">
                            {availableRooms.map(r => (
                              <SelectItem key={r.room_number} value={r.room_number}>
                                Room {r.room_number} ({r.total_beds - (r.occupied_beds || 0) - (r.closed_beds || 0)} free) - ₹{getRoomFee(r).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo">Profile Photo</Label>
                      <div className="flex items-center gap-4 p-4 border-2 border-dashed border-border rounded-xl bg-muted/30">
                        <div className="w-16 h-16 rounded-full bg-background border flex items-center justify-center overflow-hidden">
                          {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                              <Upload className="w-4 h-4" />
                              {photoFile ? photoFile.name : "Upload photo"}
                            </div>
                          </Label>
                          <Input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                            Max file size: 3MB (JPEG/PNG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="regPass">Password *</Label>
                        <div className="relative">
                          <Input
                            id="regPass"
                            type={showPassword ? "text" : "password"}
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            className="h-12 pr-10"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPass">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPass"
                            type={showConfirmPassword ? "text" : "password"}
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            className="h-12 pr-10"
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || isUploadingPhoto}>
                      {isLoading ? "Processing..." : "Register Now"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

            )}
          </CardContent>
        </Card>
      </main>
    </div >
  );
};

export default StudentLogin;
