import { z } from 'zod';

// Phone number validation (10 digits)
const phoneRegex = /^[0-9]{10}$/;

// Student Registration Schema
export const studentRegistrationSchema = z.object({
  rollNumber: z.string()
    .min(5, "Roll number must be at least 5 characters")
    .max(20, "Roll number must not exceed 20 characters")
    .regex(/^[A-Z0-9]+$/, "Roll number can only contain uppercase letters and numbers"),
  studentName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters, spaces, and periods"),
  branch: z.enum(["cse", "aiml", "ds", "ece", "eee", "mech", "civil", "it", "csm", "csd", "dme", "dece", "deee", "dcme", "dcivil"], {
    errorMap: () => ({ message: "Please select a valid branch" })
  }),
  year: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"], {
    errorMap: () => ({ message: "Please select a valid year" })
  }),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Please select a valid gender" })
  }),
  validityFrom: z.string().optional(),
  validityTo: z.string().optional(),
  roomNumber: z.string().max(10).optional(),
  floorNumber: z.string().max(10).optional(),
});

// Student Login Schema
export const studentLoginSchema = z.object({
  rollNumber: z.string()
    .min(1, "Roll number is required")
    .max(20, "Roll number is too long"),
  password: z.string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Password Setup Schema
export const passwordSetupSchema = z.object({
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Warden Login Schema
export const wardenLoginSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .max(50, "Username is too long"),
  password: z.string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Warden Registration Schema
export const wardenRegistrationSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters"),
  mobileNumber: z.string()
    .regex(phoneRegex, "Mobile number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  wardenType: z.enum(["boys", "girls"], {
    errorMap: () => ({ message: "Please select warden type" })
  }),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Parent Login Schema
export const parentLoginSchema = z.object({
  mobileNumber: z.string()
    .regex(phoneRegex, "Mobile number must be exactly 10 digits"),
  password: z.string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Parent Registration Schema
export const parentRegistrationSchema = z.object({
  parentName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters"),
  mobileNumber: z.string()
    .regex(phoneRegex, "Mobile number must be exactly 10 digits"),
  studentRollNumber: z.string()
    .min(5, "Roll number must be at least 5 characters")
    .max(20, "Roll number must not exceed 20 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

// Admin Login Schema
export const adminLoginSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .max(50, "Username is too long"),
  password: z.string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Gate Pass Schema
export const gatePassSchema = z.object({
  studentMobile: z.string()
    .regex(phoneRegex, "Student mobile must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  parentMobile: z.string()
    .regex(phoneRegex, "Parent mobile must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  outDate: z.string()
    .min(1, "Out date is required"),
  inDate: z.string()
    .min(1, "In date is required"),
  outTime: z.string().optional().or(z.literal("")),
  inTime: z.string().optional().or(z.literal("")),
  purpose: z.string()
    .min(5, "Purpose must be at least 5 characters")
    .max(500, "Purpose must not exceed 500 characters"),
}).refine(data => {
  if (data.outDate && data.inDate) {
    return new Date(data.inDate) >= new Date(data.outDate);
  }
  return true;
}, {
  message: "In date must be on or after out date",
  path: ["inDate"]
});

// Issue Report Schema
export const issueReportSchema = z.object({
  description: z.string()
    .min(5, "Description must be at least 5 characters")
    .max(1000, "Description must not exceed 1000 characters"),
});

// Hostel Application Schema
export const hostelApplicationSchema = z.object({
  studentName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters"),
  fatherName: z.string()
    .max(100, "Father's name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s.]*$/, "Name can only contain letters")
    .optional()
    .or(z.literal("")),
  branch: z.enum(["cse", "aiml", "ds", "ece", "eee", "mech", "civil", "it", "csm", "csd", "dme", "dece", "deee", "dcme", "dcivil"], {
    errorMap: () => ({ message: "Please select a valid branch" })
  }),
  gender: z.enum(["boy", "girl"], {
    errorMap: () => ({ message: "Please select gender" })
  }),
  phoneNumber: z.string()
    .regex(phoneRegex, "Phone number must be exactly 10 digits"),
  parentPhoneNumber: z.string()
    .regex(phoneRegex, "Parent phone must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  roomType: z.enum(["single", "double", "three", "four", "six"], {
    errorMap: () => ({ message: "Please select a room type" })
  }),
  acType: z.enum(["ac", "non-ac"], {
    errorMap: () => ({ message: "Please select AC type" })
  }),
  months: z.number()
    .min(1, "Minimum 1 month")
    .max(12, "Maximum 12 months"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" })
  }),
});

// File validation helper
export const validateImageFile = (file: File): string | null => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }
  
  if (file.size > MAX_SIZE) {
    return 'File size must be less than 5MB';
  }
  
  return null;
};

// Helper to format validation errors
export const formatValidationErrors = (error: z.ZodError): string => {
  return error.errors.map(e => e.message).join(', ');
};
