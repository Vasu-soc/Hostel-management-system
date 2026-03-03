import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Users,
  Pill,
  Building2,
  GraduationCap,
  ShieldCheck,
  UserCircle,
  Home,
  Phone,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import CollegeHeader from "@/components/CollegeHeader";
import ImageCarousel from "@/components/ImageCarousel";
import FoodMenu from "@/components/FoodMenu";
import AdministrationProfiles from "@/components/AdministrationProfiles";
import { supabase } from "@/integrations/supabase/client";

interface Medicine {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  warden_type: string;
}

const loginOptions = [
  { value: "boys", label: "Boys", enabled: true, icon: Users },
  { value: "girls", label: "Girls", enabled: true, icon: Users },
  { value: "admin", label: "Admin", enabled: true, icon: ShieldCheck },
  { value: "warden", label: "Hostel Warden", enabled: true, icon: UserCircle },
  { value: "parent", label: "Parent", enabled: true, icon: Home },
];

const hostelRules = [
  "Students must return to hostel by 9:00 PM on weekdays and 10:00 PM on weekends.",
  "Gate pass is mandatory for leaving the hostel premises.",
  "Visitors are allowed only during visiting hours (4:00 PM - 6:00 PM on Sundays).",
  "Ragging in any form is strictly prohibited and punishable.",
  "Students must maintain silence in hostel rooms after 10:00 PM.",
  "Consumption of alcohol, drugs, or smoking is strictly prohibited.",
  "Students are responsible for the safety of their belongings.",
  "Electrical appliances like heaters and irons are not allowed in rooms.",
  "Students must keep their rooms clean and tidy at all times.",
  "Any damage to hostel property will be charged to the student.",
  "Students must inform warden before leaving for home/outing.",
  "Mobile phones should be in silent mode during study hours.",
  "Mess timings must be strictly followed.",
  "Students must carry ID cards at all times inside hostel premises.",
  "Parents can contact warden for any emergency situations.",
];

const WARDEN_CONTACT = "9553866278";

const Index = () => {
  const [selectedLogin, setSelectedLogin] = useState<string>("");
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    fetchMedicines();

    // Real-time subscription for medicines
    const channel = supabase
      .channel("medicines-public")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medicines",
        },
        () => {
          fetchMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMedicines = async () => {
    const { data } = await supabase
      .from("medicines")
      .select("*")
      .eq("is_available", true)
      .order("name");

    if (data) {
      setMedicines(data as Medicine[]);
    }
  };

  const handleLoginSelect = (value: string) => {
    setSelectedLogin(value);
  };

  const getLoginPath = () => {
    if (selectedLogin === "boys" || selectedLogin === "girls") {
      return `/student-login?gender=${selectedLogin}`;
    } else if (selectedLogin === "warden") {
      return "/warden-login";
    } else if (selectedLogin === "parent") {
      return "/parent-login";
    } else if (selectedLogin === "admin") {
      return "/admin-login";
    }
    return "#";
  };

  const isLoginEnabled = loginOptions.find(
    (opt) => opt.value === selectedLogin
  )?.enabled;

  const handleContactWarden = () => {
    window.open(`https://wa.me/91${WARDEN_CONTACT}`, "_blank");
  };

  const handleEmergencyCall = () => {
    window.location.href = `tel:${WARDEN_CONTACT}`;
  };

  const selectedMedicineData = medicines.find(m => m.name === selectedMedicine);

  return (
    <div className="min-h-screen grid-motion-bg">
      <CollegeHeader />

      {/* Image Carousel Section */}
      <ImageCarousel />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Welcome Title */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Welcome to{" "}
            <span className="text-gradient">Hostel Management System</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Streamlined hostel administration for students, wardens, and staff
          </p>
        </div>

        {/* Administration Profiles Section */}
        <AdministrationProfiles />

        {/* Three Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Hostel Application Form Card */}
          <Card
            className="card-hover border-2 border-border bg-card/80 backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 float-animation">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Hostel Application Form
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Apply for hostel accommodation with room selection and fee
                details
              </p>
              <Link to="/hostel-application">
                <Button variant="hero" size="lg" className="w-full">
                  <Building2 className="w-5 h-5" />
                  Apply Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Choose Login Card */}
          <Card
            className="card-hover border-2 border-border bg-card/80 backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full gradient-secondary flex items-center justify-center mb-4 float-animation">
                <GraduationCap className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Choose Login
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={handleLoginSelect} value={selectedLogin}>
                <SelectTrigger className="w-full h-12 text-base bg-background">
                  <SelectValue placeholder="Select login type..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-2 border-border z-50">
                  {loginOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={!option.enabled}
                      className={`py-3 ${!option.enabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        <span>{option.label}</span>
                        {!option.enabled && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Coming Soon)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLogin && isLoginEnabled && (
                <Link to={getLoginPath()}>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="w-full mt-4 glare-hover"
                  >
                    Continue to Login
                  </Button>
                </Link>
              )}

              {selectedLogin && !isLoginEnabled && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  This login option will be available soon
                </p>
              )}
            </CardContent>
          </Card>

          {/* Medicine Availability Card */}
          <Card
            className="card-hover border-2 border-border bg-card/80 backdrop-blur-sm animate-fade-in md:col-span-2 lg:col-span-1"
            style={{ animationDelay: "0.3s" }}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success flex items-center justify-center mb-4 float-animation">
                <Pill className="w-8 h-8 text-success-foreground" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Medicine Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicines.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No medicines currently available</p>
                  <p className="text-xs mt-1">Check back later</p>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={setSelectedMedicine}
                    value={selectedMedicine}
                  >
                    <SelectTrigger className="w-full h-12 text-base bg-background">
                      <SelectValue placeholder="Check medicine..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-2 border-border z-50">
                      {medicines.map((med) => (
                        <SelectItem
                          key={med.id}
                          value={med.name}
                          className="py-3"
                        >
                          <div className="flex items-center gap-2">
                            <span>{med.icon}</span>
                            <span>{med.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedMedicineData && (
                    <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                      <p className="text-sm text-success flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        {selectedMedicineData.name} is available at the hostel medical room
                      </p>
                      {selectedMedicineData.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedMedicineData.description}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Food Menu Section */}
        <div className="mt-10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <FoodMenu />
        </div>

        {/* Quick Links Section */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-muted-foreground mb-4">Need help?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContactWarden}
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              Contact Warden
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmergencyCall}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <AlertCircle className="w-4 h-4" />
              Emergency
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRulesDialogOpen(true)}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Hostel Rules
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-muted-foreground text-sm border-t border-border bg-card/50 backdrop-blur-sm">
        <p>© 2024 Geethanjali Institute of Science & Technology. All rights reserved.</p>
      </footer>

      {/* Hostel Rules Dialog */}
      <Dialog open={rulesDialogOpen} onOpenChange={setRulesDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Hostel Rules & Regulations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {hostelRules.map((rule, index) => (
              <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
