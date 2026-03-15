import { Button } from "@/components/ui/button";
import { LogOut, User, Camera, Settings, Activity } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  title: string;
  titleColor?: string;
  userName: string;
  userSubtitle?: React.ReactNode;
  userPhotoUrl?: string;
  onLogout: () => void;
  showPhoto?: boolean;
  onPhotoUpload?: () => void; // optional: student profile photo upload trigger
  onSettingsClick?: () => void;
  studentId?: string;
  extraActions?: React.ReactNode;
  beforeTitleAction?: React.ReactNode;
  stickyOffset?: string;
}

const DashboardHeader = ({
  title,
  titleColor = "text-primary",
  userName,
  userSubtitle,
  userPhotoUrl,
  onLogout,
  showPhoto = true,
  onPhotoUpload,
  onSettingsClick,
  studentId,
  extraActions,
  beforeTitleAction,
  stickyOffset = "top-0",
}: DashboardHeaderProps) => {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  const handleAvatarClick = () => {
    if (onPhotoUpload) {
      onPhotoUpload();
    } else if (userPhotoUrl) {
      setPhotoDialogOpen(true);
    }
  };

  return (
    <>
      <div className={`sticky ${stickyOffset} z-40 w-full bg-background/60 backdrop-blur-2xl border-b border-primary/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-500`}>
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-4">
          {/* User Info Section */}
          <div className="flex items-center gap-3 min-w-0">
            {showPhoto && (
              <div
                className={`relative group shrink-0 ${onPhotoUpload ? "cursor-pointer" : ""}`}
                onClick={handleAvatarClick}
              >
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-accent rounded-full blur-sm opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt="Profile"
                    className="relative w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-background ring-1 ring-primary/20 transition-all group-hover:scale-105"
                  />
                ) : (
                  <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center border-2 border-background ring-1 ring-primary/20 transition-all group-hover:scale-105">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                )}
                {onPhotoUpload && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-sm md:text-base text-foreground tracking-tight leading-none truncate">{userName}</p>
              {userSubtitle && (
                <div className="mt-1 text-[10px] md:text-xs font-bold text-muted-foreground tracking-widest uppercase leading-none opacity-80">{userSubtitle}</div>
              )}
            </div>
          </div>

          {/* Title Section - Modern & Centered */}
          <div className="hidden lg:flex flex-1 justify-center px-4">
             <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
               {beforeTitleAction}
               <h1 className={`text-xl font-black italic tracking-tighter uppercase ${titleColor}`}>
                 {title}
               </h1>
             </div>
          </div>

          {/* Right Actions - Mobile Optimized */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-primary/10">
              {studentId && <NotificationBell studentId={studentId} />}
              {onSettingsClick && (
                <Button variant="ghost" size="icon" onClick={onSettingsClick} className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                  <Settings className="w-5 h-5" />
                </Button>
              )}
              {extraActions}
              <ThemeToggle />
            </div>

            <Button 
              variant="outline" 
              onClick={onLogout} 
              className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-destructive/5 hover:bg-destructive hover:text-white border-2 border-destructive/20 shadow-lg hover:shadow-destructive/40 transition-all duration-300 p-0 flex items-center justify-center"
              title="Terminate Session"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Title Strip */}
        <div className="lg:hidden w-full px-4 pb-2 flex justify-center">
           <h1 className={`text-xs font-black italic tracking-[0.2em] uppercase opacity-60 flex items-center gap-2`}>
             <Activity className="w-3 h-3 animate-pulse" />
             {title}
           </h1>
        </div>
      </div>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none overflow-hidden flex items-center justify-center">
          {userPhotoUrl && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative p-2"
            >
               <img
                src={userPhotoUrl}
                alt="Profile Photo"
                className="w-full h-auto max-h-[80vh] object-contain rounded-3xl shadow-2xl border-4 border-white/10"
              />
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardHeader;
