import { Button } from "@/components/ui/button";
import { LogOut, User, Camera, Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

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
}: DashboardHeaderProps) => {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  const handleAvatarClick = () => {
    if (onPhotoUpload) {
      onPhotoUpload(); // open file picker for upload
    } else if (userPhotoUrl) {
      setPhotoDialogOpen(true); // open zoom dialog
    }
  };

  return (
    <>
      <div className="sticky top-0 z-20 bg-card border-b-2 border-border shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showPhoto && (
              <div
                className={`relative group ${onPhotoUpload ? "cursor-pointer" : ""}`}
                onClick={handleAvatarClick}
                title={onPhotoUpload ? "Click to update your profile photo" : undefined}
              >
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary transition-all group-hover:opacity-80"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center transition-all group-hover:opacity-80">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                {/* Camera overlay for upload */}
                {onPhotoUpload && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="font-bold text-lg text-foreground">{userName}</p>
              {userSubtitle && (
                <p className="text-sm font-medium text-muted-foreground">{userSubtitle}</p>
              )}
            </div>
          </div>

          <h1 className="hidden md:block text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            <span className={titleColor}>{title}</span>
          </h1>

          <div className="flex items-center gap-2">
            {onSettingsClick && (
              <Button variant="ghost" size="icon" onClick={onSettingsClick} className="text-muted-foreground hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <ThemeToggle />
            <Button variant="outline" onClick={onLogout} className="h-11 px-4 text-base font-medium">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Photo Zoom Dialog (when no upload handler) */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-md p-2 bg-card">
          {userPhotoUrl && (
            <img
              src={userPhotoUrl}
              alt="Profile Photo"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardHeader;
