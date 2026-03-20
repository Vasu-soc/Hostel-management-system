import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, MessageSquare, Phone, AlertCircle, BookOpen, Pill, Check, Calendar, Clock, ExternalLink, FileText, User, DoorOpen, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LeaveExtensionDialog } from "@/components/LeaveExtensionDialog";
import { getParentSession, clearParentSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";
import PaymentPortal from "@/components/PaymentPortal";

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

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [parent, setParent] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [medicalAlerts, setMedicalAlerts] = useState<any[]>([]);
  const [feeTransactions, setFeeTransactions] = useState<any[]>([]);
  const [attendanceReports, setAttendanceReports] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [branchMarks, setBranchMarks] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [leaveExtensions, setLeaveExtensions] = useState<any[]>([]);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const session = getParentSession();
    if (!session) {
      navigate("/parent-login");
      return;
    }
    setParent(session);
    loadStudentData(session.student_roll_number);
  }, [navigate]);

  const loadStudentData = async (rollNumber: string) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("roll_number", rollNumber)
      .maybeSingle();

    if (!error && data) {
      setStudent(data);
      fetchMedicalAlerts(rollNumber);
      fetchFeeTransactions(data.id);
      fetchAttendanceReports(rollNumber);
      fetchBranchMarks(data.branch, data.year);
      fetchGatePasses(rollNumber);
      fetchLeaveExtensions(rollNumber);
      fetchTodayAttendance(rollNumber);
    }
    setLoading(false);
  };

  const fetchMedicalAlerts = async (rollNumber: string) => {
    const { data, error } = await supabase
      .from("medical_alerts")
      .select("*")
      .eq("roll_number", rollNumber)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Medical alerts fetch failed:", error.message);
      setMedicalAlerts([]);
    } else {
      setMedicalAlerts(data || []);
    }
  };

  const fetchFeeTransactions = async (studentId: string) => {
    console.log(`Parent Dashboard: Fetching transactions for student ${studentId}`);
    const { data, error } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("Parent Dashboard: Fee Transactions Fetch Error:", error.message);
      setFeeTransactions([]);
      return;
    }
    
    console.log(`Parent Dashboard: Fetched ${data?.length || 0} transactions`);
    if (data) {
      setFeeTransactions(data);
    }
  };

  const fetchAttendanceReports = async (rollNumber: string) => {
    const { data, error } = await supabase
      .from("attendance_reports")
      .select("*")
      .eq("roll_number", rollNumber)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAttendanceReports(data);
    }
  };

  const fetchTodayAttendance = async (rollNumber: string) => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('roll_number', rollNumber)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error) throw error;
      setTodayAttendance(data);
    } catch (e) {
      console.error("Parent Dashboard: Today's attendance fetch failure:", e);
    }
  };

  const fetchBranchMarks = async (branch: string, year: string) => {
    if (!branch || !year) return;
    const { data, error } = await supabase
      .from("branch_marks")
      .select("*")
      .eq("branch", branch)
      .eq("year", year)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBranchMarks(data);
    }
  };

  const fetchGatePasses = async (rollNumber: string) => {
    const { data, error } = await supabase
      .from("gate_passes")
      .select("*")
      .eq("roll_number", rollNumber)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setGatePasses(data);
    }
  };

  const fetchLeaveExtensions = async (rollNumber: string) => {
    const { data, error } = await supabase
      .from("leave_extensions")
      .select("*")
      .eq("roll_number", rollNumber)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setLeaveExtensions(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "approved") return <Badge className="bg-success hover:bg-success/90">Approved</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const latestGatePass = gatePasses[0];

  // Real-time subscription for student updates
  useEffect(() => {
    if (!parent) return;

    const channel = supabase
      .channel("parent-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "students",
          filter: `roll_number=eq.${parent.student_roll_number}`,
        },
        (payload) => {
          console.log("Parent Dashboard: Real-time student update detected", payload.new);
          setStudent(payload.new);
          // Refresh transactions when student record changes (total paid might have updated)
          if (payload.new.id) fetchFeeTransactions(payload.new.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medical_alerts",
          filter: `roll_number=eq.${parent.student_roll_number}`,
        },
        () => {
          fetchMedicalAlerts(parent.student_roll_number);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_attendance",
          filter: `roll_number=eq.${parent.student_roll_number}`,
        },
        () => {
          fetchTodayAttendance(parent.student_roll_number);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parent]);

  useEffect(() => {
    if (!student?.id) return;

    const channel = supabase
      .channel(`parent-fee-updates-${student.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fee_transactions",
          filter: `student_id=eq.${student.id}`,
        },
        () => {
          fetchFeeTransactions(student.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student?.id]);

  useEffect(() => {
    if (!parent?.student_roll_number) return;

    const channel = supabase
      .channel("parent-gatepasses-leave")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gate_passes",
          filter: `roll_number=eq.${parent.student_roll_number}`,
        },
        () => {
          fetchGatePasses(parent.student_roll_number);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leave_extensions",
          filter: `roll_number=eq.${parent.student_roll_number}`,
        },
        () => {
          fetchLeaveExtensions(parent.student_roll_number);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parent?.student_roll_number]);

  const handleLogout = () => {
    const parent = getParentSession();
    if (parent) {
      logger.info("parent_logout", parent.mobile_number, "success");
    }
    clearParentSession();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Student data not found</p>
            <Button className="mt-4" onClick={handleLogout}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* College Header */}
      <CollegeHeader />

      {/* Enhanced Top Bar */}
      <DashboardHeader
        title="Parent Home Page"
        titleColor="text-purple-600"
        userName={parent?.parent_name || "Parent"}
        userSubtitle={`Parent of ${student.student_name}`}
        onLogout={handleLogout}
        showPhoto={false}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Features & Quick Actions */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'fees' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:bg-primary/5 hover:border-primary'}`}
                onClick={() => setActiveTab(activeTab === 'fees' ? null : 'fees')}
              >
                <IndianRupee className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm text-foreground">Fee Details</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'history' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:bg-primary/5 hover:border-primary'}`}
                onClick={() => setActiveTab(activeTab === 'history' ? null : 'history')}
              >
                <Clock className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm text-foreground">Payment History</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'portal' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:bg-primary/5 hover:border-primary'}`}
                onClick={() => setActiveTab(activeTab === 'portal' ? null : 'portal')}
              >
                <CreditCard className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm text-foreground">Payment Portal</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'marks' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:bg-primary/5 hover:border-primary'}`}
                onClick={() => setActiveTab(activeTab === 'marks' ? null : 'marks')}
              >
                <FileText className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm text-foreground">Branch Marks</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'remarks' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:bg-primary/5 hover:border-primary'}`}
                onClick={() => setActiveTab(activeTab === 'remarks' ? null : 'remarks')}
              >
                <MessageSquare className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm text-foreground">Remarks & Alerts</span>
              </Button>

              <Button 
                variant="outline" 
                className={`h-24 flex flex-col gap-2 items-center justify-center border-2 transition-all shadow-sm ${activeTab === 'attendance' ? 'border-primary bg-primary/10' : 'border-primary/20 hover:bg-primary/5 hover:border-primary'}`}
                onClick={() => setActiveTab(activeTab === 'attendance' ? null : 'attendance')}
              >
                <User className="w-6 h-6 text-primary" />
                <span className="font-bold text-sm text-foreground">Attendance</span>
              </Button>
            </div>

            {/* Dynamic Feature Content Box */}
            {activeTab && (
              <Card className="border-2 border-primary/30 shadow-md animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {activeTab === 'fees' && <IndianRupee className="w-5 h-5 text-primary" />}
                    {activeTab === 'history' && <Clock className="w-5 h-5 text-primary" />}
                    {activeTab === 'portal' && <CreditCard className="w-5 h-5 text-primary" />}
                    {activeTab === 'marks' && <FileText className="w-5 h-5 text-primary" />}
                    {activeTab === 'remarks' && <MessageSquare className="w-5 h-5 text-primary" />}
                    {activeTab === 'attendance' && <User className="w-5 h-5 text-primary" />}
                    {activeTab === 'fees' ? 'Fees Overview' : 
                     activeTab === 'history' ? 'Payment History' : 
                     activeTab === 'portal' ? 'Payment Portal' : 
                     activeTab === 'marks' ? 'Branch Marks List' :
                     activeTab === 'remarks' ? 'Remarks & Medical Alerts' :
                     'Attendance Reports'}
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
                          <p className="text-xs text-muted-foreground font-medium">Your child's annual dues are fully cleared.</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 border-b border-border/50 text-foreground">
                        <span className="text-sm font-medium">Total Fee</span>
                        <span className="font-bold text-xl tracking-tight">₹{Number(student.total_fee ?? 100000).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50 text-success">
                        <span className="text-sm font-medium">Total Paid (History)</span>
                        <span className="font-bold text-xl tracking-tight">₹{Number(student.paid_fee ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 text-destructive">
                        <span className="text-sm font-medium">Pending Balance</span>
                        <span className="font-bold text-xl tracking-tight">₹{Number(student.pending_fee ?? 100000).toLocaleString()}</span>
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
                                      <p className="font-bold text-sm">₹{tx.amount.toLocaleString()}</p>
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
                        <p className="text-sm text-muted-foreground text-center py-8">No payment records found.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'portal' && <PaymentPortal student={student} />}

                  {activeTab === 'marks' && (
                    <div className="space-y-3">
                      {branchMarks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No branch marks available.</p>
                      ) : (
                        branchMarks.map((mark) => (
                          <div key={mark.id} className="p-3 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm">{mark.title}</span>
                              <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-background">
                                {mark.date}
                              </Badge>
                            </div>
                            <Button variant="link" className="p-0 h-auto text-xs text-primary font-semibold" onClick={() => window.open(mark.file_url, '_blank')}>
                              <ExternalLink className="w-3 h-3 mr-1" /> View PDF
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'remarks' && (
                    <div className="space-y-4">
                      {medicalAlerts.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-destructive flex items-center gap-2 uppercase tracking-widest">
                            <Pill className="w-3 h-3" />
                            Medical History
                          </p>
                          {medicalAlerts.map((alert) => (
                            <div key={alert.id} className={`p-3 border-2 rounded-xl flex flex-col gap-2 ${alert.status === 'resolved' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/10'}`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className={`font-bold capitalize text-xs ${alert.status === 'resolved' ? 'text-success' : 'text-destructive'}`}>
                                    {alert.issue_type}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {new Date(alert.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase ${alert.status === 'resolved' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
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
                          {student.remarks || "No active remarks for your child."}
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
                          <p className="text-sm text-muted-foreground text-center py-8">No attendance reports available.</p>
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
                              <Badge variant={report.status === 'Present' ? 'default' : report.status === 'Absent' ? 'destructive' : 'secondary'} className="text-[10px]">
                                {report.status}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status Panel */}
          <div className="space-y-6 text-foreground">
            {/* Gate Pass Status Section */}
            <Card className="border-2 border-border shadow-md">
              <CardHeader className="text-center border-b border-border py-4 bg-muted/30">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <DoorOpen className="w-5 h-5 text-primary" />
                  Gate Pass Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {latestGatePass ? (
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4 italic">
                       {getStatusBadge(latestGatePass.status as string)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-foreground">
                        <span className="text-muted-foreground">Out Date</span>
                        <span className="font-medium">{latestGatePass.out_date}</span>
                      </div>
                      <div className="flex justify-between text-foreground">
                        <span className="text-muted-foreground">In Date</span>
                        <span className="font-medium">{latestGatePass.in_date}</span>
                      </div>
                      <div className="flex justify-between text-foreground">
                        <span className="text-muted-foreground">Purpose</span>
                        <span className="text-right max-w-[60%] font-medium">{latestGatePass.purpose}</span>
                      </div>
                    </div>

                    {/* Leave Extension Section */}
                    {latestGatePass.status === "approved" && (
                      <div className="pt-4 border-t border-border mt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Leave Extensions</p>
                        {leaveExtensions.filter(ext => ext.gate_pass_id === latestGatePass.id).map(ext => (
                          <div key={ext.id} className="p-3 bg-muted rounded-lg mb-3 border border-border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm text-foreground">Ext: {ext.number_of_days} Days</span>
                              {getStatusBadge(ext.status)}
                            </div>
                            <div className="text-[10px] text-muted-foreground mb-1">
                              {ext.extension_from} to {ext.extension_to}
                            </div>
                            <p className="text-xs italic text-foreground">"{ext.reason}"</p>
                          </div>
                        ))}
                        
                        {leaveExtensions.filter(ext => ext.gate_pass_id === latestGatePass.id && ext.status === 'pending').length === 0 && (
                          <LeaveExtensionDialog 
                            studentId={student.id} 
                            rollNumber={student.roll_number} 
                            gatePassId={latestGatePass.id as string} 
                            onSuccess={() => fetchLeaveExtensions(student.roll_number)} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No gate pass requests yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Student Info Card */}
        <Card className="border-2 border-border mt-6">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-foreground">
              <div>
                <p className="text-muted-foreground">Student Name</p>
                <p className="font-medium">{student.student_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Roll Number</p>
                <p className="font-medium">{student.roll_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Branch</p>
                <p className="font-medium">{student.branch?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Year</p>
                <p className="font-medium">{student.year}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Room Number</p>
                <p className="font-medium">{student.hostel_room_number || "Not Allotted"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Floor</p>
                <p className="font-medium">{student.floor_number || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Validity</p>
                <p className="font-medium">{student.validity_from} - {student.validity_to}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Room Status</p>
                <p className={`font-medium ${student.room_allotted ? "text-success" : "text-warning"}`}>
                  {student.room_allotted ? "Allotted" : "Pending"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
      </main>

      {/* Hostel Rules Dialog */}
      <Dialog open={rulesDialogOpen} onOpenChange={setRulesDialogOpen}>
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
      </Dialog>
    </div>
  );
};

export default ParentDashboard;