import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerPhase = 'IDLE' | 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';
export type FocusLevel = 'DEEP' | 'LIGHT';
export type ThemeMode = 'FITSEC' | 'MIDNIGHT' | 'SUNRISE';
export type LayoutDensity = 'COMPACT' | 'COMFORTABLE';
export type NotificationSound = 'CHIME' | 'BELL' | 'SOFT';
export type AlertType = 'INFO' | 'SUCCESS' | 'WARNING';

export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  roundsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  notificationsEnabled: boolean;
  inAppAlertsEnabled: boolean;
  soundEnabled: boolean;
  focusLevel: FocusLevel;
  theme: ThemeMode;
  layoutDensity: LayoutDensity;
  notificationSound: NotificationSound;
  notificationVolume: number;
  notificationLeadSeconds: number;
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

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  type: AlertType;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 1500, // 25 min
  shortBreakDuration: 300, // 5 min
  longBreakDuration: 900, // 15 min
  roundsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  notificationsEnabled: true,
  inAppAlertsEnabled: true,
  soundEnabled: true,
  focusLevel: 'DEEP',
  theme: 'FITSEC',
  layoutDensity: 'COMFORTABLE',
  notificationSound: 'SOFT',
  notificationVolume: 0.4,
  notificationLeadSeconds: 60
};

const phaseLabel: Record<TimerPhase, string> = {
  IDLE: 'Session',
  WORK: 'Focus',
  SHORT_BREAK: 'Short Break',
  LONG_BREAK: 'Long Break'
};

const playNotificationSound = (tone: NotificationSound, baseVolume: number, pattern: 'PHASE_END' | 'LEAD') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Warmer, lower pitched frequencies
    const getNotes = () => {
      if (tone === 'BELL') return { freqs: [659.25, 880.00], space: 0.3 }; // E5, A5 (Singing bowl style)
      if (tone === 'SOFT') return { freqs: [329.63, 440.00, 554.37], space: 0.15 }; // E4, A4, C#5 (Gentle harp)
      return { freqs: [440.00, 554.37], space: 0.12 }; // A4, C#5 (Subtle chime)
    };

    const { freqs, space } = getNotes();
    const frequencies = pattern === 'LEAD' ? [freqs[0]] : freqs;
    const actualVolume = Math.max(0, Math.min(1, baseVolume)) * 0.6; // Scale down overall harshness

    frequencies.forEach((frequency, index) => {
      const startTime = now + index * space;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      // Always use pure sine wave for warm, smooth sound without harsh overtones
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(frequency, startTime);
      
      // Envelope setup (Attack, Decay, Release) to remove sharp popping
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(actualVolume, startTime + 0.05); // Soft 50ms attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2); // Long 1.2s trailing decay
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 1.2);
    });
  } catch (error) {
    console.error(error);
  }
};

const showNotification = (title: string, body: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
      }
    });
  }
};

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('focus_coach_settings');
    if (!saved) return DEFAULT_SETTINGS;
    
    let parsed = JSON.parse(saved);
    // Migration: If workDuration is very small (e.g. 25 instead of 1500), it's likely old minute-based data
    // We check if it's less than 120 (2 mins) to assume it was old format
    if (parsed.workDuration < 120) {
      parsed.workDuration *= 60;
      parsed.shortBreakDuration *= 60;
      parsed.longBreakDuration *= 60;
    }
    
    return { ...DEFAULT_SETTINGS, ...parsed };
  });
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem('focus_coach_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [phase, setPhase] = useState<TimerPhase>('IDLE');
  const [round, setRound] = useState(1);
  const [secondsRemaining, setSecondsRemaining] = useState(settings.workDuration);
  const [totalSeconds, setTotalSeconds] = useState(settings.workDuration);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionRecord | null>(null);
  const [activeAlert, setActiveAlert] = useState<InAppAlert | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leadAlertKeyRef = useRef<string>('');

  useEffect(() => {
    localStorage.setItem('focus_coach_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('focus_coach_history', JSON.stringify(history));
  }, [history]);

  // Real-time updates when settings are changed
  useEffect(() => {
    // Determine the current target duration based on phase
    const newTotalSeconds = 
      phase === 'SHORT_BREAK' ? settings.shortBreakDuration :
      phase === 'LONG_BREAK' ? settings.longBreakDuration :
      settings.workDuration;
    
    // If the duration has changed, adjust the remaining time by the difference
    if (newTotalSeconds !== totalSeconds) {
      const diff = newTotalSeconds - totalSeconds;
      setTotalSeconds(newTotalSeconds);
      // We only adjust secondsRemaining if it hasn't somehow already finished
      setSecondsRemaining(prev => Math.max(0, prev + diff));
    }
  }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration, phase, totalSeconds]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
  }, []);

  const emitAlert = useCallback(
    (payload: Omit<InAppAlert, 'id'>, options?: { desktop?: boolean; soundPattern?: 'PHASE_END' | 'LEAD' }) => {
      if (settings.inAppAlertsEnabled) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setActiveAlert({ id, ...payload });
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => {
          setActiveAlert(null);
        }, 5000);
      }
      if (options?.desktop && settings.notificationsEnabled) {
        showNotification(payload.title, payload.body);
      }
      if (settings.soundEnabled) {
        playNotificationSound(settings.notificationSound, settings.notificationVolume, options?.soundPattern ?? 'PHASE_END');
      }
    },
    [settings]
  );

  const startPhase = useCallback(
    (nextPhase: TimerPhase, nextRound: number) => {
      setPhase(nextPhase);
      setRound(nextRound);
      const seconds =
        nextPhase === 'SHORT_BREAK'
          ? settings.shortBreakDuration
          : nextPhase === 'LONG_BREAK'
          ? settings.longBreakDuration
          : settings.workDuration;
      setSecondsRemaining(seconds);
      setTotalSeconds(seconds);
      leadAlertKeyRef.current = `${nextPhase}-${nextRound}`;
      const shouldAutoStart = nextPhase === 'WORK' ? settings.autoStartWork : settings.autoStartBreaks;
      setIsActive(shouldAutoStart);
    },
    [settings]
  );

  const handlePhaseEnd = useCallback(() => {
    setIsActive(false);
    if (phase === 'WORK') {
      const updatedSession = currentSession
        ? {
            ...currentSession,
            rounds: currentSession.rounds + 1,
            totalFocusTime: currentSession.totalFocusTime + (settings.workDuration / 60)
          }
        : null;
      setCurrentSession(updatedSession);
      if (round >= settings.roundsBeforeLongBreak) {
        emitAlert(
          {
            title: 'Long break started',
            body: 'Great momentum. Take a meaningful reset before the next cycle.',
            type: 'SUCCESS'
          },
          { desktop: true, soundPattern: 'PHASE_END' }
        );
        startPhase('LONG_BREAK', round);
        return;
      }
      emitAlert(
        {
          title: 'Break started',
          body: 'Nice work. Take a short recharge and come back sharp.',
          type: 'SUCCESS'
        },
        { desktop: true, soundPattern: 'PHASE_END' }
      );
      startPhase('SHORT_BREAK', round);
      return;
    }

    emitAlert(
      {
        title: 'Break ended',
        body: 'You are back in focus mode. Let’s make the next block count.',
        type: 'INFO'
      },
      { desktop: true, soundPattern: 'PHASE_END' }
    );

    if (phase === 'LONG_BREAK') {
      setPhase('IDLE');
      setRound(1);
      setSecondsRemaining(settings.workDuration);
      setTotalSeconds(settings.workDuration);
      return;
    }
    startPhase('WORK', round + 1);
  }, [currentSession, emitAlert, phase, round, settings, startPhase]);

  const tick = useCallback(() => {
    setSecondsRemaining((previous) => {
      if (previous <= 1) {
        handlePhaseEnd();
        return 0;
      }
      const next = previous - 1;
      if (settings.notificationLeadSeconds > 0) {
        const leadKey = `${phase}-${round}`;
        if (next === settings.notificationLeadSeconds && leadAlertKeyRef.current === leadKey) {
          emitAlert(
            {
              title: `${phaseLabel[phase]} ending soon`,
              body: `${Math.ceil(settings.notificationLeadSeconds / 60)} min remaining. Prepare for the transition.`,
              type: 'WARNING'
            },
            { desktop: settings.notificationsEnabled, soundPattern: 'LEAD' }
          );
          leadAlertKeyRef.current = `${leadKey}-sent`;
        }
      }
      return next;
    });
  }, [emitAlert, handlePhaseEnd, phase, round, settings.notificationLeadSeconds, settings.notificationsEnabled]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(tick, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsRemaining, tick]);

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  const startSession = (name: string, goal: string, type: string) => {
    const session: SessionRecord = {
      id: Date.now().toString(),
      name,
      goal,
      type,
      startTime: new Date().toISOString(),
      totalFocusTime: 0,
      rounds: 0
    };
    setCurrentSession(session);
    startPhase('WORK', 1);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive((current) => !current);

  const resetTimer = () => {
    setIsActive(false);
    setPhase('IDLE');
    setRound(1);
    setSecondsRemaining(settings.workDuration);
    setTotalSeconds(settings.workDuration);
    setCurrentSession(null);
    leadAlertKeyRef.current = '';
    dismissAlert();
  };

  const skipPhase = () => handlePhaseEnd();

  // Keyboard Shortcuts — Space (Start/Pause), R (Reset), S (Skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an Input area
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key.toLowerCase() === 'r') {
        resetTimer();
      } else if (e.key.toLowerCase() === 's') {
        skipPhase();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, resetTimer, skipPhase]);

  const saveSession = (reflection: SessionRecord['reflection']) => {
    if (!currentSession) return;
    const finalSession = {
      ...currentSession,
      endTime: new Date().toISOString(),
      reflection
    };
    setHistory((previous) => [finalSession, ...previous]);
    resetTimer();
  };

  const today = new Date().toDateString();
  const sessionsToday = history.filter((session) => new Date(session.startTime).toDateString() === today);
  
  // Factor in the active session so the UI "Updates" in real-time
  const dailySessions = sessionsToday.length + (currentSession && currentSession.rounds > 0 ? 1 : 0);
  const totalFocusToday = sessionsToday.reduce((sum, session) => sum + session.totalFocusTime, 0) + 
                          (currentSession ? currentSession.totalFocusTime : 0);

  const getCoachMessage = () => {
    if (phase === 'IDLE') return 'Set your mission and launch a meaningful sprint.';
    if (phase === 'WORK') return settings.focusLevel === 'DEEP' ? 'Deep focus is active. Stay locked in.' : 'Steady pace. Keep moving.';
    if (phase === 'SHORT_BREAK') return 'Short reset: breathe, hydrate, and stretch.';
    return 'Long reset: walk around and reset your energy.';
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
    clearHistory: () => setHistory([]),
    dailySessions,
    totalFocusToday,
    getCoachMessage,
    activeAlert,
    dismissAlert,
    previewSound: () => playNotificationSound(settings.notificationSound, settings.notificationVolume, 'PHASE_END'),
  };
}
