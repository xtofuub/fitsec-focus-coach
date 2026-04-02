import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, SkipForward, Settings, History, Lock, Unlock } from 'lucide-react';
import { useTimer, TimerPhase } from '@/hooks/useTimer';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const PHASES: Record<TimerPhase, string> = {
  IDLE: 'READY',
  WORK: 'FOCUS',
  SHORT_BREAK: 'SHORT BREAK',
  LONG_BREAK: 'LONG BREAK'
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
    clearHistory
  } = useTimer();

  const [sessionName, setSessionName] = React.useState('');
  const [sessionGoal, setSessionGoal] = React.useState('');
  const [sessionType, setSessionType] = React.useState('Development');

  const progress = (1 - secondsRemaining / totalSeconds) * 100;

  const handleStart = () => {
    if (phase === 'IDLE') {
      if (!sessionName || !sessionGoal) return;
      startSession(sessionName, sessionGoal, sessionType);
    } else {
      toggleTimer();
    }
  };

  const handleMinimize = () => (window as any).windowControls?.minimize();
  const handleClose = () => (window as any).windowControls?.close();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-2 cursor-pointer"
      onClick={(e) => {
        // Only minimize if clicking the transparent background, not the card itself
        if (e.target === e.currentTarget) {
          (window as any).windowControls.minimize();
        }
      }}
    >
      <Card 
        className="overflow-hidden border border-slate-100 shadow-2xl bg-white rounded-[40px] h-full flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Top Bar - Draggable */}
          <div 
            className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 transition-colors select-none flex-shrink-0"
            style={{ WebkitAppRegion: 'drag' } as any}
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Focus Coach</span>
            </div>
            <div className="flex gap-1 items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <Popover>
                <PopoverTrigger 
                  render={
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-slate-50 text-slate-400">
                      <History className="w-4 h-4" />
                    </Button>
                  }
                />
                <PopoverContent className="w-80 rounded-2xl p-0 border-none shadow-xl">
                    <div className="p-4 border-b border-slate-50">
                        <h3 className="text-sm font-bold">Session History</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                        {history.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 py-4">No sessions yet</p>
                        ) : (
                            history.map(s => (
                                <div key={s.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold truncate pr-2">{s.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-4">{s.type}</Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-1">{s.goal}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-indigo-500">{s.totalFocusTime}m focus</span>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className={cn("text-[10px] font-bold", s.reflection?.result === 'yes' ? 'text-green-500' : 'text-orange-500')}>
                                            {s.reflection?.result?.toUpperCase() || 'SKIPPED'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {history.length > 0 && (
                        <div className="p-2 border-t border-slate-50">
                            <Button variant="ghost" className="w-full text-xs text-red-400 h-8" onClick={clearHistory}>Clear History</Button>
                        </div>
                    )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger 
                  render={
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-slate-50 text-slate-400">
                      <Settings className="w-4 h-4" />
                    </Button>
                  }
                />
                <PopoverContent className="w-80 rounded-2xl border-none shadow-xl p-6">
                  <div className="space-y-4">
                    <h3 className="font-bold">Settings</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Work Duration (min)</Label>
                            <Input 
                                type="number" 
                                value={settings.workDuration} 
                                onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value)})}
                                className="h-9 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Short Break</Label>
                                <Input 
                                    type="number" 
                                    value={settings.shortBreakDuration} 
                                    onChange={(e) => setSettings({...settings, shortBreakDuration: parseInt(e.target.value)})}
                                    className="h-9 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Long Break</Label>
                                <Input 
                                    type="number" 
                                    value={settings.longBreakDuration} 
                                    onChange={(e) => setSettings({...settings, longBreakDuration: parseInt(e.target.value)})}
                                    className="h-9 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Auto-start breaks</Label>
                            <Switch checked={settings.autoStartBreaks} onCheckedChange={(checked) => setSettings({...settings, autoStartBreaks: checked})} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Auto-start work</Label>
                            <Switch checked={settings.autoStartWork} onCheckedChange={(checked) => setSettings({...settings, autoStartWork: checked})} />
                        </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Window Controls */}
              <div className="flex gap-1 ml-2 pl-2 border-l border-slate-100">
                <button
                  onClick={handleMinimize}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-amber-400 text-slate-400 hover:text-white text-xs transition-colors flex items-center justify-center leading-none"
                  title="Minimize"
                >−</button>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-400 text-slate-400 hover:text-white text-xs transition-colors flex items-center justify-center leading-none"
                  title="Close"
                >×</button>
              </div>
            </div>
          </div>

          <CardContent className="px-8 py-6 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-8">
              {/* Left: Timer */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn(
                    "text-[10px] font-bold px-2 py-0 border-none",
                    phase === 'WORK' ? "bg-indigo-50 text-indigo-500" : "bg-green-50 text-green-500"
                  )}>
                    {PHASES[phase]}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-300 uppercase leading-none">
                    Round {round} / {settings.roundsBeforeLongBreak}
                  </span>
                </div>
                <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {formatTime(secondsRemaining)}
                </div>
              </div>

              {/* Middle: Connection Button */}
              <div className="relative">
                <AnimatePresence>
                    {isActive && (
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 0.3 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className={cn(
                                "absolute inset-0 rounded-full blur-xl",
                                phase === 'WORK' ? "bg-indigo-400" : "bg-green-400"
                            )}
                        />
                    )}
                </AnimatePresence>
                <Button 
                  onClick={handleStart}
                  disabled={phase === 'IDLE' && (!sessionName || !sessionGoal)}
                  className={cn(
                    "w-20 h-20 rounded-full shadow-lg transition-all duration-500 relative z-10 p-0 border-4 border-white",
                    phase === 'IDLE' ? "bg-indigo-600 hover:bg-indigo-700" : 
                    (phase === 'WORK' ? (isActive ? "bg-white text-indigo-600 hover:bg-slate-50" : "bg-indigo-600") : 
                    (isActive ? "bg-white text-green-600 hover:bg-slate-50" : "bg-green-600"))
                  )}
                >
                    {phase === 'IDLE' ? <Play className="w-8 h-8 fill-current" /> : (
                        isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />
                    )}
                </Button>
              </div>

              {/* Right: Controls */}
              <div className="flex flex-col gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-10 h-10 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400"
                    onClick={resetTimer}
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-10 h-10 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400"
                    onClick={skipPhase}
                    disabled={phase === 'IDLE'}
                >
                    <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Session Inputs for IDLE phase */}
            <AnimatePresence>
                {phase === 'IDLE' && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 space-y-3"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <Input 
                                placeholder="Session Name" 
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                className="h-10 rounded-xl bg-slate-50 border-none shadow-none text-xs"
                            />
                            <Input 
                                placeholder="Goal (OKR)" 
                                value={sessionGoal}
                                onChange={(e) => setSessionGoal(e.target.value)}
                                className="h-10 rounded-xl bg-slate-50 border-none shadow-none text-xs"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reflection Overlay */}
            {phase === 'IDLE' && !isActive && currentSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <Card className="w-full max-w-sm rounded-[32px] border-none shadow-2xl p-8 bg-white">
                        <h2 className="text-xl font-black mb-1">Session Done</h2>
                        <p className="text-xs text-slate-400 mb-6">Quick reflection for the team log.</p>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Achieved Goal?</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['yes', 'partial', 'no'].map((r) => (
                                        <Button 
                                            key={r}
                                            variant="outline" 
                                            className={cn(
                                                "h-12 rounded-xl text-xs font-bold capitalize",
                                                r === 'yes' ? "hover:bg-green-50 hover:text-green-600 hover:border-green-100" : ""
                                            )}
                                            onClick={() => saveSession({ 
                                                result: r as any, 
                                                helped: '', 
                                                blocked: '' 
                                            })}
                                        >
                                            {r}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
          </CardContent>

          {/* Footer - Session Info */}
          <div className="px-8 py-3 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isActive ? (phase === 'WORK' ? "Protecting your focus" : "Recharging...") : "Ready"}
            </span>
            {isActive && currentSession && (
                <span className="text-[10px] font-bold text-indigo-500 truncate max-w-[200px]">
                    {currentSession.name}: {currentSession.goal}
                </span>
            )}
          </div>
          
          <Progress value={progress} className="h-1 rounded-none bg-slate-100 flex-shrink-0" indicatorClassName={cn(
               phase === 'WORK' ? "bg-indigo-500" : "bg-green-500"
          )} />
        </Card>
      </motion.div>
  );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
