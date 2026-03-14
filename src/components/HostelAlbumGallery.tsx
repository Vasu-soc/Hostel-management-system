import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ImageIcon,
  Maximize2
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

  useEffect(() => {
    if (isOpen) {
      fetchAlbums();
    }
  }, [isOpen]);

  const fetchAlbums = async () => {
    const { data } = await supabase
      .from("hostel_albums")
      .select("*")
      .order("event_date", { ascending: false });
    
    if (data) setAlbums(data as Album[]);
  };

  const openViewer = (album: Album, index: number) => {
    setSelectedAlbum(album);
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

  const nextImage = () => {
    if (!selectedAlbum) return;
    setCurrentImageIndex((prev) => (prev + 1) % selectedAlbum.image_urls.length);
  };

  const prevImage = () => {
    if (!selectedAlbum) return;
    setCurrentImageIndex((prev) => (prev - 1 + selectedAlbum.image_urls.length) % selectedAlbum.image_urls.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-accent/20 border-b-4 border-accent-foreground/10"
          aria-label="Hostel Album"
        >
          <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 border-b border-primary/10 bg-muted/30 sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black italic text-primary">
            <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
              <ImageIcon className="w-6 h-6" />
            </div>
            HOSTEL MEMORIES &amp; EVENTS
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {albums.length === 0 ? (
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
                      <div 
                        key={idx} 
                        className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-border hover:border-primary/50 cursor-pointer shadow-md hover:shadow-xl transition-all duration-500"
                        onClick={() => openViewer(album, idx)}
                      >
                        <img 
                          src={url} 
                          alt={`${album.event_name} ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full border border-white/40 scale-0 group-hover:scale-100 transition-transform duration-500">
                            <Maximize2 className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Fullscreen Viewer */}
      {isViewerOpen && selectedAlbum && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-[110]">
             <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col">
                <h4 className="text-white text-xl font-black italic">{selectedAlbum.event_name}</h4>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{currentImageIndex + 1} of {selectedAlbum.image_urls.length}</p>
             </div>
             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all" onClick={() => setIsViewerOpen(false)}>
               <X className="w-6 h-6" />
             </Button>
          </div>

          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 sm:left-8 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/5 text-white hover:bg-white/10 border border-white/10 z-[110]"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
            </Button>

            <div className="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center">
               <img 
                 src={selectedAlbum.image_urls[currentImageIndex]} 
                 alt="Full view" 
                 className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(var(--primary),0.3)] select-none pointer-events-none"
               />
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 sm:right-8 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/5 text-white hover:bg-white/10 border border-white/10 z-[110]"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
            </Button>
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 overflow-x-auto pb-4 gap-3 z-[110] scrollbar-hide">
             {selectedAlbum.image_urls.map((url, idx) => (
                <div 
                  key={idx} 
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer flex-shrink-0 ${idx === currentImageIndex ? 'border-primary scale-110 shadow-lg shadow-primary/40' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                   <img src={url} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
             ))}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default HostelAlbumGallery;
