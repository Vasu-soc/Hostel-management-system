import { useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let loadedCount = 0;
    const totalImages = images.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) setImagesLoaded(true);
    };

    images.forEach((src) => {
      const img = new Image();
      img.onload = checkAllLoaded;
      img.onerror = checkAllLoaded;
      img.src = src;
      if (img.complete) checkAllLoaded();
    });

    const fallbackTimer = setTimeout(() => setImagesLoaded(true), 1000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    if (!imagesLoaded) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 2) % images.length);
    }, 2000); // 2 second interval as requested
    return () => clearInterval(timer);
  }, [imagesLoaded]);

  return (
    <section
      aria-label="Hostel photo gallery"
      className="w-full py-2 relative z-10 overflow-hidden px-1 md:px-2"
    >
      <div 
        className={`w-full aspect-[4/3] sm:aspect-[2/1] md:aspect-[30/9] max-w-7xl mx-auto relative flex gap-1 md:gap-[4px] ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`} 
        style={{ transition: 'opacity 0.6s ease-in' }}
      >
        {/* Left Image Node - Static Frame */}
        <div 
          className="flex-1 h-full relative border border-white/10 shadow-lg bg-card overflow-hidden cursor-zoom-in group select-none"
          onClick={() => onImageClick?.(images[index])}
        >
          <img
            src={images[index]}
            className="w-full h-full object-cover transition-opacity duration-300"
            alt="Gallery left"
            key="left"
          />
          {/* Static Overlay for interaction */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
          </div>
        </div>

        {/* Right Image Node - Static Frame */}
        <div 
          className="flex-1 h-full relative border border-white/10 shadow-lg bg-card overflow-hidden cursor-zoom-in group select-none"
          onClick={() => onImageClick?.(images[(index + 1) % images.length])}
        >
          <img
            src={images[(index + 1) % images.length]}
            className="w-full h-full object-cover transition-opacity duration-300"
            alt="Gallery right"
            key="right"
          />
          {/* Static Overlay for interaction */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageCarousel;
