import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Bell, Building2, ArrowLeft, User, IndianRupee, Save, UserCheck, AlertTriangle, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import { getAdminSession, clearAdminSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";
import WardenApproval from "@/components/admin/WardenApproval";

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

interface RoomStats {
  room_number: string;
  floor_number: string;
  ac_type: string;
  total_beds: number;
  actualOccupied: number;
  actualPending: number;
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
  const [showStudents, setShowStudents] = useState(false);
  const [showPendingRooms, setShowPendingRooms] = useState(false);
  const [showWardenCredentials, setShowWardenCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fee update dialog
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeData, setFeeData] = useState({
    total_fee: 0,
    paid_fee: 0,
    new_payment: 0,
  });
  const [studentTransactions, setStudentTransactions] = useState<any[]>([]);
  const [isTransitioningYear, setIsTransitioningYear] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      navigate("/admin-login");
      return;
    }
    setAdmin(session);
    fetchRooms();
    fetchAllStudents();

    // Real-time subscriptions
    const channel = supabase
      .channel("admin-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        fetchAllStudents();
        if (selectedBranch && selectedYear) {
          fetchStudentsData(selectedBranch, selectedYear);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, selectedBranch, selectedYear]);

  const fetchAllStudents = async () => {
    const { data, error } = await supabase.from("students").select("*");
    const deletedIds: string[] = []; // Local blocklist not supported on Vercel yet

    if (!error && data) {
      const activeStudents = (data as Student[]).filter(student => !deletedIds.includes(student.id));
      setAllStudents(activeStudents);
    }
  };

  // Calculate actual occupied counts from students
  const getActualOccupied = (roomNumber: string) => {
    return allStudents.filter(s => s.hostel_room_number === roomNumber && s.room_allotted).length;
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase.from("rooms").select("*").order("room_number");
    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }
    setRooms((data || []) as Room[]);
  };

  const fetchStudentsData = async (branch: string, year: string) => {
    // Map display year to stored year format
    const yearMapping: Record<string, string> = {
      "1st Year": "1st Year",
      "2nd Year": "2nd Year",
      "3rd Year": "3rd Year",
      "4th Year": "4th Year",
    };
    const dbYear = yearMapping[year] || year;

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .ilike("branch", branch)
      .eq("year", dbYear);
    const deletedIds: string[] = [];

    if (error) {
      console.error("Error fetching students:", error);
      return;
    }

    const activeStudents = (data as Student[] || []).filter(student => !deletedIds.includes(student.id));
    setStudents(activeStudents);
  };

  const fetchStudents = async () => {
    if (!selectedBranch || !selectedYear) return;

    setIsLoading(true);
    await fetchStudentsData(selectedBranch, selectedYear);
    setShowStudents(true);
    setShowPendingRooms(false);
    setIsLoading(false);
  };

  const handleUpdateFee = async () => {
    if (!selectedStudent) return;

    const pending_fee = feeData.total_fee - (feeData.paid_fee + feeData.new_payment);

    const { error } = await supabase
      .from("students")
      .update({
        total_fee: feeData.total_fee,
        paid_fee: feeData.paid_fee + feeData.new_payment,
        pending_fee: pending_fee,
      })
      .eq("id", selectedStudent.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update fee", variant: "destructive" });
      return;
    }

    if (feeData.new_payment > 0) {
      await supabase.from("fee_transactions").insert({
        student_id: selectedStudent.id,
        amount: feeData.new_payment,
        remarks: `Fee payment added by Admin`,
        academic_year: selectedStudent.year,
      });
    }

    toast({ title: "Success", description: "Fee details updated successfully" });
    setFeeDialogOpen(false);
    setSelectedStudent(null);
    if (selectedBranch && selectedYear) {
      fetchStudentsData(selectedBranch, selectedYear);
    }
  };

  const fetchStudentTransactions = async (studentId: string) => {
    const { data } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: true });
    setStudentTransactions(data || []);
  };

  const handleMoveToNextYear = async () => {
    if (!selectedStudent) return;

    const currentYear = selectedStudent.year;
    const yearNumber = parseInt(currentYear) || 1;
    if (yearNumber >= 4) {
      toast({ title: "Note", description: "Student is already in the final year." });
      return;
    }

    const getYearSuffix = (n: number) => {
      if (n === 1) return "st";
      if (n === 2) return "nd";
      if (n === 3) return "rd";
      return "th";
    };

    const nextYear = `${yearNumber + 1}${getYearSuffix(yearNumber + 1)} Year`;

    if (!confirm(`Are you sure you want to move ${selectedStudent.student_name} to ${nextYear}? This will reset current year's paid fee to 0 and history in this view will be hidden (but saved in database).`)) return;

    setIsTransitioningYear(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          year: nextYear,
          paid_fee: 0,
          pending_fee: 84000,
          total_fee: 84000,
        })
        .eq("id", selectedStudent.id);

      if (error) throw error;

      toast({ title: "Success", description: `Moved to ${nextYear} successfully!` });
      setFeeDialogOpen(false);
      fetchAllStudents();
      if (selectedBranch && selectedYear) {
        fetchStudentsData(selectedBranch, selectedYear);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsTransitioningYear(false);
    }
  };

  const openFeeDialog = (student: Student) => {
    setSelectedStudent(student);
    setFeeData({
      total_fee: student.total_fee || 84000,
      paid_fee: student.paid_fee || 0,
      new_payment: 0,
    });
    setFeeDialogOpen(true);
    fetchStudentTransactions(student.id);
  };

  const handleResetSystem = async () => {
    const confirm1 = confirm("⚠️ CRITICAL WARNING: This will permanently DELETE ALL student records, applications, gate passes, and issue reports. This action CANNOT be undone. Are you absolutely sure?");
    if (!confirm1) return;

    const confirm2 = confirm("FINAL CONFIRMATION: You are about to wipe the entire student database. All registrations will be lost. Proceed?");
    if (!confirm2) return;

    setIsLoading(true);
    try {
      // 1. Fetch all students to forcibly delete them via RPC to bypass any RLS protections
      const { data: existingStudents } = await supabase.from("students").select("id, roll_number");

      if (existingStudents && existingStudents.length > 0) {
        toast({ title: "Working...", description: `Deleting ${existingStudents.length} student records...` });

        await Promise.all(existingStudents.map(student =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).rpc('delete_student_complete', {
            p_student_id: student.id,
            p_roll_number: student.roll_number
          })
        ));
      }

      // 2. Clear remaining Supabase Tables (Order matters for FKs if any)
      const tables = [
        "gate_passes",
        "electrical_issues",
        "food_issues",
        "medical_alerts",
        "parents",
        "hostel_applications",
        // students table is already wiped by the RPC above, but keep it here as a fallback
        "students"
      ];

      for (const table of tables) {
        const { error } = await supabase.from(table as any).delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all
        if (error) console.error(`Error clearing ${table}:`, error);
      }

      // 2. Clear Local JSON files (Not applicable on Vercel)
      try {
        await Promise.all([
          // These are placeholder calls that might fail gracefully or be removed
          supabase.from("food_selections").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        ]);
      } catch (e) {
        console.warn("Local cleanup skipped", e);
      }

      toast({
        title: "System Reset Successful",
        description: "All student data has been wiped. You can now start new registrations.",
      });

      // Refresh data
      fetchAllStudents();
      setStudents([]);
      setShowStudents(false);

      // Update room occupied counts to 0 optimistically
      const { error: roomError } = await supabase.from("rooms").update({ occupied_beds: 0, pending_beds: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");
      if (!roomError) fetchRooms();

    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "An error occurred during system reset",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin-login");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const acRooms = rooms.filter((r) => r.ac_type === "ac");
  const normalRooms = rooms.filter((r) => r.ac_type === "normal");

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* College Header */}
      <CollegeHeader />

      {/* Enhanced Top Bar */}
      <DashboardHeader
        title="Admin Home Page"
        titleColor="text-primary"
        userName={admin.name}
        userSubtitle="Administrator"
        onLogout={handleLogout}
        showPhoto={false}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!showStudents && !showPendingRooms && !showWardenCredentials && (
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="text-xl">Admin Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Choose Branch</label>
                    <Select
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select Branch..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-2 border-border z-50">
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Choose Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select Year..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-2 border-border z-50">
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={fetchStudents}
                    disabled={!selectedBranch || !selectedYear || isLoading}
                    className="h-12"
                  >
                    View Students
                  </Button>
                </div>

                <div className="border-t border-border pt-6 flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPendingRooms(true);
                      setShowStudents(false);
                      setShowWardenCredentials(false);
                    }}
                    className="h-12"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Pending Rooms (AC / Normal)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWardenCredentials(true);
                      setShowStudents(false);
                      setShowPendingRooms(false);
                    }}
                    className="h-12"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Warden Approvals
                  </Button>
                </div>

                {/* Master Reset Section */}
                <div className="pt-8 mt-8 border-t border-destructive/20 bg-destructive/5 -mx-6 px-6 pb-6 rounded-b-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                        Master Data Reset
                      </h3>
                      <p className="text-sm text-destructive/70 mb-4">
                        Wipe all student-related data (registrations, applications, gate passes, fees) to start a completely fresh session. Use with extreme caution.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleResetSystem}
                        disabled={isLoading}
                        className="bg-destructive hover:bg-destructive/90 text-white shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset All Student Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students View */}
        {showStudents && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowStudents(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-foreground">
                {selectedBranch} STUDENTS – {selectedYear} YEAR
              </h2>
            </div>

            {students.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No students found for {selectedBranch} - {selectedYear}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="border-2 border-border hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt={student.student_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{student.student_name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{student.roll_number}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Branch</p>
                          <p className="font-medium">{student.branch?.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Year</p>
                          <p className="font-medium">{student.year}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Gender</p>
                          <p className="font-medium capitalize">{student.gender}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Room</p>
                          <p className={`font-medium ${student.room_allotted ? "text-success" : "text-muted-foreground"}`}>
                            {student.hostel_room_number || "Not Assigned"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Fee Status</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => openFeeDialog(student)}
                          >
                            <IndianRupee className="w-3 h-3 mr-1" />
                            Update
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-medium text-sm">₹{(student.total_fee || 84000).toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-success/10 rounded">
                            <p className="text-xs text-success">Paid</p>
                            <p className="font-medium text-sm text-success">₹{(student.paid_fee || 0).toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-destructive/10 rounded">
                            <p className="text-xs text-destructive">Pending</p>
                            <p className="font-medium text-sm text-destructive">₹{(student.pending_fee || 84000).toLocaleString()}</p>
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

        {/* Pending Rooms View */}
        {showPendingRooms && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowPendingRooms(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-foreground">
                Pending Room Details
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AC Block */}
              <Card className="border-2 border-border">
                <CardHeader className="bg-primary/10 border-b border-border">
                  <CardTitle className="text-lg">AC Block</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Floor</TableHead>
                        <TableHead>Room No</TableHead>
                        <TableHead>Total Beds</TableHead>
                        <TableHead>Total Occupied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acRooms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No AC rooms available
                          </TableCell>
                        </TableRow>
                      ) : (
                        acRooms.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell>{room.floor_number}</TableCell>
                            <TableCell>{room.room_number}</TableCell>
                            <TableCell>{room.total_beds}</TableCell>
                            <TableCell>{getActualOccupied(room.room_number)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Normal Block */}
              <Card className="border-2 border-border">
                <CardHeader className="bg-secondary/10 border-b border-border">
                  <CardTitle className="text-lg">Normal Block</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Floor</TableHead>
                        <TableHead>Room No</TableHead>
                        <TableHead>Total Beds</TableHead>
                        <TableHead>Total Occupied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {normalRooms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No Normal rooms available
                          </TableCell>
                        </TableRow>
                      ) : (
                        normalRooms.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell>{room.floor_number}</TableCell>
                            <TableCell>{room.room_number}</TableCell>
                            <TableCell>{room.total_beds}</TableCell>
                            <TableCell>{getActualOccupied(room.room_number)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Warden Approvals View */}
        {showWardenCredentials && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowWardenCredentials(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-foreground">
                Warden Registration Approvals
              </h2>
            </div>

            <WardenApproval />
          </div>
        )}
      </main>

      {/* Fee Update Dialog */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Update Fee Details
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedStudent.student_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.roll_number}</p>
                </div>
                <Badge variant="outline" className="font-bold text-primary">
                  {selectedStudent.year}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalFee">Total Fee (₹)</Label>
                <Input
                  id="totalFee"
                  type="number"
                  value={feeData.total_fee}
                  onChange={(e) => setFeeData({ ...feeData, total_fee: Number(e.target.value) })}
                  className="h-12 border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Previously Paid (₹)</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {studentTransactions
                    .filter(tx => tx.academic_year === selectedStudent.year)
                    .map((tx, idx) => (
                      <div key={tx.id} className="p-3 bg-background border-2 border-border rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <span className="font-medium text-xs">
                          {idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : `${idx + 1}th`} payment
                        </span>
                        <span className="font-bold text-primary text-sm">₹{tx.amount.toLocaleString()}</span>
                      </div>
                    ))}

                  {studentTransactions.filter(tx => tx.academic_year === selectedStudent.year).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No payments yet for {selectedStudent.year}.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPayment">New Paid Amount (₹)</Label>
                <Input
                  id="newPayment"
                  type="number"
                  value={feeData.new_payment || ""}
                  onChange={(e) => setFeeData({ ...feeData, new_payment: Number(e.target.value) })}
                  placeholder="Enter new payment"
                  className="h-12 border-2"
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border-2 border-border/50">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Calculated Pending Balance</p>
                <p className={`text-3xl font-black ${(feeData.total_fee - (feeData.paid_fee + feeData.new_payment)) > 0 ? "text-destructive" : "text-success"}`}>
                  ₹{(feeData.total_fee - (feeData.paid_fee + feeData.new_payment)).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleUpdateFee} className="flex-[2] h-12 text-lg font-bold shadow-lg" variant="hero">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>

                {(selectedStudent.pending_fee || 84000) <= 0 && (
                  <Button
                    onClick={handleMoveToNextYear}
                    disabled={isTransitioningYear}
                    className="flex-1 h-12 bg-success hover:bg-success/90 text-white shadow-lg"
                    title="Move to Next Academic Year"
                  >
                    {isTransitioningYear ? <Loader2 className="animate-spin" /> : <div className="flex flex-col items-center leading-tight"><span className="text-[10px]">Next</span><span>Year</span></div>}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
