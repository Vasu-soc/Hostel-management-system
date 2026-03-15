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
import { ArrowLeft, Users, UserPlus, Eye, EyeOff, Camera, Upload, LogIn, Sparkles, ShieldCheck, Check, X } from "lucide-react";
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
import { logger } from "@/lib/logger";

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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-muted" };
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 33, label: "Low", color: "bg-destructive" };
    if (score <= 4) return { score: 66, label: "Medium", color: "bg-yellow-500" };
    return { score: 100, label: "Hard", color: "bg-green-500" };
  };

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 14; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRegisterData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
    toast({
        title: "Strong Password Suggested",
        description: "A secure password has been generated for you.",
        duration: 3000,
    });
  };

  const strength = getPasswordStrength(registerData.password);

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
      return room.total_beds <= 2 ? 100000 : 75000;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");

      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        return;
      }

      if (!roomsData || roomsData.length === 0) {
        console.warn("No rooms found in database");
        return;
      }

      console.log(`Fetched ${roomsData.length} total rooms from Supabase`);

      // Fetch students to correctly override potentially desycnced database occupied_beds
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, hostel_room_number, room_allotted");

      const deletedIds = await localApi.getDeletedIds();
      const actualOccupiedCounts: Record<string, number> = {};

      if (studentsData) {
        studentsData.forEach(student => {
          // Count student if they have room number, whether allotted or just pending (blocked)
          if (student.hostel_room_number && !deletedIds.includes(student.id)) {
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
        const roomNum = (r.room_number || "").trim().toUpperCase();
        r.occupied_beds = actualOccupiedCounts[r.room_number] || 0;

        if (isBoys) {
          return (roomNum.startsWith('A') || roomNum.startsWith('N')) &&
            !roomNum.startsWith('GA') && !roomNum.startsWith('GN');
        } else {
          return roomNum.startsWith('GA') || roomNum.startsWith('GN');
        }
      });
      setAllRooms(filteredRooms);
      console.log(`Filtered to ${filteredRooms.length} ${gender} rooms`);
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
      // 1. Check Floor Number (Robust matching: 'Floor 1' vs '1')
      const dbFloor = String(room.floor_number || "").replace(/\D/g, '').trim();
      const selectedFloor = String(registerData.floorNumber || "").replace(/\D/g, '').trim();
      if (dbFloor !== selectedFloor && dbFloor !== "" && selectedFloor !== "") return false;

      // 2. Check AC Type (Robust matching: 'ac' vs 'AC Block')
      const dbAc = String(room.ac_type || "").trim().toLowerCase();
      const selectedAc = String(registerData.hostelBlockType || "").trim().toLowerCase();

      const isAcSelected = selectedAc.includes('ac');
      const isAcDb = dbAc === 'ac' || dbAc.includes('ac');

      if (isAcSelected !== isAcDb) return false;

      // 3. Check availability
      const occupied = Number(room.occupied_beds || 0);
      const closed = Number(room.closed_beds || 0);
      const total = Number(room.total_beds || 0);
      const available = total - occupied - closed;

      return available > 0;
    });

    console.log(`Preferred Room Filter: found ${filtered.length} rooms for Floor ${registerData.floorNumber}, Block ${registerData.hostelBlockType}`);
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

    // Dummy credentials for testing
    if (loginData.rollNumber.toLowerCase() === "vasu" && loginData.password === "200421") {
      const dummyStudent = {
        id: "dummy-id-vasu",
        roll_number: "VASU",
        student_name: "Vasu (Guest)",
        gender: gender === "boys" ? "male" : "female",
        branch: "CSE",
        year: "3rd Year",
        room_allotted: true,
        hostel_room_number: gender === "boys" ? "B101" : "G101",
        total_fee: 100000,
        paid_fee: 75000,
        pending_fee: 25000,
        photo_url: null,
      };
      setStudentSession(dummyStudent);
      logger.info("login", "VASU", "success");
      toast({
        title: "Logged in with Dummy Account",
        description: "Welcome back, Vasu!",
      });
      navigate(`/student-dashboard?gender=${gender}`);
      setIsLoading(false);
      return;
    }

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("roll_number", loginData.rollNumber.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        logger.error("login", loginData.rollNumber, "failure");
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
        logger.error("login", loginData.rollNumber, "failure");
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
        logger.error("login", loginData.rollNumber, "failure");
        toast({
          title: "Invalid Password",
          description: "Please check your password and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (student.password === "hostel@123" || student.password === "Hostel@123") {
        setStudentForPassword(student as Record<string, unknown>);
        setIsFirstTimeLogin(true);
        toast({
          title: "First Time Login",
          description: "Please change your one-time default password to continue",
        });
        setIsLoading(false);
        return;
      }
      
      // Check if student is approved (room_allotted is our approval flag)
      if (!student.room_allotted) {
        logger.error("login", loginData.rollNumber, "failure");
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
      logger.info("login", loginData.rollNumber, "success");
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

      logger.info("password_setup", studentForPassword.roll_number as string, "success");
      toast({
        title: "Password Set Successfully!",
        description: "You are now logged in",
      });

      navigate(`/student-dashboard?gender=${gender}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to set password";
      logger.error("password_setup", studentForPassword?.roll_number as string, "failure");
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
      const fee = selectedRoomData ? getRoomFee(selectedRoomData) : 100000;

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

      logger.info("student_registration", registerData.rollNumber.toUpperCase(), "success");
      toast({
        title: "Registration Successful!",
        description: "You can now login with your Roll Number and password",
      });

      setActiveTab("login");
      setLoginData({ ...loginData, rollNumber: registerData.rollNumber.toUpperCase() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      logger.error("student_registration", registerData.rollNumber.toUpperCase(), "failure");
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
        logger.info("password_reset_request", forgotPasswordData.email, "success");
        toast({
          title: "Email Sent",
          description: data.message || "Password reset link has been sent to your email",
        });
        setShowForgotPassword(false);
        setForgotPasswordData({ email: "" });
      } else {
        logger.error("password_reset_request", forgotPasswordData.email, "failure");
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
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login" className="font-bold">Login</TabsTrigger>
                  <TabsTrigger value="register" className="font-bold">Register</TabsTrigger>
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
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                  <div className="flex items-center justify-between border-b-2 border-primary/10 pb-4">
                    <h2 className={`text-xl font-bold ${genderColor} flex items-center gap-2`}>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </h2>
                    <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                      New Student
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center space-y-2 pb-4">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden bg-muted">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </span>
                        </Button>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="regRollNumber">Roll Number *</Label>
                        <Input
                          id="regRollNumber"
                          placeholder="e.g. 21GK1A0501"
                          value={registerData.rollNumber}
                          onChange={(e) => setRegisterData({ ...registerData, rollNumber: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentName">Student Name *</Label>
                        <Input
                          id="studentName"
                          placeholder="Full Name"
                          value={registerData.studentName}
                          onChange={(e) => setRegisterData({ ...registerData, studentName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch *</Label>
                        <Select onValueChange={(value) => setRegisterData({ ...registerData, branch: value })} value={registerData.branch}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((b) => (
                              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year *</Label>
                        <Select onValueChange={(value) => setRegisterData({ ...registerData, year: value })} value={registerData.year}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="floorNumber">Floor *</Label>
                        <Select onValueChange={(value) => setRegisterData({ ...registerData, floorNumber: value })} value={registerData.floorNumber}>
                          <SelectTrigger>
                            <SelectValue placeholder="Floor" />
                          </SelectTrigger>
                          <SelectContent>
                            {floors.map((f) => (
                              <SelectItem key={f} value={f}>Floor {f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="blockType">Block Type *</Label>
                        <Select onValueChange={(value) => setRegisterData({ ...registerData, hostelBlockType: value })} value={registerData.hostelBlockType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Block Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ac">AC Block</SelectItem>
                            <SelectItem value="non-ac">Non-AC Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Preferred Room *</Label>
                      <Select 
                        onValueChange={(value) => setRegisterData({ ...registerData, roomNumber: value })} 
                        value={registerData.roomNumber}
                        disabled={!registerData.floorNumber || !registerData.hostelBlockType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={availableRooms.length > 0 ? "Choose available room" : "No rooms available"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {availableRooms.map((r) => (
                            <SelectItem key={r.room_number} value={r.room_number}>
                              Room {r.room_number} ({r.total_beds - (r.occupied_beds || 0)} left)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableRooms.length === 0 && (registerData.floorNumber && registerData.hostelBlockType) && (
                        <p className="text-[10px] text-destructive font-bold italic">No availability in selected floor/block</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between h-5">
                          <Label htmlFor="regPassword">Password *</Label>
                          <button
                            type="button"
                            onClick={generateStrongPassword}
                            className="text-[10px] flex items-center gap-1 text-primary hover:text-primary/80 font-bold transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            Suggest Strong
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="regPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 6 characters"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between h-5">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        </div>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Match password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            className="h-11 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Indicator - Moved below grid to keep layout balanced */}
                    {registerData.password && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300 mt-2 p-3 bg-muted/30 rounded-lg border border-primary/5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1 font-medium text-muted-foreground">
                            <ShieldCheck className="w-3 h-3" />
                            Security Strength: 
                            <span className={
                              strength.label === "Low" ? "text-destructive" : 
                              strength.label === "Medium" ? "text-yellow-600" : "text-green-600"
                            }>
                              {strength.label}
                            </span>
                          </span>
                          <span className="text-muted-foreground font-bold">{strength.score}% Secure</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${strength.color} transition-all duration-500 ease-out`}
                            style={{ width: `${strength.score}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="flex items-center gap-1 text-[9px]">
                                {registerData.password.length >= 8 ? <Check className="w-2.5 h-2.5 text-green-500" /> : <X className="w-2.5 h-2.5 text-muted-foreground/50" />}
                                <span className={registerData.password.length >= 8 ? "text-green-600" : "text-muted-foreground"}>8+ Chars</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px]">
                                {/[A-Z]/.test(registerData.password) ? <Check className="w-2.5 h-2.5 text-green-500" /> : <X className="w-2.5 h-2.5 text-muted-foreground/50" />}
                                <span className={/[A-Z]/.test(registerData.password) ? "text-green-600" : "text-muted-foreground"}>Uppercase</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px]">
                                {/[0-9]/.test(registerData.password) ? <Check className="w-2.5 h-2.5 text-green-500" /> : <X className="w-2.5 h-2.5 text-muted-foreground/50" />}
                                <span className={/[0-9]/.test(registerData.password) ? "text-green-600" : "text-muted-foreground"}>Numbers</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px]">
                                {/[^A-Za-z0-9]/.test(registerData.password) ? <Check className="w-2.5 h-2.5 text-green-500" /> : <X className="w-2.5 h-2.5 text-muted-foreground/50" />}
                                <span className={/[^A-Za-z0-9]/.test(registerData.password) ? "text-green-600" : "text-muted-foreground"}>Symbols</span>
                            </div>
                        </div>
                      </div>
                    )}

                    <Button type="submit" variant="hero" size="lg" className="w-full mt-4" disabled={isLoading || isUploadingPhoto}>
                      {isLoading ? "Creating Account..." : "Register Now"}
                    </Button>
                  </form>
                </TabsContent>

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
              </Tabs>
            )
}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentLogin;
