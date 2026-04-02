"""
Notifications — Focus Coach App
Sound effects and system notifications.
"""
import sys
import threading


def play_sound(sound_type: str = "phase_change"):
    """Play a notification sound in a background thread."""
    try:
        if sys.platform == "win32":
            import winsound

            def _play():
                try:
                    if sound_type == "work_start":
                        winsound.Beep(600, 150)
                        winsound.Beep(800, 200)
                    elif sound_type == "break_start":
                        winsound.Beep(800, 200)
                        winsound.Beep(600, 300)
                    elif sound_type == "session_complete":
                        for freq in (523, 659, 784, 1047):
                            winsound.Beep(freq, 180)
                    else:
                        winsound.MessageBeep()
                except Exception:
                    pass

            threading.Thread(target=_play, daemon=True).start()
        else:
            print("\a")
    except Exception:
        pass
