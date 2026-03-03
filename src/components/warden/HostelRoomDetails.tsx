import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Trash2, IndianRupee, MessageSquare, User, Building2, ChevronRight, Bed, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

const HostelRoomDetails = ({ students, onRefresh }: HostelRoomDetailsProps) => {
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
  const [paidAmount, setPaidAmount] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  // Bed control state
  const [bedStatuses, setBedStatuses] = useState<boolean[]>([]);

  useEffect(() => {
    loadRooms();
  }, []);

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
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");
    
    if (!error && data) {
      setRooms(data);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Remove ${student.student_name} from room ${student.hostel_room_number}?`)) return;

    const roomNumber = student.hostel_room_number;

    const { error } = await supabase
      .from("students")
      .update({
        hostel_room_number: null,
        floor_number: null,
        room_allotted: false,
      })
      .eq("id", student.id);

    if (error) {
      toast({ title: "Error", description: "Failed to remove student from room", variant: "destructive" });
      return;
    }

    // Sync room occupied_beds with actual student count after removal
    if (roomNumber) {
      const { data: studentsInRoom } = await supabase
        .from("students")
        .select("id")
        .eq("hostel_room_number", roomNumber)
        .eq("room_allotted", true);
      
      const actualOccupied = studentsInRoom?.length || 0;

      const { data: room } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_number", roomNumber)
        .maybeSingle();

      if (room) {
        await supabase
          .from("rooms")
          .update({ occupied_beds: actualOccupied })
          .eq("id", room.id);
      }
    }

    toast({ title: "Success", description: "Student removed from room" });
    onRefresh();
    loadRooms();
  };

  const handleFeeUpdate = async () => {
    if (!selectedStudent) return;

    const paid = parseFloat(paidAmount) || 0;
    const pending = parseFloat(pendingAmount) || 0;

    const { error } = await supabase
      .from("students")
      .update({
        paid_fee: paid,
        pending_fee: pending,
        total_fee: paid + pending,
      })
      .eq("id", selectedStudent.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update fee details", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Fee details updated successfully" });
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

  const openFeeDialog = (student: Student) => {
    setSelectedStudent(student);
    setPaidAmount(student.paid_fee?.toString() || "0");
    setPendingAmount(student.pending_fee?.toString() || "0");
    setShowFeeDialog(true);
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
                <div><p className="text-muted-foreground">Year</p><p className="font-medium">{selectedStudent?.year}</p></div>
              </div>
              <div className="space-y-2"><Label htmlFor="paidAmount">Paid Amount (₹)</Label><Input id="paidAmount" type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Enter paid amount" /></div>
              <div className="space-y-2"><Label htmlFor="pendingAmount">Pending Amount (₹)</Label><Input id="pendingAmount" type="number" value={pendingAmount} onChange={(e) => setPendingAmount(e.target.value)} placeholder="Enter pending amount" /></div>
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
            const occupiedBeds = floorRooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 0);
            
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
                    <p className="font-medium">{student.student_name}</p>
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
              <div><p className="text-muted-foreground">Year</p><p className="font-medium">{selectedStudent?.year}</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="paidAmount">Paid Amount (₹)</Label><Input id="paidAmount" type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Enter paid amount" /></div>
            <div className="space-y-2"><Label htmlFor="pendingAmount">Pending Amount (₹)</Label><Input id="pendingAmount" type="number" value={pendingAmount} onChange={(e) => setPendingAmount(e.target.value)} placeholder="Enter pending amount" /></div>
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