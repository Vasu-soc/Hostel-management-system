import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, Utensils, Home, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  rooms: any[];
  students: any[];
  wardenId?: string;
}

export default function RoomAttendance({ rooms, students, wardenId }: Props) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, string>>({}); // studentId -> status
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Use local date (YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA');

  // Fetch today's attendance for the selected room
  const fetchAttendance = async (roomNo: string) => {
    if (!roomNo) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('room_number', roomNo)
        .eq('attendance_date', today);

      if (error) throw error;

      const attendanceMap: Record<string, string> = {};
      data.forEach((att: any) => {
        attendanceMap[att.student_id] = att.status;
      });
      setAttendance(attendanceMap);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchAttendance(selectedRoom);
    }
  }, [selectedRoom, today]);

  const studentsInRoom = students.filter(s => s.hostel_room_number === selectedRoom && s.room_allotted);

  const updateAttendance = async (studentId: string, rollNumber: string, status: string) => {
    try {
      const { error } = await supabase
        .from('daily_attendance')
        .upsert({
          student_id: studentId,
          roll_number: rollNumber,
          room_number: selectedRoom,
          status: status,
          attendance_date: today,
          warden_id: wardenId
        }, { onConflict: 'student_id,attendance_date' });

      if (error) throw error;

      setAttendance(prev => ({ ...prev, [studentId]: status }));
      
      toast({ 
        title: "Updated", 
        description: `Marked ${status === 'present' ? 'Available' : 'Not Available'}`,
        duration: 1500
      });

    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const markAllAvailable = async () => {
    if (!selectedRoom || studentsInRoom.length === 0) return;
    setLoading(true);
    try {
      const updates = studentsInRoom.map(s => ({
        student_id: s.id,
        roll_number: s.roll_number,
        room_number: selectedRoom,
        status: 'present',
        attendance_date: today,
        warden_id: wardenId
      }));

      const { error } = await supabase
        .from('daily_attendance')
        .upsert(updates, { onConflict: 'student_id,attendance_date' });

      if (error) throw error;

      const newMap = { ...attendance };
      studentsInRoom.forEach(s => { newMap[s.id] = 'present'; });
      setAttendance(newMap);
      toast({ title: "Success", description: "All students marked available." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for current room
  // Use a strict 'present' check, otherwise treat as 'not yet marked' for counting
  const presentCount = studentsInRoom.filter(s => attendance[s.id] === 'present').length;
  const markedCount = studentsInRoom.filter(s => attendance[s.id] !== undefined).length;
  const absentCount = studentsInRoom.filter(s => attendance[s.id] === 'absent').length;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Daily Room Attendance
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20">
                DATE: {today}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-40 bg-white border-primary/20 focus:ring-primary shadow-sm hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Select Room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.sort((a,b) => a.room_number.localeCompare(b.room_number)).map(r => (
                    <SelectItem key={r.id} value={r.room_number}>Room {r.room_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="hero" 
                size="sm" 
                disabled={!selectedRoom || loading}
                onClick={markAllAvailable}
                className="shadow-md hover:shadow-lg transition-all"
              >
                Mark All Available
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!selectedRoom ? (
            <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-border">
              <Home className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Please select a room to begin</p>
            </div>
          ) : studentsInRoom.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-border">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">No students allotted to this room</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Room Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border text-center shadow-sm">
                  <p className="text-2xl font-black">{studentsInRoom.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Students</p>
                </div>
                <div className="p-4 bg-success/10 rounded-xl border-2 border-success/20 text-center shadow-sm">
                  <p className="text-2xl font-black text-success">{presentCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success">Present</p>
                </div>
                <div className="p-4 bg-destructive/10 rounded-xl border-2 border-destructive/20 text-center shadow-sm">
                  <p className="text-2xl font-black text-destructive">{absentCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">Absent</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary/20 text-center shadow-sm relative overflow-hidden">
                  <Utensils className="absolute -bottom-1 -right-1 w-8 h-8 opacity-10 rotate-12" />
                  <p className="text-2xl font-black text-primary">{presentCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Mess Count</p>
                </div>
              </div>

              {/* Selection Status */}
              <div className="flex items-center justify-between px-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Progress: {markedCount} / {studentsInRoom.length} Students Marked
                </p>
                <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${(markedCount / studentsInRoom.length) * 100}%` }}
                   />
                </div>
              </div>

              {/* Student List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentsInRoom.map((student) => {
                  const status = attendance[student.id];
                  return (
                    <div 
                      key={student.id} 
                      className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group h-24 ${
                        status === 'present' ? 'border-success/30 bg-success/5' : 
                        status === 'absent' ? 'border-destructive/30 bg-destructive/5' : 
                        'border-border bg-white hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full transition-colors ${
                          status === 'present' ? 'bg-success' : 
                          status === 'absent' ? 'bg-destructive' : 
                          'bg-muted'
                        }`} />
                        <div>
                          <p className={`font-bold text-lg transition-colors ${status ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {student.student_name}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{student.roll_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={status === 'present' ? 'default' : 'outline'}
                          className={`min-w-[100px] transition-all ${
                            status === 'present' 
                              ? 'bg-success hover:bg-success shadow-success/20' 
                              : 'hover:bg-success/10 hover:text-success hover:border-success/50'
                          }`}
                          onClick={() => updateAttendance(student.id, student.roll_number, 'present')}
                        >
                          <Check className={`w-4 h-4 mr-1 ${status === 'present' ? 'animate-bounce' : ''}`} /> 
                          Available
                        </Button>
                        <Button 
                          size="sm" 
                          variant={status === 'absent' ? 'destructive' : 'outline'}
                          className={`min-w-[120px] transition-all ${
                            status === 'absent' 
                              ? 'bg-destructive hover:bg-destructive shadow-destructive/20' 
                              : 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50'
                          }`}
                          onClick={() => updateAttendance(student.id, student.roll_number, 'absent')}
                        >
                          <X className="w-4 h-4 mr-1" /> Not Available
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t flex items-center justify-center gap-2 italic text-muted-foreground text-[10px]">
                <Clock className="w-3 h-3" />
                Attendance resets automatically at Midnight (12:00 AM).
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

