import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Calendar, 
  Type, 
  Loader2, 
  X,
  Camera
} from "lucide-react";

interface Album {
  id: string;
  event_name: string;
  event_date: string;
  image_urls: string[];
  description: string | null;
  created_at: string;
}

const AlbumManagement = ({ wardenId, wardenType }: { wardenId: string; wardenType: string }) => {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hostel_albums")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch albums",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addImageUrl = () => {
    if (!currentImageUrl.trim()) return;
    if (!currentImageUrl.startsWith("http")) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid image URL (starting with http/https)",
        variant: "destructive"
      });
      return;
    }
    setNewImageUrls([...newImageUrls, currentImageUrl.trim()]);
    setCurrentImageUrl("");
  };

  const removeImageUrl = (index: number) => {
    setNewImageUrls(newImageUrls.filter((_, i) => i !== index));
  };

  const handleCreateAlbum = async () => {
    if (!eventName || !eventDate || newImageUrls.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please provide event name, date, and at least one image.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase.from("hostel_albums").insert({
        event_name: eventName,
        event_date: eventDate,
        image_urls: newImageUrls,
        description: description,
        created_by: wardenId,
        warden_type: wardenType
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album created successfully!",
      });

      // Reset form
      setEventName("");
      setEventDate("");
      setDescription("");
      setNewImageUrls([]);
      
      fetchAlbums();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm("Are you sure you want to delete this album?")) return;

    try {
      const { error } = await supabase
        .from("hostel_albums")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Album removed successfully",
      });
      setAlbums(albums.filter(a => a.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-primary italic flex items-center gap-2">
            <Camera className="w-8 h-8" />
            Album Management
          </h2>
          <p className="text-muted-foreground">Upload and manage hostel event photos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Album Form */}
        <Card className="lg:col-span-1 border-2 border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm h-fit sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Album
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Type className="w-3 h-3" />
                Event Name
              </Label>
              <Input 
                placeholder="e.g. Fresher's Day 2024" 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Event Date
              </Label>
              <Input 
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                Upload Images (URLs)
              </Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Paste image URL here..." 
                  value={currentImageUrl}
                  onChange={(e) => setCurrentImageUrl(e.target.value)}
                  className="bg-background/50"
                  onKeyDown={(e) => e.key === 'Enter' && addImageUrl()}
                />
                <Button size="icon" onClick={addImageUrl} variant="outline" className="shrink-0 border-2 border-primary/20">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Add multiple URLs to create a gallery</p>
            </div>

            {newImageUrls.length > 0 && (
              <div className="bg-muted/30 p-3 rounded-xl border border-border space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Queued Images ({newImageUrls.length})</p>
                <div className="grid grid-cols-4 gap-2">
                  {newImageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img src={url} alt="Preview" className="w-full h-full object-cover rounded-lg border border-border shadow-sm" />
                      <button 
                        onClick={() => removeImageUrl(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
              variant="hero"
              onClick={handleCreateAlbum}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              Publish Album
            </Button>
          </CardContent>
        </Card>

        {/* Albums List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Existing Albums
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : albums.length === 0 ? (
            <Card className="border-2 border-dashed border-border py-20 text-center bg-muted/10">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h4 className="text-lg font-bold text-muted-foreground text-center">No albums created yet</h4>
              <p className="text-sm text-muted-foreground text-center">Start by creating your first event album</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {albums.map((album) => (
                <Card key={album.id} className="group border-2 border-border hover:border-primary/30 transition-all overflow-hidden bg-card/50 backdrop-blur-sm shadow-md hover:shadow-xl">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={album.image_urls[0]} 
                      alt={album.event_name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-none">
                        {album.image_urls.length} Images
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h4 className="text-white font-black text-lg truncate drop-shadow-lg">{album.event_name}</h4>
                      <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                        <Calendar className="w-3 h-3" />
                        {new Date(album.event_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 flex justify-between items-center bg-muted/10">
                    <span className="text-xs text-muted-foreground font-medium">Created {new Date(album.created_at).toLocaleDateString()}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => handleDeleteAlbum(album.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Badge component since it might not be exported from ui/badge in this specific setup if not existing
const Badge = ({ children, className, variant = "default" }: any) => {
  const variants: any = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default AlbumManagement;
