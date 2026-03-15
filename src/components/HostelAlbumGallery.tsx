import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ImageIcon,
  Maximize2,
  Loader2
} from "lucide-react";

interface Album {
  id: string;
  event_name: string;
  event_date: string;
  image_urls: string[];
  description: string | null;
}

const HostelAlbumGallery = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset viewer state when main dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Clear all viewer states after a small delay to allow for close animation
      const timer = setTimeout(() => {
        setIsViewerOpen(false);
        setSelectedAlbum(null);
        setCurrentImageIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Fetch albums when dialog opens
      fetchAlbums();
    }
  }, [isOpen]);

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("hostel_albums")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      if (data) setAlbums(data);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openViewer = (album: Album, index: number) => {
    setSelectedAlbum(album);
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedAlbum) return;
    setCurrentImageIndex((prev) => (prev + 1) % selectedAlbum.image_urls.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedAlbum) return;
    setCurrentImageIndex((prev) => (prev - 1 + selectedAlbum.image_urls.length) % selectedAlbum.image_urls.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-accent/20 border-b-[2px] sm:border-b-4 border-accent-foreground/10"
          aria-label="Hostel Album"
        >
          <Camera className="h-4 w-4 sm:h-6 sm:w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        aria-describedby={undefined}
        className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-3xl"
      >
        <DialogHeader className="p-6 border-b border-primary/10 bg-muted/30 sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black italic text-primary">
            <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
              <ImageIcon className="w-6 h-6" />
            </div>
            HOSTEL MEMORIES &amp; EVENTS
          </DialogTitle>
          <DialogDescription className="sr-only">
            Check out the beautiful memories and events captured at our hostel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
              <p className="mt-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Memories...</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 opacity-50">
              <Camera className="w-20 h-20 mb-4 text-muted-foreground" />
              <p className="text-xl font-bold text-muted-foreground">No memories captured yet.</p>
              <p className="text-sm">Check back later for event photos!</p>
            </div>
          ) : (
            <div className="space-y-12 pb-10">
              {albums.map((album) => (
                <div key={album.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                  <div className="flex items-baseline justify-between border-b border-primary/10 pb-2">
                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                      <span className="w-2 h-8 bg-primary rounded-full mr-1"></span>
                      {album.event_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4" />
                      {new Date(album.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {album.image_urls.map((url, idx) => (
                        <button 
                          key={idx} 
                          className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-border hover:border-primary/50 cursor-zoom-in shadow-md hover:shadow-xl transition-all duration-500 outline-none focus:ring-2 focus:ring-primary"
                          onClick={(e) => { e.stopPropagation(); openViewer(album, idx); }}
                        >
                          <img 
                            src={url} 
                            alt={`${album.event_name} ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/40 scale-0 group-hover:scale-100 transition-transform duration-500">
                              <Maximize2 className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Viewer - Moved to a Portal to prevent stacking/clipping issues */}
        {isViewerOpen && selectedAlbum && (
          <DialogPortal>
            <div 
              className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300 pointer-events-auto cursor-default"
              onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }}
            >
              {/* Image Card Container */}
              <div 
                className="relative bg-card/10 rounded-3xl p-2 sm:p-4 shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 duration-500 max-w-[95vw] sm:max-w-[85vw] max-h-[90vh] flex flex-col items-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Header with Close (Mark) */}
                <div className="w-full flex items-center justify-between mb-3 px-2">
                  <div className="flex flex-col">
                    <h4 className="text-white text-base sm:text-xl font-black italic tracking-tight">{selectedAlbum.event_name}</h4>
                    <p className="text-white/40 text-[10px] sm:text-xs font-black uppercase tracking-widest">{currentImageIndex + 1} of {selectedAlbum.image_urls.length}</p>
                  </div>
                  <button 
                    className="group relative h-12 w-12 rounded-full bg-white/10 hover:bg-destructive text-white flex items-center justify-center transition-all duration-300 shadow-xl active:scale-90 border border-white/10" 
                    onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }}
                    aria-label="Close preview"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    <div className="absolute -inset-2 bg-transparent cursor-pointer" /> {/* Extra hit-area */}
                  </button>
                </div>

                {/* Image with zoom-out trigger */}
                <div className="relative group overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center min-h-[200px]">
                  <img 
                    src={selectedAlbum.image_urls[currentImageIndex]} 
                    alt="Preview" 
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] w-auto h-auto object-contain select-none shadow-2xl transition-all duration-500 hover:scale-[1.01] cursor-zoom-out"
                    onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }}
                  />
                  
                  {/* Custom Nav buttons for multiple images */}
                  {selectedAlbum.image_urls.length > 1 && (
                    <>
                      <button 
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary border border-white/10 shadow-2xl"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </button>
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary border border-white/10 shadow-2xl"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      >
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                {selectedAlbum.image_urls.length > 1 && (
                  <div className="mt-5 flex gap-3 overflow-x-auto pb-3 max-w-full scrollbar-none px-2" onClick={(e) => e.stopPropagation()}>
                    {selectedAlbum.image_urls.map((url, idx) => (
                      <button 
                        key={idx} 
                        className={`relative h-14 w-14 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer flex-shrink-0 flex items-center justify-center ${idx === currentImageIndex ? 'border-primary ring-4 ring-primary/30 scale-105 shadow-2xl' : 'border-white/10 opacity-30 hover:opacity-100 hover:border-white/40'}`}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                      >
                        <img src={url} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogPortal>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HostelAlbumGallery;
