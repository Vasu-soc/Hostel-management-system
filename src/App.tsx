import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import HostelApplication from "./pages/HostelApplication";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import WardenLogin from "./pages/WardenLogin";
import WardenDashboard from "./pages/WardenDashboard";
import WardenRegister from "./pages/WardenRegister";
import ParentLogin from "./pages/ParentLogin";
import ParentDashboard from "./pages/ParentDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setIsFirstVisit(true);
      sessionStorage.setItem("hasSeenSplash", "true");
    } else {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {showSplash && isFirstVisit ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/hostel-application" element={<HostelApplication />} />
                  <Route path="/student-login" element={<StudentLogin />} />
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                  <Route path="/warden-login" element={<WardenLogin />} />
                  <Route path="/warden-dashboard" element={<WardenDashboard />} />
                  <Route path="/warden-register" element={<WardenRegister />} />
                  <Route path="/parent-login" element={<ParentLogin />} />
                  <Route path="/parent-dashboard" element={<ParentDashboard />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
