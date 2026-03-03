import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [show, setShow] = useState(true);
  const [taglineText, setTaglineText] = useState("");
  const fullTagline = "Your Home Away From Home";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Typing animation for tagline
  useEffect(() => {
    let currentIndex = 0;
    const typingDelay = setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullTagline.length) {
          setTaglineText(fullTagline.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 60);
      return () => clearInterval(typingInterval);
    }, 1200);

    return () => clearTimeout(typingDelay);
  }, []);

  // Generate random particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #3b82f6 100%)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            isolation: 'isolate',
          }}
        >
          {/* Floating particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                opacity: 0, 
                x: `${particle.x}vw`, 
                y: `${particle.y}vh`,
                scale: 0 
              }}
              animate={{ 
                opacity: [0, 0.6, 0],
                y: [`${particle.y}vh`, `${particle.y - 30}vh`],
                scale: [0, 1, 0.5],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute rounded-full bg-white/40"
              style={{
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}

          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 4, opacity: 0.1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 0.05 }}
              transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white"
            />
            {/* Additional pulsing ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 2.5, 1],
                opacity: [0.2, 0, 0.2],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut",
                repeat: Infinity,
                delay: 0.5,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/30"
            />
          </div>

          {/* Logo and Name Container */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="relative mb-6"
            >
              <motion.div 
                className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/30"
                animate={{ 
                  boxShadow: [
                    "0 25px 50px -12px rgba(255,255,255,0.1)",
                    "0 25px 50px -12px rgba(255,255,255,0.3)",
                    "0 25px 50px -12px rgba(255,255,255,0.1)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-5xl md:text-6xl"
                >
                  🏠
                </motion.div>
              </motion.div>
              
              {/* Orbiting particles around logo */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    delay: 0.8 + i * 0.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute top-1/2 left-1/2 w-full h-full"
                  style={{ 
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    className="absolute w-2 h-2 rounded-full bg-white/80"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${i * 45}deg) translateX(60px)`,
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* App Name with letter animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="flex overflow-hidden">
                {"HosteliHub".split("").map((letter, index) => (
                  <motion.span
                    key={index}
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: 0.7 + index * 0.05,
                    }}
                    className={`text-4xl md:text-6xl font-bold ${
                      index < 7 ? "text-white" : "text-white/80"
                    }`}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      textShadow: "2px 4px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>

              {/* Typing Tagline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.3 }}
                className="mt-4 h-8 flex items-center"
              >
                <span className="text-white/80 text-lg md:text-xl font-medium tracking-wide">
                  {taglineText}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="ml-1 text-white/80 text-lg md:text-xl font-medium"
                >
                  |
                </motion.span>
              </motion.div>

            </motion.div>
          </div>

          {/* Bottom wave decoration */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute bottom-0 left-0 right-0"
          >
            <svg
              viewBox="0 0 1440 120"
              className="w-full h-20 md:h-28"
              preserveAspectRatio="none"
            >
              <motion.path
                fill="rgba(255,255,255,0.1)"
                d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                animate={{
                  d: [
                    "M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z",
                    "M0,48L48,53.3C96,59,192,69,288,74.7C384,80,480,80,576,69.3C672,59,768,37,864,32C960,27,1056,37,1152,48C1248,59,1344,69,1392,74.7L1440,80L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z",
                    "M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z",
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
