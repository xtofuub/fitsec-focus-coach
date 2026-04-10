import React, { useState } from 'react';
import { TimePickerModal } from '@/components/ui/TimePickerModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Bell,
  BellRing,
  Volume2,
  Shield,
  Timer,
  Coffee,
  Repeat,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { type TimerSettings } from '@/hooks/useTimer';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

interface SettingsViewProps {
  settings: TimerSettings;
  setSettings: (s: TimerSettings) => void;
  previewSound: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, previewSound }) => {
  const update = (patch: Partial<TimerSettings>) => setSettings({ ...settings, ...patch });
  const { theme, setTheme } = useTheme();

  // Picker States
  const [activePicker, setActivePicker] = useState<'work' | 'short' | 'long' | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-5 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-black text-[var(--fc-text)] tracking-tight">Preferences</h2>
        <p className="text-sm text-[var(--fc-text-muted)] mt-0.5">Customize your focus experience</p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-5 pb-6 pr-3">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="settings-group"
          >
            <p className="settings-group-title flex items-center gap-2">
              <Sun className="w-3.5 h-3.5" />
              Appearance
            </p>

            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ] as const
              ).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === id
                      ? 'border-[var(--fc-accent)] bg-[var(--fc-accent-subtle)] shadow-[0_0_12px_var(--fc-accent-glow)] text-[var(--fc-accent-light)]'
                      : 'border-[var(--fc-surface-border)] bg-[var(--fc-surface)] hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text-muted)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`text-xs font-bold ${theme === id ? 'text-[var(--fc-text)]' : 'text-[var(--fc-text-secondary)]'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="settings-group"
          >
            <p className="settings-group-title flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" />
              Notifications & Sound
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--fc-text-secondary)] flex items-center gap-1.5">
                    <Bell className="w-3 h-3" />
                    Desktop Alerts
                  </Label>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => update({ notificationsEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--fc-text-secondary)] flex items-center gap-1.5">
                    <BellRing className="w-3 h-3" />
                    In-App Alerts
                  </Label>
                  <Switch
                    checked={settings.inAppAlertsEnabled}
                    onCheckedChange={(checked) => update({ inAppAlertsEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--fc-text-secondary)] flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3" />
                    Sound Cues
                  </Label>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => update({ soundEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--fc-text-secondary)] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Auto Break
                  </Label>
                  <Switch
                    checked={settings.autoStartBreaks}
                    onCheckedChange={(checked) => update({ autoStartBreaks: checked })}
                  />
                </div>
              </div>

              <Separator className="bg-[var(--fc-surface-border)]" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--fc-text-secondary)]">Volume</Label>
                  <span className="text-xs font-mono font-bold text-[var(--fc-text)]">{Math.round(settings.notificationVolume * 100)}%</span>
                </div>
                <Slider
                  value={[settings.notificationVolume]}
                  onValueChange={(val) => update({ notificationVolume: Array.isArray(val) ? val[0] : val as unknown as number })}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-[var(--fc-text-muted)] tracking-wider">Alert Lead Time</Label>
                  <Select
                    value={String(settings.notificationLeadSeconds)}
                    onValueChange={(value) => update({ notificationLeadSeconds: Number(value) })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-[var(--fc-surface)] border-[var(--fc-surface-border)] text-[var(--fc-text)] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Off</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-[var(--fc-text-muted)] tracking-wider">Sound Style</Label>
                  <Select
                    value={settings.notificationSound}
                    onValueChange={(value: any) => update({ notificationSound: value })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-[var(--fc-surface)] border-[var(--fc-surface-border)] text-[var(--fc-text)] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHIME">Chime</SelectItem>
                      <SelectItem value="BELL">Bell</SelectItem>
                      <SelectItem value="SOFT">Soft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 mt-2">
                  <Button 
                    variant="outline" 
                    className="w-full text-xs font-bold border-[var(--fc-surface-border)] hover:bg-[var(--fc-surface-hover)] text-[var(--fc-text)]"
                    onClick={() => previewSound()}
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-2" />
                    Preview Sound
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="settings-group"
          >
            <div className="flex items-center gap-3">
              <img src="./icon.png" alt="Fitsec" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <p className="text-sm font-bold text-[var(--fc-text)]">Fitsec Focus Coach</p>
                <p className="text-[11px] text-[var(--fc-text-muted)]">Version 1.0.0 · Built with focus</p>
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Time Pickers */}
      <TimePickerModal
        isOpen={activePicker === 'work'}
        onClose={() => setActivePicker(null)}
        title="Focus Duration"
        initialSeconds={settings.workDuration}
        onSave={(secs) => update({ workDuration: secs })}
      />
      <TimePickerModal
        isOpen={activePicker === 'short'}
        onClose={() => setActivePicker(null)}
        title="Short Break"
        initialSeconds={settings.shortBreakDuration}
        onSave={(secs) => update({ shortBreakDuration: secs })}
      />
      <TimePickerModal
        isOpen={activePicker === 'long'}
        onClose={() => setActivePicker(null)}
        title="Long Break"
        initialSeconds={settings.longBreakDuration}
        onSave={(secs) => update({ longBreakDuration: secs })}
      />
    </div>
  );
};
