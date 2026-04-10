import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { X, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (seconds: number) => void;
  initialSeconds: number;
  title: string;
}

const Stepper = ({
  label,
  value,
  onChange,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isTyping, setIsTyping] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  
  const direction = value > prevValue ? 1 : -1;
  
  React.useEffect(() => {
    if (!isTyping) {
      setPrevValue(value);
      setTempValue(value.toString().padStart(2, '0'));
    }
  }, [value, isTyping]);

  const handleBlur = () => {
    setIsTyping(false);
    const parsed = parseInt(tempValue, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[var(--fc-text-muted)]">
        {label}
      </span>
      <button
        onClick={onIncrement}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] transition-all active:scale-95 group"
      >
        <ChevronUp className="w-5 h-5 group-hover:translate-y-[-1px] transition-transform" />
      </button>
      <div className="w-16 h-16 relative flex items-center justify-center rounded-2xl bg-[var(--fc-surface)] border border-[var(--fc-surface-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] group focus-within:border-[var(--fc-accent-light)]/50 focus-within:shadow-[0_0_12px_var(--fc-accent-glow)] transition-all">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={isTyping ? 'typing' : value}
            initial={isTyping ? {} : { opacity: 0, y: direction * 10 }}
            animate={isTyping ? {} : { opacity: 1, y: 0 }}
            exit={isTyping ? {} : { opacity: 0, y: direction * -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute flex items-center justify-center inset-0"
          >
            <input
              type="text"
              inputMode="numeric"
              value={isTyping ? tempValue : value.toString().padStart(2, '0')}
              onFocus={() => {
                setIsTyping(true);
                setTempValue(value.toString());
              }}
              onBlur={handleBlur}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setTempValue(val);
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed)) onChange(parsed);
              }}
              className="w-full bg-transparent border-none text-center text-3xl font-black font-mono tabular-nums text-[var(--fc-text)] focus:outline-none cursor-text decoration-transparent"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        onClick={onDecrement}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] transition-all active:scale-95 group"
      >
        <ChevronDown className="w-5 h-5 group-hover:translate-y-[1px] transition-transform" />
      </button>
    </div>
  );
};

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSeconds,
  title,
}) => {
  const [minutes, setMinutes] = useState(Math.floor(initialSeconds / 60));
  const [seconds, setSeconds] = useState(initialSeconds % 60);

  // Sync internal state when the modal opens or the external value changes
  React.useEffect(() => {
    if (isOpen) {
      setMinutes(Math.floor(initialSeconds / 60));
      setSeconds(initialSeconds % 60);
    }
  }, [isOpen, initialSeconds]);

  const handleSave = () => {
    onSave(minutes * 60 + seconds);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] glass-panel-elevated z-[101] p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--fc-accent-light)]">
                  Set Duration
                </p>
                <h3 className="text-lg font-black text-[var(--fc-text)]">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steppers */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Stepper
                label="Min"
                value={minutes}
                onChange={(v) => setMinutes(v)}
                onIncrement={() => setMinutes((m) => Math.min(300, m + 1))}
                onDecrement={() => setMinutes((m) => Math.max(0, m - 1))}
              />
              <span className="text-3xl font-black text-[var(--fc-text-muted)] mb-0 mt-4 select-none">
                :
              </span>
              <Stepper
                label="Sec"
                value={seconds}
                onChange={(v) => setSeconds(Math.max(0, Math.min(59, v)))}
                onIncrement={() => setSeconds((s) => (s >= 59 ? 0 : s + 1))}
                onDecrement={() => setSeconds((s) => (s <= 0 ? 59 : s - 1))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl border-[var(--fc-surface-border)] bg-[var(--fc-surface)] text-[var(--fc-text-secondary)] font-bold text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl font-bold text-xs gap-2 bg-[var(--fc-accent)] hover:bg-[var(--fc-accent-light)] text-black shadow-[0_0_20px_var(--fc-accent-glow)] transition-all"
                onClick={handleSave}
              >
                <Check className="w-4 h-4" />
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
