import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { getWatchmanSession, clearWatchmanSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CollegeHeader from "@/components/CollegeHeader";
import TerminalLoader from "@/components/TerminalLoader";
import {
  ShieldCheck,
  Loader2,
  LogOut,
  Camera,
  Search,
  User,
  Check,
  X,
  Phone,
  Calendar,
  Clock,
  ArrowLeft,
  DoorOpen,
  House,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface Watchman {
  id: string;
  name: string;
  username: string;
}

const WatchmanDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [watchman, setWatchman] = useState<Watchman | null>(null);
    const [scannedId, setScannedId] = useState<string | null>(null);
    const [manualId, setManualId] = useState("");
    const [loading, setLoading] = useState(false);
    const [passDetails, setPassDetails] = useState<any>(null);
    const [studentDetails, setStudentDetails] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [outStudents, setOutStudents] = useState<any[]>([]);
    const [recentHistory, setRecentHistory] = useState<any[]>([]);
    const [cameras, setCameras] = useState<any[]>([]);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [activeView, setActiveView] = useState<"scanner" | "outList" | "history">("scanner");
    const [isPassDetailOpen, setIsPassDetailOpen] = useState(false);
    const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
    const [incidentType, setIncidentType] = useState("");
    const [incidentDescription, setIncidentDescription] = useState("");
    const [isReporting, setIsReporting] = useState(false);
    const [showLoader, setShowLoader] = useState(() => sessionStorage.getItem("show_terminal_loader") === "true");

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isInitializing = useRef(false);
    const stopInProgress = useRef(false);
    const activeViewRef = useRef(activeView);

    useEffect(() => {
        activeViewRef.current = activeView;
    }, [activeView]);

    const initScanner = async () => {
         if (isScanning && !isInitializing.current) {
             isInitializing.current = true;
             setCameraError(null);
             
             try {
                 // 0. Explicitly request camera permission FIRST to preserve user gesture token from click
                 if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                     try {
                         const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                         stream.getTracks().forEach(track => track.stop());
                     } catch (permError) {
                         console.warn("Pre-request permission failed:", permError);
                     }
                 }

                 // 1. Wait for reader element with a loop
                 let readerElement = document.getElementById("reader");
                 let attempts = 0;
                 while (!readerElement && attempts < 15) { // Increased attempts for slower mobiles
                     await new Promise(r => setTimeout(r, 200));
                     readerElement = document.getElementById("reader");
                     attempts++;
                 }

                 if (!readerElement) {
                     if (activeViewRef.current === "scanner") {
                        setCameraError("Camera preview area failed to load. Please refresh.");
                     }
                     isInitializing.current = false;
                     return;
                 }

                 // 2. Check for browser compatibility
                 const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
                 if (!isSecureContext) {
                    setCameraError("Camera access requires a secure (HTTPS) connection. Please check your URL.");
                    isInitializing.current = false;
                    return;
                 }

                 if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setCameraError("Your browser doesn't support camera access. Use Chrome, Safari, or a standalone browser.");
                    isInitializing.current = false;
                    return;
                 }

                 // 4. Cleanup existing instance
                 if (scannerRef.current) {
                     try {
                        if (scannerRef.current.isScanning) {
                            await scannerRef.current.stop();
                        }
                        scannerRef.current.clear();
                     } catch (e) {}
                 }

                 const html5QrCode = new Html5Qrcode("reader");
                 scannerRef.current = html5QrCode;

                 // 5. Detailed Camera Selection
                 try {
                    const cameras = await Html5Qrcode.getCameras();
                    if (!cameras || cameras.length === 0) {
                        throw new Error("No cameras found");
                    }

                    // Choose camera based on facingMode
                    let cameraId = cameras[0].id;
                    
                    if (facingMode === "environment") {
                        const backCamera = cameras.find(c => 
                            c.label.toLowerCase().includes('back') || 
                            c.label.toLowerCase().includes('rear') ||
                            c.label.toLowerCase().includes('environment')
                        );
                        if (backCamera) cameraId = backCamera.id;
                    } else {
                        const frontCamera = cameras.find(c => 
                            c.label.toLowerCase().includes('front') || 
                            c.label.toLowerCase().includes('user') ||
                            c.label.toLowerCase().includes('face')
                        );
                        if (frontCamera) cameraId = frontCamera.id;
                    }
                    
                    const config = { 
                        fps: 15, // Smooth scanning
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        disableFlip: facingMode === "environment" // Don't mirror back camera
                    };
                    
                    await html5QrCode.start(
                        cameraId, 
                        config, 
                        onScanSuccess, 
                        () => {} // Silent scan failures
                    );

                    setIsCameraActive(true);
                    setCameraError(null);
                 } catch (startErr) {
                    console.warn("Camera selection failed, trying basic facingMode fallback...", startErr);
                    
                    // Fallback to basic mode
                    await html5QrCode.start(
                        { facingMode: facingMode }, 
                        { fps: 10, qrbox: { width: 250, height: 250 } }, 
                        onScanSuccess, 
                        () => {}
                    );
                    
                    setIsCameraActive(true);
                    setCameraError(null);
                 }

             } catch (err: any) {
                console.error("Scanner Error:", err);
                const errStr = String(err).toLowerCase();
                let msg = "Camera failed. Try reloading the page.";
                
                if (errStr.includes("notallowed") || errStr.includes("permission")) {
                    msg = "Permission denied. Please Allow camera access in your browser settings.";
                } else if (errStr.includes("notfound") || errStr.includes("not found")) {
                    msg = "No compatible camera found.";
                } else if (errStr.includes("in use") || errStr.includes("readable")) {
                    msg = "Camera is already in use by another tab or app.";
                } else if (errStr.includes("constrained")) {
                    msg = "Camera configuration not supported on this device.";
                }
                
                setCameraError(msg);
                toast({ title: "Camera Failure", description: msg, variant: "destructive" });
             } finally {
                 isInitializing.current = false;
             }
         }
    };

    useEffect(() => {
        const session = getWatchmanSession();
        if (!session) {
            navigate("/watchman-login");
            return;
        }
        setWatchman(session);

        let timer: any;
        if (activeView === "scanner" && isScanning) {
            // Give the DOM a moment to render the #reader element
            timer = setTimeout(() => {
                initScanner();
            }, 1000);
        }

        fetchOutStudents();
        fetchHistory();

        return () => {
            if (timer) clearTimeout(timer);
            
            // Cleanup scanner when view changes or component unmounts
            if (scannerRef.current && scannerRef.current.isScanning && !stopInProgress.current) {
                stopInProgress.current = true;
                const currentScanner = scannerRef.current;
                currentScanner.stop().finally(() => {
                    stopInProgress.current = false;
                    setIsCameraActive(false);
                }).catch((err) => {
                    console.warn("Error stopping scanner in cleanup:", err);
                    stopInProgress.current = false;
                    setIsCameraActive(false);
                });
            } else {
                setIsCameraActive(false);
            }
        };
    }, [isScanning, facingMode, activeView, navigate]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    const onScanSuccess = (decodedText: string) => {
        const cleanId = decodedText.toLowerCase().trim();
        console.log("Scanned ID:", cleanId);
        setScannedId(cleanId);
        setIsScanning(false);
        handleViewDetails(cleanId);
        
        // Vibrate if supported
        if ("vibrate" in navigator) {
            navigator.vibrate(200);
        }
    };

    const onScanError = (errorMessage: string) => {
        // console.warn("Scan error:", errorMessage);
    };

    const handleViewDetails = async (id: string) => {
        setLoading(true);
        setIsPassDetailOpen(true);
        try {
            const { data: pass, error: passError } = await (supabase as any)
                .from("gate_passes")
                .select("*")
                .eq("id", id)
                .single();

            if (passError || !pass) {
                toast({ title: "Error", description: "Could not fetch pass details", variant: "destructive" });
                setIsPassDetailOpen(false);
                return;
            }

            setPassDetails(pass);

            const { data: student, error: studentError } = await (supabase as any)
                .from("students")
                .select("*")
                .eq("id", pass.student_id)
                .single();

            if (student) setStudentDetails(student);

             const { data: appData } = await (supabase as any)
                .from("hostel_applications")
                .select("photo_url, father_name")
                .eq("student_name", pass.student_name)
                .maybeSingle();
            
            if (appData) {
                setStudentDetails((prev: any) => ({ ...prev, photo_url: prev.photo_url || appData.photo_url, father_name: appData.father_name }));
            }

        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchOutStudents = async () => {
        try {
            const { data } = await (supabase as any)
                .from("students")
                .select("*")
                .eq("status", "OUT")
                .order("student_name", { ascending: true });
            if (data) setOutStudents(data);
        } catch (e) {}
    };

    const fetchHistory = async () => {
        try {
            const { data } = await (supabase as any)
                .from("gate_passes")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(10);
            if (data) setRecentHistory(data);
        } catch (e) {}
    };

    const deleteLog = async (id: string) => {
        if (!confirm("Are you sure you want to delete this log entry?")) return;
        try {
            const { error } = await (supabase as any)
                .from("gate_passes")
                .delete()
                .eq("id", id);
            
            if (error) throw error;
            
            toast({ title: "Log Deleted", description: "The gate pass record has been removed." });
            fetchHistory();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const clearAllLogs = async () => {
        if (!confirm("CRITICAL ACTION: Are you sure you want to delete ALL gate pass history? This cannot be undone.")) return;
        try {
            const { error } = await (supabase as any)
                .from("gate_passes")
                .delete()
                .neq("id", "0"); // Delete all
            
            if (error) throw error;
            
            toast({ title: "History Cleared", description: "All gate pass records have been removed." });
            fetchHistory();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleAction = async (action: "EXIT" | "ENTRY") => {
        if (!passDetails || !studentDetails) return;
        setProcessing(true);

        try {
            const now = new Date().toISOString();
            
            if (action === "EXIT") {
                if (studentDetails.status === "OUT") {
                    toast({ title: "Invalid Action", description: "Student is already OUT", variant: "destructive" });
                    return;
                }
                
                // Update student to OUT
                await (supabase as any).from("students").update({ status: "OUT" }).eq("id", studentDetails.id);
                // Update pass exit_time
                await (supabase as any).from("gate_passes").update({ exit_time: now }).eq("id", passDetails.id);
                
                toast({ title: "Exit Confirmed", description: `${studentDetails.student_name} is now OUT` });
            } else {
                if (studentDetails.status === "IN") {
                    toast({ title: "Invalid Action", description: "Student is already IN", variant: "destructive" });
                    return;
                }
                
                // Update student to IN
                await (supabase as any).from("students").update({ status: "IN" }).eq("id", studentDetails.id);
                // Update pass to completed and set entry_time
                await (supabase as any).from("gate_passes").update({ entry_time: now, status: "completed" }).eq("id", passDetails.id);
                
                // Clear any overdue alerts (Delete them so they disappear immediately)
                await (supabase as any)
                    .from("overdue_alerts")
                    .delete()
                    .eq("student_id", studentDetails.id);
                
                toast({ title: "Entry Confirmed", description: `${studentDetails.student_name} is now IN` });
            }

            fetchOutStudents();
            fetchHistory();
            resetScanner();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const resetScanner = () => {
        setScannedId(null);
        setPassDetails(null);
        setStudentDetails(null);
        setManualId("");
        setIsScanning(true);
    };

    const handleReportIncident = async () => {
        if (!watchman || !incidentType || !incidentDescription) {
            toast({ title: "Error", description: "Please provide incident type and description", variant: "destructive" });
            return;
        }

        setIsReporting(true);
        try {
            const { error } = await supabase.from("security_incidents").insert({
                watchman_id: watchman.id,
                watchman_name: watchman.name,
                incident_type: incidentType,
                description: incidentDescription,
                status: "pending"
            });

            if (error) throw error;

            toast({ title: "Incident Reported", description: "The incident has been logged and notified to administration." });
            setIsIncidentDialogOpen(false);
            setIncidentType("");
            setIncidentDescription("");
        } catch (e: any) {
            toast({ title: "Failure", description: e.message, variant: "destructive" });
        } finally {
            setIsReporting(false);
        }
    };

    const handleLogout = () => {
        clearWatchmanSession();
        navigate("/");
    };

    const isExitTime = studentDetails?.status === "IN" && passDetails?.status === "approved";
    const isEntryTime = studentDetails?.status === "OUT" && passDetails?.status === "approved" && passDetails?.exit_time;

    if (!watchman) {
      return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            {showLoader && <TerminalLoader onComplete={() => {
                setShowLoader(false);
                sessionStorage.removeItem("show_terminal_loader");
            }} />}
            <div className={`min-h-screen bg-neutral-50 flex flex-col pb-10 transition-all duration-700 ${showLoader ? "pointer-events-none select-none opacity-60" : ""}`}>
            <CollegeHeader />
            
            <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none italic">Gate Console</h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            Officer: {watchman?.name || "Accessing..."}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-neutral-400 hover:text-red-600">
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            <div className="container mx-auto px-4 max-w-md mt-6 flex-1 mb-24">
                {activeView === "scanner" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {isScanning ? (
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white ring-1 ring-black/5">
                                <CardHeader className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white text-center pb-12">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl font-black italic tracking-tight">INTEL SCANNER</CardTitle>
                                    <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest">Scanning Authorization Tokens</p>
                                </CardHeader>
                                <CardContent className="-mt-8 p-4 relative">
                                    <div className="relative w-full aspect-square bg-neutral-100 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden ring-1 ring-black/5">
                                        <div id="reader" className="w-full h-full"></div>
                                        
                                        {!isCameraActive && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 bg-neutral-100/90 backdrop-blur-sm">
                                                {!cameraError && (
                                                    <>
                                                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Warming Up Lens...</p>
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            className="mt-2 rounded-2xl h-11 px-8 font-black uppercase text-[10px] shadow-lg"
                                                            onClick={() => initScanner()}
                                                        >
                                                            Force Activate
                                                        </Button>
                                                    </>
                                                )}
                                                
                                                {cameraError && (
                                                    <>
                                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-0 text-red-600">
                                                            <Camera className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="font-black text-neutral-900 italic">SYSTEM BLOCKED</h3>
                                                        <p className="text-[10px] text-neutral-500 max-w-[220px] leading-relaxed font-medium">
                                                            {cameraError}
                                                        </p>
                                                        <div className="flex flex-col gap-2 w-full px-8">
                                                            <Button 
                                                                className="rounded-2xl h-12 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                                                                onClick={() => initScanner()}
                                                            >
                                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                                Re-Initialize
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Scanner Overlay UI */}
                                        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/10"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary/50 rounded-3xl pointer-events-none">
                                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/30 animate-pulse"></div>
                                        </div>
                                    </div>
                                    {isScanning && !cameraError && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="absolute top-6 right-6 rounded-full bg-white/80 backdrop-blur-md border border-neutral-200 shadow-xl text-neutral-600 font-bold text-[9px] uppercase tracking-tighter z-20"
                                            onClick={toggleCamera}
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Flip Lens
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
                                <div className="relative flex justify-center"><span className="bg-neutral-50 px-4 text-[10px] text-neutral-400 font-black uppercase tracking-widest">Manual Override</span></div>
                            </div>

                            <Card className="border-none shadow-xl rounded-3xl bg-white p-2">
                                <CardContent className="p-2 flex gap-2">
                                    <Input 
                                        placeholder="EX: GP-12345" 
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                        className="h-14 rounded-2xl bg-neutral-50 border-none shadow-inner font-bold placeholder:text-neutral-300"
                                    />
                                    <Button className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20" onClick={() => onScanSuccess(manualId)} disabled={!manualId}>
                                        <Search className="w-5 h-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                      ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                          {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Authenticating...</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                                <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white ring-1 ring-black/5">
                                    <div className={`p-8 pb-20 text-white text-center relative ${passDetails?.status === 'completed' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-primary to-primary/80'}`}>
                                        <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-[9px] mb-4 px-4 py-1.5 uppercase tracking-[0.15em] font-black rounded-full backdrop-blur-md">
                                            {passDetails?.pass_type === "leave" ? "Official Leave Verified" : "Gate Entry Authorization"}
                                        </Badge>
                                        <h2 className="text-3xl font-black tracking-tighter italic uppercase">{passDetails?.student_name}</h2>
                                        <div className="flex items-center justify-center gap-2 mt-2 opacity-80">
                                          <p className="font-mono font-bold text-xs">{passDetails?.roll_number}</p>
                                          <span className="w-1 h-1 rounded-full bg-white/40"></span>
                                          <p className="text-[10px] font-black uppercase tracking-widest">{passDetails?.branch}</p>
                                        </div>
                                    </div>

                                    <div className="relative flex justify-center -mt-16">
                                        <div className="w-40 h-40 rounded-[2.5rem] border-[8px] border-white shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
                                            {studentDetails?.photo_url ? (
                                                <img 
                                                    src={studentDetails.photo_url} 
                                                    alt="Student" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300">
                                                    <User className="w-16 h-16" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <CardContent className="pt-8 px-6 pb-8 space-y-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100 shadow-inner">
                                                <span className="text-[9px] uppercase tracking-[0.1em] font-black text-neutral-400 block mb-2 text-center">Authorization</span>
                                                <Badge className={`
                                                    w-full flex justify-center py-2 rounded-2xl text-[10px] font-black
                                                    ${passDetails?.status === 'approved' ? 'bg-emerald-500 text-white' : 
                                                      passDetails?.status === 'completed' ? 'bg-blue-500 text-white' : 
                                                      'bg-amber-500 text-white'}
                                                    border-none uppercase tracking-widest
                                                `}>
                                                    {passDetails?.status}
                                                </Badge>
                                            </div>
                                            <div className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100 shadow-inner">
                                                <span className="text-[9px] uppercase tracking-[0.1em] font-black text-neutral-400 block mb-2 text-center">Base Location</span>
                                                <Badge className={`
                                                    w-full flex justify-center py-2 rounded-2xl text-[10px] font-black
                                                    ${studentDetails?.status === 'IN' ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}
                                                    border-none uppercase tracking-widest
                                                `}>
                                                    {studentDetails?.status || "IN"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-200/50 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                                <Phone className="w-12 h-12 text-amber-600" />
                                            </div>
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-2">Subject Narrative</h4>
                                            <p className="text-sm font-bold text-amber-900 leading-relaxed italic pr-12">
                                                "{passDetails?.purpose}"
                                            </p>
                                        </div>

                                        {(passDetails?.exit_time || passDetails?.entry_time) && (
                                            <div className="space-y-4 p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 shadow-inner">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Operation Logs</h3>
                                                <div className="space-y-3">
                                                  {passDetails.exit_time && (
                                                      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-neutral-100">
                                                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                                            <DoorOpen className="w-4 h-4" />
                                                          </div>
                                                          <div>
                                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Exited Point</p>
                                                            <p className="text-xs font-bold text-neutral-900">{new Date(passDetails.exit_time).toLocaleString()}</p>
                                                          </div>
                                                      </div>
                                                  )}
                                                  {passDetails.entry_time && (
                                                      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-neutral-100">
                                                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                            <Check className="w-4 h-4" />
                                                          </div>
                                                          <div>
                                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Verified Entry</p>
                                                            <p className="text-xs font-bold text-neutral-900">{new Date(passDetails.entry_time).toLocaleString()}</p>
                                                          </div>
                                                      </div>
                                                  )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {isExitTime && (
                                                <Button 
                                                    onClick={() => handleAction("EXIT")} 
                                                    disabled={processing}
                                                    className="w-full h-18 rounded-[2rem] text-xl font-black tracking-tighter bg-red-600 hover:bg-red-700 shadow-2xl shadow-red-200 border-b-4 border-red-800 transition-all active:translate-y-1 active:border-b-0 py-6"
                                                >
                                                    {processing ? <Loader2 className="animate-spin mr-2" /> : <DoorOpen className="w-6 h-6 mr-3" />}
                                                    EXECUTE EXIT
                                                </Button>
                                            )}
                                            
                                            {isEntryTime && (
                                                <Button 
                                                    onClick={() => handleAction("ENTRY")} 
                                                    disabled={processing}
                                                    className="w-full h-18 rounded-[2rem] text-xl font-black tracking-tighter bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-200 border-b-4 border-emerald-800 transition-all active:translate-y-1 active:border-b-0 py-6"
                                                >
                                                    {processing ? <Loader2 className="animate-spin mr-2" /> : <House className="w-6 h-6 mr-3" />}
                                                    EXECUTE ENTRY
                                                </Button>
                                            )}

                                            {passDetails?.status === 'completed' && (
                                                <div className="text-center p-8 bg-blue-50 rounded-[2rem] border-2 border-dashed border-blue-200">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                                                      <Check className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="text-blue-900 font-black tracking-widest uppercase text-xs">Lifecycle Completed</h3>
                                                    <p className="text-[10px] text-blue-600 mt-2 font-bold uppercase">Subject is currently accounted for.</p>
                                                </div>
                                            )}

                                            <Button variant="ghost" className="w-full h-14 rounded-2xl text-neutral-400 font-black uppercase tracking-widest text-[10px] hover:bg-neutral-100" onClick={resetScanner}>
                                                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Scanner
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                )}

                {activeView === "outList" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                            <div>
                              <h3 className="text-xl font-black italic tracking-tight text-neutral-900">Out Students</h3>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Active Subjects in Field</p>
                            </div>
                            <Badge className="bg-red-500 text-white border-none font-black h-8 px-4 rounded-full shadow-lg shadow-red-200">
                                {outStudents.length} TOTAL
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pb-20">
                            {outStudents.map((s) => (
                                <Card key={s.id} className="border-none shadow-xl rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer ring-1 ring-black/5" onClick={() => {
                                    handleViewDetails(s.roll_number); 
                                }}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-inner group relative">
                                            {s.photo_url ? (
                                                <img src={s.photo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                    <User className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black italic text-neutral-900 truncate uppercase">{s.student_name}</p>
                                            <p className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase mb-1">{s.roll_number}</p>
                                            <div className="flex items-center gap-2">
                                              <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black px-2 py-0">
                                                {s.branch || 'GENERAL'}
                                              </Badge>
                                              <span className="text-[9px] font-bold text-neutral-300">|</span>
                                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Exited Campus</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                                          <ArrowLeft className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {outStudents.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-xl ring-1 ring-black/5 border-2 border-dashed border-neutral-100">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                      <Check className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-black italic text-neutral-900 uppercase">Perimeter Secure</h3>
                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2 max-w-[200px] mx-auto">All students are currently accounted for inside the campus.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeView === "history" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                            <div>
                              <h3 className="text-xl font-black italic tracking-tight text-neutral-900">Intelligence Logs</h3>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Recent Movement History</p>
                            </div>
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={clearAllLogs} 
                                className="h-8 rounded-full text-[10px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50"
                             >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
                             </Button>
                             <Button variant="ghost" size="sm" onClick={fetchHistory} className="rounded-full h-8 w-8 p-0 hover:bg-neutral-200">
                                <RefreshCw className="w-4 h-4 text-neutral-400" />
                             </Button>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] shadow-2xl ring-1 ring-black/5 divide-y divide-neutral-50 overflow-hidden mb-20">
                        {recentHistory.map((log) => (
                            <div key={log.id} className="p-5 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-4 group cursor-pointer" onClick={() => {
                                handleViewDetails(log.id);
                            }}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black italic text-neutral-900 truncate uppercase text-sm tracking-tight">{log.student_name}</p>
                                        <Badge className={`text-[8px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${log.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
                                            {log.pass_type === 'leave' ? 'LEAVE ' : ''}{log.status === 'completed' ? 'ENTRY' : 'EXIT'}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 font-bold tracking-[0.1em]">{log.roll_number}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center justify-end gap-1.5 mb-1">
                                          {log.entry_time ? <House className="w-3 h-3 text-emerald-500" /> : <DoorOpen className="w-3 h-3 text-red-500" />}
                                          <p className="text-[9px] font-black text-neutral-900 uppercase tracking-tighter">
                                              {log.entry_time ? "RETURNED" : "EXITED"}
                                          </p>
                                        </div>
                                        <p className="text-[10px] font-bold text-neutral-400 font-mono">
                                            {new Date(log.entry_time || log.exit_time || log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-8 h-8 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteLog(log.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                            {recentHistory.length === 0 && (
                                <div className="text-center py-20 px-10">
                                    <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-300">
                                      <Calendar className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">No Operation Logs Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pass Details Dialog Overlay */}
            <Dialog open={isPassDetailOpen} onOpenChange={setIsPassDetailOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[2.5rem] bg-neutral-50 shadow-2xl ring-1 ring-black/10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Retreiving Intelligence...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <div className={`p-8 pb-20 text-white text-center relative ${passDetails?.status === 'completed' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-primary to-primary/80'}`}>
                                <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-[9px] mb-4 px-4 py-1.5 uppercase tracking-[0.15em] font-black rounded-full backdrop-blur-md">
                                    {passDetails?.pass_type === "leave" ? "Official Leave verified" : "Gate Entry Authorization"}
                                </Badge>
                                <h2 className="text-3xl font-black tracking-tighter italic uppercase truncate px-4">{passDetails?.student_name}</h2>
                                <div className="flex items-center justify-center gap-2 mt-2 opacity-80">
                                    <p className="font-mono font-bold text-xs">{passDetails?.roll_number}</p>
                                    <span className="w-1 h-1 rounded-full bg-white/40"></span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{passDetails?.branch}</p>
                                </div>
                            </div>

                            <div className="relative flex justify-center -mt-16">
                                <div className="w-40 h-40 rounded-[2.5rem] border-[8px] border-white shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
                                    {studentDetails?.photo_url ? (
                                        <img 
                                            src={studentDetails.photo_url} 
                                            alt="Student" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300">
                                            <User className="w-16 h-16" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 px-6 pb-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm text-center">
                                        <span className="text-[9px] uppercase tracking-[0.1em] font-black text-neutral-400 block mb-2">Gate Status</span>
                                        <Badge className={`
                                            w-full flex justify-center py-2 rounded-2xl text-[10px] font-black
                                            ${passDetails?.status === 'approved' ? 'bg-emerald-500 text-white' : 
                                              passDetails?.status === 'completed' ? 'bg-blue-500 text-white' : 
                                              'bg-amber-500 text-white'}
                                            border-none uppercase tracking-widest
                                        `}>
                                            {passDetails?.status}
                                        </Badge>
                                    </div>
                                    <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm text-center">
                                        <span className="text-[9px] uppercase tracking-[0.1em] font-black text-neutral-400 block mb-2">Perimeter</span>
                                        <Badge className={`
                                            w-full flex justify-center py-2 rounded-2xl text-[10px] font-black
                                            ${studentDetails?.status === 'IN' ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}
                                            border-none uppercase tracking-widest
                                        `}>
                                            {studentDetails?.status || "IN"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-200/50 text-center">
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-2">Authorization Narrative</h4>
                                    <p className="text-sm font-bold text-amber-900 leading-relaxed italic">
                                        "{passDetails?.purpose || "N/A"}"
                                    </p>
                                </div>

                                {(passDetails?.exit_time || passDetails?.entry_time) && (
                                    <div className="space-y-3 p-6 bg-white rounded-[2rem] border border-neutral-100 shadow-sm">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 text-center">Operational Data</h3>
                                        <div className="space-y-3">
                                            {passDetails.exit_time && (
                                                <div className="flex items-center justify-between text-xs font-bold border-b border-neutral-50 pb-2">
                                                    <span className="text-neutral-400 uppercase tracking-widest text-[9px]">Exit</span>
                                                    <span className="text-red-500">{new Date(passDetails.exit_time).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {passDetails.entry_time && (
                                                <div className="flex items-center justify-between text-xs font-bold border-b border-neutral-50 pb-2">
                                                    <span className="text-neutral-400 uppercase tracking-widest text-[9px]">Entry</span>
                                                    <span className="text-emerald-500">{new Date(passDetails.entry_time).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    {(studentDetails?.status === "IN" && passDetails?.status === "approved") && (
                                        <Button 
                                            onClick={() => {
                                                handleAction("EXIT");
                                                setIsPassDetailOpen(false);
                                            }} 
                                            disabled={processing}
                                            className="w-full h-16 rounded-[2rem] text-lg font-black tracking-tighter bg-red-600 hover:bg-red-700 shadow-2xl border-b-4 border-red-800 py-6"
                                        >
                                            {processing ? <Loader2 className="animate-spin mr-2" /> : <DoorOpen className="w-6 h-6 mr-2" />}
                                            EXECUTE EXIT
                                        </Button>
                                    )}
                                    
                                    {(studentDetails?.status === "OUT" && passDetails?.status === "approved" && passDetails?.exit_time) && (
                                        <Button 
                                            onClick={() => {
                                                handleAction("ENTRY");
                                                setIsPassDetailOpen(false);
                                            }} 
                                            disabled={processing}
                                            className="w-full h-16 rounded-[2rem] text-lg font-black tracking-tighter bg-emerald-600 hover:bg-emerald-700 shadow-2xl border-b-4 border-emerald-800 py-6"
                                        >
                                            {processing ? <Loader2 className="animate-spin mr-2" /> : <House className="w-6 h-6 mr-2" />}
                                            EXECUTE ENTRY
                                        </Button>
                                    )}

                                    <Button variant="ghost" className="w-full h-12 rounded-2xl text-neutral-400 font-bold uppercase tracking-widest text-[10px] mt-2" onClick={() => setIsPassDetailOpen(false)}>
                                        Close Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Floating Intelligence Navigation */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-18 bg-neutral-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 p-2 flex items-center justify-between z-50">
                <button 
                  onClick={() => setActiveView("scanner")}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-[2rem] transition-all duration-300 ${activeView === "scanner" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white/60"}`}
                >
                  <Camera className={`w-5 h-5 ${activeView === "scanner" ? "animate-pulse" : ""}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Scanner</span>
                </button>
                <button 
                  onClick={() => setActiveView("outList")}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-[2rem] transition-all duration-300 ${activeView === "outList" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white/60"}`}
                >
                  <DoorOpen className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Out</span>
                  {outStudents.length > 0 && (
                    <span className="absolute top-3 right-[38%] w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900 flex items-center justify-center text-[6px] font-black text-white">
                      {outStudents.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveView("history")}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-[2rem] transition-all duration-300 ${activeView === "history" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white/60"}`}
                >
                  <RefreshCw className={`w-5 h-5 ${activeView === "history" ? "rotate-180" : ""}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Logs</span>
                </button>
                <button 
                  onClick={() => setIsIncidentDialogOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-[2rem] text-red-400 hover:text-red-500 hover:bg-white/5 transition-all"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Alert</span>
                </button>
            </div>

            {/* Security Incident Dialog */}
            <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
                <DialogContent className="max-w-sm rounded-[2rem] border-none bg-white p-0 overflow-hidden shadow-2xl">
                    <div className="bg-red-600 p-8 text-white text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black italic tracking-tight">REPORT INCIDENT</h3>
                        <p className="text-red-100/70 text-[10px] font-bold uppercase tracking-widest mt-1">Official Security Alert Log</p>
                    </div>
                    
                    <div className="p-6 space-y-4 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Incident Category</Label>
                            <select 
                                value={incidentType} 
                                onChange={(e) => setIncidentType(e.target.value)}
                                className="w-full h-12 rounded-2xl bg-neutral-50 px-4 text-sm font-bold border-none shadow-inner outline-none focus:ring-2 ring-red-500/20"
                            >
                                <option value="">Select Category...</option>
                                <option value="Unauthorized Entry">Unauthorized Entry</option>
                                <option value="Property Damage">Property Damage</option>
                                <option value="Suspicious Activity">Suspicious Activity</option>
                                <option value="Student Disciplinary">Student Disciplinary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Incident Description</Label>
                            <textarea 
                                value={incidentDescription}
                                onChange={(e) => setIncidentDescription(e.target.value)}
                                placeholder="Describe the situation in detail..."
                                className="w-full h-24 rounded-2xl bg-neutral-50 p-4 text-sm font-bold border-none shadow-inner outline-none focus:ring-2 ring-red-500/20 resize-none"
                            ></textarea>
                        </div>
                        
                        <div className="pt-2 flex gap-3">
                            <Button 
                                variant="ghost" 
                                className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-50"
                                onClick={() => setIsIncidentDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200"
                                onClick={handleReportIncident}
                                disabled={isReporting}
                            >
                                {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "File Report"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </>
    );
};

export default WatchmanDashboard;
