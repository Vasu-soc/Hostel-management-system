import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface DashboardHeaderProps {
  title: string;
  titleColor?: string;
  userName: string;
  userSubtitle?: string;
  userPhotoUrl?: string;
  onLogout: () => void;
  showPhoto?: boolean;
}

const DashboardHeader = ({
  title,
  titleColor = "text-primary",
  userName,
  userSubtitle,
  userPhotoUrl,
  onLogout,
  showPhoto = true,
}: DashboardHeaderProps) => {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-20 bg-card border-b-2 border-border shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showPhoto && (
              userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setPhotoDialogOpen(true)}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )
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
            <ThemeToggle />
            <Button variant="outline" onClick={onLogout} className="h-11 px-4 text-base font-medium">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Photo Zoom Dialog */}
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
