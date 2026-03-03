# GIST Hostel Management System

A comprehensive hostel management system for Geethanjali Institute of Science & Technology (GIST), built with React, TypeScript, and Supabase.

## 🏠 Features

### For Students
- **Hostel Application**: Apply for hostel accommodation with room type selection (Single, Double, Triple, Four-bed, Six-bed) and AC/Non-AC options
- **Gate Pass Requests**: Apply for gate passes with out/in dates and purpose
- **Dashboard**: View room allocation, fee status, and gate pass history with warden signature
- **Issue Reporting**: Report electrical and food-related issues
- **Study Materials**: Access study materials uploaded by wardens

### For Parents
- **Dashboard**: Monitor child's hostel status, room details, and fee information
- **Gate Pass Tracking**: View gate pass request status
- **Quick Links**: Contact warden, emergency contacts, and hostel rules

### For Wardens (Boys & Girls Hostel)
- **Application Management**: Accept/reject hostel applications with automatic email notifications
- **Gate Pass Approval**: Approve/reject student gate passes with digital signature
- **Room Management**: View hostel room details, room allotment, bed closure management
- **Student Management**: Update fee details and add remarks
- **Issue Tracking**: Manage electrical and food issue reports
- **Study Material Upload**: Upload study materials for students

### For Admin
- **Student Overview**: View all students by branch and year
- **Fee Management**: Update student fee details (total, paid, pending)
- **Pending Room Dashboard**: Real-time view of room occupancy across AC and Non-AC blocks

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, Edge Functions)
- **Email Notifications**: Resend API

## 📱 User Portals

| Portal | URL Path |
|--------|----------|
| Home | `/` |
| Hostel Application | `/hostel-application` |
| Student Login (Boys) | `/student-login?gender=boys` |
| Student Login (Girls) | `/student-login?gender=girls` |
| Parent Login | `/parent-login?gender=boys` or `girls` |
| Warden Login | `/warden-login?gender=boys` or `girls` |
| Admin Login | `/admin-login` |

## 👥 Default Credentials

- **Admin**: Username: `Admin@123`, Password: `200421`

---

Built with ❤️ for Geethanjali Institute of Science & Technology
"# hostel-management" 
