import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Plus, 
  Trash2, 
  ImagePlus, 
  Loader2, 
  MessageSquare,
  Calendar,
  X
} from "lucide-react";

interface Update {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_name: string;
  created_by_role: string;
}

interface UpdatesManagementProps {
  authorName: string;
  role: "admin" | "warden";
}

const UpdatesManagement = ({ authorName, role }: UpdatesManagementProps) => {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newUpdate, setNewUpdate] = useState({
    title: "",
    content: "",
    image_url: "",
  });

  useEffect(() => {
    fetchUpdates();

    const channel = supabase
      .channel("updates-management")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "updates" },
        () => fetchUpdates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUpdates = async () => {
    const { data, error } = await (supabase as any)
      .from("updates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching updates:", error);
      return;
    }

    if (data) {
      setUpdates(data as Update[]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("updates")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("updates")
        .getPublicUrl(filePath);

      setNewUpdate({ ...newUpdate, image_url: publicUrl });
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.title || !newUpdate.content) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await (supabase as any).from("updates").insert({
        title: newUpdate.title,
        content: newUpdate.content,
        image_url: newUpdate.image_url || null,
        author_name: authorName,
        created_by_role: role,
      });

      if (error) throw error;

      toast({ title: "Update posted successfully" });
      setNewUpdate({ title: "", content: "", image_url: "" });
      setShowAddForm(false);
      fetchUpdates();
    } catch (error: any) {
      toast({
        title: "Failed to post update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (!confirm("Are you sure you want to delete this update?")) return;

    try {
      const { error } = await (supabase as any).from("updates").delete().eq("id", id);
      if (error) throw error;

      if (imageUrl) {
        const fileName = imageUrl.split("/").pop();
        if (fileName) {
          await supabase.storage.from("updates").remove([fileName]);
        }
      }

      toast({ title: "Update deleted successfully" });
      fetchUpdates();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black italic flex items-center gap-2 text-primary">
            <Bell className="w-6 h-6" />
            SYSTEM UPDATES
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">Manage announcements for students</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-white font-bold h-11 sm:h-10">
            <Plus className="w-4 h-4" />
            Add Announcement
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="border-2 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
          <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Create New Announcement</CardTitle>
              <CardDescription>Post an update for the main dashboard</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Headline / Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Tommorrow is a Holiday, College Fest Next Week"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                  className="h-12 border-2 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Details</Label>
                <Textarea
                  id="content"
                  placeholder="Explain the update in detail..."
                  value={newUpdate.content}
                  onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                  className="min-h-[120px] border-2 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label>Announcement Image (Optional)</Label>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="image-upload"
                      className={`flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-lg p-6 w-full md:w-64 h-32 hover:border-primary hover:bg-primary/5 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium">Upload Image</span>
                        </>
                      )}
                    </Label>
                  </div>
                  {newUpdate.image_url && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary shadow-lg group">
                      <img src={newUpdate.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewUpdate({...newUpdate, image_url: ""})}
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1 h-12 bg-primary text-white font-bold text-lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : "Post Announcement"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="h-12 px-8">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {updates.length === 0 ? (
        <Card className="border-2 border-dashed flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
          <p>No announcements posted yet.</p>
          <p className="text-sm">Important updates will appear on the student dashboard.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {updates.map((update) => (
            <Card key={update.id} className="overflow-hidden border-2 border-border hover:border-primary/30 transition-all group flex flex-col">
              {update.image_url && (
                <div className="h-48 w-full overflow-hidden">
                  <img src={update.image_url} alt={update.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="secondary" className="mb-2">
                    {update.created_by_role === 'admin' ? 'Admin' : 'Warden'} Posted
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10" 
                    onClick={() => handleDelete(update.id, update.image_url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{update.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground text-sm line-clamp-4 mb-4">{update.content}</p>
                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(update.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    Posted by {update.author_name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdatesManagement;

import { Badge } from "@/components/ui/badge";
