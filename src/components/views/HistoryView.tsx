import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Flame,
  Target,
  Trash2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Sparkles,
} from 'lucide-react';
import { type SessionRecord } from '@/hooks/useTimer';
import { motion } from 'framer-motion';

interface HistoryViewProps {
  history: SessionRecord[];
  clearHistory: () => void;
  dailySessions: number;
  totalFocusToday: number;
}

const resultIcon = (result?: string) => {
  switch (result) {
    case 'yes': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'partial': return <MinusCircle className="w-4 h-4 text-amber-400" />;
    case 'no': return <XCircle className="w-4 h-4 text-red-400" />;
    default: return <MinusCircle className="w-4 h-4 text-[var(--fc-text-muted)]" />;
  }
};

const resultLabel = (result?: string) => {
  switch (result) {
    case 'yes': return 'Completed';
    case 'partial': return 'Partial';
    case 'no': return 'Missed';
    default: return 'No reflection';
  }
};

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  clearHistory,
  dailySessions,
  totalFocusToday,
}) => {
  const today = new Date().toDateString();
  const sessionsToday = history.filter(s => new Date(s.startTime).toDateString() === today);
  const completedToday = sessionsToday.filter(s => s.reflection?.result === 'yes').length;
  const totalRoundsToday = sessionsToday.reduce((sum, s) => sum + s.rounds, 0);

  // Group by date
  const grouped = history.reduce((acc, session) => {
    const day = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(session);
    return acc;
  }, {} as Record<string, SessionRecord[]>);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-[var(--fc-text)] tracking-tight">Session History</h2>
          <p className="text-sm text-[var(--fc-text-muted)] mt-0.5">Track your focus journey</p>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="h-8 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 gap-1.5 rounded-lg"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </Button>
        )}
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="stat-card"
        >
          <div className="flex items-center gap-2 text-[var(--fc-text-muted)] mb-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sessions</span>
          </div>
          <p className="text-2xl font-black text-[var(--fc-text)]">{dailySessions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="stat-card"
        >
          <div className="flex items-center gap-2 text-[var(--fc-text-muted)] mb-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--fc-accent-light)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Focus Time</span>
          </div>
          <p className="text-2xl font-black text-[var(--fc-text)]">{totalFocusToday}<span className="text-sm font-medium text-[var(--fc-text-muted)]">m</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center gap-2 text-[var(--fc-text-muted)] mb-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rounds</span>
          </div>
          <p className="text-2xl font-black text-[var(--fc-text)]">{totalRoundsToday}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="stat-card"
        >
          <div className="flex items-center gap-2 text-[var(--fc-text-muted)] mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-2xl font-black text-[var(--fc-text)]">{completedToday}</p>
        </motion.div>
      </div>

      <Separator className="bg-[var(--fc-surface-border)] mb-4" />

      {/* Timeline */}
      <ScrollArea className="flex-1 min-h-0">
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--fc-surface)] flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-[var(--fc-text-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--fc-text)] mb-1">No Sessions Yet</h3>
            <p className="text-sm text-[var(--fc-text-muted)] max-w-xs">
              Start your first focus session and your history will appear here. Every session counts!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6 pb-4">
            {Object.entries(grouped).map(([date, sessions]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 py-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--fc-text-muted)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--fc-text-muted)]">{date}</span>
                  <div className="flex-1 h-px bg-[var(--fc-surface-border)]" />
                </div>
                <div className="space-y-2">
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="session-item"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-[var(--fc-text)] truncate">{session.name}</p>
                            <Badge className="h-5 px-2 text-[9px] uppercase tracking-wider font-bold bg-[var(--fc-accent-subtle)] text-[var(--fc-accent-light)] border-0 shrink-0">
                              {session.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--fc-text-muted)] truncate">{session.goal}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-[var(--fc-text)]">{session.totalFocusTime}m</p>
                            <p className="text-[10px] text-[var(--fc-text-muted)]">{session.rounds} rounds</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {resultIcon(session.reflection?.result)}
                            <span className="text-[10px] text-[var(--fc-text-muted)]">
                              {resultLabel(session.reflection?.result)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
