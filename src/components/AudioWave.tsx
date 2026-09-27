import React, { useEffect, useState } from 'react';

interface AudioWaveProps {
  isLive: boolean;
  barCount?: number;
  height?: number;
}

export const AudioWave: React.FC<AudioWaveProps> = ({ isLive, barCount = 26, height = 34 }) => {
  const [bars, setBars] = useState<number[]>(() => 
    Array.from({ length: barCount }, () => 6 + Math.random() * 10)
  );

  useEffect(() => {
    if (!isLive) {
      setBars(Array.from({ length: barCount }, () => 6 + Math.random() * 10));
      return;
    }

    const interval = setInterval(() => {
      setBars(Array.from({ length: barCount }, () => 6 + Math.random() * 26));
    }, 110);

    return () => clearInterval(interval);
  }, [isLive, barCount]);

  return (
    <div 
      className="flex items-center justify-center gap-[3px] select-none"
      style={{ height: `${height}px` }}
    >
      {bars.map((h, i) => (
        <i
          key={i}
          className="w-[3px] bg-[#3FC9E9] rounded-full transition-all duration-75 block opacity-85"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
};
