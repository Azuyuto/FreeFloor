"use client";

import { useEffect, useState, useRef } from "react";

interface Props {
  onFinish: () => void;
  duration?: number;
}

export default function CountdownOverlay({ onFinish, duration = 5 }: Props) {
  const [count, setCount] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onFinishRef = useRef(onFinish);

  // Aktualizuj ref przy zmianie onFinish
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Rozpocznij interval tylko raz
    intervalRef.current = setInterval(() => {
      setCount(prevCount => {
        if (prevCount <= 1) {
          // Zakończ odliczanie
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onFinishRef.current();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Pusta dependency array - uruchom tylko raz

  return (
    <div
      aria-label="Countdown"
      className="
        absolute inset-0 z-40 flex items-center justify-center
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
    </div>
  );
}
