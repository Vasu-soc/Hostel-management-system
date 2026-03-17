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
  ExternalLink
} from "lucide-react";
import { getAdminSession, clearAdminSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";
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

const branches = ["CSE", "MECH", "CIVIL", "AIML", "AIDS", "ECE", "EEE", "DS", "IT"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeView, setActiveView] = useState<"dashboard" | "students" | "rooms" | "wardens" | "updates" | "appFees">("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<any[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeData, setFeeData] = useState({
    total_fee: 0,
    paid_fee: 0,
    new_payment: 0,
  });
  const [feeHistory, setFeeHistory] = useState<any[]>([]);

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

    const channel = supabase
      .channel("admin-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        fetchAllStudents();
        if (selectedBranch && selectedYear) {
          fetchStudentsData(selectedBranch, selectedYear);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hostel_applications" }, fetchApplications)
      .subscribe();

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

  const fetchAllStudents = async () => {
    const { data, error } = await supabase.from("students").select("*");
    if (!error && data) setAllStudents(data as Student[]);
  };

  const getActualOccupied = (roomNumber: string) => {
    return allStudents.filter(s => s.hostel_room_number === roomNumber).length;
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase.from("rooms").select("*").order("room_number");
    if (!error) setRooms((data || []) as Room[]);
  };

  const fetchStudentsData = async (branch: string, year: string) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .ilike("branch", branch)
      .eq("year", year);
    if (!error) setStudents((data as Student[]) || []);
  };

  const fetchStudents = async () => {
    if (!selectedBranch || !selectedYear) return;
    setIsLoading(true);
    await fetchStudentsData(selectedBranch, selectedYear);
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

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin-login");
  };

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-700 overflow-x-hidden">
      <CollegeHeader />
      
      <DashboardHeader
        title="Admin"
        userName={admin?.name || "Admin"}
        userSubtitle={<Badge variant="secondary" className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">Primary Domain</Badge>}
        onLogout={handleLogout}
        showPhoto={false}
      />

      {/* Floating Segmented Control */}
      <div className="sticky top-0 z-30 w-full py-2 px-4 bg-background/50 backdrop-blur-3xl border-b border-black/[0.05] dark:border-white/[0.05] transition-all duration-500">
        <div className="container mx-auto flex justify-center">
          <div className="flex bg-[#EEEEEF] dark:bg-[#1D1D1F] p-1 rounded-[1.25rem] shadow-inner transition-colors">
            {[
              { id: "dashboard", label: "Stats", icon: BarChart3 },
              { id: "students", label: "People", icon: Users },
              { id: "rooms", label: "Rooms", icon: DoorOpen },
              { id: "wardens", label: "Security", icon: ShieldCheck },
              { id: "appFees", label: "Fee Summary", icon: IndianRupee },
              { id: "updates", label: "News", icon: Megaphone }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-[1rem] text-sm font-semibold transition-all duration-500 ${
                  activeView === tab.id 
                  ? "bg-white dark:bg-[#3A3A3C] text-foreground shadow-lg shadow-black/5" 
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeView === tab.id ? "text-primary transition-colors" : ""}`} />
                <span className="hidden sm:inline">{tab.label}</span>
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
              {/* Ultra Clean Insight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Residents", value: stats.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", detail: `${stats.boysCount} Boys · ${stats.girlsCount} Girls` },
                  { label: "Revenue Portfolios", value: `₹${stats.totalCollection.toLocaleString()}`, icon: Wallet, color: "text-green-500", bg: "bg-green-500/10", detail: "Active Collections" },
                  { label: "Occupancy Sync", value: `${stats.occupancyRate}%`, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10", detail: "Capacity Utilization" },
                  { label: "Active Admissions", value: applications.filter(a => a.application_fee_status === "paid").length, icon: IndianRupee, color: "text-purple-500", bg: "bg-purple-500/10", detail: "Registration Fees" }
                ].map((item, idx) => (
                  <Card key={idx} className="group relative rounded-[2rem] border-0 bg-white dark:bg-[#1C1C1E] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold opacity-40 uppercase tracking-tighter bg-transparent border-0">Live Audit</Badge>
                    </div>
                    <p className="text-4xl font-black tracking-tight mb-1">{item.value}</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest mb-2">{item.label}</p>
                    <p className="text-[11px] font-bold text-primary/70">{item.detail}</p>
                  </Card>
                ))}
              </div>

              {/* Branch Wise Distribution */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Branch Wise Ecosystem</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Visualizing {stats.totalStudents} Active Residents</p>
                  </div>
                  <Badge variant="outline" className="rounded-full font-bold px-4 border-primary/20 text-primary">Consolidated Gender Split Audit</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {Object.entries(stats.branchStats).map(([branch, data], idx) => (
                    <motion.div
                      key={branch}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-8 rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] border border-black/[0.02] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform -z-10" />
                      
                      <p className="text-xs font-black text-muted-foreground uppercase opacity-40 group-hover:opacity-100 transition-opacity mb-2 tracking-widest">{branch}</p>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-black">{data.total}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Joined</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter mb-4">
                        <div className="flex items-center gap-1.5 text-blue-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {data.male} Boys
                        </div>
                        <div className="flex items-center gap-1.5 text-pink-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                          {data.female} Girls
                        </div>
                      </div>

                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${data.total > 0 ? (data.male / data.total) * 100 : 0}%` }}
                        />
                        <div 
                          className="h-full bg-pink-500 transition-all duration-1000" 
                          style={{ width: `${data.total > 0 ? (data.female / data.total) * 100 : 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Clean ios Select Module */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-4">
                    <h2 className="text-2xl font-bold">Query Engine</h2>
                  </div>
                  <Card className="rounded-[2.5rem] border-0 bg-white dark:bg-[#1C1C1E] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-none">
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-muted-foreground pl-1">Branch</label>
                              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-0 text-md font-semibold"><SelectValue placeholder="Branch" /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                  {branches.map(b => <SelectItem key={b} value={b} className="rounded-xl font-medium">{b}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-muted-foreground pl-1">Year</label>
                              <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-0 text-md font-semibold"><SelectValue placeholder="Year" /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                  {years.map(y => <SelectItem key={y} value={y} className="rounded-xl font-medium">{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <Button onClick={fetchStudents} disabled={!selectedBranch || !selectedYear || isLoading} className="w-full h-16 rounded-[1.5rem] text-lg font-bold bg-[#0071E3] hover:bg-[#0077ED] transition-all shadow-xl shadow-blue-500/20">
                           {isLoading ? <Loader2 className="animate-spin" /> : "Sync Database"}
                        </Button>
                     </div>
                  </Card>
                </div>

                {/* Maintenance Section */}
                <div className="space-y-6">
                   <h2 className="text-2xl font-bold px-4">Maintenance</h2>
                   <div className="space-y-4">
                      {/* Swipeable like button UI */}
                      <button onClick={handleResetSystem} className="w-full group rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] p-10 flex items-center justify-between shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-none transition-all hover:scale-[1.01]">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-3xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                               <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="text-left">
                               <h4 className="text-xl font-bold">Wipe System Memory</h4>
                               <p className="text-sm text-muted-foreground">Permanent erasure of indices</p>
                            </div>
                         </div>
                         <ChevronRight className="w-6 h-6 text-muted-foreground/30 transition-transform group-hover:translate-x-2" />
                      </button>

                      <div className="rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-none flex items-center gap-6">
                          <div className="w-14 h-14 rounded-3xl bg-orange-500/10 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-orange-500 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">System Status</h4>
                            <p className="text-sm text-muted-foreground">Encryption Level 7 Active</p>
                          </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === "students" && (
            <motion.div key="students" className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#1C1C1E] p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] gap-6">
                <div className="flex items-center gap-6">
                  <button onClick={() => setActiveView("dashboard")} className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:opacity-70 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{selectedBranch} <span className="text-[#0071E3]">{selectedYear}</span></h2>
                    <p className="text-sm text-muted-foreground">{students.length} Records online</p>
                  </div>
                </div>
                <div className="relative w-full md:w-96">
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <Input 
                    placeholder="Search people..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-16 rounded-[1.5rem] bg-[#F5F5F7] dark:bg-[#2C2C2E] border-0 text-lg font-medium shadow-inner"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="rounded-[2.5rem] border-0 bg-white dark:bg-[#1C1C1E] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        {student.photo_url ? (
                          <img src={student.photo_url} className="w-28 h-28 rounded-[2rem] object-cover ring-8 ring-[#F5F5F7] dark:ring-[#2C2C2E]" />
                        ) : (
                          <div className="w-28 h-28 rounded-[2rem] bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center text-muted-foreground"><User className="w-12 h-12" /></div>
                        )}
                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-[1.25rem] bg-white dark:bg-[#1C1C1E] flex items-center justify-center shadow-lg`}>
                           {student.room_allotted ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                        </div>
                      </div>
                      
                      <h4 className="text-2xl font-bold leading-tight tracking-tight">{student.student_name}</h4>
                      <p className="text-sm font-bold text-[#0071E3] mt-2 uppercase tracking-widest">{student.roll_number}</p>

                      <div className="w-full grid grid-cols-2 gap-4 mt-8">
                         <div className="p-4 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Spatial</p>
                            <p className="font-bold text-md">{student.hostel_room_number || "None"}</p>
                         </div>
                         <div className="p-4 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Gender</p>
                            <p className="font-bold text-md uppercase">{student.gender}</p>
                         </div>
                      </div>

                      <div className="w-full mt-10 pt-10 border-t border-black/[0.05] dark:border-white/[0.05]">
                         <div className="flex justify-between items-center mb-6">
                            <h5 className="font-bold flex items-center gap-2"><Wallet className="w-4 h-4" /> Assets</h5>
                            <Button size="icon" variant="ghost" className="rounded-full bg-blue-500/10 text-blue-500 w-10 h-10" onClick={() => { setSelectedStudent(student); setFeeData({ total_fee: student.total_fee || 100000, paid_fee: student.paid_fee || 0, new_payment: 0 }); setFeeDialogOpen(true); fetchFeeHistory(student.id); }}>
                              <IndianRupee className="w-4 h-4" />
                            </Button>
                         </div>
                         <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E] h-3 rounded-full overflow-hidden shadow-inner mb-2"><div className="h-full bg-green-500" style={{width: `${Math.min(100, ((student.paid_fee || 0) / (student.total_fee || 1)) * 100)}%`}} /></div>
                         <div className="flex justify-between text-sm font-bold"><span className="text-green-500">Paid: ₹{student.paid_fee?.toLocaleString()}</span><span className="text-red-500">Due: ₹{student.pending_fee?.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === "rooms" && (
            <motion.div key="rooms" className="space-y-8">
              <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-[1.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveView("dashboard")} className="p-2 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:opacity-70 transition-all"><ArrowLeft className="w-4 h-4"/></button>
                  <h2 className="text-xl font-bold tracking-tight">Spatial Audit</h2>
                </div>
                <div className="flex gap-2">
                  <Badge className="px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 border-0 font-bold text-[10px]">AC: {acRooms.length}</Badge>
                  <Badge className="px-4 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 border-0 font-bold text-[10px]">Standard: {normalRooms.length}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[{ title: "Atmosphere Plus (AC)", color: "text-blue-500", rooms: acRooms, bg: "bg-blue-500/5" }, { title: "Standard Configuration", color: "text-orange-500", rooms: normalRooms, bg: "bg-orange-500/5" }].map((block, i) => (
                   <div key={i} className="space-y-6">
                      <div className="flex items-center justify-between px-4">
                        <h3 className="text-xl font-black uppercase tracking-tight">{block.title}</h3>
                        <Badge variant="secondary" className="rounded-full font-bold">{block.rooms.length} Units</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {block.rooms.map(r => {
                          const occupied = getActualOccupied(r.room_number);
                          return (
                            <div key={r.id} className="p-6 rounded-[2rem] bg-white dark:bg-[#1C1C1E] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-black/[0.02]">
                              <div className="flex justify-between items-start mb-4">
                                <span className={`text-2xl font-black ${block.color}`}>{r.room_number}</span>
                                <span className="text-[10px] font-bold text-muted-foreground opacity-60">F{r.floor_number}</span>
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[...Array(r.total_beds)].map((_, i) => (
                                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < occupied ? "bg-primary" : "bg-muted"}`} />
                                ))}
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                {occupied} / {r.total_beds} Occupied
                              </p>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === "wardens" && (
            <motion.div key="wardens" className="space-y-10">
               <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] flex items-center gap-6">
                  <button onClick={() => setActiveView("dashboard")} className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:opacity-70 transition-all"><ArrowLeft/></button>
                  <h2 className="text-3xl font-bold tracking-tight">Security Domain</h2>
               </div>
               <div className="bg-white/50 dark:bg-black/50 backdrop-blur-3xl rounded-[2.5rem] border border-black/[0.05] p-2 shadow-2xl overflow-hidden"><WardenApproval /></div>
            </motion.div>
          )}

          {activeView === "updates" && (
            <motion.div key="updates" className="space-y-10">
               <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] flex items-center gap-6">
                  <button onClick={() => setActiveView("dashboard")} className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:opacity-70 transition-all"><ArrowLeft/></button>
                  <h2 className="text-3xl font-bold tracking-tight">Newsroom</h2>
               </div>
               <div className="bg-white dark:bg-[#1C1C1E] rounded-[3rem] p-10 shadow-2xl border border-black/[0.02]"><UpdatesManagement authorName={admin?.name || "Admin"} role="admin" /></div>
            </motion.div>
          )}

          {activeView === "appFees" && (
            <motion.div key="appFees" className="space-y-10">
               <div className="bg-white dark:bg-[#1C1C1E] p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button onClick={() => setActiveView("dashboard")} className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] hover:opacity-70 transition-all"><ArrowLeft/></button>
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Application Fee Summary</h2>
                      <p className="text-sm text-muted-foreground">{applications.filter(a => a.application_fee_status === "paid").length} Total Payments Collected (₹100 Each)</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-0 px-6 py-2 rounded-full font-bold">Total: ₹{applications.filter(a => a.application_fee_status === "paid").length * 100}</Badge>
               </div>
               
               <div className="bg-white dark:bg-[#1C1C1E] rounded-[3rem] p-10 shadow-2xl border border-black/[0.02] overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-[#F5F5F7] dark:bg-[#2C2C2E] border-0 rounded-2xl">
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
                           <TableRow key={app.id} className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                             <TableCell className="py-6">
                               <p className="font-bold text-lg">{app.student_name}</p>
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
            </motion.div>
           )}
        </AnimatePresence>
      </main>

      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border-0 rounded-[3rem] p-0 overflow-hidden shadow-2xl">
          {selectedStudent && (
            <div className="flex flex-col">
               <DialogHeader className="p-10 pb-0 flex-row justify-between items-start space-y-0">
                  <div>
                    <DialogTitle className="text-3xl font-bold tracking-tight">{selectedStudent.student_name}</DialogTitle>
                    <DialogDescription className="text-sm font-bold text-[#0071E3] mt-1 uppercase tracking-widest font-mono">
                      {selectedStudent.roll_number}
                    </DialogDescription>
                  </div>
                  <Badge className="rounded-full px-6 py-2 bg-[#F5F5F7] dark:bg-[#323235] text-foreground border-0 font-bold">{selectedStudent.year}</Badge>
               </DialogHeader>

               <div className="p-10 space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase pl-2">Asset Base</label>
                        <Input type="number" value={feeData.total_fee} onChange={(e) => setFeeData({ ...feeData, total_fee: Number(e.target.value) })} className="h-16 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-0 text-xl font-bold shadow-inner" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase pl-2">Deposit Sync</label>
                        <Input type="number" value={feeData.new_payment || ""} onChange={(e) => setFeeData({ ...feeData, new_payment: Number(e.target.value) })} placeholder="Amount..." className="h-16 rounded-3xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-0 text-xl font-bold shadow-inner" />
                     </div>
                  </div>

                  <div className="p-10 rounded-[2.5rem] bg-[#0071E3] text-white flex flex-col items-center shadow-xl shadow-blue-500/30">
                     <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Portfolio Deficit</p>
                     <p className="text-6xl font-bold tracking-tighter">₹{(feeData.total_fee - feeData.paid_fee - (feeData.new_payment || 0)).toLocaleString()}</p>
                  </div>

                  {feeHistory.length > 0 && (
                    <div className="space-y-4">
                       <h4 className="text-sm font-bold opacity-60 px-2 flex items-center gap-2">History <Info className="w-3 h-3" /></h4>
                       <div className="max-h-56 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                          {feeHistory.map((tx, idx) => (
                            <div key={idx} className="p-5 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[1.5rem] flex justify-between items-center transition-all hover:bg-slate-100">
                               <div><p className="font-bold text-md">{tx.remarks || "Log Entry"}</p><p className="text-[10px] text-muted-foreground mt-0.5">{new Date(tx.payment_date).toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                               <p className="font-bold text-green-500">+₹{tx.amount.toLocaleString()}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <Button onClick={handleUpdateFee} className="w-full h-20 rounded-[2rem] text-xl font-bold bg-[#0071E3] hover:bg-[#0077ED] shadow-2xl shadow-blue-500/30">Commit Synchrony</Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
