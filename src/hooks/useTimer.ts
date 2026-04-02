import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerPhase = 'IDLE' | 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  roundsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface SessionRecord {
  id: string;
  name: string;
  goal: string;
  type: string;
  startTime: string;
  endTime?: string;
  totalFocusTime: number;
  rounds: number;
  reflection?: {
    result: 'yes' | 'partial' | 'no';
    helped: string;
    blocked: string;
    };
}

const playNotificationSound = (type: 'success' | 'alert' = 'success') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    
    if (type === 'success') {
      // Pleasant "ding-ding"
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    } else {
      // Alert "beep"
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    }

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
};

const showNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/icon.png' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon: '/icon.png' });
      }
    });
  }
};

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  notificationsEnabled: true,
  soundEnabled: true,
};

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('focus_coach_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem('focus_coach_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [phase, setPhase] = useState<TimerPhase>('IDLE');
  const [round, setRound] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(settings.workDuration * 60);
  const [totalSeconds, setTotalSeconds] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionRecord | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('focus_coach_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('focus_coach_history', JSON.stringify(history));
  }, [history]);

  const tick = useCallback(() => {
    setSecondsRemaining((prev) => {
      if (prev <= 1) {
        handlePhaseEnd();
        return 0;
      }
      return prev - 1;
    });
  }, [phase, round, settings]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsRemaining, tick]);

  const handlePhaseEnd = () => {
    setIsActive(false);
    
    if (phase === 'WORK') {
      const updatedSession = currentSession ? {
        ...currentSession,
        rounds: currentSession.rounds + 1,
        totalFocusTime: currentSession.totalFocusTime + settings.workDuration
      } : null;
      setCurrentSession(updatedSession);

      if (settings.soundEnabled) playNotificationSound('success');
      if (settings.notificationsEnabled) {
          showNotification('Time for a break!', 'Focus session completed. Great job!');
      }

      if (round >= settings.roundsBeforeLongBreak) {
        startPhase('LONG_BREAK', round);
      } else {
        startPhase('SHORT_BREAK', round);
      }
    } else {
      if (settings.soundEnabled) playNotificationSound('alert');
      if (settings.notificationsEnabled) {
          showNotification('Break finished', 'Ready to focus for another round?');
      }

      if (phase === 'LONG_BREAK') {
        // End of set - show reflection
        setPhase('IDLE');
      } else {
        startPhase('WORK', round + 1);
      }
    }
  };

  const startPhase = (newPhase: TimerPhase, newRound: number) => {
    setPhase(newPhase);
    setRound(newRound);
    
    let duration = settings.workDuration;
    if (newPhase === 'SHORT_BREAK') duration = settings.shortBreakDuration;
    if (newPhase === 'LONG_BREAK') duration = settings.longBreakDuration;
    
    const seconds = duration * 60;
    setSecondsRemaining(seconds);
    setTotalSeconds(seconds);
    
    const auto = (newPhase === 'WORK') ? settings.autoStartWork : settings.autoStartBreaks;
    if (auto) setIsActive(true);
  };

  const startSession = (name: string, goal: string, type: string) => {
    const session: SessionRecord = {
      id: Date.now().toString(),
      name,
      goal,
      type,
      startTime: new Date().toISOString(),
      totalFocusTime: 0,
      rounds: 0,
    };
    setCurrentSession(session);
    startPhase('WORK', 1);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setPhase('IDLE');
    setRound(1);
    setSecondsRemaining(settings.workDuration * 60);
    setTotalSeconds(settings.workDuration * 60);
    setCurrentSession(null);
  };

  const skipPhase = () => handlePhaseEnd();

  const saveSession = (reflection: SessionRecord['reflection']) => {
    if (currentSession) {
      const finalSession = {
        ...currentSession,
        endTime: new Date().toISOString(),
        reflection
      };
      setHistory([finalSession, ...history]);
      setCurrentSession(null);
      resetTimer();
    }
  };

  return {
    phase,
    round,
    secondsRemaining,
    totalSeconds,
    isActive,
    settings,
    setSettings,
    history,
    currentSession,
    startSession,
    toggleTimer,
    resetTimer,
    skipPhase,
    saveSession,
    clearHistory: () => setHistory([])
  };
}
