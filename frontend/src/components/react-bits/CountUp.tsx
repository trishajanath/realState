import React, { useEffect, useState } from 'react';

export const CountUp: React.FC<{
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}> = ({ to, from = 0, duration = 1000, decimals = 1, suffix = '', prefix = '', className = '' }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (to - from) + from;
      setCount(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(to);
      }
    };

    window.requestAnimationFrame(step);
  }, [to, from, duration]);

  return (
    <span className={className}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};
