import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IndianRupee, MessageSquare, Phone, AlertCircle, BookOpen, Pill, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getParentSession, clearParentSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";
import CollegeHeader from "@/components/CollegeHeader";

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
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

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
    const { data, error } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setFeeTransactions(data);
    }
  };

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
          setStudent(payload.new);
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
          // Refresh medical alerts whenever they're added or updated
          fetchMedicalAlerts(parent.student_roll_number);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fee_transactions",
          filter: `student_id=eq.${student?.id}`,
        },
        () => {
          if (student?.id) fetchFeeTransactions(student.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parent]);

  const handleLogout = () => {
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

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column wrapper */}
          <div className="space-y-6">
            {/* Fee Details - Left Panel */}
            <Card className="border-2 border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  Fee Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{Number(student.total_fee || 84000).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-sm text-muted-foreground mb-1">Total Paid (History)</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{Number(student.paid_fee || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-muted-foreground mb-1">Pending Amount</p>
                  <p className="text-2xl font-bold text-destructive">
                    ₹{Number(student.pending_fee || 84000).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fee Transactions - Under Fee Details */}
            {feeTransactions.length > 0 && (
              <Card className="border-2 border-border mt-6">
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
          </div>

          {/* Remarks - Right Panel */}
          <Card className="border-2 border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Remarks & Medical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Medical Alerts Section */}
              {medicalAlerts.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-destructive flex items-center gap-2 uppercase tracking-wider">
                    <Pill className="w-4 h-4" />
                    Medical History
                  </p>
                  {medicalAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 border rounded-lg flex flex-col gap-2 ${alert.status === 'resolved' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/10'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-bold capitalize ${alert.status === 'resolved' ? 'text-success' : 'text-destructive'}`}>
                            {alert.issue_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${alert.status === 'resolved' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                          {alert.status || 'pending'}
                        </span>
                      </div>

                      {alert.status === 'resolved' && (
                        <div className="p-2 mt-1 bg-success/10 rounded-md border border-success/20">
                          <p className="text-sm font-medium text-success flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Your {student.gender === 'girl' || student.gender === 'female' ? 'daughter\'s' : student.gender === 'boy' || student.gender === 'male' ? 'son\'s' : 'son or daughter\'s'} problem is solved. Your kid is good!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="h-px bg-border my-4"></div>
                </div>
              )}

              {student.remarks ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Warden's Remarks</p>
                    <p className="text-foreground whitespace-pre-wrap">{student.remarks}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  {!medicalAlerts.length && (
                    <>
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No remarks or alerts available</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Student Info Card */}
        <Card className="border-2 border-border mt-6">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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