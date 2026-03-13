import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Menu, 
  Users, 
  Home, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  LogIn, 
  FileText, 
  Pill,
  GraduationCap,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import HostelAlbumGallery from "./HostelAlbumGallery";
import gisteduLogo from "@/assets/gistedu-logo.png";

const loginOptions = [
  {
    label: "Hostel Application Form",
    path: "/hostel-application",
    icon: FileText,
    color: "text-blue-500"
  },
  {
    label: "Register (Boys)",
    path: "/student-login?gender=boys&mode=register",
    icon: UserPlus,
    color: "text-accent"
  },
  {
    label: "Register (Girls)",
    path: "/student-login?gender=girls&mode=register",
    icon: UserPlus,
    color: "text-primary"
  },
  {
    label: "New Parent",
    path: "/parent-login?mode=register",
    icon: ShieldCheck,
    color: "text-success"
  },
];


const navigationLogins = [
  { label: "Boys Student", path: "/student-login?gender=boys", icon: Users, color: "text-blue-500" },
  { label: "Girls Student", path: "/student-login?gender=girls", icon: Users, color: "text-pink-500" },
  { label: "Hostel Warden", path: "/warden-login", icon: Shield, color: "text-orange-500" },
  { label: "College Admin", path: "/admin-login", icon: ShieldCheck, color: "text-red-500" },
  { label: "Parent Portal", path: "/parent-login", icon: GraduationCap, color: "text-green-500" },
];

const CollegeHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const fetchMedicines = async () => {
      const { data } = await supabase.from("medicines").select("*");
      if (data) setMedicines(data);
    };
    fetchMedicines();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full header-dynamic-bg shadow-xl border-b border-primary/20 transition-all duration-500">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-5">
        <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* Logo with GIST Text below */}
          <div className="flex flex-col items-center flex-shrink-0 group">
            <div className="relative float-animation">
              <img
                src={gisteduLogo}
                alt="GIST Logo"
                className="h-10 sm:h-20 md:h-24 lg:h-28 w-auto object-contain transition-transform duration-500 group-hover:scale-110 active:rotate-3"
                loading="eager"
              />
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
            <p className="text-[10px] sm:text-xs text-primary mt-1 sm:mt-2 text-center whitespace-nowrap font-black tracking-widest uppercase opacity-95">
              GIST
            </p>
          </div>

          {/* Text Content - Elegant and Dynamic */}
          <div className="flex flex-col min-w-0 flex-1 items-center text-center px-1 sm:px-2">
            <h1
              className="text-[11px] leading-tight sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-animated-gradient tracking-tight sm:tracking-normal drop-shadow-md select-none"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              GEETHANJALI INSTITUTE OF SCIENCE &amp; TECHNOLOGY
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-1.5 group">
              <div className="h-[1.5px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden sm:block transition-all duration-500 group-hover:w-16"></div>
              <p className="text-[9px] sm:text-sm md:text-base lg:text-lg xl:text-xl font-extrabold text-primary italic tracking-widest drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                (AUTONOMOUS INSTITUTION)
              </p>
              <div className="h-[1.5px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden sm:block transition-all duration-500 group-hover:w-16"></div>
            </div>
            <p className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs text-muted-foreground/80 mt-1 sm:mt-1.5 leading-snug sm:leading-relaxed max-w-[95%] sm:max-w-[85%] font-semibold tracking-wide border-t border-primary/10 pt-1 uppercase">
              3rd Mile, Nellore-Bombay Highway, Gangavaram(V), Kovur(Md), SPSR Nellore Dt. Andhra Pradesh, India - 524137.
            </p>
            
            {/* Quick Navigation Links with Dropdowns */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 sm:mt-3 border-t border-primary/5 pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-primary/5 transition-all text-[8px] sm:text-[10px] md:text-xs font-black italic tracking-widest text-primary group outline-none">
                    <LogIn className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>CHOOSE LOGINS</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-2 z-[100]">
                  {navigationLogins.map((login) => (
                    <DropdownMenuItem key={login.path} asChild>
                      <Link to={login.path} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-all cursor-pointer group">
                        <div className={`p-2 rounded-lg bg-background shadow-sm group-hover:bg-primary transition-all`}>
                          <login.icon className={`w-4 h-4 ${login.color} group-hover:text-primary-foreground`} />
                        </div>
                        <span className="font-bold text-sm group-hover:text-primary">{login.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/hostel-application" className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-success/5 transition-all text-[8px] sm:text-[10px] md:text-xs font-black italic tracking-widest text-success group">
                <FileText className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>HOSTEL APPLICATION FORM</span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-accent/5 transition-all text-[8px] sm:text-[10px] md:text-xs font-black italic tracking-widest text-accent group outline-none">
                    <Pill className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>MEDICINE AVAILABILITY</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-card/95 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-4 z-[100]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-2">
                      <Pill className="w-4 h-4 text-accent" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-accent">Current Stock</h4>
                    </div>
                    {medicines.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-none">
                        {medicines.map((med) => (
                          <div key={med.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-primary/5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{med.icon || "💊"}</span>
                              <span className="text-xs font-bold text-foreground">{med.name}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${med.quantity > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {med.quantity > 0 ? `QTY: ${med.quantity}` : "OUT"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-muted-foreground italic">No data available</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Menu Button + Theme Toggle - Only on home page */}
          {isHomePage && (
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {/* Album Gallery Icon */}
              <div className="animate-in slide-in-from-right duration-700 delay-300">
                <HostelAlbumGallery />
              </div>

              {/* Theme Toggle Button Style */}
              <div className="bg-muted/50 p-1 rounded-xl border border-primary/20 backdrop-blur-sm shadow-inner">
                <ThemeToggle />
              </div>

              {/* Unique Styled Menu Button */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25 border-b-4 border-primary-foreground/20"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[400px] border-l-2 border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                  <SheetHeader className="p-6 border-b border-primary/10 bg-muted/30 relative">
                    <SheetTitle className="flex items-center gap-3 text-2xl font-black italic text-primary">
                      <div className="p-2 bg-primary rounded-xl text-primary-foreground">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      JOIN HOSTEL
                    </SheetTitle>
                  </SheetHeader>

                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {loginOptions.map((option) => (
                          <Link
                            key={option.path}
                            to={option.path}
                            onClick={() => setMenuOpen(false)}
                            className="group"
                          >
                            <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-card hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                              <div className={`p-3 rounded-xl bg-card shadow-sm group-hover:bg-primary group-hover:scale-110 transition-all duration-300`}>
                                <option.icon className={`w-6 h-6 ${option.color} group-hover:text-primary-foreground`} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-lg group-hover:text-primary transition-colors">{option.label}</span>
                                <span className="text-xs text-muted-foreground font-medium">Create your new account</span>
                              </div>
                              <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <UserPlus className="w-5 h-5 text-primary" />
                              </div>
                              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Footer Toggle */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-primary/10 bg-muted/50">
                    <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-primary/10 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary italic">Visual Mode</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Customize Experience</span>
                      </div>
                      <div className="scale-110">
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CollegeHeader;