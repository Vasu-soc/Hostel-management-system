import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wind, Fan, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Room {
  id: string;
  room_number: string;
  floor_number: string;
  room_type: string;
  ac_type: string;
  total_beds: number;
  occupied_beds: number;
  pending_beds: number;
}

interface Student {
  id: string;
  hostel_room_number: string | null;
  room_allotted: boolean;
  student_name?: string;
  roll_number?: string;
  branch?: string;
  year?: string;
  photo_url?: string | null;
  email?: string | null;
  total_fee?: number;
  paid_fee?: number;
  pending_fee?: number;
}

interface PendingRoomsDashboardProps {
  rooms: Room[];
  students?: Student[];
}

const PendingRoomsDashboard = ({ rooms, students = [] }: PendingRoomsDashboardProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

  // Pre-process students into a map for O(1) room lookup
  const roomStudentsMap = React.useMemo(() => {
    const map: Record<string, Student[]> = {};
    students.forEach(s => {
      if (s.hostel_room_number && s.room_allotted) {
        if (!map[s.hostel_room_number]) {
          map[s.hostel_room_number] = [];
        }
        map[s.hostel_room_number].push(s);
      }
    });
    return map;
  }, [students]);

  const { acRooms, nonAcRooms, acStats, nonAcStats } = React.useMemo(() => {
    const ac = rooms.filter(r => r.ac_type === "ac");
    const nonAc = rooms.filter(r => r.ac_type === "non-ac" || r.ac_type === "normal");

    const getStats = (roomList: Room[]) => ({
      totalBeds: roomList.reduce((sum, r) => sum + r.total_beds, 0),
      occupiedBeds: roomList.reduce((sum, r) => sum + (roomStudentsMap[r.room_number]?.length || 0), 0),
    });

    return {
      acRooms: ac,
      nonAcRooms: nonAc,
      acStats: getStats(ac),
      nonAcStats: getStats(nonAc)
    };
  }, [rooms, roomStudentsMap]);

  // Get students in a specific room from our optimized map
  const getRoomStudents = (roomNumber: string) => {
    return roomStudentsMap[roomNumber] || [];
  };

  const getActualOccupied = (roomNumber: string) => {
    return getRoomStudents(roomNumber).length;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AC Block */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Wind className="w-5 h-5" />
              AC Block
            </CardTitle>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="text-center p-2 bg-secondary/10 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{acStats.totalBeds}</p>
                <p className="text-xs text-muted-foreground">Total Beds</p>
              </div>
              <div className="text-center p-2 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{acStats.occupiedBeds}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Floor</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Occupied</TableHead>
                    <TableHead className="text-center">Profiles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No AC rooms available
                      </TableCell>
                    </TableRow>
                  ) : (
                    acRooms.map((room) => {
                      const roomStudents = getRoomStudents(room.room_number);
                      return (
                        <TableRow key={room.id} className="group">
                          <TableCell>{room.floor_number}</TableCell>
                          <TableCell className="font-medium">{room.room_number}</TableCell>
                          <TableCell className="text-center">{room.total_beds}</TableCell>
                          <TableCell className="text-center text-success">{getActualOccupied(room.room_number)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {roomStudents.length === 0 ? (
                                <span className="text-muted-foreground text-xs">-</span>
                              ) : (
                                roomStudents.slice(0, 4).map((student, idx) => (
                                  <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className="focus:outline-none hover:ring-2 hover:ring-primary rounded-full transition-all"
                                    title={student.student_name}
                                  >
                                    <Avatar className="w-6 h-6 border border-border">
                                      <AvatarImage src={student.photo_url || undefined} alt={student.student_name} />
                                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                        {getInitials(student.student_name || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                  </button>
                                ))
                              )}
                              {roomStudents.length > 4 && (
                                <span className="text-xs text-muted-foreground">+{roomStudents.length - 4}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Non-AC Block */}
        <Card className="border-2 border-secondary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Fan className="w-5 h-5" />
              Non-AC Block
            </CardTitle>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="text-center p-2 bg-secondary/10 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{nonAcStats.totalBeds}</p>
                <p className="text-xs text-muted-foreground">Total Beds</p>
              </div>
              <div className="text-center p-2 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{nonAcStats.occupiedBeds}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Floor</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Occupied</TableHead>
                    <TableHead className="text-center">Profiles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonAcRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No Non-AC rooms available
                      </TableCell>
                    </TableRow>
                  ) : (
                    nonAcRooms.map((room) => {
                      const roomStudents = getRoomStudents(room.room_number);
                      return (
                        <TableRow key={room.id} className="group">
                          <TableCell>{room.floor_number}</TableCell>
                          <TableCell className="font-medium">{room.room_number}</TableCell>
                          <TableCell className="text-center">{room.total_beds}</TableCell>
                          <TableCell className="text-center text-success">{getActualOccupied(room.room_number)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {roomStudents.length === 0 ? (
                                <span className="text-muted-foreground text-xs">-</span>
                              ) : (
                                roomStudents.slice(0, 4).map((student, idx) => (
                                  <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className="focus:outline-none hover:ring-2 hover:ring-primary rounded-full transition-all"
                                    title={student.student_name}
                                  >
                                    <Avatar className="w-6 h-6 border border-border">
                                      <AvatarImage src={student.photo_url || undefined} alt={student.student_name} />
                                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                        {getInitials(student.student_name || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                  </button>
                                ))
                              )}
                              {roomStudents.length > 4 && (
                                <span className="text-xs text-muted-foreground">+{roomStudents.length - 4}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Profile Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Student Profile
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 pt-2">
              {/* Photo */}
              <div className="flex justify-center">
                <button
                  onClick={() => selectedStudent.photo_url && setEnlargedPhotoUrl(selectedStudent.photo_url)}
                  className="focus:outline-none"
                >
                  <Avatar className="w-24 h-24 border-2 border-primary cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={selectedStudent.photo_url || undefined} alt={selectedStudent.student_name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(selectedStudent.student_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedStudent.student_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.roll_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Branch</p>
                  <p className="font-medium">{selectedStudent.branch || "-"}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Year</p>
                  <p className="font-medium">{selectedStudent.year || "-"}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Room</p>
                  <p className="font-medium">{selectedStudent.hostel_room_number || "-"}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium text-xs truncate">{selectedStudent.email || "-"}</p>
                </div>
              </div>

              {/* Fee Details */}
              {(selectedStudent.total_fee || selectedStudent.paid_fee || selectedStudent.pending_fee) && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Fee Details</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-secondary/10 rounded">
                      <p className="font-bold text-foreground">₹{selectedStudent.total_fee?.toLocaleString() || 0}</p>
                      <p className="text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 bg-success/10 rounded">
                      <p className="font-bold text-success">₹{selectedStudent.paid_fee?.toLocaleString() || 0}</p>
                      <p className="text-muted-foreground">Paid</p>
                    </div>
                    <div className="p-2 bg-destructive/10 rounded">
                      <p className="font-bold text-destructive">₹{selectedStudent.pending_fee?.toLocaleString() || 0}</p>
                      <p className="text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enlarged Photo Dialog */}
      <Dialog open={!!enlargedPhotoUrl} onOpenChange={() => setEnlargedPhotoUrl(null)}>
        <DialogContent className="max-w-md p-2">
          {enlargedPhotoUrl && (
            <img
              src={enlargedPhotoUrl}
              alt="Student Photo"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingRoomsDashboard;