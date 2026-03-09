import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";
import PaymentPortal from "@/components/PaymentPortal";
import { gatePassSchema, issueReportSchema, formatValidationErrors } from "@/lib/validations";
import { getStudentSession, clearStudentSession, StudentSession } from "@/lib/session";

const WARDEN_CONTACT = "9553866278";

const hostelRules = [
  "Students must return to hostel by 9:00 PM on weekdays and 10:00 PM on weekends.",
  "Gate pass is mandatory for leaving the hostel premises.",
  "Visitors are allowed only during visiting hours (4:00 PM - 6:00 PM on Sundays).",
  "Ragging in any form is strictly prohibited and punishable.",
  "Students must maintain silence in hostel rooms after 10:00 PM.",
  "Consumption of alcohol, drugs, or smoking is strictly prohibited.",
  "Students are responsible for the safety of their belongings.",
  "Electrical appliances like heaters and irons are not allowed in rooms.",
  "Students must keep their rooms clean and tidy at all times.",
  "Any damage to hostel property will be charged to the student.",
  "Students must inform warden before leaving for home/outing.",
  "Mobile phones should be in silent mode during study hours.",
  "Mess timings must be strictly followed.",
  "Students must carry ID cards at all times inside hostel premises.",
  "Parents can contact warden for any emergency situations.",
];

const StudentDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const gender = searchParams.get("gender") || "boys";

  const [student, setStudent] = useState<StudentSession | null>(null);
  const [gatePasses, setGatePasses] = useState<Record<string, unknown>[]>([]);
  const [feeTransactions, setFeeTransactions] = useState<Record<string, unknown>[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<Record<string, unknown>[]>([]);
  const [electricalDialogOpen, setElectricalDialogOpen] = useState(false);
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [medicalIssueType, setMedicalIssueType] = useState("");
  const [foodSelectionDialogOpen, setFoodSelectionDialogOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState("");
  const [wardenSignature, setWardenSignature] = useState<string | null>(null);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [resourcesDialogOpen, setResourcesDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ rollNumber: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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
      setStudent(prev => {
        const updated = (prev ? { ...prev, ...data } : { ...data, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }) as StudentSession;
        // Sync back to session storage so it persists
        sessionStorage.setItem('currentStudent', JSON.stringify({
          ...updated,
          expiresAt: prev?.expiresAt || (Date.now() + 8 * 60 * 60 * 1000)
        }));
        return updated;
      });
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
    setSettingsForm({ rollNumber: session.roll_number, password: "" });
    refreshStudentData(session.id);
    fetchFeeTransactions(session.id);
    loadGatePasses(session.roll_number);
    loadStudyMaterials(session.branch, session.year);
  }, [gender, navigate]);

  const fetchFeeTransactions = async (studentId: string) => {
    const { data } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false });
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
      .update({ roll_number: settingsForm.rollNumber.toUpperCase(), password: settingsForm.password })
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
            sessionStorage.setItem('currentStudent', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    const { error: updateError } = await supabase
      .from("students")
      .update({ photo_url: photoUrl })
      .eq("id", student.id);

    if (updateError) {
      toast({ title: "Update Failed", description: updateError.message, variant: "destructive" });
    } else {
      const updated = { ...student, photo_url: photoUrl };
      setStudent(updated as StudentSession);
      sessionStorage.setItem("currentStudent", JSON.stringify(updated));
      toast({ title: "Photo Updated!", description: "Your profile photo has been updated successfully." });
    }
    setIsUploadingPhoto(false);
    // Reset input so same file can be re-selected
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const loadGatePasses = async (rollNumber: string) => {
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

  const handleLogout = () => {
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
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

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

  const handleIssueSubmit = async (type: "electrical" | "food") => {
    if (!student) return;

    // Validate issue description
    const validation = issueReportSchema.safeParse({ description: issueDescription });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: formatValidationErrors(validation.error),
        variant: "destructive"
      });
      return;
    }

    const table = type === "electrical" ? "electrical_issues" : "food_issues";
    const insertData = type === "electrical"
      ? { student_id: student.id, student_name: student.student_name, roll_number: student.roll_number, room_number: student.hostel_room_number || "N/A", description: issueDescription.trim() }
      : { student_id: student.id, student_name: student.student_name, roll_number: student.roll_number, description: issueDescription.trim() };

    const { error } = await supabase.from(table).insert(insertData);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Send notification to warden email (fire and forget)
    supabase.functions.invoke("send-request-notification", {
      body: {
        type: type === "electrical" ? "electrical_issue" : "food_issue",
        studentName: student.student_name,
        rollNumber: student.roll_number,
        roomNumber: student.hostel_room_number || "N/A",
        description: issueDescription.trim(),
      },
    }).catch((err) => console.error("Failed to send notification:", err));

    toast({ title: "Issue Reported", description: `Your ${type} issue has been reported` });
    setIssueDescription("");
    setElectricalDialogOpen(false);
    setFoodDialogOpen(false);
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

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
      const response = await fetch('/api/local-food-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.id,
          student_name: student.student_name,
          roll_number: student.roll_number,
          food_item: selectedFoodItem,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save food selection");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Food Selection Sent",
      description: "Your selection has been forwarded to the warden."
    });
    setSelectedFoodItem("");
    setFoodSelectionDialogOpen(false);
  };

  const latestGatePass = gatePasses[0] as Record<string, unknown> | undefined;

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
        userSubtitle={isUploadingPhoto ? "Uploading photo..." : student.roll_number}
        userPhotoUrl={student.photo_url || undefined}
        onLogout={handleLogout}
        onPhotoUpload={() => photoInputRef.current?.click()}
        onSettingsClick={() => setSettingsDialogOpen(true)}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Fee Details</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => student?.id && refreshStudentData(student.id)}
                  title="Refresh Fee Data"
                >
                  <Clock className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.pending_fee <= 0 && (
                  <div className="p-3 bg-success/10 border-2 border-dashed border-success/30 rounded-xl text-center mb-4">
                    <div className="flex items-center justify-center gap-2 text-success mb-1">
                      <Check className="w-5 h-5" />
                      <span className="font-bold text-sm uppercase tracking-wider">{student.year === "1" ? "1st" : student.year === "2" ? "2nd" : student.year === "3" ? "3rd" : student.year === "4" ? "4th" : student.year} Year Fees Completed!</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">Excellent! Your annual dues are cleared. Ready to continue for the {parseInt(student.year) + 1 || "next"} year.</p>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Total Fee</span>
                  <span className="font-bold text-xl">₹{Number(student.total_fee ?? 84000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Total Paid (History)</span>
                  <span className="font-bold text-xl text-success">₹{Number(student.paid_fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Pending Balance</span>
                  <span className="font-bold text-xl text-destructive">₹{Number(student.pending_fee ?? 84000).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <PaymentPortal />

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

              <Dialog open={electricalDialogOpen} onOpenChange={setElectricalDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" className="w-full justify-start h-14 glare-hover"><Zap className="w-5 h-5 mr-3 text-warning" />Room Electrical Problem</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Report Electrical Problem</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Textarea
                      placeholder="Describe the issue (min 5 characters)..."
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">{issueDescription.length}/1000 characters</p>
                    <Button onClick={() => handleIssueSubmit("electrical")} className="w-full" variant="hero">Submit Report</Button>
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
                      {["Chicken Biryani", "Veg Meals", "Chapati", "Dosa", "Other"].map((type) => (
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
                    {selectedFoodItem === "Other" && (
                      <Input
                        placeholder="Please specify your food selection..."
                        className="mt-2"
                        onChange={(e) => setSelectedFoodItem(e.target.value)}
                      />
                    )}
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

              <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" className="w-full justify-start h-14 glare-hover"><UtensilsCrossed className="w-5 h-5 mr-3 text-primary" />Food Issue Reporting</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Report Food Issue</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Textarea
                      placeholder="Describe the issue (min 5 characters)..."
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">{issueDescription.length}/1000 characters</p>
                    <Button onClick={() => handleIssueSubmit("food")} className="w-full" variant="hero">Submit Report</Button>
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

            {feeTransactions.length > 0 && (
              <Card className="border-2 border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-lg">Fee Payment History</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 max-h-[300px] overflow-y-auto space-y-3">
                  {feeTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">₹{tx.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.payment_date).toLocaleDateString()} {new Date(tx.payment_date).toLocaleTimeString()}</p>
                      </div>
                      {tx.remarks && (
                        <p className="text-xs text-muted-foreground max-w-[120px] text-right truncate" title={tx.remarks}>{tx.remarks}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {studyMaterials.length > 0 && (
              <Card className="border-2 border-border">
                <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" />Study Materials</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {studyMaterials.map((mat) => (
                    <div key={mat.id as string} className="p-2 bg-muted rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium">{mat.subject_name as string}</span>
                      <div className="flex gap-2 items-center">
                        {mat.file_url && (
                          <a href={mat.file_url as string} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs gap-1 bg-success/10 text-success hover:bg-success/20 px-2 py-1 rounded">
                            <FileText className="w-3 h-3" />
                            Open File
                          </a>
                        )}
                        {mat.drive_link && (
                          <a href={mat.drive_link as string} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded">
                            <ExternalLink className="w-3 h-3" />
                            Drive Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Gate Pass Form */}
          <Card className="border-2 border-border">
            <CardHeader className="text-center border-b border-border"><CardTitle className="text-xl flex items-center justify-center gap-2"><Calendar className="w-5 h-5 text-primary" />Gate Pass</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGatePassSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Student Name</Label><Input value={student.student_name} disabled className="bg-muted" /></div>
                <div className="space-y-2"><Label>Roll No</Label><Input value={student.roll_number} disabled className="bg-muted" /></div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email for notifications"
                    value={gatePassForm.email || student.email || ""}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Gate pass status will be sent to this email</p>
                </div>
                <div className="space-y-2">
                  <Label>Student Mobile (10 digits)</Label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={gatePassForm.studentMobile}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, studentMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Mobile (10 digits)</Label>
                  <Input
                    type="tel"
                    placeholder="Enter parent mobile"
                    value={gatePassForm.parentMobile}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, parentMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    maxLength={10}
                  />
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
                <Button type="submit" variant="hero" className="w-full">Submit Gate Pass</Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column - Gate Pass Status */}
          <Card className="border-2 border-border">
            <CardHeader className="text-center border-b border-border"><CardTitle className="text-xl">Gate Pass Status</CardTitle></CardHeader>
            <CardContent className="p-6">
              {latestGatePass ? (
                <div className="space-y-4">
                  {/* Student Photo for Identity Verification - Click to Zoom */}
                  {student.photo_url && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={student.photo_url}
                        alt="Student Photo"
                        className="w-24 h-24 rounded-lg object-cover border-2 border-primary shadow-md cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => setPhotoDialogOpen(true)}
                      />
                    </div>
                  )}
                  <div className="flex justify-center mb-4">{getStatusBadge(latestGatePass.status as string)}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Student Name</span><span className="font-medium">{student.student_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Roll Number</span><span>{student.roll_number}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{student.branch?.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span>{student.year}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Out Date</span><span>{latestGatePass.out_date as string}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">In Date</span><span>{latestGatePass.in_date as string}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Purpose</span><span className="text-right max-w-[60%]">{latestGatePass.purpose as string}</span></div>
                  </div>
                  {/* Warden Signature for Approved Gate Pass */}
                  {latestGatePass.status === "approved" && wardenSignature && (
                    <div className="pt-4 border-t border-border mt-4">
                      <p className="text-sm text-muted-foreground mb-2 text-center">Warden Signature</p>
                      <div className="flex justify-center">
                        <img
                          src={wardenSignature}
                          alt="Warden Signature"
                          className="h-16 object-contain border border-border rounded p-1 bg-white"
                        />
                      </div>
                    </div>
                  )}
                  {/* Print Button for Approved Gate Pass */}
                  {latestGatePass.status === "approved" && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Gate Pass - ${student.student_name}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                                  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                                  .header h1 { margin: 0; font-size: 24px; }
                                  .header p { margin: 5px 0 0; color: #666; }
                                  .photo-section { text-align: center; margin: 20px 0; }
                                  .photo-section img { width: 120px; height: 120px; border-radius: 8px; object-fit: cover; border: 2px solid #333; }
                                  .details { margin: 20px 0; }
                                  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                                  .row:last-child { border-bottom: none; }
                                  .label { color: #666; }
                                  .value { font-weight: 500; }
                                  .status { text-align: center; margin: 20px 0; }
                                  .status span { background: #d4edda; color: #155724; padding: 8px 20px; border-radius: 20px; font-weight: 500; }
                                  .signature { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
                                  .signature p { color: #666; margin-bottom: 10px; }
                                  .signature img { height: 60px; }
                                  .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
                                  @media print { body { padding: 20px; } }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1>HOSTEL GATE PASS</h1>
                                  <p>Identity Verification Document</p>
                                </div>
                                ${student.photo_url ? `
                                <div class="photo-section">
                                  <img src="${student.photo_url}" alt="Student Photo" />
                                </div>
                                ` : ''}
                                <div class="status">
                                  <span>✓ APPROVED</span>
                                </div>
                                <div class="details">
                                  <div class="row"><span class="label">Student Name</span><span class="value">${student.student_name}</span></div>
                                  <div class="row"><span class="label">Roll Number</span><span class="value">${student.roll_number}</span></div>
                                  <div class="row"><span class="label">Branch</span><span class="value">${student.branch?.toUpperCase()}</span></div>
                                  <div class="row"><span class="label">Year</span><span class="value">${student.year}</span></div>
                                  <div class="row"><span class="label">Out Date</span><span class="value">${latestGatePass.out_date}</span></div>
                                  <div class="row"><span class="label">In Date</span><span class="value">${latestGatePass.in_date}</span></div>
                                  <div class="row"><span class="label">Purpose</span><span class="value">${latestGatePass.purpose}</span></div>
                                </div>
                                ${wardenSignature ? `
                                <div class="signature">
                                  <p>Warden Signature</p>
                                  <img src="${wardenSignature}" alt="Warden Signature" />
                                </div>
                                ` : ''}
                                <div class="footer">
                                  <p>This is a computer-generated gate pass. Valid only with warden signature.</p>
                                  <p>Generated on: ${new Date().toLocaleString()}</p>
                                </div>
                              </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.focus();
                            setTimeout(() => printWindow.print(), 250);
                          }
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        Print Gate Pass
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No gate pass requests yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Section */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Need help?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://wa.me/91${WARDEN_CONTACT}`, "_blank")}
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              Contact Warden
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = `tel:${WARDEN_CONTACT}`}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <AlertCircle className="w-4 h-4" />
              Emergency
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRulesDialogOpen(true)}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Hostel Rules
            </Button>
          </div>
        </div>
      </main >

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
      < Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen} >
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
              <Label htmlFor="settingsRollNumber">Roll Number (Username)</Label>
              <Input
                id="settingsRollNumber"
                value={settingsForm.rollNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, rollNumber: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">If you registered with a mobile number, you can update it to your Roll Number here.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsPassword">Password</Label>
              <Input
                id="settingsPassword"
                type="password"
                value={settingsForm.password}
                onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} variant="hero">
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </DialogContent>
      </Dialog >
    </div >
  );
};

export default StudentDashboard;
