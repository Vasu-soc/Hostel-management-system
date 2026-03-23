import { useState, useEffect } from "react";

interface TerminalLoaderProps {
  onComplete: () => void;
}

const TerminalLoader = ({ onComplete }: TerminalLoaderProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        const increment = Math.floor(Math.random() * 10) + 5; // 5 to 14
        return Math.min(prev + increment, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  const totalBlocks = 20;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;

  const filledChar = "■";
  const emptyChar = "□";

  const bar = filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-[3px] z-[99999] font-mono transition-all duration-500">
      <div className="bg-white/90 dark:bg-zinc-950/90 p-8 sm:p-10 rounded-3xl shadow-2xl border border-black/5 dark:border-white/5 flex flex-col items-center gap-6 backdrop-blur-2xl transform transition-transform animate-in zoom-in duration-300">
        <div className="text-xl sm:text-2xl md:text-3xl tracking-widest flex items-center gap-3 text-primary font-bold">
          <span className="opacity-80">[{bar}]</span>
          <span className="w-16 text-right tabular-nums">{progress}%</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-primary animate-ping"></div>
          <div className="text-sm tracking-widest text-primary/70 uppercase font-black animate-pulse">
            Loading System Modules...
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalLoader;
