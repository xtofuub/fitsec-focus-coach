/**
 * Focus Coach — Application Logic
 * Timer engine, state management, and UI controller.
 */

// --- Constants & Defaults ---
const PHASES = {
  IDLE: 'READY',
  WORK: 'FOCUS',
  SHORT_BREAK: 'SHORT BREAK',
  LONG_BREAK: 'LONG BREAK'
};

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  roundsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  focusMode: false,
  notificationsEnabled: true,
  soundEnabled: true,
  theme: 'dark',
  accentColor: '#6c63ff'
};

// --- Utilities ---
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const notify = (title, body) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
};

const playAudio = (type) => {
  // Creating simple synths using Web Audio API to avoid external assets
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  if (type === 'work') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'break') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'complete') {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
      g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.2);
    });
  }
};

// --- Timer Engine ---
class Timer {
  constructor(onTick, onPhaseComplete) {
    this.secondsRemaining = 0;
    this.totalSeconds = 0;
    this.timerId = null;
    this.phase = 'IDLE';
    this.round = 1;
    this.onTick = onTick;
    this.onPhaseComplete = onPhaseComplete;
    this.isRunning = false;
  }

  start(seconds, phase, round) {
    this.phase = phase;
    this.round = round;
    if (this.timerId) return;
    
    if (!this.isRunning) {
      this.secondsRemaining = seconds;
      this.totalSeconds = seconds;
    }
    
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.secondsRemaining--;
      this.onTick(this.secondsRemaining, this.totalSeconds);
      if (this.secondsRemaining <= 0) {
        this.stop();
        this.onPhaseComplete(this.phase);
      }
    }, 1000);
  }

  pause() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.isRunning = true; // Still "active", just paused
  }

  stop() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.isRunning = false;
  }

  reset() {
    this.stop();
    this.secondsRemaining = 0;
    this.phase = 'IDLE';
  }
}

// --- Main Application ---
class FocusCoach {
  constructor() {
    this.settings = this.loadSettings();
    this.history = this.loadHistory();
    this.timer = new Timer(this.updateUI.bind(this), this.handlePhaseEnd.bind(this));
    
    this.currentSession = null;
    this.initDOM();
    this.attachEvents();
    this.applySettings();
    this.renderHistory();
    this.renderSummary();
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  loadSettings() {
    const saved = localStorage.getItem('focus_coach_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
  }

  saveSettings() {
    localStorage.setItem('focus_coach_settings', JSON.stringify(this.settings));
    this.applySettings();
  }

  loadHistory() {
    const saved = localStorage.getItem('focus_coach_history');
    return saved ? JSON.parse(saved) : [];
  }

  saveSession(session) {
    this.history.unshift(session);
    localStorage.setItem('focus_coach_history', JSON.stringify(this.history));
    this.renderHistory();
    this.renderSummary();
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
      this.history = [];
      localStorage.setItem('focus_coach_history', JSON.stringify([]));
      this.renderHistory();
      this.renderSummary();
    }
  }

  initDOM() {
    // Nav
    this.tabs = document.querySelectorAll('.nav-tab');
    this.views = document.querySelectorAll('.view');
    
    // Timer Display
    this.display = document.getElementById('timer-display');
    this.phaseLabel = document.getElementById('timer-phase');
    this.roundLabel = document.getElementById('timer-round');
    this.progressRing = document.getElementById('ring-progress');
    
    // Controls
    this.btnStart = document.getElementById('btn-start');
    this.btnPause = document.getElementById('btn-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.btnSkip = document.getElementById('btn-skip');
    
    // Inputs
    this.inputName = document.getElementById('session-name');
    this.inputGoal = document.getElementById('session-goal');
    this.inputType = document.getElementById('session-type');
    this.setupCard = document.getElementById('session-setup');
    
    // Reflection
    this.reflectOverlay = document.getElementById('reflection-overlay');
    this.btnSaveReflect = document.getElementById('btn-save-reflection');
    this.btnSkipReflect = document.getElementById('btn-skip-reflection');
    
    // Settings
    this.setWork = document.getElementById('set-work');
    this.setShort = document.getElementById('set-short-break');
    this.setLong = document.getElementById('set-long-break');
    this.setRounds = document.getElementById('set-rounds');
    this.setAutoBreak = document.getElementById('set-auto-break');
    this.setAutoWork = document.getElementById('set-auto-work');
    this.setFocusMode = document.getElementById('set-focus-mode');
    this.setNotif = document.getElementById('set-notifications');
    this.setSound = document.getElementById('set-sound');
    this.setTheme = document.getElementById('set-theme');
    this.setAccent = document.getElementById('set-accent');
    
    // History
    this.historyList = document.getElementById('session-list');
    this.summaryStats = {
      sessions: document.getElementById('stat-sessions'),
      time: document.getElementById('stat-focus-time'),
      rate: document.getElementById('stat-success-rate')
    };

    // Populate Settings UI
    this.setWork.value = this.settings.workDuration;
    this.setShort.value = this.settings.shortBreakDuration;
    this.setLong.value = this.settings.longBreakDuration;
    this.setRounds.value = this.settings.roundsBeforeLongBreak;
    this.setAutoBreak.checked = this.settings.autoStartBreaks;
    this.setAutoWork.checked = this.settings.autoStartWork;
    this.setFocusMode.checked = this.settings.focusMode;
    this.setNotif.checked = this.settings.notificationsEnabled;
    this.setSound.checked = this.settings.soundEnabled;
    this.setTheme.value = this.settings.theme;
    this.setAccent.value = this.settings.accentColor;
  }

  attachEvents() {
    // Navigation
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchView(tab.dataset.view));
    });

    // Timer Controls
    this.btnStart.addEventListener('click', () => this.startTimer());
    this.btnPause.addEventListener('click', () => this.pauseTimer());
    this.btnReset.addEventListener('click', () => this.resetTimer());
    this.btnSkip.addEventListener('click', () => this.timer.onPhaseComplete(this.timer.phase));

    // Reflection
    this.btnSaveReflect.addEventListener('click', () => this.finishSession(true));
    this.btnSkipReflect.addEventListener('click', () => this.finishSession(false));

    // Settings
    const saveSet = () => {
      this.settings.workDuration = parseInt(this.setWork.value);
      this.settings.shortBreakDuration = parseInt(this.setShort.value);
      this.settings.longBreakDuration = parseInt(this.setLong.value);
      this.settings.roundsBeforeLongBreak = parseInt(this.setRounds.value);
      this.settings.autoStartBreaks = this.setAutoBreak.checked;
      this.settings.autoStartWork = this.setAutoWork.checked;
      this.settings.focusMode = this.setFocusMode.checked;
      this.settings.notificationsEnabled = this.setNotif.checked;
      this.settings.soundEnabled = this.setSound.checked;
      this.settings.theme = this.setTheme.value;
      this.settings.accentColor = this.setAccent.value;
      this.saveSettings();
    };

    [this.setWork, this.setShort, this.setLong, this.setRounds, this.setTheme, this.setAccent].forEach(el => {
      el.addEventListener('change', saveSet);
    });
    [this.setAutoBreak, this.setAutoWork, this.setFocusMode, this.setNotif, this.setSound].forEach(el => {
      el.addEventListener('click', saveSet);
    });

    // Steppers
    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        input.value = Math.max(1, parseInt(input.value) + parseInt(btn.dataset.dir));
        saveSet();
      });
    });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        this.timer.timerId ? this.pauseTimer() : this.startTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        this.resetTimer();
      } else if (e.key === 's' || e.key === 'S') {
        if (this.timer.isRunning) this.timer.onPhaseComplete(this.timer.phase);
      }
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => this.clearHistory());
  }

  applySettings() {
    // Theme
    let actualTheme = this.settings.theme;
    if (actualTheme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Accent Color
    document.documentElement.style.setProperty('--accent', this.settings.accentColor);
    // Darken accent for alt
    const hex = this.settings.accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-alt', `rgb(${r*0.8},${g*0.8},${b*0.8})`);
    
    // Initial display update if idle
    if (!this.timer.isRunning) {
      this.display.innerText = formatTime(this.settings.workDuration * 60);
      this.roundLabel.innerText = `Round 1 / ${this.settings.roundsBeforeLongBreak}`;
    }
  }

  switchView(viewId) {
    this.tabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
    this.views.forEach(v => v.classList.toggle('active', v.id === `view-${viewId}`));
  }

  startTimer() {
    if (this.timer.phase === 'IDLE') {
      // Validate inputs
      if (!this.inputName.value.trim() || !this.inputGoal.value.trim()) {
        alert('Please enter a session name and goal to begin focusing.');
        return;
      }
      
      this.currentSession = {
        name: this.inputName.value,
        goal: this.inputGoal.value,
        type: this.inputType.value,
        startTime: new Date().toISOString(),
        rounds: 0,
        totalFocusTime: 0
      };
      
      this.setupCard.style.display = 'none';
      if (this.settings.focusMode) document.body.classList.add('focus-mode-active');
      
      this.timer.start(this.settings.workDuration * 60, 'WORK', 1);
    } else {
      // Resuming
      const duration = this.timer.phase === 'WORK' ? this.settings.workDuration : 
                      (this.timer.phase === 'SHORT_BREAK' ? this.settings.shortBreakDuration : this.settings.longBreakDuration);
      this.timer.start(duration * 60, this.timer.phase, this.timer.round);
    }
    
    this.btnStart.style.display = 'none';
    this.btnPause.style.display = 'flex';
    if (this.settings.soundEnabled) playAudio('work');
  }

  pauseTimer() {
    this.timer.pause();
    this.btnStart.style.display = 'flex';
    this.btnPause.style.display = 'none';
  }

  resetTimer() {
    if (confirm('Reset timer and cancel current session?')) {
      this.timer.reset();
      this.setupCard.style.display = 'block';
      this.btnStart.style.display = 'flex';
      this.btnPause.style.display = 'none';
      this.updateUI(this.settings.workDuration * 60, this.settings.workDuration * 60);
      this.phaseLabel.innerText = 'READY';
      this.roundLabel.innerText = `Round 1 / ${this.settings.roundsBeforeLongBreak}`;
      this.currentSession = null;
      document.body.classList.remove('focus-mode-active');
    }
  }

  handlePhaseEnd(finishedPhase) {
    if (this.settings.soundEnabled) playAudio(finishedPhase === 'WORK' ? 'break' : 'work');
    
    if (finishedPhase === 'WORK') {
      this.currentSession.rounds++;
      this.currentSession.totalFocusTime += this.settings.workDuration;
      
      if (this.timer.round >= this.settings.roundsBeforeLongBreak) {
        // Time for long break or completion?
        // Usually Pomodoro finishes after the long break, but we'll show reflection after rounds are done
        this.startPhase('LONG_BREAK');
      } else {
        this.startPhase('SHORT_BREAK');
      }
      
      if (this.settings.notificationsEnabled) {
        notify('Focus Round Complete!', 'Time for a well-deserved break.');
      }
      
    } else {
      // Break over
      if (finishedPhase === 'LONG_BREAK') {
        this.showReflection();
      } else {
        this.timer.round++;
        this.startPhase('WORK');
      }
      
      if (this.settings.notificationsEnabled) {
        notify('Break Over!', 'Ready to focus again?');
      }
    }
  }

  startPhase(phase) {
    const duration = phase === 'WORK' ? this.settings.workDuration : 
                    (phase === 'SHORT_BREAK' ? this.settings.shortBreakDuration : this.settings.longBreakDuration);
    
    this.timer.stop();
    this.timer.phase = phase;
    
    const auto = (phase === 'WORK') ? this.settings.autoStartWork : this.settings.autoStartBreaks;
    
    if (auto) {
      this.timer.start(duration * 60, phase, this.timer.round);
    } else {
      this.timer.secondsRemaining = duration * 60;
      this.timer.totalSeconds = duration * 60;
      this.updateUI(this.timer.secondsRemaining, this.timer.totalSeconds);
      this.btnStart.style.display = 'flex';
      this.btnPause.style.display = 'none';
    }
  }

  updateUI(remaining, total) {
    this.display.innerText = formatTime(remaining);
    this.phaseLabel.innerText = PHASES[this.timer.phase];
    this.roundLabel.innerText = `Round ${this.timer.round} / ${this.settings.roundsBeforeLongBreak}`;
    
    // Progress Ring
    const offset = 754 - (754 * (remaining / total));
    this.progressRing.style.strokeDashoffset = offset;
    
    // Switch color based on phase
    const colors = {
      WORK: this.settings.accentColor,
      SHORT_BREAK: '#10b981',
      LONG_BREAK: '#3b82f6',
      IDLE: this.settings.accentColor
    };
    this.progressRing.style.stroke = colors[this.timer.phase];
    this.phaseLabel.style.color = colors[this.timer.phase];
  }

  showReflection() {
    this.timer.stop();
    if (this.settings.soundEnabled) playAudio('complete');
    this.reflectOverlay.classList.remove('hidden');
  }

  finishSession(didSave) {
    if (didSave) {
      const result = document.querySelector('input[name="result"]:checked').value;
      const helped = document.getElementById('refl-helped').value;
      const blocked = document.getElementById('refl-blocked').value;
      
      this.currentSession.reflection = { result, helped, blocked };
      this.currentSession.endTime = new Date().toISOString();
      this.saveSession(this.currentSession);
    }
    
    this.reflectOverlay.classList.add('hidden');
    this.timer.reset();
    this.setupCard.style.display = 'block';
    this.btnStart.style.display = 'flex';
    this.btnPause.style.display = 'none';
    this.updateUI(this.settings.workDuration * 60, this.settings.workDuration * 60);
    this.phaseLabel.innerText = 'READY';
    this.currentSession = null;
    document.body.classList.remove('focus-mode-active');
    
    // Reset inputs
    this.inputName.value = '';
    this.inputGoal.value = '';
    document.getElementById('refl-helped').value = '';
    document.getElementById('refl-blocked').value = '';
  }

  renderHistory() {
    if (this.history.length === 0) {
      this.historyList.innerHTML = '<p class="empty-state">No sessions recorded yet. Start your first focus session!</p>';
      return;
    }

    this.historyList.innerHTML = this.history.map(s => `
      <div class="session-item">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700;">${s.name}</span>
          <span class="subtle-text" style="font-size: 0.75rem;">${new Date(s.startTime).toLocaleDateString()}</span>
        </div>
        <div style="font-size: 0.875rem; color: var(--text-dim); margin-bottom: 8px;">
          Goal: ${s.goal}
        </div>
        <div style="display: flex; gap: 12px; font-size: 0.75rem; font-weight: 600;">
          <span style="color: var(--accent);">${s.type}</span>
          <span>${s.totalFocusTime}m Focus</span>
          <span style="color: ${s.reflection?.result === 'yes' ? 'var(--success)' : (s.reflection?.result === 'partial' ? 'var(--warning)' : 'var(--danger)')}">
            ${s.reflection?.result.toUpperCase() || 'SKIPPED'}
          </span>
        </div>
      </div>
    `).join('');
  }

  renderSummary() {
    const today = new Date().toLocaleDateString();
    const todaySessions = this.history.filter(s => new Date(s.startTime).toLocaleDateString() === today);
    
    const count = todaySessions.length;
    const time = todaySessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
    const successCount = todaySessions.filter(s => s.reflection?.result === 'yes').length;
    const rate = count > 0 ? Math.round((successCount / count) * 100) : 0;
    
    this.summaryStats.sessions.innerText = count;
    this.summaryStats.time.innerText = `${time}m`;
    this.summaryStats.rate.innerText = count > 0 ? `${rate}%` : '—';
  }
}

// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FocusCoach();
});
