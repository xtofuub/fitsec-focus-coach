import React, { useState } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Timer, BarChart3, Settings, X, Minus } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { TimerView } from '@/components/views/TimerView';
import { HistoryView } from '@/components/views/HistoryView';
import { SettingsView } from '@/components/views/SettingsView';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

type View = 'timer' | 'history' | 'settings';

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'timer', label: 'Focus', icon: Timer },
  { id: 'history', label: 'History', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('timer');

  const timer = useTimer();

  const handleMinimize = () => (window as any).windowControls?.minimize();
  const handleClose = () => (window as any).windowControls?.close();

  return (
    <TooltipProvider>
      <div className="w-full h-screen flex flex-col overflow-hidden">
        {/* ─── Title Bar ─── */}
        <div
          className="h-10 flex items-center justify-between px-4 bg-transparent shrink-0 select-none z-50"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <img src={logo} alt="Fitsec" className="h-4 w-auto object-contain brightness-125 hover:brightness-150 transition-all invert dark:invert-0" />
              {timer.isActive && (
                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-[var(--fc-accent-light)] shadow-[0_0_8px_var(--fc-accent-glow)] animate-pulse" />
              )}
            </div>
            <div className="h-3 w-px bg-[var(--fc-surface-border)] mx-1" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--fc-text-muted)] mt-0.5">
              Focus Coach
            </span>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={handleMinimize}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] hover:bg-white/10 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] hover:bg-red-500/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex flex-1 min-h-0 p-3 pt-0 gap-3">
          {/* ─── Sidebar ─── */}
          <nav className="w-[64px] flex flex-col items-center py-5 border border-[var(--fc-surface-border)] bg-[var(--fc-surface)]/20 backdrop-blur-2xl rounded-2xl shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-2 flex-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger
                      render={
                        <button
                          onClick={() => setActiveView(item.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                            isActive
                              ? 'text-[var(--fc-accent-light)] bg-[var(--fc-accent-subtle)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_12px_var(--fc-accent-glow)]'
                              : 'text-[var(--fc-text-muted)] hover:text-[var(--fc-text)] hover:bg-[var(--fc-surface-hover)]'
                          }`}
                        />
                      }
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="absolute -left-[1px] top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--fc-accent)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Version tag at bottom */}
            <span className="text-[9px] font-mono text-[var(--fc-text-muted)]/50 mt-auto">v1.0</span>
          </nav>

          {/* ─── Content ─── */}
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative glass-panel rounded-2xl bg-[var(--fc-surface)]/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 flex flex-col min-h-0"
              >
                {activeView === 'timer' && (
                  <TimerView
                    phase={timer.phase}
                    round={timer.round}
                    secondsRemaining={timer.secondsRemaining}
                    totalSeconds={timer.totalSeconds}
                    isActive={timer.isActive}
                    settings={timer.settings}
                    setSettings={timer.setSettings}
                    currentSession={timer.currentSession}
                    startSession={timer.startSession}
                    toggleTimer={timer.toggleTimer}
                    endSession={timer.endSession}
                    resetTimer={timer.resetTimer}
                    skipPhase={timer.skipPhase}
                    saveSession={timer.saveSession}
                    dailySessions={timer.dailySessions}
                    totalFocusToday={timer.totalFocusToday}
                    getCoachMessage={timer.getCoachMessage}
                    activeAlert={timer.activeAlert}
                    dismissAlert={timer.dismissAlert}
                  />
                )}

                {activeView === 'history' && (
                  <HistoryView
                    history={timer.history}
                    clearHistory={timer.clearHistory}
                    deleteSession={timer.deleteSession}
                    dailySessions={timer.dailySessions}
                    totalFocusToday={timer.totalFocusToday}
                  />
                )}

                {activeView === 'settings' && (
                  <SettingsView
                    settings={timer.settings}
                    setSettings={timer.setSettings}
                    previewSound={timer.previewSound}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
