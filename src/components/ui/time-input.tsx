import React, { useState, useEffect } from 'react';
import { Input } from './input';

interface TimeInputProps {
  value: number; // seconds
  onChange: (seconds: number) => void;
  className?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, className }) => {
  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [displayValue, setDisplayValue] = useState(formatSeconds(value));

  useEffect(() => {
    setDisplayValue(formatSeconds(value));
  }, [value]);

  const handleBlur = () => {
    const parts = displayValue.split(':');
    let totalSeconds = 0;
    
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      totalSeconds = mins * 60 + secs;
    } else if (parts.length === 1) {
      // If only one number is provided, treat it as seconds if it's small or has a leading 0, 
      // but standard behavior is usually minutes if it's a single number.
      // However, for the most flexibility, let's just parse it as seconds if it's just a number.
      totalSeconds = parseInt(parts[0], 10) || 0;
    }

    if (!isNaN(totalSeconds)) {
      onChange(Math.max(1, totalSeconds));
    } else {
      setDisplayValue(formatSeconds(value));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleBlur();
      }}
      className={`w-[52px] h-6 px-1.5 py-0 text-[11px] font-mono text-center transition-all
        bg-transparent border-transparent hover:border-[var(--fc-surface-border)] focus:bg-[var(--fc-surface)] focus:border-[var(--fc-accent)/30] 
        text-[var(--fc-text-secondary)] focus:text-[var(--fc-text)] rounded-md ${className}`}
    />
  );
};
