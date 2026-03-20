import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LeaveExtensionDialog } from "@/components/LeaveExtensionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Zap,
  UtensilsCrossed,
  Calendar,
  Clock,
  Check,
  X,
  Loader2,
  FileText,
  ExternalLink,
  Phone,
  Printer,
  AlertCircle,
  BookOpen,
  Pill,
  Utensils,
  Library,
  Camera,
  User,
  ShieldCheck,
  ChevronDown,
  Download,
  Search,
  CreditCard,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";
import PaymentPortal from "@/components/PaymentPortal";
import { gatePassSchema, issueReportSchema, formatValidationErrors } from "@/lib/validations";
import { getStudentSession, clearStudentSession, StudentSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const WARDEN_CONTACT = "9553866278";

const hostelRules = [
  "Students must return to the hostel by 9:00 PM.",
  "Quiet hours are between 10:00 PM and 6:00 AM.",
  "Visitors are not allowed inside student rooms.",
  "Illegal substances are strictly prohibited.",
  "Main gate closes at 10:00 PM sharpen.",
];

const StudentDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const gender = searchParams.get("gender") || "boys";

  const [student, setStudent] = useState<StudentSession | null>(null);
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [leaveExtensions, setLeaveExtensions] = useState<any[]>([]);
  const [feeTransactions, setFeeTransactions] = useState<Record<string, unknown>[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<Record<string, unknown>[]>([]);
  const [branchMarks, setBranchMarks] = useState<any[]>([]);
   const [attendanceReports, setAttendanceReports] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [medicalAlerts, setMedicalAlerts] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [issueReportDialogOpen, setIssueReportDialogOpen] = useState(false);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState<"food" | "electrical" | "room" | "">("");
  const [selectedSubOption, setSelectedSubOption] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [medicalIssueType, setMedicalIssueType] = useState("");
  const [foodSelectionDialogOpen, setFoodSelectionDialogOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState("");
  const [wardenSignature, setWardenSignature] = useState<string | null>(null);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [resourcesDialogOpen, setResourcesDialogOpen] = useState(false);
  const [paymentHistoryDialogOpen, setPaymentHistoryDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ rollNumber: "", password: "", email: "", address: "", zipCode: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [activePassType, setActivePassType] = useState<"gatepass" | "leave">("gatepass");
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `GatePass_QR_${student?.roll_number}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast({ title: "QR Downloaded", description: "Gate pass QR saved to your device" });
    }
  };
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [gatePassForm, setGatePassForm] = useState({
    email: "",
    studentMobile: "",
    parentMobile: "",
    outDate: "",
    inDate: "",
    outTime: "",
    inTime: "",
    purpose: "",
  });

  const refreshStudentData = async (studentId: string) => {
    console.log("Refreshing student data for ID:", studentId);
    setIsLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Error refreshing student data:", error);
      setIsLoading(false);
      return;
    }

    if (data) {
      console.log("Fetched latest student data:", data);
      if (data.password === "Hostel@123") {
        setIsDefaultPassword(true);
      } else {
        setIsDefaultPassword(false);
      }
      setStudent(prev => {
        const updated = (prev ? { ...prev, ...data } : { ...data, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }) as StudentSession;
        // Sync back to session storage so it persists
        sessionStorage.setItem('currentStudent', JSON.stringify({
          ...updated,
          expiresAt: prev?.expiresAt || (Date.now() + 8 * 60 * 60 * 1000)
        }));
        return updated;
      });
      // Refresh historical data too
      fetchFeeTransactions(data.id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const session = getStudentSession();
    if (!session) {
      navigate(`/student-login?gender=${gender}`);
      return;
    }
    setStudent(session);
    setSettingsForm({
      rollNumber: session.roll_number,
      password: "",
      email: session.email || "",
      address: (session as any).address || "",
      zipCode: (session as any).zip_code || ""
    });
    refreshStudentData(session.id);
    fetchFeeTransactions(session.id);
    loadGatePasses(session.roll_number);
     loadAttendanceReports(session.id);
    fetchTodayAttendance(session.id);
    loadStudyMaterials(session.branch, session.year);
    loadBranchMarks(session.branch, session.year);
    loadMedicalAlerts(session.id);
    fetchMedicines();

    // Subscribe to medicine updates
    const medicineChannel = supabase
      .channel("medicines-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "medicines" }, () => {
        fetchMedicines();
      })
      .subscribe();

     // Subscribe to medical alert updates
    const medicalChannel = supabase
      .channel("medical-alerts-student")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "medical_alerts",
        filter: `student_id=eq.${session.id}`
      }, () => {
        loadMedicalAlerts(session.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(medicineChannel);
      supabase.removeChannel(medicalChannel);
    };
  }, [gender, navigate]);

  const fetchMedicines = async () => {
    const { data } = await supabase.from("medicines").select("*");
    if (data) setMedicines(data);
  };

  const fetchFeeTransactions = async (studentId: string) => {
    console.log(`Attempting to fetch fee transactions for student ID: ${studentId}`);
    const { data, error } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false });
    if (error) {
      console.error("Fee Transactions Fetch Error:", error.message);
      setFeeTransactions([]);
      return;
    }

    console.log(`Fetched ${data?.length || 0} transactions for student ${studentId}`);
    if (data) setFeeTransactions(data);
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (!settingsForm.rollNumber || !settingsForm.password) {
      toast({ title: "Validation Error", description: "Roll Number and Password are required.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from("students")
      .update({
        roll_number: settingsForm.rollNumber.toUpperCase(),
        password: settingsForm.password,
        email: settingsForm.email,
        address: settingsForm.address,
        zip_code: settingsForm.zipCode
      })
      .eq("id", student.id);

    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to update settings", variant: "destructive" });
      return;
    }

    toast({ title: "Settings Updated", description: "Your Roll Number / Password has been updated successfully!" });
    setSettingsDialogOpen(false);
    refreshStudentData(student.id);
  };

  // Real-time subscription for student data (fees, room info)
  useEffect(() => {
    if (!student?.id) return;

    const channel = supabase
      .channel(`student-updates-${student.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "students",
          filter: `id=eq.${student.id}`,
        },
        (payload) => {
          console.log("Real-time student update:", payload);
          setStudent((prev) => {
            const updated = (prev ? { ...prev, ...payload.new } : { ...payload.new, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }) as StudentSession;
            // Also sync real-time changes to sessionStorage
            sessionStorage.setItem("currentStudent", JSON.stringify(updated));
            return updated;
          });
          // CRITICAL: Refresh transactions when student record updates!
          if (payload.new.id) fetchFeeTransactions(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student?.id]);

  // Real-time: fee transactions (so history updates instantly when warden adds payment)
  useEffect(() => {
    if (!student?.id) return;
    const channel = supabase
      .channel(`fee-updates-${student.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "fee_transactions",
        filter: `student_id=eq.${student.id}`,
      }, () => {
        fetchFeeTransactions(student.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [student?.id]);

  // Real-time: gate passes (so approved status + warden signature load instantly)
  useEffect(() => {
    if (!student?.roll_number) return;
    const channel = supabase
      .channel(`gatepass-updates-${student.roll_number}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "gate_passes",
        filter: `roll_number=eq.${student.roll_number}`,
      }, () => {
        loadGatePasses(student.roll_number);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [student?.roll_number]);

  const fetchTodayAttendance = async (studentId: string) => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error) throw error;
      setTodayAttendance(data);
    } catch (e) {
      console.error("Error fetching today's attendance:", e);
    }
  };

  // Real-time: daily attendance
  useEffect(() => {
    if (!student?.id) return;
    const channel = supabase
      .channel(`daily-attendance-${student.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "daily_attendance",
        filter: `student_id=eq.${student.id}`,
      }, () => {
        fetchTodayAttendance(student.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [student?.id]);

  // --- Profile Photo Upload ---
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!student || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Photo must be under 2MB", variant: "destructive" });
      return;
    }

    setIsUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const fileName = `${student.id}/profile_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      setIsUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("student-photos").getPublicUrl(fileName);
    const photoUrl = urlData.publicUrl;

    const { error: updateError, data: updatedStudent } = await supabase
      .from("students")
      .update({ photo_url: photoUrl })
      .eq("id", student.id)
      .select()
      .single();

    if (updateError) {
      toast({ title: "Update Failed", description: updateError.message, variant: "destructive" });
    } else {
      if (updatedStudent) {
        const updated = { ...student, photo_url: photoUrl };
        setStudent(updated as StudentSession);
        sessionStorage.setItem("currentStudent", JSON.stringify(updated));
        toast({ title: "Photo Updated!", description: "Your profile photo has been updated successfully." });
      }
    }
    setIsUploadingPhoto(false);
     // Reset input so same file can be re-selected
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const loadMedicalAlerts = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('medical_alerts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMedicalAlerts(data || []);
    } catch (e) {
      console.error("Failed to fetch medical alerts:", e);
    }
  };

  const loadAttendanceReports = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_reports')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Failed to fetch attendance reports:", error.message);
        return;
      }
      setAttendanceReports(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGatePasses = async (rollNumber: string) => {
    try {
      const { data } = await supabase
        .from("gate_passes")
        .select("*")
        .eq("roll_number", rollNumber)
        .order("created_at", { ascending: false });

      if (data) {
        setGatePasses(data as Record<string, unknown>[]);
        // Load warden signature if latest gate pass is approved
        if (data[0] && data[0].status === "approved") {
          loadWardenSignature();
        }
      }

      const { data: extData } = await supabase
        .from("leave_extensions")
        .select("*")
        .eq("roll_number", rollNumber)
        .order("created_at", { ascending: false });

      if (extData) setLeaveExtensions(extData);
    } catch (e) {
      console.error(e);
    }
  };

  const loadWardenSignature = async () => {
    const { data } = await supabase
      .from("wardens")
      .select("signature_url")
      .not("signature_url", "is", null)
      .limit(1)
      .maybeSingle();
    if (data?.signature_url) {
      setWardenSignature(data.signature_url);
    }
  };

  const loadStudyMaterials = async (branch: string, year: string) => {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('branch', branch)
        .eq('year', year)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyMaterials(data || []);
    } catch (e) {
      console.error("Failed to load study materials", e);
      setStudyMaterials([]);
    }
  };

  const loadBranchMarks = async (branch: string, year: string) => {
    try {
      const { data, error } = await supabase
        .from('branch_marks')
        .select('*')
        .eq('branch', branch)
        .eq('year', year)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBranchMarks(data || []);
    } catch (e) {
      console.error("Failed to load branch marks", e);
      setBranchMarks([]);
    }
  };

  const handleLogout = () => {
    if (student) {
      logger.info("logout", student.roll_number, "success");
    }
    clearStudentSession();
    navigate("/");
  };

  const handleGatePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    // Validate gate pass form
    const validation = gatePassSchema.safeParse(gatePassForm);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: formatValidationErrors(validation.error),
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase.from("gate_passes").insert({
      student_id: student.id,
      student_name: student.student_name,
      roll_number: student.roll_number,
      branch: student.branch,
      student_email: gatePassForm.email.trim() || student.email || null,
      student_mobile: gatePassForm.studentMobile || null,
      parent_mobile: gatePassForm.parentMobile || null,
      out_date: gatePassForm.outDate,
      in_date: gatePassForm.inDate,
      out_time: gatePassForm.outTime || null,
      in_time: gatePassForm.inTime || null,
      purpose: gatePassForm.purpose.trim(),
      pass_type: activePassType,
    });

    if (error) {
      logger.error("gate_pass_submission", student.roll_number, "failure");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    logger.info("gate_pass_submission", student.roll_number, "success");
    // Send notification to warden email (fire and forget)
    supabase.functions.invoke("send-request-notification", {
      body: {
        type: "gate_pass",
        studentName: student.student_name,
        rollNumber: student.roll_number,
        outDate: gatePassForm.outDate,
        inDate: gatePassForm.inDate,
        purpose: gatePassForm.purpose.trim(),
      },
    }).catch((err) => console.error("Failed to send notification:", err));

    toast({ title: "Gate Pass Submitted", description: "Your request has been sent to the warden" });
    loadGatePasses(student.roll_number);
    setGatePassForm({ email: "", studentMobile: "", parentMobile: "", outDate: "", inDate: "", outTime: "", inTime: "", purpose: "" });
  };

  const handleIssueSubmit = async () => {
    if (!student || !issueCategory || !selectedSubOption) {
      toast({ title: "Validation Error", description: "Please select a category and sub-option.", variant: "destructive" });
      return;
    }

    // Validate issue description (optional, but if provided, must meet schema)
    if (issueDescription.trim().length > 0 && issueDescription.trim().length < 5) {
      toast({ title: "Validation Error", description: "Comments must be at least 5 characters if provided.", variant: "destructive" });
      return;
    }

    const tableMap = {
      food: "food_issues",
      electrical: "electrical_issues",
      room: "room_issues"
    };

    const table = tableMap[issueCategory as keyof typeof tableMap];
    
    const baseData = {
      student_id: student.id,
      student_name: student.student_name,
      roll_number: student.roll_number,
      issue_type: selectedSubOption,
      description: issueDescription.trim() || `Issue: ${selectedSubOption}`,
      status: "pending"
    };

    const insertData = issueCategory === "food" 
      ? baseData 
      : { ...baseData, room_number: student.hostel_room_number || "N/A" };

    const { error } = await (supabase as any).from(table).insert(insertData);
    
    if (error) {
      logger.error(`${issueCategory}_issue_report`, student.roll_number, "failure");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    logger.info(`${issueCategory}_issue_report`, student.roll_number, "success");

    // Send notification to warden email
    supabase.functions.invoke("send-request-notification", {
      body: {
        type: `${issueCategory}_issue`,
        studentName: student.student_name,
        rollNumber: student.roll_number,
        roomNumber: student.hostel_room_number || "N/A",
        issueType: selectedSubOption,
        description: issueDescription.trim() || "No additional comments",
      },
    }).catch((err) => console.error("Failed to send notification:", err));

    toast({ title: "Issue Reported", description: `Your ${issueCategory} issue has been reported.` });
    
    // Reset form
    setIssueDescription("");
    setSelectedSubOption("");
    setIssueCategory("");
    setIssueReportDialogOpen(false);
  };

  const handleMedicalAlertSubmit = async () => {
    if (!student || !medicalIssueType) return;

    // Save directly to Supabase — same pattern as electrical/food issues
    const { error } = await supabase.from("medical_alerts").insert({
      student_id: student.id,
      student_name: student.student_name,
      roll_number: student.roll_number,
      room_number: student.hostel_room_number || "N/A",
      issue_type: medicalIssueType,
      status: "pending",
    });

    if (error) {
      logger.error("medical_alert", student.roll_number, "failure");
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    logger.info("medical_alert", student.roll_number, "success");

    // Send notification to warden email (fire and forget)
    supabase.functions.invoke("send-request-notification", {
      body: {
        type: "medical_alert",
        studentName: student.student_name,
        rollNumber: student.roll_number,
        roomNumber: student.hostel_room_number || "N/A",
        issueType: medicalIssueType,
      },
    }).catch((err) => console.error("Failed to send notification:", err));

    toast({
      title: "Medical Alert Sent",
      description: "Warden and Parent have been notified immediately."
    });
    setMedicalIssueType("");
    setMedicalDialogOpen(false);
  };

  const handleFoodSelectionSubmit = async () => {
    if (!student || !selectedFoodItem) return;

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSelections, error: countError } = await supabase
        .from('food_selections')
        .select('id')
        .eq('student_id', student.id)
        .gte('created_at', twentyFourHoursAgo);

      if (countError) throw countError;

      if (recentSelections && recentSelections.length >= 3) {
        toast({
          title: "Limit Exceeded",
          description: "You can only make 3 food selections per 24 hours. Please try again later.",
          variant: "destructive"
        });
        setFoodSelectionDialogOpen(false);
        return;
      }

      const { error } = await supabase.from('food_selections').insert({
        student_id: student.id,
        student_name: student.student_name,
        roll_number: student.roll_number,
        food_item: selectedFoodItem,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save food selection", variant: "destructive" });
      return;
    }

    toast({
      title: "Food Selection Sent",
      description: "Your selection has been forwarded to the warden."
    });
    setSelectedFoodItem("");
    setFoodSelectionDialogOpen(false);
  };

   const latestGatePass = gatePasses[0] as any | undefined;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="status-approved px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Approved</span>;
      case "rejected": return <span className="status-rejected px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><X className="w-4 h-4" /> Rejected</span>;
      default: return <span className="status-pending px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Pending</span>;
    }
  };

  if (!student) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const genderLabel = gender === "boys" ? "Boys" : "Girls";

  return (
    <div className="min-h-screen bg-background">
      {isDefaultPassword && (
        <div className="bg-destructive text-destructive-foreground p-3 text-center text-sm font-bold animate-pulse sticky top-0 z-[100] flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          SECURITY WARNING: You are using the default password. Please change it in Settings immediately!
          <Button
            variant="outline"
            size="sm"
            className="ml-4 h-8 bg-white text-destructive hover:bg-neutral-100 border-none"
            onClick={() => setSettingsDialogOpen(true)}
          >
            Go to Settings
          </Button>
        </div>
      )}
      {/* Hidden file input for profile photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleProfilePhotoUpload}
      />

      {/* College Header */}
      <CollegeHeader />

      {/* Enhanced Top Bar */}
      <DashboardHeader
        title={`${genderLabel} Student Page`}
        titleColor={gender === "boys" ? "text-accent" : "text-primary"}
        userName={student.student_name}
        userSubtitle={
          isUploadingPhoto ? "Uploading photo..." : (
            <div className="flex flex-col gap-0.5">
              <span>{student.roll_number}</span>
              <span className="text-xs opacity-80">{student.branch?.toUpperCase()} • {student.year} Year</span>
            </div>
          )
        }
        userPhotoUrl={student.photo_url || undefined}
        onLogout={handleLogout}
        onPhotoUpload={() => photoInputRef.current?.click()}
        onSettingsClick={() => setSettingsDialogOpen(true)}
        studentId={student.id}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Features & Content */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'fees' ? 'border-primary bg-primary/10 font-bold' : 'border-primary/20 hover:bg-primary/5 hover:border-primary font-bold'}`}
                onClick={() => setActiveTab(activeTab === 'fees' ? null : 'fees')}
              >
                <IndianRupee className="w-6 h-6 text-primary" />
                <span className="text-sm">Fee Details</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'history' ? 'border-primary bg-primary/10 font-bold' : 'border-primary/20 hover:bg-primary/5 hover:border-primary font-bold'}`}
                onClick={() => setActiveTab(activeTab === 'history' ? null : 'history')}
              >
                <Clock className="w-6 h-6 text-primary" />
                <span className="text-sm">History</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'portal' ? 'border-primary bg-primary/10 font-bold' : 'border-primary/20 hover:bg-primary/5 hover:border-primary font-bold'}`}
                onClick={() => setActiveTab(activeTab === 'portal' ? null : 'portal')}
              >
                <CreditCard className="w-6 h-6 text-primary" />
                <span className="text-sm">Portal</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'remarks' ? 'border-primary bg-primary/10 font-bold' : 'border-primary/20 hover:bg-primary/5 hover:border-primary font-bold'}`}
                onClick={() => setActiveTab(activeTab === 'remarks' ? null : 'remarks')}
              >
                <MessageSquare className="w-6 h-6 text-primary" />
                <span className="text-sm text-center">Remarks & Alerts</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'attendance' ? 'border-primary bg-primary/10 font-bold' : 'border-primary/20 hover:bg-primary/5 hover:border-primary font-bold'}`}
                onClick={() => setActiveTab(activeTab === 'attendance' ? null : 'attendance')}
              >
                <User className="w-6 h-6 text-primary" />
                <span className="text-sm">Attendance</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'marks' ? 'border-primary bg-primary/10 font-bold' : 'border-primary/20 hover:bg-primary/5 hover:border-primary font-bold'}`}
                onClick={() => setActiveTab(activeTab === 'marks' ? null : 'marks')}
              >
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-sm">Branch Marks</span>
              </Button>

              <LeaveExtensionDialog 
                studentId={student.id} 
                rollNumber={student.roll_number} 
                gatePassId={latestGatePass?.id as string || ""}
                onSuccess={() => loadGatePasses(student.roll_number)}
                trigger={
                  <Button 
                    variant="outline" 
                    disabled={!latestGatePass || latestGatePass.status !== 'approved'}
                    className={`h-24 w-full flex flex-col gap-2 items-center justify-center border-2 border-warning/20 transition-all shadow-sm hover:bg-warning/5 hover:border-warning font-bold ${(!latestGatePass || latestGatePass.status !== 'approved') ? 'opacity-50 grayscale' : ''}`}
                  >
                    <Clock className="w-6 h-6 text-warning" />
                    <span className="text-sm">Extend Leave</span>
                  </Button>
                }
              />
            </div>

            {/* Dynamic Feature Content Box */}
            {activeTab && (
              <Card className="border-2 border-primary/30 shadow-md animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {activeTab === 'fees' && <IndianRupee className="w-5 h-5 text-primary" />}
                    {activeTab === 'history' && <Clock className="w-5 h-5 text-primary" />}
                    {activeTab === 'portal' && <CreditCard className="w-5 h-5 text-primary" />}
                    {activeTab === 'remarks' && <MessageSquare className="w-5 h-5 text-primary" />}
                    {activeTab === 'attendance' && <User className="w-5 h-5 text-primary" />}
                    {activeTab === 'marks' && <FileText className="w-5 h-5 text-primary" />}
                    {activeTab === 'fees' ? 'Fees Overview' : 
                     activeTab === 'history' ? 'Payment History' : 
                     activeTab === 'portal' ? 'Payment Portal' : 
                     activeTab === 'remarks' ? 'Remarks & Medical Alerts' : 
                     activeTab === 'attendance' ? 'Attendance Reports' :
                     'Branch Mark List'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 max-h-[600px] overflow-y-auto">
                  {activeTab === 'fees' && (
                    <div className="space-y-4">
                      {student.pending_fee <= 0 && (
                        <div className="p-4 bg-success/10 border-2 border-dashed border-success/30 rounded-xl text-center mb-4">
                          <div className="flex items-center justify-center gap-2 text-success mb-1">
                            <Check className="w-5 h-5" />
                            <span className="font-bold text-sm uppercase tracking-wider">Fees Completed!</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">Your annual dues are fully cleared.</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 border-b border-border/50 text-foreground">
                        <span className="text-sm font-medium">Total Fee</span>
                        <span className="font-bold text-xl tracking-tight italic">₹{Number(student.total_fee ?? 100000).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50 text-success">
                        <span className="text-sm font-medium">Total Paid (History)</span>
                        <span className="font-bold text-xl tracking-tight italic">₹{Number(student.paid_fee ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 text-destructive">
                        <span className="text-sm font-medium">Pending Balance</span>
                        <span className="font-bold text-xl tracking-tight italic">₹{Number(student.pending_fee ?? 100000).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {feeTransactions.length > 0 ? (
                        Array.from(new Set(feeTransactions.map((tx: any) => tx.academic_year || "Unknown"))).map((year: string) => (
                          <div key={year} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="h-[1px] flex-1 bg-border"></div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">{year}</span>
                              <div className="h-[1px] flex-1 bg-border"></div>
                            </div>
                            <div className="space-y-2">
                              {feeTransactions.filter((tx: any) => (tx.academic_year || "Unknown") === year).map((tx: any, idx, arr) => (
                                <div key={tx.id} className="group flex items-center justify-between p-3 bg-primary/5 border-2 border-primary/10 rounded-xl hover:bg-primary/10 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                                      {arr.length - idx}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm italic">₹{tx.amount.toLocaleString()}</p>
                                      <p className="text-[10px] text-muted-foreground">{new Date(tx.payment_date).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] bg-white text-success border-success/20">Verified</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No payment history found.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'portal' && <PaymentPortal student={student} />}

                  {activeTab === 'remarks' && (
                    <div className="space-y-4">
                      {medicalAlerts.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-destructive flex items-center gap-2 uppercase tracking-widest">
                            <Pill className="w-3 h-3" />
                            Medical Alerts
                          </p>
                          {medicalAlerts.map((alert) => (
                            <div key={alert.id} className={`p-3 border-2 rounded-xl flex flex-col gap-2 ${alert.status === 'resolved' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/10'}`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className={`font-bold capitalize text-xs ${alert.status === 'resolved' ? 'text-success' : 'text-destructive'}`}>
                                    {alert.issue_type}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {new Date(alert.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-[8px] font-black tracking-widest uppercase ${alert.status === 'resolved' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                  {alert.status || 'pending'}
                                </Badge>
                              </div>
                              {alert.status === 'resolved' && (
                                <p className="text-xs font-medium text-success flex items-center gap-2">
                                  <Check className="w-3 h-3" />
                                  Resolved
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="p-4 bg-muted/50 rounded-xl border-2 border-border shadow-inner">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Warden's Remarks</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {student.remarks || "No active remarks from warden."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'attendance' && (
                    <div className="space-y-4">
                      {todayAttendance && (
                        <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary/20 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Today's Presence</p>
                            <p className="font-bold text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          </div>
                          <Badge className={`uppercase font-bold ${todayAttendance.status === 'present' ? 'bg-success' : 'bg-destructive'}`}>
                            {todayAttendance.status}
                          </Badge>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Monthly Presence Reports</p>
                      <div className="grid gap-2">
                        {attendanceReports.length === 0 && !todayAttendance ? (
                          <p className="text-sm text-muted-foreground text-center py-8">No attendance records found.</p>
                        ) : (
                          attendanceReports.map((report) => (
                            <div key={report.id} className="p-3 bg-background border-2 border-border rounded-xl flex justify-between items-center hover:border-primary/30 transition-all shadow-sm">
                              <div>
                                <p className="font-bold text-sm">{report.date}</p>
                                {report.file_url && (
                                  <Button variant="link" className="p-0 h-auto text-[10px] text-primary" onClick={() => window.open(report.file_url, '_blank')}>
                                    <ExternalLink className="w-3 h-3 mr-1" /> View Document
                                  </Button>
                                )}
                              </div>
                              <Badge variant={report.status === 'Present' ? 'default' : 'destructive'} className="text-[10px]">
                                {report.status}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'marks' && (
                    <div className="space-y-4">
                      {branchMarks.length > 0 ? (
                        <div className="grid gap-3">
                          {branchMarks.map((mark) => (
                            <div key={mark.id} className="p-4 bg-muted/30 border-2 border-border rounded-2xl flex justify-between items-center hover:border-primary/20 transition-all">
                              <div>
                                <p className="font-bold text-sm tracking-tight">{mark.title}</p>
                                <p className="text-[10px] text-muted-foreground">{mark.date}</p>
                              </div>
                              <Button variant="link" className="h-auto p-0 text-primary font-bold text-xs" onClick={() => window.open(mark.file_url, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-1" /> VIEW PDF
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground italic">No branch marks uploaded yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Dialog open={resourcesDialogOpen} onOpenChange={setResourcesDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-14 glare-hover border-primary/30 hover:bg-primary/10">
                    <Library className="w-5 h-5 mr-3 text-primary" />
                    Resources
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Library className="w-5 h-5 text-primary" />
                      Learning Resources
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm text-muted-foreground">Useful links for your learning and development:</p>
                    <div className="grid grid-cols-1 gap-3">
                      <Button variant="outline" className="justify-start h-12 hover:bg-primary/5" onClick={() => window.open('https://www.w3schools.com/python/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-3 text-primary" />
                        Python Tutorial (W3Schools)
                      </Button>
                      <Button variant="outline" className="justify-start h-12 hover:bg-primary/5" onClick={() => window.open('https://www.geeksforgeeks.org/java/java/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-3 text-primary" />
                        Java Tutorial (GeeksforGeeks)
                      </Button>
                      <Button variant="outline" className="justify-start h-12 hover:bg-primary/5" onClick={() => window.open('https://www.youtube.com/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-3 text-primary" />
                        YouTube
                      </Button>
                      <Button variant="outline" className="justify-start h-12 hover:bg-primary/5" onClick={() => window.open('https://www.udemy.com/career/full-stack-web-developer/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-3 text-primary" />
                        Full Stack Web Developer (Udemy)
                      </Button>
                      <Button variant="outline" className="justify-start h-12 hover:bg-primary/5" onClick={() => window.open('https://www.udemy.com/career/data-scientist/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-3 text-primary" />
                        Data Scientist (Udemy)
                      </Button>
                      <Button variant="outline" className="justify-start h-12 hover:bg-primary/5" onClick={() => window.open('https://www.udemy.com/course/n8n-production-mastery-from-zero-to-agency-ready-in-30-days/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-3 text-primary" />
                        n8n Production Mastery (Udemy)
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={issueReportDialogOpen} onOpenChange={setIssueReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-14 glare-hover border-primary/30 hover:bg-primary/10">
                    <Zap className="w-5 h-5 mr-3 text-warning" />
                    Report an Issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      Report Hostel Issue
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Issue Category</Label>
                      <Select 
                        value={issueCategory} 
                        onValueChange={(val: "food" | "electrical" | "room") => {
                          setIssueCategory(val);
                          setSelectedSubOption("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food Issues</SelectItem>
                          <SelectItem value="electrical">Electrical Issues</SelectItem>
                          <SelectItem value="room">Room Issues</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {issueCategory && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label>Specific Issue</Label>
                        <Select value={selectedSubOption} onValueChange={setSelectedSubOption}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Sub-option" />
                          </SelectTrigger>
                          <SelectContent>
                            {issueCategory === "food" && (
                              <>
                                <SelectItem value="Food Quality">Food Quality</SelectItem>
                                <SelectItem value="Food Quantity">Food Quantity</SelectItem>
                                <SelectItem value="Mess Cleanliness">Mess Cleanliness</SelectItem>
                                <SelectItem value="Delay in Service">Delay in Service</SelectItem>
                              </>
                            )}
                            {issueCategory === "electrical" && (
                              <>
                                <SelectItem value="Power Failure">Power Failure</SelectItem>
                                <SelectItem value="Bulb/Light Problem">Bulb/Light Problem</SelectItem>
                                <SelectItem value="Fan Issue">Fan Issue</SelectItem>
                                <SelectItem value="Charging Point Problem">Charging Point Problem</SelectItem>
                              </>
                            )}
                            {issueCategory === "room" && (
                              <>
                                <SelectItem value="Room Cleaning">Room Cleaning</SelectItem>
                                <SelectItem value="Furniture Repair">Furniture Repair</SelectItem>
                                <SelectItem value="Door/Window Problem">Door/Window Problem</SelectItem>
                                <SelectItem value="Pest Control">Pest Control</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button 
                      onClick={handleIssueSubmit} 
                      className="w-full mt-6" 
                      variant="hero"
                      disabled={!issueCategory || !selectedSubOption}
                    >
                      Submit Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={foodSelectionDialogOpen} onOpenChange={setFoodSelectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-14 glare-hover border-primary/30 hover:bg-primary/10">
                    <Utensils className="w-5 h-5 mr-3 text-primary" />
                    Food Selection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      Food Selection
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">Select your current meal choice, which helps the warden in planning.</p>
                    <div className="grid grid-cols-1 gap-3">
                      {["Chicken Biryani", "Veg Meals", "Chapati", "Dosa"].map((type) => (
                        <Button
                          key={type}
                          variant={selectedFoodItem === type ? "hero" : "outline"}
                          className="justify-start h-12"
                          onClick={() => setSelectedFoodItem(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleFoodSelectionSubmit}
                      className="w-full mt-4"
                      variant="hero"
                      disabled={!selectedFoodItem}
                    >
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={medicalDialogOpen} onOpenChange={setMedicalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-14 glare-hover border-destructive/30 hover:bg-destructive/10">
                    <Pill className="w-5 h-5 mr-3 text-destructive" />
                    Medical Alert
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-destructive" />
                      Send Medical Alert
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">Select your current medical issue to notify the warden and your parents immediately.</p>
                    <div className="grid grid-cols-1 gap-3">
                      {["Fever", "Stomach Pain", "Headache", "Injury", "Other"].map((type) => (
                        <Button
                          key={type}
                          variant={medicalIssueType === type ? "hero" : "outline"}
                          className="justify-start h-12"
                          onClick={() => setMedicalIssueType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                    {medicalIssueType === "Other" && (
                      <Input
                        placeholder="Please specify..."
                        className="mt-2"
                        onChange={(e) => setMedicalIssueType(e.target.value)}
                      />
                    )}
                    <Button
                      onClick={handleMedicalAlertSubmit}
                      className="w-full mt-4"
                      variant="destructive"
                      disabled={!medicalIssueType}
                    >
                      Send Emergency Alert
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Middle Column - Gate Pass Form */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button 
                variant={activePassType === "gatepass" ? "hero" : "outline"} 
                className="flex-1 font-bold"
                onClick={() => setActivePassType("gatepass")}
              >
                Gatepass
              </Button>
              <Button 
                variant={activePassType === "leave" ? "hero" : "outline"} 
                className="flex-1 font-bold"
                onClick={() => setActivePassType("leave")}
              >
                Leave form
              </Button>
            </div>

            <Card className="border-2 border-border">
              <CardHeader className="text-center border-b border-border">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {activePassType === "gatepass" ? "Gate Pass" : "Leave Form"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleGatePassSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Student Name</Label><Input value={student.student_name} disabled className="bg-muted" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Roll No</Label><Input value={student.roll_number} disabled className="bg-muted" /></div>
                    <div className="space-y-2"><Label>Branch</Label><Input value={student.branch?.toUpperCase()} disabled className="bg-muted" title={student.branch?.toUpperCase()} /></div>
                  </div>
                  <div className="space-y-2"><Label>Year</Label><Input value={student.year} disabled className="bg-muted" /></div>
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={gatePassForm.email || student.email || ""}
                      onChange={(e) => setGatePassForm({ ...gatePassForm, email: e.target.value.toLowerCase() })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Student Mobile *</Label>
                      <Input
                        type="tel"
                        placeholder="10-digit number"
                        value={gatePassForm.studentMobile}
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setGatePassForm({ ...gatePassForm, studentMobile: val });
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Mobile *</Label>
                      <Input
                        type="tel"
                        placeholder="10-digit number"
                        value={gatePassForm.parentMobile}
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setGatePassForm({ ...gatePassForm, parentMobile: val });
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="flex items-center gap-1"><Calendar className="w-4 h-4" />Out Date *</Label><Input type="date" value={gatePassForm.outDate} onChange={(e) => setGatePassForm({ ...gatePassForm, outDate: e.target.value })} /></div>
                    <div className="space-y-2"><Label className="flex items-center gap-1"><Calendar className="w-4 h-4" />In Date *</Label><Input type="date" value={gatePassForm.inDate} onChange={(e) => setGatePassForm({ ...gatePassForm, inDate: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="flex items-center gap-1"><Clock className="w-4 h-4" />Out Time</Label><Input type="time" value={gatePassForm.outTime} onChange={(e) => setGatePassForm({ ...gatePassForm, outTime: e.target.value })} /></div>
                    <div className="space-y-2"><Label className="flex items-center gap-1"><Clock className="w-4 h-4" />In Time</Label><Input type="time" value={gatePassForm.inTime} onChange={(e) => setGatePassForm({ ...gatePassForm, inTime: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose * (5-500 characters)</Label>
                    <Textarea
                      placeholder="Enter purpose..."
                      value={gatePassForm.purpose}
                      onChange={(e) => setGatePassForm({ ...gatePassForm, purpose: e.target.value })}
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{gatePassForm.purpose.length}/500 characters</p>
                  </div>
                  <Button type="submit" variant="hero" className="w-full">
                    Submit {activePassType === "gatepass" ? "Gate Pass" : "Leave Form"}
                  </Button>
                </form>
              </CardContent>
            </Card>

             {studyMaterials.length > 0 && (
              <Card className="border-2 border-border shadow-sm">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Library className="w-5 h-5 text-primary" />
                    Study Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {studyMaterials.map((mat: any) => (
                    <div key={mat.id} className="p-3 bg-muted/50 rounded-xl border border-border/50 hover:bg-muted/80 transition-colors">
                      <p className="text-sm font-bold truncate mb-2">{mat.subject_name}</p>
                      <div className="flex gap-2">
                        {mat.file_url && (
                          <Button variant="hero" size="sm" className="h-8 flex-1 text-[10px]" onClick={() => window.open(mat.file_url, '_blank')}>
                            Open PDF
                          </Button>
                        )}
                        {mat.drive_link && (
                          <Button variant="outline" size="sm" className="h-8 flex-1 text-[10px]" onClick={() => window.open(mat.drive_link, '_blank')}>
                            Drive Link
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status */}
          <div className="space-y-6">
            <Card className="border-2 border-border shadow-md overflow-hidden">
              <CardHeader className="text-center border-b border-border py-4 bg-muted/30">
                <CardTitle className="text-xl font-bold">
                  {latestGatePass?.pass_type === "leave" ? "Leave Status" : "Pass Status"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {latestGatePass ? (
                  <div className="space-y-6">
                    {student.photo_url && (
                      <div className="flex justify-center">
                        <img
                          src={student.photo_url}
                          alt="Student"
                          className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/10 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setPhotoDialogOpen(true)}
                        />
                      </div>
                    )}
                    <div className="flex justify-center">{getStatusBadge(latestGatePass.status as string)}</div>
                    
                    {latestGatePass.status === "approved" && (
                      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
                        <div 
                          className="p-3 bg-white rounded-2xl border-4 border-primary/5 shadow-inner cursor-zoom-in hover:scale-[1.02] transition-transform" 
                          onClick={() => setQrZoomOpen(true)}
                        >
                          <QRCodeCanvas value={latestGatePass.id as string} size={140} level="H" />
                        </div>
                        <Button variant="link" className="h-auto p-0 text-[10px] text-muted-foreground font-bold" onClick={downloadQRCode}>
                          <Download className="w-3 h-3 mr-1" /> DOWNLOAD PASS
                        </Button>
                      </div>
                    )}

                    <div className="grid gap-3 text-sm border-t pt-4 border-border/50">
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Pass ID</span><span className="font-mono text-[10px] font-bold bg-muted px-2 py-0.5 rounded select-all uppercase">{String(latestGatePass.id)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Duration</span><span className="font-bold">{String(latestGatePass.out_date)} - {String(latestGatePass.in_date)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Purpose</span><span className="font-bold text-right max-w-[60%] line-clamp-2">{String(latestGatePass.purpose)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Student Mob.</span><span className="font-bold">{latestGatePass.student_mobile || "N/A"}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Parent Mob.</span><span className="font-bold">{latestGatePass.parent_mobile || "N/A"}</span></div>
                    </div>

                    {latestGatePass.status === "approved" && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        {/* Leave Extension Request Component */}
                        <LeaveExtensionDialog 
                          studentId={student.id} 
                          rollNumber={student.roll_number} 
                          gatePassId={latestGatePass.id as string} 
                          onSuccess={() => loadGatePasses(student.roll_number)} 
                        />
                        
                        {wardenSignature && (
                          <div className="flex flex-col items-center gap-1.5 p-3 bg-muted/20 rounded-xl border border-dashed border-border">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Warden Signature</span>
                            <img 
                              src={wardenSignature} 
                              alt="Warden Signature" 
                              className="h-10 w-auto object-contain brightness-90 contrast-125"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {latestGatePass.status === "approved" && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 font-bold h-11 border-2"
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Pass - ${student.student_name}</title>
                              <head>
                                <style>
                                  body { font-family: system-ui; padding: 40px; }
                                  .pass { border: 2px solid #ccc; border-radius: 12px; padding: 20px; max-width: 500px; margin: auto; }
                                  .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; }
                                  .field { display: flex; justify-content: space-between; margin: 10px 0; }
                                  .label { color: #666; }
                                  .val { font-weight: bold; }
                                </style>
                              </head>
                              <body>
                                <div class="pass">
                                  <div class="header"><h1>HOSTEL PASS</h1></div>
                                  <div class="field"><span class="label">Name</span><span class="val">${student.student_name}</span></div>
                                  <div class="field"><span class="label">Roll No</span><span class="val">${student.roll_number}</span></div>
                                  <div class="field"><span class="label">Out Date</span><span class="val">${latestGatePass.out_date}</span></div>
                                  <div class="field"><span class="label">In Date</span><span class="val">${latestGatePass.in_date}</span></div>
                                  <div class="field"><span class="label">Purpose</span><span class="val">${latestGatePass.purpose}</span></div>
                                  <div class="field"><span class="label">Status</span><span class="val">APPROVED</span></div>
                                  ${wardenSignature ? `
                                  <div style="margin-top: 30px; text-align: right;">
                                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">Warden Signature</div>
                                    <img src="${wardenSignature}" style="height: 50px; width: auto; display: inline-block;" />
                                  </div>
                                  ` : ''}
                                </div>
                              </body>
                            </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }
                        }}
                      >
                        <Printer className="w-4 h-4" /> Print Pass
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12 italic">No active requests</div>
                )}
              </CardContent>
            </Card>

            {(student?.pending_fee !== undefined && student.pending_fee <= 0 && student.paid_fee > 0) && (
              <div className="bg-success/10 border-2 border-success/30 rounded-2xl p-6 text-center animate-bounce duration-[2000ms]">
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-black text-success italic tracking-tighter">FEES CLEARED!</h3>
                <p className="text-[10px] text-success/80 font-bold uppercase">All dues for {student.year} Year are paid.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-muted-foreground text-sm font-medium mb-4">Support & Information</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.open(`https://wa.me/91${WARDEN_CONTACT}`)} className="h-10 px-4 gap-2 font-bold"><Phone className="w-4 h-4" /> WhatsApp Warden</Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = `tel:${WARDEN_CONTACT}`} className="h-10 px-4 gap-2 font-bold text-destructive hover:text-destructive hover:bg-destructive/5"><AlertCircle className="w-4 h-4" /> EMERGENCY CALL</Button>
            <Button variant="ghost" size="sm" onClick={() => setRulesDialogOpen(true)} className="h-10 px-4 gap-2 font-bold"><BookOpen className="w-4 h-4" /> Hostel Rules</Button>
          </div>
        </div>
      </main>

      {/* Hostel Rules Dialog */}
      < Dialog open={rulesDialogOpen} onOpenChange={setRulesDialogOpen} >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Hostel Rules & Regulations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {hostelRules.map((rule, index) => (
              <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog >

      {/* Photo Zoom Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-md p-2 bg-card">
          {student?.photo_url && (
            <img
              src={student.photo_url}
              alt="Student Photo"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog >

      {/* Settings Dialog */}
      < Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSettingsSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="settingsRollNumber">Roll/Mobile Number (Username)</Label>
              <Input
                id="settingsRollNumber"
                value={settingsForm.rollNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, rollNumber: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">If you registered with a mobile number, you can update it to your Roll Number here.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsEmail">Email Address</Label>
              <Input
                id="settingsEmail"
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsAddress">Residential Address</Label>
              <Input
                id="settingsAddress"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsZipCode">Zip / PIN Code</Label>
              <Input
                id="settingsZipCode"
                value={settingsForm.zipCode}
                onChange={(e) => setSettingsForm({ ...settingsForm, zipCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsPassword">New Password</Label>
              <Input
                id="settingsPassword"
                type="password"
                value={settingsForm.password}
                onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground italic">Leave empty to keep current password.</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} variant="hero">
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Zoom Dialog */}
      <Dialog open={qrZoomOpen} onOpenChange={setQrZoomOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-fit p-6 rounded-3xl border-none shadow-2xl flex flex-col items-center">
          <div className="bg-white p-6 rounded-[2.5rem] border-4 border-primary/10 shadow-inner">
            <QRCodeCanvas 
              value={(gatePasses[0] as any)?.id || ""} 
              size={280}
              level="H"
            />
          </div>
          <div className="text-center mt-4">
            <h3 className="text-xl font-black italic tracking-tight">{student.student_name}</h3>
            <p className="text-xs text-muted-foreground font-mono font-bold uppercase select-all">{(gatePasses[0] as any)?.id}</p>
          </div>
          <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 mt-6" onClick={() => setQrZoomOpen(false)}>
            Close Pass
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
