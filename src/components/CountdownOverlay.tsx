"use client";

import { useEffect, useState, useRef } from "react";

interface Props {
  onFinish: () => void;
  duration?: number;
  subtitle?: string;
}

export default function CountdownOverlay({ onFinish, duration = 5, subtitle }: Props) {
  const [count, setCount] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  const finishedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(prevCount => (prevCount <= 1 ? 0 : prevCount - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // onFinish poza updaterem setState — inaczej React ostrzega o update GameProvider podczas renderu.
  useEffect(() => {
    if (count > 0 || finishedRef.current) return;
    finishedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onFinishRef.current();
  }, [count]);

  return (
    <div
      aria-label="Countdown"
      className="
        absolute inset-0 z-40 flex flex-col items-center justify-center gap-4
        bg-black/80 backdrop-blur-xl select-none
      "
    >
      <span
        key={count}
        className="
          text-[20vmin] font-extrabold text-white
          animate-countdown
        "
      >
        {count}
      </span>
      {subtitle && (
        <span className="text-lg text-white/70">{subtitle}</span>
      )}
    </div>
  );
}
