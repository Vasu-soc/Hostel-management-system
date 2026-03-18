import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Users, LayoutGrid, Info, Building2, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface HostelBedDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HostelBedDetails = ({ open, onOpenChange }: HostelBedDetailsProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRooms();
    }
  }, [open]);

  const fetchRooms = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("floor_number", { ascending: true })
      .order("room_number", { ascending: true });

    if (!error && data) {
      setRooms(data as Room[]);
    }
    setIsLoading(false);
  };

  const floors = Array.from(new Set(rooms.map(r => r.floor_number))).sort();
  const roomTypes = Array.from(new Set(rooms.map(r => r.room_type)));

  const getGender = (roomNumber: string) => {
    const num = roomNumber.toUpperCase();
    if (num.startsWith('GA') || num.startsWith('GN') || num.startsWith('G')) return 'GIRLS';
    return 'BOYS';
  };

  const boysRooms = rooms.filter(r => getGender(r.room_number) === 'BOYS');
  const girlsRooms = rooms.filter(r => getGender(r.room_number) === 'GIRLS');

  const getFloorsForRooms = (roomList: Room[]) => {
    return Array.from(new Set(roomList.map(r => r.floor_number))).sort();
  };

  const boysFloors = getFloorsForRooms(boysRooms);
  const girlsFloors = getFloorsForRooms(girlsRooms);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-0 bg-transparent shadow-none">
        <div className="bg-card border-2 border-primary/20 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/30">
                  <DoorOpen className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black italic tracking-tight text-primary uppercase">Hostel Bed Details</DialogTitle>
                  <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mt-0.5">Floor-wise room configurations for admissions</DialogDescription>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-600 font-black px-4 py-1 animate-pulse">
                  BOYS HOSTEL
                </Badge>
                <Badge variant="outline" className="border-pink-500/20 bg-pink-500/5 text-pink-600 font-black px-4 py-1 animate-pulse">
                  GIRLS HOSTEL
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-12 scrollbar-none">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="font-black text-primary animate-pulse tracking-widest text-xs uppercase">Loading Room Details...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <Info className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <p className="font-bold text-muted-foreground">No room data available at the moment.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Boys Hostel Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b-2 border-blue-500/10 pb-4">
                    <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-500/20">
                      <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-blue-600 tracking-tighter uppercase italic">Boys Hostel Intake Details</h2>
                  </div>

                  <Tabs defaultValue={boysFloors[0]} className="w-full">
                    <TabsList className="w-full h-12 bg-blue-50/50 p-1 rounded-xl border border-blue-100 mb-6 flex overflow-x-auto scrollbar-none">
                      {boysFloors.map((floor) => (
                        <TabsTrigger
                          key={floor}
                          value={floor}
                          className="flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all italic"
                        >
                          Boys - Floor {floor}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {boysFloors.map((floor) => (
                      <TabsContent key={floor} value={floor} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400 focus-visible:outline-none">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {boysRooms.filter(r => r.floor_number === floor).map((room) => (
                            <div key={room.id} className="p-4 rounded-2xl border-2 border-blue-500/10 bg-card hover:border-blue-500/30 transition-all hover:-translate-y-1 hover:shadow-xl shadow-blue-500/5 group text-center">
                              <span className="text-[9px] font-black italic text-blue-500 uppercase opacity-60 tracking-tighter">Boys Room</span>
                              <h4 className="text-xl font-black text-foreground mt-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{room.room_number}</h4>
                              <div className="mt-3 pt-3 border-t border-border w-full flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-center gap-1.5">
                                  <LayoutGrid className="w-3 h-3 text-blue-500" /> {room.room_type} Sharing
                                </span>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest mt-1 mx-auto py-0.5 ${room.ac_type === 'ac' ? 'border-primary/20 text-primary bg-primary/5' : 'border-orange-500/20 text-orange-600 bg-orange-500/5'}`}>
                                  {room.ac_type} Accommodation
                                </Badge>
                                <span className="text-[9px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-tighter italic">Total Beds: {room.total_beds}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Girls Hostel Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b-2 border-pink-500/10 pb-4">
                    <div className="p-2 bg-pink-500 rounded-lg text-white shadow-lg shadow-pink-500/20">
                      <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-pink-600 tracking-tighter uppercase italic">Girls Hostel Intake Details</h2>
                  </div>

                  <Tabs defaultValue={girlsFloors[0]} className="w-full">
                    <TabsList className="w-full h-12 bg-pink-50/50 p-1 rounded-xl border border-pink-100 mb-6 flex overflow-x-auto scrollbar-none">
                      {girlsFloors.map((floor) => (
                        <TabsTrigger
                          key={floor}
                          value={floor}
                          className="flex-1 rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all italic"
                        >
                          Girls - Floor {floor}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {girlsFloors.map((floor) => (
                      <TabsContent key={floor} value={floor} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400 focus-visible:outline-none">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {girlsRooms.filter(r => r.floor_number === floor).map((room) => (
                            <div key={room.id} className="p-4 rounded-2xl border-2 border-pink-500/10 bg-card hover:border-pink-500/30 transition-all hover:-translate-y-1 hover:shadow-xl shadow-pink-500/5 group text-center">
                              <span className="text-[9px] font-black italic text-pink-500 uppercase opacity-60 tracking-tighter">Girls Room</span>
                              <h4 className="text-xl font-black text-foreground mt-1 group-hover:text-pink-600 transition-colors uppercase tracking-tight">{room.room_number}</h4>
                              <div className="mt-3 pt-3 border-t border-border w-full flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-center gap-1.5">
                                  <LayoutGrid className="w-3 h-3 text-pink-500" /> {room.room_type} Sharing
                                </span>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest mt-1 mx-auto py-0.5 ${room.ac_type === 'ac' ? 'border-primary/20 text-primary bg-primary/5' : 'border-orange-500/20 text-orange-600 bg-orange-500/5'}`}>
                                  {room.ac_type} Accommodation
                                </Badge>
                                <span className="text-[9px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-tighter italic">Total Beds: {room.total_beds}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/30 border-t border-primary/10 flex items-center justify-between text-[10px] font-black italic text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Boys Hostel</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-500" /> Girls Hostel</span>
            </div>
            <span>Official Bed Distribution Data</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostelBedDetails;

import { ShieldCheck } from "lucide-react";
