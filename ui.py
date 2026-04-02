import customtkinter as ctk
from timer_logic import TimerLogic
from storage import Storage
from notifications import Notifications
import datetime

class FocusCoachUI(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Focus Coach App")
        self.geometry("600x800")
        
        # Initialize Logic
        self.storage = Storage()
        self.settings = self.storage.load_settings()
        self.timer = TimerLogic(
            work_time=self.settings["work_time"],
            break_time=self.settings["break_time"],
            total_rounds=self.settings["total_rounds"]
        )
        self.notifications = Notifications()
        
        # UI Setup
        self.setup_ui()
        
        # Connect Timer to UI
        self.timer.set_callback(self.update_timer_display)

    def setup_ui(self):
        # Main Container
        self.main_frame = ctk.CTkFrame(self)
        self.main_frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Header
        self.header_label = ctk.CTkLabel(self.main_frame, text="Focus Coach", font=("Arial", 24, "bold"))
        self.header_label.pack(pady=10)

        # Timer Display
        self.timer_label = ctk.CTkLabel(self.main_frame, text="25:00", font=("Arial", 64, "bold"))
        self.timer_label.pack(pady=20)

        self.status_label = ctk.CTkLabel(self.main_frame, text="WORK Phase", font=("Arial", 16))
        self.status_label.pack()

        self.round_label = ctk.CTkLabel(self.main_frame, text="Round 1 of 4", font=("Arial", 14))
        self.round_label.pack(pady=5)

        # Session Inputs
        self.input_frame = ctk.CTkFrame(self.main_frame)
        self.input_frame.pack(fill="x", padx=20, pady=20)

        self.name_entry = ctk.CTkEntry(self.input_frame, placeholder_text="Session Name (e.g. Refactor API)")
        self.name_entry.pack(fill="x", pady=5)

        self.goal_entry = ctk.CTkEntry(self.input_frame, placeholder_text="Session Goal (OKR)")
        self.goal_entry.pack(fill="x", pady=5)

        self.type_option = ctk.CTkOptionMenu(self.input_frame, values=["Dev", "Sales", "Design", "Admin", "Other"])
        self.type_option.pack(fill="x", pady=5)

        # Controls
        self.control_frame = ctk.CTkFrame(self.main_frame)
        self.control_frame.pack(pady=20)

        self.start_btn = ctk.CTkButton(self.control_frame, text="Start", command=self.start_timer)
        self.start_btn.grid(row=0, column=0, padx=5)

        self.pause_btn = ctk.CTkButton(self.control_frame, text="Pause", command=self.pause_timer)
        self.pause_btn.grid(row=0, column=1, padx=5)

        self.reset_btn = ctk.CTkButton(self.control_frame, text="Reset", command=self.reset_timer)
        self.reset_btn.grid(row=0, column=2, padx=5)

        # Reflection Section (Hidden initially)
        self.reflection_frame = ctk.CTkFrame(self.main_frame)
        
        self.refl_label = ctk.CTkLabel(self.reflection_frame, text="Lean Reflection", font=("Arial", 18, "bold"))
        self.refl_label.pack(pady=10)

        self.success_var = ctk.StringVar(value="Yes")
        self.success_menu = ctk.CTkOptionMenu(self.reflection_frame, values=["Yes", "Partial", "No"], variable=self.success_var)
        self.success_menu.pack(pady=5)

        self.helped_entry = ctk.CTkEntry(self.reflection_frame, placeholder_text="What helped?")
        self.helped_entry.pack(fill="x", pady=5)

        self.hindered_entry = ctk.CTkEntry(self.reflection_frame, placeholder_text="What hindered?")
        self.hindered_entry.pack(fill="x", pady=5)

        self.save_btn = ctk.CTkButton(self.reflection_frame, text="Save Session", command=self.save_session)
        self.save_btn.pack(pady=10)

    def start_timer(self):
        if not self.name_entry.get() or not self.goal_entry.get():
            self.status_label.configure(text="Please enter name and goal!", text_color="red")
            return
        self.timer.start()
        self.status_label.configure(text_color="white")

    def pause_timer(self):
        self.timer.pause()

    def reset_timer(self):
        self.timer.reset()
        self.reflection_frame.pack_forget()

    def update_timer_display(self, time_str, mode, round_num):
        self.timer_label.configure(text=time_str)
        self.status_label.configure(text=f"{mode} Phase")
        self.round_label.configure(text=f"Round {round_num} of {self.settings['total_rounds']}")
        
        if mode == "COMPLETE":
            self.notifications.notify("Focus Coach", "Session Complete! Time for reflection.")
            self.show_reflection()

    def show_reflection(self):
        self.reflection_frame.pack(fill="x", padx=20, pady=20)

    def save_session(self):
        session_data = {
            "id": str(datetime.datetime.now().timestamp()),
            "name": self.name_entry.get(),
            "goal": self.goal_entry.get(),
            "type": self.type_option.get(),
            "reflection": {
                "success": self.success_var.get(),
                "helped": self.helped_entry.get(),
                "hindered": self.hindered_entry.get()
            },
            "timestamp": str(datetime.datetime.now())
        }
        self.storage.save_session(session_data)
        self.reset_timer()
        self.status_label.configure(text="Session Saved!", text_color="green")
