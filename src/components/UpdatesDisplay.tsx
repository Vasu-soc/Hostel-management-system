import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Megaphone
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

const UpdatesDisplay = () => {
  const [updates, setUpdates] = useState<Update[]>([{
    id: "sample-1",
    title: "Welcome to our New Hostel Management System!",
    content: "We have launched our new streamlined hostel administration portal. Students can now apply for rooms, request gate passes, and track their fee payments all in one place. Stay tuned for more updates!",
    image_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
    created_at: new Date().toISOString(),
    author_name: "Administration",
    created_by_role: "admin"
  }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();

    const channel = supabase
      .channel("public-updates")
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
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("updates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching updates:", error);
        return;
      }

      if (data && data.length > 0) {
        setUpdates(data as Update[]);
      } else {
        // Sample update as requested by user
        setUpdates([{
          id: "sample-1",
          title: "Welcome to our New Hostel Management System!",
          content: "We have launched our new streamlined hostel administration portal. Students can now apply for rooms, request gate passes, and track their fee payments all in one place. Stay tuned for more updates!",
          image_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
          created_at: new Date().toISOString(),
          author_name: "Administration",
          created_by_role: "admin"
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const nextUpdate = () => {
    setActiveIndex((prev) => (prev + 1) % updates.length);
  };

  const prevUpdate = () => {
    setActiveIndex((prev) => (prev - 1 + updates.length) % updates.length);
  };

  // No longer returning null or skeleton here as we have initial sample data
  // which makes it visible in milliseconds as requested.

  if (updates.length === 0) return null;

  const currentUpdate = updates[activeIndex];

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative group">
        {/* Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-300 group-hover:duration-200"></div>
        
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-card/60 backdrop-blur-md shadow-2xl rounded-2xl">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row min-h-[250px]">
              {/* Image Section */}
              {currentUpdate.image_url && (
                <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                  <img 
                    key={currentUpdate.id + "_img"}
                    src={currentUpdate.image_url} 
                    alt={currentUpdate.title} 
                    className="w-full h-full object-cover animate-in fade-in scale-in duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent"></div>
                </div>
              )}

              {/* Content Section */}
              <div className={`flex-1 p-6 md:p-8 flex flex-col justify-center ${!currentUpdate.image_url ? 'md:items-center text-center' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default" className="bg-primary/90 text-white animate-pulse">
                    <Megaphone className="w-3 h-3 mr-1" />
                    NEW UPDATE
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(currentUpdate.created_at).toLocaleDateString()}
                  </div>
                </div>

                <h3 
                  key={currentUpdate.id + "_h3"}
                  className="text-2xl md:text-3xl font-black text-foreground mb-4 leading-tight animate-in slide-in-from-left-4 duration-300"
                >
                  {currentUpdate.title}
                </h3>

                <p 
                  key={currentUpdate.id + "_p"}
                  className="text-muted-foreground text-sm md:text-base line-clamp-3 mb-6 animate-in slide-in-from-left-6 duration-300"
                >
                  {currentUpdate.content}
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Posted by {currentUpdate.author_name} ({currentUpdate.created_by_role})
                  </span>
                </div>
              </div>

              {/* Navigation Controls */}
              {updates.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={prevUpdate}
                    className="p-2 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextUpdate}
                    className="p-2 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {/* Pagination Dots */}
              {updates.length > 1 && (
                <div className="absolute top-4 right-4 flex gap-1">
                  {updates.map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-4 bg-primary' : 'bg-primary/20'}`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdatesDisplay;
