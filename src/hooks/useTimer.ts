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
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  notificationsEnabled: true,
  inAppAlertsEnabled: true,
  soundEnabled: true,
  focusLevel: 'DEEP',
  theme: 'FITSEC',
  layoutDensity: 'COMFORTABLE',
  notificationSound: 'CHIME',
  notificationVolume: 0.55,
  notificationLeadSeconds: 60
};

const phaseLabel: Record<TimerPhase, string> = {
  IDLE: 'Session',
  WORK: 'Focus',
  SHORT_BREAK: 'Short Break',
  LONG_BREAK: 'Long Break'
};

const playNotificationSound = (tone: NotificationSound, volume: number, pattern: 'PHASE_END' | 'LEAD') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), now);

    const getTone = () => {
      if (tone === 'BELL') return [880, 1174, 880];
      if (tone === 'SOFT') return [440, 554, 659];
      return [740, 988, 1174];
    };

    const frequencies = pattern === 'LEAD' ? [getTone()[0], getTone()[1]] : getTone();
    frequencies.forEach((frequency, index) => {
      const osc = audioCtx.createOscillator();
      osc.type = tone === 'SOFT' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency, now + index * 0.14);
      osc.connect(gain);
      osc.start(now + index * 0.14);
      osc.stop(now + index * 0.14 + 0.1);
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
      const duration =
        nextPhase === 'SHORT_BREAK'
          ? settings.shortBreakDuration
          : nextPhase === 'LONG_BREAK'
          ? settings.longBreakDuration
          : settings.workDuration;
      const seconds = duration * 60;
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
            totalFocusTime: currentSession.totalFocusTime + settings.workDuration
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
      setSecondsRemaining(settings.workDuration * 60);
      setTotalSeconds(settings.workDuration * 60);
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
    setSecondsRemaining(settings.workDuration * 60);
    setTotalSeconds(settings.workDuration * 60);
    setCurrentSession(null);
    leadAlertKeyRef.current = '';
    dismissAlert();
  };

  const skipPhase = () => handlePhaseEnd();

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
  const dailySessions = sessionsToday.length;
  const totalFocusToday = sessionsToday.reduce((sum, session) => sum + session.totalFocusTime, 0);

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
    dismissAlert
  };
}
