"""
Storage — Focus Coach App
JSON persistence for settings and session history.
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Any

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

DEFAULT_SETTINGS = {
    "work_duration": 25,
    "short_break_duration": 5,
    "long_break_duration": 15,
    "rounds": 4,
    "notifications_enabled": True,
    "sound_enabled": True,
    "theme": "dark",
    "accent_color": "#6C63FF",
    "auto_start_breaks": True,
    "auto_start_work": False,
    "always_on_top": False,
    "focus_mode": False,
    "font_size": "medium",
    "keyboard_shortcuts": True,
    "session_types": [
        "Development", "Design", "Sales", "Meeting",
        "Planning", "Research", "Writing", "Other"
    ],
}


def _ensure():
    os.makedirs(DATA_DIR, exist_ok=True)


def load_settings() -> Dict[str, Any]:
    _ensure()
    fp = os.path.join(DATA_DIR, "settings.json")
    if os.path.exists(fp):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                return {**DEFAULT_SETTINGS, **json.load(f)}
        except Exception:
            pass
    return DEFAULT_SETTINGS.copy()


def save_settings(settings: Dict[str, Any]):
    _ensure()
    with open(os.path.join(DATA_DIR, "settings.json"), "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)


def load_sessions() -> List[Dict[str, Any]]:
    _ensure()
    fp = os.path.join(DATA_DIR, "sessions.json")
    if os.path.exists(fp):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def save_session(session: Dict[str, Any]):
    sessions = load_sessions()
    session["timestamp"] = datetime.now().isoformat()
    session["date"] = datetime.now().strftime("%Y-%m-%d")
    sessions.append(session)
    _ensure()
    with open(os.path.join(DATA_DIR, "sessions.json"), "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=2, ensure_ascii=False)


def clear_sessions():
    _ensure()
    with open(os.path.join(DATA_DIR, "sessions.json"), "w", encoding="utf-8") as f:
        json.dump([], f)


def get_today_summary() -> Dict[str, Any]:
    sessions = load_sessions()
    today = datetime.now().strftime("%Y-%m-%d")
    today_sessions = [s for s in sessions if s.get("date") == today]
    total_focus = sum(s.get("work_minutes", 0) for s in today_sessions)
    breakdown: Dict[str, Dict[str, int]] = {}
    for s in today_sessions:
        t = s.get("session_type", "Other")
        breakdown.setdefault(t, {"count": 0, "time": 0})
        breakdown[t]["count"] += 1
        breakdown[t]["time"] += s.get("work_minutes", 0)
    results = [s.get("reflection_result", "") for s in today_sessions if s.get("reflection_result")]
    return {
        "total_sessions": len(today_sessions),
        "total_focus_minutes": total_focus,
        "type_breakdown": breakdown,
        "reflection_results": results,
    }
