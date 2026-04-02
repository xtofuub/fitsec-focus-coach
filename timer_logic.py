"""
Timer Logic — Focus Coach App
State machine for Pomodoro-style work/break cycles.
"""
from enum import Enum
from typing import Optional, Callable


class TimerPhase(Enum):
    IDLE = "idle"
    WORK = "work"
    SHORT_BREAK = "short_break"
    LONG_BREAK = "long_break"


class TimerState(Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"


class TimerLogic:
    def __init__(self):
        # Durations in seconds
        self.work_duration = 25 * 60
        self.short_break_duration = 5 * 60
        self.long_break_duration = 15 * 60
        self.rounds_before_long_break = 4
        self.auto_start_breaks = True
        self.auto_start_work = False

        # State
        self.phase = TimerPhase.IDLE
        self.state = TimerState.STOPPED
        self.current_round = 1
        self.time_remaining = self.work_duration
        self.total_time = self.work_duration
        self.total_work_seconds = 0

        # Callbacks
        self.on_tick: Optional[Callable] = None
        self.on_phase_change: Optional[Callable] = None
        self.on_session_complete: Optional[Callable] = None

    def start(self):
        if self.state == TimerState.STOPPED:
            self.phase = TimerPhase.WORK
            self.time_remaining = self.work_duration
            self.total_time = self.work_duration
            self.current_round = 1
            self.total_work_seconds = 0
            self.state = TimerState.RUNNING
            if self.on_phase_change:
                self.on_phase_change(self.phase)
        elif self.state == TimerState.PAUSED:
            self.state = TimerState.RUNNING

    def pause(self):
        if self.state == TimerState.RUNNING:
            self.state = TimerState.PAUSED

    def reset(self):
        self.state = TimerState.STOPPED
        self.phase = TimerPhase.IDLE
        self.time_remaining = self.work_duration
        self.total_time = self.work_duration
        self.current_round = 1
        self.total_work_seconds = 0

    def skip(self):
        if self.state in (TimerState.RUNNING, TimerState.PAUSED):
            self._advance_phase()

    def tick(self):
        if self.state != TimerState.RUNNING:
            return
        self.time_remaining -= 1
        if self.phase == TimerPhase.WORK:
            self.total_work_seconds += 1
        if self.on_tick:
            self.on_tick()
        if self.time_remaining <= 0:
            self._advance_phase()

    def _advance_phase(self):
        if self.phase == TimerPhase.WORK:
            if self.current_round >= self.rounds_before_long_break:
                self.phase = TimerPhase.LONG_BREAK
                self.time_remaining = self.long_break_duration
                self.total_time = self.long_break_duration
            else:
                self.phase = TimerPhase.SHORT_BREAK
                self.time_remaining = self.short_break_duration
                self.total_time = self.short_break_duration
            if self.on_phase_change:
                self.on_phase_change(self.phase)
            if not self.auto_start_breaks:
                self.state = TimerState.PAUSED

        elif self.phase in (TimerPhase.SHORT_BREAK, TimerPhase.LONG_BREAK):
            if self.phase == TimerPhase.LONG_BREAK:
                self.state = TimerState.STOPPED
                self.phase = TimerPhase.IDLE
                self.time_remaining = self.work_duration
                self.total_time = self.work_duration
                self.current_round = 1
                if self.on_session_complete:
                    self.on_session_complete()
                return
            self.current_round += 1
            self.phase = TimerPhase.WORK
            self.time_remaining = self.work_duration
            self.total_time = self.work_duration
            if self.on_phase_change:
                self.on_phase_change(self.phase)
            if not self.auto_start_work:
                self.state = TimerState.PAUSED

    @property
    def progress(self):
        if self.total_time == 0:
            return 0
        return 1 - (self.time_remaining / self.total_time)

    @property
    def time_display(self):
        m = self.time_remaining // 60
        s = self.time_remaining % 60
        return f"{m:02d}:{s:02d}"

    @property
    def phase_display(self):
        return {
            TimerPhase.IDLE: "READY",
            TimerPhase.WORK: "FOCUS",
            TimerPhase.SHORT_BREAK: "SHORT BREAK",
            TimerPhase.LONG_BREAK: "LONG BREAK",
        }.get(self.phase, "")
