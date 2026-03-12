import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
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
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  PieChart as PieChartIcon,
  Table as TableIcon,
  CreditCard,
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
import PaymentSubmissionsDashboard from "@/components/warden/PaymentSubmissionsDashboard";
import { getWardenSession, clearWardenSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";

interface Warden {
  id: string;
  name: string;
  warden_type: string;
  username: string;
  signature_url?: string;
}

type TabType = "dashboard" | "applications" | "gatepasses" | "rooms" | "allotment" | "materials" | "issues" | "medicines" | "foodSelection" | "completedFees" | "paymentSubmissions";

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
  const [appImages, setAppImages] = useState<Record<string, { photo_url: string, signature_url: string, loading: boolean }>>({});
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
    // Omit large base64 string columns (photo_url, signature_url) for initial fast loading
    let query = supabase.from("hostel_applications").select("id, student_name, branch, room_type, status, phone_number, email, gender, ac_type, created_at, months, father_name, parent_phone_number, price, floor_preference").order("created_at", { ascending: false });
    if (gender) query = query.ilike("gender", gender);
    const { data } = await query;
    if (data) setApplications(data as any[]);
  };

  const fetchStudents = async (gender: string | null) => {
    let query = supabase.from("students").select("*").order("student_name");
    if (gender) {
      query = query.ilike("gender", gender);
    }

    const [dbResult, deletedIds] = await Promise.all([
      query,
      localApi.getDeletedIds()
    ]);

    if (dbResult.data) {
      const activeStudents = (dbResult.data as any[]).filter(student => !deletedIds.includes(student.id));
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
    if (gender) query = query.ilike("students.gender", gender);
    const { data } = await query;
    if (data) setGatePasses(data as any[]);
  };

  const fetchIssues = async (gender: string | null) => {
    let elecQuery = supabase.from("electrical_issues").select("*, students!inner(gender)").order("created_at", { ascending: false });
    let foodQuery = supabase.from("food_issues").select("*, students!inner(gender)").order("created_at", { ascending: false });
    let medicalQuery = supabase.from("medical_alerts").select("*, students!inner(gender)").order("created_at", { ascending: false });

    if (gender) {
      const [{ data: elecData }, { data: foodData }, { data: medicalData, error: medicalError }] = await Promise.all([
        elecQuery.ilike("students.gender", gender),
        foodQuery.ilike("students.gender", gender),
        medicalQuery.ilike("students.gender", gender)
      ]);

      if (elecData) setElectricalIssues(elecData as any[]);
      if (foodData) setFoodIssues(foodData as any[]);

      if (medicalError) {
        console.error("Medical alerts fetch failed:", medicalError.message);
        setMedicalAlerts([]);
      } else {
        setMedicalAlerts(medicalData || []);
      }
    } else {
      const [{ data: elecData }, { data: foodData }, { data: medicalData, error: medicalError }] = await Promise.all([
        elecQuery,
        foodQuery,
        medicalQuery
      ]);

      if (elecData) setElectricalIssues(elecData as any[]);
      if (foodData) setFoodIssues(foodData as any[]);

      if (medicalError) {
        console.error("Medical alerts fetch failed:", medicalError.message);
        setMedicalAlerts([]);
      } else {
        setMedicalAlerts(medicalData || []);
      }
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
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
    if (warden) {
      logger.info("warden_logout", warden.username, "success");
    }
    clearWardenSession();
    navigate("/warden-login");
  };

  const handleApplicationAction = async (applicationId: string, initialAction: "accepted" | "rejected") => {
    // Get the application details for email
    const application = applications.find(app => app.id === applicationId);
    let action = initialAction;
    let availableRoom: any = null;

    if (action === "accepted" && application) {
      const isBoys = warden?.warden_type === "boys";
      const isGirls = warden?.warden_type === "girls";

      const floorPref = application.floor_preference;

      // First pass: Seek room matching ALL requirements INCLUDING floor preference if specific
      for (const room of rooms) {
        const roomNum = (room.room_number || "").toUpperCase().trim();
        const isGirlsRoom = roomNum.startsWith("GA") || roomNum.startsWith("GN");
        const isBoysRoom = (roomNum.startsWith("A") || roomNum.startsWith("N")) && !isGirlsRoom;

        if ((isBoys && !isBoysRoom) || (isGirls && !isGirlsRoom)) continue;

        // Check if floor matches preference (if preference is specific)
        if (floorPref && floorPref !== "any" && room.floor_number !== floorPref) continue;

        if (room.room_type === application.room_type && room.ac_type === application.ac_type) {
          const roomStudents = students.filter(s => s.hostel_room_number === room.room_number);
          const actualOccupied = roomStudents.length;
          const closedBeds = room.closed_beds || 0;
          const availableBeds = Math.max(0, room.total_beds - actualOccupied - closedBeds);

          if (availableBeds > 0) {
            availableRoom = room;
            break;
          }
        }
      }

      // Second pass: If specific floor pref failed, we ONLY fallback if preference was "any" or not specified
      // BUT according to user requirement "if that Ac single bed is Empty block that room... if room is not available Automatically Reject"
      // This implies floor preference might be strict. Let's make it strict if specified.
      // If the user wants ANY floor, floorPref will be "any".


      if (!availableRoom) {
        alert("There are no available rooms matching this application's requirements.");
        action = "rejected";
      } else {
        const rollOrPhone = (application.phone_number || "").toUpperCase().trim();
        const defaultPassword = "Hostel@123"; // Standard default password
        const existingStudent = students.find(s => s.roll_number === rollOrPhone || (s.email && s.email === application.email));

        if (existingStudent) {
          const { error: updateError } = await supabase.from("students").update({
            room_allotted: false, // Block the room, but keep them pending for Room Allotment confirmation
            hostel_room_number: availableRoom.room_number,
            floor_number: availableRoom.floor_number,
            total_fee: application.price || 100000,
            pending_fee: (application.price || 100000) - (existingStudent.paid_fee || 0),
            password: existingStudent.password || defaultPassword,
          }).eq("id", existingStudent.id);

          if (updateError) {
            console.error("Failed to update existing student:", updateError);
            toast({ title: "Error", description: "Failed to update existing student profile.", variant: "destructive" });
            return;
          }
        } else {
          // Ensure we have the photo url saved (can be huge)
          let finalPhotoUrl = application.photo_url;
          if (!finalPhotoUrl && (selectedApplication?.id === application.id)) {
            finalPhotoUrl = selectedApplication.photo_url;
          }
          if (!finalPhotoUrl) {
            const { data: appData } = await supabase.from("hostel_applications").select("photo_url").eq("id", application.id).single();
            if (appData) finalPhotoUrl = appData.photo_url;
          }

          const { error: insertError } = await supabase.from("students").insert({
            roll_number: rollOrPhone,
            student_name: application.student_name,
            email: application.email,
            branch: application.branch,
            gender: application.gender === "boy" ? "male" : (application.gender === "girl" ? "female" : application.gender),
            room_allotted: false, // Block the room, but keep them pending for Room Allotment confirmation
            hostel_room_number: availableRoom.room_number,
            floor_number: availableRoom.floor_number,
            total_fee: application.price || 100000,
            pending_fee: application.price || 100000,
            paid_fee: 0,
            year: "1st Year",
            photo_url: finalPhotoUrl,
            password: defaultPassword,
          });

          if (insertError) {
            console.error("Failed to insert new student:", insertError);
            toast({ title: "Error", description: "Failed to create new student profile.", variant: "destructive" });
            return;
          }
        }
        
        // Update room occupancy count in database
        const roomStudentsAtThisRoom = students.filter(s => s.hostel_room_number === availableRoom.room_number);
        const newOccupancy = roomStudentsAtThisRoom.length + (existingStudent?.hostel_room_number === availableRoom.room_number ? 0 : 1);

        await supabase
          .from("rooms")
          .update({ occupied_beds: newOccupancy })
          .eq("id", availableRoom.id);


        // This `txError` block seems to be for a fee transaction history, which is not directly part of application action.
        // Pre-fetch immediately to update the UI
        if (warden) {
          const studentGender = warden.warden_type === "boys" ? "male" : warden.warden_type === "girls" ? "female" : null;
          fetchStudents(studentGender);
          fetchRooms(warden.warden_type === "boys", warden.warden_type === "girls");
        }

        toast({
          title: "Room Blocked",
          description: `Room ${availableRoom.room_number} blocked. Username: ${rollOrPhone}, Default Password: ${defaultPassword}`,
          duration: 10000
        });
      }
    }

    const { error } = await supabase
      .from("hostel_applications")
      .update({ status: action })
      .eq("id", applicationId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      logger.error("room_allocation", applicationId, "failure");
      return;
    }

    if (!application) return;

    // Insert notification for the student
    const rollOrPhoneForNotif = (application.phone_number || "").toUpperCase().trim();
    const { data: studentNotif } = await supabase
      .from("students")
      .select("id")
      .or(`roll_number.eq.${rollOrPhoneForNotif},email.eq.${application.email}`)
      .single();

    if (studentNotif) {
      const isAccepted = action === "accepted";
      
      await (supabase as any).from("notifications").insert({
        student_id: studentNotif.id,
        title: `Hostel Application ${isAccepted ? "Approved" : "Rejected"}`,
        message: isAccepted 
          ? `Your hostel application has been approved! Room ${availableRoom?.room_number || "has been assigned"} on floor ${availableRoom?.floor_number || "assigned"} has been blocked for you. You can now login with your roll number (the phone number you used for registration) and default password.`
          : `We regret to inform you that your hostel application has been rejected. ${!availableRoom && initialAction === 'accepted' ? 'This is because no room matching your requirements was available at this time.' : ''}`,
        type: "application"
      });
    }

    logger.info(action === "accepted" ? "room_allocation_approved" : "room_allocation_rejected", applicationId, "success");

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
      const rollOrPhoneForEmail = (application.phone_number || "").toUpperCase().trim();
      supabase.functions.invoke("send-application-email", {
        body: {
          email: application.email,
          studentName: application.student_name,
          status: action,
          roomType: application.room_type,
          acType: application.ac_type,
          username: action === "accepted" ? rollOrPhoneForEmail : undefined,
          password: action === "accepted" ? "Hostel@123" : undefined,
        },
      }).catch(err => console.error('Email invoke error:', err));
    }
  };

  const handleApplicationClick = async (app: any) => {
    // Set initial data to open dialog instantly
    setSelectedApplication(app);

    // If we haven't fetched images for this app yet, fetch them
    if (!appImages[app.id] || (!appImages[app.id].photo_url && !appImages[app.id].signature_url && !appImages[app.id].loading)) {
      setAppImages(prev => ({ ...prev, [app.id]: { loading: true, photo_url: "", signature_url: "" } }));

      try {
        const { data, error } = await supabase
          .from("hostel_applications")
          .select("photo_url, signature_url")
          .eq("id", app.id)
          .single();

        if (error) {
          console.error("Failed to fetch application images", error);
          setAppImages(prev => ({ ...prev, [app.id]: { loading: false, photo_url: "", signature_url: "" } }));
        } else if (data) {
          setAppImages(prev => ({
            ...prev,
            [app.id]: {
              loading: false,
              photo_url: data.photo_url || "NONE",
              signature_url: data.signature_url || "NONE"
            }
          }));

          // Also update selectedApplication in case it's still open to ensure both places have it
          setSelectedApplication((prevApp: any) => {
            if (prevApp?.id === app.id) {
              return { ...prevApp, photo_url: data.photo_url, signature_url: data.signature_url };
            }
            return prevApp;
          });
        }
      } catch (err) {
        console.error("Error fetching images", err);
        setAppImages(prev => ({ ...prev, [app.id]: { loading: false, photo_url: "", signature_url: "" } }));
      }
    } else if (!appImages[app.id].loading) {
      // If already fetched and cached, update selectedApplication immediately
      setSelectedApplication((prevApp: any) => prevApp?.id === app.id ? { ...prevApp, photo_url: appImages[app.id].photo_url, signature_url: appImages[app.id].signature_url } : prevApp);
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

    // Insert notification for the student
    if (gatePass) {
      const student = students.find(s => s.roll_number === gatePass.roll_number);
      if (student) {
        await (supabase as any).from("notifications").insert({
          student_id: student.id,
          title: `Gate Pass ${action === "approved" ? "Approved" : "Rejected"}`,
          message: `Your gate pass request for ${gatePass.out_date} has been ${action === "approved" ? "approved" : "rejected"} by the warden.`,
          type: "gate_pass"
        });
      }

      // Send email in background
      const gatePassEmail = gatePass.student_email;
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
    { id: "allotment" as TabType, label: "Room Allotment", icon: Users, count: pendingStudents.length },
    { id: "materials" as TabType, label: "Study Materials", icon: Upload },
    { id: "issues" as TabType, label: "Issues", icon: AlertTriangle, count: pendingElectrical.length + pendingFood.length },
    { id: "foodSelection" as TabType, label: "Food Selection", icon: Utensils },
    { id: "medicines" as TabType, label: "Medicines", icon: Pill },
    { id: "completedFees" as TabType, label: "Fees Completed", icon: Check, count: students.filter(s => s.pending_fee <= 0 && s.room_allotted).length },
    { id: "paymentSubmissions" as TabType, label: "Student Payments", icon: CreditCard },
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
            {(() => {
              const totalAllotted = students.filter(s => s.room_allotted).length;
              const now = new Date();
              const outRolls = new Set();
              
              gatePasses.forEach(gp => {
                if (gp.status === 'approved' && gp.out_date && gp.in_date) {
                  try {
                    const outDate = new Date(`${gp.out_date}T${gp.out_time || '00:00:00'}`);
                    const inDate = new Date(`${gp.in_date}T${gp.in_time || '23:59:59'}`);
                    
                    if (!isNaN(outDate.getTime()) && !isNaN(inDate.getTime())) {
                      if (now >= outDate && now <= inDate) {
                        outRolls.add(gp.roll_number);
                      }
                    }
                  } catch (e) {
                    // Ignore date parsing errors
                  }
                }
              });

              const leaveCount = outRolls.size;
              const presentCount = Math.max(0, totalAllotted - leaveCount);
              const isBoys = warden?.warden_type === "boys";

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2 animate-fade-in">
                  <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg border-0 hover:shadow-indigo-500/30 transition-shadow transition-transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-indigo-100 flex items-center justify-between font-medium">
                        Total {isBoys ? 'Boys' : 'Girls'}
                        <Users className="w-5 h-5 text-indigo-200" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black">{totalAllotted}</div>
                      <p className="text-indigo-100/80 text-sm mt-1">Total allotted students in hostel</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg border-0 hover:shadow-emerald-500/30 transition-shadow transition-transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-emerald-100 flex items-center justify-between font-medium">
                        Currently Present
                        <Home className="w-5 h-5 text-emerald-200" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black">{presentCount}</div>
                      <p className="text-emerald-100/80 text-sm mt-1">Students inside hostel</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg border-0 hover:shadow-amber-500/30 transition-shadow transition-transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-amber-100 flex items-center justify-between font-medium">
                        On Leave (Outing)
                        <DoorOpen className="w-5 h-5 text-amber-200" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black">{leaveCount}</div>
                      <p className="text-amber-100/80 text-sm mt-1">Currently out on gate pass</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            <h2 className="text-2xl font-bold text-foreground">Pending Room Details</h2>
            <PendingRoomsDashboard rooms={rooms} students={students} />
          </div>
        )}

        {/* Completed Fees Tab */}
        {activeTab === "completedFees" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Fees Completed Students</h2>
              <Badge variant="outline" className="text-success border-success/30 bg-success/10 px-4 py-1">
                {students.filter(s => (s.pending_fee || 100000) <= 0 && s.room_allotted).length} Students Paid Fully
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students
                .filter(s => (s.pending_fee || 100000) <= 0 && s.room_allotted)
                .map((student) => {
                  return (
                    <Card key={student.id} className="border-2 border-success/20 bg-success/5 shadow-sm">
                      <CardHeader className="pb-2 border-b border-success/10 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-success" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">{student.student_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{student.roll_number}</p>
                          </div>
                        </div>
                        <div className="p-1.5 bg-success rounded-full text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Year:</span>
                          <span className="font-bold text-success">{student.year} Completed</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="font-bold">₹{Number(student.paid_fee || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-success/10 flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-tighter text-success opacity-80 italic">
                            Clearance Verified
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              
              {students.filter(s => (s.pending_fee || 100000) <= 0 && s.room_allotted).length === 0 && (
                <div className="col-span-full py-20 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-muted-foreground">No students have completed fees yet</h3>
                  <p className="text-sm text-muted-foreground">Fully paid students will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Submissions Tab */}
        {activeTab === "paymentSubmissions" && (
          <div className="space-y-6">
            <PaymentSubmissionsDashboard wardenType={warden?.warden_type} />
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
                {applications.map((app) => {
                  const matchedStudent = students.find(s => s.roll_number === (app.phone_number || "").toUpperCase().trim() || (s.email && s.email === app.email));
                  // Show the room even if it's only "blocked" (room_allotted = false)
                  const allocatedRoom = (app.status === "accepted" || app.status === "approved") && matchedStudent?.hostel_room_number ? matchedStudent.hostel_room_number : null;

                  return (
                    <Card
                      key={app.id}
                      className={`border-2 cursor-pointer transition-all hover:shadow-lg ${app.status === "pending" ? "border-success/50" : "border-border"
                        }`}
                      onClick={() => handleApplicationClick(app)}
                    >
                      <CardHeader className="pb-2 relative">
                        {app.status === "pending" && (
                          <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-success pulse-dot" />
                        )}
                        <CardTitle className="text-lg">{app.student_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{app.branch?.toUpperCase()}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {getRoomTypeName(app.room_type)}
                            </span>
                            <div className="flex items-center gap-2">
                              {allocatedRoom && (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                  Room: {allocatedRoom}
                                </span>
                              )}
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
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
            <HostelRoomDetails students={students} onRefresh={fetchAllData} wardenType={warden.warden_type} />
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
          <div className="space-y-6">
            <FoodSelectionChart wardenType={warden?.warden_type} />
          </div>
        )}

        {/* Previous completedFees block was here, removed to avoid duplication */}

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
              {(() => {
                const matchedStudent = students.find(s => s.roll_number === (selectedApplication.phone_number || "").toUpperCase().trim() || (s.email && s.email === selectedApplication.email));
                const allocatedRoom = (selectedApplication.status === "accepted" || selectedApplication.status === "approved" || selectedApplication.status === "allotted") && matchedStudent?.hostel_room_number ? matchedStudent.hostel_room_number : null;
                if (allocatedRoom) {
                  return (
                    <div className="bg-primary/10 border-2 border-primary/30 p-4 rounded-xl text-center animate-in fade-in slide-in-from-top-4 duration-500">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Assigned Room</p>
                      <p className="text-3xl font-black text-primary tracking-tight">{allocatedRoom}</p>
                      <p className="text-[10px] text-primary/60 mt-1 uppercase font-semibold italic">Room blocked until final allotment</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Passport Photo and Signature */}
              <div className="photos-section flex justify-between items-start gap-4 pb-4 border-b border-border">
                <div className="photo-box flex-1">
                  <p className="photo-label text-sm text-muted-foreground mb-2">Passport Photo</p>
                  {(!appImages[selectedApplication.id] || appImages[selectedApplication.id]?.loading) ? (
                    <div className="w-24 h-28 bg-muted flex items-center justify-center rounded border-2 border-dashed border-border flex-col gap-2">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-[10px] text-muted-foreground">Loading...</span>
                    </div>
                  ) : (selectedApplication.photo_url || (appImages[selectedApplication.id]?.photo_url && appImages[selectedApplication.id]?.photo_url !== "NONE")) ? (
                    <img
                      src={selectedApplication.photo_url || appImages[selectedApplication.id]?.photo_url}
                      alt="Passport Photo"
                      className="w-24 h-28 object-cover border-2 border-border rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-28 bg-muted flex items-center justify-center rounded border-2 border-dashed border-border">
                      <span className="text-xs text-muted-foreground">No Photo</span>
                    </div>
                  )}
                </div>
                <div className="photo-box flex-1 text-right">
                  <p className="photo-label text-sm text-muted-foreground mb-2">Signature</p>
                  {(!appImages[selectedApplication.id] || appImages[selectedApplication.id]?.loading) ? (
                    <div className="w-48 h-20 bg-muted flex items-center justify-center rounded border-2 border-dashed border-border ml-auto flex-col gap-2">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-[10px] text-muted-foreground">Loading...</span>
                    </div>
                  ) : (selectedApplication.signature_url || (appImages[selectedApplication.id]?.signature_url && appImages[selectedApplication.id]?.signature_url !== "NONE")) ? (
                    <img
                      src={selectedApplication.signature_url || appImages[selectedApplication.id]?.signature_url}
                      alt="Signature"
                      className="w-48 h-20 object-contain bg-white border-2 border-border rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-48 h-20 bg-muted flex items-center justify-center rounded border-2 border-dashed border-border ml-auto">
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
                  <p className="detail-label text-sm text-muted-foreground">Floor Preference</p>
                  <p className="detail-value font-medium">
                    {selectedApplication.floor_preference === "any" || !selectedApplication.floor_preference
                      ? "Any Floor"
                      : `${selectedApplication.floor_preference}${selectedApplication.floor_preference === '1' ? 'st' : selectedApplication.floor_preference === '2' ? 'nd' : 'rd'} Floor`}
                  </p>
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
