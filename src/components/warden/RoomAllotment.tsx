import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Check, Home, Users, IndianRupee, MessageSquare, User, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { localApi } from "@/lib/localStudentApi";

interface Room {
  id: string;
  room_number: string;
  floor_number: string;
  room_type: string;
  ac_type: string;
  total_beds: number;
  occupied_beds: number;
  pending_beds: number;
  closed_beds?: number;
}

interface Student {
  id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  year: string;
  gender: string;
  room_allotted: boolean;
  hostel_room_number?: string;
  floor_number?: string;
  total_fee?: number;
  paid_fee?: number;
  pending_fee?: number;
  remarks?: string;
  photo_url?: string;
}

interface RoomAllotmentProps {
  rooms: Room[];
  pendingStudents: Student[];
  allStudents?: Student[];
  onRefresh: () => void;
}

const RoomAllotment = ({ rooms, pendingStudents, allStudents = [], onRefresh }: RoomAllotmentProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [allottedStudents, setAllottedStudents] = useState<Student[]>([]);

  // Dialog states
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [studentTransactions, setStudentTransactions] = useState<any[]>([]);
  const [isTransitioningYear, setIsTransitioningYear] = useState(false);

  // Memoize room student counts from allStudents prop
  const roomStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allStudents.forEach(s => {
      if (s.hostel_room_number) {
        counts[s.hostel_room_number] = (counts[s.hostel_room_number] || 0) + 1;
      }
    });
    return counts;
  }, [allStudents]);

  const filteredRooms = rooms.filter((r) =>
    r.room_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate actual occupied beds from student count (source of truth)
  const getActualOccupiedBeds = (room: Room) => {
    return roomStudentCounts[room.room_number] || 0;
  };

  const getAvailableBeds = (room: Room) => {
    const closedBeds = room.closed_beds || 0;
    const actualOccupied = getActualOccupiedBeds(room);
    return Math.max(0, room.total_beds - actualOccupied - closedBeds);
  };

  // Load students allotted to selected room locally from allStudents
  useEffect(() => {
    if (!selectedRoom) {
      setAllottedStudents([]);
      return;
    }

    const roomDetails = allStudents.filter(
      (s) => s.hostel_room_number === selectedRoom.room_number && s.room_allotted
    );

    // Deduplicate by student id just in case
    const uniqueStudents = roomDetails.filter((student, index, self) =>
      index === self.findIndex((s) => s.id === student.id)
    );
    setAllottedStudents(uniqueStudents);
  }, [selectedRoom, allStudents]);

  const handleApproveStudent = async (student: Student, room: Room) => {

    const { error: studentError } = await supabase
      .from("students")
      .update({
        hostel_room_number: room.room_number,
        floor_number: room.floor_number,
        room_allotted: true,
      })
      .eq("id", student.id);

    if (studentError) {
      toast({ title: "Error", description: "Failed to assign room", variant: "destructive" });
      return;
    }

    // Get actual count of students in this room after approval (including blocked/pending)
    const { data: studentsInRoom } = await supabase
      .from("students")
      .select("id")
      .eq("hostel_room_number", room.room_number);

    const actualOccupied = studentsInRoom?.length || 0;

    const { error: roomError } = await supabase
      .from("rooms")
      .update({
        occupied_beds: actualOccupied,
      })
      .eq("id", room.id);

    if (roomError) {
      toast({ title: "Error", description: "Failed to update room", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `${student.student_name} assigned to room ${room.room_number}` });
    onRefresh();
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to permanently delete ${student.student_name}? This cannot be undone.`)) return;

    try {
      // First try the local file API (no database, no RLS, always works)
      const localResult = await localApi.deleteStudent(student.id);

      if (localResult.success) {
        toast({ title: "Deleted", description: `${student.student_name} permanently removed.` });
        onRefresh();
        return;
      }

      // If not in local storage, fall back to Supabase
      // Delete related records first
      const rollNumber = student.roll_number.toUpperCase().trim();
      await Promise.all([
        supabase.from("gate_passes").delete().eq("roll_number", rollNumber),
        supabase.from("gate_passes").delete().eq("student_id", student.id),
        supabase.from("electrical_issues").delete().eq("roll_number", rollNumber),
        supabase.from("electrical_issues").delete().eq("student_id", student.id),
        supabase.from("food_issues").delete().eq("roll_number", rollNumber),
        supabase.from("food_issues").delete().eq("student_id", student.id),
        supabase.from("medical_alerts").delete().eq("roll_number", rollNumber),
        supabase.from("medical_alerts").delete().eq("student_id", student.id),
        supabase.from("parents").delete().eq("student_roll_number", rollNumber),
        supabase.from("password_reset_tokens").delete().eq("user_identifier", rollNumber),
      ]);

      const { data: deletedData, error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id)
        .select();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      if (!deletedData || deletedData.length === 0) {
        toast({
          title: "Blocked by Database",
          description: "Supabase RLS is blocking this delete. Go to Supabase → Authentication → Policies → students table → Add DELETE policy with USING (true).",
          variant: "destructive",
        });
        return;
      }

      // Sync room count
      if (student.hostel_room_number) {
        const { data: inRoom } = await supabase.from("students").select("id").eq("hostel_room_number", student.hostel_room_number);
        const { data: room } = await supabase.from("rooms").select("id").eq("room_number", student.hostel_room_number).maybeSingle();
        if (room) await supabase.from("rooms").update({ occupied_beds: inRoom?.length || 0 }).eq("id", room.id);
      }

      toast({ title: "Deleted", description: `${student.student_name} permanently removed.` });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: "Unexpected error during deletion", variant: "destructive" });
    }
  };

  const handleFeeUpdate = async () => {
    if (!selectedStudent) return;

    const newPayment = parseFloat(paidAmount) || 0;
    const currentTotalFee = parseFloat(totalAmount) || selectedStudent.total_fee || 100000;

    const oldPaid = selectedStudent.paid_fee || 0;
    const newTotalPaid = oldPaid + newPayment;
    const newPending = Math.max(0, currentTotalFee - newTotalPaid);

    const { error } = await supabase
      .from("students")
      .update({
        paid_fee: newTotalPaid,
        pending_fee: newPending,
        total_fee: currentTotalFee,
      })
      .eq("id", selectedStudent.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update fee details", variant: "destructive" });
      return;
    }

    if (newPayment > 0) {
      await supabase.from("fee_transactions").insert({
        student_id: selectedStudent.id,
        amount: newPayment,
        remarks: `Fee payment added by warden`,
        academic_year: selectedStudent.year,
      });
    }

    toast({ title: "Success", description: newPending <= 0 ? "Year Fees Completed!" : "Fee details updated successfully" });

    // If pending is 0, we'll keep the dialog open but transition will happen on re-open or if they click Move to Next Year.
    // However, user wants it automatic. Let's trigger it if pending is 0.
    if (newPending <= 0) {
      // We'll let the user see the "0" balance first, then they close or re-open.
      // The user said: "automatically if the total hostel payment is complete ... after open again that fees updation he move on the 2nd year."
      // So I will implement the check in openFeeDialog.
    }

    setShowFeeDialog(false);
    setSelectedStudent(null);
    setPaidAmount("");
    setPendingAmount("");

    onRefresh();
  };

  const handleRemarksUpdate = async () => {
    if (!selectedStudent) return;

    const { error } = await supabase
      .from("students")
      .update({ remarks } as any)
      .eq("id", selectedStudent.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save remarks", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Remarks saved successfully" });
    setShowRemarksDialog(false);
    setRemarks("");
    setSelectedStudent(null);

    // Refresh everything
    onRefresh();
  };

  const fetchStudentTransactions = async (studentId: string) => {
    const { data } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: true });
    setStudentTransactions(data || []);
  };

  const openFeeDialog = async (student: Student) => {
    // Check if year is already completed - if so, auto-transition when opening
    if (student.paid_fee && student.total_fee && student.paid_fee >= student.total_fee && student.pending_fee === 0) {
      const yearNumber = parseInt(student.year) || 1;
      if (yearNumber < 4) {
        setSelectedStudent(student);
        // We delay the auto-transition slightly to allow state to settle
        setTimeout(() => {
          handleMoveToNextYear(true);
        }, 100);
        return;
      }
    }

    setSelectedStudent(student);
    const total = student.total_fee || 100000;
    const oldPaid = student.paid_fee || 0;
    setTotalAmount(total.toString());
    setPaidAmount("");
    setPendingAmount(Math.max(0, total - oldPaid).toString());
    setShowFeeDialog(true);
    fetchStudentTransactions(student.id);
  };

  const handleMoveToNextYear = async (skipConfirm = false) => {
    if (!selectedStudent) return;

    const currentYear = selectedStudent.year;
    const yearNumber = parseInt(currentYear) || 1;
    if (yearNumber >= 4) {
      toast({ title: "Note", description: "Student is already in the final year." });
      return;
    }

    const nextYear = `${yearNumber + 1}${getYearSuffix(yearNumber + 1)} Year`;

    if (!skipConfirm && !confirm(`Are you sure you want to move ${selectedStudent.student_name} to ${nextYear}? This will reset current year's paid fee to 0 and history in this view will be hidden (but saved in database).`)) return;

    setIsTransitioningYear(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          year: nextYear,
          paid_fee: 0,
          pending_fee: selectedStudent.total_fee || 100000,
          total_fee: selectedStudent.total_fee || 100000,
        })
        .eq("id", selectedStudent.id);

      if (error) throw error;

      toast({ title: "Success", description: `Moved to ${nextYear} successfully!` });
      setShowFeeDialog(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsTransitioningYear(false);
    }
  };

  const getYearSuffix = (n: number) => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
  };

  const openRemarksDialog = (student: Student) => {
    setSelectedStudent(student);
    setRemarks(student.remarks || "");
    setShowRemarksDialog(true);
  };

  const getRoomTypeName = (type: string) => {
    const types: Record<string, string> = {
      single: "Single Bed",
      double: "Double Bed",
      three: "Three Bed",
      four: "Four Bed",
      six: "Six Bed",
    };
    return types[type] || type;
  };

  // Filter pending students - only show students who registered for THIS specific room
  const filteredPendingStudents = pendingStudents.filter((s) => {
    if (!selectedRoom) return false;
    // Only show students who:
    // 1. Are not yet allotted
    // 2. Registered for this specific room number
    return !s.room_allotted && s.hostel_room_number === selectedRoom.room_number;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by Room Number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Available Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-auto pr-2">
            {filteredRooms.length === 0 ? (
              <Card className="col-span-full border-2 border-dashed border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No rooms found</p>
                </CardContent>
              </Card>
            ) : (
              filteredRooms.map((room) => (
                <Card
                  key={room.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedRoom?.id === room.id
                    ? "border-2 border-primary"
                    : "border-2 border-border hover:border-primary/30"
                    }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <CardHeader className="pb-2 relative">
                    {pendingStudents.filter(s => !s.room_allotted && s.hostel_room_number === room.room_number).length > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-destructive text-white h-6 w-6 rounded-full flex items-center justify-center p-0 shadow-lg border-2 border-background animate-pulse">
                        {pendingStudents.filter(s => !s.room_allotted && s.hostel_room_number === room.room_number).length}
                      </Badge>
                    )}
                    <div className="flex items-center justify-between pr-4">
                      <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                      <Badge variant={room.ac_type === "ac" ? "default" : "secondary"}>
                        {room.ac_type === "ac" ? "AC" : "Non-AC"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Floor {room.floor_number}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 bg-secondary/10 rounded">
                        <p className="font-bold text-foreground">{room.total_beds}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-2 bg-success/10 rounded">
                        <p className="font-bold text-success">{getActualOccupiedBeds(room)}</p>
                        <p className="text-xs text-muted-foreground">Occupied</p>
                      </div>
                      <div className="p-2 bg-primary/10 rounded">
                        <p className="font-bold text-primary">{getAvailableBeds(room)}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{getRoomTypeName(room.room_type)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Selected Room Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {selectedRoom ? `Room ${selectedRoom.room_number}` : "Select a Room"}
          </h3>

          {!selectedRoom ? (
            <div className="space-y-4">
              <Card className="border-2 border-dashed border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a room from the left to assign students</p>
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="space-y-4">
              {/* Allotted Students */}
              {allottedStudents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Allotted Students</h4>
                  {allottedStudents.map((student) => (
                    <Card key={student.id} className="border-2 border-success/20 bg-success/5">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {student.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt={student.student_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-primary cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowPhotoDialog(true);
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{student.student_name}</p>
                              <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                              <p className="text-xs text-muted-foreground">{student.year}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 -mt-1"
                            onClick={() => handleDeleteStudent(student)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openFeeDialog(student)}
                          >
                            <IndianRupee className="w-4 h-4 mr-1" />
                            Student Fees Updation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openRemarksDialog(student)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Remarks
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pending Students */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Pending Students</h4>
                <div className="max-h-[400px] overflow-auto pr-2 space-y-3">
                  {filteredPendingStudents.length === 0 ? (
                    <Card className="border-2 border-dashed border-border">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending students</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredPendingStudents.map((student) => (
                      <Card key={student.id} className="border border-border">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{student.student_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.roll_number} • {student.year} • {student.branch.toUpperCase()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveStudent(student, selectedRoom)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteStudent(student)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Details Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Student Fees Updation - {selectedStudent?.student_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <div>
                <p className="text-muted-foreground">Student Name</p>
                <p className="font-medium">{selectedStudent?.student_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Roll Number</p>
                <p className="font-medium">{selectedStudent?.roll_number}</p>
                <p className="text-xs font-bold text-primary">{selectedStudent?.year}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Fee (₹)</Label>
              <Input
                id="totalAmount"
                type="number"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(e.target.value);
                  const total = parseFloat(e.target.value) || 0;
                  const paid = parseFloat(paidAmount) || 0;
                  const oldPaid = selectedStudent?.paid_fee || 0;
                  setPendingAmount((total - oldPaid - paid).toString());
                }}
                placeholder="Total fee amount"
                className="h-12 bg-background border-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Previously Paid (₹)</Label>
              <div className="space-y-2">
                {studentTransactions
                  .filter(tx => tx.academic_year === selectedStudent?.year)
                  .map((tx, idx) => (
                    <div key={tx.id} className="p-3 bg-background border-2 border-border rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                      <span className="font-medium text-sm">
                        {idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : `${idx + 1}th`} payment
                      </span>
                      <span className="font-bold text-primary">₹{tx.amount.toLocaleString()}</span>
                    </div>
                  ))}

                {studentTransactions.filter(tx => tx.academic_year === selectedStudent?.year).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No payments yet for this year.</p>
                )}

                {studentTransactions.filter(tx => tx.academic_year === selectedStudent?.year).length > 3 && (
                  <div className="p-2 text-center">
                    <Button variant="link" size="sm" className="text-xs">More payments...</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">New Paid Amount (₹)</Label>
              <Input
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  const newPayment = parseFloat(e.target.value) || 0;
                  const total = parseFloat(totalAmount) || 0;
                  const oldPaid = selectedStudent?.paid_fee || 0;
                  setPendingAmount((total - oldPaid - newPayment).toString());
                }}
                placeholder="Enter new payment added"
                className="h-12 border-2"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border-2 border-border/50">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Calculated Pending Balance</p>
              <p className={`text-3xl font-black ${parseFloat(pendingAmount) > 0 ? "text-destructive" : "text-success"}`}>
                ₹{Number(pendingAmount).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              {parseFloat(pendingAmount) > 0 ? (
                <Button
                  onClick={handleFeeUpdate}
                  className="flex-[2] h-12 text-lg font-bold shadow-lg"
                  variant="hero"
                >
                  Update Fee Details
                </Button>
              ) : (
                <div className="flex-[2] p-3 bg-success/10 border-2 border-success/30 rounded-lg text-center font-bold text-success animate-in zoom-in">
                  Year Fees Completed!
                </div>
              )}

              {selectedStudent && (selectedStudent.pending_fee || 100000) <= 0 && (
                <Button
                  onClick={handleMoveToNextYear}
                  disabled={isTransitioningYear}
                  className="flex-1 h-12 bg-success hover:bg-success/90 text-white shadow-lg"
                >
                  {isTransitioningYear ? <Loader2 className="animate-spin" /> : "Move to Next Year"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={showRemarksDialog} onOpenChange={setShowRemarksDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Remarks - {selectedStudent?.student_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="remarks">Add Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks..."
                rows={4}
              />
            </div>
            <Button onClick={handleRemarksUpdate} className="w-full">
              Save Remarks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Zoom Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md p-2 bg-card">
          <DialogHeader>
            <DialogTitle className="text-center">{selectedStudent?.student_name}</DialogTitle>
          </DialogHeader>
          {selectedStudent?.photo_url && (
            <img
              src={selectedStudent.photo_url}
              alt={selectedStudent.student_name}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}
          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>{selectedStudent?.roll_number} • {selectedStudent?.year}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomAllotment;