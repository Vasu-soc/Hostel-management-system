import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Check, Upload, Camera, PenLine, CreditCard, Wallet, QrCode, ShieldCheck, IndianRupee, Loader2, Download, ImagePlus, X, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
// Removed college-header import - CollegeHeader only shown on home page
import roomSingle from "@/assets/room-single.png";
import roomDoubleNew from "@/assets/room-double-new.png";
import roomTriple from "@/assets/room-triple.png";
import roomFourNew from "@/assets/room-four-new.png";
import roomDormNew from "@/assets/room-dorm-new.png";
import { Badge } from "@/components/ui/badge";

import { BRANCHES } from "@/lib/constants";

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

const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24, 36, 48];

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
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);

  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

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
    months: 1,
    floorPreference: "any",
    address: "",
    zipCode: "",
    termsAccepted: false,
    transactionId: "",
    paymentMethod: "",
  });
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoomTypeSelect = (roomId: string) => {
    setSelectedRoomType(roomId);
    handleInputChange("roomType", roomId);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image strictly under 3MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      const compressedData = await compressImage(file, 800, 800, 0.6);
      setPhotoPreview(compressedData);
    }
  };

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image strictly under 2MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      const compressedData = await compressImage(file, 400, 200, 0.5);
      setSignaturePreview(compressedData);
    }
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image strictly under 2MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      const compressedData = await compressImage(file, 800, 800, 0.6);
      setReceiptPreview(compressedData);
      
      // Reset verification state when receipt changes
      setIsPaymentVerified(false);
    }
  };

  // Effect to handle payment verification simulation
  useEffect(() => {
    if (formData.transactionId && receiptPreview && !isPaymentVerified && !isVerifyingPayment) {
      setIsVerifyingPayment(true);
      const timer = setTimeout(() => {
        setIsVerifyingPayment(false);
        setIsPaymentVerified(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!formData.transactionId || !receiptPreview) {
      if (isPaymentVerified) setIsPaymentVerified(false);
    }
  }, [formData.transactionId, receiptPreview]);

  const downloadQR = () => {
    setIsDownloadingQR(true);
    const link = document.createElement("a");
    link.href = "/payment_qr.png";
    link.download = "hostel_fee_payment_qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingQR(false), 1000);
    toast({ title: "Downloading QR Code", description: "Please scan and pay ₹100" });
  };

  const getPrice = () => {
    const room = roomTypes.find((r) => r.id === selectedRoomType);
    if (!room || !formData.acType) return null;
    const pricePerMonth = formData.acType === "ac" ? room.acPricePerMonth : room.normalPricePerMonth;
    // As per user request, fee is shown year-wise (max 12 months calculation) even for 2, 3, 4 year selections
    const effectiveMonths = formData.months >= 12 ? 12 : formData.months;
    return pricePerMonth * effectiveMonths;
  };

  const getPricePerMonth = () => {
    const room = roomTypes.find((r) => r.id === selectedRoomType);
    if (!room || !formData.acType) return null;
    return formData.acType === "ac" ? room.acPricePerMonth : room.normalPricePerMonth;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName || !formData.branch || !formData.phoneNumber || !formData.parentPhoneNumber ||
      !selectedRoomType || !formData.acType || !formData.gender || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including Parent Phone Number",
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

    if (!formData.transactionId || !formData.paymentMethod) {
      toast({
        title: "Payment Required",
        description: "Please complete the application fee payment (₹100)",
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
        floor_preference: formData.floorPreference,
        price: getPrice(),
        photo_url: photoPreview,
        signature_url: signaturePreview,
        application_fee_receipt_url: receiptPreview,
        terms_accepted: formData.termsAccepted,
        address: formData.address,
        zip_code: formData.zipCode,
        application_fee_status: "paid",
        application_fee_amount: 100,
        application_fee_transaction_id: formData.transactionId,
        application_fee_payment_method: formData.paymentMethod,
        application_fee_payment_date: new Date().toISOString(),
      } as any);

      if (error) throw error;

      logger.info("hostel_application", formData.studentName, "success");
      
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
        description: "Your hostel application and ₹100 fee have been sent to the warden for approval.",
      });

      // Navigate back to home after successful submission
      setTimeout(() => {
        navigate("/");
      }, 300);
    } catch (error: any) {
      logger.error("hostel_application", formData.studentName || "unknown", "failure");
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
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        Max file size: 3MB (JPEG/PNG)
                      </p>
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
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        Max file size: 2MB (JPEG/PNG)
                      </p>
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
                        {BRANCHES.map((branch) => (
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
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="10-digit number"
                      value={formData.phoneNumber}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleInputChange("phoneNumber", val);
                      }}
                      className="h-12"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentPhoneNumber">Parent Phone Number *</Label>
                    <Input
                      id="parentPhoneNumber"
                      type="tel"
                      placeholder="10-digit number"
                      value={formData.parentPhoneNumber}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleInputChange("parentPhoneNumber", val);
                      }}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code / Pin Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="Enter your zip code"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter your full residential address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="h-12"
                  />
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {month === 24 ? "2 Years" : 
                                   month === 36 ? "3 Years" : 
                                   month === 48 ? "4 Years" : 
                                   `${month} ${month === 1 ? "Month" : "Months"}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Floor Preference</Label>
                          <Select
                            value={formData.floorPreference}
                            onValueChange={(value) => handleInputChange("floorPreference", value)}
                          >
                            <SelectTrigger className="h-12 bg-background">
                              <SelectValue placeholder="Select floor preference..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-2 border-border z-50">
                              <SelectItem value="any">Any Floor</SelectItem>
                              <SelectItem value="1">1st Floor</SelectItem>
                              <SelectItem value="2">2nd Floor</SelectItem>
                              <SelectItem value="3">3rd Floor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
                        <p className="text-sm text-muted-foreground">
                          Price per month: <span className="font-semibold text-foreground">₹{getPricePerMonth()?.toLocaleString()}</span>
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {formData.months >= 12 ? "Total Annual Fee" : `Total for ${formData.months} months`}:{" "}
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

              {/* Mock Payment Portal Section */}
              {formData.termsAccepted && (
                <div className="space-y-6 pt-6 border-t-2 border-dashed border-border animate-fade-in text-card-foreground">
                  <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                          <IndianRupee className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground font-heading">Application Fee</h3>
                          <p className="text-sm text-muted-foreground">Secure One-time Payment</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-primary">₹100</p>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">Registration Fee</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label>1. Scan & Pay ₹100</Label>
                        <div className="relative group">
                          <div 
                            className="aspect-square w-48 mx-auto bg-white rounded-2xl p-3 border-2 border-primary/20 shadow-xl overflow-hidden cursor-pointer relative group-hover:border-primary/50 transition-all"
                            onClick={() => setQrZoomOpen(true)}
                          >
                            <img 
                              src="/payment_qr.png" 
                              alt="Payment QR" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                <Maximize2 className="w-5 h-5 text-primary" />
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col items-center gap-2">
                            <p className="text-[10px] text-muted-foreground font-medium animate-pulse">Click image to zoom</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={downloadQR}
                              className="gap-2 font-bold uppercase text-[10px] w-48"
                              disabled={isDownloadingQR}
                            >
                              <Download className="w-3 h-3" />
                              {isDownloadingQR ? "Downloading..." : "Download QR Code"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>2. Select Method & Enter ID *</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "upi", icon: QrCode, label: "UPI" },
                            { id: "card", icon: CreditCard, label: "Card" },
                            { id: "wallet", icon: Wallet, label: "Wallet" },
                          ].map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => handleInputChange("paymentMethod", method.id)}
                              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                                formData.paymentMethod === method.id 
                                ? "border-primary bg-primary/10 text-primary shadow-inner" 
                                : "border-border bg-background hover:bg-muted"
                              }`}
                            >
                              <method.icon className="w-5 h-5" />
                              <span className="text-[10px] font-bold uppercase">{method.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <Input
                            id="transactionId"
                            placeholder="Enter 12-digit transaction ID"
                            value={formData.transactionId}
                            onChange={(e) => handleInputChange("transactionId", e.target.value)}
                            className="h-12 pl-10 bg-background border-2"
                            required
                          />
                          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Label>3. Upload Payment Receipt *</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-24 border-2 border-dashed border-primary/30 rounded-xl bg-background flex items-center justify-center overflow-hidden shrink-0">
                          {receiptPreview ? (
                            <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
                          ) : (
                            <ImagePlus className="w-6 h-6 text-muted-foreground opacity-30" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptChange}
                            className="h-10 text-xs"
                            required
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 px-1 italic">
                            Uploading clear receipt image helps in faster verification.
                          </p>
                        </div>
                      </div>
                    </div>

                    {isVerifyingPayment && (
                      <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20 animate-pulse">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <p className="text-xs font-semibold text-primary">
                          Verifying Payment Details...
                        </p>
                      </div>
                    )}

                    {isPaymentVerified && !isVerifyingPayment && (
                      <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20 animate-fade-in">
                        <Check className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-semibold text-green-700">
                          Payment & Receipt verified. Ready to submit.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full mt-4"
                disabled={isSubmitting || !formData.termsAccepted || !isPaymentVerified}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Application...
                  </>
                ) : (
                  isPaymentVerified ? "Submit Application" : "Pay ₹100 & Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <QRZoomModal open={qrZoomOpen} onOpenChange={setQrZoomOpen} />
    </div>
  );
};

// QR Zoom Dialog Component
const QRZoomModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-0 shadow-none overflow-visible flex items-center justify-center">
      <div className="relative w-[90vw] max-w-[450px] aspect-square bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <DialogHeader className="absolute -top-12 left-0 right-0 flex-row justify-between items-center px-4">
          <DialogTitle className="text-white text-lg font-black tracking-tight drop-shadow-md">SCAN TO PAY</DialogTitle>
          <DialogDescription className="sr-only">
            Scan the QR code to pay the registration fee.
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-10 h-10">
              <X className="w-6 h-6" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="w-full h-full rounded-2xl border-4 border-primary/10 p-4 bg-white shadow-inner flex items-center justify-center">
          <img 
            src="/payment_qr.png" 
            alt="Zoomed QR" 
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="absolute -bottom-16 left-0 right-0 text-center">
          <Badge variant="secondary" className="px-6 py-2 bg-white/90 backdrop-blur-md text-primary font-black text-sm rounded-full shadow-lg border-0">
            ₹100 INR
          </Badge>
          <p className="mt-2 text-white/80 text-[10px] uppercase font-black tracking-[0.2em]">Application Fee</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default HostelApplication;
