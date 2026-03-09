import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  FileText,
  Check,
  X,
  User,
  Calendar,
  Building2,
  Home,
  Users,
  Upload,
  AlertTriangle,
  DoorOpen,
  Printer,
  Download,
  Trash2,
  PenTool,
  ImagePlus,
  Pill,
  Phone,
  Utensils,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { localApi } from "@/lib/localStudentApi";
import CollegeHeader from "@/components/CollegeHeader";
import PendingRoomsDashboard from "@/components/warden/PendingRoomsDashboard";
import HostelRoomDetails from "@/components/warden/HostelRoomDetails";
import RoomAllotment from "@/components/warden/RoomAllotment";
import StudyMaterialUpload from "@/components/warden/StudyMaterialUpload";
import IssueReports from "@/components/warden/IssueReports";
import MedicineManagement from "@/components/warden/MedicineManagement";
import FoodSelectionChart from "@/components/warden/FoodSelectionChart";
import { getWardenSession, clearWardenSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";

interface Warden {
  id: string;
  name: string;
  warden_type: string;
  username: string;
  signature_url?: string;
}

type TabType = "dashboard" | "applications" | "gatepasses" | "rooms" | "allotment" | "materials" | "issues" | "medicines" | "foodSelection";

const WardenDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [warden, setWarden] = useState<Warden | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Data states
  const [applications, setApplications] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [electricalIssues, setElectricalIssues] = useState<any[]>([]);
  const [foodIssues, setFoodIssues] = useState<any[]>([]);
  const [medicalAlerts, setMedicalAlerts] = useState<any[]>([]);

  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [selectedGatePass, setSelectedGatePass] = useState<any | null>(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Hostel Application - ${selectedApplication?.student_name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
              .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .print-header h1 { margin: 0; font-size: 18px; }
              .print-header p { margin: 5px 0; font-size: 12px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
              .detail-item { margin-bottom: 10px; }
              .detail-label { font-size: 11px; color: #666; margin-bottom: 2px; }
              .detail-value { font-size: 14px; font-weight: 600; }
              .photos-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .photo-box { text-align: center; }
              .photo-box img { max-width: 100px; max-height: 120px; border: 1px solid #ccc; }
              .photo-label { font-size: 11px; color: #666; margin-bottom: 5px; }
              .fee-section { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
              .status-badge { display: inline-block; padding: 5px 15px; border-radius: 4px; font-weight: 600; text-transform: capitalize; }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-accepted { background: #d4edda; color: #155724; }
              .status-rejected { background: #f8d7da; color: #721c24; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>GEETHANJALI INSTITUTE OF SCIENCE & TECHNOLOGY</h1>
              <p>(AUTONOMOUS INSTITUTION)</p>
              <p>3rd Mile, Nellore-Bombay Highway, Gangavaram(V), Kovur(Md), SPSR Nellore Dt.</p>
              <h2 style="margin-top: 15px;">HOSTEL APPLICATION FORM</h2>
            </div>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  const fetchApplications = async (gender: string | null) => {
    let query = supabase.from("hostel_applications").select("*").order("created_at", { ascending: false });
    if (gender) query = query.eq("gender", gender);
    const { data } = await query;
    if (data) setApplications(data as any[]);
  };

  const fetchStudents = async (gender: string | null) => {
    let query = supabase.from("students").select("*").order("student_name");
    if (gender) query = query.eq("gender", gender);
    const { data } = await query;
    if (data) {
      // Get the blocklist of permanently deleted IDs
      const deletedIds = await localApi.getDeletedIds();
      // Filter out permanently deleted students from UI
      const activeStudents = (data as any[]).filter(student => !deletedIds.includes(student.id));
      setStudents(activeStudents);
    }
  };

  const fetchRooms = async (isBoys: boolean, isGirls: boolean) => {
    let query = supabase.from("rooms").select("*").order("room_number");
    if (isGirls) {
      query = query.or("room_number.ilike.GA%,room_number.ilike.GN%");
    } else if (isBoys) {
      query = query.or("room_number.ilike.A%,room_number.ilike.N%");
    }
    const { data } = await query;
    if (data) {
      let filtered = data;
      if (isBoys) {
        filtered = data.filter((r: any) => !r.room_number.startsWith('GA') && !r.room_number.startsWith('GN'));
      }
      setRooms(filtered);
    }
  };

  const fetchGatePasses = async (gender: string | null) => {
    let query = supabase.from("gate_passes").select("*, students!inner(gender)").order("created_at", { ascending: false });
    if (gender) query = query.eq("students.gender", gender);
    const { data } = await query;
    if (data) setGatePasses(data as any[]);
  };

  const fetchIssues = async (gender: string | null) => {
    const elecQuery = supabase.from("electrical_issues").select("*, students!inner(gender)").order("created_at", { ascending: false });
    const foodQuery = supabase.from("food_issues").select("*, students!inner(gender)").order("created_at", { ascending: false });

    // Fetch medical alerts directly from Supabase
    const { data: medicalData, error: medicalError } = await supabase
      .from("medical_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (medicalError) {
      console.error("Medical alerts fetch failed:", medicalError.message);
      setMedicalAlerts([]);
    } else {
      setMedicalAlerts(medicalData || []);
    }

    if (gender) {
      const { data: elecData } = await elecQuery.eq("students.gender", gender);
      const { data: foodData } = await foodQuery.eq("students.gender", gender);
      if (elecData) setElectricalIssues(elecData as any[]);
      if (foodData) setFoodIssues(foodData as any[]);
    } else {
      const { data: elecData } = await elecQuery;
      const { data: foodData } = await foodQuery;
      if (elecData) setElectricalIssues(elecData as any[]);
      if (foodData) setFoodIssues(foodData as any[]);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/local-materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (e) {
      console.error("Local study materials fetch failed", e);
      setMaterials([]);
    }
  };

  const fetchAllData = async () => {
    if (!warden) return;

    const studentGender = warden.warden_type === "boys" ? "male" : warden.warden_type === "girls" ? "female" : null;
    const applicationGender = warden.warden_type === "boys" ? "boy" : warden.warden_type === "girls" ? "girl" : null;
    const isBoys = warden.warden_type === "boys";
    const isGirls = warden.warden_type === "girls";

    await Promise.all([
      fetchApplications(applicationGender),
      fetchStudents(studentGender),
      fetchRooms(isBoys, isGirls),
      fetchGatePasses(studentGender),
      fetchIssues(studentGender),
      fetchMaterials()
    ]);
  };

  useEffect(() => {
    const session = getWardenSession();
    if (!session) {
      navigate("/warden-login");
      return;
    }
    setWarden(session);
  }, [navigate]);

  // Fetch data when warden is set
  useEffect(() => {
    if (warden) {
      fetchAllData();

      const studentGender = warden.warden_type === "boys" ? "male" : warden.warden_type === "girls" ? "female" : null;
      const applicationGender = warden.warden_type === "boys" ? "boy" : warden.warden_type === "girls" ? "girl" : null;
      const isBoys = warden.warden_type === "boys";
      const isGirls = warden.warden_type === "girls";

      // Real-time subscriptions with unique channel per warden to avoid conflicts
      const channelName = `warden-changes-${warden.id}-${warden.warden_type}`;
      const channel = supabase
        .channel(channelName)
        .on("postgres_changes", { event: "*", schema: "public", table: "hostel_applications" }, () => {
          console.log("Real-time: hostel_applications changed");
          fetchApplications(applicationGender);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "gate_passes" }, () => {
          console.log("Real-time: gate_passes changed");
          fetchGatePasses(studentGender);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
          console.log("Real-time: students changed");
          fetchStudents(studentGender);
          // Also fetch related data that depends on student records for filtering if needed
          fetchGatePasses(studentGender);
          fetchIssues(studentGender);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {
          console.log("Real-time: rooms changed");
          fetchRooms(isBoys, isGirls);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "electrical_issues" }, () => {
          console.log("Real-time: electrical_issues changed");
          fetchIssues(studentGender);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "food_issues" }, () => {
          console.log("Real-time: food_issues changed");
          fetchIssues(studentGender);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "medical_alerts" }, () => {
          console.log("Real-time: medical_alerts changed");
          fetchIssues(studentGender);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "study_materials" }, () => {
          console.log("Real-time: study_materials changed");
          fetchMaterials();
        })
        .subscribe((status) => {
          console.log("Real-time subscription status:", status);
        });

      return () => {
        console.log("Cleaning up real-time channel:", channelName);
        supabase.removeChannel(channel);
      };
    }
  }, [warden]);

  const handleLogout = () => {
    clearWardenSession();
    navigate("/");
  };

  const handleApplicationAction = async (applicationId: string, action: "accepted" | "rejected") => {
    // Get the application details for email
    const application = applications.find(app => app.id === applicationId);

    const { error } = await supabase
      .from("hostel_applications")
      .update({ status: action })
      .eq("id", applicationId);

    if (error) {
      toast({ title: "Error", description: "Failed to update application", variant: "destructive" });
      return;
    }

    toast({
      title: action === "accepted" ? "Application Accepted" : "Application Rejected",
      description: action === "accepted"
        ? "The student's hostel application has been approved"
        : "The student's hostel application has been rejected",
    });

    // Optimistic state update
    setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: action } : app));
    setSelectedApplication(null);

    // Send email in background
    if (application?.email) {
      console.log('Sending hostel application email to:', application.email);
      supabase.functions.invoke("send-application-email", {
        body: {
          email: application.email,
          studentName: application.student_name,
          status: action,
          roomType: application.room_type,
          ac_type: application.ac_type,
        },
      }).catch(err => console.error('Email invoke error:', err));
    }
  };

  const handleGatePassAction = async (gatePassId: string, action: "approved" | "rejected") => {
    const gatePass = gatePasses.find(gp => gp.id === gatePassId);

    const { error } = await supabase
      .from("gate_passes")
      .update({ status: action })
      .eq("id", gatePassId);

    if (error) {
      toast({ title: "Error", description: "Failed to update gate pass", variant: "destructive" });
      return;
    }

    toast({
      title: action === "approved" ? "Gate Pass Approved" : "Gate Pass Rejected",
      description: action === "approved"
        ? "The student's gate pass has been approved"
        : "The student's gate pass has been rejected",
    });

    // Optimistic state update
    setGatePasses(prev => prev.map(gp => gp.id === gatePassId ? { ...gp, status: action } : gp));
    setSelectedGatePass(null);

    // Send email in background
    if (gatePass) {
      const gatePassEmail = gatePass.student_email;
      const student = students.find(s => s.roll_number === gatePass.roll_number);
      const emailToUse = gatePassEmail || student?.email;

      if (emailToUse) {
        console.log('Sending gate pass email via Resend to:', emailToUse);
        supabase.functions.invoke("send-gate-pass-email", {
          body: {
            email: emailToUse,
            studentName: gatePass.student_name,
            status: action,
            outDate: gatePass.out_date,
            inDate: gatePass.in_date,
            purpose: gatePass.purpose,
          },
        }).catch(err => console.error('Email invoke error:', err));
      }
    }
  };

  const pendingApplications = applications.filter((app) => app.status?.toLowerCase() === "pending");
  const pendingGatePasses = gatePasses.filter((gp) => gp.status?.toLowerCase() === "pending");
  const pendingElectrical = electricalIssues.filter((i) => i.status?.toLowerCase() === "pending");
  const pendingFood = foodIssues.filter((i) => i.status?.toLowerCase() === "pending");
  const allottedStudents = students.filter((s) => s.room_allotted);
  const pendingStudents = students.filter((s) => !s.room_allotted);

  // Delete handlers
  const handleDeleteApplication = async (applicationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this application?")) return;

    const { error } = await supabase
      .from("hostel_applications")
      .delete()
      .eq("id", applicationId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete application", variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: "Application deleted successfully" });
    fetchAllData();
  };

  const handleDeleteGatePass = async (gatePassId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this gate pass?")) return;

    const { error } = await supabase
      .from("gate_passes")
      .delete()
      .eq("id", gatePassId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete gate pass", variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: "Gate pass deleted successfully" });
    fetchAllData();
  };

  // Signature handlers
  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSignature = async () => {
    if (!warden || !signatureFile) return;

    setIsUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = signatureFile.name.split('.').pop();
      const fileName = `warden-${warden.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, signatureFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      const signatureUrl = urlData.publicUrl;

      // Update warden record
      const { error } = await supabase
        .from("wardens")
        .update({ signature_url: signatureUrl })
        .eq("id", warden.id);

      if (error) throw error;

      setWarden({ ...warden, signature_url: signatureUrl });
      toast({ title: "Success", description: "Signature uploaded successfully" });
      setSignatureDialogOpen(false);
      setSignatureFile(null);
      setSignaturePreview("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload signature", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!warden) return;
    if (!confirm("Are you sure you want to remove your signature?")) return;

    try {
      // Delete from storage if exists
      if (warden.signature_url) {
        const urlParts = warden.signature_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from('signatures').remove([fileName]);
      }

      const { error } = await supabase
        .from("wardens")
        .update({ signature_url: null })
        .eq("id", warden.id);

      if (error) throw error;

      setWarden({ ...warden, signature_url: undefined });
      setSignatureFile(null);
      setSignaturePreview("");
      toast({ title: "Success", description: "Signature removed" });
      setSignatureDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove signature", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.trim().toLowerCase();
    switch (s) {
      case "accepted":
      case "approved":
        return "bg-success/20 text-success border-success/30";
      case "rejected":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-warning/20 text-warning border-warning/30";
    }
  };

  const getRoomTypeName = (type: string) => {
    const types: Record<string, string> = {
      single: "Single Bed Room",
      double: "Double Bed Room",
      three: "Three Bed Room",
      four: "Four Bed Room",
      six: "Six Bed Room",
    };
    return types[type] || type;
  };

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: Home },
    { id: "applications" as TabType, label: "Applications", icon: FileText, count: pendingApplications.length },
    { id: "gatepasses" as TabType, label: "Gate Passes", icon: DoorOpen, count: pendingGatePasses.length },
    { id: "rooms" as TabType, label: "Hostel Rooms", icon: Building2 },
    { id: "allotment" as TabType, label: "Room Allotment", icon: Users },
    { id: "materials" as TabType, label: "Study Materials", icon: Upload },
    { id: "issues" as TabType, label: "Issues", icon: AlertTriangle, count: pendingElectrical.length + pendingFood.length },
    { id: "foodSelection" as TabType, label: "Food Selection", icon: Utensils },
    { id: "medicines" as TabType, label: "Medicines", icon: Pill },
  ];

  if (!warden) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* College Header */}
      <CollegeHeader />

      {/* Enhanced Top Bar */}
      <DashboardHeader
        title="Warden Dashboard"
        titleColor={warden.warden_type === "boys" ? "text-accent" : "text-primary"}
        userName={warden.name}
        userSubtitle={`${warden.warden_type === "boys" ? "Boys" : "Girls"} Hostel Warden`}
        onLogout={handleLogout}
        showPhoto={false}
      />

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className="relative whitespace-nowrap"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${tab.id === 'allotment' ? 'bg-muted text-muted-foreground' : 'bg-success text-success-foreground'} text-xs flex items-center justify-center ${["applications", "gatepasses", "issues"].includes(tab.id) ? "pulse-dot" : ""}`}>
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Pending Room Details</h2>
            <PendingRoomsDashboard rooms={rooms} students={students} />
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Hostel Applications</h2>
              {applications.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete ALL applications? This cannot be undone.")) return;
                    const ids = applications.map(app => app.id);
                    const { error } = await supabase
                      .from("hostel_applications")
                      .delete()
                      .in("id", ids);
                    if (error) {
                      toast({ title: "Error", description: "Failed to delete applications", variant: "destructive" });
                    } else {
                      toast({ title: "Deleted", description: `${ids.length} applications deleted successfully` });
                      fetchAllData();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              )}
            </div>

            {applications.length === 0 ? (
              <Card className="border-2 border-dashed border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hostel applications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map((app) => (
                  <Card
                    key={app.id}
                    className={`border-2 cursor-pointer transition-all hover:shadow-lg ${app.status === "pending" ? "border-success/50" : "border-border"
                      }`}
                    onClick={() => setSelectedApplication(app)}
                  >
                    <CardHeader className="pb-2 relative">
                      {app.status === "pending" && (
                        <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-success pulse-dot" />
                      )}
                      <CardTitle className="text-lg">{app.student_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{app.branch?.toUpperCase()}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {getRoomTypeName(app.room_type)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(app.status)}`}>
                            {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteApplication(app.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gate Passes Tab */}
        {activeTab === "gatepasses" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-bold text-foreground">Gate Pass Requests</h2>
              <div className="flex items-center gap-2">
                {gatePasses.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete ALL gate passes? This cannot be undone.")) return;
                      const ids = gatePasses.map(gp => gp.id);
                      const { error } = await supabase
                        .from("gate_passes")
                        .delete()
                        .in("id", ids);
                      if (error) {
                        toast({ title: "Error", description: "Failed to delete gate passes", variant: "destructive" });
                      } else {
                        toast({ title: "Deleted", description: `${ids.length} gate passes deleted successfully` });
                        fetchAllData();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSignatureFile(null);
                    setSignaturePreview("");
                    setSignatureDialogOpen(true);
                  }}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  {warden?.signature_url ? "Update Signature" : "Add Signature"}
                </Button>
              </div>
            </div>

            {gatePasses.length === 0 ? (
              <Card className="border-2 border-dashed border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No gate pass requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gatePasses.map((gp) => (
                  <Card
                    key={gp.id}
                    className={`border-2 cursor-pointer transition-all hover:shadow-lg ${gp.status === "pending" ? "border-success/50" : "border-border"
                      }`}
                    onClick={() => setSelectedGatePass(gp)}
                  >
                    <CardHeader className="pb-2 relative">
                      {gp.status === "pending" && (
                        <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-success pulse-dot" />
                      )}
                      {(() => {
                        const student = students.find((s: any) => s.roll_number === gp.roll_number);
                        return (
                          <div className="flex items-start gap-3">
                            {/* Student Photo Thumbnail */}
                            {student?.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt={gp.student_name}
                                className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-lg truncate">{gp.student_name}</CardTitle>
                                {student?.year && (
                                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">
                                    {student.year}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{gp.roll_number}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {gp.out_date} - {gp.in_date}
                        </div>
                        {gp.parent_mobile && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            Parent: {gp.parent_mobile}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground truncate max-w-[50%]">
                            {gp.purpose}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(gp.status)}`}>
                              {gp.status?.charAt(0).toUpperCase() + gp.status?.slice(1)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteGatePass(gp.id, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hostel Rooms Tab */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Hostel Room Details</h2>
            <HostelRoomDetails students={allottedStudents} onRefresh={fetchAllData} wardenType={warden.warden_type} />
          </div>
        )}

        {/* Room Allotment Tab */}
        {activeTab === "allotment" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Room Allotment</h2>
              {students.length > 0 && (
                <Button
                  variant="hero"
                  size="sm"
                  className="shadow-md hover:shadow-lg transition-all"
                  onClick={async () => {
                    const count = students.length;
                    const wardenType = warden.warden_type === "boys" ? "Boys" : "Girls";
                    if (!confirm(`SUPER WIPE: Are you sure you want to permanently delete ALL ${count} ${wardenType} students? This will erase their entire history (Gate Passes, Issues, Medical Alerts, Parents). This CANNOT be undone.`)) return;

                    try {
                      // Standardize roll numbers to avoid matching issues
                      const rollNumbers = students.map(s => s.roll_number.toUpperCase().trim());
                      const ids = students.map(s => s.id);

                      // 1. Delete all dependencies first using both Roll Number and internal ID
                      await Promise.all([
                        supabase.from("gate_passes").delete().in("roll_number", rollNumbers),
                        supabase.from("gate_passes").delete().in("student_id", ids),
                        supabase.from("electrical_issues").delete().in("roll_number", rollNumbers),
                        supabase.from("electrical_issues").delete().in("student_id", ids),
                        supabase.from("food_issues").delete().in("roll_number", rollNumbers),
                        supabase.from("food_issues").delete().in("student_id", ids),
                        supabase.from("medical_alerts").delete().in("roll_number", rollNumbers),
                        supabase.from("medical_alerts").delete().in("student_id", ids),
                        supabase.from("parents").delete().in("student_roll_number", rollNumbers),
                        supabase.from("password_reset_tokens").delete().in("user_identifier", rollNumbers)
                      ]);

                      // 2. Final blowout: delete the students themselves
                      const { error } = await supabase
                        .from("students")
                        .delete()
                        .in("id", ids);

                      if (error) {
                        toast({ title: "Deletion Error", description: error.message, variant: "destructive" });
                      } else {
                        // 3. Reset room occupancy for safety
                        const roomNumbers = [...new Set(students.map(s => s.hostel_room_number).filter(Boolean))];
                        if (roomNumbers.length > 0) {
                          await supabase.from("rooms").update({ occupied_beds: 0 }).in("room_number", roomNumbers);
                        }

                        toast({ title: "Clearance Complete", description: `Removed all ${count} students and all linked data.` });
                        await fetchAllData();
                      }
                    } catch (err: any) {
                      console.error("Bulk wipe error:", err);
                      toast({ title: "Error", description: "Failed to perform nuclear delete", variant: "destructive" });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Wipe All {students.length} {warden.warden_type === "boys" ? "Boys" : "Girls"}
                </Button>
              )}
            </div>
            <RoomAllotment rooms={rooms} pendingStudents={pendingStudents} allStudents={students} onRefresh={fetchAllData} />
          </div>
        )}

        {/* Study Materials Tab */}
        {activeTab === "materials" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Upload Study Materials</h2>
            <StudyMaterialUpload materials={materials} wardenId={warden.id} onRefresh={fetchAllData} />
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === "issues" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Issue Reports</h2>
            <IssueReports
              electricalIssues={electricalIssues}
              foodIssues={foodIssues}
              medicalAlerts={medicalAlerts}
              onRefresh={fetchAllData}
            />
          </div>
        )}

        {/* Food Selection Tab */}
        {activeTab === "foodSelection" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Food Selection Overview</h2>
            <p className="text-muted-foreground">View the most preferred food items selected by students.</p>
            <FoodSelectionChart />
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === "medicines" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Medicine Management</h2>
            <p className="text-muted-foreground">Add medicines to make them available on the home page. Remove medicines to hide them.</p>
            <MedicineManagement wardenId={warden.id} wardenType={warden.warden_type as "boys" | "girls"} />
          </div>
        )}
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              Hostel Application Details
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div ref={printRef} className="space-y-4 pt-4">
              {/* Passport Photo and Signature */}
              <div className="photos-section flex justify-between items-start gap-4 pb-4 border-b border-border">
                <div className="photo-box flex-1">
                  <p className="photo-label text-sm text-muted-foreground mb-2">Passport Photo</p>
                  {selectedApplication.photo_url ? (
                    <img
                      src={selectedApplication.photo_url}
                      alt="Passport Photo"
                      className="w-24 h-28 object-cover border-2 border-border rounded"
                    />
                  ) : (
                    <div className="w-24 h-28 bg-muted flex items-center justify-center rounded border-2 border-dashed border-border">
                      <span className="text-xs text-muted-foreground">No Photo</span>
                    </div>
                  )}
                </div>
                <div className="photo-box flex-1 text-right">
                  <p className="photo-label text-sm text-muted-foreground mb-2">Signature</p>
                  {selectedApplication.signature_url ? (
                    <img
                      src={selectedApplication.signature_url}
                      alt="Signature"
                      className="w-32 h-16 object-contain border-2 border-border rounded ml-auto"
                    />
                  ) : (
                    <div className="w-32 h-16 bg-muted flex items-center justify-center rounded border-2 border-dashed border-border ml-auto">
                      <span className="text-xs text-muted-foreground">No Signature</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="details-grid grid grid-cols-2 gap-4">
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Student Name</p>
                  <p className="detail-value font-medium">{selectedApplication.student_name}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Father's Name</p>
                  <p className="detail-value font-medium">{selectedApplication.father_name || "-"}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Branch</p>
                  <p className="detail-value font-medium">{selectedApplication.branch?.toUpperCase()}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Phone</p>
                  <p className="detail-value font-medium">{selectedApplication.phone_number}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Parent Phone</p>
                  <p className="detail-value font-medium">{selectedApplication.parent_phone_number || "-"}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Gender</p>
                  <p className="detail-value font-medium capitalize">{selectedApplication.gender}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Months</p>
                  <p className="detail-value font-medium">{selectedApplication.months} months</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Room Type</p>
                  <p className="detail-value font-medium">{getRoomTypeName(selectedApplication.room_type)}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">AC Type</p>
                  <p className="detail-value font-medium">{selectedApplication.ac_type === "ac" ? "AC" : "Non-AC"}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label text-sm text-muted-foreground">Status</p>
                  <p className={`detail-value font-medium capitalize status-badge status-${selectedApplication.status}`}>
                    {selectedApplication.status}
                  </p>
                </div>
                <div className="detail-item col-span-2 fee-section">
                  <p className="detail-label text-sm text-muted-foreground">Total Fee</p>
                  <p className="detail-value font-semibold text-primary text-lg">
                    ₹{selectedApplication.price?.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedApplication.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => handleApplicationAction(selectedApplication.id, "accepted")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleApplicationAction(selectedApplication.id, "rejected")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedApplication.status !== "pending" && (
                <div className={`p-4 rounded-lg border ${getStatusColor(selectedApplication.status)}`}>
                  <p className="font-medium capitalize">{selectedApplication.status}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gate Pass Detail Dialog */}
      <Dialog open={!!selectedGatePass} onOpenChange={() => setSelectedGatePass(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gate Pass Details</DialogTitle>
          </DialogHeader>
          {selectedGatePass && (() => {
            const studentData = students.find((s: any) => s.roll_number === selectedGatePass.roll_number);
            return (
              <div className="space-y-4 pt-4">
                {/* Student Photo for Identity Verification */}
                {studentData?.photo_url && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={studentData.photo_url}
                        alt={`${selectedGatePass.student_name}'s photo`}
                        className="w-28 h-28 object-cover rounded-lg border-2 border-primary shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setEnlargedPhotoUrl(studentData.photo_url)}
                        title="Click to enlarge"
                      />
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Click photo to enlarge for verification
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-medium">{selectedGatePass.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{selectedGatePass.roll_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-medium">{selectedGatePass.branch?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">
                      {students.find((s: any) => s.roll_number === selectedGatePass.roll_number)?.year || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student Mobile</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedGatePass.student_mobile || "-"}</p>
                      {selectedGatePass.student_mobile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => window.location.href = `tel:${selectedGatePass.student_mobile}`}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Mobile</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedGatePass.parent_mobile || "-"}</p>
                      {selectedGatePass.parent_mobile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => window.location.href = `tel:${selectedGatePass.parent_mobile}`}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Out Date</p>
                    <p className="font-medium">{selectedGatePass.out_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">In Date</p>
                    <p className="font-medium">{selectedGatePass.in_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Out Time</p>
                    <p className="font-medium">{selectedGatePass.out_time || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">In Time</p>
                    <p className="font-medium">{selectedGatePass.in_time || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p className="font-medium">{selectedGatePass.purpose}</p>
                  </div>
                </div>

                {selectedGatePass.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={() => handleGatePassAction(selectedGatePass.id, "approved")}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleGatePassAction(selectedGatePass.id, "rejected")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {selectedGatePass.status !== "pending" && (
                  <div className={`p-4 rounded-lg border ${getStatusColor(selectedGatePass.status)}`}>
                    <p className="font-medium capitalize">{selectedGatePass.status}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Enlarged Photo Dialog */}
      <Dialog open={!!enlargedPhotoUrl} onOpenChange={() => setEnlargedPhotoUrl(null)}>
        <DialogContent className="max-w-md p-2">
          <DialogHeader>
            <DialogTitle>Student Photo - Identity Verification</DialogTitle>
          </DialogHeader>
          {enlargedPhotoUrl && (
            <div className="flex justify-center p-4">
              <img
                src={enlargedPhotoUrl}
                alt="Student photo enlarged"
                className="max-w-full max-h-[60vh] object-contain rounded-lg border-2 border-primary shadow-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Warden Signature
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {warden?.signature_url && !signaturePreview && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Current Signature:</p>
                <img
                  src={warden.signature_url}
                  alt="Current Signature"
                  className="max-h-20 object-contain border border-border rounded"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Upload Signature Image</Label>
              <input
                type="file"
                ref={signatureInputRef}
                accept="image/*"
                onChange={handleSignatureFileChange}
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => signatureInputRef.current?.click()}
              >
                {signaturePreview ? (
                  <img
                    src={signaturePreview}
                    alt="Signature Preview"
                    className="max-h-24 mx-auto object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload signature image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG (max 2MB)
                    </p>
                  </div>
                )}
              </div>
              {signatureFile && (
                <p className="text-sm text-muted-foreground text-center">
                  Selected: {signatureFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleSaveSignature}
                disabled={!signatureFile || isUploading}
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Upload Signature
                  </>
                )}
              </Button>
              {warden?.signature_url && (
                <Button
                  variant="destructive"
                  onClick={handleRemoveSignature}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default WardenDashboard;
