import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, UtensilsCrossed, Check, X, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ElectricalIssue {
  id: string;
  student_name: string;
  roll_number: string;
  room_number: string;
  description: string;
  status: string;
  created_at: string;
}

interface FoodIssue {
  id: string;
  student_name: string;
  roll_number: string;
  description: string;
  status: string;
  created_at: string;
}

interface MedicalAlert {
  id: string;
  student_name: string;
  roll_number: string;
  room_number: string;
  issue_type: string;
  status: string;
  created_at: string;
}

interface IssueReportsProps {
  electricalIssues: ElectricalIssue[];
  foodIssues: FoodIssue[];
  medicalAlerts: MedicalAlert[];
  onRefresh: () => void;
}

const AUTO_REMOVE_MS = 800;

const IssueReports = ({ electricalIssues, foodIssues, medicalAlerts, onRefresh }: IssueReportsProps) => {
  const { toast } = useToast();
  const [selectedElectricalIssue, setSelectedElectricalIssue] = useState<ElectricalIssue | null>(null);
  const [selectedFoodIssue, setSelectedFoodIssue] = useState<FoodIssue | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Local copies so we can immediately update UI (green) and then auto-remove.
  const [localElectrical, setLocalElectrical] = useState<ElectricalIssue[]>(electricalIssues);
  const [localFood, setLocalFood] = useState<FoodIssue[]>(foodIssues);
  const [localMedical, setLocalMedical] = useState<MedicalAlert[]>(medicalAlerts);
  const [selectedMedicalAlert, setSelectedMedicalAlert] = useState<MedicalAlert | null>(null);

  useEffect(() => setLocalElectrical(electricalIssues), [electricalIssues]);
  useEffect(() => setLocalFood(foodIssues), [foodIssues]);
  useEffect(() => setLocalMedical(medicalAlerts), [medicalAlerts]);

  const removeElectrical = (id: string) =>
    setLocalElectrical((prev) => prev.filter((i) => i.id !== id));
  const removeFood = (id: string) => setLocalFood((prev) => prev.filter((i) => i.id !== id));
  const removeMedical = (id: string) => setLocalMedical((prev) => prev.filter((i) => i.id !== id));

  const handleElectricalAction = async (id: string, status: "resolved" | "rejected") => {
    setIsProcessing(true);

    const { error } = await supabase
      .from("electrical_issues")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update issue",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    // Show green/red instantly
    setLocalElectrical((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );

    toast({
      title: status === "resolved" ? "Issue Resolved" : "Issue Rejected",
      description:
        status === "resolved"
          ? "The electrical issue has been resolved successfully."
          : "The electrical issue has been rejected.",
    });

    setSelectedElectricalIssue(null);

    window.setTimeout(() => {
      removeElectrical(id);
      onRefresh();
    }, AUTO_REMOVE_MS);

    setIsProcessing(false);
  };

  const handleFoodAction = async (id: string, status: "resolved" | "rejected") => {
    setIsProcessing(true);

    const { error } = await supabase
      .from("food_issues")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update issue",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    setLocalFood((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));

    toast({
      title: status === "resolved" ? "Issue Resolved" : "Issue Rejected",
      description:
        status === "resolved"
          ? "The food issue has been resolved successfully."
          : "The food issue has been rejected.",
    });

    setSelectedFoodIssue(null);

    window.setTimeout(() => {
      removeFood(id);
      onRefresh();
    }, AUTO_REMOVE_MS);

    setIsProcessing(false);
  };

  const handleMedicalAction = async (id: string, status: "resolved" | "rejected") => {
    setIsProcessing(true);

    const { error } = await supabase
      .from("medical_alerts")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update alert",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    setLocalMedical((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));

    toast({
      title: status === "resolved" ? "Alert Resolved" : "Alert Rejected",
      description:
        status === "resolved"
          ? "The medical alert has been resolved successfully."
          : "The medical alert has been rejected.",
    });

    setSelectedMedicalAlert(null);

    window.setTimeout(() => {
      removeMedical(id);
      onRefresh();
    }, AUTO_REMOVE_MS);

    setIsProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-success/20 text-success border-success/30";
      case "rejected":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-warning/20 text-warning border-warning/30";
    }
  };

  const pendingElectrical = localElectrical.filter((i) => (i.status || "pending") === "pending");
  const pendingFood = localFood.filter((i) => (i.status || "pending") === "pending");
  const pendingMedical = localMedical.filter((i) => (i.status || "pending") === "pending");

  return (
    <Tabs defaultValue="electrical" className="space-y-4">
      <TabsList className="grid w-full max-w-lg grid-cols-3">
        <TabsTrigger value="electrical" className="relative">
          <Zap className="w-4 h-4 mr-2" />
          Electrical
          {pendingElectrical.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning text-warning-foreground text-xs flex items-center justify-center">
              {pendingElectrical.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="food" className="relative">
          <UtensilsCrossed className="w-4 h-4 mr-2" />
          Food
          {pendingFood.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning text-warning-foreground text-xs flex items-center justify-center">
              {pendingFood.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="medical" className="relative">
          <Pill className="w-4 h-4 mr-2" />
          Medical
          {pendingMedical.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
              {pendingMedical.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="electrical" className="space-y-4">
        <h3 className="text-lg font-semibold">Electrical Issue Reports</h3>
        {pendingElectrical.length === 0 ? (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No electrical issues pending</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingElectrical.map((issue) => (
              <Card
                key={issue.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-warning/50"
                onClick={() => setSelectedElectricalIssue(issue)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{issue.student_name}</CardTitle>
                    <span className="w-3 h-3 rounded-full bg-warning pulse-dot" />
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.roll_number}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">{issue.room_number}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{issue.description}</p>
                    <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="food" className="space-y-4">
        <h3 className="text-lg font-semibold">Food Issue Reports</h3>
        {pendingFood.length === 0 ? (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No food issues pending</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFood.map((issue) => (
              <Card
                key={issue.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-warning/50"
                onClick={() => setSelectedFoodIssue(issue)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{issue.student_name}</CardTitle>
                    <span className="w-3 h-3 rounded-full bg-warning pulse-dot" />
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.roll_number}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground truncate">{issue.description}</p>
                    <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="medical" className="space-y-4">
        <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Emergency Medical Alerts
        </h3>
        {pendingMedical.length === 0 ? (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No medical alerts pending</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMedical.map((alert) => (
              <Card
                key={alert.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-destructive/50 bg-destructive/5"
                onClick={() => setSelectedMedicalAlert(alert)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-destructive">{alert.student_name}</CardTitle>
                    <span className="w-3 h-3 rounded-full bg-destructive pulse-dot-red" />
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.roll_number}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="inline-block px-2 py-1 bg-destructive/10 text-destructive text-xs font-bold rounded uppercase">
                      {alert.issue_type}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">{alert.room_number}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Electrical Issue Dialog */}
      <Dialog open={!!selectedElectricalIssue} onOpenChange={() => setSelectedElectricalIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Electrical Issue Details
            </DialogTitle>
          </DialogHeader>
          {selectedElectricalIssue && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{selectedElectricalIssue.student_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{selectedElectricalIssue.roll_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Room Number</p>
                  <p className="font-medium">{selectedElectricalIssue.room_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedElectricalIssue.status)}>
                    {selectedElectricalIssue.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Issue Description</p>
                <p className="font-medium mt-1">{selectedElectricalIssue.description}</p>
              </div>

              {(selectedElectricalIssue.status || "pending") === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleElectricalAction(selectedElectricalIssue.id, "resolved")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Resolve"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleElectricalAction(selectedElectricalIssue.id, "rejected")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Food Issue Dialog */}
      <Dialog open={!!selectedFoodIssue} onOpenChange={() => setSelectedFoodIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-warning" />
              Food Issue Details
            </DialogTitle>
          </DialogHeader>
          {selectedFoodIssue && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{selectedFoodIssue.student_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{selectedFoodIssue.roll_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedFoodIssue.status)}>{selectedFoodIssue.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Issue Description</p>
                <p className="font-medium mt-1">{selectedFoodIssue.description}</p>
              </div>

              {(selectedFoodIssue.status || "pending") === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleFoodAction(selectedFoodIssue.id, "resolved")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Resolve"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleFoodAction(selectedFoodIssue.id, "rejected")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Medical Alert Dialog */}
      <Dialog open={!!selectedMedicalAlert} onOpenChange={() => setSelectedMedicalAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Pill className="w-5 h-5" />
              Emergency Medical Alert Details
            </DialogTitle>
          </DialogHeader>
          {selectedMedicalAlert && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{selectedMedicalAlert.student_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{selectedMedicalAlert.roll_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Room Number</p>
                  <p className="font-medium">{selectedMedicalAlert.room_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issue Type</p>
                  <Badge variant="destructive" className="font-bold">
                    {selectedMedicalAlert.issue_type.toUpperCase()}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Reported At</p>
                  <p className="font-medium">{new Date(selectedMedicalAlert.created_at).toLocaleString()}</p>
                </div>
              </div>

              {(selectedMedicalAlert.status || "pending") === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleMedicalAction(selectedMedicalAlert.id, "resolved")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Mark Resolved"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isProcessing}
                    onClick={() => handleMedicalAction(selectedMedicalAlert.id, "rejected")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default IssueReports;

