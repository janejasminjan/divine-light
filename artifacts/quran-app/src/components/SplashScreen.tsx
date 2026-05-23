import React, { useEffect, useState } from "react";

export const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0A3221] via-[#0E442D] to-[#F7F4EB] px-6 text-center text-white animate-fade-out [animation-delay:2.5s] [animation-fill-mode:forwards]">
      <div className="relative flex w-full flex-col items-center pt-16 opacity-80 animate-pulse [animation-duration:4s]">
        <div className="absolute inset-x-0 top-8 flex select-none justify-around text-xs text-white opacity-30">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>

        <svg
          className="mt-4 h-16 w-24 fill-current text-[#F7F4EB]/10"
          viewBox="0 0 100 50"
        >
          <path d="M50,10 C40,10 38,25 38,40 L62,40 C62,25 60,10 50,10 Z M25,25 C22,25 21,32 21,40 L35,40 C35,32 34,25 25,25 Z M75,25 C72,25 71,32 71,40 L85,40 C85,32 84,25 75,25 Z" />
          <rect x="48" y="40" width="4" height="10" />
          <rect x="23" y="40" width="4" height="10" />
          <rect x="73" y="40" width="4" height="10" />
        </svg>
      </div>

      <div className="flex translate-y-[-10%] scale-100 transform flex-col items-center justify-center transition-transform duration-1000">
        <div className="group relative mb-6 flex h-36 w-36 animate-bounce items-center justify-center rounded-full border border-[#D4AF37]/20 bg-gradient-to-br from-[#125337] to-[#08291B] shadow-2xl [animation-duration:3s] md:h-44 md:w-44">
          <div className="absolute inset-2 rotate-[45deg] rounded-full border-b-2 border-l-2 border-white/40 blur-[1px]" />

          <span className="select-none bg-gradient-to-r from-[#EED384] via-[#D4AF37] to-[#B89224] bg-clip-text text-4xl font-serif tracking-wide text-transparent drop-shadow-md md:text-5xl">
            قيام
          </span>
        </div>

        <h1 className="text-3xl font-serif font-bold tracking-[0.25em] text-[#F7F4EB] drop-shadow-md md:text-4xl">
          QIYAM
        </h1>

        <p className="mt-2 text-xs font-light uppercase tracking-[0.4em] text-[#EED384]/80">
          Night Prayer &amp; Devotion
        </p>
      </div>

      <div className="flex flex-col items-center pb-16">
        <div className="relative mb-4 h-[2px] w-16 overflow-hidden rounded-full bg-gradient-to-r from-transparent via-[#125337] to-transparent">
          <div className="absolute bottom-0 left-0 top-0 w-1/2 bg-[#D4AF37] animate-loading-slide" />
        </div>

        <span className="select-none text-[10px] font-medium uppercase tracking-[0.3em] text-[#125337]/60">
          Serene Focus • Continuous Recitation
        </span>
      </div>
    </div>
  );
};
