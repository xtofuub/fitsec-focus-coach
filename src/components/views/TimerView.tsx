import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Flame,
  Target,
  Zap,
  Brain,
  Clock,
  Sparkles,
  Settings,
  Square,
  Minus,
  Plus,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { type TimerPhase } from '@/hooks/useTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { TimePickerModal } from '@/components/ui/TimePickerModal';


const formatMinutes = (minutes: number) => {
  if (minutes > 0 && minutes < 1) return '<1';
  return Math.round(minutes).toString();
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const PHASES: Record<TimerPhase, { label: string; color: string }> = {
  IDLE: { label: 'Ready to Focus', color: 'text-[var(--fc-text-muted)]' },
  WORK: { label: 'Deep Focus', color: 'text-[var(--fc-accent-light)]' },
  SHORT_BREAK: { label: 'Short Break', color: 'text-emerald-400' },
  LONG_BREAK: { label: 'Long Break', color: 'text-amber-400' },
};

const PRESETS = {
  pomodoro: { work: 1500, short: 300, long: 900, sequence: ['SHORT', 'SHORT', 'SHORT', 'LONG'], name: 'Pomodoro', icon: Target, desc: 'Classic 25/5 focus cycle' },
  deepWork: { work: 3000, short: 600, long: 1800, sequence: ['SHORT', 'SHORT', 'SHORT', 'LONG'], name: 'Deep Work', icon: Brain, desc: '50 min intense sessions' },
  shortBurst: { work: 900, short: 180, long: 600, sequence: ['SHORT', 'SHORT', 'SHORT', 'SHORT', 'SHORT', 'LONG'], name: 'Short Burst', icon: Zap, desc: '15 min sprint mode' },
};

interface TimerViewProps {
  phase: TimerPhase;
  round: number;
  secondsRemaining: number;
  totalSeconds: number;
  isActive: boolean;
  settings: any;
  setSettings: (s: any) => void;
  currentSession: any;
  startSession: (name: string, goal: string, type: string) => void;
  toggleTimer: () => void;
  endSession: () => void;
  resetTimer: () => void;
  skipPhase: () => void;
  saveSession: (reflection: any) => void;
  dailySessions: number;
  totalFocusToday: number;
  getCoachMessage: () => string;
  activeAlert: any;
  dismissAlert: () => void;
}

export const TimerView: React.FC<TimerViewProps> = ({
  phase,
  round,
  secondsRemaining,
  totalSeconds,
  isActive,
  settings,
  setSettings,
  currentSession,
  startSession,
  toggleTimer,
  endSession,
  resetTimer,
  skipPhase,
  saveSession,
  dailySessions,
  totalFocusToday,
  getCoachMessage,
  activeAlert,
  dismissAlert,
}) => {
  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionName, setSessionName] = useState('Focus Sprint');
  
  // Picker States
  const [activePicker, setActivePicker] = useState<'work' | 'short' | 'long' | null>(null);

  const progress = totalSeconds > 0 ? (1 - secondsRemaining / totalSeconds) : 0;
  const isIdle = phase === 'IDLE';
  const isBreak = phase === 'SHORT_BREAK' || phase === 'LONG_BREAK';
  const canSkip = !(settings.focusLevel === 'DEEP' && phase === 'WORK');

  // SVG Circular Ring
  const ringSize = 260;
  const strokeWidth = 7;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleStartPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    setSettings({
      ...settings,
      workDuration: p.work,
      shortBreakDuration: p.short,
      longBreakDuration: p.long,
      breakSequence: p.sequence,
    });
    startSession(sessionName || p.name, sessionGoal || `Complete ${p.name} cycle`, p.name, false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden p-5 lg:p-6">
      {/* Alert Banner */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="glass-panel-elevated mb-5 p-4 flex items-start justify-between gap-3"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--fc-accent-light)]">
                {activeAlert.title}
              </p>
              <p className="text-xs text-[var(--fc-text-secondary)] mt-1">{activeAlert.body}</p>
            </div>
            <button
              onClick={dismissAlert}
              className="text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] transition-colors shrink-0"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px] gap-5 lg:gap-6 flex-1 min-h-0">
        {/* LEFT: Timer */}
        <div className="flex flex-col items-center justify-center min-h-0">
          {/* Phase Badge */}
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Badge className="h-8 px-4 gap-2 rounded-full border border-[var(--fc-surface-border)] bg-[var(--fc-surface)] text-[var(--fc-accent-light)] font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {PHASES[phase].label}
              <span className="text-[var(--fc-text-muted)]">·</span>
              <span className="text-[var(--fc-text-muted)]">Round {round}/{settings.breakSequence.length}</span>
            </Badge>
          </motion.div>

          {/* Circular Timer Ring */}
          <div className="relative w-[260px] h-[260px] lg:w-[300px] lg:h-[300px]">
            <svg
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className={`w-full h-full -rotate-90 ${isActive ? 'animate-pulse-glow' : ''}`}
            >
              <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="50%" stopColor="#00ffff" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="ring-gradient-break" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className="timer-ring-track"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                className={`timer-ring-progress ${isBreak ? 'timer-ring-break' : ''}`}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <motion.p
                key={secondsRemaining}
                className="text-5xl lg:text-6xl font-black tracking-tight tabular-nums text-[var(--fc-text)]"
              >
                {formatTime(secondsRemaining)}
              </motion.p>
              <p className="text-xs text-[var(--fc-text-muted)] mt-2 max-w-[180px] text-center leading-relaxed">
                {getCoachMessage()}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-8">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-11 h-11 rounded-full border-[var(--fc-surface-border)] bg-[var(--fc-surface)] hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-secondary)]"
                    onClick={currentSession ? endSession : resetTimer}
                  />
                }
              >
                {currentSession ? <Square className="w-4 h-4 fill-current text-red-400" /> : <RotateCcw className="w-4 h-4" />}
              </TooltipTrigger>
              <TooltipContent>{currentSession ? 'End Session' : 'Reset Timer'}</TooltipContent>
            </Tooltip>

            {isIdle ? (
              <Button
                onClick={() => startSession(sessionName || 'Custom Focus', sessionGoal || 'Complete focus cycle', 'Custom')}
                className="h-13 px-8 rounded-full bg-[var(--fc-accent)] hover:bg-[var(--fc-accent-light)] text-[var(--fc-text)] font-bold text-sm gap-2 shadow-[0_0_24px_var(--fc-accent-glow)] hover:shadow-[0_0_36px_var(--fc-accent-glow)] transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Focus
              </Button>
            ) : (
              <Button
                onClick={toggleTimer}
                className={`h-13 px-8 rounded-full font-bold text-sm gap-2 transition-all ${
                  isBreak
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_24px_var(--fc-success-glow)]'
                    : 'bg-[var(--fc-accent)] hover:bg-[var(--fc-accent-light)] shadow-[0_0_24px_var(--fc-accent-glow)]'
                } text-[var(--fc-text)]`}
              >
                {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                {isActive ? 'Pause' : 'Resume'}
              </Button>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-11 h-11 rounded-full border-[var(--fc-surface-border)] bg-[var(--fc-surface)] hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-secondary)] disabled:opacity-30"
                    onClick={skipPhase}
                    disabled={!canSkip}
                  />
                }
              >
                <SkipForward className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Skip Phase</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1.5 mt-5">
            {settings.breakSequence.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < round
                    ? isBreak
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                      : 'bg-[var(--fc-accent)] shadow-[0_0_6px_var(--fc-accent-glow)]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Session Config + Presets + Stats */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Daily Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-[var(--fc-text-muted)] mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Sessions</span>
              </div>
              <p className="text-2xl font-black text-[var(--fc-text)]">{dailySessions}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-[var(--fc-text-muted)] mb-1">
                <Clock className="w-3.5 h-3.5 text-[var(--fc-accent-light)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Focus</span>
              </div>
              <p className="text-2xl font-black text-[var(--fc-text)]">{formatMinutes(totalFocusToday)}<span className="text-sm font-medium text-[var(--fc-text-muted)]">m</span></p>
            </div>
          </div>

          {/* Session Config */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--fc-text-muted)] flex items-center gap-2">
                <Target className="w-3 h-3" />
                Session Setup
              </p>
              
              <Settings className="w-3.5 h-3.5" />
            </div>
            
            {/* Session Blueprint — Visual Timeline */}
            <div className="pt-3 space-y-3 border-t border-[var(--fc-surface-border)]/30">
              <div className="flex items-end justify-between px-0.5 pb-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--fc-text-muted)] font-bold">Cycle Blueprint</span>
                  <div className="flex items-baseline gap-1.5">
                    {(() => {
                      const totalSeconds = (
                        settings.workDuration * settings.breakSequence.length + 
                        settings.breakSequence.filter((t: string) => t === 'SHORT').length * settings.shortBreakDuration +
                        settings.breakSequence.filter((t: string) => t === 'LONG').length * settings.longBreakDuration
                      );
                      const h = Math.floor(totalSeconds / 3600);
                      const m = Math.floor((totalSeconds % 3600) / 60);
                      return (
                        <>
                          {h > 0 && (
                            <span className="text-xl font-black text-[var(--fc-text)]">
                              {h}<span className="text-[10px] font-bold text-[var(--fc-text-muted)] ml-0.5 uppercase tracking-tighter">h</span>
                            </span>
                          )}
                          <span className="text-xl font-black text-[var(--fc-text)]">
                            {m}<span className="text-[10px] font-bold text-[var(--fc-text-muted)] ml-0.5 uppercase tracking-tighter">m</span>
                          </span>
                          <span className="text-[10px] font-bold text-[var(--fc-text-muted)] ml-1 uppercase tracking-widest">Total</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--fc-surface-hover)]/40 border border-[var(--fc-surface-border)]/50">
                  <span className="text-[9px] font-mono font-bold text-[var(--fc-text-muted)] uppercase tracking-tight">Sequence Active</span>
                </div>
              </div>

              {/* Timeline Strip */}
              <div className="flex gap-[2px] h-10 rounded-lg overflow-hidden">
                {settings.breakSequence.map((breakType: 'SHORT' | 'LONG', i: number) => {
                  const numWork = settings.breakSequence.length;
                  const numShort = settings.breakSequence.filter((t: string) => t === 'SHORT').length;
                  const numLong = settings.breakSequence.filter((t: string) => t === 'LONG').length;
                  
                  const totalCycleTime = (numWork * settings.workDuration) + (numShort * settings.shortBreakDuration) + (numLong * settings.longBreakDuration);
                  
                  const workFlex = settings.workDuration / totalCycleTime;
                  const breakFlex = (breakType === 'SHORT' ? settings.shortBreakDuration : settings.longBreakDuration) / totalCycleTime;

                  return (
                    <React.Fragment key={i}>
                      {/* Work segment */}
                      <button
                        onClick={() => setActivePicker('work')}
                        style={{ flex: workFlex }}
                        className="relative h-full bg-[var(--fc-accent)]/30 hover:bg-[var(--fc-accent)]/50 border border-[var(--fc-accent)]/20 hover:border-[var(--fc-accent-light)]/50 transition-all group cursor-pointer flex items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--fc-accent-light)]/10 to-transparent" />
                        <span className="text-[8px] font-bold text-[var(--fc-accent-light)] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {Math.floor(settings.workDuration / 60)}m
                        </span>
                      </button>
                      
                      {/* Break segment */}
                      <button
                        onClick={() => {
                          const nextSeq = [...settings.breakSequence];
                          nextSeq[i] = breakType === 'SHORT' ? 'LONG' : 'SHORT';
                          setSettings({ ...settings, breakSequence: nextSeq });
                        }}
                        style={{ flex: breakFlex }}
                        className={`relative h-full transition-all group cursor-pointer flex items-center justify-center overflow-hidden border ${
                          breakType === 'LONG' 
                            ? 'bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/20 hover:border-amber-400/50' 
                            : 'bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-500/20 hover:border-emerald-400/50'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-b ${breakType === 'LONG' ? 'from-amber-400/10' : 'from-emerald-400/10'} to-transparent`} />
                        <span className={`text-[8px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity z-10 ${breakType === 'LONG' ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {breakType === 'LONG' ? Math.floor(settings.longBreakDuration / 60) : Math.floor(settings.shortBreakDuration / 60)}m
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Duration Editor */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => setActivePicker('work')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--fc-surface-border)]/50 bg-[var(--fc-surface)] hover:border-[var(--fc-accent-light)]/40 transition-all group"
                >
                  <div className="w-1 h-6 rounded-full bg-[var(--fc-accent)] group-hover:shadow-[0_0_8px_var(--fc-accent-glow)] transition-all shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] uppercase tracking-widest text-[var(--fc-text-muted)] font-bold">Focus</p>
                    <p className="text-xs font-black font-mono text-[var(--fc-text)]">{formatTime(settings.workDuration)}</p>
                  </div>
                </button>
                <button
                  onClick={() => setActivePicker('short')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--fc-surface-border)]/50 bg-[var(--fc-surface)] hover:border-emerald-500/40 transition-all group"
                >
                  <div className="w-1 h-6 rounded-full bg-emerald-500 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] uppercase tracking-widest text-[var(--fc-text-muted)] font-bold">Short</p>
                    <p className="text-xs font-black font-mono text-[var(--fc-text)]">{formatTime(settings.shortBreakDuration)}</p>
                  </div>
                </button>
                <button
                  onClick={() => setActivePicker('long')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--fc-surface-border)]/50 bg-[var(--fc-surface)] hover:border-amber-500/40 transition-all group"
                >
                  <div className="w-1 h-6 rounded-full bg-amber-500 group-hover:shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-all shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] uppercase tracking-widest text-[var(--fc-text-muted)] font-bold">Long</p>
                    <p className="text-xs font-black font-mono text-[var(--fc-text)]">{formatTime(settings.longBreakDuration)}</p>
                  </div>
                </button>
              </div>

              {/* Rounds */}
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[9px] uppercase tracking-widest text-[var(--fc-text-muted)] font-bold">Rounds</span>
                <div className="flex items-center gap-1 bg-[var(--fc-surface-hover)]/30 p-0.5 rounded-lg border border-[var(--fc-surface-border)]/50">
                  <button
                    onClick={() => {
                      if (settings.breakSequence.length > 1) {
                        setSettings({ ...settings, breakSequence: settings.breakSequence.slice(0, -1) });
                      }
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-[var(--fc-surface)] hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] transition-colors"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-[10px] font-mono font-bold text-[var(--fc-text)] text-center">
                    {settings.breakSequence.length}
                  </span>
                  <button
                    onClick={() => setSettings({ ...settings, breakSequence: [...settings.breakSequence, 'SHORT'] })}
                    className="w-5 h-5 flex items-center justify-center rounded bg-[var(--fc-surface)] hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-[var(--fc-text-muted)] tracking-wider">Session Name</Label>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Focus Sprint"
                className="h-9 bg-[var(--fc-surface)] border-[var(--fc-surface-border)] text-[var(--fc-text)] placeholder:text-[var(--fc-text-muted)] text-sm rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-[var(--fc-text-muted)] tracking-wider">Mission Goal</Label>
              <Input
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="What will you accomplish?"
                className="h-9 bg-[var(--fc-surface)] border-[var(--fc-surface-border)] text-[var(--fc-text)] placeholder:text-[var(--fc-text-muted)] text-sm rounded-lg"
              />
            </div>

            {/* Auto-Start Toggles */}
            <div className="pt-2 grid grid-cols-2 gap-4 border-t border-[var(--fc-surface-border)]/30">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[9px] uppercase font-bold text-[var(--fc-text-muted)] leading-none">Auto Break</Label>
                <Switch 
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked })}
                  className="scale-[0.6] origin-right"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[9px] uppercase font-bold text-[var(--fc-text-muted)] leading-none">Auto Focus</Label>
                <Switch 
                  checked={settings.autoStartWork}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoStartWork: checked })}
                  className="scale-[0.6] origin-right"
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--fc-text-muted)] flex items-center gap-2 px-1">
              <Zap className="w-3 h-3" />
              Quick Start
            </p>
            <div className="space-y-2">
              {(Object.entries(PRESETS) as [keyof typeof PRESETS, (typeof PRESETS)['pomodoro']][]).map(([key, value]) => {
                const Icon = value.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleStartPreset(key)}
                    className="preset-card w-full text-left flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--fc-accent-subtle)] flex items-center justify-center shrink-0 relative z-10">
                      <Icon className="w-4.5 h-4.5 text-[var(--fc-accent-light)]" />
                    </div>
                    <div className="relative z-10 min-w-0">
                      <p className="text-sm font-bold text-[var(--fc-text)]">{value.name}</p>
                      <p className="text-[11px] text-[var(--fc-text-muted)]">{value.desc}</p>
                    </div>
                  <div className="flex items-center px-2 py-1 rounded-md border border-[var(--fc-surface-border)]/50 bg-[var(--fc-surface-hover)]/20 ml-auto">
                    <span className="text-[10px] font-bold text-[var(--fc-text-muted)] tracking-wider">
                      {Math.floor(value.work / 60)}m
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* Session Complete Overlay */}
      <AnimatePresence>
        {phase === 'IDLE' && !isActive && currentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel-elevated max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--fc-text)]">Session Complete</h3>
                  <p className="text-sm text-[var(--fc-text-muted)]">Did you accomplish your goal?</p>
                </div>
              </div>

              <div className="mt-6 grid gap-2">
                {([
                  { key: 'yes', label: '✅ Yes, nailed it', color: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30' },
                  { key: 'partial', label: '⚡ Partially done', color: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30' },
                  { key: 'no', label: '❌ Not this time', color: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30' },
                ] as const).map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => {
                      saveSession({ result: key, helped: '', blocked: '' });
                      setSessionGoal('');
                    }}
                    className={`h-12 rounded-xl border font-semibold text-sm transition-all ${color}`}
                  >
                    {label}
                  </button>
                ))}

                <button
                  onClick={resetTimer}
                  className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--fc-text-muted)] hover:text-red-400 transition-colors py-2"
                >
                  Discard Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Time Pickers */}
      <TimePickerModal
        isOpen={activePicker === 'work'}
        onClose={() => setActivePicker(null)}
        title="Focus Duration"
        initialSeconds={settings.workDuration}
        onSave={(secs) => setSettings({ ...settings, workDuration: secs })}
      />
      <TimePickerModal
        isOpen={activePicker === 'short'}
        onClose={() => setActivePicker(null)}
        title="Short Break"
        initialSeconds={settings.shortBreakDuration}
        onSave={(secs) => setSettings({ ...settings, shortBreakDuration: secs })}
      />
      <TimePickerModal
        isOpen={activePicker === 'long'}
        onClose={() => setActivePicker(null)}
        title="Long Break"
        initialSeconds={settings.longBreakDuration}
        onSave={(secs) => setSettings({ ...settings, longBreakDuration: secs })}
      />
    </div>
  );
};

