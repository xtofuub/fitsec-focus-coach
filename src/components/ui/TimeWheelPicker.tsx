import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface TimeWheelPickerProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({ value, max, onChange, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = Array.from({ length: max + 1 }, (_, i) => i);
  const itemHeight = 40;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = value * itemHeight;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const newValue = Math.round(scrollTop / itemHeight);
    if (newValue !== value && newValue >= 0 && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--fc-text-muted)]">{label}</span>
      <div className="relative h-[120px] w-16 overflow-hidden">
        {/* Highlight area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-full h-[40px] border-y border-[var(--fc-accent)/30] bg-[var(--fc-accent-subtle)]/5" />
        </div>
        
        {/* Scrollable list */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar scroll-smooth"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div className="py-[40px]">
            {items.map((item) => (
              <div 
                key={item}
                className={`h-[40px] flex items-center justify-center text-lg font-mono transition-colors snap-center ${
                  item === value ? 'text-[var(--fc-accent-light)] font-bold' : 'text-[var(--fc-text-muted)] opacity-30 px-2'
                }`}
              >
                {item.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
