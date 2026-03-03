import { useEffect, useState } from "react";
import hostelBuilding from "@/assets/hostel-building.png";
import hostelCorridor from "@/assets/hostel-corridor.png";
import hostelMess from "@/assets/hostel-mess.png";
import roomSingle from "@/assets/room-single.png";
import roomDoubleNew from "@/assets/room-double-new.png";
import roomTriple from "@/assets/room-triple.png";
import roomFourNew from "@/assets/room-four-new.png";
import roomDormNew from "@/assets/room-dorm-new.png";
import hostelAi1 from "@/assets/hostel-ai-1.png";
import hostelAi2 from "@/assets/hostel-ai-2.png";
import hostelAi3 from "@/assets/hostel-ai-3.png";
import hostelAi4 from "@/assets/hostel-ai-4.png";
import hostelAi5 from "@/assets/hostel-ai-5.png";
import hostelAi6 from "@/assets/hostel-ai-6.png";
import hostelAi7 from "@/assets/hostel-ai-7.png";
import hostelAi8 from "@/assets/hostel-ai-8.png";

const images = [
  hostelBuilding,
  hostelAi1,
  roomSingle,
  hostelAi5,
  roomDoubleNew,
  hostelAi2,
  roomTriple,
  hostelAi6,
  roomFourNew,
  hostelCorridor,
  hostelAi3,
  roomDormNew,
  hostelAi7,
  hostelMess,
  hostelAi4,
  hostelAi8,
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
