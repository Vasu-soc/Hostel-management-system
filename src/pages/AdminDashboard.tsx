import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, User, IndianRupee, Loader2, 
  Users, DoorOpen, ShieldCheck, Megaphone, Wallet, 
  TrendingUp, CheckCircle2, ChevronRight, Search, 
  Trash2, BarChart3, XCircle, Info, Activity,
  ExternalLink, Utensils, AlertTriangle, RefreshCw
} from "lucide-react";
import { getAdminSession, clearAdminSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";
import TerminalLoader from "@/components/TerminalLoader";
import WardenApproval from "@/components/admin/WardenApproval";
import UpdatesManagement from "@/components/UpdatesManagement";
import { motion, AnimatePresence } from "framer-motion";

interface Admin {
  id: string;
  name: string;
  username: string;
}

interface Student {
  id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  year: string;
  hostel_room_number: string | null;
  room_allotted: boolean;
  total_fee: number | null;
  paid_fee: number | null;
  pending_fee: number | null;
  gender: string;
  photo_url: string | null;
  email: string | null;
  batch_start?: number;
  batch_end?: number;
}

interface Watchman {
  id: string;
  name: string;
  mobile_number: string | null;
  username: string;
  password?: string;
}

interface Room {
  id: string;
  room_number: string;
  floor_number: string;
  ac_type: string;
  total_beds: number;
  occupied_beds: number;
  pending_beds: number;
}

interface SecurityIncident {
  id: string;
  watchman_id: string;
  watchman_name: string;
  incident_type: string;
  description: string;
  status: string;
  created_at: string;
}

import { BRANCHES, COURSES, getBranchesByCourse, getBranchImage } from "@/lib/constants";
const branches = BRANCHES.map(b => b.value.toUpperCase());
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("all_courses");
  const [selectedBranch, setSelectedBranch] = useState<string>("all_branches");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedBatchStart, setSelectedBatchStart] = useState<string>("all_years");
  const [selectedBatchEnd, setSelectedBatchEnd] = useState<string>("all_years");
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("all_genders");
  const [quickViewFilter, setQuickViewFilter] = useState<"all" | "male" | "female" | "fees" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [messCount, setMessCount] = useState<number>(0);
  const [activeView, setActiveView] = useState<"dashboard" | "students" | "rooms" | "wardens" | "watchmen" | "updates" | "appFees" | "incidents">("dashboard");
  const [showLoader, setShowLoader] = useState(() => sessionStorage.getItem("show_terminal_loader") === "true");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeData, setFeeData] = useState({
    total_fee: 0,
    paid_fee: 0,
    new_payment: 0,
  });
  const [feeHistory, setFeeHistory] = useState<any[]>([]);
  const [watchmen, setWatchmen] = useState<Watchman[]>([]);
  const [watchmanDialogOpen, setWatchmanDialogOpen] = useState(false);
  const [newWatchman, setNewWatchman] = useState({ name: "", mobile_number: "", username: "", password: "" });

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      navigate("/admin-login");
      return;
    }
    setAdmin(session);
    fetchRooms();
    fetchAllStudents();
    fetchApplications();
    fetchMessCount();
    fetchWatchmen();

    const channel = (supabase as any)
      .channel("admin-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "watchmen" }, fetchWatchmen)
      .on("postgres_changes", { event: "*", schema: "public", table: "security_incidents" }, fetchIncidents)
      .on("postgres_changes", { event: "*", schema: "public", table: "wardens" }, () => {
        // No fetchWardens here as it's in a sub-component, but we might want to trigger it if possible
        // Actually WardenApproval handles its own state. Let's add it there or force refresh.
        // For now, let's refresh general student stats that might be affected
        fetchAllStudents();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "fee_transactions" }, () => {
        fetchAllStudents(); // Refresh to update collection stats
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        fetchAllStudents();
        if (selectedBranch && selectedYear) {
          fetchStudentsData(selectedBranch, selectedYear);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hostel_applications" }, fetchApplications)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_attendance" }, fetchMessCount)
      .subscribe();

    fetchIncidents();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("hostel_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApplications(data);
  };

  const fetchMessCount = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from("daily_attendance")
      .select("*", { count: 'exact', head: true })
      .eq("attendance_date", today)
      .eq("status", "present");
    if (!error) setMessCount(count || 0);
  };

  const fetchIncidents = async () => {
    const { data } = await (supabase as any).from("security_incidents").select("*").order("created_at", { ascending: false });
    if (data) setIncidents(data as SecurityIncident[]);
  };

  const fetchAllStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("students").select("*");
    if (!error && data) setAllStudents(data as Student[]);
    setIsLoading(false);
  };

  const getActualOccupied = (roomNumber: string) => {
    return allStudents.filter(s => s.hostel_room_number === roomNumber).length;
  };

  const fetchWatchmen = async () => {
    const { data } = await (supabase as any).from("watchmen").select("*");
    if (data) setWatchmen(data as Watchman[]);
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase.from("rooms").select("*").order("room_number");
    if (!error) setRooms((data || []) as Room[]);
  };

  const fetchStudentsData = async (branch?: string, year?: string) => {
    let query = supabase.from("students").select("*");
    
    if (branch) {
      query = query.ilike("branch", branch);
    }
    if (year) {
      query = query.eq("year", year);
    }
    
    const { data, error } = await query;
    if (!error) setStudents((data as Student[]) || []);
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    if (selectedBranch && selectedYear) {
      await fetchStudentsData(selectedBranch, selectedYear);
    } else {
      // If we don't have both selected, we just show from allStudents
      setStudents(allStudents);
    }
    setActiveView("students");
    setIsLoading(false);
  };

  const stats = useMemo(() => {
    const totalCollection = allStudents.reduce((sum, s) => sum + (s.paid_fee || 0), 0);
    const totalBeds = rooms.reduce((sum, r) => sum + r.total_beds, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + getActualOccupied(r.room_number), 0);
    
    // Normalized gender helper
    const isMale = (g: string | null) => {
      const val = (g || "").toLowerCase().trim();
      return val === "male" || val === "m" || val === "boy" || val === "gentleman";
    };
    const isFemale = (g: string | null) => {
      const val = (g || "").toLowerCase().trim();
      return val === "female" || val === "f" || val === "girl" || val === "lady";
    };

    // Robust Branch-wise breakdown
    const branchStats = branches.reduce((acc, branchName) => {
      const branchStudents = allStudents.filter(s => 
        (s.branch || "").toUpperCase().trim() === branchName.toUpperCase().trim()
      );
      
      acc[branchName] = {
        total: branchStudents.length,
        male: branchStudents.filter(s => isMale(s.gender)).length,
        female: branchStudents.filter(s => isFemale(s.gender)).length
      };
      return acc;
    }, {} as Record<string, { total: number, male: number, female: number }>);

    // Capture students who might be in miscellaneous branches
    const knownBranches = branches.map(b => b.toUpperCase().trim());
    const miscStudents = allStudents.filter(s => !knownBranches.includes((s.branch || "").toUpperCase().trim()));
    if (miscStudents.length > 0) {
      branchStats["OTHERS"] = {
        total: miscStudents.length,
        male: miscStudents.filter(s => isMale(s.gender)).length,
        female: miscStudents.filter(s => isFemale(s.gender)).length
      };
    }

    return {
      totalStudents: allStudents.length,
      boysCount: allStudents.filter(s => isMale(s.gender)).length,
      girlsCount: allStudents.filter(s => isFemale(s.gender)).length,
      totalCollection,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      branchStats
    };
  }, [allStudents, rooms, getActualOccupied]);

  const acRooms = useMemo(() => rooms.filter(r => r.ac_type === "ac"), [rooms]);
  const normalRooms = useMemo(() => rooms.filter(r => r.ac_type === "normal"), [rooms]);

  const fetchFeeHistory = async (studentId: string) => {
    const { data } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: true });
    setFeeHistory(data || []);
  };

  const handleUpdateFee = async () => {
    if (!selectedStudent) return;
    const newPending = Math.max(0, feeData.total_fee - (feeData.paid_fee + feeData.new_payment));
    const { error } = await supabase.from("students").update({
      total_fee: feeData.total_fee,
      paid_fee: feeData.paid_fee + feeData.new_payment,
      pending_fee: newPending,
    }).eq("id", selectedStudent.id);

    if (!error && feeData.new_payment > 0) {
      await supabase.from("fee_transactions").insert({
        student_id: selectedStudent.id,
        amount: feeData.new_payment,
        remarks: `Updated by Admin`,
        academic_year: selectedStudent.year,
      });
    }
    toast({ title: "Updated", description: "Records synchronized" });
    setFeeDialogOpen(false);
    fetchAllStudents();
  };

  const handleResetSystem = async () => {
    if (!confirm("Erase all application data?")) return;
    setIsLoading(true);
    try {
      const { data: st } = await supabase.from("students").select("id, roll_number");
      if (st) await Promise.all(st.map(s => (supabase as any).rpc('delete_student_complete', { p_student_id: s.id, p_roll_number: s.roll_number })));
      toast({ title: "System Wiped" });
      fetchAllStudents();
      setActiveView("dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWatchman = async () => {
    if (!newWatchman.name || !newWatchman.username || !newWatchman.password) return;
    const { error } = await (supabase as any).from("watchmen").insert([newWatchman]);
    if (!error) {
      toast({ title: "Watchman Created" });
      setWatchmanDialogOpen(false);
      setNewWatchman({ name: "", mobile_number: "", username: "", password: "" });
      fetchWatchmen();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteWatchman = async (id: string) => {
    if (!confirm("Delete this watchman?")) return;
    const { error } = await (supabase as any).from("watchmen").delete().eq("id", id);
    if (!error) {
      toast({ title: "Watchman Deleted" });
      fetchWatchmen();
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/");
  };

  const filteredStudents = useMemo(() => {
    // If we're searching, search from allStudents
    // If filters are active, use those
    let list = allStudents;
    
    if (selectedBranch && selectedBranch !== "all_branches") {
      list = list.filter(s => (s.branch || "").toUpperCase().trim() === selectedBranch.toUpperCase().trim());
    }
    if (selectedYear && selectedYear !== "all_years") {
      list = list.filter(s => (s.year || "").trim() === selectedYear.trim());
    }

    if (selectedGender && selectedGender !== "all_genders") {
      const isMale = (g: string | null) => {
        const val = (g || "").toLowerCase().trim();
        return val === "male" || val === "m" || val === "boy" || val === "gentleman";
      };
      const isFemale = (g: string | null) => {
        const val = (g || "").toLowerCase().trim();
        return val === "female" || val === "f" || val === "girl" || val === "lady";
      };
      if (selectedGender === "male") list = list.filter(s => isMale(s.gender));
      if (selectedGender === "female") list = list.filter(s => isFemale(s.gender));
    }

    if (selectedBatchStart && selectedBatchStart !== "all_years") {
      list = list.filter(s => (s as any).batch_start === parseInt(selectedBatchStart));
    }

    if (selectedBatchEnd && selectedBatchEnd !== "all_years") {
      list = list.filter(s => (s as any).batch_end === parseInt(selectedBatchEnd));
    }

    if (searchQuery) {
      list = list.filter(s => 
        s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return list;
  }, [allStudents, selectedBranch, selectedYear, searchQuery]);

  if (!admin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      {showLoader && <TerminalLoader onComplete={() => {
        setShowLoader(false);
        sessionStorage.removeItem("show_terminal_loader");
      }} />}
      <div className={`min-h-screen bg-background text-foreground transition-all duration-700 ${showLoader ? "pointer-events-none select-none opacity-60" : ""}`}>
      <CollegeHeader />
      
      <DashboardHeader
        title="Admin"
        userName={admin?.name || "Admin"}
        userSubtitle={<Badge variant="outline" className="text-xs">System Administrator</Badge>}
        onLogout={handleLogout}
        showPhoto={false}
        staticPosition={true}
      />

      {/* Classic Navigation Bar */}
      <div className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-1 py-3 min-w-max">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "students", label: "Students", icon: Users },
              { id: "rooms", label: "Rooms", icon: DoorOpen },
              { id: "wardens", label: "Wardens", icon: ShieldCheck },
              { id: "watchmen", label: "Watchmen", icon: ShieldCheck },
              { id: "incidents", label: "Security", icon: AlertTriangle },
              { id: "appFees", label: "Fee Summary", icon: IndianRupee },
              { id: "updates", label: "Updates", icon: Megaphone }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {activeView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-600", detail: "Registered Active", action: () => setQuickViewFilter("all") },
                  { label: "Total Boys", value: stats.boysCount, icon: User, color: "text-indigo-600", detail: `${stats.totalStudents > 0 ? Math.round((stats.boysCount / stats.totalStudents) * 100) : 0}% of Total`, action: () => setQuickViewFilter("male") },
                  { label: "Total Girls", value: stats.girlsCount, icon: User, color: "text-pink-600", detail: `${stats.totalStudents > 0 ? Math.round((stats.girlsCount / stats.totalStudents) * 100) : 0}% of Total`, action: () => setQuickViewFilter("female") },
                  { label: "Total Collection", value: `₹${stats.totalCollection.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", detail: "Paid Fees", action: () => setQuickViewFilter("fees") },
                  { label: "Mess Count", value: messCount, icon: Utensils, color: "text-orange-600", detail: "Meals for Today", action: null },
                  { label: "App Fee Paid", value: applications.filter(a => a.application_fee_status === "paid").length, icon: CheckCircle2, color: "text-purple-600", detail: "Verified Apps", action: () => setActiveView("appFees") }
                ].map((item, idx) => (
                  <Card 
                    key={idx} 
                    className={`p-6 ${item.action ? "cursor-pointer hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-95" : ""}`}
                    onClick={item.action || undefined}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted">
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <h3 className="text-2xl font-bold">{item.value}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Insights & Distributions */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Gender Insights */}
                <Card className="p-6 col-span-1 border-2 border-primary/5 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold">Gender Ratio</h3>
                    <p className="text-sm text-muted-foreground">Resident breakdown by gender</p>
                  </div>
                  <div className="mt-8 relative flex flex-col items-center">
                    <div className="h-40 w-40 rounded-full border-[10px] border-muted flex items-center justify-center relative overflow-hidden">
                       <div 
                        className="absolute inset-0 bg-indigo-500 origin-bottom transition-all duration-1000" 
                        style={{ height: `${stats.totalStudents > 0 ? (stats.boysCount / stats.totalStudents) * 100 : 0}%`, top: 'auto', bottom: 0 }}
                       />
                       <div 
                        className="absolute inset-0 bg-pink-500 origin-top transition-all duration-1000" 
                        style={{ height: `${stats.totalStudents > 0 ? (stats.girlsCount / stats.totalStudents) * 100 : 0}%`, bottom: 'auto', top: 0 }}
                       />
                       <div className="z-10 bg-card w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-inner">
                         <span className="text-2xl font-black">{(stats.totalStudents > 0 ? (stats.boysCount/stats.totalStudents)*100 : 0).toFixed(0)}%</span>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Boys</span>
                       </div>
                    </div>

                    <div className="mt-8 w-full space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-indigo-500" />
                          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Boys</span>
                        </div>
                        <span className="text-lg font-black text-indigo-800 dark:text-indigo-300">{stats.boysCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-pink-500" />
                          <span className="text-sm font-bold text-pink-700 dark:text-pink-400">Girls</span>
                        </div>
                        <span className="text-lg font-black text-pink-800 dark:text-pink-300">{stats.girlsCount}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Branch Wise Distribution */}
                <Card className="p-6 col-span-2 border-2 border-primary/5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Branch Wise Distribution</h3>
                      <p className="text-sm text-muted-foreground">Active residents per department</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Object.entries(stats.branchStats)
                        .filter(([_, data]) => data.total > 0)
                        .map(([branchValue, data]) => {
                          return (
                            <div key={branchValue} className="p-4 rounded-xl bg-muted/30 border border-border group hover:bg-muted/50 transition-colors relative overflow-hidden">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-xs font-black text-muted-foreground uppercase">{branchValue}</span>
                                  <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-xl font-bold">{data.total}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">STUDENTS</span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden flex">
                                <div className="h-full bg-indigo-500" style={{ width: `${data.total > 0 ? (data.male / data.total) * 100 : 0}%` }} />
                                <div className="h-full bg-pink-500" style={{ width: `${data.total > 0 ? (data.female / data.total) * 100 : 0}%` }} />
                              </div>
                            </div>
                          );
                        })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-dashed flex justify-end">
                     <Button variant="link" size="sm" onClick={() => setActiveView("students")} className="text-primary font-bold">View Detailed List <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold px-1">Quick Search</h3>
                  <Card className="p-6">
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="space-y-2">
                              <label className="text-sm font-medium">Course</label>
                              <Select value={selectedCourse} onValueChange={(val) => {
                                setSelectedCourse(val);
                                setSelectedBranch("all_branches");
                              }}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select Course" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all_courses">All Courses</SelectItem>
                                  {COURSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium">Branch</label>
                              <Select 
                                value={selectedBranch} 
                                onValueChange={setSelectedBranch}
                                disabled={selectedCourse === "all_courses"}
                                key={selectedCourse}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={selectedCourse === "all_courses" ? "All Branches" : "Select Branch"} />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="all_branches">All Branches</SelectItem>
                                   {getBranchesByCourse(selectedCourse).map(b => (
                                     <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                   ))}
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium">Year</label>
                              <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select Year" /></SelectTrigger>
                                <SelectContent>
                                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <Button onClick={fetchStudents} disabled={isLoading} className="w-full">
                           {isLoading ? <Loader2 className="animate-spin mr-2" /> : "View Student Records"}
                        </Button>
                     </div>
                  </Card>
                </div>

                <div className="space-y-4">
                   <h3 className="text-lg font-bold px-1">Maintenance</h3>
                   <div className="space-y-4">
                      <Card className="p-6 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleResetSystem}>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                                  <Trash2 className="w-5 h-5 text-red-600" />
                               </div>
                               <div>
                                  <h4 className="font-bold">Erase System Data</h4>
                                  <p className="text-xs text-muted-foreground">Permanently delete all records</p>
                               </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                         </div>
                      </Card>

                      <Card className="p-6">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                               <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                               <h4 className="font-bold">System Status</h4>
                               <p className="text-xs text-muted-foreground">All systems operational</p>
                            </div>
                         </div>
                      </Card>
                   </div>
                </div>

                <Dialog open={!!quickViewFilter} onOpenChange={(open) => !open && setQuickViewFilter(null)}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                        {quickViewFilter === "all" && "All Resident Students"}
                        {quickViewFilter === "male" && "Boys Resident List"}
                        {quickViewFilter === "female" && "Girls Resident List"}
                        {quickViewFilter === "fees" && "Hostel Fee Collection Status"}
                      </DialogTitle>
                      <DialogDescription>
                        Summary view of selected residency records.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4 border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="font-bold">Student Name</TableHead>
                            <TableHead className="font-bold">Roll Number</TableHead>
                            <TableHead className="font-bold">Branch</TableHead>
                            {quickViewFilter === "fees" ? (
                              <>
                                <TableHead className="font-bold text-green-600">Paid Fee</TableHead>
                                <TableHead className="font-bold text-red-600">Pending</TableHead>
                              </>
                            ) : (
                              <>
                                <TableHead className="font-bold">Gender</TableHead>
                                <TableHead className="font-bold text-primary">Room</TableHead>
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allStudents
                            .filter(s => {
                              const isM = (g: string | null) => {
                                const val = (g || "").toLowerCase().trim();
                                return val === "male" || val === "m" || val === "boy" || val === "gentleman";
                              };
                              const isF = (g: string | null) => {
                                const val = (g || "").toLowerCase().trim();
                                return val === "female" || val === "f" || val === "girl" || val === "lady";
                              };
                              if (quickViewFilter === "male") return isM(s.gender);
                              if (quickViewFilter === "female") return isF(s.gender);
                              return true;
                            })
                            .map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-bold text-sm">{student.student_name}</TableCell>
                                <TableCell className="font-mono text-xs opacity-60">{student.roll_number}</TableCell>
                                <TableCell className="text-xs">{student.branch}</TableCell>
                                {quickViewFilter === "fees" ? (
                                  <>
                                    <TableCell className="text-xs font-bold text-green-600">₹{student.paid_fee?.toLocaleString()}</TableCell>
                                    <TableCell className="text-xs font-bold text-red-600">₹{student.pending_fee?.toLocaleString()}</TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell className="uppercase text-[10px] font-bold opacity-60">{student.gender || "NA"}</TableCell>
                                    <TableCell className="text-xs font-bold text-primary">{student.hostel_room_number || "NA"}</TableCell>
                                  </>
                                )}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setQuickViewFilter(null)}>Close View</Button>
                      <Button onClick={() => {
                          const tg = quickViewFilter === "male" || quickViewFilter === "female" ? quickViewFilter : "all_genders";
                          setSelectedGender(tg);
                          setActiveView("students");
                          setQuickViewFilter(null);
                      }}>Full Management</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          )}

          {activeView === "students" && (
            <motion.div key="students" className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")}>
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedBranch && selectedBranch !== "all_branches" && selectedBranch !== "" && selectedBranch !== "-" ? `${selectedBranch} Students` : 
                           selectedYear && selectedYear !== "all_years" && selectedYear !== "" ? `${selectedYear} Students` :
                           "Hostel Residents"}
                        </h2>
                        <p className="text-sm text-muted-foreground">{filteredStudents.length} Total Records</p>
                      </div>
                    </div>
                    <div className="relative w-full md:w-72">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input 
                        placeholder="Search by name or roll number..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Filter by Course</Label>
                      <Select value={selectedCourse} onValueChange={(val) => {
                        setSelectedCourse(val);
                        setSelectedBranch("all_branches");
                      }}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_courses">All Courses</SelectItem>
                          {COURSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Filter by Branch</Label>
                      <Select 
                        value={selectedBranch} 
                        onValueChange={setSelectedBranch}
                        disabled={selectedCourse === "all_courses"}
                        key={selectedCourse}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={selectedCourse === "all_courses" ? "All Branches" : "All Branches"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_branches">All Branches</SelectItem>
                          {getBranchesByCourse(selectedCourse).map(b => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Filter by Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_years">All Years</SelectItem>
                          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Gender</Label>
                      <Select value={selectedGender} onValueChange={setSelectedGender}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All Genders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_genders">All Genders</SelectItem>
                          <SelectItem value="male">Boys Only</SelectItem>
                          <SelectItem value="female">Girls Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Batch Start</Label>
                      <Select value={selectedBatchStart} onValueChange={setSelectedBatchStart}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_years">All Years</SelectItem>
                          {Array.from({ length: 21 }, (_, i) => 2020 + i).map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Batch End</Label>
                      <Select value={selectedBatchEnd} onValueChange={setSelectedBatchEnd}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_years">All Years</SelectItem>
                          {Array.from({ length: 21 }, (_, i) => 2020 + i).map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        className="w-full h-10 border-dashed" 
                        onClick={() => { 
                          setSelectedBranch(""); 
                          setSelectedYear(""); 
                          setSelectedBatchStart("all_years");
                          setSelectedBatchEnd("all_years");
                          setSelectedGender("all_genders");
                          setSearchQuery(""); 
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Records...</p>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <Card key={student.id} className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                          {student.photo_url ? (
                            <img src={student.photo_url} className="w-20 h-20 rounded-xl object-cover border-2 border-muted" />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground"><User className="w-8 h-8" /></div>
                          )}
                          <div className="absolute -bottom-1 -right-1">
                             {student.room_allotted ? <CheckCircle2 className="w-5 h-5 text-green-500 fill-background" /> : <XCircle className="w-5 h-5 text-red-500 fill-background" />}
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-bold">{student.student_name}</h4>
                        <p className="text-xs font-medium text-primary uppercase tracking-wider">{student.roll_number}</p>

                        <div className="w-full grid grid-cols-2 gap-2 mt-4">
                           <div className="p-2 rounded-lg bg-muted/50">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Batch</p>
                              <p className="font-bold text-[10px] whitespace-nowrap">{(student as any).batch_start || (student as any).validity_from || '2024'}-{(student as any).batch_end || (student as any).validity_to || '2028'}</p>
                           </div>
                           <div className="p-2 rounded-lg bg-muted/50">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Room</p>
                              <p className="font-bold text-sm">{student.hostel_room_number || "None"}</p>
                           </div>
                           <div className="p-2 rounded-lg bg-muted/50">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Gender</p>
                              <p className="font-bold text-sm uppercase font-mono">{student.gender || "NA"}</p>
                           </div>
                           <div className="p-2 rounded-lg bg-muted/50">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Branch</p>
                              <p className="font-bold text-[10px] truncate uppercase">{student.branch}</p>
                           </div>
                        </div>

                        <div className="w-full mt-6 pt-4 border-t border-border">
                           <div className="flex justify-between items-center mb-4">
                              <h5 className="font-bold text-sm flex items-center gap-2"><Wallet className="w-4 h-4" /> Fees</h5>
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { setSelectedStudent(student); setFeeData({ total_fee: student.total_fee || 100000, paid_fee: student.paid_fee || 0, new_payment: 0 }); setFeeDialogOpen(true); fetchFeeHistory(student.id); }}>
                                <IndianRupee className="w-3 h-3" />
                              </Button>
                           </div>
                           <div className="bg-muted h-2 rounded-full overflow-hidden mb-2">
                             <div className="h-full bg-green-500" style={{width: `${Math.min(100, ((student.paid_fee || 0) / (student.total_fee || 1)) * 100)}%`}} />
                           </div>
                           <div className="flex justify-between text-[10px] font-bold">
                             <span className="text-green-600">Paid: ₹{student.paid_fee?.toLocaleString()}</span>
                             <span className="text-red-600">Due: ₹{student.pending_fee?.toLocaleString()}</span>
                           </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 bg-muted/20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4">
                     <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-muted-foreground/30" />
                     </div>
                     <div className="text-center">
                        <h4 className="font-black italic text-xl uppercase tracking-tighter">No Residents Found</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">We couldn't find any students matching your current filters or search.</p>
                     </div>
                     <Button variant="outline" onClick={() => { setSelectedBranch(""); setSelectedYear(""); setSearchQuery(""); }} className="mt-4 rounded-xl">Clear All Filters</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === "rooms" && (
            <motion.div key="rooms" className="space-y-6">
              <Card className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-bold">Room Management</h2>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">AC: {acRooms.length}</Badge>
                    <Badge variant="outline">Standard: {normalRooms.length}</Badge>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[{ title: "AC Rooms", color: "text-blue-600", rooms: acRooms }, { title: "Standard Rooms", color: "text-orange-600", rooms: normalRooms }].map((block, i) => (
                   <div key={i} className="space-y-4">
                      <h3 className="text-lg font-bold">{block.title}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {block.rooms.map(r => {
                          const occupied = getActualOccupied(r.room_number);
                          return (
                            <Card key={r.id} className="p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex justify-between items-center mb-3">
                                <span className={`text-xl font-bold ${block.color}`}>{r.room_number}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">F{r.floor_number}</span>
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[...Array(r.total_beds)].map((_, i) => (
                                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < occupied ? "bg-primary" : "bg-muted"}`} />
                                ))}
                              </div>
                              <p className="text-[10px] font-bold text-muted-foreground text-center">
                                {occupied} / {r.total_beds} OCCUPIED
                              </p>
                            </Card>
                          );
                        })}
                      </div>
                   </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === "wardens" && (
            <motion.div key="wardens" className="space-y-6">
               <Card className="p-4">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")}><ArrowLeft className="w-5 h-5"/></Button>
                    <h2 className="text-xl font-bold">Warden Management</h2>
                 </div>
               </Card>
               <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                 <WardenApproval />
               </div>
            </motion.div>
          )}

          {activeView === "watchmen" && (
            <motion.div key="watchmen" className="space-y-6">
               <Card className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")}><ArrowLeft className="w-5 h-5"/></Button>
                     <h2 className="text-xl font-bold">Watchman Management</h2>
                  </div>
                  <Button onClick={() => setWatchmanDialogOpen(true)}>Add New Watchman</Button>
               </Card>
               
               <Card className="overflow-hidden">
                 <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Serial No</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Username (ID)</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {watchmen.map((w, idx) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-bold"> {idx + 1} </TableCell>
                          <TableCell className="font-bold">{w.name}</TableCell>
                          <TableCell>{w.username}</TableCell>
                          <TableCell className="font-mono text-xs">{w.password}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteWatchman(w.id)} className="text-red-500">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {watchmen.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50">No Watchmen registered yet</TableCell></TableRow>}
                    </TableBody>
                 </Table>
               </Card>

               <Dialog open={watchmanDialogOpen} onOpenChange={setWatchmanDialogOpen}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Register New Watchman</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                       <div className="space-y-2">
                          <Label>Watchman Name</Label>
                          <Input value={newWatchman.name} onChange={(e) => setNewWatchman({...newWatchman, name: e.target.value})} placeholder="e.g. Ramesh Singh"/>
                       </div>
                       <div className="space-y-2">
                          <Label>Mobile Number</Label>
                          <Input value={newWatchman.mobile_number} onChange={(e) => setNewWatchman({...newWatchman, mobile_number: e.target.value})} placeholder="Mobile..."/>
                       </div>
                       <div className="space-y-2">
                          <Label>Username</Label>
                          <Input value={newWatchman.username} onChange={(e) => setNewWatchman({...newWatchman, username: e.target.value})} placeholder="Unique username"/>
                       </div>
                       <div className="space-y-2">
                          <Label>Password</Label>
                          <Input value={newWatchman.password} onChange={(e) => setNewWatchman({...newWatchman, password: e.target.value})} placeholder="Set password"/>
                       </div>
                       <Button className="w-full h-12 rounded-xl" onClick={handleAddWatchman}>Create Account</Button>
                    </div>
                  </DialogContent>
               </Dialog>
            </motion.div>
          )}

          {activeView === "updates" && (
            <motion.div key="updates" className="space-y-6">
               <Card className="p-4">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")}><ArrowLeft className="w-5 h-5"/></Button>
                    <h2 className="text-xl font-bold">Updates Management</h2>
                 </div>
               </Card>
               <Card className="p-6">
                 <UpdatesManagement authorName={admin?.name || "Admin"} role="admin" />
               </Card>
            </motion.div>
          )}

          {activeView === "appFees" && (
            <motion.div key="appFees" className="space-y-6">
               <Card className="p-6">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")}><ArrowLeft className="w-5 h-5"/></Button>
                      <div>
                        <h2 className="text-xl font-bold">Application Fees</h2>
                        <p className="text-sm text-muted-foreground">{applications.filter(a => a.application_fee_status === "paid").length} Collections Collected</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-1.5 font-bold border-green-500 text-green-600 bg-green-50">Total: ₹{applications.filter(a => a.application_fee_status === "paid").length * 100}</Badge>
                 </div>
               </Card>
               
               <Card className="overflow-hidden">
                 <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                     <TableRow className="border-0">
                       <TableHead className="font-bold uppercase text-[10px] opacity-60">Student Name</TableHead>
                       <TableHead className="font-bold uppercase text-[10px] opacity-60">Booking Details</TableHead>
                       <TableHead className="font-bold uppercase text-[10px] opacity-60">Allotted Room</TableHead>
                       <TableHead className="font-bold uppercase text-[10px] opacity-60">Payment Info</TableHead>
                       <TableHead className="font-bold uppercase text-[10px] opacity-60 text-right">Warden Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {applications
                       .filter(app => app.application_fee_status === "paid")
                       .map((app) => {
                         const matchedStudent = allStudents.find(s => s.roll_number === (app.phone_number || "").toUpperCase().trim() || (s.email && s.email === app.email));
                         return (
                           <TableRow key={app.id}>
                             <TableCell className="py-4">
                               <p className="font-bold">{app.student_name}</p>
                               <p className="text-xs text-muted-foreground uppercase">{app.branch}</p>
                             </TableCell>
                             <TableCell>
                               <p className="text-sm font-semibold">{app.room_type?.toUpperCase()} ROOM</p>
                               <p className="text-xs text-muted-foreground">{app.ac_type === 'ac' ? 'Air Conditioned' : 'Non-AC'}</p>
                             </TableCell>
                             <TableCell>
                               <Badge className={`${matchedStudent?.hostel_room_number ? "bg-blue-500" : "bg-slate-300 dark:bg-[#2C2C2E]"} text-white border-0`}>
                                 {matchedStudent?.hostel_room_number || "PENDING"}
                               </Badge>
                             </TableCell>
                             <TableCell>
                               <p className="text-[10px] font-black uppercase text-green-600">PAID ₹100</p>
                               <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">{app.application_fee_transaction_id}</p>
                             </TableCell>
                             <TableCell className="text-right">
                               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                                 app.status === 'accepted' || app.status === 'approved' ? "bg-green-500/10 text-green-600 border-green-500/20" : 
                                 app.status === 'rejected' ? "bg-red-500/10 text-red-600 border-red-500/20" : 
                                 "bg-amber-500/10 text-amber-600 border-amber-500/20"
                               }`}>
                                 {app.status === 'accepted' || app.status === 'approved' ? "Approved & Paid" : 
                                  app.status === 'rejected' ? "Rejected" : "Pending Decision"}
                               </span>
                             </TableCell>
                           </TableRow>
                         );
                       })}
                     {applications.filter(a => a.application_fee_status === "paid").length === 0 && (
                       <TableRow>
                         <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">No application fee records found</TableCell>
                       </TableRow>
                     )}
                   </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
           )}
          {activeView === "incidents" && (
            <motion.div key="incidents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center bg-red-500/10 p-6 rounded-[2rem] border border-red-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-200">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase">Security Incident Logs</h2>
                    <p className="text-[10px] uppercase font-black tracking-widest text-red-600/70">{incidents.length} Unresolved Alerts Reported</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-red-200 text-red-600 font-bold hover:bg-red-50" onClick={fetchIncidents}>
                  <RefreshCw className="w-4 h-4 mr-2" /> REFRESH
                </Button>
              </div>

              <Card className="overflow-hidden border-none shadow-2xl rounded-[2rem] ring-1 ring-black/5 bg-white">
                <Table>
                  <TableHeader className="bg-neutral-50 border-b border-neutral-100">
                    <TableRow>
                      <TableHead className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Timestamp</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Watchman</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Category</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Narrative</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</TableHead>
                      <TableHead className="py-6 text-right px-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Protocol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <TableCell className="px-6 py-5 font-mono text-[10px] text-neutral-400 font-bold">
                          {new Date(incident.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-black italic text-sm tracking-tight text-neutral-900 uppercase">{incident.watchman_name}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-600 text-white border-none py-1 px-3 text-[9px] font-black tracking-widest rounded-lg">
                            {incident.incident_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[400px] text-sm text-neutral-700 font-bold leading-relaxed italic pr-8">
                          "{incident.description}"
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${incident.status === 'resolved' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                             <span className={`uppercase text-[10px] font-black tracking-widest ${
                                incident.status === 'resolved' ? 'text-emerald-600' : 'text-red-600'
                             }`}>
                               {incident.status}
                             </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          {incident.status === 'pending' ? (
                            <Button 
                              size="sm" 
                              className="bg-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-4 border-b-2 border-neutral-700 shadow-lg active:border-b-0 transition-all" 
                              onClick={async () => {
                                const { error } = await (supabase as any).from("security_incidents").update({ status: "resolved" }).eq("id", incident.id);
                                if (!error) {
                                  toast({ title: "Incident Resolved", description: "The incident has been marked as resolved." });
                                  fetchIncidents();
                                }
                              }}
                            >
                              Resolve Case
                            </Button>
                          ) : (
                            <div className="flex items-center justify-end text-emerald-500 gap-1.5 font-black uppercase text-[10px] tracking-widest italic">
                               <CheckCircle2 className="w-4 h-4" /> RECOVERED
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {incidents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-32">
                           <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-300">
                             <ShieldCheck className="w-8 h-8" />
                           </div>
                           <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">Perimeter Secure • No Incidents Logged</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedStudent && (
            <div className="flex flex-col">
               <DialogHeader>
                  <DialogTitle>{selectedStudent.student_name}</DialogTitle>
                  <DialogDescription>
                    Update fee records for {selectedStudent.roll_number} ({selectedStudent.year})
                  </DialogDescription>
               </DialogHeader>

               <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Total Fee</Label>
                        <Input type="number" value={feeData.total_fee} onChange={(e) => setFeeData({ ...feeData, total_fee: Number(e.target.value) })} />
                     </div>
                     <div className="space-y-2">
                        <Label>New Payment</Label>
                        <Input type="number" value={feeData.new_payment || ""} onChange={(e) => setFeeData({ ...feeData, new_payment: Number(e.target.value) })} placeholder="Amount..." />
                     </div>
                  </div>

                  <div className="p-6 rounded-xl bg-primary text-primary-foreground text-center">
                     <p className="text-xs font-semibold uppercase opacity-90 mb-1">Balance Due</p>
                     <p className="text-3xl font-bold">₹{(feeData.total_fee - feeData.paid_fee - (feeData.new_payment || 0)).toLocaleString()}</p>
                  </div>

                  {feeHistory.length > 0 && (
                    <div className="space-y-2">
                       <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">Payment History</h4>
                       <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {feeHistory.map((tx, idx) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg flex justify-between items-center text-sm">
                               <div>
                                 <p className="font-bold">{tx.remarks || "Fee Payment"}</p>
                                 <p className="text-[10px] text-muted-foreground">{new Date(tx.payment_date).toLocaleDateString()}</p>
                               </div>
                               <p className="font-bold text-green-600">+₹{tx.amount.toLocaleString()}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <Button onClick={handleUpdateFee} className="w-full">Update Records</Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default AdminDashboard;
