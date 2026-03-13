import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Calendar, 
  Filter, 
  AlertCircle,
  Clock,
  User,
  FileText,
  DoorOpen
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface RecycleBinItem {
  id: string;
  table_name: string;
  original_id: string;
  data: any;
  deleted_at: string;
  warden_type: string | null;
}

interface RecycleBinProps {
  wardenType?: string;
}

const RecycleBin = ({ wardenType }: RecycleBinProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");

  useEffect(() => {
    fetchRecycleBin();
    
    // Cleanup old items (older than 30 days) on load
    cleanupOldItems();
  }, [wardenType]);

  const fetchRecycleBin = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("recycle_bin")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (wardenType) {
        query = query.or(`warden_type.eq.${wardenType},warden_type.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data as RecycleBinItem[]) || []);
    } catch (error: any) {
      console.error("Error fetching recycle bin:", error);
      toast({
        title: "Error",
        description: "Failed to fetch deleted items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldItems = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await supabase
        .from("recycle_bin")
        .delete()
        .lt("deleted_at", thirtyDaysAgo.toISOString());

      if (error) console.error("Cleanup error:", error);
    } catch (e) {
      console.error("Exception during cleanup:", e);
    }
  };

  const handleRestore = async (item: RecycleBinItem) => {
    try {
      // 1. Insert back to original table
      const { error: restoreError } = await supabase
        .from(item.table_name as any)
        .insert(item.data);

      if (restoreError) {
        // If it fails because of ID conflict, maybe it was partially restored or someone else added it?
        // But usually we just want to put it back.
        throw restoreError;
      }

      // 2. Remove from recycle bin
      const { error: deleteError } = await supabase
        .from("recycle_bin")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Restored",
        description: `Item restored to ${item.table_name} successfully`,
      });

      fetchRecycleBin();
    } catch (error: any) {
      console.error("Restore error:", error);
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore item",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Are you sure? This item will be permanently deleted and cannot be recovered!")) return;

    try {
      const { error } = await supabase
        .from("recycle_bin")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Permanently Deleted",
        description: "The item has been removed from the system forever.",
      });

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "students": return <User className="w-4 h-4" />;
      case "hostel_applications": return <FileText className="w-4 h-4" />;
      case "gate_passes": return <DoorOpen className="w-4 h-4" />;
      default: return <Trash2 className="w-4 h-4" />;
    }
  };

  const getDisplayName = (item: RecycleBinItem) => {
    const data = item.data;
    if (item.table_name === "students") return data.student_name || data.roll_number;
    if (item.table_name === "hostel_applications") return data.student_name || "Application";
    if (item.table_name === "gate_passes") return data.student_name || data.roll_number || "Gate Pass";
    return item.original_id;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = getDisplayName(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.table_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTable === "all" || item.table_name === filterTable;
    return matchesSearch && matchesFilter;
  });

  const getRemainingDays = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate);
    expiryDate.setDate(deletedDate.getDate() + 30);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Recycle Bin</h2>
            <p className="text-xs text-muted-foreground italic">Items are kept for 30 days before automatic deletion.</p>
          </div>
        </div>
        
        <div className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search deleted items..." 
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="students">Students</option>
            <option value="hostel_applications">Applications</option>
            <option value="gate_passes">Gate Passes</option>
          </select>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRecycleBin}
          disabled={loading}
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-48 bg-muted/20" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border">
          <Trash2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-bold text-muted-foreground">Recycle Bin is empty</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Deleted students, applications, and gate passes will appear here for 30 days.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const daysLeft = getRemainingDays(item.deleted_at);
            
            return (
              <Card key={item.id} className="group border shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getTableIcon(item.table_name)}
                    </div>
                    <div className="overflow-hidden">
                      <CardTitle className="text-base font-bold truncate">{getDisplayName(item)}</CardTitle>
                      <Badge variant="outline" className="text-[10px] h-4 uppercase tracking-tighter bg-muted/50">
                        {item.table_name.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${daysLeft < 5 ? 'text-destructive' : 'text-amber-600'}`}>
                      <Clock className="w-3 h-3" />
                      {daysLeft}d Left
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Deleted on {new Date(item.deleted_at).toLocaleDateString()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="hero" 
                        className="h-8 text-xs font-bold"
                        onClick={() => handleRestore(item)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Restore
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10"
                        onClick={() => handlePermanentDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold">Important Information:</p>
            <p className="mt-1 opacity-90">
              Restoring a student will put them back into the active student list with their original details. 
              Restoring an application will make it visible again in the pending/accepted applications list.
              All data is automatically purged after 30 days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecycleBin;
