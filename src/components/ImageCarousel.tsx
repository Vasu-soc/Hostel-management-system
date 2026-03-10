import { useEffect, useState } from "react";
import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";
import carousel4 from "@/assets/carousel-4.jpg";
import carousel5 from "@/assets/carousel-5.jpg";
import carousel6 from "@/assets/carousel-6.jpg";
import carousel7 from "@/assets/carousel-7.jpg";
import carousel8 from "@/assets/carousel-8.jpg";

const images = [
  carousel1,
  carousel2,
  carousel3,
  carousel4,
  carousel5,
  carousel6,
  carousel7,
  carousel8,
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

const ImageCarousel = () => {
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
            className="carousel-item"
          >
            <img
              src={img}
              alt={`Hostel view ${idx + 1}`}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover rounded-xl"
              style={{
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              }}
            />
          </div>
        ))}
        {/* Duplicate set for seamless infinite loop */}
        {images.map((img, idx) => (
          <div
            key={`second-${idx}`}
            className="carousel-item"
          >
            <img
              src={img}
              alt={`Hostel view ${idx + 1}`}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover rounded-xl"
              style={{
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ImageCarousel;
