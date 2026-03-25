import { useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";
import carousel4 from "@/assets/carousel-4.jpg";
import carousel5 from "@/assets/carousel-5.jpg";
import carousel6 from "@/assets/carousel-6.jpg";
import carousel7 from "@/assets/carousel-7.jpg";
import carousel8 from "@/assets/carousel-8.jpg";
import carousel9 from "@/assets/carousel-9.jpg";
import carousel10 from "@/assets/carousel-10.jpg";
import carousel11 from "@/assets/carousel-11.jpg";
import carousel12 from "@/assets/carousel-12.jpg";
import carousel13 from "@/assets/carousel-13.jpg";
import carousel14 from "@/assets/carousel-14.jpg";
import carousel15 from "@/assets/carousel-15.jpg";

const images = [
  carousel1,
  carousel2,
  carousel3,
  carousel4,
  carousel5,
  carousel6,
  carousel7,
  carousel8,
  carousel9,
  carousel10,
  carousel11,
  carousel12,
  carousel13,
  carousel14,
  carousel15,
];

// Preload all images immediately
const preloadImages = () => {
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

// Execute preload immediately on module load
preloadImages();

interface ImageCarouselProps {
  onImageClick?: (src: string) => void;
}

const ImageCarousel = ({ onImageClick }: ImageCarouselProps) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // Check if all images are already cached/loaded
    let loadedCount = 0;
    const totalImages = images.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setImagesLoaded(true);
      }
    };

    images.forEach((src) => {
      const img = new Image();
      img.onload = checkAllLoaded;
      img.onerror = checkAllLoaded;
      img.src = src;
      // If already cached, onload fires synchronously
      if (img.complete) {
        checkAllLoaded();
      }
    });

    // Fallback: show images after 500ms even if not all loaded
    const fallbackTimer = setTimeout(() => {
      setImagesLoaded(true);
    }, 500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <section
      aria-label="Hostel photos"
      className="w-full py-8 relative z-10 overflow-hidden"
    >
      <div className={`carousel-track ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transition: 'opacity 0.3s ease-in' }}>
        {/* First set of images */}
        {images.map((img, idx) => (
          <div
            key={`first-${idx}`}
            className="carousel-item group cursor-zoom-in relative"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onImageClick?.(img);
            }}
          >
            <img
              src={img}
              alt={`Hostel view ${idx + 1}`}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
              style={{
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
              <Maximize2 className="text-white w-10 h-10 drop-shadow-lg" />
            </div>
          </div>
        ))}
        {/* Duplicate set for seamless infinite loop */}
        {images.map((img, idx) => (
          <div
            key={`second-${idx}`}
            className="carousel-item group cursor-zoom-in relative"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onImageClick?.(img);
            }}
          >
            <img
              src={img}
              alt={`Hostel view ${idx + 1}`}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
              style={{
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
              <Maximize2 className="text-white w-10 h-10 drop-shadow-lg" />
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};

export default ImageCarousel;


