import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // If iOS and not already in standalone mode, show instructions once
    if (isIosDevice && !(window.navigator as any).standalone) {
      const hasSeenIosPrompt = localStorage.getItem("hasSeenIosPrompt");
      if (!hasSeenIosPrompt) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return;

    if (isIOS) {
      // For iOS, we can't trigger the prompt, just show custom UI
      alert("To install: Tap the 'Share' icon in Safari and select 'Add to Home Screen'.");
      localStorage.setItem("hasSeenIosPrompt", "true");
      setShowPrompt(false);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const closePrompt = () => {
    setShowPrompt(false);
    if (isIOS) localStorage.setItem("hasSeenIosPrompt", "true");
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-96"
        >
          <div className="bg-background border-2 border-primary/20 shadow-2xl rounded-3xl p-5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
              <Button variant="ghost" size="icon" onClick={closePrompt} className="rounded-full h-8 w-8 text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="font-black text-lg italic tracking-tighter text-primary uppercase">Install App</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {isIOS 
                    ? "Add to Home Screen for the best mobile experience and offline access." 
                    : "Install GIST HosteliHub on your device for quick access and real-time alerts."}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleInstallClick} className="rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold px-4 py-2 h-auto shadow-lg shadow-primary/20">
                    {isIOS ? "Show Instructions" : "Download App"}
                  </Button>
                  {isIOS && (
                     <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-2">
                        <Smartphone className="w-3 h-3" /> 
                        <span>Safari Only</span>
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Elegant glass background effect */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-accent/5 rounded-full blur-2xl -z-10" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
