import React, { useEffect, useState } from 'react';

interface DecodedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';

export const DecodedText: React.FC<DecodedTextProps> = ({
  text,
  className = '',
  delay = 30
}) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let interval: number;
    let frame = 0;
    const targetLength = text.length;

    const animate = () => {
      interval = setInterval(() => {
        frame++;
        const currentProgress = frame / targetLength;
        const decodedIndex = Math.floor(currentProgress * targetLength);

        const currentText = text
          .split('')
          .map((char, index) => {
            if (index < decodedIndex) return char;
            if (char === ' ') return ' ';
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join('');

        setDisplayText(currentText);

        if (frame >= targetLength) {
          setDisplayText(text);
          clearInterval(interval);
        }
      }, delay);
    };

    animate();
    return () => clearInterval(interval);
  }, [text, delay]);

  return <span className={`font-mono ${className}`}>{displayText}</span>;
};
