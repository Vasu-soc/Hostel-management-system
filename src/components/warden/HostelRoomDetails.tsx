import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Trash2, IndianRupee, MessageSquare, User, Building2, ChevronRight, Bed, X, Check } from "lucide-react";
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
  hostel_room_number: string | null;
  floor_number: string | null;
  room_allotted: boolean;
  total_fee: number;
  paid_fee: number;
  pending_fee: number;
  remarks?: string;
}

interface HostelRoomDetailsProps {
  students: Student[];
  onRefresh: () => void;
  wardenType?: string; // "boys" | "girls" | undefined
}

const HostelRoomDetails = ({ students, onRefresh, wardenType }: HostelRoomDetailsProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);

  // Navigation state
  const [selectedBlockType, setSelectedBlockType] = useState<"ac" | "normal" | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Dialog states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [totalFeeAmount, setTotalFeeAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [feeTransactions, setFeeTransactions] = useState<any[]>([]);

  // Bed control state
  const [bedStatuses, setBedStatuses] = useState<boolean[]>([]);

  useEffect(() => {
    loadRooms();
  }, [wardenType]);

  useEffect(() => {
    if (selectedRoom) {
      // Initialize bed statuses: true = available, false = closed
      const closedBeds = selectedRoom.closed_beds || 0;
      const statuses = Array(selectedRoom.total_beds).fill(true);
      for (let i = 0; i < closedBeds; i++) {
        statuses[selectedRoom.total_beds - 1 - i] = false;
      }
      setBedStatuses(statuses);
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    let query = supabase.from("rooms").select("*").order("room_number");

    // Filter rooms by hostel type so each warden only sees their own hostel rooms
    if (wardenType === "girls") {
      query = query.or("room_number.ilike.GA%,room_number.ilike.GN%");
    } else if (wardenType === "boys") {
      // Boys rooms start with A or N but NOT GA or GN
      query = query.or("room_number.ilike.A%,room_number.ilike.N%");
    }

    const { data, error } = await query;

    if (!error && data) {
      let filtered = data;
      if (wardenType === "boys") {
        // Extra safety: exclude any accidentally matched GA/GN rooms
        filtered = data.filter(
          (r: Room) => !r.room_number.startsWith("GA") && !r.room_number.startsWith("GN")
        );
      }
      setRooms(filtered);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to permanently delete ${student.student_name}? This cannot be undone.`)) return;

    try {
      // First try the local file API (no database, no RLS, always works)
      const localResult = await localApi.deleteStudent(student.id);

      if (localResult.success) {
        toast({ title: "Deleted", description: `${student.student_name} permanently removed.` });
        onRefresh();
        loadRooms();
        return;
      }

      // If not in local storage, fall back to Supabase with cascade delete
      const rollNumber = student.roll_number.toUpperCase().trim();
      const roomNumber = student.hostel_room_number;

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

      // Sync room occupancy
      if (roomNumber) {
        const { data: inRoom } = await supabase.from("students").select("id").eq("hostel_room_number", roomNumber).eq("room_allotted", true);
        const { data: room } = await supabase.from("rooms").select("id").eq("room_number", roomNumber).maybeSingle();
        if (room) await supabase.from("rooms").update({ occupied_beds: inRoom?.length || 0 }).eq("id", room.id);
      }

      toast({ title: "Deleted", description: `${student.student_name} permanently removed.` });
      onRefresh();
      loadRooms();
    } catch (err: any) {
      toast({ title: "Error", description: "Unexpected error during deletion", variant: "destructive" });
    }
  };

  const handleFeeUpdate = async () => {
    if (!selectedStudent) return;

    const newPayment = parseFloat(newPaymentAmount) || 0;
    const currentTotalFee = parseFloat(totalFeeAmount) || selectedStudent.total_fee || 0;

    const oldPaid = selectedStudent.paid_fee || 0;
    const newTotalPaid = oldPaid + newPayment;
    const newPending = currentTotalFee - newTotalPaid;

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
      });
    }

    toast({ title: "Success", description: "Fee details updated successfully" });
    setShowFeeDialog(false);
    setSelectedStudent(null);
    setNewPaymentAmount("");
    setTotalFeeAmount("");
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
    onRefresh();
  };

  const handleBedToggle = async (index: number) => {
    if (!selectedRoom) return;

    const newStatuses = [...bedStatuses];
    newStatuses[index] = !newStatuses[index];
    setBedStatuses(newStatuses);

    const closedCount = newStatuses.filter(s => !s).length;

    const { error } = await supabase
      .from("rooms")
      .update({ closed_beds: closedCount } as any)
      .eq("id", selectedRoom.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update bed status", variant: "destructive" });
      return;
    }

    setSelectedRoom({ ...selectedRoom, closed_beds: closedCount });
    loadRooms();
    onRefresh();
    toast({ title: "Success", description: `Bed ${index + 1} ${newStatuses[index] ? "opened" : "closed"}` });
  };

  const openFeeDialog = async (student: Student) => {
    setSelectedStudent(student);
    setTotalFeeAmount(student.total_fee?.toString() || "");
    setNewPaymentAmount("");
    setShowFeeDialog(true);

    // Fetch fee history
    const { data } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("student_id", student.id)
      .order("payment_date", { ascending: false });

    if (data) setFeeTransactions(data);
  };

  const openRemarksDialog = (student: Student) => {
    setSelectedStudent(student);
    setRemarks(student.remarks || "");
    setShowRemarksDialog(true);
  };

  const floors = ["1", "2", "3"];

  const getFloorRooms = (floor: string, blockType: "ac" | "normal") => {
    return rooms.filter(r => r.floor_number === floor && r.ac_type === blockType);
  };

  // Get actual occupied beds from students in room (source of truth)
  const getRoomOccupiedBeds = (roomNumber: string) => {
    return students.filter(s => s.hostel_room_number === roomNumber && s.room_allotted).length;
  };

  const getRoomStudents = (roomNumber: string) => {
    // Deduplicate by student id to prevent duplicates
    const roomStudents = students.filter(s => s.hostel_room_number === roomNumber && s.room_allotted);
    return roomStudents.filter((student, index, self) =>
      index === self.findIndex((s) => s.id === student.id)
    );
  };

  const getRoomTypeName = (type: string) => {
    const types: Record<string, string> = {
      single: "Single Bed",
      double: "Double Bed",
      three: "Three Bed",
      four: "4 Beds",
      six: "6 Beds",
    };
    return types[type] || type;
  };

  // Render room structure view
  if (!selectedBlockType) {
    return (
      <div className="space-y-6">
        {/* Block Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-border hover:border-primary"
            onClick={() => setSelectedBlockType("ac")}
          >
            <CardContent className="py-8 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold text-foreground">AC Block</h3>
              <p className="text-muted-foreground mt-2">3 Floors • 18 Rooms</p>
              <div className="flex justify-center mt-4">
                <Badge className="bg-primary">AC</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-border hover:border-secondary"
            onClick={() => setSelectedBlockType("normal")}
          >
            <CardContent className="py-8 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-secondary-foreground" />
              <h3 className="text-xl font-bold text-foreground">Non-AC Block</h3>
              <p className="text-muted-foreground mt-2">3 Floors • 18 Rooms</p>
              <div className="flex justify-center mt-4">
                <Badge variant="secondary">Non-AC</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Fee Details - {selectedStudent?.student_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><p className="text-muted-foreground">Student Name</p><p className="font-medium">{selectedStudent?.student_name}</p></div>
                <div><p className="text-muted-foreground">Roll Number</p><p className="font-medium">{selectedStudent?.roll_number}</p></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFee">Total Fee (₹)</Label>
                <Input id="totalFee" type="number" value={totalFeeAmount} onChange={(e) => setTotalFeeAmount(e.target.value)} placeholder="Total Fee Amount" />
              </div>
              <div className="space-y-2">
                <Label>Previously Paid (₹)</Label>
                <p className="text-lg font-bold">₹{(selectedStudent?.paid_fee || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAmount">New Paid Amount (₹)</Label>
                <Input id="paidAmount" type="number" value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(e.target.value)} placeholder="Enter new payment added" />
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-muted-foreground">Calculated Pending Balance</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{((parseFloat(totalFeeAmount) || selectedStudent?.total_fee || 0) - (selectedStudent?.paid_fee || 0) - (parseFloat(newPaymentAmount) || 0)).toLocaleString()}
                </p>
              </div>

              {/* Fee History for Warden */}
              {feeTransactions.length > 0 && (
                <div className="space-y-2">
                  <Label>Payment History</Label>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/30">
                    {feeTransactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 bg-card rounded border text-xs">
                        <div>
                          <p className="font-bold text-success">₹{tx.amount.toLocaleString()}</p>
                          <p className="text-muted-foreground">{new Date(tx.payment_date).toLocaleDateString()}</p>
                        </div>
                        <p className="italic text-muted-foreground truncate max-w-[100px]">{tx.remarks}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleFeeUpdate} className="w-full">Update Fee Details</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showRemarksDialog} onOpenChange={setShowRemarksDialog}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Remarks - {selectedStudent?.student_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label htmlFor="remarks">Add Remarks</Label><Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks..." rows={4} /></div>
              <Button onClick={handleRemarksUpdate} className="w-full">Save Remarks</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Render floor selection
  if (!selectedFloor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBlockType(null)}>Blocks</Button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-foreground">{selectedBlockType === "ac" ? "AC Block" : "Non-AC Block"}</span>
        </div>

        <h2 className="text-2xl font-bold text-foreground">{selectedBlockType === "ac" ? "AC Block" : "Non-AC Block"} - Floors</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {floors.map((floor) => {
            const floorRooms = getFloorRooms(floor, selectedBlockType);
            const totalBeds = floorRooms.reduce((acc, r) => acc + r.total_beds, 0);
            // Use actual student count from students prop as source of truth (not stale room.occupied_beds)
            const occupiedBeds = floorRooms.reduce((acc, r) => acc + getRoomOccupiedBeds(r.room_number), 0);

            return (
              <Card
                key={floor}
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-border hover:border-primary"
                onClick={() => setSelectedFloor(floor)}
              >
                <CardContent className="py-6 text-center">
                  <h3 className="text-xl font-bold text-foreground">Floor {floor}</h3>
                  <p className="text-muted-foreground mt-2">{floorRooms.length} Rooms</p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="p-2 bg-success/10 rounded">
                      <p className="font-bold text-success">{occupiedBeds}</p>
                      <p className="text-xs text-muted-foreground">Occupied</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded">
                      <p className="font-bold text-primary">{totalBeds - occupiedBeds}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Render room selection or room detail
  if (!selectedRoom) {
    const floorRooms = getFloorRooms(selectedFloor, selectedBlockType);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBlockType(null)}>Blocks</Button>
          <ChevronRight className="w-4 h-4" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedFloor(null)}>{selectedBlockType === "ac" ? "AC Block" : "Non-AC Block"}</Button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-foreground">Floor {selectedFloor}</span>
        </div>

        <h2 className="text-2xl font-bold text-foreground">Floor {selectedFloor} - Rooms</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {floorRooms.map((room) => {
            const roomStudents = getRoomStudents(room.room_number);
            const actualOccupied = roomStudents.length;
            const closedBeds = room.closed_beds || 0;
            const availableBeds = Math.max(0, room.total_beds - actualOccupied - closedBeds);

            return (
              <Card
                key={room.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-border hover:border-primary"
                onClick={() => setSelectedRoom(room)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Room {room.room_number}</CardTitle>
                    <Badge variant={room.room_type === "six" ? "default" : "secondary"}>
                      {getRoomTypeName(room.room_type)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-secondary/10 rounded">
                      <p className="font-bold text-foreground">{room.total_beds}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 bg-success/10 rounded">
                      <p className="font-bold text-success">{actualOccupied}</p>
                      <p className="text-xs text-muted-foreground">Filled</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded">
                      <p className="font-bold text-primary">{availableBeds}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>
                  {closedBeds > 0 && (
                    <p className="text-xs text-destructive mt-2 text-center">{closedBeds} bed(s) closed</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Render room detail with bed control
  const roomStudents = getRoomStudents(selectedRoom.room_number);
  const actualOccupiedBeds = roomStudents.length; // Source of truth: actual students in room
  const closedBeds = selectedRoom.closed_beds || 0;
  const availableBeds = Math.max(0, selectedRoom.total_beds - actualOccupiedBeds - closedBeds);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => setSelectedBlockType(null)}>Blocks</Button>
        <ChevronRight className="w-4 h-4" />
        <Button variant="ghost" size="sm" onClick={() => { setSelectedFloor(null); setSelectedRoom(null); }}>{selectedBlockType === "ac" ? "AC Block" : "Non-AC Block"}</Button>
        <ChevronRight className="w-4 h-4" />
        <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>Floor {selectedFloor}</Button>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-foreground">Room {selectedRoom.room_number}</span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Room {selectedRoom.room_number}</h2>
        <Badge variant={selectedRoom.ac_type === "ac" ? "default" : "secondary"} className="text-lg px-4 py-1">
          {getRoomTypeName(selectedRoom.room_type)}
        </Badge>
      </div>

      {/* Bed Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-2 border-border">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-foreground">{selectedRoom.total_beds}</p>
            <p className="text-sm text-muted-foreground">Total Beds</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-success/20 bg-success/5">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-success">{actualOccupiedBeds}</p>
            <p className="text-sm text-muted-foreground">Filled</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-primary">{availableBeds}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-destructive/20 bg-destructive/5">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-destructive">{closedBeds}</p>
            <p className="text-sm text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Bed Control */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            Bed Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {bedStatuses.map((isAvailable, index) => {
              const isOccupied = index < actualOccupiedBeds; // Use actual count from students

              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${isOccupied ? 'bg-success/10 border-success/30' : isAvailable ? 'bg-muted border-border' : 'bg-destructive/10 border-destructive/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Bed {index + 1}</span>
                    {isOccupied && <User className="w-4 h-4 text-success" />}
                    {!isOccupied && !isAvailable && <X className="w-4 h-4 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {isOccupied ? "Occupied" : isAvailable ? "Available" : "Closed"}
                  </p>
                  {!isOccupied && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={() => handleBedToggle(index)}
                        disabled={isOccupied}
                      />
                      <span className="text-xs">{isAvailable ? "Open" : "Closed"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Students in Room */}
      {roomStudents.length > 0 && (
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle>Students in Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roomStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{student.student_name}</p>
                      {student.pending_fee <= 0 && student.room_allotted && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/10 border border-success/30 text-[10px] font-black uppercase text-success">
                          <Check className="w-3 h-3" />
                          <span>Paid</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openFeeDialog(student)}>
                    <IndianRupee className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openRemarksDialog(student)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteStudent(student)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Fee Details - {selectedStudent?.student_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><p className="text-muted-foreground">Student Name</p><p className="font-medium">{selectedStudent?.student_name}</p></div>
              <div><p className="text-muted-foreground">Roll Number</p><p className="font-medium">{selectedStudent?.roll_number}</p></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalFee">Total Fee (₹)</Label>
              <Input id="totalFee" type="number" value={totalFeeAmount} onChange={(e) => setTotalFeeAmount(e.target.value)} placeholder="Total Fee Amount" />
            </div>
            <div className="space-y-2">
              <Label>Previously Paid (₹)</Label>
              <p className="text-lg font-bold">₹{(selectedStudent?.paid_fee || 0).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAmount">New Paid Amount (₹)</Label>
              <Input id="paidAmount" type="number" value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(e.target.value)} placeholder="Enter new payment added" />
            </div>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">Calculated Pending Balance</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{((parseFloat(totalFeeAmount) || selectedStudent?.total_fee || 0) - (selectedStudent?.paid_fee || 0) - (parseFloat(newPaymentAmount) || 0)).toLocaleString()}
              </p>
            </div>

            {/* Fee History for Warden */}
            {feeTransactions.length > 0 && (
              <div className="space-y-2">
                <Label>Payment History</Label>
                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/30">
                  {feeTransactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-2 bg-card rounded border text-xs">
                      <div>
                        <p className="font-bold text-success">₹{tx.amount.toLocaleString()}</p>
                        <p className="text-muted-foreground">{new Date(tx.payment_date).toLocaleDateString()}</p>
                      </div>
                      <p className="italic text-muted-foreground truncate max-w-[100px]">{tx.remarks}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleFeeUpdate} className="w-full">Update Fee Details</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemarksDialog} onOpenChange={setShowRemarksDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Remarks - {selectedStudent?.student_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2"><Label htmlFor="remarks">Add Remarks</Label><Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks..." rows={4} /></div>
            <Button onClick={handleRemarksUpdate} className="w-full">Save Remarks</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostelRoomDetails;