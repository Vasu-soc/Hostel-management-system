import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Check, Upload, Camera, PenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
// Removed college-header import - CollegeHeader only shown on home page
import roomSingle from "@/assets/room-single.png";
import roomDoubleNew from "@/assets/room-double-new.png";
import roomTriple from "@/assets/room-triple.png";
import roomFourNew from "@/assets/room-four-new.png";
import roomDormNew from "@/assets/room-dorm-new.png";

const branches = [
  { value: "cse", label: "CSE - Computer Science Engineering" },
  { value: "aiml", label: "AIML - Artificial Intelligence & Machine Learning" },
  { value: "ds", label: "DS - Data Science" },
  { value: "ece", label: "ECE - Electronics & Communication Engineering" },
  { value: "eee", label: "EEE - Electrical & Electronics Engineering" },
  { value: "mech", label: "MECH - Mechanical Engineering" },
  { value: "civil", label: "CIVIL - Civil Engineering" },
  { value: "it", label: "IT - Information Technology" },
  { value: "csm", label: "CSM - Computer Science (AI & ML)" },
  { value: "csd", label: "CSD - Computer Science (Data Science)" },
  { value: "dme", label: "DME - Diploma in Mechanical Engineering" },
  { value: "dece", label: "DECE - Diploma in Electronics & Communication" },
  { value: "deee", label: "DEEE - Diploma in Electrical Engineering" },
  { value: "dcme", label: "DCME - Diploma in Computer Engineering" },
  { value: "dcivil", label: "DCIVIL - Diploma in Civil Engineering" },
];

const roomTypes = [
  {
    id: "single",
    name: "Single Bed Room",
    description: "Private room for one student",
    image: roomSingle,
    acPricePerMonth: 8000,
    normalPricePerMonth: 6500,
  },
  {
    id: "double",
    name: "Double Bed Room",
    description: "Shared room for two students",
    image: roomDoubleNew,
    acPricePerMonth: 6500,
    normalPricePerMonth: 5000,
  },
  {
    id: "three",
    name: "Three Bed Room",
    description: "Shared room for three students",
    image: roomTriple,
    acPricePerMonth: 5500,
    normalPricePerMonth: 4500,
  },
  {
    id: "four",
    name: "Four Bed Room",
    description: "Shared room for four students",
    image: roomFourNew,
    acPricePerMonth: 5000,
    normalPricePerMonth: 4000,
  },
  {
    id: "six",
    name: "Six Bed Room",
    description: "Dormitory style for six students",
    image: roomDormNew,
    acPricePerMonth: 4000,
    normalPricePerMonth: 3500,
  },
];

const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const termsAndConditions = [
  "Follow hostel timings strictly (In by 9 PM, Out by 6 AM)",
  "No damage to hostel property - damages will be charged",
  "Fees are non-refundable once paid",
  "Maintain discipline and respect hostel rules",
  "No ragging or misbehavior will be tolerated",
  "Keep your room and surroundings clean",
  "Visitors require prior permission from warden",
  "Electrical appliances usage is restricted",
];

const HostelApplication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const initialGender = searchParams.get("gender") || "";

  const [formData, setFormData] = useState({
    studentName: "",
    fatherName: "",
    branch: "",
    gender: initialGender === "boy" || initialGender === "girl" ? initialGender : "",
    email: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    roomType: "",
    acType: "",
    months: 12,
    termsAccepted: false,
  });
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoomTypeSelect = (roomId: string) => {
    setSelectedRoomType(roomId);
    handleInputChange("roomType", roomId);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPrice = () => {
    const room = roomTypes.find((r) => r.id === selectedRoomType);
    if (!room || !formData.acType) return null;
    const pricePerMonth = formData.acType === "ac" ? room.acPricePerMonth : room.normalPricePerMonth;
    return pricePerMonth * formData.months;
  };

  const getPricePerMonth = () => {
    const room = roomTypes.find((r) => r.id === selectedRoomType);
    if (!room || !formData.acType) return null;
    return formData.acType === "ac" ? room.acPricePerMonth : room.normalPricePerMonth;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName || !formData.branch || !formData.phoneNumber ||
      !selectedRoomType || !formData.acType || !formData.gender || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including email",
        variant: "destructive",
      });
      return;
    }

    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("hostel_applications").insert({
        student_name: formData.studentName,
        father_name: formData.fatherName,
        branch: formData.branch,
        email: formData.email,
        phone_number: formData.phoneNumber,
        parent_phone_number: formData.parentPhoneNumber,
        gender: formData.gender,
        room_type: formData.roomType,
        ac_type: formData.acType,
        months: formData.months,
        price: getPrice(),
        photo_url: photoPreview,
        signature_url: signaturePreview,
        terms_accepted: formData.termsAccepted,
      });

      if (error) throw error;

      // Send notification to warden email (fire and forget)
      supabase.functions.invoke("send-request-notification", {
        body: {
          type: "hostel_application",
          studentName: formData.studentName,
          gender: formData.gender,
          roomType: formData.roomType,
          acType: formData.acType,
        },
      }).catch((err) => console.error("Failed to send notification:", err));

      toast({
        title: "Application Submitted!",
        description: "Your hostel application has been sent to the warden for approval.",
      });

      // Navigate back to home after successful submission
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-2 border-border bg-card shadow-xl">
          <CardHeader className="text-center border-b border-border">
            <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              Hostel Application Form
            </CardTitle>
            <p className="text-muted-foreground">
              Fill in your details to apply for hostel accommodation
            </p>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo & Signature Upload Section */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                {/* Passport Photo Upload */}
                <div className="w-full md:flex-1">
                  <Label className="mb-2 block text-sm">Passport Size Photo *</Label>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-20 h-24 sm:w-28 sm:h-36 md:w-32 md:h-40 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload">
                        <Button type="button" variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                          <span>
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Upload Photo
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Signature Upload */}
                <div className="w-full md:flex-1">
                  <Label className="mb-2 block text-sm">Student Signature</Label>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-24 h-12 sm:w-32 sm:h-16 md:w-40 md:h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                      {signaturePreview ? (
                        <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                      ) : (
                        <PenLine className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureChange}
                        className="hidden"
                        id="signature-upload"
                      />
                      <label htmlFor="signature-upload">
                        <Button type="button" variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                          <span>
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Upload Signature
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Personal Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name *</Label>
                    <Input
                      id="studentName"
                      placeholder="Enter your full name"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      placeholder="Enter father's name"
                      value={formData.fatherName}
                      onChange={(e) => handleInputChange("fatherName", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch *</Label>
                    <Select onValueChange={(value) => handleInputChange("branch", value)}>
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select your branch..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-2 border-border z-50 max-h-60">
                        {branches.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                    >
                      <SelectTrigger className="h-12 bg-background">
                        <SelectValue placeholder="Select gender..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-2 border-border z-50">
                        <SelectItem value="boy">Boy</SelectItem>
                        <SelectItem value="girl">Girl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentPhoneNumber">Parent Phone Number</Label>
                    <Input
                      id="parentPhoneNumber"
                      type="tel"
                      placeholder="Enter parent's phone number"
                      value={formData.parentPhoneNumber}
                      onChange={(e) => handleInputChange("parentPhoneNumber", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Room Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Room Type Selection
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {roomTypes.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleRoomTypeSelect(room.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 text-left relative ${selectedRoomType === room.id
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/50"
                        }`}
                    >
                      <div className="aspect-video rounded-md overflow-hidden mb-2">
                        <img
                          src={room.image}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium text-foreground text-center">
                        {room.name}
                      </p>
                      {selectedRoomType === room.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* AC Selection & Duration */}
              {selectedRoomType && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    AC / Non-AC & Duration
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange("acType", "ac")}
                      className={`p-6 rounded-lg border-2 transition-all duration-300 ${formData.acType === "ac"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                        }`}
                    >
                      <p className="font-semibold text-foreground">AC Room</p>
                      <p className="text-sm text-muted-foreground">Air Conditioned</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange("acType", "normal")}
                      className={`p-6 rounded-lg border-2 transition-all duration-300 ${formData.acType === "normal"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                        }`}
                    >
                      <p className="font-semibold text-foreground">Non-AC Room</p>
                      <p className="text-sm text-muted-foreground">Normal Room</p>
                    </button>
                  </div>

                  {formData.acType && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <Label>Number of Months</Label>
                        <Select
                          value={formData.months.toString()}
                          onValueChange={(value) => handleInputChange("months", parseInt(value))}
                        >
                          <SelectTrigger className="h-12 bg-background">
                            <SelectValue placeholder="Select duration..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-2 border-border z-50">
                            {monthOptions.map((month) => (
                              <SelectItem key={month} value={month.toString()}>
                                {month} {month === 1 ? "Month" : "Months"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
                        <p className="text-sm text-muted-foreground">
                          Price per month: <span className="font-semibold text-foreground">₹{getPricePerMonth()?.toLocaleString()}</span>
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          Total for {formData.months} {formData.months === 1 ? "month" : "months"}:{" "}
                          <span className="text-primary">₹{getPrice()?.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Terms & Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Terms & Conditions
                </h3>

                <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {termsAndConditions.map((term, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => handleInputChange("termsAccepted", checked)}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    I accept all the terms and conditions mentioned above *
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HostelApplication;
