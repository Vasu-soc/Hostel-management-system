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

  const getStats = (floor?: string) => {
    const filtered = floor ? rooms.filter(r => r.floor_number === floor) : rooms;
    const total = filtered.reduce((acc, r) => acc + r.total_beds, 0);
    const occupied = filtered.reduce((acc, r) => acc + (r.occupied_beds || 0), 0);
    const available = total - occupied;
    return { total, occupied, available };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-0 bg-transparent shadow-none">
        <div className="bg-card border-2 border-primary/20 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/30">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black italic tracking-tight text-primary">HOSTEL BED AVAILABILITY</DialogTitle>
                <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mt-0.5">Live room & floor status for new admissions</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="font-black text-primary animate-pulse tracking-widest text-xs uppercase">Loading Real-time Data...</p>
              </div>
            ) : rooms.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <Info className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                    <p className="font-bold text-muted-foreground">No room data available at the moment.</p>
                </div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Total Beds", value: getStats().total, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Occupied", value: getStats().occupied, icon: LayoutGrid, color: "text-orange-500", bg: "bg-orange-500/10" },
                    { label: "Available", value: getStats().available, icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10", glow: true },
                  ].map((stat, i) => (
                    <Card key={i} className={`border-2 border-border/50 overflow-hidden relative group ${stat.glow ? 'ring-2 ring-green-500/20 shadow-green-500/10 shadow-lg' : ''}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                          <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8 opacity-50" />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Layers className="w-4 h-4 text-primary" />
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Floor Wise Breakdown</h3>
                    </div>

                    <Tabs defaultValue={floors[0]} className="w-full">
                        <TabsList className="w-full h-12 bg-muted/50 p-1 rounded-xl border border-border mb-6 flex overflow-x-auto scrollbar-none">
                            {floors.map((floor) => (
                            <TabsTrigger 
                                key={floor} 
                                value={floor}
                                className="flex-1 rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                            >
                                Floor {floor}
                            </TabsTrigger>
                            ))}
                        </TabsList>

                        {floors.map((floor) => (
                            <TabsContent key={floor} value={floor} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {rooms.filter(r => r.floor_number === floor).map((room) => {
                                        const isFull = (room.occupied_beds || 0) >= room.total_beds;
                                        const available = room.total_beds - (room.occupied_beds || 0);
                                        
                                        return (
                                            <div key={room.id} className={`p-3 rounded-2xl border-2 transition-all hover:-translate-y-1 ${isFull ? 'bg-muted/30 border-border opacity-60' : 'bg-card border-primary/20 hover:border-primary/50 hover:shadow-lg shadow-primary/5'}`}>
                                                <div className="flex flex-col items-center gap-1 text-center">
                                                    <span className="text-[10px] font-black italic text-muted-foreground uppercase opacity-70">Room</span>
                                                    <span className={`text-lg font-black ${isFull ? 'text-foreground' : 'text-primary'}`}>{room.room_number}</span>
                                                    <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-500 ${isFull ? 'bg-muted-foreground' : 'bg-primary'}`}
                                                            style={{ width: `${((room.occupied_beds || 0) / room.total_beds) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[9px] font-bold mt-1 ${isFull ? 'text-destructive' : 'text-green-600'}`}>
                                                        {isFull ? 'FULL' : `${available} Left`}
                                                    </span>
                                                    <div className="mt-2 pt-2 border-t border-border/50 w-full flex flex-col gap-0.5">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground whitespace-nowrap">{room.room_type} Sharing</span>
                                                        <span className={`text-[8px] font-black uppercase ${room.ac_type === 'ac' ? 'text-blue-500' : 'text-orange-500'}`}>{room.ac_type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-muted/30 border-t border-primary/10 flex items-center justify-between text-[10px] font-bold italic text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Available</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Occupied</span>
            </div>
            <span>Auto-Updated Live Status</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostelBedDetails;

import { ShieldCheck } from "lucide-react";
