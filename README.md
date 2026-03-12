# 🏠 HosteliHub — Hostel Management System
### *Geethanjali Institute of Science & Technology*

> **"Your Home Away From Home"** — A state-of-the-art, real-time hostel administration platform built for students, wardens, parents, and administrators.

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System & Colors](#3-design-system--colors)
4. [Typography & Fonts](#4-typography--fonts)
5. [Animations & UI Effects](#5-animations--ui-effects)
6. [Application Routes & Pages](#6-application-routes--pages)
7. [Key Components](#7-key-components)
8. [User Portals & Workflows](#8-user-portals--workflows)
9. [Database Schema (Supabase)](#9-database-schema-supabase)
10. [Real-Time Features](#10-real-time-features)
11. [Hybrid Local Storage System](#11-hybrid-local-storage-system)
12. [Email Notification System](#12-email-notification-system)
13. [Hostel Application Form Details](#13-hostel-application-form-details)
14. [Room Types & Pricing](#14-room-types--pricing)
15. [Hostel Rules & Regulations](#15-hostel-rules--regulations)
16. [File Upload Architecture](#16-file-upload-architecture)
17. [Session Management](#17-session-management)
18. [Form Validation](#18-form-validation)
19. [Project Structure](#19-project-structure)
20. [Getting Started](#20-getting-started)

---

## 1. Project Overview

**HosteliHub** is a comprehensive, full-stack Hostel Management System built for **Geethanjali Institute of Science & Technology (GIST)**. It provides a unified, real-time platform for:

- 🎓 **Students** — Apply for hostel, manage gate passes, report issues, receive study materials
- 🏫 **Wardens** — Manage applications, rooms, gate passes, issue reports, medicines, food selection
- 👨‍👩‍👧 **Parents** — Monitor child's fee status, medical alerts, warden remarks
- 🛡️ **Admins** — Oversee the whole system, manage warden onboarding, update fees, reset data

The system is built using **React + TypeScript + Vite**, backed by **Supabase** (PostgreSQL + Storage + Edge Functions), with a custom Node.js backend (`vite.config.ts`) for local file system operations.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 (with `@vitejs/plugin-react-swc`) |
| **Routing** | React Router DOM v6 |
| **Styling** | Tailwind CSS v3 + CSS Custom Properties |
| **UI Components** | Radix UI (full suite of primitives) |
| **Animations** | Framer Motion v11, CSS keyframe animations |
| **State Management** | React useState/useEffect + TanStack React Query v5 |
| **Backend / Database** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Real-time** | Supabase Realtime (postgres_changes channel subscriptions) |
| **Form Handling** | React Hook Form v7 + Zod validation |
| **Charts** | Recharts v2 |
| **Icons** | Lucide React |
| **Theming** | next-themes (light/dark mode) |
| **Carousel** | Embla Carousel React |
| **3D Rendering** | @react-three/fiber + Three.js (available as dependency) |
| **Toast Notifications** | Sonner + Radix UI Toaster |
| **Date Utilities** | date-fns |
| **OTP Input** | input-otp |
| **Resizable Panels** | react-resizable-panels |
| **Node Dev Server** | Custom Vite dev server middleware for local API routes |

---

## 3. Design System & Colors

The entire application uses a comprehensive **HSL-based CSS custom property color system** that seamlessly supports both **light mode** and **dark mode**.

### 🌞 Light Mode Palette

| Token | HSL Value | Description |
|---|---|---|
| `--background` | `hsl(35, 30%, 97%)` | Warm off-white page background |
| `--foreground` | `hsl(220, 30%, 15%)` | Deep navy-dark text |
| `--card` | `hsl(0, 0%, 100%)` | Pure white card backgrounds |
| `--primary` | `hsl(24, 95%, 53%)` | 🟠 Vibrant orange — brand color |
| `--primary-foreground` | `hsl(0, 0%, 100%)` | White text on primary |
| `--secondary` | `hsl(220, 70%, 25%)` | 🔵 Deep navy blue |
| `--secondary-foreground` | `hsl(0, 0%, 100%)` | White text on secondary |
| `--muted` | `hsl(35, 20%, 92%)` | Warm light muted surfaces |
| `--muted-foreground` | `hsl(220, 15%, 45%)` | Medium grey text |
| `--accent` | `hsl(200, 85%, 45%)` | 🩵 Sky blue accent |
| `--accent-foreground` | `hsl(0, 0%, 100%)` | White on accent |
| `--success` | `hsl(142, 70%, 45%)` | 🟢 Green — approvals & success |
| `--success-foreground` | `hsl(0, 0%, 100%)` | White on success |
| `--warning` | `hsl(38, 92%, 50%)` | 🟡 Amber — pending states |
| `--warning-foreground` | `hsl(0, 0%, 100%)` | White on warning |
| `--destructive` | `hsl(0, 84%, 60%)` | 🔴 Red — errors & danger |
| `--destructive-foreground` | `hsl(0, 0%, 100%)` | White on destructive |
| `--border` | `hsl(220, 20%, 88%)` | Light cool-grey borders |
| `--ring` | `hsl(24, 95%, 53%)` | Orange focus ring |
| `--radius` | `0.75rem` | Rounded corners |

### 🌙 Dark Mode Palette

| Token | HSL Value | Description |
|---|---|---|
| `--background` | `hsl(220, 30%, 8%)` | Very deep navy-black |
| `--foreground` | `hsl(35, 30%, 95%)` | Warm white text |
| `--card` | `hsl(220, 30%, 12%)` | Dark card surface |
| `--primary` | `hsl(24, 95%, 55%)` | Slightly brighter orange |
| `--secondary` | `hsl(200, 70%, 50%)` | Bright sky blue |
| `--muted` | `hsl(220, 25%, 18%)` | Dark muted surface |
| `--accent` | `hsl(200, 85%, 50%)` | Bright cyan accent |
| `--destructive` | `hsl(0, 70%, 50%)` | Slightly muted red |
| `--border` | `hsl(220, 25%, 22%)` | Dark cool border |

### 🎨 Gradient Variables

```css
--gradient-primary:   linear-gradient(135deg, hsl(24, 95%, 53%) 0%, hsl(38, 92%, 50%) 100%)
--gradient-secondary: linear-gradient(135deg, hsl(220, 70%, 25%) 0%, hsl(200, 85%, 45%) 100%)
--gradient-hero:      linear-gradient(180deg, hsl(35, 30%, 97%) 0%, hsl(35, 25%, 93%) 100%)
--gradient-carousel:  linear-gradient(135deg, primary/6%, accent/6%, success/6%)
```

### 🌟 Shadow Variables

```css
--shadow-sm:   0 1px 2px 0 hsl(220 30% 15% / 0.05)
--shadow-md:   0 4px 6px -1px hsl(220 30% 15% / 0.1)
--shadow-lg:   0 10px 15px -3px hsl(220 30% 15% / 0.1)
--shadow-xl:   0 20px 25px -5px hsl(220 30% 15% / 0.1)
--shadow-glow: 0 0 30px hsl(24 95% 53% / 0.3)
```

### Status Badge Classes

| Class | Style |
|---|---|
| `.status-pending` | Amber background / amber text / amber border |
| `.status-approved` | Green background / green text / green border |
| `.status-rejected` | Red background / red text / red border |

---

## 4. Typography & Fonts

The application uses **Google Fonts** for premium typography:

| Font | Role | Weights |
|---|---|---|
| **Poppins** | Primary font — all body, headings, UI | 300, 400, 500, 600, 700, 800 |
| **Playfair Display** | Display font (decorative headers) | 600, 700 |

- All `h1–h6` heading elements use **Poppins**
- Body text uses **Poppins** via `font-family: 'Poppins', sans-serif`
- Font import is done via Google Fonts CDN in `src/index.css`

---

## 5. Animations & UI Effects

### CSS Keyframe Animations

| Animation | Duration | Effect |
|---|---|---|
| `fade-in` | 0.5s ease-out | Opacity 0→1 + translateY(10px→0) |
| `slide-in-right` | 0.5s ease-out | Opacity 0→1 + translateX(20px→0) |
| `scale-in` | 0.3s ease-out | Opacity 0→1 + scale(0.95→1) |
| `accordion-down` | 0.2s ease-out | Radix accordion open |
| `accordion-up` | 0.2s ease-out | Radix accordion close |
| `float` | 6s ease-in-out infinite | translateY(0 ↔ -10px) — floating icon effect |
| `pulse-dot` | 2s ease-in-out infinite | Scale 1↔1.2, opacity 1↔0.7 — notification badge pulse |
| `pulse-dot-red` | 1s ease-in-out infinite | Red glow pulse ring — emergency alerts |
| `text-gradient-flow` | 4s linear infinite | Animated gradient text color sweep |
| `header-bg-pulse` | 15s ease infinite | Background gradient position shift |
| `grid-move` | 20s linear infinite | Grid background scrolling effect |
| `carousel-scroll` | 90s linear infinite (60s mobile) | Infinite horizontal carousel scroll |
| `loop-scroll` | 90s linear infinite | Alternative scroll utility |

### Component-Level CSS Effects

| Class | Effect |
|---|---|
| `.grid-motion-bg` | Moving grid background with CSS pseudo-elements |
| `.glare-hover` | Shiny white glare sweep across element on hover |
| `.card-hover` | `transform: translateY(-4px)` + `shadow-xl` on hover |
| `.float-animation` | Icon/element floating up-down animation |
| `.pulse-dot` | Green pulsing notification dot |
| `.pulse-dot-red` | Red pulsing emergency dot |
| `.text-gradient` | Orange-to-amber gradient text |
| `.text-animated-gradient` | Animating color flowing through text |
| `.header-dynamic-bg` | Blurred, pulsing gradient header background |
| `.shadow-glow` | Orange glow box-shadow |
| `.no-scrollbar` | Hide scrollbar CSS |
| `.carousel-track` | Flex track for auto-scrolling carousel |
| `.carousel-item` | Individual carousel card (320px × 208px) |

### Framer Motion Animations (SplashScreen)

- **Logo**: Spring animation with stiffness 260, damping 20, rotating in from -180°
- **Letter-by-letter** name reveal with spring staggered delays per character
- **Orbiting particles**: 8 rotating white dots around the logo
- **Floating particles**: 20 randomly positioned background particles
- **Tagline**: Typing animation with cursor blink
- **Bottom wave SVG**: Animated morphing wave path
- **Background circles**: Expanding white circles on load

---

## 6. Application Routes & Pages

| Route | Component | Description |
|---|---|---|
| `/` | `Index.tsx` | Home page — landing, login selector, medicine checker |
| `/hostel-application` | `HostelApplication.tsx` | Hostel application form for new students |
| `/student-login` | `StudentLogin.tsx` | Student login (Boys/Girls) with roll number + password |
| `/student-dashboard` | `StudentDashboard.tsx` | Student's personal dashboard |
| `/warden-login` | `WardenLogin.tsx` | Warden authentication |
| `/warden-dashboard` | `WardenDashboard.tsx` | Full warden control panel |
| `/warden-register` | `WardenRegister.tsx` | New warden registration (token-gated) |
| `/parent-login` | `ParentLogin.tsx` | Parent login using roll number + password |
| `/parent-dashboard` | `ParentDashboard.tsx` | Parent's monitoring dashboard |
| `/admin-login` | `AdminLogin.tsx` | Administrator login |
| `/admin-dashboard` | `AdminDashboard.tsx` | Admin control panel |
| `/reset-password` | `ResetPassword.tsx` | Password reset flow |
| `*` | `NotFound.tsx` | 404 fallback page |

---

## 7. Key Components

### Global Components

| Component | File | Description |
|---|---|---|
| **SplashScreen** | `SplashScreen.tsx` | Animated intro screen shown only on first visit (session-gated) |
| **CollegeHeader** | `CollegeHeader.tsx` | Floating glassmorphism college header with logo, name, iOS-style island nav, theme toggle |
| **DashboardHeader** | `DashboardHeader.tsx` | Top bar shown on all dashboard pages with user info, photo, logout |
| **ImageCarousel** | `ImageCarousel.tsx` | Infinite auto-scrolling image carousel on the home page |
| **FoodMenu** | `FoodMenu.tsx` | Weekly mess/food menu display section |
| **AdministrationProfiles** | `AdministrationProfiles.tsx` | Faculty/Admin profile cards on the home page |
| **PaymentPortal** | `PaymentPortal.tsx` | Fee payment gateway link component |
| **ThemeToggle** | `ThemeToggle.tsx` | Light/dark mode toggle button |
| **NavLink** | `NavLink.tsx` | Styled navigation link utility |

### Warden-Specific Components

| Component | File | Description |
|---|---|---|
| **PendingRoomsDashboard** | `warden/PendingRoomsDashboard.tsx` | Shows AC/Non-AC room stats, bed occupancy, student profile photos |
| **HostelRoomDetails** | `warden/HostelRoomDetails.tsx` | Detailed hostel room listing with floor-wise breakdown |
| **RoomAllotment** | `warden/RoomAllotment.tsx` | UI to allot rooms to waiting students, with room search |
| **StudyMaterialUpload** | `warden/StudyMaterialUpload.tsx` | Upload PDFs or Google Drive links for branch+year |
| **IssueReports** | `warden/IssueReports.tsx` | View and resolve electrical, food, and medical issues |
| **MedicineManagement** | `warden/MedicineManagement.tsx` | Add/remove medicines available at the hostel medical room |
| **FoodSelectionChart** | `warden/FoodSelectionChart.tsx` | Chart showing student food preference selections |

### Admin-Specific Components

| Component | File | Description |
|---|---|---|
| **WardenApproval** | `admin/WardenApproval.tsx` | Approve or reject pending warden registration requests |
| **WardenCredentialGenerator** | `admin/WardenCredentialGenerator.tsx` | Generate one-time registration tokens for wardens |

### UI Library (Radix UI + Shadcn)

All 49 UI components live in `src/components/ui/` including: `button`, `card`, `dialog`, `select`, `input`, `label`, `textarea`, `checkbox`, `table`, `tabs`, `accordion`, `avatar`, `badge`, `calendar`, `dropdown-menu`, `form`, `popover`, `progress`, `radio-group`, `scroll-area`, `separator`, `sheet`, `skeleton`, `slider`, `switch`, `toast`, `toggle`, `tooltip`, and more.

---

## 8. User Portals & Workflows

---

### 🏠 Home Page (`/`)

The landing page is the central hub of the application. It includes:

1. **Splash Screen** (first-visit only, 5s duration, session-gated via `sessionStorage`)
2. **CollegeHeader** — fixed at the top with college branding
3. **ImageCarousel** — Infinite auto-scrolling photo banner (90s scroll speed, 60s on mobile)
4. **Welcome Title** — Animated gradient heading with fade-in effect
5. **AdministrationProfiles** — College administration profile display
6. **Three Main Cards**:
   - 📝 **Hostel Application Form** — `Link to="/hostel-application"` with floating orange gradient icon
   - 🎓 **Choose Login** — Dropdown selector for login type:
     - Boys Hostel → `/student-login?gender=boys`
     - Girls Hostel → `/student-login?gender=girls`
     - Hostel Warden → `/warden-login`
     - Parent → `/parent-login`
     - Admin → `/admin-login`
   - 💊 **Medicine Availability** — Real-time Supabase subscription to `medicines` table
7. **FoodMenu** — Weekly mess schedule
8. **Quick Links** — Contact Warden (WhatsApp), Emergency Call, Hostel Rules Dialog
9. **Footer** — "© 2024 Geethanjali Institute of Science & Technology"

---

### 🎓 Student Portal Workflow

#### Step 1 — Application
1. Student visits `/hostel-application`
2. Fills in: name, father's name, branch, gender, email, phone, parent phone
3. Uploads passport photo (max 5MB) + signature (max 2MB) with live preview
4. Selects room type (visual card selection with images)
5. Selects AC / Non-AC + number of months
6. Sees dynamically calculated total fee
7. Accepts Terms & Conditions → Submits to `hostel_applications` table

#### Step 2 — Warden Approval
- Warden sees the application in their dashboard
- Reviews details, accepts/rejects → Student gets email notification

#### Step 3 — Student Registration
- After acceptance, Warden allots a room via **Room Allotment** tab
- Student record is created in `students` table with roll number, password, room info

#### Step 4 — Student Login
- Student logs in at `/student-login?gender=boys` or `/student-login?gender=girls`
- Authentication against `students` table using roll number + password
- Session stored in `sessionStorage` (8-hour expiry)

#### Step 5 — Student Dashboard
The dashboard has a 3-column grid layout:

**Left Column:**
- 💰 Fee Details card (Total / Paid / Pending with INR formatting)
- 🔄 Refresh button (syncs latest data from Supabase)
- **PaymentPortal** — External fee payment link
- 📚 **Resources** dialog — Links to W3Schools Python, GeeksforGeeks Java, YouTube
- ⚡ **Room Electrical Problem** — Submit issue description → stored in `electrical_issues`
- 🍽️ **Food Selection** — Choose: Chicken Biryani, Veg Meals, Chapati, Dosa, Other
- 🍳 **Food Issue Reporting** — Submit food complaints → stored in `food_issues`
- 💊 **Medical Alert** — Emergency alert for: Fever, Stomach Pain, Headache, Injury, Other → saved to local `medical_alerts.json`
- 📂 **Study Materials** — Downloads branch+year-specific materials uploaded by warden

**Middle Column:**
- 📋 **Gate Pass Form** — Fill name (auto), roll (auto), email, mobile, parent mobile, out date, in date, out time, in time, purpose (5–500 chars) → Submit to `gate_passes`

**Right Column:**
- ✅ **Gate Pass Status** — Shows status badge (Approved/Rejected/Pending)
- 🖼️ Student photo (click to zoom)
- Gate pass details (dates, purpose, branch, year)
- 🖊️ Warden signature (shown when approved)
- 🖨️ **Print Gate Pass** — Opens print-formatted HTML window

---

### 🏫 Warden Portal Workflow

#### Login
- Wardens are registered via Admin approval + one-time token system
- Login at `/warden-login` with username + password

#### Dashboard Tabs

| Tab | Icon | Feature |
|---|---|---|
| **Dashboard** | Home | PendingRoomsDashboard — AC/Non-AC stats + room occupancy |
| **Applications** | FileText | View/Accept/Reject hostel applications; includes Delete All |
| **Gate Passes** | DoorOpen | Approve/Reject gate passes; add/update digital signature |
| **Hostel Rooms** | Building2 | View detailed room listing with floor breakdown |
| **Room Allotment** | Users | Allot rooms to students waiting in queue |
| **Study Materials** | Upload | Upload PDFs or Drive links for specific branch + year |
| **Issues** | AlertTriangle | View electrical, food, medical issues; mark as resolved |
| **Food Selection** | Utensils | View food preference chart (Recharts) from student responses |
| **Medicines** | Pill | Add/remove medicines visible on the home page |

**Badge Counts:** Application, Gate Pass, and Issue tabs show live animated pulsing count badges for pending items.

**Signature Feature:**
- Warden can upload a PNG/JPG signature
- Uploaded to Supabase Storage `signatures` bucket
- Signature URL stored in `wardens.signature_url`
- Auto-appended to approved gate passes

---

### 👨‍👩‍👧 Parent Portal Workflow

#### Login / Registration
- Parents register at `/parent-login` with their name, mobile, and child's roll number
- After verification, account is stored in `parents` table

#### Parent Dashboard Features

| Feature | Description |
|---|---|
| 💰 **Fee Details** | Shows total, paid, and pending fee amounts in INR (real-time from Supabase) |
| 📋 **Remarks & Medical Alerts** | Displays warden remarks + all medical alerts filtered by roll number |
| 🩺 **Medical Alert History** | Shows alert type, timestamp, status (Pending/Resolved), and resolution message |
| 📖 **Student Information** | Name, roll number, branch, year, room number, floor, validity dates, room status |
| 📞 **Contact Warden** | WhatsApp deep link (`wa.me/91XXXXXXXXXX`) |
| 🚨 **Emergency Call** | Direct phone call (`tel:`) trigger |
| 📜 **Hostel Rules** | Dialog popup with all 15 hostel rules |

**Real-time Subscriptions:**
- Student data updates via Supabase channel `student-updates` filtered by roll number

---

### 🛡️ Admin Portal Workflow

#### Login
- Admin logs in at `/admin-login` with username + password
- Session stored in `sessionStorage`

#### Admin Dashboard Features

| Feature | Description |
|---|---|
| 🔍 **View Students** | Filter by Branch (CSE, MECH, CIVIL, AIML, AIDS, ECE, EEE, DS, IT) and Year → displays student cards with photo, branch, year, room, and fee breakdown |
| 🏠 **Pending Rooms** | Table view of AC and Non-AC room blocks showing floor, room number, total beds, occupied beds |
| 👷 **Warden Approvals** | Review and approve/reject warden registration requests |
| 💰 **Update Fee** | Click any student → dialog opens to update total fee + paid fee; pending auto-calculated |
| ⚠️ **Master Data Reset** | Double-confirmed deletion of ALL student records, applications, gate passes, issues, and local files — zero chance of accidental wipe |

---

## 9. Database Schema (Supabase)

### Tables

#### `admins`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Admin full name |
| username | text | Login username |
| password | text | Hashed password |
| mobile_number | text | Optional contact |
| created_at | timestamptz | Auto |

#### `wardens`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Warden name |
| username | text | Login username |
| password | text | Password |
| warden_type | text | `"boys"` or `"girls"` |
| is_approved | boolean | Admin approval flag |
| approval_status | text | `"pending"` / `"approved"` / `"rejected"` |
| rejected_reason | text | Reason if rejected |
| signature_url | text | Supabase Storage URL |
| mobile_number | text | Contact |
| created_at | timestamptz | Auto |

#### `students`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_name | text | Full name |
| roll_number | text | Unique student ID |
| branch | text | e.g., `"cse"`, `"mech"` |
| year | text | e.g., `"1st Year"` |
| gender | text | `"male"` / `"female"` |
| email | text | Contact email |
| password | text | Login password |
| photo_url | text | Supabase Storage URL |
| hostel_room_number | text | Assigned room |
| floor_number | text | Assigned floor |
| room_allotted | boolean | True if room assigned |
| total_fee | numeric | Total hostel fee |
| paid_fee | numeric | Amount paid |
| pending_fee | numeric | Remaining balance |
| validity_from | text | Allotment start date |
| validity_to | text | Allotment end date |
| remarks | text | Warden's remarks visible to parent |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### `hostel_applications`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_name | text | Applicant name |
| father_name | text | Father's name |
| branch | text | Engineering branch |
| gender | text | `"boy"` / `"girl"` |
| email | text | Contact email |
| phone_number | text | Student phone |
| parent_phone_number | text | Parent phone |
| room_type | text | `single/double/three/four/six` |
| ac_type | text | `"ac"` / `"normal"` |
| months | integer | Duration in months |
| price | numeric | Calculated total fee |
| photo_url | text | Base64 photo data |
| signature_url | text | Base64 signature data |
| status | text | `"pending"` / `"accepted"` / `"rejected"` |
| terms_accepted | boolean | T&C checkbox |
| created_at | timestamptz | Auto |

#### `gate_passes`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | FK → students.id |
| student_name | text | |
| roll_number | text | |
| branch | text | |
| student_email | text | For email notification |
| student_mobile | text | 10-digit mobile |
| parent_mobile | text | 10-digit parent mobile |
| out_date | date | Exit date |
| in_date | date | Return date |
| out_time | time | Exit time |
| in_time | time | Return time |
| purpose | text | 5–500 characters |
| status | text | `"pending"` / `"approved"` / `"rejected"` |
| created_at | timestamptz | Auto |

#### `electrical_issues`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | FK → students.id |
| student_name | text | |
| roll_number | text | |
| room_number | text | |
| description | text | Issue description |
| status | text | `"pending"` / `"resolved"` |
| created_at | timestamptz | Auto |

#### `food_issues`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | FK → students.id |
| student_name | text | |
| roll_number | text | |
| description | text | Issue description |
| status | text | `"pending"` / `"resolved"` |
| created_at | timestamptz | Auto |

#### `medical_alerts`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| student_id | uuid | FK → students.id |
| student_name | text | |
| roll_number | text | |
| room_number | text | |
| issue_type | text | Fever / Stomach Pain / etc. |
| status | text | `"pending"` / `"resolved"` |
| created_at | timestamptz | Auto |

#### `medicines`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Medicine name |
| icon | text | Emoji icon |
| description | text | Usage description |
| is_available | boolean | Availability toggle |
| warden_type | text | `"boys"` / `"girls"` |
| created_by | uuid | FK → wardens.id |
| created_at | timestamptz | Auto |

#### `rooms`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| room_number | text | e.g., `"A101"`, `"GN201"` |
| floor_number | text | Floor label |
| ac_type | text | `"ac"` / `"normal"` |
| room_type | text | `single/double/three/four/six` |
| total_beds | integer | Total capacity |
| occupied_beds | integer | Currently occupied |
| pending_beds | integer | Pending assignments |
| closed_beds | integer | Out-of-service beds |
| created_at | timestamptz | Auto |

> **Room Naming Convention:** Boys AC rooms → `A101`, `A102`... Boys Non-AC → `N101`... Girls AC → `GA101`... Girls Non-AC → `GN101`...

#### `parents`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| parent_name | text | Full name |
| mobile_number | text | Contact |
| password | text | Login password |
| student_roll_number | text | Links to student |
| created_at | timestamptz | Auto |

#### `study_materials`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| subject_name | text | Subject/chapter name |
| branch | text | Target branch |
| year | text | Target year |
| file_url | text | Local upload path |
| drive_link | text | Google Drive URL |
| warden_id | uuid | FK → wardens.id |
| created_at | timestamptz | Auto |

#### `warden_registration_tokens`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| token | text | One-time registration token |
| warden_type | text | `"boys"` / `"girls"` |
| used | boolean | Has token been used |
| used_at | timestamptz | When consumed |
| expires_at | timestamptz | Expiry timestamp |
| created_by | uuid | FK → admins.id |
| created_at | timestamptz | Auto |

#### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| token | text | Reset token |
| user_type | text | `"student"` / `"warden"` etc. |
| user_identifier | text | Roll number or username |
| used | boolean | Consumed flag |
| expires_at | timestamptz | Expiry |
| created_at | timestamptz | Auto |

---

## 10. Real-Time Features

All dashboards use Supabase Realtime subscriptions via `postgres_changes`. Channels are created per-user to avoid conflicts.

| Dashboard | Channel | Subscribed Tables |
|---|---|---|
| **Home** | `medicines-public` | `medicines` |
| **Student** | `student-updates-{id}` | `students` (filtered by student ID) |
| **Warden** | `warden-changes-{id}-{type}` | `hostel_applications`, `gate_passes`, `students`, `rooms`, `electrical_issues`, `food_issues`, `study_materials` |
| **Parent** | `student-updates` | `students` (filtered by roll_number) |
| **Admin** | `admin-changes` | `rooms`, `students` |

When any real-time event fires, the UI silently re-fetches and updates state without page refresh.

---

## 11. Hybrid Local Storage System

To avoid Supabase schema locks and ensure zero-downtime on critical features, the system uses a **custom local file system** API via Vite dev server middleware defined in `vite.config.ts`:

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/local-materials` | GET | Fetch all study materials |
| `POST /api/local-materials` | POST | Upload new study material |
| `DELETE /api/local-materials/:id` | DELETE | Remove study material |
| `GET /api/local-medical-alerts` | GET | Fetch all medical alerts |
| `POST /api/local-medical-alerts` | POST | Store new medical alert |
| `DELETE /api/local-medical-alerts` | DELETE | Clear all alerts |
| `GET /api/local-food-selection` | GET | Fetch food selections |
| `POST /api/local-food-selection` | POST | Record food selection |
| `DELETE /api/local-food-selection` | DELETE | Clear food selections |
| `GET /api/deleted-students` | GET | Get blocklist of deleted student IDs |
| `POST /api/deleted-students` | POST | Add student to hard-delete blocklist |
| `DELETE /api/deleted-students` | DELETE | Clear blocklist |

**File storage locations:**
- `public/medical_alerts.json`
- `public/study_materials.json`
- `public/food_selections.json`
- `public/deleted_students.json`
- `public/uploads/` — uploaded PDF files

---

## 12. Email Notification System

Powered by **Supabase Edge Functions** using the **Resend** email API:

| Edge Function | Trigger | Recipients |
|---|---|---|
| `send-application-email` | Application accepted/rejected | Student email |
| `send-gate-pass-email` | Gate pass approved/rejected | Student email |
| `send-request-notification` | New gate pass / issue / medical alert submitted | Warden email |

All email calls are **fire-and-forget** (`.catch()` error handling) to avoid blocking the UI.

---

## 13. Hostel Application Form Details

### Required Fields
- Student Name *
- Branch * (15 options including CSE, AIML, DS, ECE, EEE, MECH, CIVIL, IT, CSM, CSD, DME, DECE, DEEE, DCME, DCIVIL)
- Gender * (Boy / Girl)
- Email Address *
- Phone Number *
- Room Type * (visual card selection with real photos)
- AC Type * (AC / Non-AC)

### Optional Fields
- Father's Name
- Parent Phone Number
- Number of Months (1–12, default: 12)

### File Uploads
- **Passport Photo** — max 5MB, JPEG/PNG, live preview shown
- **Signature** — max 2MB, JPEG/PNG, live preview shown (file input cleared on size violation)

### Terms & Conditions (8 items)
1. Follow hostel timings (In by 9 PM, Out by 6 AM)
2. No damage to hostel property (charged)
3. Fees are non-refundable
4. Maintain discipline and respect rules
5. No ragging or misbehavior
6. Keep rooms and surroundings clean
7. Visitors require warden permission
8. Electrical appliance usage is restricted

---

## 14. Room Types & Pricing

| Room Type | Beds | AC (per month) | Normal (per month) |
|---|---|---|---|
| Single Bed Room | 1 | ₹8,000 | ₹6,500 |
| Double Bed Room | 2 | ₹6,500 | ₹5,000 |
| Three Bed Room | 3 | ₹5,500 | ₹4,500 |
| Four Bed Room | 4 | ₹5,000 | ₹4,000 |
| Six Bed Room (Dorm) | 6 | ₹4,000 | ₹3,500 |

**Pricing Logic:** Prices decrease as room capacity increases. Total fee = `price_per_month × months`.

---

## 15. Hostel Rules & Regulations

The following 15 rules are displayed on the Home Page, Student Dashboard, and Parent Dashboard via a modal dialog:

1. Students must return to hostel by **9:00 PM** on weekdays and **10:00 PM** on weekends.
2. Gate pass is mandatory for leaving the hostel premises.
3. Visitors are allowed only during visiting hours (**4:00 PM – 6:00 PM** on Sundays).
4. Ragging in any form is strictly prohibited and punishable.
5. Students must maintain silence in hostel rooms after **10:00 PM**.
6. Consumption of alcohol, drugs, or smoking is strictly prohibited.
7. Students are responsible for the safety of their belongings.
8. Electrical appliances like heaters and irons are not allowed in rooms.
9. Students must keep their rooms clean and tidy at all times.
10. Any damage to hostel property will be charged to the student.
11. Students must inform warden before leaving for home/outing.
12. Mobile phones should be in silent mode during study hours.
13. Mess timings must be strictly followed.
14. Students must carry ID cards at all times inside hostel premises.
15. Parents can contact warden for any emergency situations.

**Warden Emergency Contact:** `9553866278` (WhatsApp + Phone call)

---

## 16. File Upload Architecture

### Student/Application Photos
- Uploaded as base64 data URLs during application form submission
- Stored directly in `hostel_applications.photo_url` (Supabase DB column)
- Displayed in warden application cards and gate pass print view

### Warden Signature
- Uploaded via dialog in Gate Passes tab
- Stored in Supabase Storage bucket `signatures`
- Public URL stored in `wardens.signature_url`
- Appended to approved gate pass view and printed gate pass

### Study Materials
- PDFs uploaded via warden dashboard
- Saved to `public/uploads/` via Vite middleware local API
- Referenced in `study_materials.json` with subject name, branch, year
- Students can download or use provided Google Drive links

---

## 17. Session Management

Sessions are stored in `sessionStorage` (not `localStorage`) — they expire on tab/browser close.

| Session Key | Type | Contents | Expiry |
|---|---|---|---|
| `currentStudent` | JSON | Student object + `expiresAt` | 8 hours |
| `currentWarden` | JSON | Warden object | Tab session |
| `currentParent` | JSON | Parent object | Tab session |
| `currentAdmin` | JSON | Admin object | Tab session |
| `hasSeenSplash` | string | `"true"` | Tab session |

Session utilities live in `src/lib/session.ts`:
- `getStudentSession()` / `clearStudentSession()`
- `getWardenSession()` / `clearWardenSession()`
- `getParentSession()` / `clearParentSession()`
- `getAdminSession()` / `clearAdminSession()`

---

## 18. Form Validation

Validation is handled via **Zod schemas** in `src/lib/validations.ts`:

- **Gate Pass Schema** — validates email, mobile numbers (10 digits), dates, and purpose (5–500 chars)
- **Issue Report Schema** — validates description (5–1000 chars)
- Error formatting is done via `formatValidationErrors()` helper

React Hook Form is used throughout for controlled form state with schema resolvers.

---

## 19. Project Structure

```
hostel-ihub-main/
├── public/                   # Static files + local JSON storage
│   ├── uploads/              # Uploaded study material PDFs
│   ├── medical_alerts.json   # Local medical alert store
│   ├── study_materials.json  # Local study materials index
│   ├── food_selections.json  # Local food preference store
│   └── deleted_students.json # Hard-delete blocklist
│
├── src/
│   ├── assets/               # Room type images (PNG) + logo assets
│   ├── components/
│   │   ├── admin/            # WardenApproval, WardenCredentialGenerator
│   │   ├── warden/           # 7 warden-specific components
│   │   ├── ui/               # 49 Radix UI Shadcn components
│   │   ├── CollegeHeader.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── ImageCarousel.tsx
│   │   ├── FoodMenu.tsx
│   │   ├── PaymentPortal.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── AdministrationProfiles.tsx
│   │
│   ├── hooks/
│   │   ├── use-theme.tsx     # ThemeProvider + useTheme hook
│   │   ├── use-toast.ts      # Toast notification hook
│   │   └── use-mobile.tsx    # Mobile breakpoint detection
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client initialization
│   │       └── types.ts      # Full auto-generated TypeScript types
│   │
│   ├── lib/
│   │   ├── session.ts        # Session get/set/clear utilities
│   │   ├── validations.ts    # Zod schemas
│   │   ├── localStudentApi.ts# Deleted-students blocklist API
│   │   └── utils.ts          # cn() class merge utility (clsx + tailwind-merge)
│   │
│   ├── pages/                # 13 route pages
│   ├── App.tsx               # Router + ThemeProvider + SplashScreen
│   ├── main.tsx              # React DOM render
│   ├── index.css             # Global CSS + design tokens + animations
│   └── App.css               # App-level overrides
│
├── supabase/                 # Supabase project config + migrations
├── medical-alert-backend/    # Supplementary backend utilities
├── tailwind.config.ts        # Tailwind config with custom colors + animations
├── vite.config.ts            # Vite + custom Node.js middleware API server
├── tsconfig.json             # TypeScript root config
├── package.json              # All dependencies
└── README.md                 # This file
```

---

## 20. Getting Started

### Prerequisites
- Node.js 18+
- npm or bun package manager
- Supabase account with a project set up

### Installation

```bash
# Install dependencies
npm install
# OR
bun install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:8080` along with the custom Node.js middleware for local API routes.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 📋 Supported Branches

CSE · AIML · DS · ECE · EEE · MECH · CIVIL · IT · CSM · CSD · DME · DECE · DEEE · DCME · DCIVIL

## 📅 Supported Years

1st Year · 2nd Year · 3rd Year · 4th Year

---

> Built with ❤️ for **Geethanjali Institute of Science & Technology** — *Championing Digital Hostel Management*

© 2026 Geethanjali Institute of Science & Technology. All rights reserved.
