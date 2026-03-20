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
import CollegeHeader from "@/components/CollegeHeader";
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
  RefreshCw
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

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isInitializing = useRef(false);
    const stopInProgress = useRef(false);

    const initScanner = async () => {
         if (isScanning && !isInitializing.current) {
             isInitializing.current = true;
             setCameraError(null);
             
             try {
                 // 1. Wait for reader element with a loop
                 let readerElement = document.getElementById("reader");
                 let attempts = 0;
                 while (!readerElement && attempts < 15) { // Increased attempts for slower mobiles
                     await new Promise(r => setTimeout(r, 200));
                     readerElement = document.getElementById("reader");
                     attempts++;
                 }

                 if (!readerElement) {
                     setCameraError("Camera preview area failed to load. Please refresh.");
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

                 // 3. Explicitly request camera permission first to force mobile browsers to prompt
                 try {
                     const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                     stream.getTracks().forEach(track => track.stop());
                     console.log("Camera permission explicitly granted");
                 } catch (permError) {
                     console.warn("Pre-request permission failed:", permError);
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

                    // Try to find rear camera
                    let cameraId = cameras[0].id;
                    const backCamera = cameras.find(c => 
                        c.label.toLowerCase().includes('back') || 
                        c.label.toLowerCase().includes('rear') ||
                        c.label.toLowerCase().includes('environment')
                    );
                    
                    if (backCamera) cameraId = backCamera.id;
                    
                    const config = { 
                        fps: 15, // Smooth scanning
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        disableFlip: true // Don't mirror back camera
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

        const timer = setTimeout(() => {
            initScanner();
        }, 1500); // Increased delay for mobile browser stabilization

        fetchOutStudents();
        fetchHistory();

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning && !stopInProgress.current) {
                stopInProgress.current = true;
                scannerRef.current.stop().finally(() => {
                    stopInProgress.current = false;
                    setIsCameraActive(false);
                }).catch(() => {});
            }
        };
    }, [isScanning, facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    const onScanSuccess = (decodedText: string) => {
        const cleanId = decodedText.toLowerCase().trim();
        console.log("Scanned ID:", cleanId);
        setScannedId(cleanId);
        setIsScanning(false);
        fetchPassDetails(cleanId);
        
        // Vibrate if supported
        if ("vibrate" in navigator) {
            navigator.vibrate(200);
        }
    };

    const onScanError = (errorMessage: string) => {
        // console.warn("Scan error:", errorMessage);
    };

    const fetchPassDetails = async (id: string) => {
        setLoading(true);
        try {
            const { data: pass, error: passError } = await (supabase as any)
                .from("gate_passes")
                .select("*")
                .eq("id", id)
                .single();

            if (passError || !pass) {
                toast({ title: "Error", description: "Invalid QR Code or Pass ID", variant: "destructive" });
                setIsScanning(true);
                return;
            }

            setPassDetails(pass);

            const { data: student, error: studentError } = await (supabase as any)
                .from("students")
                .select("*")
                .eq("id", pass.student_id)
                .single();

            if (student) setStudentDetails(student);

            // Also try to find photo from applications
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

    const handleLogout = () => {
        clearWatchmanSession();
        navigate("/watchman-login");
    };

    const isExitTime = studentDetails?.status === "IN" && passDetails?.status === "approved";
    const isEntryTime = studentDetails?.status === "OUT" && passDetails?.status === "approved" && passDetails?.exit_time;

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col pb-10">
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

            <div className="container mx-auto px-4 max-w-md mt-6 flex-1">
                {isScanning ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                        <Card className="overflow-hidden border-none shadow-xl rounded-3xl bg-white">
                            <CardHeader className="bg-primary p-6 text-white text-center pb-10">
                                <CardTitle className="text-xl font-black italic">Ready to Scan</CardTitle>
                                <p className="text-primary-foreground/70 text-xs">Align student QR code within the frame</p>
                            </CardHeader>
                            <CardContent className="-mt-6 p-4 relative">
                                <div className="relative w-full min-h-[300px] h-[300px] bg-neutral-100 rounded-2xl border-2 border-primary/20 shadow-inner overflow-hidden">
                                    <div id="reader" className="w-full h-full"></div>
                                    
                                    {!isCameraActive && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 bg-neutral-100/90 backdrop-blur-sm">
                                            {!cameraError && (
                                                <>
                                                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Requesting Permission...</p>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="mt-2 rounded-xl h-10 px-6 font-bold"
                                                        onClick={() => initScanner()}
                                                    >
                                                        Tap to Grant Access
                                                    </Button>
                                                </>
                                            )}
                                            
                                            {cameraError && (
                                                <>
                                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-0 text-red-600">
                                                        <Camera className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="font-bold text-neutral-900">Camera Blocked</h3>
                                                    <p className="text-[10px] text-neutral-500 max-w-[220px] leading-relaxed">
                                                        {cameraError}
                                                        <br />
                                                        <span className="text-primary font-bold mt-2 block">
                                                            Setup: Settings → Site Settings → Camera → Allow
                                                        </span>
                                                    </p>
                                                    <div className="flex flex-col gap-2 w-full px-8">
                                                        <Button 
                                                            className="rounded-xl h-11 bg-primary hover:bg-primary/90 font-bold"
                                                            onClick={() => initScanner()}
                                                        >
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            Retry Camera
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => window.location.reload()}
                                                            className="text-xs text-muted-foreground"
                                                        >
                                                            Full Page Refresh
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {isScanning && !cameraError && (
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="absolute top-4 right-4 rounded-full bg-white/50 backdrop-blur-md border border-neutral-200 shadow-sm text-neutral-600 hover:bg-white z-20"
                                        onClick={toggleCamera}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        {facingMode === "environment" ? "Front Camera" : "Back Camera"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-neutral-50 px-2 text-neutral-400 font-bold">Or Manual Entry</span></div>
                        </div>

                        <Card className="border-none shadow-md rounded-2xl">
                            <CardContent className="p-4 flex gap-2">
                                <Input 
                                    placeholder="Enter Pass ID manually..." 
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    className="h-12 rounded-xl"
                                />
                                <Button className="h-12 w-12 rounded-xl" onClick={() => onScanSuccess(manualId)} disabled={!manualId}>
                                    <Search className="w-5 h-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Fetching Details...</p>
                            </div>
                        ) : (
                            <>
                                 <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-white">
                                    <div className={`p-6 pb-16 text-white text-center ${passDetails?.status === 'completed' ? 'bg-blue-600' : 'bg-primary'}`}>
                                        <Badge className="bg-white/20 hover:bg-white/30 border-none text-white text-xs mb-3 px-3 py-1 uppercase tracking-widest font-bold">
                                            {passDetails?.pass_type === "leave" ? "Leave Form Result" : "Gate Pass Result"}
                                        </Badge>
                                        <h2 className="text-2xl font-black tracking-tight italic">{passDetails?.student_name}</h2>
                                        <p className="text-white/80 font-medium text-xs mb-1">{passDetails?.roll_number}</p>
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{passDetails?.branch}</p>
                                    </div>

                                    <div className="relative flex justify-center -mt-10">
                                        <div className="w-32 h-32 rounded-3xl border-[6px] border-white shadow-2xl overflow-hidden bg-white">
                                            {studentDetails?.photo_url ? (
                                                <img 
                                                    src={studentDetails.photo_url} 
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
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Pass Status</span>
                                                <Badge className={`
                                                    ${passDetails?.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                      passDetails?.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                                                      'bg-amber-100 text-amber-700'}
                                                    border-none font-bold uppercase py-1
                                                `}>
                                                    {passDetails?.status}
                                                </Badge>
                                            </div>
                                            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Current Location</span>
                                                <Badge className={`
                                                    ${studentDetails?.status === 'IN' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}
                                                    border-none font-bold uppercase py-1
                                                `}>
                                                    {studentDetails?.status || "IN"}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <h4 className="text-[10px] uppercase font-bold text-amber-600 mb-1">{passDetails?.pass_type === "leave" ? "Reason for Leave" : "Purpose of Visit"}</h4>
                                            <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                                                "{passDetails?.purpose}"
                                            </p>
                                        </div>

                                        {(passDetails?.exit_time || passDetails?.entry_time) && (
                                            <div className="space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Gate Logs</h3>
                                                {passDetails.exit_time && (
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                        <span className="text-neutral-500">Exited:</span>
                                                        <span className="font-bold">{new Date(passDetails.exit_time).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {passDetails.entry_time && (
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                        <span className="text-neutral-500">Returned:</span>
                                                        <span className="font-bold">{new Date(passDetails.entry_time).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="pt-4 space-y-3">
                                            {isExitTime && (
                                                <Button 
                                                    onClick={() => handleAction("EXIT")} 
                                                    disabled={processing}
                                                    className="w-full h-16 rounded-2xl text-lg font-black tracking-tight bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                                                >
                                                    {processing ? <Loader2 className="animate-spin mr-2" /> : <DoorOpen className="mr-2" />}
                                                    EXIT CONFIRM
                                                </Button>
                                            )}
                                            
                                            {isEntryTime && (
                                                <Button 
                                                    onClick={() => handleAction("ENTRY")} 
                                                    disabled={processing}
                                                    className="w-full h-16 rounded-2xl text-lg font-black tracking-tight bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                                >
                                                    {processing ? <Loader2 className="animate-spin mr-2" /> : <House className="mr-2" />}
                                                    ENTRY CONFIRM
                                                </Button>
                                            )}

                                            {passDetails?.status === 'completed' && (
                                                <div className="text-center p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                                                    <h3 className="text-blue-900 font-black">{passDetails?.pass_type === "leave" ? "LEAVE COMPLETED" : "PASS COMPLETED"}</h3>
                                                    <p className="text-xs text-blue-600 mt-1">This student has already returned.</p>
                                                </div>
                                            )}

                                            <Button variant="outline" className="w-full h-12 rounded-xl text-neutral-400" onClick={resetScanner}>
                                                <Camera className="w-4 h-4 mr-2" /> Scan Another Student
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                )}

                {/* Students Currently Out List */}
                <div className="mt-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                           <DoorOpen className="w-4 h-4" /> Students Currently Out ({outStudents.length})
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {outStudents.map((s) => (
                            <Card key={s.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                                // Find the most recent approved gate pass for this student if possible, or just search
                                setManualId(s.roll_number);
                                onScanSuccess(s.roll_number); 
                            }}>
                                <CardContent className="p-3 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                                        {s.photo_url ? (
                                            <img src={s.photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                <User className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{s.student_name}</p>
                                        <p className="text-[10px] text-neutral-400 font-mono uppercase">{s.roll_number}</p>
                                    </div>
                                    <Badge className="bg-red-50 text-red-600 border-none font-bold text-[10px]">OUT</Badge>
                                </CardContent>
                            </Card>
                        ))}
                        {outStudents.length === 0 && (
                            <div className="text-center py-10 opacity-30 italic text-sm">
                                All students are currently inside
                            </div>
                        )}
                    </div>
                </div>

                {/* Gate Logs / History */}
                <div className="mt-12 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Recent Gate Logs
                    </h3>
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 divide-y divide-neutral-100 overflow-hidden">
                        {recentHistory.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold truncate text-neutral-900">{log.student_name}</p>
                                        <Badge className={`text-[9px] uppercase font-black tracking-tighter ${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                            {log.pass_type === 'leave' ? 'Leave ' : ''}{log.status === 'completed' ? 'Return' : 'Exit'}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 font-mono">{log.roll_number}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase">
                                        {log.entry_time ? "Returned" : "Exited"}
                                    </p>
                                    <p className="text-[10px] text-neutral-400">
                                        {new Date(log.entry_time || log.exit_time || log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchmanDashboard;
