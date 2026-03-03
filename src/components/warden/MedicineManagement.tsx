import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Medicine {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  warden_type: string;
  is_available: boolean;
  created_at: string;
}

interface MedicineManagementProps {
  wardenId: string;
  wardenType: "boys" | "girls";
}

const medicineIcons = [
  { value: "💊", label: "💊 Pill" },
  { value: "🤒", label: "🤒 Fever" },
  { value: "🤧", label: "🤧 Cold" },
  { value: "💪", label: "💪 Pain" },
  { value: "🤢", label: "🤢 Nausea" },
  { value: "🤕", label: "🤕 Headache" },
  { value: "🩹", label: "🩹 First Aid" },
  { value: "🩺", label: "🩺 General" },
  { value: "💉", label: "💉 Injection" },
  { value: "🧴", label: "🧴 Lotion" },
];

const MedicineManagement = ({ wardenId, wardenType }: MedicineManagementProps) => {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    description: "",
    icon: "💊",
  });

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .eq("warden_type", wardenType)
      .eq("is_available", true)
      .order("name");

    if (error) {
      console.error("Error fetching medicines:", error);
      return;
    }
    setMedicines(data as Medicine[]);
  };

  useEffect(() => {
    fetchMedicines();

    // Real-time subscription
    const channel = supabase
      .channel(`medicines-${wardenType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medicines",
          filter: `warden_type=eq.${wardenType}`,
        },
        () => {
          fetchMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wardenType]);

  const handleAddMedicine = async () => {
    if (!newMedicine.name.trim()) {
      toast({ title: "Error", description: "Medicine name is required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("medicines").insert({
      name: newMedicine.name.trim(),
      description: newMedicine.description.trim() || null,
      icon: newMedicine.icon,
      warden_type: wardenType,
      created_by: wardenId,
      is_available: true,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add medicine", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "Success", description: "Medicine added successfully" });
    setNewMedicine({ name: "", description: "", icon: "💊" });
    setDialogOpen(false);
    setIsLoading(false);
    fetchMedicines();
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!confirm("Are you sure you want to remove this medicine?")) return;

    const { error } = await supabase
      .from("medicines")
      .delete()
      .eq("id", medicineId);

    if (error) {
      toast({ title: "Error", description: "Failed to remove medicine", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Medicine removed successfully" });
    fetchMedicines();
  };

  return (
    <Card className="border-2 border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Pill className="w-5 h-5 text-success" />
          Medicine Inventory
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="w-4 h-4" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Medicine Name *</Label>
                <Input
                  placeholder="e.g., Paracetamol, Crocin"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="e.g., For fever and headache"
                  value={newMedicine.description}
                  onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={newMedicine.icon}
                  onValueChange={(value) => setNewMedicine({ ...newMedicine, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {medicineIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddMedicine}
                disabled={isLoading || !newMedicine.name.trim()}
                className="w-full"
              >
                {isLoading ? "Adding..." : "Add Medicine"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {medicines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No medicines added yet</p>
            <p className="text-sm">Add medicines to make them visible on the home page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {medicines.map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medicine.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{medicine.name}</p>
                    {medicine.description && (
                      <p className="text-xs text-muted-foreground">{medicine.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteMedicine(medicine.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicineManagement;
