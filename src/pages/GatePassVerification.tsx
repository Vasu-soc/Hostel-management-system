import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Phone, User, Calendar, Clock, MapPin, Building, ShieldCheck, DoorOpen, House } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CollegeHeader from "@/components/CollegeHeader";

const GatePassVerification = () => {
    const { passId } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [gatePass, setGatePass] = useState<any>(null);
    const [student, setStudent] = useState<any>(null);
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        if (passId) {
            fetchPassDetails();
        }
    }, [passId]);

    const fetchPassDetails = async () => {
        setLoading(true);
        try {
            // Fetch gate pass
            const { data: pass, error: passError } = await (supabase as any)
                .from("gate_passes")
                .select("*")
                .eq("id", passId)
                .single();

            if (passError || !pass) {
                toast({ title: "Error", description: "Gate pass not found", variant: "destructive" });
                return;
            }
            setGatePass(pass);

            // Fetch student status (IN / OUT)
            const { data: std, error: stdError } = await (supabase as any)
                .from("students")
                .select("*")
                .eq("id", pass.student_id)
                .single();
            if (std) setStudent(std);

            // Fetch application details (for photo and parent details)
            const { data: appData, error: appError } = await (supabase as any)
                .from("hostel_applications")
                .select("*")
                .eq("student_name", pass.student_name)
                .maybeSingle();
            
            // Actually, roll_number is in students.
            // Let's try to find application via student_name or some unique link
            if (!appData) {
                // Try matching by student name and phone
                const { data: appData2 } = await (supabase as any)
                    .from("hostel_applications")
                    .select("*")
                    .eq("student_name", pass.student_name)
                    .maybeSingle();
                if (appData2) setApplication(appData2);
            } else {
                setApplication(appData);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (action: "EXIT" | "ENTRY") => {
        if (!gatePass || !student) return;

        setProcessing(true);
        try {
            const now = new Date().toISOString();
            
            if (action === "EXIT") {
                // Validations:
                if (student.status === "OUT") {
                    toast({ title: "Invalid Action", description: "Student is already OUT", variant: "destructive" });
                    setProcessing(false);
                    return;
                }
                if (gatePass.status !== "approved") {
                    toast({ title: "Invalid Pass", description: "Gate pass is not approved", variant: "destructive" });
                    setProcessing(false);
                    return;
                }

                // Update student to OUT
                const { error: stdUpdateError } = await (supabase as any)
                    .from("students")
                    .update({ status: "OUT" })
                    .eq("id", student.id);

                if (stdUpdateError) throw stdUpdateError;

                // Update gate pass with exit_time
                const { error: passUpdateError } = await (supabase as any)
                    .from("gate_passes")
                    .update({ 
                        exit_time: now,
                        // We keep status as 'approved' until entry
                    })
                    .eq("id", passId);
                
                if (passUpdateError) throw passUpdateError;

                toast({ title: "Exit Confirmed", description: `${student.student_name} is now OUT` });
            } else {
                // ENTRY logic
                if (student.status === "IN") {
                    toast({ title: "Invalid Action", description: "Student is already IN", variant: "destructive" });
                    setProcessing(false);
                    return;
                }
                if (gatePass.status === "completed") {
                    toast({ title: "Invalid Pass", description: "Gate pass has already been used and completed", variant: "destructive" });
                    setProcessing(false);
                    return;
                }

                // Update student to IN
                const { error: stdUpdateError } = await (supabase as any)
                    .from("students")
                    .update({ status: "IN" })
                    .eq("id", student.id);

                if (stdUpdateError) throw stdUpdateError;

                // Update gate pass to COMPLETED and save entry_time
                const { error: passUpdateError } = await (supabase as any)
                    .from("gate_passes")
                    .update({ 
                        entry_time: now,
                        status: "completed"
                    })
                    .eq("id", passId);
                
                if (passUpdateError) throw passUpdateError;

                toast({ title: "Entry Confirmed", description: `${student.student_name} is now IN` });
            }

            fetchPassDetails();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    if (!gatePass) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center p-6 bg-white shadow-xl rounded-2xl">
                <X className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Gate Pass</h1>
                <p className="text-gray-600 mb-6">This gate pass could not be found or is no longer valid.</p>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 rounded-xl">Go Home</Button>
            </Card>
        </div>
    );

    const isExitTime = student?.status === "IN" && gatePass.status === "approved";
    const isEntryTime = student?.status === "OUT" && gatePass.status === "approved" && gatePass.exit_time;

    return (
        <div className="min-h-screen bg-neutral-50 pb-10">
            <CollegeHeader />
            
            <div className="container mx-auto px-4 max-w-md mt-6">
                <Card className="overflow-hidden border-none shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-3xl bg-white">
                    <div className="bg-gradient-to-br from-primary to-primary-foreground p-6 text-white text-center">
                        <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs mb-3 px-3 py-1 uppercase tracking-widest font-bold">
                            Gate Pass Verification
                        </Badge>
                        <h2 className="text-2xl font-black tracking-tight">{gatePass.student_name}</h2>
                        <p className="text-white/80 font-medium">{gatePass.roll_number} • {gatePass.branch}</p>
                    </div>

                    <div className="relative flex justify-center -mt-10">
                        <div className="w-32 h-32 rounded-3xl border-[6px] border-white shadow-2xl overflow-hidden bg-white">
                            {student?.photo_url || application?.photo_url ? (
                                <img 
                                    src={student?.photo_url || application?.photo_url} 
                                    alt="Student" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                        </div>
                    </div>

                    <CardContent className="pt-6 space-y-6">
                        {/* Status Section */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Pass Status</span>
                                <Badge className={`
                                    ${gatePass.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                      gatePass.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                                      'bg-amber-100 text-amber-700'}
                                    border-none font-bold uppercase py-1
                                `}>
                                    {gatePass.status}
                                </Badge>
                            </div>
                            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Current Location</span>
                                <Badge className={`
                                    ${student?.status === 'IN' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}
                                    border-none font-bold uppercase py-1
                                `}>
                                    {student?.status || "IN"}
                                </Badge>
                            </div>
                        </div>

                        {/* Contacts Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                <Phone className="w-3 h-3" /> Contact Details
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <span className="text-xs font-medium text-neutral-600">Student Mobile</span>
                                    <span className="text-sm font-bold text-neutral-800">{gatePass.student_mobile || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <span className="text-xs font-medium text-neutral-600">Parent Mobile</span>
                                    <span className="text-sm font-bold text-neutral-800">{gatePass.parent_mobile || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Image Section (Optional Requirement) */}
                        {application?.father_name && (
                             <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Guardian Details
                                </h3>
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <p className="text-sm font-bold text-neutral-800 mb-1">{application.father_name}</p>
                                    <p className="text-xs text-neutral-500 italic">Father / Guardian</p>
                                </div>
                             </div>
                        )}

                        {/* Timing Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Leave Duration
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Out Date</span>
                                    <span className="text-xs font-bold text-neutral-800">{gatePass.out_date}</span>
                                </div>
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">Expected Return</span>
                                    <span className="text-xs font-bold text-neutral-800">{gatePass.in_date}</span>
                                </div>
                            </div>
                        </div>

                        {/* Purpose */}
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <h4 className="text-[10px] uppercase font-bold text-amber-600 mb-1">Reason for Leave</h4>
                            <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                                "{gatePass.purpose}"
                            </p>
                        </div>

                        {/* Logs Section if available */}
                        {(gatePass.exit_time || gatePass.entry_time) && (
                            <div className="space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Gate Logs</h3>
                                {gatePass.exit_time && (
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <span className="text-neutral-500">Exited on:</span>
                                        <span className="font-bold">{new Date(gatePass.exit_time).toLocaleString()}</span>
                                    </div>
                                )}
                                {gatePass.entry_time && (
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        <span className="text-neutral-500">Returned on:</span>
                                        <span className="font-bold">{new Date(gatePass.entry_time).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-4 space-y-3">
                            {isExitTime && (
                                <Button 
                                    onClick={() => handleStatusUpdate("EXIT")} 
                                    disabled={processing}
                                    className="w-full h-16 rounded-2xl text-lg font-black tracking-tight bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                                >
                                    {processing ? <Loader2 className="animate-spin mr-2" /> : <DoorOpen className="mr-2" />}
                                    EXIT CONFIRM
                                </Button>
                            )}
                            
                            {isEntryTime && (
                                <Button 
                                    onClick={() => handleStatusUpdate("ENTRY")} 
                                    disabled={processing}
                                    className="w-full h-16 rounded-2xl text-lg font-black tracking-tight bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                >
                                    {processing ? <Loader2 className="animate-spin mr-2" /> : <House className="mr-2" />}
                                    ENTRY CONFIRM
                                </Button>
                            )}

                            {gatePass.status === 'completed' && (
                                <div className="text-center p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-blue-900 font-black">PASS COMPLETED</h3>
                                    <p className="text-xs text-blue-600 mt-1">This gate pass has been used for exit and entry.</p>
                                </div>
                            )}

                            {!isExitTime && !isEntryTime && gatePass.status !== 'completed' && (
                                <div className="text-center p-4">
                                    <p className="text-xs text-neutral-400 italic">This pass is not ready for gate action or has incorrect location status.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                
                <p className="text-center text-[10px] text-neutral-400 mt-8 mb-4 uppercase tracking-[0.2em]">
                    Internal Hostel Management System © 2026
                </p>
            </div>
        </div>
    );
};

export default GatePassVerification;
