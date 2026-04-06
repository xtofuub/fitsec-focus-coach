import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  History,
  Bell,
  BellRing,
  Flame,
  Target,
  Zap,
  Brain,
  Moon,
  Sun,
  Palette,
  Volume2,
  Smartphone,
  Monitor,
  X
} from 'lucide-react';
import { useTimer, TimerPhase } from '@/hooks/useTimer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const PHASES: Record<TimerPhase, string> = {
  IDLE: 'Ready',
  WORK: 'Focus',
  SHORT_BREAK: 'Short Break',
  LONG_BREAK: 'Long Break'
};

const PRESETS = {
  pomodoro: { work: 25, short: 5, long: 15, rounds: 4, name: 'Pomodoro', icon: Target },
  deepWork: { work: 50, short: 10, long: 30, rounds: 4, name: 'Deep Work', icon: Brain },
  sprint: { work: 15, short: 3, long: 10, rounds: 4, name: 'Sprint', icon: Zap }
};

export const FocusWidget: React.FC = () => {
  const {
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
    clearHistory,
    dailySessions,
    totalFocusToday,
    getCoachMessage,
    activeAlert,
    dismissAlert
  } = useTimer();

  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionName, setSessionName] = useState('Mission Sprint');

  const progress = totalSeconds > 0 ? (1 - secondsRemaining / totalSeconds) * 100 : 0;
  const compact = settings.layoutDensity === 'COMPACT';

  const themePalette = useMemo(() => {
    if (settings.theme === 'MIDNIGHT') {
      return {
        shell: 'from-slate-900 via-slate-900 to-slate-800 text-slate-100',
        panel: 'bg-slate-900/95 border-slate-700/80',
        softPanel: 'bg-slate-800/60 border-slate-700/70',
        textMuted: 'text-slate-300',
        primary: 'bg-cyan-500 hover:bg-cyan-400',
        primarySoft: 'bg-cyan-500/20 text-cyan-200',
        ring: 'text-cyan-400'
      };
    }
    if (settings.theme === 'SUNRISE') {
      return {
        shell: 'from-amber-50 via-orange-50 to-rose-50 text-slate-900',
        panel: 'bg-white/95 border-amber-100',
        softPanel: 'bg-white/80 border-orange-100',
        textMuted: 'text-slate-500',
        primary: 'bg-orange-500 hover:bg-orange-600',
        primarySoft: 'bg-orange-100 text-orange-700',
        ring: 'text-orange-500'
      };
    }
    return {
      shell: 'from-slate-100 via-blue-50 to-indigo-100 text-slate-900',
      panel: 'bg-white/95 border-indigo-100',
      softPanel: 'bg-white/80 border-slate-200',
      textMuted: 'text-slate-500',
      primary: 'bg-indigo-600 hover:bg-indigo-700',
      primarySoft: 'bg-indigo-100 text-indigo-700',
      ring: 'text-indigo-500'
    };
  }, [settings.theme]);

  const handleStartPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    setSettings({
      ...settings,
      workDuration: p.work,
      shortBreakDuration: p.short,
      longBreakDuration: p.long,
      roundsBeforeLongBreak: p.rounds
    });
    startSession(sessionName || p.name, sessionGoal || `Complete ${p.name} cycle`, p.name);
  };

  const handleMinimize = () => (window as any).windowControls?.minimize();
  const handleClose = () => (window as any).windowControls?.close();
  const canSkip = !(settings.focusLevel === 'DEEP' && phase === 'WORK');
  const isIdle = phase === 'IDLE';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full h-full p-2 sm:p-3 cursor-pointer flex flex-col bg-gradient-to-br ${themePalette.shell}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          (window as any).windowControls?.minimize();
        }
      }}
    >
      <Card
        className={`overflow-hidden border shadow-2xl rounded-[24px] sm:rounded-[28px] flex-1 flex flex-col cursor-default relative backdrop-blur-xl ${themePalette.panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 sm:px-5 py-3'} border-b select-none z-20 ${themePalette.softPanel}`}
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="Fitsec Logo" className="w-5 h-5 object-contain" />
            <span className="text-[11px] sm:text-xs font-black tracking-[0.18em] uppercase">Fitsec Coach</span>
          </div>

          <div className="flex gap-1 items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <Badge className={`h-7 px-2 gap-1 rounded-full border-0 font-bold ${themePalette.primarySoft}`}>
              <Flame className="w-3 h-3" />
              {dailySessions}
            </Badge>
            <Badge variant="secondary" className="h-7 px-2 gap-1 rounded-full">
              <Target className="w-3 h-3" />
              {totalFocusToday}m
            </Badge>
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full text-current/70">
                    <History className="w-4 h-4" />
                  </Button>
                }
              />
              <PopoverContent align="end" className={`w-[min(92vw,360px)] p-0 rounded-2xl border ${themePalette.panel}`}>
                <div className="p-3 border-b text-sm font-bold">Recent Sessions</div>
                <div className="max-h-72 overflow-y-auto p-3 space-y-2">
                  {history.length === 0 ? (
                    <div className={`text-xs ${themePalette.textMuted}`}>No sessions yet.</div>
                  ) : (
                    history.slice(0, 12).map((session) => (
                      <div key={session.id} className={`rounded-xl p-3 border ${themePalette.softPanel}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold truncate">{session.name}</p>
                          <Badge variant="outline" className="text-[9px] uppercase">{session.type}</Badge>
                        </div>
                        <p className={`text-[11px] mt-1 truncate ${themePalette.textMuted}`}>{session.goal}</p>
                        <div className="text-[10px] mt-2 font-semibold">{session.totalFocusTime}m focus</div>
                      </div>
                    ))
                  )}
                </div>
                {history.length > 0 && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" className="w-full text-xs text-rose-500" onClick={clearHistory}>
                      Clear History
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full text-current/70">
                    <Settings className="w-4 h-4" />
                  </Button>
                }
              />
              <PopoverContent align="end" className={`w-[min(92vw,380px)] p-0 rounded-2xl border ${themePalette.panel}`}>
                <div className="p-3 border-b text-sm font-bold">Customization</div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-1">
                      <Label className="text-[10px] uppercase">Theme</Label>
                      <Select value={settings.theme} onValueChange={(value: any) => setSettings({ ...settings, theme: value })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FITSEC"><span className="flex items-center gap-2"><Palette className="w-3 h-3" />Fitsec</span></SelectItem>
                          <SelectItem value="MIDNIGHT"><span className="flex items-center gap-2"><Moon className="w-3 h-3" />Midnight</span></SelectItem>
                          <SelectItem value="SUNRISE"><span className="flex items-center gap-2"><Sun className="w-3 h-3" />Sunrise</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-1">
                      <Label className="text-[10px] uppercase">Layout</Label>
                      <Select value={settings.layoutDensity} onValueChange={(value: any) => setSettings({ ...settings, layoutDensity: value })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMFORTABLE"><span className="flex items-center gap-2"><Monitor className="w-3 h-3" />Comfort</span></SelectItem>
                          <SelectItem value="COMPACT"><span className="flex items-center gap-2"><Smartphone className="w-3 h-3" />Compact</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-1">
                      <Label className="text-[10px] uppercase">Focus</Label>
                      <Select value={settings.focusLevel} onValueChange={(value: any) => setSettings({ ...settings, focusLevel: value })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEEP">Deep</SelectItem>
                          <SelectItem value="LIGHT">Light</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Work (min)</Label>
                      <Input type="number" value={settings.workDuration} min={5} max={180} onChange={(e) => setSettings({ ...settings, workDuration: Number(e.target.value) || 25 })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Short Break</Label>
                      <Input type="number" value={settings.shortBreakDuration} min={1} max={60} onChange={(e) => setSettings({ ...settings, shortBreakDuration: Number(e.target.value) || 5 })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Long Break</Label>
                      <Input type="number" value={settings.longBreakDuration} min={5} max={90} onChange={(e) => setSettings({ ...settings, longBreakDuration: Number(e.target.value) || 15 })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Rounds</Label>
                      <Input type="number" value={settings.roundsBeforeLongBreak} min={2} max={8} onChange={(e) => setSettings({ ...settings, roundsBeforeLongBreak: Number(e.target.value) || 4 })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Alert Lead Time</Label>
                      <Select
                        value={String(settings.notificationLeadSeconds)}
                        onValueChange={(value) => setSettings({ ...settings, notificationLeadSeconds: Number(value) })}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Off</SelectItem>
                          <SelectItem value="30">30 sec</SelectItem>
                          <SelectItem value="60">1 min</SelectItem>
                          <SelectItem value="120">2 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Sound Style</Label>
                      <Select value={settings.notificationSound} onValueChange={(value: any) => setSettings({ ...settings, notificationSound: value })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHIME">Chime</SelectItem>
                          <SelectItem value="BELL">Bell</SelectItem>
                          <SelectItem value="SOFT">Soft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" />Notification Volume</span>
                      <span>{Math.round(settings.notificationVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.notificationVolume}
                      onChange={(e) => setSettings({ ...settings, notificationVolume: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1"><Bell className="w-3 h-3" />Desktop Alerts</span>
                      <Switch checked={settings.notificationsEnabled} onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1"><BellRing className="w-3 h-3" />In-App Alerts</span>
                      <Switch checked={settings.inAppAlertsEnabled} onCheckedChange={(checked) => setSettings({ ...settings, inAppAlertsEnabled: checked })} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Sound Cues</span>
                      <Switch checked={settings.soundEnabled} onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Auto Break</span>
                      <Switch checked={settings.autoStartBreaks} onCheckedChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked })} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex gap-1 ml-1 pl-1 border-l">
              <button onClick={handleMinimize} className="w-6 h-6 rounded-full bg-slate-100/70 hover:bg-amber-400 text-slate-500 hover:text-white flex items-center justify-center transition-colors">
                <span className="w-2 h-[2px] bg-current rounded-full" />
              </button>
              <button onClick={handleClose} className="w-6 h-6 rounded-full bg-slate-100/70 hover:bg-rose-500 text-slate-500 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <CardContent className={`p-3 sm:p-4 md:p-5 flex-1 flex flex-col relative overflow-hidden ${compact ? 'gap-3' : 'gap-4'}`}>
          <AnimatePresence>
            {activeAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-3 right-3 left-3 z-40 rounded-xl border ${themePalette.panel} p-3 shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em]">{activeAlert.title}</p>
                    <p className={`text-xs mt-1 ${themePalette.textMuted}`}>{activeAlert.body}</p>
                  </div>
                  <button onClick={dismissAlert} className="text-current/60 hover:text-current">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 flex-1 min-h-0">
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col flex-1 min-h-0 ${themePalette.softPanel}`}>
                <div className="flex items-center justify-between gap-3">
                  <Badge className={`${themePalette.primarySoft} border-0`}>{PHASES[phase]}</Badge>
                  <span className={`text-xs font-bold ${themePalette.textMuted}`}>Round {round}/{settings.roundsBeforeLongBreak}</span>
                </div>
                <div className="mt-4 text-center">
                  <div className={`${compact ? 'text-4xl' : 'text-5xl sm:text-6xl'} font-black tracking-tight tabular-nums`}>
                    {formatTime(secondsRemaining)}
                  </div>
                  <p className={`text-sm mt-2 ${themePalette.textMuted}`}>{getCoachMessage()}</p>
                </div>

                <div className="mt-5">
                  <Progress value={progress} className="h-2 bg-white/60" indicatorClassName={themePalette.primary.replace('hover:bg-indigo-700', '').replace('hover:bg-cyan-400', '').replace('hover:bg-orange-600', '')} />
                </div>

                <div className="mt-auto pt-5 flex items-center justify-center gap-3 sm:gap-4">
                  <Button variant="outline" size="icon" className="w-11 h-11 rounded-full" onClick={resetTimer}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  {isIdle ? (
                    <Button onClick={() => handleStartPreset('pomodoro')} className={`w-28 sm:w-32 h-12 rounded-full ${themePalette.primary}`}>
                      <Play className="w-5 h-5 fill-current mr-1" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={toggleTimer} className={`w-28 sm:w-32 h-12 rounded-full ${themePalette.primary}`}>
                      {isActive ? <Pause className="w-5 h-5 fill-current mr-1" /> : <Play className="w-5 h-5 fill-current mr-1" />}
                      {isActive ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="w-11 h-11 rounded-full" onClick={skipPhase} disabled={!canSkip}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
              <div className={`rounded-2xl border ${themePalette.softPanel} ${compact ? 'p-3' : 'p-4'} space-y-3`}>
                <div>
                  <Label className="text-[10px] uppercase">Session Name</Label>
                  <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Mission Sprint" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase">Mission</Label>
                  <Input value={sessionGoal} onChange={(e) => setSessionGoal(e.target.value)} placeholder="Finish architecture review and PR" />
                </div>
              </div>

              <div className={`rounded-2xl border ${themePalette.softPanel} ${compact ? 'p-3' : 'p-4'} space-y-2`}>
                <p className="text-xs font-black uppercase tracking-[0.08em]">Quick Start Presets</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(PRESETS) as [keyof typeof PRESETS, (typeof PRESETS)['pomodoro']][]).map(([key, value]) => {
                    const Icon = value.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => handleStartPreset(key)}
                        className="rounded-xl border bg-white/70 px-2 py-3 hover:bg-white transition-colors"
                      >
                        <Icon className={`w-4 h-4 mx-auto ${themePalette.ring}`} />
                        <p className="text-[10px] mt-1 font-bold">{value.name}</p>
                        <p className={`text-[10px] ${themePalette.textMuted}`}>{value.work}m</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {phase === 'IDLE' && !isActive && currentSession && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-[20px] p-4 sm:p-6 flex items-center justify-center z-50"
              >
                <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} className={`w-full max-w-md rounded-2xl border ${themePalette.panel} p-5`}>
                  <h3 className="text-xl font-black">Session Complete</h3>
                  <p className={`text-sm mt-1 ${themePalette.textMuted}`}>How did this cycle go?</p>
                  <div className="mt-4 grid gap-2">
                    {(['yes', 'partial', 'no'] as const).map((result) => (
                      <Button key={result} variant="outline" className="h-11 capitalize" onClick={() => {
                        saveSession({ result, helped: '', blocked: '' });
                        setSessionGoal('');
                      }}>
                        {result}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ');
}
